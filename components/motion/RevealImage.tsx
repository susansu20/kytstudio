'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Scroll-driven image reveal: the frame unmasks upward while the image
 * settles from a slight zoom — photography-site treatment, all
 * transform/clip based so it stays smooth. Falls back to static for
 * prefers-reduced-motion.
 */
export function RevealImage({
  src,
  alt,
  className,
  imgClassName,
  delay = 0,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  delay?: number
}) {
  const reduce = useReducedMotion()

  if (reduce) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading="lazy" className={`${className ?? ''} ${imgClassName ?? ''}`} />
    )
  }

  return (
    <motion.div
      className={`overflow-hidden ${className ?? ''}`}
      initial={{ clipPath: 'inset(100% 0% 0% 0%)' }}
      whileInView={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 1.1, ease: [0.65, 0, 0.35, 1], delay }}
    >
      <motion.img
        src={src}
        alt={alt}
        loading="lazy"
        className={`h-full w-full object-cover ${imgClassName ?? ''}`}
        initial={{ scale: 1.18 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay }}
      />
    </motion.div>
  )
}
