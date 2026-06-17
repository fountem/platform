/**
 * Output contract for the resolver. MUST stay in sync with
 * `packages/detection/src/resolver.ts` (ResolvedMedia) in the main repo.
 */

export interface FfprobeMetadata {
  container_format: string | null
  video_codec: string | null
  audio_codec: string | null
  duration_sec: number | null
  width: number | null
  height: number | null
  bitrate: number | null
  frame_count: number | null
  avg_frame_rate: number | null
  creation_time: string | null
  has_audio: boolean
  keyframe_intervals: number[] | null
}

export interface C2PAResult {
  manifest_present: boolean
  valid: boolean
  provenance_chain: string[]
  generator: string | null
  signature_issuer: string | null
}

export interface WatermarkResult {
  synthid_detected: boolean | null
  other_watermark: string | null
}

export interface CrossModalResult {
  av_sync_score: number | null
  lip_sync_anomaly: boolean
  audio_cleanliness_score: number | null
}

export interface PlatformMetadata {
  platform: string | null
  channel_id: string | null
  channel_age_days: number | null
  channel_video_count: number | null
  upload_date: string | null
  view_count: number | null
  title: string | null
  description: string | null
}

export interface ResolvedMedia {
  buffer_base64: string | null
  media_url: string | null
  content_type: string
  size_bytes: number
  content_sha256: string
  source_url: string
  ffprobe: FfprobeMetadata
  c2pa: C2PAResult
  watermark: WatermarkResult
  cross_modal: CrossModalResult
  platform: PlatformMetadata
  low_quality: boolean
}
