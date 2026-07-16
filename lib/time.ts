/**
 * Time helpers pinned to Asia/Singapore (UTC+8, no DST).
 * Calendar dates are passed around as 'YYYY-MM-DD' strings; instants as Date.
 */

export const TIMEZONE = 'Asia/Singapore'
const SGT_OFFSET = '+08:00'

const pad = (n: number) => String(n).padStart(2, '0')

/** Instant for a given SGT calendar date + wall-clock time. */
export function sgt(date: string, hour = 0, minute = 0): Date {
  return new Date(`${date}T${pad(hour)}:${pad(minute)}:00${SGT_OFFSET}`)
}

/** 'YYYY-MM-DD' in SGT for an instant. */
export function toSgtDateString(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d)
}

export function todaySgt(): string {
  return toSgtDateString(new Date())
}

/** 0 = Sunday … 6 = Saturday for a calendar date (timezone-independent). */
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** All 'YYYY-MM-DD' dates in a 'YYYY-MM' month. */
export function datesInMonth(month: string): string[] {
  const [y, m] = month.split('-').map(Number)
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: count }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`)
}

/** 'YYYY-MM' month arithmetic. */
export function addMonths(month: string, n: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + n, 1))
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`
}

export function monthOf(date: string): string {
  return date.slice(0, 7)
}

/** '2:00pm' for an SGT wall-clock hour. */
export function formatHour(hour: number, minute = 0): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  const ampm = hour < 12 ? 'am' : 'pm'
  return minute === 0 ? `${h12}${ampm}` : `${h12}:${pad(minute)}${ampm}`
}

/** 'Saturday, 15 August 2026' */
export function formatLongDate(date: string): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'UTC', // date string parsed as UTC midnight; we only want the calendar date
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00Z`))
}

/** 'Sat 15 Aug' */
export function formatShortDate(date: string): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${date}T00:00:00Z`))
}

/** 'August 2026' for a 'YYYY-MM' month. */
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat('en-SG', {
    timeZone: 'UTC',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${month}-01T00:00:00Z`))
}

/** Compact UTC stamp for .ics / Google Calendar URLs: 'YYYYMMDDTHHMMSSZ'. */
export function toUtcStamp(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}
