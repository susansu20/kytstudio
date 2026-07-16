# The Kyt Studio — studio rental site + booking system

An editorial landing page and a fully custom, Acuity-style booking widget for
[The Kyt Studio](https://kytstudio.net), synced two-way with Google Calendar.

- **Booking flow**: date & duration → time slot → details → review → confirmation
- **Two-way calendar sync**: any event on the studio's Google Calendar blocks
  availability (including ones the owner adds by hand); confirmed bookings are
  written back as `[BOOKED] Name - Shoot type (Xhr)` events
- **No online payment in v1** — confirmation explains that a PayNow invoice
  follows. The flow is structured so a Stripe/PayNow QR step can slot in
  between Review and Confirmation later.
- **Emails via Resend**: customer confirmation with .ics attachment + owner
  notification with every answer
- **After-hours (11pm–6am)** enquiry form that emails the owner only
- **/admin/settings**: password-protected page for hours, buffer, notice
  period, rates, holidays and blocked dates (stored in Redis, applied live)

Everything about the business lives in **`lib/booking.config.ts`** — rates,
hours, the public-holiday list, the booking form fields, the after-hours form
fields, address and socials. Add or reorder form fields there; no component
code changes needed.

---

## Demo mode

With no environment variables at all, the site runs in **demo mode**: fake
availability (deterministic busy blocks), no real calendar writes, emails
logged to the console. `npm install && npm run dev` and the whole flow is
clickable. Configure the env vars below to go live.

---

## Google Calendar setup (non-technical walkthrough)

You'll create a small "robot account" that can read and write one calendar.
Takes about 10 minutes; no code involved.

**1. Create a Google Cloud project**
1. Go to [console.cloud.google.com](https://console.cloud.google.com) and sign
   in with the Google account you use for the studio.
2. Click the project dropdown (top bar) → **New project**. Name it
   `kyt-studio-bookings` → **Create**, then make sure it's selected.

**2. Enable the Calendar API**
1. In the search bar type **Google Calendar API** and open it.
2. Click **Enable**.

**3. Create the service account (the robot)**
1. Search **Service accounts** → **Create service account**.
2. Name: `kyt-bookings`. Click **Create and continue**, skip the optional
   permission steps, **Done**.
3. Open the account you just made → **Keys** tab → **Add key** →
   **Create new key** → **JSON** → **Create**. A `.json` file downloads —
   treat it like a password.

**4. Share your booking calendar with the robot**
1. Open [calendar.google.com](https://calendar.google.com). Under
   *My calendars*, hover the calendar you want bookings on → ⋮ →
   **Settings and sharing**.
   (Tip: create a dedicated calendar called "Studio bookings" so your
   personal events stay separate — but any calendar works, and anything you
   add to it by hand automatically blocks online bookings.)
2. Under **Share with specific people**, click **Add people** and paste the
   robot's email (it looks like `kyt-bookings@…iam.gserviceaccount.com` —
   it's in the JSON file as `client_email`).
3. Set permission to **Make changes to events**. Save.
4. Still in settings, scroll to **Integrate calendar** and copy the
   **Calendar ID** (for your main calendar it's just your Gmail address).

**5. Fill in the env vars** (see `.env.example`)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` → `client_email` from the JSON
- `GOOGLE_PRIVATE_KEY` → `private_key` from the JSON (keep the `\n`s and
  wrap the whole thing in double quotes)
- `GOOGLE_CALENDAR_ID` → the Calendar ID from step 4

> **Note on invites:** plain service accounts can't add the customer as an
> event *attendee* (Google restricts that). The system tries, and falls back
> gracefully — customers always get the .ics file and an add-to-Google link
> in their confirmation email, so they never miss the event.

---

## Other services

**Upstash Redis** (booking locks, settings, rate limiting — required in
production): create a free database at
[console.upstash.com](https://console.upstash.com), copy the REST URL and
token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.

**Resend** (email): sign up at [resend.com](https://resend.com), verify the
`kytstudio.net` domain (they show you the DNS records to add), create an API
key → `RESEND_API_KEY`. Set `EMAIL_FROM` to something like
`The Kyt Studio <bookings@kytstudio.net>` and `OWNER_NOTIFICATION_EMAIL` to
where you want booking alerts.

**Admin password**: set `ADMIN_PASSWORD` to something long and random, then
visit `/admin/settings` to manage hours, rates, buffer, notice period,
holidays and blocked dates. (Bookings themselves are managed in Google
Calendar — delete or move an event there and availability updates within a
minute.)

---

## Deploying on Vercel

1. Push this folder to a Git repository and import it at
   [vercel.com/new](https://vercel.com/new).
2. Add every variable from `.env.example` under **Settings → Environment
   Variables**.
3. Add the domain `book.kytstudio.net` under **Settings → Domains**, then add
   the CNAME record Vercel shows you at your DNS provider.

### Subdomain-first launch & the 301 plan

- **Phase 1 (now):** run on `book.kytstudio.net` with
  `NEXT_PUBLIC_SITE_URL=https://book.kytstudio.net`. The page is
  self-canonical. On the Squarespace `/studio-rental` page, point the booking
  button at the subdomain.
- **Phase 2 (replace Squarespace):** move the domain so this app serves
  `kytstudio.net/studio-rental` (or the root), update
  `NEXT_PUBLIC_SITE_URL`, and add a **301 redirect** from
  `book.kytstudio.net/*` to the new URL (Vercel → Domains → Redirect) so
  links and SEO equity carry over. Keep the redirect indefinitely.

---

## Day-to-day operations

- **See bookings** → Google Calendar. `[FIRST-TIMER]` prefix = arrive 15 min
  early for orientation. All form answers are in the event description.
- **Block time off** → create any event in Google Calendar; the slot
  disappears online within ~60 seconds.
- **Change rates/hours/holidays** → `/admin/settings` (instant), or edit
  `lib/booking.config.ts` and redeploy (permanent defaults).
- **Public holidays** → check [mom.gov.sg](https://www.mom.gov.sg/employment-practices/public-holidays)
  each year and add the new dates in `/admin/settings`.
- **After-hours enquiries** → arrive by email only; reply personally.

## Content TODOs before launch

- [x] Real studio photography is in (`public/images/studio-*.webp`, all five
  shots used across hero / The Space / The Work). To swap or add images,
  keep the filenames or update the paths in `components/landing/*.tsx`.
- [ ] **Confirm floor area** — the current Squarespace page says
  "1690 square metres", almost certainly square *feet*. Marked with a TODO in
  `components/landing/TheSpace.tsx`.
- [ ] Verify the map pin / geo coordinates in `lib/booking.config.ts`.
- [ ] Confirm the "Guide to Basic Set-ups" URL in
  `components/landing/GoodToKnow.tsx` matches the live Squarespace page.
- [ ] Hero headline — option A is live; alternates in
  `components/landing/Hero.tsx`:
  - A. *A natural-light photo studio, hired by the hour.* ← current
  - B. *Shoot in daylight. Record in silence.*
  - C. *White walls, west light, and not a sound you didn't make.*

## Tech notes

- Next.js 14 App Router + TypeScript, Tailwind + shadcn-style components,
  Framer Motion (scroll fade-ins only, respects reduced motion).
- All Google API calls are server-side (`lib/google.ts`, JWT-signed with the
  service-account key; no client library, no keys shipped to the browser).
- Availability = FreeBusy minus a configurable 15-min turnover buffer on both
  sides of every event, minimum 12h notice, 10:00–22:00 SGT, cached 60s and
  invalidated the moment a booking lands.
- The booking route re-verifies FreeBusy live (uncached) inside a Redis lock
  on `date+start+duration`, so double-booking a slot is not possible; losers
  get a friendly "slot taken" message and a refreshed slot list.
- Zod validation server-side, built dynamically from the field config; rate
  limiting per IP on all write endpoints.
- Analytics events (`step_viewed`, `slot_selected`, `booking_confirmed`,
  `booking_failed`, `after_hours_submitted`) push to `window.dataLayer` —
  GTM/GA4 ready, swap in `lib/analytics.ts`.
