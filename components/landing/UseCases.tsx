'use client'

import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'framer-motion'
import { FadeIn } from '@/components/motion/FadeIn'

/**
 * The work, as a typographic index. Desktop: hovering a line summons a
 * photograph that trails the cursor (text ↔ image interplay); rows slide in
 * on scroll. Touch devices get inline thumbnails instead — no hover needed.
 * Images map per-row in WORK below.
 */

const WORK = [
  { title: 'Portraits', note: 'headshots · family · maternity', img: '/images/studio-hero.webp' },
  { title: 'Fashion & lookbooks', note: 'seamless paper · strobes', img: '/images/studio-backdrops.webp' },
  { title: 'Content creation', note: 'reels · UGC · brand shoots', img: '/images/studio-kitchen.webp' },
  { title: 'Podcasts & interviews', note: 'soundproofed · two-camera', img: '/images/studio-lounge.webp' },
  { title: 'Video & film', note: 'lighting rigs · props · quiet', img: '/images/studio-lights.webp' },
  { title: 'Workshops', note: 'couches · tables · room to teach', img: '/images/studio-lounge.webp' },
]

export function UseCases() {
  const [active, setActive] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()

  // Cursor-trailing preview (desktop only; the layer is display:none on touch)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 })
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 })

  function onMouseMove(e: React.MouseEvent) {
    const rect = sectionRef.current?.getBoundingClientRect()
    if (!rect) return
    mx.set(e.clientX - rect.left)
    my.set(e.clientY - rect.top)
  }

  return (
    <section
      ref={sectionRef}
      id="work"
      aria-labelledby="work-heading"
      onMouseMove={reduce ? undefined : onMouseMove}
      className="relative border-t border-line"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
        <FadeIn>
          <h2 id="work-heading" className="max-w-2xl font-display text-display-md text-balance">
            One room, every kind of shoot.
          </h2>
        </FadeIn>

        <ul className="mt-14 border-b border-line">
          {WORK.map((w, i) => (
            <motion.li
              key={w.title}
              initial={reduce ? false : { opacity: 0, x: -32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: i * 0.04 }}
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive((a) => (a === i ? null : a))}
              className="group border-t border-line"
            >
              <div className="flex items-center gap-6 py-6 md:gap-10 md:py-8">
                <span className="w-8 shrink-0 font-display text-sm italic text-accent">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-display text-3xl font-semibold tracking-tight transition-all duration-300 md:text-5xl ${
                      active === i ? 'text-accent' : active === null ? 'text-ink' : 'text-muted/40'
                    } md:group-hover:translate-x-3`}
                  >
                    {w.title}
                  </h3>
                  <p className="mt-1.5 text-xs uppercase tracking-[0.18em] text-muted">{w.note}</p>
                </div>
                {/* Inline thumbnail — touch devices only */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={w.img}
                  alt=""
                  loading="lazy"
                  className="touch-only h-20 w-16 shrink-0 object-cover"
                />
              </div>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Cursor-trailing photograph — hover devices only */}
      {!reduce && (
        <motion.div
          aria-hidden
          style={{ x, y }}
          className="hover-only pointer-events-none absolute left-0 top-0 z-10"
        >
          <AnimatePresence>
            {active !== null && (
              <motion.img
                key={WORK[active].title}
                src={WORK[active].img}
                alt=""
                initial={{ opacity: 0, scale: 0.85, rotate: -3 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="-ml-28 -mt-40 h-72 w-56 object-cover shadow-2xl"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  )
}
