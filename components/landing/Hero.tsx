'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { HeroBookingCard } from '@/components/booking/HeroBookingCard'

/**
 * Full-bleed hero: short headline left, live availability card right —
 * booking starts above the fold. On small screens the card gives way to a
 * CTA that jumps to the full widget.
 */
export function Hero() {
  const reduce = useReducedMotion()
  const ease = [0.22, 1, 0.36, 1] as const
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col justify-center">
      <motion.div
        aria-hidden
        className="absolute inset-0 overflow-hidden"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
      >
        {/* Slow Ken Burns drift keeps the photograph alive without stealing focus */}
        <motion.img
          src="/images/studio-hero.webp"
          alt=""
          fetchPriority="high"
          className="h-full w-full object-cover"
          initial={reduce ? false : { scale: 1 }}
          animate={reduce ? undefined : { scale: 1.07 }}
          transition={{ duration: 14, ease: 'linear' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/45 to-ink/25" />
      </motion.div>

      <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-[1.05fr,0.95fr] lg:gap-16 lg:px-10">
        <div>
          <motion.p
            className="text-xs uppercase tracking-[0.3em] text-paper/80"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease }}
          >
            5 min drive from Sembawang MRT · 8 min from Woodlands MRT
          </motion.p>
          <motion.h1
            className="mt-5 font-display text-display-lg text-paper text-balance"
            initial={reduce ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.45, ease }}
          >
            Photo & video studio rental in the north of Singapore.
          </motion.h1>
          <motion.p
            className="mt-6 max-w-md text-base leading-relaxed text-paper/85"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.65, ease }}
          >
            White walls, window light and serious soundproofing — from $60/hr, lights included.
          </motion.p>
          <motion.div
            className="mt-8 lg:hidden"
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.8, ease }}
          >
            <a
              href="#book"
              className="inline-flex h-14 items-center justify-center bg-accent px-10 text-sm font-medium text-paper transition-colors hover:bg-paper hover:text-ink"
            >
              Check availability
            </a>
          </motion.div>
        </div>

        {/* Live availability, above the fold — desktop only */}
        <motion.div
          className="hidden lg:block"
          initial={reduce ? false : { opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease }}
        >
          <HeroBookingCard />
        </motion.div>
      </div>
    </section>
  )
}
