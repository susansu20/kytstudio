import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Monochrome editorial palette — the photography carries the colour.
        paper: '#FAF8F4',
        ink: '#161514',
        muted: '#6E6A63',
        line: '#E4E0D7',
        // Brand colour: dark brick red — used on surfaces, numerals and
        // interactive states, not just links.
        accent: {
          DEFAULT: '#7E2A1A',
          hover: '#5F1F12',
          // lighter brick for use on dark surfaces (cocoa, ink)
          light: '#C05C38',
        },
        // Deep espresso brown for the marquee band and footer.
        cocoa: {
          DEFAULT: '#33241B',
          deep: '#241912',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Montserrat', 'Arial', 'sans-serif'],
        sans: ['var(--font-body)', 'Lato', 'Arial', 'sans-serif'],
      },
      fontSize: {
        // Oversized display steps for the rates-as-typography treatment
        // (Montserrat runs wide — slightly smaller max sizes, tighter tracking)
        'display-lg': ['clamp(2.5rem, 6.5vw, 5.75rem)', { lineHeight: '1.02', letterSpacing: '-0.03em', fontWeight: '600' }],
        'display-md': ['clamp(2.25rem, 5.5vw, 4.5rem)', { lineHeight: '1.05', letterSpacing: '-0.025em', fontWeight: '600' }],
        'display-sm': ['clamp(1.6rem, 3.5vw, 2.5rem)', { lineHeight: '1.12', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.25s ease-out',
        'accordion-up': 'accordion-up 0.25s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
