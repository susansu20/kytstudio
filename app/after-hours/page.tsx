import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AfterHoursForm } from '@/components/booking/AfterHoursForm'
import { Footer } from '@/components/landing/Footer'

export const metadata: Metadata = {
  title: 'After-hours booking request (11pm–6am)',
  description:
    'Request an overnight session at The Kyt Studio, Singapore. After-hours shoots (11pm–6am) are arranged personally — tell us about your shoot.',
  robots: { index: false },
}

export default function AfterHoursPage() {
  return (
    <>
      <main className="mx-auto max-w-3xl px-6 py-16 lg:py-24">
        <Link
          href="/#rates"
          className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.15em] text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Back to the studio
        </Link>
        <p className="mt-10 text-xs uppercase tracking-[0.3em] text-accent">After hours · 11pm–6am</p>
        <h1 className="mt-5 font-display text-display-md text-balance">
          Overnight session enquiries.
        </h1>
        <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
          Overnight sessions aren’t bookable online. Tell us what you’re planning and we’ll come
          back with availability and a quote — this is an enquiry, not an instant confirmation.
        </p>
        <div className="mt-12">
          <AfterHoursForm />
        </div>
      </main>
      <Footer />
    </>
  )
}
