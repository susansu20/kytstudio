import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'The Kyt Studio — natural-light photo studio for rent in Singapore'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Generated OG image in the site's editorial style. Replace with a real
// studio photograph (app/opengraph-image.jpg) once photography is ready.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FAF8F4',
          color: '#161514',
          padding: '64px 72px',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#6E6A63' }}>
          The Kyt Studio · Singapore
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: '-0.02em', maxWidth: 980 }}>
            A natural-light photo studio, hired by the hour.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 28, color: '#6E6A63' }}>White walls · Soundproofed · Lights included</div>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <div style={{ fontSize: 72 }}>$60</div>
            <div style={{ fontSize: 28, color: '#6E6A63', marginLeft: 8 }}>/hr</div>
          </div>
        </div>
      </div>
    ),
    size
  )
}
