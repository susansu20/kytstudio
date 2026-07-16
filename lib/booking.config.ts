/**
 * booking.config.ts — every business rule in one place.
 *
 * Rates, hours, buffers, holidays, form fields: edit here, nothing else.
 * Values marked "runtime-overridable" can also be changed live from
 * /admin/settings (stored in Redis and merged over these defaults).
 */

export type FieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'number'
  | 'select'
  | 'radio'
  | 'textarea'
  | 'date'
  | 'time'
  | 'consent'

export interface BookingField {
  /** Unique key — becomes the form name and the label in emails/calendar notes. */
  key: string
  label: string
  type: FieldType
  required?: boolean
  /** For select / radio fields. */
  options?: string[]
  placeholder?: string
  helperText?: string
  defaultValue?: string
  /**
   * Hooks a field into system behaviour. Everything else is free-form:
   *  - name / email / phone → calendar event title, attendee, contact info
   *  - shootType            → calendar event title
   *  - firstTime            → 'Yes' adds the [FIRST-TIMER] flag + orientation copy
   *  - notes                → surfaced prominently in the owner email
   */
  role?: 'name' | 'email' | 'phone' | 'shootType' | 'firstTime' | 'notes'
  /** Layout hint for the details form: 'half' pairs up on desktop. */
  width?: 'full' | 'half'
}

export interface BlockedRange {
  from: string // YYYY-MM-DD inclusive
  to: string // YYYY-MM-DD inclusive
  reason?: string
}

/**
 * Seamless backdrop colours (automatic backdrop system). Hex values are
 * screen approximations for the site swatches — actual colours may vary.
 */
export const BACKDROP_COLOURS = [
  { name: 'Black', hex: '#1E1E1E' },
  { name: 'Thunder Gray', hex: '#6E7370' },
  { name: 'Crimson', hex: '#BE1E4B' },
  { name: 'Purple', hex: '#6C4BA6' },
  { name: 'Deep Yellow', hex: '#EDB03C' },
  { name: 'Primary Red', hex: '#D22030' },
  { name: 'Tulip', hex: '#DA4E93' },
  { name: 'Olive Green', hex: '#8F8A57' },
  { name: 'Baby Blue', hex: '#82D7C4' },
  { name: 'Blue Jay', hex: '#3FB3DC' },
  { name: 'Teal', hex: '#3F8C86' },
  { name: 'Sand', hex: '#F7E97A' },
  { name: 'Coral', hex: '#F2C7D3' },
  { name: 'Beige', hex: '#E5DCCB' },
  { name: 'Focus Gray', hex: '#B5B8BA' },
  { name: 'White', hex: '#FAFAF8' },
] as const

const backdropOptions = ['No preference', ...BACKDROP_COLOURS.map((c) => c.name)]

export const bookingConfig = {
  business: {
    name: 'The Kyt Studio',
    legalName: 'The Kyt Studio LLP',
    email: 'contact@kytstudio.net',
    phone: '+65 9880 4429',
    instagram: 'https://www.instagram.com/thekytstudio',
    youtube: 'https://www.youtube.com/@thekytstudio',
    facebook: 'https://www.facebook.com/thekytstudio',
    website: 'https://kytstudio.net',
    address: {
      street: '3 Gambas Crescent',
      building: 'Nordcom 1, #08-07',
      postalCode: 'Singapore 757041',
      buildingNote:
        'Nordcom 1 has more than one block — make sure you’re in the main building before heading up to level 8.',
      // TODO: verify exact coordinates for 3 Gambas Crescent (approximate for now)
      geo: { lat: 1.4446, lng: 103.8155 },
    },
  },

  timezone: 'Asia/Singapore',

  /** Bookable window, SGT. Bookings must START at or after openHour and END by closeHour. (runtime-overridable) */
  operatingHours: { openHour: 10, closeHour: 22 },

  /** After-hours window (enquiry form only, never bookable online). */
  afterHours: { startHour: 23, endHour: 6 },

  /** Turnover buffer enforced between bookings, in minutes. (runtime-overridable) */
  bufferMinutes: 15,

  /** Minimum advance notice for online bookings, in hours. (runtime-overridable) */
  minNoticeHours: 12,

  /** How far ahead the calendar opens, in days. (runtime-overridable) */
  maxAdvanceDays: 60,

  /** Selectable durations, in hours. */
  durations: [1, 2, 3, 4, 5, 6, 7, 8],
  minDurationHours: 1,

  /** Hourly rates in SGD. (runtime-overridable) */
  rates: {
    weekday: 50,
    weekendAndHoliday: 60,
  },

  /**
   * Singapore public holidays (charged at the weekend rate). (runtime-overridable)
   * Source: MOM gazetted holidays. When a holiday falls on a Sunday the following
   * Monday is also a public holiday — those Mondays are included below.
   * TODO: confirm against mom.gov.sg each year and add the next year's dates
   * (or update live via /admin/settings).
   */
  publicHolidays: [
    // 2026
    '2026-01-01', // New Year's Day
    '2026-02-17', // Chinese New Year
    '2026-02-18', // Chinese New Year
    '2026-03-21', // Hari Raya Puasa
    '2026-04-03', // Good Friday
    '2026-05-01', // Labour Day
    '2026-05-27', // Hari Raya Haji
    '2026-05-31', // Vesak Day (Sun)
    '2026-06-01', // Vesak Day observed
    '2026-08-09', // National Day (Sun)
    '2026-08-10', // National Day observed
    '2026-11-08', // Deepavali (Sun)
    '2026-11-09', // Deepavali observed
    '2026-12-25', // Christmas Day
    // 2027 — add once MOM publishes the gazetted list
    '2027-01-01', // New Year's Day
  ],

  /** Owner-blocked dates (maintenance, personal shoots…). (runtime-overridable) */
  blockedRanges: [] as BlockedRange[],

  /** Add-ons shown on the rates section (informational — arranged over email/notes for v1). */
  addOns: [
    { name: 'Camera rental (body + lens)', price: 'from $70/day' },
    { name: 'Pre-shoot lighting trial', price: '$100/hr' },
    { name: 'Setup assistance beyond the basics', price: 'chargeable' },
  ],

  /**
   * Booking form fields — Step 3 of the widget renders this list directly.
   * Add, remove or reorder entries here; no component code changes needed.
   */
  fields: [
    {
      key: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      role: 'name',
      width: 'half',
      placeholder: 'Your full name',
    },
    {
      key: 'email',
      label: 'Email',
      type: 'email',
      required: true,
      role: 'email',
      width: 'half',
      placeholder: 'you@example.com',
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'tel',
      required: true,
      role: 'phone',
      width: 'half',
      defaultValue: '+65 ',
      helperText: 'We text your access code to this number.',
    },
    {
      key: 'shootType',
      label: 'Shoot type',
      type: 'select',
      required: true,
      role: 'shootType',
      width: 'half',
      options: [
        'Photography',
        'Videography',
        'Content Creation',
        'Interview',
        'Podcast',
        'Workshop',
        'Other',
      ],
    },
    {
      key: 'people',
      label: 'Number of people',
      type: 'number',
      required: true,
      width: 'half',
      placeholder: 'e.g. 4',
    },
    {
      key: 'firstTime',
      label: 'First time booking with us?',
      type: 'radio',
      required: true,
      role: 'firstTime',
      width: 'half',
      options: ['Yes', 'No'],
      helperText: 'First-timers get a 15-minute orientation before the shoot.',
    },
    {
      key: 'backdrop',
      label: 'Backdrop preference',
      type: 'select',
      required: false,
      width: 'full',
      options: backdropOptions,
      helperText: 'Optional — you can also decide on the day.',
    },
    {
      key: 'notes',
      label: 'Special requests / notes',
      type: 'textarea',
      required: false,
      role: 'notes',
      width: 'full',
      placeholder: 'Anything we should prepare?',
      helperText:
        'Shooting sensitive content? Mention it here and we’ll arrange camera shutdown with a refundable deposit.',
    },
    {
      key: 'consent',
      label: 'I agree to the house rules & policies',
      type: 'consent',
      required: true,
      width: 'full',
    },
  ] satisfies BookingField[],

  /** After-hours (11pm–6am) enquiry form — same field system, emails the owner only. */
  afterHoursFields: [
    { key: 'name', label: 'Name', type: 'text', required: true, role: 'name', width: 'half' },
    { key: 'email', label: 'Email', type: 'email', required: true, role: 'email', width: 'half' },
    {
      key: 'phone',
      label: 'Phone',
      type: 'tel',
      required: true,
      role: 'phone',
      width: 'half',
      defaultValue: '+65 ',
    },
    { key: 'date', label: 'Preferred date', type: 'date', required: true, width: 'half' },
    { key: 'startTime', label: 'Start time', type: 'time', required: true, width: 'half' },
    { key: 'endTime', label: 'End time', type: 'time', required: true, width: 'half' },
    {
      key: 'description',
      label: 'What are you shooting?',
      type: 'textarea',
      required: true,
      width: 'full',
      helperText: 'Tell us about the shoot, crew size, and any equipment needs.',
    },
  ] satisfies BookingField[],

  /** Availability API cache lifetime (seconds); revalidated on every confirmed booking. */
  availabilityCacheSeconds: 60,

  /** Requests per IP per minute on write endpoints. */
  rateLimitPerMinute: 8,
} as const

export type BookingConfig = typeof bookingConfig
