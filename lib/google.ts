import 'server-only'
import { createSign } from 'crypto'

/**
 * Google Calendar via a service account — server-side only, no client library.
 * Auth: self-signed JWT exchanged for an access token (cached until expiry).
 *
 * DEMO MODE: if the GOOGLE_* env vars are missing, deterministic fake busy
 * blocks are returned and event creation is simulated, so the whole flow can
 * be previewed without credentials.
 */

const SCOPE = 'https://www.googleapis.com/auth/calendar'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://www.googleapis.com/calendar/v3'

export interface BusyInterval {
  start: number // epoch ms
  end: number // epoch ms
}

export interface CalendarEventInput {
  summary: string
  description: string
  start: Date
  end: Date
  attendeeEmail?: string
  location?: string
}

function creds() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!email || !key || !calendarId) return null
  return { email, key, calendarId }
}

export const googleConfigured = () => creds() !== null

const b64url = (input: string | Buffer) =>
  Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

let tokenCache: { token: string; expiresAt: number } | null = null

async function accessToken(): Promise<string> {
  const c = creds()
  if (!c) throw new Error('Google credentials not configured')
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token

  const iat = Math.floor(Date.now() / 1000)
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claims = b64url(
    JSON.stringify({ iss: c.email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 })
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claims}`)
  const signature = b64url(signer.sign(c.key))
  const assertion = `${header}.${claims}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { access_token: string; expires_in: number }
  tokenCache = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return data.access_token
}

/**
 * FreeBusy across [timeMin, timeMax). Any event on the calendar — created by
 * this system or added by the owner by hand — blocks availability.
 */
export async function getBusyIntervals(timeMin: Date, timeMax: Date): Promise<BusyInterval[]> {
  const c = creds()
  if (!c) return demoBusy(timeMin, timeMax)

  const token = await accessToken()
  const res = await fetch(`${API}/freeBusy`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: 'Asia/Singapore',
      items: [{ id: c.calendarId }],
    }),
  })
  if (!res.ok) throw new Error(`FreeBusy failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as {
    calendars: Record<string, { busy?: { start: string; end: string }[]; errors?: unknown[] }>
  }
  const cal = data.calendars[c.calendarId]
  if (cal?.errors?.length) {
    throw new Error(
      `FreeBusy returned errors for ${c.calendarId} — is the calendar shared with the service account? ${JSON.stringify(cal.errors)}`
    )
  }
  return (cal?.busy ?? []).map((b) => ({
    start: new Date(b.start).getTime(),
    end: new Date(b.end).getTime(),
  }))
}

/**
 * Create the booking event. Note: plain service accounts cannot invite
 * attendees (Google requires Domain-Wide Delegation for that), so if the
 * attendee is rejected we retry without — the customer still gets the .ics
 * file and an add-to-Google link by email.
 */
export async function createCalendarEvent(
  input: CalendarEventInput
): Promise<{ id: string; htmlLink?: string }> {
  const c = creds()
  if (!c) {
    console.warn('[kyt] DEMO MODE — calendar event not actually created:', input.summary)
    return { id: `demo-${Date.now().toString(36)}` }
  }

  const token = await accessToken()
  const body = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    start: { dateTime: input.start.toISOString(), timeZone: 'Asia/Singapore' },
    end: { dateTime: input.end.toISOString(), timeZone: 'Asia/Singapore' },
    ...(input.attendeeEmail ? { attendees: [{ email: input.attendeeEmail }] } : {}),
  }

  const insert = (payload: object, sendUpdates: string) =>
    fetch(
      `${API}/calendars/${encodeURIComponent(c.calendarId)}/events?sendUpdates=${sendUpdates}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    )

  let res = await insert(body, 'all')
  if (!res.ok && input.attendeeEmail) {
    // Retry without the attendee (service accounts w/o domain-wide delegation)
    const { attendees: _attendees, ...withoutAttendee } = body as Record<string, unknown>
    res = await insert(withoutAttendee, 'none')
  }
  if (!res.ok) throw new Error(`Event creation failed: ${res.status} ${await res.text()}`)
  const data = (await res.json()) as { id: string; htmlLink?: string }
  return data
}

/**
 * Deterministic fake busy blocks for demo mode: a 12–2pm block every 3rd day,
 * a 5–8pm block every 4th day. Stable across reloads so the UI is testable.
 */
function demoBusy(timeMin: Date, timeMax: Date): BusyInterval[] {
  const out: BusyInterval[] = []
  const day = 24 * 3600 * 1000
  // iterate SGT-midnights covering the window
  let t = Math.floor((timeMin.getTime() + 8 * 3600 * 1000) / day) * day - 8 * 3600 * 1000
  for (; t < timeMax.getTime(); t += day) {
    const dayIndex = Math.floor((t + 8 * 3600 * 1000) / day)
    if (dayIndex % 3 === 0) out.push({ start: t + 12 * 3600 * 1000, end: t + 14 * 3600 * 1000 })
    if (dayIndex % 4 === 0) out.push({ start: t + 17 * 3600 * 1000, end: t + 20 * 3600 * 1000 })
    if (dayIndex % 9 === 0) out.push({ start: t + 10 * 3600 * 1000, end: t + 22 * 3600 * 1000 })
  }
  return out.filter((b) => b.end > timeMin.getTime() && b.start < timeMax.getTime())
}
