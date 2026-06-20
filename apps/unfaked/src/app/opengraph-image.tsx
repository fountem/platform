import { ImageResponse } from 'next/og'

export const alt = 'Unfaked — Detect AI-generated political video'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function shield(stroke: string, check: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z" fill="${stroke}" fill-opacity="0.14" stroke="${stroke}" stroke-width="1.5"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="${check}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#0d1f14',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shield('#faf8f3', '#5ba07b')} width={68} height={68} alt="" />
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700, letterSpacing: 14, color: '#86c19b' }}>
            UNFAKED
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, color: '#faf8f3', lineHeight: 1.05, maxWidth: 980 }}>
            Detect AI-generated political video
          </div>
          <div style={{ display: 'flex', fontSize: 34, color: '#9bb5a6', maxWidth: 900 }}>
            Calibrated, evidence-backed verdicts that show their working.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#5e7a67' }}>unfaked.ai · Powered by Fountem</div>
      </div>
    ),
    { ...size },
  )
}
