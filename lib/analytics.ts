'use client'

/**
 * Lightweight analytics: pushes to window.dataLayer (GTM/GA4-compatible) and
 * mirrors to the console in dev. Swap the body for Plausible/PostHog/etc.
 *
 * Events fired by the booking flow:
 *   step_viewed        { step: 'date' | 'time' | 'details' | 'review' | 'confirmed' }
 *   slot_selected      { date, start_hour, duration }
 *   booking_confirmed  { ref, total, duration }
 *   booking_failed     { reason }
 *   after_hours_submitted {}
 */

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

export function track(event: string, props: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...props })
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[analytics]', event, props)
  }
}
