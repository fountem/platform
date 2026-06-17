/**
 * Offline fixtures for detection. Active only when MOCK_SERVICES is set.
 *
 * These replace the AWS resolver (resolveMedia), the forensic vendors (Hive/Sensity,
 * layer 1) and the contextual model (layer 3) with deterministic, input-varied data,
 * so `runDetectionPipeline` produces a real, fully-synthesised verdict locally with no
 * keys. Output is steered by keywords in the URL so demos are predictable:
 *   - "real" / "authentic" / "c2pa" / "genuine"  → provenance-backed real verdict
 *   - "deepfake" / "fake" / "synthetic" / "aigen" / "generated" / "sora" → AI verdict
 *   - anything else → seeded forensic-ensemble verdict (often inconclusive/likely)
 */

import type { Layer1Signals, Layer3Signals } from '@fountem/db'
import type { ResolvedMedia } from './resolver'
import type { Layer3Input } from './layer3-contextual'

export function isMockMode(): boolean {
  const v = process.env.MOCK_SERVICES ?? process.env.NEXT_PUBLIC_MOCK_SERVICES
  return v === '1' || v === 'true'
}

function seededUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

type Hint = 'ai' | 'real' | 'neutral'

function hintFrom(url: string): Hint {
  const u = url.toLowerCase()
  if (/(deepfake|\bfake\b|synthetic|aigen|ai-generated|ai_generated|generated|sora|veo|kling|runway)/.test(u)) return 'ai'
  if (/(\breal\b|authentic|c2pa|genuine|verified)/.test(u)) return 'real'
  return 'neutral'
}

export function mockResolveMedia(url: string): ResolvedMedia {
  const hint = hintFrom(url)
  const r = seededUnit(url)
  const provenanceReal = hint === 'real'
  const isAi = hint === 'ai'

  // Keyframe intervals: regular for real, irregular (splice-like) for AI, seeded otherwise.
  const keyframes = provenanceReal
    ? [2, 2, 2, 2, 2]
    : isAi
      ? [2, 0.4, 2.3, 0.5, 1.9]
      : Array.from({ length: 5 }, (_, i) => 1.8 + seededUnit(`${url}:kf:${i}`) * 0.6)

  return {
    buffer_base64: Buffer.from(`mock-media:${url}`).toString('base64'),
    media_url: null,
    content_type: 'video/mp4',
    size_bytes: 1_200_000 + Math.floor(r * 8_000_000),
    content_sha256: `mock${Math.floor(r * 1e12).toString(16)}`,
    source_url: url,
    ffprobe: {
      container_format: 'mov,mp4,m4a',
      video_codec: 'h264',
      audio_codec: 'aac',
      duration_sec: 12 + Math.floor(r * 90),
      width: provenanceReal || !isAi ? 1920 : 1280,
      height: provenanceReal || !isAi ? 1080 : 720,
      bitrate: 2_500_000,
      frame_count: 300 + Math.floor(r * 600),
      avg_frame_rate: 25,
      creation_time: '2026-05-01T10:00:00Z',
      has_audio: true,
      keyframe_intervals: keyframes,
    },
    c2pa: {
      manifest_present: provenanceReal,
      valid: provenanceReal,
      provenance_chain: provenanceReal ? ['Capture: Sony A7', 'Edit: Adobe Premiere'] : [],
      generator: null,
      signature_issuer: provenanceReal ? 'Truepic' : null,
    },
    watermark: {
      // SynthID present ⇒ decisive AI provenance signal.
      synthid_detected: isAi ? true : provenanceReal ? false : null,
      other_watermark: null,
    },
    cross_modal: {
      av_sync_score: isAi ? 0.42 : 0.93,
      lip_sync_anomaly: isAi,
      audio_cleanliness_score: isAi ? 0.95 : 0.6,
    },
    platform: {
      platform: 'youtube',
      channel_id: `mock-${Math.floor(r * 1e6)}`,
      channel_age_days: isAi ? 9 : 1600 + Math.floor(r * 2000),
      channel_video_count: isAi ? 2 : 120 + Math.floor(r * 400),
      upload_date: '2026-05-20',
      view_count: Math.floor(r * 500_000),
      title: isAi ? 'BREAKING: leaked clip' : 'Press conference highlights',
      description: null,
    },
    low_quality: !provenanceReal && !isAi && r < 0.2,
  }
}

export function mockLayer1(videoUrl: string, qualityDegraded: boolean): Layer1Signals {
  const hint = hintFrom(videoUrl)
  const r = seededUnit(`l1:${videoUrl}`)
  if (hint === 'ai') {
    return {
      hive_ai_generated_score: 0.88 + r * 0.1,
      hive_deepfake_score: 0.82 + r * 0.12,
      sensity_score: 0.86 + r * 0.1,
      temporal_inconsistency: true,
      physics_anomaly: r > 0.5,
      texture_artifacts: true,
      generator_fingerprint: 'sora',
      quality_degraded: qualityDegraded,
    }
  }
  if (hint === 'real') {
    return {
      hive_ai_generated_score: 0.04 + r * 0.06,
      hive_deepfake_score: 0.03 + r * 0.05,
      sensity_score: 0.05 + r * 0.05,
      temporal_inconsistency: false,
      physics_anomaly: false,
      texture_artifacts: false,
      generator_fingerprint: null,
      quality_degraded: qualityDegraded,
    }
  }
  // Neutral: seeded mid scores, occasional vendor disagreement.
  const hive = 0.3 + r * 0.4
  const disagree = seededUnit(`l1d:${videoUrl}`) > 0.7
  return {
    hive_ai_generated_score: hive,
    hive_deepfake_score: Math.max(0, hive - 0.1),
    sensity_score: disagree ? Math.max(0, hive - 0.4) : hive + 0.05,
    temporal_inconsistency: hive > 0.55,
    physics_anomaly: false,
    texture_artifacts: hive > 0.5,
    generator_fingerprint: null,
    quality_degraded: qualityDegraded,
  }
}

export function mockLayer3(input: Layer3Input): Layer3Signals {
  const hint = hintFrom(input.videoUrl)
  const { platform, crossModal } = input
  const redFlags: string[] = []
  if (hint === 'ai') {
    redFlags.push('Brand-new account with very few prior uploads')
    redFlags.push('Sudden high-stakes political content')
  }
  if (crossModal.lip_sync_anomaly) {
    redFlags.push('Audio and lip movements are out of sync (possible voice clone or dub)')
  }
  return {
    channel_age_days: platform.channel_age_days,
    channel_video_count: platform.channel_video_count,
    audio_cleanliness_score: crossModal.audio_cleanliness_score,
    clip_transition_intervals: null,
    behavioural_plausibility_score: hint === 'ai' ? 0.18 : hint === 'real' ? 0.9 : 0.55,
    contextual_red_flags: redFlags,
    audio_visual_sync_score: crossModal.av_sync_score,
    lip_sync_anomaly: crossModal.lip_sync_anomaly,
  }
}
