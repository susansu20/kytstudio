import type { Metadata } from 'next'
import { Lato, Montserrat } from 'next/font/google'
import './globals.css'

// Brand pairing: Montserrat (geometric display/headings) + Lato (round, friendly body)
const display = Montserrat({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const body = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-body',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://book.kytstudio.net'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Rent a Photo Studio in Singapore | The Kyt Studio — Natural Light, Hourly',
    template: '%s | The Kyt Studio',
  },
  description:
    'Natural-light photo & video studio for rent in Singapore. White walls, excellent soundproofing, lights included. From $50/hr, book online by the hour.',
  keywords: [
    'rent photo studio singapore',
    'photo studio hourly rental singapore',
    'natural light studio singapore',
    'video studio rental singapore',
    'podcast studio singapore',
  ],
  alternates: {
    // While on book.kytstudio.net this is self-canonical; when the page moves
    // to kytstudio.net/studio-rental, point this there and 301 the subdomain.
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_SG',
    url: SITE_URL,
    siteName: 'The Kyt Studio',
    title: 'Rent a Photo Studio in Singapore — The Kyt Studio',
    description:
      'A natural-light studio with white walls and serious soundproofing. From $50/hr, book online.',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG" className={`${display.variable} ${body.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
