import { NextRequest, NextResponse } from 'next/server'
import { bookingConfig } from '@/lib/booking.config'
import { sendAfterHoursEnquiry } from '@/lib/emails'
import { rateLimit } from '@/lib/redis'
import { afterHoursRequestSchema } from '@/lib/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** POST /api/after-hours — emails the owner. No calendar write, not a confirmation. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!(await rateLimit(`afterhours:${ip}`, bookingConfig.rateLimitPerMinute))) {
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

  const parsed = afterHoursRequestSchema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json(
      { error: issue?.message ?? 'Invalid details', field: issue?.path?.at(-1) },
      { status: 400 }
    )
  }

  try {
    const values = Object.fromEntries(
      Object.entries(parsed.data.fields).map(([k, v]) => [k, String(v ?? '')])
    )
    await sendAfterHoursEnquiry(values)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[kyt] after-hours enquiry error:', err)
    return NextResponse.json(
      { error: 'Could not send your enquiry — please email us directly at contact@kytstudio.net.' },
      { status: 500 }
    )
  }
}
