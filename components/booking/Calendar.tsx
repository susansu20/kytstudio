'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, datesInMonth, dayOfWeek, formatLongDate, formatMonth } from '@/lib/time'
import { cn } from '@/lib/utils'

export type DayStatus = 'available' | 'full' | 'blocked' | 'closed'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

/**
 * Month calendar with keyboard navigation (arrow keys move day-by-day and
 * week-by-week, Enter/Space selects). Fully booked and blocked dates are
 * greyed out; only 'available' days are selectable.
 */
export function Calendar({
  month,
  days,
  selected,
  loading,
  canGoPrev,
  canGoNext,
  onSelect,
  onMonthChange,
}: {
  month: string
  days: Record<string, DayStatus> | null
  selected: string | null
  loading: boolean
  canGoPrev: boolean
  canGoNext: boolean
  onSelect: (date: string) => void
  onMonthChange: (delta: 1 | -1) => void
}) {
  const gridRef = useRef<HTMLDivElement>(null)
  const dates = datesInMonth(month)
  const firstAvailable = dates.find((d) => days?.[d] === 'available') ?? null
  const [focusDate, setFocusDate] = useState<string | null>(null)

  // Reset roving focus target when the month or data changes
  useEffect(() => {
    setFocusDate(selected && selected.startsWith(month) ? selected : firstAvailable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, days])

  function moveFocus(delta: number) {
    if (!focusDate) return
    const next = addDays(focusDate, delta)
    if (!next.startsWith(month)) return // stay within the visible month
    setFocusDate(next)
    requestAnimationFrame(() => {
      gridRef.current?.querySelector<HTMLButtonElement>(`[data-date="${next}"]`)?.focus()
    })
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const moves: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: 7,
      ArrowUp: -7,
    }
    if (e.key in moves) {
      e.preventDefault()
      moveFocus(moves[e.key])
    }
  }

  // Monday-first offset for the leading blanks
  const offset = (dayOfWeek(dates[0]) + 6) % 7

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p aria-live="polite" className="font-display font-semibold text-xl">
          {formatMonth(month)}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(-1)}
            disabled={!canGoPrev}
            aria-label="Previous month"
            className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(1)}
            disabled={!canGoNext}
            aria-label="Next month"
            className="flex h-10 w-10 items-center justify-center border border-line text-ink transition-colors hover:border-ink disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[11px] uppercase tracking-widest text-muted">
        {WEEKDAYS.map((d) => (
          <div key={d} className="pb-2" aria-hidden>
            {d}
          </div>
        ))}
      </div>

      <div
        ref={gridRef}
        role="grid"
        aria-label={`Availability for ${formatMonth(month)}`}
        onKeyDown={onKeyDown}
        className={cn('grid grid-cols-7 gap-px', loading && 'opacity-40 transition-opacity')}
      >
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} role="presentation" />
        ))}
        {dates.map((date) => {
          const status = days?.[date] ?? 'closed'
          const isSelected = selected === date
          const selectable = status === 'available' && !loading
          const statusLabel =
            status === 'available'
              ? 'available'
              : status === 'full'
                ? 'fully booked'
                : status === 'blocked'
                  ? 'unavailable'
                  : 'not bookable'
          return (
            <button
              key={date}
              type="button"
              role="gridcell"
              data-date={date}
              disabled={!selectable}
              tabIndex={focusDate === date ? 0 : -1}
              aria-label={`${formatLongDate(date)}, ${statusLabel}`}
              aria-selected={isSelected}
              onClick={() => onSelect(date)}
              onFocus={() => setFocusDate(date)}
              className={cn(
                'flex aspect-square items-center justify-center text-sm transition-colors',
                isSelected
                  ? 'bg-accent text-paper'
                  : selectable
                    ? 'bg-white text-ink hover:bg-accent hover:text-paper'
                    : 'bg-transparent text-muted/40 line-through decoration-muted/30'
              )}
            >
              {parseInt(date.slice(8), 10)}
            </button>
          )
        })}
      </div>

      <p className="mt-3 text-xs text-muted">
        Greyed-out dates are fully booked or unavailable. All times are Singapore time.
      </p>
    </div>
  )
}
