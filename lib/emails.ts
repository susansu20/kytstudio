import 'server-only'
import { Resend } from 'resend'
import { bookingConfig, type BookingField } from './booking.config'
import { formatHour, formatLongDate } from './time'

/**
 * Transactional email via Resend. If RESEND_API_KEY is missing, emails are
 * logged to the server console instead of sent (demo mode).
 */

const FROM = process.env.EMAIL_FROM || 'The Kyt Studio <bookings@kytstudio.net>'
const OWNER = process.env.OWNER_NOTIFICATION_EMAIL || bookingConfig.business.email

export interface BookingSummary {
  ref: string
  date: string
  startHour: number
  endHour: number
  duration: number
  rate: number
  total: number
  fields: Record<string, string>
  isFirstTimer: boolean
}

interface Attachment {
  filename: string
  content: string // base64
}

async function send(to: string, subject: string, html: string, attachments?: Attachment[]) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[kyt] DEMO MODE — email not sent. To: ${to} | Subject: ${subject}`)
    return
  }
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({ from: FROM, to, subject, html, attachments })
  if (error) throw new Error(`Resend error: ${error.message}`)
}

/* ── shared bits ── */

const b = bookingConfig.business

const wrap = (body: string) => `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #161514; background: #FAF8F4; padding: 32px 24px; max-width: 560px; margin: 0 auto;">
  <p style="font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #6E6A63; margin: 0 0 24px;">The Kyt Studio</p>
  ${body}
  <hr style="border: none; border-top: 1px solid #E4E0D7; margin: 32px 0 16px;" />
  <p style="font-size: 12px; color: #6E6A63; line-height: 1.6; margin: 0;">
    ${b.name} · ${b.address.street}, ${b.address.building}, ${b.address.postalCode}<br/>
    ${b.email} · ${b.phone}
  </p>
</div>`

const row = (label: string, value: string) => `
<tr>
  <td style="padding: 8px 16px 8px 0; font-size: 13px; color: #6E6A63; vertical-align: top; white-space: nowrap;">${label}</td>
  <td style="padding: 8px 0; font-size: 14px;">${value}</td>
</tr>`

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function timeRange(s: BookingSummary) {
  return `${formatHour(s.startHour)}–${formatHour(s.endHour)}`
}

function answersTable(fields: readonly BookingField[], values: Record<string, string>) {
  const rows = fields
    .filter((f) => f.type !== 'consent' && (values[f.key] ?? '') !== '')
    .map((f) => row(esc(f.label), esc(values[f.key])))
    .join('')
  return `<table style="border-collapse: collapse; width: 100%;">${rows}</table>`
}

/* ── customer confirmation ── */

export async function sendCustomerConfirmation(s: BookingSummary, icsBase64: string) {
  const email = s.fields.email
  if (!email) return

  const orientation = s.isFirstTimer
    ? `<p style="font-size: 14px; line-height: 1.7; background: #F1EDE4; padding: 12px 16px;">
        <strong>First visit?</strong> We’ll meet you at the studio for a 15-minute orientation before
        your slot — feel free to arrive up to 15 minutes early.</p>`
    : `<p style="font-size: 14px; line-height: 1.7;">You’ll receive your door access code by text/email
        before your session.</p>`

  const html = wrap(`
    <h1 style="font-size: 26px; font-weight: 500; margin: 0 0 8px;">You’re booked in.</h1>
    <p style="font-size: 14px; color: #6E6A63; margin: 0 0 24px;">Booking reference ${esc(s.ref)}</p>
    <table style="border-collapse: collapse; width: 100%; border-top: 1px solid #E4E0D7; border-bottom: 1px solid #E4E0D7;">
      ${row('Date', formatLongDate(s.date))}
      ${row('Time', `${timeRange(s)} (${s.duration}hr)`)}
      ${row('Rate', `$${s.rate}/hr`)}
      ${row('Total', `<strong>$${s.total}</strong> — payable via PayNow invoice, sent separately`)}
    </table>
    <h2 style="font-size: 15px; margin: 28px 0 4px;">Getting here</h2>
    <p style="font-size: 14px; line-height: 1.7; margin: 0 0 8px;">
      ${b.address.street}, ${b.address.building}, ${b.address.postalCode}.<br/>
      <em>${b.address.buildingNote}</em>
    </p>
    ${orientation}
    <h2 style="font-size: 15px; margin: 28px 0 4px;">House rules, briefly</h2>
    <ul style="font-size: 14px; line-height: 1.8; padding-left: 18px; margin: 0;">
      <li>Footwear off at the entrance; tape shoes if you’re shooting on backdrops.</li>
      <li>Arrive up to 15 minutes early; a 15-minute grace period after your slot covers cleanup.</li>
      <li>Need to run over? Extensions at the regular rate if no one’s booked after you.</li>
      <li>The studio has three lights pre-set (2 continuous + 1 strobe) ready to go.</li>
    </ul>
    <p style="font-size: 14px; line-height: 1.7; margin: 20px 0 0;">
      A calendar file is attached. Questions? Just reply to this email or WhatsApp ${b.phone}.
    </p>`)

  await send(email, `Booking confirmed — ${formatLongDate(s.date)}, ${timeRange(s)} (${s.ref})`, html, [
    { filename: `kyt-studio-${s.ref}.ics`, content: icsBase64 },
  ])
}

/* ── owner notification ── */

export async function sendOwnerNotification(s: BookingSummary) {
  const flag = s.isFirstTimer ? ' · FIRST-TIMER' : ''
  const html = wrap(`
    <h1 style="font-size: 22px; font-weight: 500; margin: 0 0 8px;">New booking${flag ? ' — first-timer, arrive 15 min early' : ''}</h1>
    <p style="font-size: 14px; color: #6E6A63; margin: 0 0 24px;">Ref ${esc(s.ref)} · $${s.total} total</p>
    <table style="border-collapse: collapse; width: 100%; border-top: 1px solid #E4E0D7; border-bottom: 1px solid #E4E0D7;">
      ${row('Date', formatLongDate(s.date))}
      ${row('Time', `${timeRange(s)} (${s.duration}hr @ $${s.rate}/hr)`)}
    </table>
    <h2 style="font-size: 15px; margin: 24px 0 4px;">All answers</h2>
    ${answersTable(bookingConfig.fields, s.fields)}
    <p style="font-size: 13px; color: #6E6A63; margin: 20px 0 0;">
      The event is already on the studio calendar. Manage it there — no admin panel needed.
    </p>`)

  await send(OWNER, `[BOOKED${flag}] ${esc(s.fields.name ?? '')} — ${s.date} ${timeRange(s)}`, html)
}

/* ── after-hours enquiry ── */

export async function sendAfterHoursEnquiry(values: Record<string, string>) {
  const html = wrap(`
    <h1 style="font-size: 22px; font-weight: 500; margin: 0 0 8px;">After-hours enquiry</h1>
    <p style="font-size: 14px; color: #6E6A63; margin: 0 0 24px;">
      Not a confirmed booking — reply to the customer directly.
    </p>
    ${answersTable(bookingConfig.afterHoursFields, values)}`)

  await send(
    OWNER,
    `[AFTER-HOURS ENQUIRY] ${esc(values.name ?? '')} — ${esc(values.date ?? '')}`,
    html
  )
}
