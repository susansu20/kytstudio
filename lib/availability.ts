import 'server-only'
import { bookingConfig } from './booking.config'
import { getBusyIntervals, type BusyInterval } from './google'
import { kv } from './redis'
import { getSettings, type RuntimeSettings } from './settings'
import { addDays, datesInMonth, sgt, todaySgt } from './time'

export type DayStatus = 'available' | 'full' | 'blocked' | 'closed'

export interface Slot {
  startHour: number
  endHour: number
}

/* ── FreeBusy caching ───────────────────────────────────────────────────────
 * Cached ~60s in Redis; a version counter is bumped on every confirmed
 * booking so fresh bookings invalidate the cache immediately.
 */

const VERSION_KEY = 'kyt:av:version'

async function cacheVersion(): Promise<number> {
  return (await kv.get<number>(VERSION_KEY)) ?? 0
}

export async function bumpAvailabilityVersion(): Promise<void> {
  await kv.incr(VERSION_KEY)
}

async function cachedBusy(timeMin: Date, timeMax: Date): Promise<BusyInterval[]> {
  const version = await cacheVersion()
  const key = `kyt:av:fb:${version}:${timeMin.getTime()}:${timeMax.getTime()}`
  const cached = await kv.get<BusyInterval[]>(key)
  if (cached) return cached
  const busy = await getBusyIntervals(timeMin, timeMax)
  await kv.set(key, busy, { ex: bookingConfig.availabilityCacheSeconds })
  return busy
}

/* ── Slot computation ─────────────────────────────────────────────────────── */

function isBlocked(date: string, settings: RuntimeSettings): boolean {
  return settings.blockedRanges.some((r) => date >= r.from && date <= r.to)
}

/**
 * Valid start hours for `date` at `durationHours`, given the busy list.
 * The configured turnover buffer is enforced on BOTH sides: a candidate
 * conflicts if it starts less than `buffer` after an existing event ends,
 * or ends less than `buffer` before one starts.
 */
function computeSlots(
  date: string,
  durationHours: number,
  busy: BusyInterval[],
  settings: RuntimeSettings,
  now: number
): Slot[] {
  if (isBlocked(date, settings)) return []
  const buffer = settings.bufferMinutes * 60_000
  const earliestStart = now + settings.minNoticeHours * 3_600_000
  const slots: Slot[] = []

  for (let h = settings.openHour; h + durationHours <= settings.closeHour; h++) {
    const start = sgt(date, h).getTime()
    const end = start + durationHours * 3_600_000
    if (start < earliestStart) continue
    const conflict = busy.some((b) => start < b.end + buffer && end + buffer > b.start)
    if (!conflict) slots.push({ startHour: h, endHour: h + durationHours })
  }
  return slots
}

function dayWindow(date: string, settings: RuntimeSettings) {
  return { min: sgt(date, settings.openHour), max: sgt(date, settings.closeHour) }
}

/** Live slot list for one day (used by Step 2 and re-checked in the booking API). */
export async function getDaySlots(date: string, durationHours: number): Promise<Slot[]> {
  const settings = await getSettings()
  const { min, max } = dayWindow(date, settings)
  const busy = await cachedBusy(min, max)
  return computeSlots(date, durationHours, busy, settings, Date.now())
}

/** Uncached re-verification of a single slot, run inside the booking route. */
export async function isSlotStillFree(
  date: string,
  startHour: number,
  durationHours: number
): Promise<boolean> {
  const settings = await getSettings()
  const { min, max } = dayWindow(date, settings)
  const busy = await getBusyIntervals(min, max) // straight to Google, no cache
  return computeSlots(date, durationHours, busy, settings, Date.now()).some(
    (s) => s.startHour === startHour
  )
}

/**
 * Whole-month day statuses for the calendar grid — one FreeBusy call for the
 * full month, then per-day slot checks locally.
 */
export async function getMonthAvailability(
  month: string,
  durationHours: number
): Promise<Record<string, DayStatus>> {
  const settings = await getSettings()
  const dates = datesInMonth(month)
  const today = todaySgt()
  const lastBookable = addDays(today, settings.maxAdvanceDays)
  const now = Date.now()

  const monthStart = sgt(dates[0], 0)
  const monthEnd = sgt(addDays(dates[dates.length - 1], 1), 0)
  const inRange = dates.some((d) => d >= today && d <= lastBookable)
  const busy = inRange ? await cachedBusy(monthStart, monthEnd) : []

  const out: Record<string, DayStatus> = {}
  for (const date of dates) {
    if (date < today || date > lastBookable) {
      out[date] = 'closed'
    } else if (isBlocked(date, settings)) {
      out[date] = 'blocked'
    } else {
      const dayBusy = busy.filter(
        (b) => b.end > sgt(date, 0).getTime() && b.start < sgt(addDays(date, 1), 0).getTime()
      )
      out[date] =
        computeSlots(date, durationHours, dayBusy, settings, now).length > 0 ? 'available' : 'full'
    }
  }
  return out
}
