import { z } from 'zod'
import { bookingConfig, type BlockedRange } from './booking.config'
import { kv } from './redis'

/**
 * Runtime settings = booking.config.ts defaults, overridable live from
 * /admin/settings (stored as a single JSON blob in Redis).
 */

export const settingsSchema = z.object({
  openHour: z.number().int().min(0).max(23),
  closeHour: z.number().int().min(1).max(24),
  bufferMinutes: z.number().int().min(0).max(120),
  minNoticeHours: z.number().int().min(0).max(168),
  maxAdvanceDays: z.number().int().min(1).max(365),
  weekdayRate: z.number().min(0),
  weekendRate: z.number().min(0),
  publicHolidays: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  blockedRanges: z.array(
    z.object({
      from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().max(200).optional(),
    })
  ),
})

export type RuntimeSettings = z.infer<typeof settingsSchema>

const SETTINGS_KEY = 'kyt:settings'

export const defaultSettings: RuntimeSettings = {
  openHour: bookingConfig.operatingHours.openHour,
  closeHour: bookingConfig.operatingHours.closeHour,
  bufferMinutes: bookingConfig.bufferMinutes,
  minNoticeHours: bookingConfig.minNoticeHours,
  maxAdvanceDays: bookingConfig.maxAdvanceDays,
  weekdayRate: bookingConfig.rates.weekday,
  weekendRate: bookingConfig.rates.weekendAndHoliday,
  publicHolidays: [...bookingConfig.publicHolidays],
  blockedRanges: [...bookingConfig.blockedRanges] as BlockedRange[],
}

export async function getSettings(): Promise<RuntimeSettings> {
  try {
    const stored = await kv.get<Partial<RuntimeSettings>>(SETTINGS_KEY)
    if (!stored) return defaultSettings
    const merged = { ...defaultSettings, ...stored }
    const parsed = settingsSchema.safeParse(merged)
    return parsed.success ? parsed.data : defaultSettings
  } catch {
    return defaultSettings
  }
}

export async function saveSettings(patch: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
  const current = await getSettings()
  const next = settingsSchema.parse({ ...current, ...patch })
  await kv.set(SETTINGS_KEY, next)
  return next
}
