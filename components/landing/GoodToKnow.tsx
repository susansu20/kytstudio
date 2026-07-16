import { FadeIn } from '@/components/motion/FadeIn'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const FAQ: { q: string; a: React.ReactNode }[] = [
  {
    q: 'First time renting with us?',
    a: 'We’ll meet you at the studio for a 15-minute orientation before your slot — how the lights work, where everything lives, how to close up. Returning renters skip this and receive a door access code by text or email before each session.',
  },
  {
    q: 'How early can I arrive, and what about overruns?',
    a: 'Arrive up to 15 minutes before your booking to settle in. After your slot there’s a 15-minute grace period for cleanup. If no one is booked after you, extensions are welcome at the regular hourly rate — we’ll invoice the difference via PayNow.',
  },
  {
    q: 'Footwear and backdrops',
    a: 'Footwear comes off at the entrance. If your shoot needs shoes on the backdrops or seamless paper, tape the soles first — tape is in the studio.',
  },
  {
    q: 'Shooting sensitive or private content?',
    a: 'The studio’s web cameras can be shut down for your session against a refundable security deposit. Leave a note in the booking form’s special-requests field and we’ll arrange it before you arrive.',
  },
  {
    q: 'Leaving when no one’s around?',
    a: 'If you’re the last session of the day, closing-up is simple: lights off, aircon off, door pulled shut until it locks. Full instructions are in your confirmation email and posted by the door.',
  },
  {
    q: 'Not sure how to set up the lights?',
    a: (
      <>
        Three lights are always pre-set (two continuous, one strobe), and our{' '}
        <a
          href="https://kytstudio.net/guide-to-basic-set-ups"
          target="_blank"
          rel="noopener noreferrer"
          className="text-ink underline decoration-line underline-offset-4 hover:text-accent hover:decoration-accent"
        >
          Guide to Basic Set-ups
        </a>{' '}
        walks through common arrangements. Setup assistance beyond the basics is available as a
        chargeable add-on, and a pre-shoot lighting trial is $100/hr.
      </>
    ),
  },
]

export function GoodToKnow() {
  return (
    <section
      id="good-to-know"
      aria-labelledby="gtk-heading"
      className="border-t border-line"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <FadeIn className="md:col-span-4">
            <h2 id="gtk-heading" className="font-display text-display-md text-balance">
              Frequently asked questions.
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="md:col-span-8">
            <Accordion type="single" collapsible className="border-b border-line">
              {FAQ.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger>{item.q}</AccordionTrigger>
                  <AccordionContent>{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
