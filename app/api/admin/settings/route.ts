import { createHash, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { bumpAvailabilityVersion } from '@/lib/availability'
import { rateLimit } from '@/lib/redis'
import { getSettings, saveSettings, settingsSchema } from '@/lib/settings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET/PUT /api/admin/settings — guarded by the ADMIN_PASSWORD env var,
 * supplied in the x-admin-password header. Compared timing-safe via digests.
 */
function authorized(req: NextRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    // Locked shut unless a password is configured — never open by default
    return false
  }
  const given = req.headers.get('x-admin-password') ?? ''
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

async function guard(req: NextRequest): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!(await rateLimit(`admin:${ip}`, 10))) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }
  if (!authorized(req)) {
    const hint = process.env.ADMIN_PASSWORD
      ? 'Wrong password.'
      : 'ADMIN_PASSWORD is not set on the server — configure it to use this page.'
    return NextResponse.json({ error: hint }, { status: 401 })
  }
  return null
}

export async function GET(req: NextRequest) {
  const denied = await guard(req)
  if (denied) return denied
  return NextResponse.json(await getSettings())
}

export async function PUT(req: NextRequest) {
  const denied = await guard(req)
  if (denied) return denied

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = settingsSchema.partial().safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid settings' },
      { status: 400 }
    )
  }

  const saved = await saveSettings(parsed.data)
  await bumpAvailabilityVersion() // settings affect availability immediately
  return NextResponse.json(saved)
}
