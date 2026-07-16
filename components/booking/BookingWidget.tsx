'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Download } from 'lucide-react'
import { track } from '@/lib/analytics'
import { bookingConfig } from '@/lib/booking.config'
import { addMonths, dayOfWeek, formatHour, formatLongDate, monthOf, todaySgt } from '@/lib/time'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar, type DayStatus } from './Calendar'
import { FieldInput } from './FieldInput'

type Step = 'date' | 'time' | 'details' | 'review' | 'confirmed'

interface Slot {
  startHour: number
  endHour: number
}

interface MonthData {
  days: Record<string, DayStatus>
  rates: { weekday: number; weekendAndHoliday: number }
  publicHolidays: string[]
}

interface Confirmation {
  ref: string
  dateLabel: string
  timeLabel: string
  total: number
  rate: number
  duration: number
  ics: string
  googleCalendarUrl: string
}

const STEPS: { id: Step; label: string }[] = [
  { id: 'date', label: 'Date' },
  { id: 'time', label: 'Time' },
  { id: 'details', label: 'Details' },
  { id: 'review', label: 'Review' },
]

const initialValues = () =>
  Object.fromEntries(bookingConfig.fields.map((f) => [f.key, f.defaultValue ?? '']))

export function BookingWidget() {
  const [step, setStep] = useState<Step>('date')
  const [duration, setDuration] = useState(2)
  const [month, setMonth] = useState(monthOf(todaySgt()))
  const [monthCache, setMonthCache] = useState<Record<string, MonthData>>({})
  const [monthLoading, setMonthLoading] = useState(false)
  const [date, setDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[] | null>(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [serverRate, setServerRate] = useState<number | null>(null)
  const [startHour, setStartHour] = useState<number | null>(null)
  const [values, setValues] = useState<Record<string, string>>(initialValues)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const topRef = useRef<HTMLDivElement>(null)

  const today = todaySgt()
  const minMonth = monthOf(today)
  const maxMonth = useMemo(() => {
    const last = new Date(`${today}T00:00:00Z`)
    last.setUTCDate(last.getUTCDate() + bookingConfig.maxAdvanceDays)
    return monthOf(last.toISOString().slice(0, 10))
  }, [today])

  const monthKey = `${month}:${duration}`
  const monthData = monthCache[monthKey] ?? null

  /* ── pricing (client display; server is authoritative) ── */
  const rates = monthData?.rates ?? {
    weekday: bookingConfig.rates.weekday,
    weekendAndHoliday: bookingConfig.rates.weekendAndHoliday,
  }
  const holidays = monthData?.publicHolidays ?? bookingConfig.publicHolidays
  const rateForDate = useCallback(
    (d: string) => {
      const dow = dayOfWeek(d)
      const peak = dow === 0 || dow === 6 || holidays.includes(d)
      return peak ? rates.weekendAndHoliday : rates.weekday
    },
    [holidays, rates]
  )
  const displayRate = date ? (serverRate ?? rateForDate(date)) : null

  /* ── data fetching ── */
  useEffect(() => {
    if (monthCache[monthKey]) return
    let cancelled = false
    setMonthLoading(true)
    fetch(`/api/availability?month=${month}&duration=${duration}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data.days) return
        setMonthCache((c) => ({
          ...c,
          [monthKey]: { days: data.days, rates: data.rates, publicHolidays: data.publicHolidays },
        }))
      })
      .catch(() => !cancelled && setError('Could not load availability — check your connection and retry.'))
      .finally(() => !cancelled && setMonthLoading(false))
    return () => {
      cancelled = true
    }
  }, [month, duration, monthKey, monthCache])

  const loadSlots = useCallback(
    (d: string) => {
      setSlotsLoading(true)
      setSlots(null)
      fetch(`/api/availability?date=${d}&duration=${duration}`)
        .then((r) => r.json())
        .then((data) => {
          setSlots(data.slots ?? [])
          if (typeof data.rate === 'number') setServerRate(data.rate)
        })
        .catch(() => setError('Could not load time slots — please retry.'))
        .finally(() => setSlotsLoading(false))
    },
    [duration]
  )

  // Re-check availability live whenever the time step is shown
  useEffect(() => {
    if (step === 'time' && date) loadSlots(date)
  }, [step, date, loadSlots])

  // The hero card hands its date+duration selection straight into this flow
  useEffect(() => {
    function onPrefill(e: Event) {
      const detail = (e as CustomEvent<{ date: string; duration: number }>).detail
      if (!detail?.date) return
      setDuration(detail.duration)
      setStartHour(null)
      setSlots(null)
      setServerRate(null)
      setDate(detail.date)
      setError(null)
      setStep('time')
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    window.addEventListener('kyt:prefill', onPrefill)
    return () => window.removeEventListener('kyt:prefill', onPrefill)
  }, [])

  /* ── analytics ── */
  useEffect(() => {
    track('step_viewed', { step })
  }, [step])

  /* ── navigation ── */
  function goTo(next: Step) {
    setError(null)
    setStep(next)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function changeDuration(h: number) {
    setDuration(h)
    setStartHour(null)
    setSlots(null)
  }

  function selectDate(d: string) {
    setDate(d)
    setStartHour(null)
    setServerRate(null)
    goTo('time')
  }

  function selectSlot(h: number) {
    setStartHour(h)
    track('slot_selected', { date, start_hour: h, duration })
    goTo('details')
  }

  /* ── details validation (light client pass; server re-validates) ── */
  function validateDetails(): boolean {
    const errs: Record<string, string> = {}
    for (const f of bookingConfig.fields) {
      const v = (values[f.key] ?? '').trim()
      if (f.type === 'consent') {
        if (f.required && values[f.key] !== 'true') errs[f.key] = 'Required to book'
      } else if (f.required && !v) {
        errs[f.key] = `${f.label} is required`
      } else if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) {
        errs[f.key] = 'Enter a valid email'
      } else if (f.type === 'tel' && v && !/^\+?[0-9 ()-]{8,20}$/.test(v)) {
        errs[f.key] = 'Enter a valid phone number'
      } else if (f.type === 'number' && v && !/^\d{1,3}$/.test(v)) {
        errs[f.key] = 'Enter a number'
      }
    }
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  /* ── submit ── */
  async function confirmBooking() {
    if (!date || startHour === null) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, startHour, duration, fields: values }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.code === 'SLOT_TAKEN' || data.code === 'SLOT_CONTENDED') {
          track('booking_failed', { reason: data.code })
          setError(data.error)
          setMonthCache({}) // stale — refetch
          goTo('time') // re-triggers a live slot refresh
          return
        }
        throw new Error(data.error ?? 'Booking failed')
      }
      setConfirmation(data)
      track('booking_confirmed', { ref: data.ref, total: data.total, duration })
      goTo('confirmed')
    } catch (err) {
      track('booking_failed', { reason: 'error' })
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function downloadIcs() {
    if (!confirmation) return
    const blob = new Blob([confirmation.ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kyt-studio-${confirmation.ref}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  return (
    <div ref={topRef} className="scroll-mt-24">
      {/* progress — editorial index style */}
      {step !== 'confirmed' && (
        <ol className="mb-10 flex flex-wrap gap-x-6 gap-y-2 border-b border-line pb-4 text-xs uppercase tracking-[0.18em]">
          {STEPS.map((s, i) => {
            const reachable = i < stepIndex
            return (
              <li key={s.id}>
                <button
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && goTo(s.id)}
                  aria-current={s.id === step ? 'step' : undefined}
                  className={cn(
                    'transition-colors',
                    s.id === step ? 'text-ink' : reachable ? 'text-muted hover:text-accent' : 'text-muted/40'
                  )}
                >
                  <span className="mr-1.5 font-display italic">0{i + 1}</span>
                  {s.label}
                </button>
              </li>
            )
          })}
        </ol>
      )}

      {error && (
        <p role="alert" className="mb-6 border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}

      {/* ── Step 1: date & duration ── */}
      {step === 'date' && (
        <div className="grid gap-10 md:grid-cols-[1fr,1.2fr] md:gap-16">
          <div>
            <fieldset>
              <legend className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                How many hours?
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Duration in hours">
                {bookingConfig.durations.map((h) => (
                  <button
                    key={h}
                    type="button"
                    aria-pressed={duration === h}
                    onClick={() => changeDuration(h)}
                    className={cn(
                      'h-12 w-12 border text-sm transition-colors',
                      duration === h
                        ? 'border-accent bg-accent text-paper'
                        : 'border-line bg-white text-ink hover:border-ink'
                    )}
                  >
                    {h}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted">
                Minimum 1 hour. Need more than 8? Book 8 and mention it in the notes.
              </p>
            </fieldset>

            <div className="mt-10 border-t border-line pt-6" aria-live="polite">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Your session</p>
              {date ? (
                <>
                  <p className="mt-2 font-display text-display-sm">
                    ${(displayRate ?? 0) * duration}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {formatLongDate(date)} · {duration}hr × ${displayRate}/hr (
                    {dayOfWeek(date) === 0 || dayOfWeek(date) === 6 || holidays.includes(date)
                      ? 'weekend & holiday rate'
                      : 'weekday rate'}
                    )
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  Pick a date — weekdays are ${rates.weekday}/hr, weekends & public holidays $
                  {rates.weekendAndHoliday}/hr.
                </p>
              )}
            </div>
          </div>

          <Calendar
            month={month}
            days={monthData?.days ?? null}
            selected={date}
            loading={monthLoading}
            canGoPrev={month > minMonth}
            canGoNext={month < maxMonth}
            onSelect={selectDate}
            onMonthChange={(delta) => setMonth((m) => addMonths(m, delta))}
          />
        </div>
      )}

      {/* ── Step 2: time slot ── */}
      {step === 'time' && date && (
        <div>
          <BackLink onClick={() => goTo('date')}>Change date or duration</BackLink>
          <p className="font-display text-display-sm text-balance">{formatLongDate(date)}</p>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {duration}hr session · ${displayRate}/hr · ${(displayRate ?? 0) * duration} total
          </p>

          <div className="mt-8" aria-live="polite">
            {slotsLoading && <p className="text-sm text-muted">Checking the studio calendar…</p>}
            {!slotsLoading && slots && slots.length === 0 && (
              <p className="text-sm text-muted">
                No {duration}-hour openings left on this date.{' '}
                <button type="button" onClick={() => goTo('date')} className="underline underline-offset-4 hover:text-accent">
                  Try another date
                </button>{' '}
                or a shorter duration.
              </p>
            )}
            {!slotsLoading && slots && slots.length > 0 && (
              <div className="flex flex-wrap gap-2" role="group" aria-label="Available start times">
                {slots.map((s) => (
                  <button
                    key={s.startHour}
                    type="button"
                    onClick={() => selectSlot(s.startHour)}
                    aria-pressed={startHour === s.startHour}
                    className={cn(
                      'border px-5 py-3 text-sm transition-colors',
                      startHour === s.startHour
                        ? 'border-accent bg-accent text-paper'
                        : 'border-line bg-white hover:border-ink'
                    )}
                  >
                    {formatHour(s.startHour)} – {formatHour(s.endHour)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-muted">
            Sessions run {formatHour(bookingConfig.operatingHours.openHour)}–
            {formatHour(bookingConfig.operatingHours.closeHour)} and need at least{' '}
            {bookingConfig.minNoticeHours} hours’ notice. Shooting overnight?{' '}
            <a href="/after-hours" className="underline underline-offset-4 hover:text-accent">
              Request an after-hours booking
            </a>
            .
          </p>
        </div>
      )}

      {/* ── Step 3: details ── */}
      {step === 'details' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (validateDetails()) goTo('review')
          }}
        >
          <BackLink onClick={() => goTo('time')}>Change time</BackLink>
          <div className="grid gap-6 sm:grid-cols-2">
            {bookingConfig.fields.map((f) => (
              <div key={f.key} className={f.width === 'half' ? '' : 'sm:col-span-2'}>
                <FieldInput
                  field={f}
                  value={values[f.key] ?? ''}
                  error={fieldErrors[f.key]}
                  onChange={(v) => {
                    setValues((prev) => ({ ...prev, [f.key]: v }))
                    setFieldErrors((prev) => {
                      if (!prev[f.key]) return prev
                      const { [f.key]: _drop, ...rest } = prev
                      return rest
                    })
                  }}
                />
              </div>
            ))}
          </div>
          <Button type="submit" size="lg" className="mt-10 w-full sm:w-auto">
            Review booking
          </Button>
        </form>
      )}

      {/* ── Step 4: review & confirm ── */}
      {step === 'review' && date && startHour !== null && (
        <div>
          <BackLink onClick={() => goTo('details')}>Edit details</BackLink>
          <dl className="border-y border-line">
            <SummaryRow label="Date" value={formatLongDate(date)} />
            <SummaryRow
              label="Time"
              value={`${formatHour(startHour)} – ${formatHour(startHour + duration)} (${duration}hr)`}
            />
            <SummaryRow label="Rate" value={`$${displayRate}/hr`} />
            <SummaryRow label="Total" value={`$${(displayRate ?? 0) * duration}`} strong />
            {bookingConfig.fields
              .filter((f) => f.type !== 'consent' && (values[f.key] ?? '').trim() !== '')
              .map((f) => (
                <SummaryRow key={f.key} label={f.label} value={values[f.key]} />
              ))}
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            No payment is taken online — we’ll send a PayNow invoice with your confirmation.
          </p>
          <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={confirmBooking} disabled={submitting}>
            {submitting ? 'Confirming with the studio calendar…' : 'Confirm booking'}
          </Button>
        </div>
      )}

      {/* ── Step 5: confirmed ── */}
      {step === 'confirmed' && confirmation && (
        <div className="text-center sm:text-left">
          <p className="text-xs uppercase tracking-[0.18em] text-accent">Booking confirmed</p>
          <p className="mt-3 font-display text-display-sm text-balance">
            See you on {confirmation.dateLabel}, {confirmation.timeLabel}.
          </p>
          <p className="mt-4 text-sm text-muted">
            Reference <span className="font-medium text-ink">{confirmation.ref}</span> · $
            {confirmation.total} total
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button onClick={downloadIcs}>
              <Download className="h-4 w-4" aria-hidden /> Download .ics
            </Button>
            <a
              href={confirmation.googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center border border-ink px-8 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
            >
              Add to Google Calendar
            </a>
          </div>

          <div className="mt-10 border-t border-line pt-6 text-left">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">What happens next</p>
            <ol className="mt-4 space-y-3 text-sm leading-relaxed">
              <li>
                <span className="mr-2 font-display italic text-muted">01</span>A confirmation email is
                on its way with the address and house rules.
              </li>
              <li>
                <span className="mr-2 font-display italic text-muted">02</span>We’ll send a PayNow
                invoice to settle before your session — no payment was taken online.
              </li>
              <li>
                <span className="mr-2 font-display italic text-muted">03</span>
                {values[bookingConfig.fields.find((f) => f.role === 'firstTime')?.key ?? 'firstTime'] === 'Yes'
                  ? 'First visit — we’ll meet you at the studio for a 15-minute orientation, so feel free to arrive early.'
                  : 'Your door access code arrives by text/email before the session.'}
              </li>
            </ol>
          </div>
        </div>
      )}
    </div>
  )
}

function BackLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mb-6 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-accent"
    >
      <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> {children}
    </button>
  )
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-line py-3 last:border-b-0">
      <dt className="shrink-0 text-xs uppercase tracking-[0.15em] text-muted">{label}</dt>
      <dd className={cn('text-right text-sm', strong && 'font-display font-semibold text-xl')}>{value}</dd>
    </div>
  )
}
