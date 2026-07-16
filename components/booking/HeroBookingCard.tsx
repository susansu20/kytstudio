'use client'

import { useEffect, useState } from 'react'
import { bookingConfig } from '@/lib/booking.config'
import { monthOf, todaySgt } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Calendar, type DayStatus } from './Calendar'

/**
 * Compact availability card embedded in the hero. Picking a date hands the
 * selection to the main BookingWidget (via a `kyt:prefill` event) and scrolls
 * to it — the hero is the first step of the same flow, not a second system.
 */
export function HeroBookingCard() {
  const [duration, setDuration] = useState(2)
  const [month, setMonth] = useState(monthOf(todaySgt()))
  const [cache, setCache] = useState<Record<string, Record<string, DayStatus>>>({})
  const [loading, setLoading] = useState(false)

  const today = todaySgt()
  const minMonth = monthOf(today)
  const last = new Date(`${today}T00:00:00Z`)
  last.setUTCDate(last.getUTCDate() + bookingConfig.maxAdvanceDays)
  const maxMonth = monthOf(last.toISOString().slice(0, 10))

  const key = `${month}:${duration}`
  useEffect(() => {
    if (cache[key]) return
    let cancelled = false
    setLoading(true)
    fetch(`/api/availability?month=${month}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data.days) setCache((c) => ({ ...c, [key]: data.days }))
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [month, duration, key, cache])

  function pickDate(date: string) {
    window.dispatchEvent(new CustomEvent('kyt:prefill', { detail: { date, duration } }))
  }

  return (
    <div className="bg-paper p-6 shadow-2xl lg:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display font-semibold text-lg">Check availability</h2>
        <p className="text-xs text-muted">
          ${bookingConfig.rates.weekday}–{bookingConfig.rates.weekendAndHoliday}/hr
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2" role="group" aria-label="Duration in hours">
        <span className="mr-1 text-xs uppercase tracking-[0.15em] text-muted">Hours</span>
        {bookingConfig.durations.map((h) => (
          <button
            key={h}
            type="button"
            aria-pressed={duration === h}
            onClick={() => setDuration(h)}
            className={cn(
              'h-9 w-9 border text-xs transition-colors',
              duration === h
                ? 'border-accent bg-accent text-paper'
                : 'border-line bg-white text-ink hover:border-ink'
            )}
          >
            {h}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <Calendar
          month={month}
          days={cache[key] ?? null}
          selected={null}
          loading={loading}
          canGoPrev={month > minMonth}
          canGoNext={month < maxMonth}
          onSelect={pickDate}
          onMonthChange={(delta) =>
            setMonth((m) => {
              const [y, mo] = m.split('-').map(Number)
              const d = new Date(Date.UTC(y, mo - 1 + delta, 1))
              return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
            })
          }
        />
      </div>
    </div>
  )
}
