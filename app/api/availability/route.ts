import { NextRequest, NextResponse } from 'next/server'
import { bookingConfig } from '@/lib/booking.config'
import { getDaySlots, getMonthAvailability } from '@/lib/availability'
import { getSettings } from '@/lib/settings'
import { rateFor } from '@/lib/pricing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/availability?month=YYYY-MM&duration=N → day statuses for the calendar grid
 * GET /api/availability?date=YYYY-MM-DD&duration=N → valid start slots for a day
 * FreeBusy results are cached server-side (~60s) and invalidated on booking.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const month = params.get('month')
  const date = params.get('date')
  const duration = Math.min(
    Math.max(parseInt(params.get('duration') ?? '1', 10) || 1, bookingConfig.minDurationHours),
    Math.max(...bookingConfig.durations)
  )

  try {
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [settings, days] = await Promise.all([getSettings(), getMonthAvailability(month, duration)])
      return NextResponse.json(
        {
          month,
          duration,
          days,
          // Runtime rates + holiday list so the client can price any date live
          rates: { weekday: settings.weekdayRate, weekendAndHoliday: settings.weekendRate },
          publicHolidays: settings.publicHolidays,
        },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [settings, slots] = await Promise.all([getSettings(), getDaySlots(date, duration)])
      return NextResponse.json(
        { date, duration, rate: rateFor(date, settings), slots },
        { headers: { 'Cache-Control': 'no-store' } }
      )
    }

    return NextResponse.json({ error: 'Pass ?month=YYYY-MM or ?date=YYYY-MM-DD' }, { status: 400 })
  } catch (err) {
    console.error('[kyt] availability error:', err)
    return NextResponse.json(
      { error: 'Could not load availability. Please try again.' },
      { status: 502 }
    )
  }
}
