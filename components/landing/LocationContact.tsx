import { FadeIn } from '@/components/motion/FadeIn'
import { bookingConfig } from '@/lib/booking.config'

export function LocationContact() {
  const b = bookingConfig.business
  return (
    <section
      id="location"
      aria-labelledby="location-heading"
      className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36"
    >
      <div className="grid gap-12 md:grid-cols-12 md:gap-8">
        <FadeIn className="md:col-span-5">
          <h2 id="location-heading" className="font-display text-display-md text-balance">
            Level eight, Nordcom 1.
          </h2>

          <address className="mt-8 space-y-6 not-italic">
            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Address</h3>
              <p className="mt-2 text-base leading-relaxed">
                {b.address.street}
                <br />
                {b.address.building}
                <br />
                {b.address.postalCode}
              </p>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{b.address.buildingNote}</p>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Hours</h3>
              <p className="mt-2 text-base">10am – 10pm, daily</p>
              <p className="text-sm text-muted">By appointment, subject to availability.</p>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Contact</h3>
              <p className="mt-2 text-base leading-loose">
                <a href={`mailto:${b.email}`} className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                  {b.email}
                </a>
                <br />
                <a href={`tel:${b.phone.replace(/\s/g, '')}`} className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent">
                  {b.phone}
                </a>
              </p>
            </div>

            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-muted">Elsewhere</h3>
              <ul className="mt-2 flex gap-6 text-sm">
                {(
                  [
                    ['Instagram', b.instagram],
                    ['YouTube', b.youtube],
                    ['Facebook', b.facebook],
                  ] as const
                ).map(([name, href]) => (
                  <li key={name}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-line underline-offset-4 transition-colors hover:text-accent hover:decoration-accent"
                    >
                      {name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </address>
        </FadeIn>

        <FadeIn delay={0.12} className="md:col-span-7">
          <div className="h-full min-h-[360px] border border-line grayscale transition-[filter] duration-500 hover:grayscale-0">
            <iframe
              title="Map to The Kyt Studio, 3 Gambas Crescent, Nordcom 1"
              src="https://www.google.com/maps?q=3%20Gambas%20Crescent%20Nordcom%201%20Singapore%20757041&output=embed"
              className="h-full w-full"
              style={{ minHeight: 360, border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
