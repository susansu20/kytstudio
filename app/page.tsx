import { BookingWidget } from '@/components/booking/BookingWidget'
import { ExtrasSheet } from '@/components/landing/ExtrasSheet'
import { Footer } from '@/components/landing/Footer'
import { GoodToKnow } from '@/components/landing/GoodToKnow'
import { Marquee } from '@/components/landing/Marquee'
import { UseCases } from '@/components/landing/UseCases'
import { Hero } from '@/components/landing/Hero'
import { LocationContact } from '@/components/landing/LocationContact'
import { Nav } from '@/components/landing/Nav'
import { Rates } from '@/components/landing/Rates'
import { SpecSheet } from '@/components/landing/SpecSheet'
import { TheSpace } from '@/components/landing/TheSpace'
import { FadeIn } from '@/components/motion/FadeIn'
import { bookingConfig } from '@/lib/booking.config'

const b = bookingConfig.business

// LocalBusiness structured data for "rent photo studio singapore" queries
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: b.name,
  legalName: b.legalName,
  description:
    'Natural-light photo and video studio for hourly rental in Singapore. White walls, excellent soundproofing, studio lighting included.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://book.kytstudio.net',
  telephone: b.phone,
  email: b.email,
  priceRange: '$$',
  image: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://book.kytstudio.net'}/opengraph-image`,
  address: {
    '@type': 'PostalAddress',
    streetAddress: `${b.address.street}, ${b.address.building}`,
    addressLocality: 'Singapore',
    postalCode: b.address.postalCode.replace('Singapore ', ''),
    addressCountry: 'SG',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: b.address.geo.lat,
    longitude: b.address.geo.lng,
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    opens: '10:00',
    closes: '22:00',
  },
  sameAs: [b.instagram, b.youtube, b.facebook],
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <TheSpace />
        <UseCases />
        <Rates />
        <SpecSheet />
        <ExtrasSheet />
        <GoodToKnow />

        {/* booking */}
        <section
          id="book"
          aria-labelledby="book-heading"
          className="border-t border-line scroll-mt-4"
        >
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-36">
            <FadeIn>
              <h2 id="book-heading" className="max-w-2xl font-display text-display-md text-balance">
                Pick a date.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
                Live availability from the studio calendar — what you see is what’s open. No
                payment online; we invoice via PayNow.
              </p>
            </FadeIn>
            <div className="mt-14">
              <BookingWidget />
            </div>
          </div>
        </section>

        <LocationContact />
      </main>
      <Footer />
    </>
  )
}
