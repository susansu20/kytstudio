export function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a href="#top" className="inline-flex items-center">
          {/* White mark — the nav only ever sits over the dark hero photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/logo-white.png"
            alt="The Kyt Studio"
            width={50}
            height={45}
            className="h-10 w-auto"
          />
        </a>
        <a
          href="#book"
          className="border border-paper/70 px-4 py-2 text-xs uppercase tracking-[0.2em] text-paper transition-colors hover:border-paper"
        >
          Book
        </a>
      </div>
    </header>
  )
}
