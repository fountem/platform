import { ImageResponse } from 'next/og'

export const alt = 'Fountem — Evidence-backed political intelligence for the UK'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function shield(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z" fill="${color}" fill-opacity="0.12" stroke="${color}" stroke-width="1.5"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
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
          background: '#faf8f3',
          borderLeft: '14px solid #245233',
          padding: '80px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={shield('#245233')} width={64} height={64} alt="" />
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 700, letterSpacing: 12, color: '#245233' }}>
            FOUNTEM
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div style={{ display: 'flex', fontSize: 70, fontWeight: 800, color: '#1c1c1e', lineHeight: 1.05, maxWidth: 1000 }}>
            The truth has never needed more defending.
          </div>
          <div style={{ display: 'flex', fontSize: 33, color: '#545456', maxWidth: 920 }}>
            Unfaked detects the deepfakes. Fountem explains the claims.
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#8a8a8e' }}>fountem.com · unfaked.ai</div>
      </div>
    ),
    { ...size },
  )
}
