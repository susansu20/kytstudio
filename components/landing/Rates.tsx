import { FadeIn } from '@/components/motion/FadeIn'
import { bookingConfig } from '@/lib/booking.config'

/**
 * Rates as typography on the page's one full colour block — dark brick red,
 * paper type, the numbers doing all the talking.
 */
export function Rates() {
  return (
    <section id="rates" aria-labelledby="rates-heading" className="bg-accent text-paper">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
        <h2 id="rates-heading" className="sr-only">
          Studio rental rates
        </h2>

        <div className="grid gap-16 md:grid-cols-2 md:gap-8">
          <FadeIn>
            <p className="font-display text-display-lg">
              ${bookingConfig.rates.weekday}
              <span className="ml-3 align-top font-sans text-sm font-normal tracking-[0.25em] text-paper/60">SGD</span>
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-paper/70">
              per hour · Monday to Friday
            </p>
          </FadeIn>
          <FadeIn delay={0.12}>
            <p className="font-display text-display-lg">
              ${bookingConfig.rates.weekendAndHoliday}
              <span className="ml-3 align-top font-sans text-sm font-normal tracking-[0.25em] text-paper/60">SGD</span>
            </p>
            <p className="mt-2 text-sm uppercase tracking-[0.18em] text-paper/70">
              per hour · weekends & public holidays
            </p>
          </FadeIn>
        </div>

        <FadeIn delay={0.1}>
          <div className="mt-16 grid gap-10 border-t border-paper/25 pt-8 md:grid-cols-2">
            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-paper/60">
                After hours, 11pm–6am
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-paper/80">
                Overnight sessions aren’t bookable online — tell us what you’re shooting and we’ll
                come back to you.{' '}
                <a
                  href="/after-hours"
                  className="text-paper underline decoration-paper/40 underline-offset-4 transition-colors hover:decoration-paper"
                >
                  Request an after-hours booking
                </a>
              </p>
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-paper/60">Add-ons</h3>
              <ul className="mt-3 max-w-md">
                {bookingConfig.addOns.map((a) => (
                  <li
                    key={a.name}
                    className="flex items-baseline justify-between gap-6 border-b border-paper/25 py-2.5 text-sm last:border-b-0"
                  >
                    <span>{a.name}</span>
                    <span className="shrink-0 text-paper/70">{a.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
