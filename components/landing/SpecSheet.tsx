import { FadeIn } from '@/components/motion/FadeIn'
import { BACKDROP_COLOURS } from '@/lib/booking.config'

/**
 * What's included, styled as an editorial index / spec sheet: numbered
 * categories, thin rules, two-column item lists. No icon grids.
 * The Backgrounds group renders the seamless-colour swatches.
 */

const SPEC: { category: string; items: string[]; swatches?: boolean }[] = [
  {
    category: 'Lights',
    items: [
      'Godox SK-400 strobe',
      'Jinbei SMART 300W/s strobe × 2',
      'Jinbei EF-150 LED',
      'Godox SL-60 LED',
      'Nanguang Luxpad 42 panel × 3',
    ],
  },
  {
    category: 'Lighting modifiers',
    items: [
      'Softboxes',
      'Beauty dish',
      'Grids',
      'Snoots',
      'Octagon umbrella softbox',
      'Reflector boards',
      'Micro ring softbox',
    ],
  },
  {
    category: 'Lighting / camera support',
    items: [
      'Light stands',
      'C-stands × 3',
      'V-flats',
      'Rollable 5-in-1 reflector',
      'Sandbags',
      'Black / white boards',
    ],
  },
  {
    category: 'Backgrounds',
    items: [
      '5m white wall',
      'Automatic backdrop system',
      'Backdrop rack',
      '16 seamless colours:',
    ],
    swatches: true,
  },
  {
    category: 'Amenities',
    items: [
      'WiFi',
      'Fridge, microwave & kettle',
      'Full-length mirror',
      'Ladders',
      'Garment steamers & wardrobe stand',
      'Couches & tables',
      'Speakers',
    ],
  },
]

export function SpecSheet() {
  return (
    <section
      id="included"
      aria-labelledby="included-heading"
      className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36"
    >
      <FadeIn>
        <h2 id="included-heading" className="max-w-2xl font-display text-display-md text-balance">
          Everything on this list comes with the room.
        </h2>
        <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
          Three lights are always pre-set when you arrive — two continuous and one strobe — so you
          can start shooting the minute you walk in.
        </p>
      </FadeIn>

      <div className="mt-16">
        {SPEC.map((group, i) => (
          <FadeIn key={group.category}>
            <div className="grid gap-4 border-t border-line py-8 md:grid-cols-12 md:gap-8">
              <div className="flex items-baseline gap-4 md:col-span-4">
                <span className="font-display text-sm italic text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display font-semibold text-2xl">{group.category}</h3>
              </div>
              <div className="md:col-span-8">
                <ul className={group.swatches ? '' : 'md:columns-2 md:gap-12'}>
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="break-inside-avoid border-b border-line/70 py-2.5 text-sm leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
                {group.swatches && (
                  <>
                    <ul className="mt-6 grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-8">
                      {BACKDROP_COLOURS.map((c) => (
                        <li key={c.name}>
                          <span
                            aria-hidden
                            className="block aspect-[3/4] w-full border border-line/60"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="mt-1.5 block text-[10px] uppercase leading-tight tracking-wider text-muted">
                            {c.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 text-xs italic leading-relaxed text-muted">
                      Despite every effort to provide an accurate representation of each backdrop
                      colour, actual colours may vary slightly due to different device screen
                      settings.
                    </p>
                  </>
                )}
              </div>
            </div>
          </FadeIn>
        ))}
        <div className="border-t border-line" />
      </div>
    </section>
  )
}
