'use client'

import { useState } from 'react'
import type { RuntimeSettings } from '@/lib/settings'

/**
 * Owner-only operational settings. Deliberately plain — this is a utility
 * page, not part of the public design. Bookings themselves are managed
 * directly in Google Calendar; this only covers rules.
 */

const field =
  'w-full border border-line bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent'
const label = 'block text-xs uppercase tracking-widest text-muted mb-1'

export default function AdminSettingsPage() {
  const [password, setPassword] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [settings, setSettings] = useState<RuntimeSettings | null>(null)
  const [holidaysText, setHolidaysText] = useState('')
  const [blockedText, setBlockedText] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function unlock(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/settings', {
        headers: { 'x-admin-password': password },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Could not unlock')
      setSettings(data)
      setHolidaysText(data.publicHolidays.join('\n'))
      setBlockedText(
        data.blockedRanges
          .map((r: { from: string; to: string; reason?: string }) =>
            [r.from, r.to, r.reason ?? ''].filter(Boolean).join(' ')
          )
          .join('\n')
      )
      setUnlocked(true)
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not unlock')
    } finally {
      setBusy(false)
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!settings) return
    setBusy(true)
    setStatus(null)

    const publicHolidays = holidaysText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => /^\d{4}-\d{2}-\d{2}$/.test(s))
    const blockedRanges = blockedText
      .split('\n')
      .map((line): { from: string; to: string; reason?: string } | null => {
        const [from, to, ...rest] = line.trim().split(/\s+/)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(from ?? '')) return null
        return {
          from,
          to: /^\d{4}-\d{2}-\d{2}$/.test(to ?? '') ? to : from,
          reason: rest.join(' ') || undefined,
        }
      })
      .filter((r): r is { from: string; to: string; reason?: string } => r !== null)

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
        body: JSON.stringify({ ...settings, publicHolidays, blockedRanges }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Save failed')
      setSettings(data)
      setStatus('Saved. Availability updates immediately.')
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const num = (key: keyof RuntimeSettings) => ({
    value: settings ? String(settings[key]) : '',
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setSettings((s) => (s ? { ...s, [key]: Number(e.target.value) || 0 } : s)),
  })

  if (!unlocked) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
        <h1 className="font-display font-semibold text-2xl">Studio settings</h1>
        <form onSubmit={unlock} className="mt-6 space-y-4">
          <div>
            <label htmlFor="pw" className={label}>
              Admin password
            </label>
            <input
              id="pw"
              type="password"
              className={field}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={busy || !password}
            className="w-full bg-ink px-4 py-2.5 text-sm text-paper transition-colors hover:bg-accent disabled:opacity-40"
          >
            {busy ? 'Checking…' : 'Unlock'}
          </button>
          {status && <p className="text-sm text-accent">{status}</p>}
        </form>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display font-semibold text-2xl">Studio settings</h1>
      <p className="mt-2 text-sm text-muted">
        These override the defaults in booking.config.ts and apply immediately. Bookings themselves
        live in Google Calendar.
      </p>

      <form onSubmit={save} className="mt-8 space-y-8">
        <fieldset className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <legend className="mb-3 w-full border-b border-line pb-2 font-display font-semibold text-lg">
            Hours & rules
          </legend>
          <div>
            <label className={label}>Open (hour, 24h)</label>
            <input type="number" min={0} max={23} className={field} {...num('openHour')} />
          </div>
          <div>
            <label className={label}>Close (hour, 24h)</label>
            <input type="number" min={1} max={24} className={field} {...num('closeHour')} />
          </div>
          <div>
            <label className={label}>Buffer (minutes)</label>
            <input type="number" min={0} max={120} className={field} {...num('bufferMinutes')} />
          </div>
          <div>
            <label className={label}>Min notice (hours)</label>
            <input type="number" min={0} max={168} className={field} {...num('minNoticeHours')} />
          </div>
          <div>
            <label className={label}>Book ahead (days)</label>
            <input type="number" min={1} max={365} className={field} {...num('maxAdvanceDays')} />
          </div>
        </fieldset>

        <fieldset className="grid grid-cols-2 gap-4">
          <legend className="mb-3 w-full border-b border-line pb-2 font-display font-semibold text-lg">
            Hourly rates (SGD)
          </legend>
          <div>
            <label className={label}>Weekday</label>
            <input type="number" min={0} className={field} {...num('weekdayRate')} />
          </div>
          <div>
            <label className={label}>Weekend & PH</label>
            <input type="number" min={0} className={field} {...num('weekendRate')} />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 w-full border-b border-line pb-2 font-display font-semibold text-lg">
            Public holidays
          </legend>
          <label className={label}>One date per line (YYYY-MM-DD)</label>
          <textarea
            rows={8}
            className={field}
            value={holidaysText}
            onChange={(e) => setHolidaysText(e.target.value)}
          />
        </fieldset>

        <fieldset>
          <legend className="mb-3 w-full border-b border-line pb-2 font-display font-semibold text-lg">
            Blocked date ranges
          </legend>
          <label className={label}>
            One per line: from to reason — e.g. “2026-08-01 2026-08-03 repainting”
          </label>
          <textarea
            rows={4}
            className={field}
            value={blockedText}
            onChange={(e) => setBlockedText(e.target.value)}
          />
        </fieldset>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="bg-ink px-6 py-2.5 text-sm text-paper transition-colors hover:bg-accent disabled:opacity-40"
          >
            {busy ? 'Saving…' : 'Save settings'}
          </button>
          {status && <p className="text-sm text-muted">{status}</p>}
        </div>
      </form>
    </main>
  )
}
