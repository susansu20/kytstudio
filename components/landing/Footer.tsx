import { bookingConfig } from '@/lib/booking.config'

export function Footer() {
  return (
    <footer className="bg-cocoa text-paper">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logo-white.png"
          alt="The Kyt Studio"
          width={50}
          height={45}
          className="h-12 w-auto"
        />
        <p className="mt-8 border-t border-paper/15 pt-6 text-xs text-paper/50">
          © {new Date().getFullYear()} {bookingConfig.business.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
