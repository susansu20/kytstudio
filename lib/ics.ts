import { bookingConfig } from './booking.config'
import { toUtcStamp } from './time'

/** Minimal RFC 5545 .ics for the customer's calendar (times encoded as UTC). */

export interface IcsInput {
  ref: string
  summary: string
  description: string
  start: Date
  end: Date
}

const escapeText = (s: string) =>
  s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')

// Long lines must be folded at 75 octets (approximate with chars, ASCII-mostly content)
const fold = (line: string) => {
  if (line.length <= 74) return line
  const parts: string[] = []
  let rest = line
  parts.push(rest.slice(0, 74))
  rest = rest.slice(74)
  while (rest.length) {
    parts.push(' ' + rest.slice(0, 73))
    rest = rest.slice(73)
  }
  return parts.join('\r\n')
}

export function buildIcs(input: IcsInput): string {
  const b = bookingConfig.business
  const location = `${b.name}, ${b.address.street}, ${b.address.building}, ${b.address.postalCode}`
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Kyt Studio//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${input.ref}@kytstudio.net`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(input.start)}`,
    `DTEND:${toUtcStamp(input.end)}`,
    `SUMMARY:${escapeText(input.summary)}`,
    `DESCRIPTION:${escapeText(input.description)}`,
    `LOCATION:${escapeText(location)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
  return lines.map(fold).join('\r\n') + '\r\n'
}

/** "Add to Google Calendar" URL for the confirmation screen. */
export function googleCalendarUrl(input: IcsInput): string {
  const b = bookingConfig.business
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.summary,
    dates: `${toUtcStamp(input.start)}/${toUtcStamp(input.end)}`,
    details: input.description,
    location: `${b.address.street}, ${b.address.building}, ${b.address.postalCode}`,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
