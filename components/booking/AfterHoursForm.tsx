'use client'

import { useState } from 'react'
import { track } from '@/lib/analytics'
import { bookingConfig } from '@/lib/booking.config'
import { Button } from '@/components/ui/button'
import { FieldInput } from './FieldInput'

/**
 * After-hours (11pm–6am) enquiry — same custom-field system as the booking
 * form, driven by bookingConfig.afterHoursFields. Emails the owner only;
 * deliberately framed as a request, not a confirmation.
 */
export function AfterHoursForm() {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(bookingConfig.afterHoursFields.map((f) => [f.key, f.defaultValue ?? '']))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  function validate(): boolean {
    const errs: Record<string, string> = {}
    for (const f of bookingConfig.afterHoursFields) {
      const v = (values[f.key] ?? '').trim()
      if (f.required && !v) errs[f.key] = `${f.label} is required`
      else if (f.type === 'email' && v && !/^\S+@\S+\.\S+$/.test(v)) errs[f.key] = 'Enter a valid email'
      else if (f.type === 'tel' && v && !/^\+?[0-9 ()-]{8,20}$/.test(v)) errs[f.key] = 'Enter a valid phone number'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setStatus('sending')
    setError(null)
    try {
      const res = await fetch('/api/after-hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: values, website: '' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not send your enquiry')
      track('after_hours_submitted')
      setStatus('sent')
    } catch (err) {
      setStatus('idle')
      setError(err instanceof Error ? err.message : 'Could not send your enquiry')
    }
  }

  if (status === 'sent') {
    return (
      <div className="border border-line bg-white/60 p-8">
        <p className="font-display font-semibold text-2xl">Request received.</p>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
          This isn’t a confirmed booking yet — we’ll review your request and reply by email,
          usually within a day. Urgent? WhatsApp us at {bookingConfig.business.phone}.
        </p>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit}>
      {error && (
        <p role="alert" className="mb-6 border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-accent">
          {error}
        </p>
      )}
      <div className="grid gap-6 sm:grid-cols-2">
        {bookingConfig.afterHoursFields.map((f) => (
          <div key={f.key} className={f.width === 'half' ? '' : 'sm:col-span-2'}>
            <FieldInput
              field={f}
              value={values[f.key] ?? ''}
              error={errors[f.key]}
              onChange={(v) => {
                setValues((prev) => ({ ...prev, [f.key]: v }))
                setErrors((prev) => {
                  if (!prev[f.key]) return prev
                  const { [f.key]: _drop, ...rest } = prev
                  return rest
                })
              }}
            />
          </div>
        ))}
      </div>
      {/* honeypot */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <Button type="submit" size="lg" className="mt-10 w-full sm:w-auto" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send enquiry'}
      </Button>
      <p className="mt-4 text-xs leading-relaxed text-muted">
        After-hours requests are reviewed personally — you’ll hear back by email. This form does
        not confirm a booking.
      </p>
    </form>
  )
}
