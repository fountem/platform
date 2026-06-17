/**
 * Client for the Unfaked media resolver service (AWS).
 *
 * The resolver is a separate, network-isolated service that performs the heavy,
 * native, and untrusted work that must NOT run in the Next.js/serverless tier:
 *   - yt-dlp download of social-platform URLs (YouTube / X / TikTok / etc.)
 *   - SSRF-safe fetching of direct media URLs (private-IP blocking, size caps)
 *   - ffprobe technical metadata extraction (codec, frames, duration, bitrate)
 *   - C2PA Content Credentials manifest extraction (c2pa native lib)
 *   - platform metadata (channel age, upload date, view count)
 *
 * It returns a normalised {@link ResolvedMedia} object. Keeping this out of the
 * web tier avoids native build issues, long runtimes, and IP-reputation problems
 * on serverless, and gives us one hardened choke point for abuse prevention.
 */

import { isMockMode, mockResolveMedia } from './mock'

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
  /** Inter-keyframe intervals (seconds) — used for splice/transition analysis. */
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
  /** null = not checked / unsupported; true/false = detected or not. */
  synthid_detected: boolean | null
  other_watermark: string | null
}

export interface CrossModalResult {
  /** Audio↔visual (lip-sync) correlation 0–1; null when no audio or no visible face. */
  av_sync_score: number | null
  lip_sync_anomaly: boolean
  /** Audio "cleanliness" 0–1 — suspiciously clean audio over AI video can indicate dubbing. */
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
  /** Base64 of the downloaded bytes when small enough to inline, else null. */
  buffer_base64: string | null
  /** Pre-signed S3 URL for the bytes when too large to inline, else null. */
  media_url: string | null
  content_type: string
  size_bytes: number
  /** sha256 of the *content* (not the URL) — used for dedup/caching. */
  content_sha256: string
  source_url: string
  ffprobe: FfprobeMetadata
  c2pa: C2PAResult
  watermark: WatermarkResult
  cross_modal: CrossModalResult
  platform: PlatformMetadata
  /** True if the resolver judged the input degraded (low-res/heavily compressed). */
  low_quality: boolean
}

export class ResolverError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message)
    this.name = 'ResolverError'
  }
}

export interface ResolveOptions {
  /** Override for tests/injection. */
  fetchImpl?: typeof fetch
  timeoutMs?: number
}

/**
 * Resolve a URL via the AWS resolver service. Requires:
 *   RESOLVER_URL          — base URL of the service (internal)
 *   RESOLVER_API_KEY      — shared secret for service-to-service auth
 */
export async function resolveMedia(url: string, opts: ResolveOptions = {}): Promise<ResolvedMedia> {
  if (isMockMode()) return mockResolveMedia(url)

  const base = process.env.RESOLVER_URL
  const key = process.env.RESOLVER_API_KEY
  if (!base) throw new ResolverError('RESOLVER_URL not configured')
  if (!key) throw new ResolverError('RESOLVER_API_KEY not configured')

  const fetchImpl = opts.fetchImpl ?? fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 55_000)

  try {
    const res = await fetchImpl(`${base.replace(/\/$/, '')}/resolve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new ResolverError(`Resolver returned ${res.status}: ${text.slice(0, 200)}`, res.status)
    }

    return (await res.json()) as ResolvedMedia
  } catch (err) {
    if (err instanceof ResolverError) throw err
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ResolverError('Resolver request timed out')
    }
    throw new ResolverError(err instanceof Error ? err.message : 'Resolver request failed')
  } finally {
    clearTimeout(timeout)
  }
}

/** Decode the inline buffer from a ResolvedMedia, if present. */
export function getMediaBuffer(media: ResolvedMedia): Buffer | null {
  return media.buffer_base64 ? Buffer.from(media.buffer_base64, 'base64') : null
}
