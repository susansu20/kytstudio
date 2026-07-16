import { dayOfWeek } from './time'
import type { RuntimeSettings } from './settings'

/** Weekend or Singapore public holiday → the higher rate applies. */
export function isPeakDay(date: string, settings: RuntimeSettings): boolean {
  const dow = dayOfWeek(date)
  return dow === 0 || dow === 6 || settings.publicHolidays.includes(date)
}

export function rateFor(date: string, settings: RuntimeSettings): number {
  return isPeakDay(date, settings) ? settings.weekendRate : settings.weekdayRate
}

export function rateLabel(date: string, settings: RuntimeSettings): string {
  return isPeakDay(date, settings) ? 'weekend & public holiday rate' : 'weekday rate'
}

export function totalFor(date: string, durationHours: number, settings: RuntimeSettings): number {
  return rateFor(date, settings) * durationHours
}
