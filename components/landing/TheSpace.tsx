import { FadeIn } from '@/components/motion/FadeIn'
import { Parallax } from '@/components/motion/Parallax'
import { RevealImage } from '@/components/motion/RevealImage'

/**
 * Asymmetric editorial layout: text column offset against a staggered image
 * pair, images unmasking on scroll. Closes with a full-bleed shot of the
 * backdrop rack — the one moment where the studio's own colour floods the page.
 */
export function TheSpace() {
  return (
    <section id="space" aria-labelledby="space-heading">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <FadeIn className="md:col-span-5 md:pt-24">
            {/* TODO: confirm floor area with the studio — current site says "1690 square
                metres", which is almost certainly square FEET. */}
            <h2 id="space-heading" className="font-display text-display-md text-balance">
              1,690 sq ft of shooting room.
            </h2>
            <div className="mt-8 max-w-md space-y-5 text-base leading-relaxed text-muted">
              <p>
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

          <div className="md:col-span-7">
            <RevealImage
              src="/images/studio-lights.webp"
              alt="The studio with softboxes, octabox and equipment cart set against the white wall"
              className="aspect-[3/2] w-full"
            />
            <Parallax amount={40} className="mt-8 md:-mt-12 md:ml-24">
              <RevealImage
                src="/images/studio-lounge.webp"
                alt="The lounge corner — white sofa, blue velvet armchair and coffee table"
                className="aspect-[4/3] w-full md:w-4/5"
                delay={0.1}
              />
            </Parallax>
          </div>
        </div>

        <div className="mt-20 grid gap-12 md:grid-cols-12 md:gap-8">
          <FadeIn className="md:col-span-7">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/floorplan.svg"
              alt="Floor plan of The Kyt Studio"
              loading="lazy"
              className="w-full border border-line bg-white object-cover"
            />
            <p className="mt-3 text-xs uppercase tracking-[0.15em] text-muted">Floor plan</p>
          </FadeIn>
          <Parallax amount={28} className="md:col-span-5 md:self-end">
            <RevealImage
              src="/images/studio-kitchen.webp"
              alt="Matte black tap on the kitchen island"
              className="aspect-[4/5] w-full"
              imgClassName="object-[30%_50%]"
            />
          </Parallax>
        </div>
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
