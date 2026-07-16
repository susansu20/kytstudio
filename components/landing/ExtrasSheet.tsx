import { FadeIn } from '@/components/motion/FadeIn'

/**
 * Rentable extras — same editorial index treatment as the spec sheet,
 * clearly separated from what's included in the hourly rate.
 */

const EXTRAS: { category: string; items: string[] }[] = [
  {
    category: 'Equipment',
    items: [
      'Canon 7D',
      'Canon 5D Mark III full-frame camera',
      'Canon 24–70mm f/2.8 lens',
      'Canon 17–40mm f/4 lens',
      'Sony A7III camera',
      'Aputure 300X light',
      'Aputure 60X light',
      'Aputure 60X spotlight mount',
      'Nanlite PavoTube (2 ft) × 2',
      'Godox UB-165 umbrella with sock',
      'Optical snoot (Bowens mount)',
    ],
  },
  {
    category: 'Props',
    items: [
      'Water supply to the kitchen island',
      'Disco ball',
      'Basketball',
      'Fog machine',
      'Projector',
      'Drink glasses',
      'Plates & bowls',
    ],
  },
]

export function ExtrasSheet() {
  return (
    <section
      id="extras"
      aria-labelledby="extras-heading"
      className="border-t border-line bg-white/40"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
        <FadeIn>
          <h2 id="extras-heading" className="max-w-2xl font-display text-display-md text-balance">
            Cameras, cinema lights and props, on request.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Camera rental starts from $70/day and a pre-shoot lighting trial is $100/hr — mention
            what you need in your booking notes and we’ll confirm pricing.
          </p>
        </FadeIn>

        <div className="mt-16">
          {EXTRAS.map((group, i) => (
            <FadeIn key={group.category}>
              <div className="grid gap-4 border-t border-line py-8 md:grid-cols-12 md:gap-8">
                <div className="flex items-baseline gap-4 md:col-span-4">
                  <span className="font-display text-sm italic text-accent">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display font-semibold text-2xl">{group.category}</h3>
                </div>
                <ul className="md:col-span-8 md:columns-2 md:gap-12">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="break-inside-avoid border-b border-line/70 py-2.5 text-sm leading-relaxed"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
          <div className="border-t border-line" />
        </div>
      </div>
    </section>
  )
}
