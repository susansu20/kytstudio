import { FadeIn } from '@/components/motion/FadeIn'
import { Parallax } from '@/components/motion/Parallax'
import { RevealImage } from '@/components/motion/RevealImage'

/**
 * The space: text intro, a uniform three-up photo grid (identical sizes,
 * aligned edges — no staggering), the floor plan full width, then the
 * full-bleed backdrop-rack colour moment.
 */

const PHOTOS = [
  {
    src: '/images/studio-lights.webp',
    alt: 'The studio with softboxes, octabox and equipment cart set against the white wall',
  },
  {
    src: '/images/studio-lounge.webp',
    alt: 'The lounge corner — white sofa, blue velvet armchair and coffee table',
  },
  {
    src: '/images/studio-kitchen.webp',
    alt: 'Matte black tap on the kitchen island',
  },
]

export function TheSpace() {
  return (
    <section id="space" aria-labelledby="space-heading">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
        <div className="grid gap-10 md:grid-cols-12 md:gap-8">
          <FadeIn className="md:col-span-6">
            <h2 id="space-heading" className="font-display text-display-md text-balance">
              1,690 square feet of room to shoot.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="md:col-span-6">
            <div className="max-w-md space-y-5 text-base leading-relaxed text-muted md:ml-auto">
              <p>
                {/* TODO: confirm floor area with the studio — current site says "1690 square
                    metres", which is almost certainly square FEET. */}
                White walls on every side and abundant natural light through the day — it turns
                golden and soft around 5–6pm, if you’re chasing that.
              </p>
              <p>
                The soundproofing is the quiet flex: no passing planes, no construction next door.
                Quiet enough to roll audio for interviews, podcasts and video without a second
                take.
              </p>
            </div>
          </FadeIn>
        </div>

        {/* Uniform photo grid — identical width and height, aligned edges */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {PHOTOS.map((photo, i) => (
            <RevealImage
              key={photo.src}
              src={photo.src}
              alt={photo.alt}
              className="aspect-[4/3] w-full"
              delay={i * 0.08}
            />
          ))}
        </div>

        {/* Floor plan — full content width */}
        <FadeIn className="mt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/floorplan.svg"
            alt="Floor plan of The Kyt Studio"
            loading="lazy"
            className="w-full border border-line bg-white"
          />
          <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted">Floor plan</p>
        </FadeIn>
      </div>

      {/* Full-bleed colour moment: the backdrop rack, edge to edge.
          (The section has no max-width, so plain w-full bleeds fully — never
          put layout transforms on Parallax; framer owns its transform.) */}
      <Parallax amount={24}>
        <RevealImage
          src="/images/studio-backdrops.webp"
          alt="The backdrop rack — dozens of seamless paper rolls in every colour"
          className="h-[55vh] w-full md:h-[75vh]"
        />
      </Parallax>
      <div className="mx-auto max-w-7xl px-6 pt-4 lg:px-10">
        <p className="text-xs uppercase tracking-[0.15em] text-muted">
          The backdrop rack — pick a colour, we’ll have it hung before you arrive.
        </p>
      </div>
    </section>
  )
}
