const ITEMS = [
  'Natural light',
  'Soundproofed',
  'Three lights pre-set',
  'Automatic backdrops',
  'From $60/hr',
  'Sembawang, Singapore',
]

/**
 * Slow typographic marquee — one moving element between the hero and the
 * content. Pure CSS animation (see globals.css); pauses on hover and is
 * disabled entirely for prefers-reduced-motion.
 */
export function Marquee() {
  // Track is duplicated so the -50% translate loops seamlessly
  const track = [...ITEMS, ...ITEMS]
  return (
    <div aria-hidden className="group select-none overflow-hidden bg-cocoa py-5">
      <div className="marquee-track flex w-max items-baseline gap-10 whitespace-nowrap group-hover:[animation-play-state:paused]">
        {track.map((item, i) => (
          <span key={i} className="flex items-baseline gap-10">
            <span className="font-display text-2xl font-semibold uppercase tracking-tight text-paper md:text-3xl">
              {item}
            </span>
            <span className="text-xl text-accent-light">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}
