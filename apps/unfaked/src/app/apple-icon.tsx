import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

function shield(stroke: string, check: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5l-8-3Z" fill="${stroke}" fill-opacity="0.16" stroke="${stroke}" stroke-width="1.5"/><path d="m8.5 12 2.5 2.5 4.5-5" stroke="${check}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0d1f14',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={shield('#faf8f3', '#5ba07b')} width={120} height={120} alt="" />
      </div>
    ),
    { ...size },
  )
}
