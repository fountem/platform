import { NextRequest } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { serialiseDetectionVerdict } from '@fountem/verdict'

// Dynamic OG image using Next.js ImageResponse
// Falls back to a static SVG if ImageResponse isn't available
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  let verdictLabel = 'ANALYSED'
  let confidence = '—'
  let colour = '#64748b'
  let generator = ''

  if (slug) {
    try {
      const db = createServiceClient()
      const { data: pack } = await db
        .from('correction_packs')
        .select('*, video_detections(*)')
        .eq('slug', slug)
        .single()

      if (pack) {
        const card = serialiseDetectionVerdict((pack as any).video_detections, pack)
        verdictLabel = card.verdict_label
        confidence = `${card.confidence_pct}%`
        colour = card.verdict_colour
        generator = card.probable_generator_label ?? ''
      }
    } catch { /* fallback to defaults */ }
  }

  const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0a0a0a"/>
  <rect x="0" y="0" width="6" height="630" fill="${colour}"/>
  <text x="80" y="120" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" fill="#71717a" letter-spacing="8">UNFAKED</text>
  <text x="80" y="320" font-family="Inter, Arial, sans-serif" font-size="80" font-weight="800" fill="${colour}">${verdictLabel}</text>
  <text x="80" y="420" font-family="Inter, Arial, sans-serif" font-size="48" font-weight="400" fill="#a1a1aa">${confidence} confidence</text>
  ${generator ? `<text x="80" y="490" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="400" fill="#52525b">Probable generator: ${generator}</text>` : ''}
  <text x="80" y="580" font-family="Inter, Arial, sans-serif" font-size="22" font-weight="400" fill="#3f3f46">unfaked.ai · Powered by Fountem</text>
</svg>`

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  })
}
