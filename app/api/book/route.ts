import { NextRequest, NextResponse } from 'next/server'
import { bookingConfig } from '@/lib/booking.config'
import { bumpAvailabilityVersion, isSlotStillFree } from '@/lib/availability'
import { sendCustomerConfirmation, sendOwnerNotification, type BookingSummary } from '@/lib/emails'
import { createCalendarEvent } from '@/lib/google'
import { buildIcs, googleCalendarUrl } from '@/lib/ics'
import { rateFor, totalFor } from '@/lib/pricing'
import { acquireLock, kv, rateLimit } from '@/lib/redis'
import { getSettings } from '@/lib/settings'
import { formatHour, formatLongDate, sgt } from '@/lib/time'
import { bookingRequestSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function newRef(): string {
  const stamp = Date.now().toString(36).slice(-4)
  const rand = Math.random().toString(36).slice(2, 6)
  return `KYT-${(stamp + rand).toUpperCase().slice(0, 8)}`
}

function clientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

/**
 * POST /api/book — validate → rate-limit → lock the slot → re-verify against
 * Google live → create the calendar event → emails → respond with .ics.
 */
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`book:${clientIp(req)}`, bookingConfig.rateLimitPerMinute))) {
    return NextResponse.json(
      { error: 'Too many requests — give it a minute and try again.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = bookingRequestSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid booking details', field: issue?.path?.at(-1) },
      { status: 400 }
    )
  }

  const { date, startHour, duration } = parsed.data
  const fields = Object.fromEntries(
    Object.entries(parsed.data.fields).map(([k, v]) => [k, String(v ?? '')])
  )
  const settings = await getSettings()

  // Server-authoritative window checks (client hints are never trusted)
  if (startHour < settings.openHour || startHour + duration > settings.closeHour) {
    return NextResponse.json(
      { error: `Bookings run ${formatHour(settings.openHour)}–${formatHour(settings.closeHour)}. For after-hours, use the enquiry form.` },
      { status: 400 }
    )
  }

  // Lock this slot while we verify + write, so two customers can't race
  const release = await acquireLock(`slot:${date}:${startHour}:${duration}`, 60)
  if (!release) {
    return NextResponse.json(
      { error: 'Someone else is booking this slot right now — pick another or retry shortly.', code: 'SLOT_CONTENDED' },
      { status: 409 }
    )
  }

  try {
    // Live FreeBusy re-check (no cache) — the calendar is the source of truth
    if (!(await isSlotStillFree(date, startHour, duration))) {
      return NextResponse.json(
        { error: 'That slot was just taken. Here’s an updated list of times.', code: 'SLOT_TAKEN' },
        { status: 409 }
      )
    }

    const ref = newRef()
    const rate = rateFor(date, settings)
    const total = totalFor(date, duration, settings)
    const start = sgt(date, startHour)
    const end = sgt(date, startHour + duration)

    const roleOf = (role: string) =>
      bookingConfig.fields.find((f) => f.role === role)?.key ?? role
    const name = fields[roleOf('name')] ?? 'Unknown'
    const email = fields[roleOf('email')] ?? ''
    const shootType = fields[roleOf('shootType')] ?? 'Shoot'
    const isFirstTimer = (fields[roleOf('firstTime')] ?? '') === 'Yes'

    const summary: BookingSummary = {
      ref, date, startHour, endHour: startHour + duration, duration, rate, total, fields, isFirstTimer,
    }

    // Calendar event — title + full details in the description
    const answerLines = bookingConfig.fields
      .filter((f) => f.type !== 'consent' && (fields[f.key] ?? '') !== '')
      .map((f) => `${f.label}: ${fields[f.key]}`)
      .join('\n')
    const eventTitle = `${isFirstTimer ? '[FIRST-TIMER] ' : ''}[BOOKED] ${name} - ${shootType} (${duration}hr)`
    const eventDescription = [
      `Booking reference: ${ref}`,
      `Total: $${total} ($${rate}/hr × ${duration}hr) — invoice via PayNow`,
      '',
      answerLines,
      '',
      isFirstTimer ? 'FIRST-TIMER — arrive 15 min early for orientation.' : 'Returning renter — send access code.',
      'Booked via the website.',
    ].join('\n')

    await createCalendarEvent({
      summary: eventTitle,
      description: eventDescription,
      start,
      end,
      attendeeEmail: email || undefined,
      location: `${bookingConfig.business.address.street}, ${bookingConfig.business.address.building}, ${bookingConfig.business.address.postalCode}`,
    })

    // Fresh bookings must show up in availability immediately
    await bumpAvailabilityVersion()

    // Keep a lightweight record for reference (90 days)
    await kv.set(`kyt:booking:${ref}`, summary, { ex: 90 * 24 * 3600 })

    // Emails are best-effort: the booking already exists on the calendar
    const icsSummary = `Studio booking — The Kyt Studio (${ref})`
    const icsDescription = `${shootType}, ${duration}hr. Ref ${ref}. Total $${total} via PayNow invoice.\n${bookingConfig.business.address.buildingNote}`
    const ics = buildIcs({ ref, summary: icsSummary, description: icsDescription, start, end })
    try {
      await Promise.all([
        sendCustomerConfirmation(summary, Buffer.from(ics).toString('base64')),
        sendOwnerNotification(summary),
      ])
    } catch (err) {
      console.error('[kyt] email send failed (booking still confirmed):', err)
    }

    return NextResponse.json({
      ok: true,
      ref,
      date,
      startHour,
      duration,
      rate,
      total,
      dateLabel: formatLongDate(date),
      timeLabel: `${formatHour(startHour)}–${formatHour(startHour + duration)}`,
      ics,
      googleCalendarUrl: googleCalendarUrl({
        ref,
        summary: icsSummary,
        description: icsDescription,
        start,
        end,
      }),
    })
  } catch (err) {
    console.error('[kyt] booking error:', err)
    return NextResponse.json(
      { error: 'Something went wrong on our side — nothing was booked. Please try again.' },
      { status: 500 }
    )
  } finally {
    await release()
  }
}
