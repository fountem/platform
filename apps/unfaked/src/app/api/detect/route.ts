import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { runDetectionPipeline } from '@fountem/detection'
import { serialiseDetectionVerdict } from '@fountem/verdict'
import { createHash, randomBytes } from 'crypto'

export const maxDuration = 60 // Vercel function timeout

async function fetchVideoBuffer(url: string): Promise<Buffer> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'Unfaked/1.0 (unfaked.ai)' },
  })
  if (!response.ok) throw new Error(`Could not fetch video: ${response.status}`)

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('video') && !contentType.includes('octet-stream')) {
    // For social media URLs, we'd use a headless browser in production
    // For now, attempt direct fetch
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { video_url?: string }
    const videoUrl = body.video_url?.trim()

    if (!videoUrl) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 })
    }

    const db = createServiceClient()

    // Check for cached result by URL hash
    const urlHash = createHash('sha256').update(videoUrl).digest('hex')
    const { data: existing } = await db
      .from('video_detections')
      .select('*, correction_packs(*)')
      .eq('video_hash', urlHash)
      .single()

    if (existing) {
      const pack = (existing as any).correction_packs?.[0]
      if (pack) {
        const card = serialiseDetectionVerdict(existing, pack)
        return NextResponse.json(card)
      }
    }

    // Fetch video
    const videoBuffer = await fetchVideoBuffer(videoUrl)

    // Run 3-layer detection pipeline
    const detectionResult = await runDetectionPipeline(videoBuffer, videoUrl)

    // Save detection to database
    const { data: detection, error: detectionError } = await db
      .from('video_detections')
      .insert({
        video_url: videoUrl,
        video_hash: urlHash,
        verdict: detectionResult.verdict,
        confidence_pct: detectionResult.confidence_pct,
        probable_generator: detectionResult.probable_generator || null,
        reasoning: detectionResult.reasoning,
        what_would_change_this: detectionResult.what_would_change_this,
        evasion_detected: detectionResult.evasion_detected,
        evasion_description: detectionResult.evasion_description || null,
        layer1_signals: detectionResult.layer1_signals,
        layer2_signals: detectionResult.layer2_signals,
        layer3_signals: detectionResult.layer3_signals,
        is_public: true,
      })
      .select()
      .single()

    if (detectionError || !detection) {
      throw new Error(`Failed to save detection: ${detectionError?.message}`)
    }

    // Create correction pack
    const slug = randomBytes(4).toString('base64url')
    const { data: pack, error: packError } = await db
      .from('correction_packs')
      .insert({
        slug,
        detection_id: detection.id,
      })
      .select()
      .single()

    if (packError || !pack) {
      throw new Error(`Failed to create correction pack: ${packError?.message}`)
    }

    const card = serialiseDetectionVerdict(detection, pack)
    return NextResponse.json(card)
  } catch (error) {
    console.error('Detection error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Detection failed' },
      { status: 500 }
    )
  }
}
