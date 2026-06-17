import { runLayer1 } from './layer1-forensic'
import { runLayer2FromResolved, runLayer2FromBuffer } from './layer2-provenance'
import { runLayer3 } from './layer3-contextual'
import { analyseTemporal } from './temporal'
import { synthesiseVerdict } from './synthesiser'
import { getMediaBuffer, type ResolvedMedia } from './resolver'
import type { Layer1Signals, Layer2Signals, Layer3Signals, SignalBreakdown } from '@fountem/db'

export interface DetectionResult {
  verdict: string
  confidence_pct: number
  confidence_low: number
  confidence_high: number
  probable_generator: string | null
  reasoning: string
  what_would_change_this: string
  evasion_detected: string
  evasion_description: string | null
  vendor_disagreement: boolean
  signal_breakdown: SignalBreakdown
  layer1_signals: Layer1Signals
  layer2_signals: Layer2Signals
  layer3_signals: Layer3Signals
}

async function bufferFromMedia(media: ResolvedMedia, fetchImpl: typeof fetch): Promise<Buffer> {
  const inline = getMediaBuffer(media)
  if (inline) return inline
  if (media.media_url) {
    // media_url is our own pre-signed S3 URL produced by the resolver — safe to fetch.
    const res = await fetchImpl(media.media_url)
    if (!res.ok) throw new Error(`Failed to fetch resolved media: ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
  throw new Error('Resolved media contained neither inline bytes nor a media_url')
}

export interface PipelineOptions {
  fetchImpl?: typeof fetch
}

/**
 * Run the full multi-signal detection pipeline over media already resolved by the
 * AWS resolver service (which handled download, ffprobe, C2PA and cross-modal work).
 */
export async function runDetectionPipeline(
  media: ResolvedMedia,
  opts: PipelineOptions = {}
): Promise<DetectionResult> {
  const fetchImpl = opts.fetchImpl ?? fetch
  const buffer = await bufferFromMedia(media, fetchImpl)

  // Layer 1 (forensic) — needs raw bytes. Layer 2 (provenance) — from resolver.
  const [l1, l2base] = await Promise.all([
    runLayer1(buffer, media.source_url, { qualityDegraded: media.low_quality, fetchImpl }),
    Promise.resolve(runLayer2FromResolved(media)),
  ])
  const l2: Layer2Signals = l2base

  const layer1Score = Math.max(l1.hive_ai_generated_score, l1.hive_deepfake_score)
  const temporal = analyseTemporal(media.ffprobe.keyframe_intervals)

  const l3 = await runLayer3({
    videoUrl: media.source_url,
    layer1Score,
    layer2Valid: l2.c2pa_valid,
    platform: media.platform,
    crossModal: media.cross_modal,
  })
  l3.clip_transition_intervals = temporal.clip_transition_intervals

  return assemble(l1, l2, l3)
}

/**
 * Fallback pipeline for a raw buffer with no resolver metadata (e.g. direct upload).
 * Provenance + contextual signals are limited; used only when the resolver is bypassed.
 */
export async function runDetectionPipelineFromBuffer(
  videoBuffer: Buffer,
  videoUrl: string,
  opts: PipelineOptions = {}
): Promise<DetectionResult> {
  const l1 = await runLayer1(videoBuffer, videoUrl, { fetchImpl: opts.fetchImpl })
  const l2 = runLayer2FromBuffer(videoBuffer)
  const l3: Layer3Signals = {
    channel_age_days: null,
    channel_video_count: null,
    audio_cleanliness_score: null,
    clip_transition_intervals: null,
    behavioural_plausibility_score: null,
    contextual_red_flags: [],
    audio_visual_sync_score: null,
    lip_sync_anomaly: false,
  }
  return assemble(l1, l2, l3)
}

function assemble(l1: Layer1Signals, l2: Layer2Signals, l3: Layer3Signals): DetectionResult {
  const synthesis = synthesiseVerdict(l1, l2, l3)
  return {
    verdict: synthesis.verdict,
    confidence_pct: synthesis.confidence_pct,
    confidence_low: synthesis.confidence_low,
    confidence_high: synthesis.confidence_high,
    probable_generator: synthesis.probable_generator,
    reasoning: synthesis.reasoning,
    what_would_change_this: synthesis.what_would_change_this,
    evasion_detected: synthesis.evasion_detected,
    evasion_description: synthesis.evasion_description,
    vendor_disagreement: synthesis.vendor_disagreement,
    signal_breakdown: synthesis.signal_breakdown,
    layer1_signals: l1,
    layer2_signals: l2,
    layer3_signals: l3,
  }
}

/**
 * Decide whether a detection should be escalated to the human-review queue.
 * High-stakes = low-confidence band straddling the midpoint, vendor disagreement,
 * or an inconclusive verdict. (Named-politician / virality checks happen in the app.)
 */
export function shouldEscalateForReview(result: DetectionResult): boolean {
  if (result.vendor_disagreement) return true
  if (result.verdict === 'inconclusive') return true
  // Band spans the real/AI boundary (50%) → genuinely uncertain.
  if (result.confidence_low < 50 && result.confidence_high > 50) return true
  return false
}
