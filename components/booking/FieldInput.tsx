'use client'

import type { BookingField } from '@/lib/booking.config'
import { cn } from '@/lib/utils'

/**
 * Renders one configured form field. Both the booking details step and the
 * after-hours form draw from this — new field types get added here once.
 */

const inputClass =
  'w-full border border-line bg-white px-3.5 py-3 text-base text-ink placeholder:text-muted/60 focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink aria-[invalid=true]:border-accent'

export function FieldInput({
  field,
  value,
  error,
  onChange,
}: {
  field: BookingField
  value: string
  error?: string
  onChange: (value: string) => void
}) {
  const id = `field-${field.key}`
  const describedBy = [
    field.helperText ? `${id}-help` : null,
    error ? `${id}-error` : null,
  ].filter(Boolean).join(' ') || undefined

  const label = (
    <label htmlFor={id} className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted">
      {field.label}
      {field.required && field.type !== 'consent' && (
        <span aria-hidden className="text-accent">
          {' '}
          *
        </span>
      )}
    </label>
  )

  const helper = field.helperText && (
    <p id={`${id}-help`} className="mt-1.5 text-xs leading-relaxed text-muted">
      {field.helperText}
    </p>
  )

  const errorMsg = error && (
    <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-accent">
      {error}
    </p>
  )

  const common = {
    id,
    name: field.key,
    required: field.required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
  }

  let control: React.ReactNode

  switch (field.type) {
    case 'textarea':
      control = (
        <textarea
          {...common}
          rows={4}
          className={inputClass}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
      break

    case 'select':
      control = (
        <select
          {...common}
          className={cn(inputClass, 'appearance-none bg-no-repeat pr-10')}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'><path d='M1 1l5 5 5-5' fill='none' stroke='%236E6A63' stroke-width='1.5'/></svg>\")",
            backgroundPosition: 'right 14px center',
          }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {!field.required && <option value="">—</option>}
          {field.required && value === '' && (
            <option value="" disabled>
              Select…
            </option>
          )}
          {(field.options ?? []).map((opt) =>
            opt.startsWith('—') ? (
              <option key={opt} disabled>
                {opt}
              </option>
            ) : (
              <option key={opt} value={opt}>
                {opt}
              </option>
            )
          )}
        </select>
      )
      break

    case 'radio':
      control = (
        <div role="radiogroup" aria-labelledby={`${id}-legend`} className="flex gap-2">
          <span id={`${id}-legend`} className="sr-only">
            {field.label}
          </span>
          {(field.options ?? []).map((opt) => (
            <label
              key={opt}
              className={cn(
                'flex-1 cursor-pointer border px-4 py-3 text-center text-sm transition-colors',
                value === opt
                  ? 'border-ink bg-ink text-paper'
                  : 'border-line bg-white text-ink hover:border-ink'
              )}
            >
              <input
                type="radio"
                name={field.key}
                value={opt}
                checked={value === opt}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {opt}
            </label>
          ))}
        </div>
      )
      break

    case 'consent':
      return (
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              name={field.key}
              checked={value === 'true'}
              onChange={(e) => onChange(e.target.checked ? 'true' : '')}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-[#A6431F]"
            />
            <span>
              {field.label}
              {field.required && (
                <span aria-hidden className="text-accent">
                  {' '}
                  *
                </span>
              )}{' '}
              <a href="#good-to-know" className="underline decoration-line underline-offset-4 hover:text-accent">
                (read them here)
              </a>
            </span>
          </label>
          {errorMsg}
        </div>
      )

    default:
      // text, email, tel, number, date, time
      control = (
        <input
          {...common}
          type={field.type === 'number' ? 'text' : field.type}
          inputMode={field.type === 'number' ? 'numeric' : field.type === 'tel' ? 'tel' : undefined}
          className={inputClass}
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )
  }

  return (
    <div>
      {label}
      {control}
      {helper}
      {errorMsg}
    </div>
  )
}
