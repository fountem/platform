import { createHash } from 'node:crypto'
import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { run } from './exec.js'
import { assertPublicUrl } from './ssrf.js'
import type {
  C2PAResult,
  CrossModalResult,
  FfprobeMetadata,
  PlatformMetadata,
  ResolvedMedia,
  WatermarkResult,
} from './types.js'

const INLINE_LIMIT_BYTES = 6 * 1024 * 1024 // inline buffers up to ~6MB; larger would go to S3
const LOW_QUALITY_PIXELS = 640 * 480
const LOW_QUALITY_BITRATE = 500_000 // 0.5 Mbps

export class ResolveError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message)
    this.name = 'ResolveError'
  }
}

interface YtDlpInfo {
  ext?: string
  channel_id?: string
  uploader_id?: string
  channel_follower_count?: number
  upload_date?: string // YYYYMMDD
  timestamp?: number
  view_count?: number
  title?: string
  description?: string
  extractor_key?: string
  webpage_url_domain?: string
  channel_url?: string
  playlist_count?: number
  _type?: string
}

function emptyPlatform(): PlatformMetadata {
  return {
    platform: null,
    channel_id: null,
    channel_age_days: null,
    channel_video_count: null,
    upload_date: null,
    view_count: null,
    title: null,
    description: null,
  }
}

function emptyC2PA(): C2PAResult {
  return { manifest_present: false, valid: false, provenance_chain: [], generator: null, signature_issuer: null }
}

function emptyCrossModal(): CrossModalResult {
  return { av_sync_score: null, lip_sync_anomaly: false, audio_cleanliness_score: null }
}

/** Probe a downloaded media file with ffprobe and derive keyframe intervals. */
async function probe(file: string): Promise<FfprobeMetadata> {
  const { stdout } = await run(
    'ffprobe',
    ['-v', 'quiet', '-print_format', 'json', '-show_format', '-show_streams', file],
    { timeoutMs: 30_000 },
  )
  const parsed = JSON.parse(stdout || '{}') as {
    format?: {
      format_name?: string
      duration?: string
      bit_rate?: string
      tags?: Record<string, string>
    }
    streams?: Array<Record<string, unknown>>
  }
  const streams = parsed.streams ?? []
  const video = streams.find((s) => s.codec_type === 'video')
  const audio = streams.find((s) => s.codec_type === 'audio')
  const format = parsed.format ?? {}

  const avgFrameRate = video?.avg_frame_rate ? parseRate(String(video.avg_frame_rate)) : null
  const duration = format.duration ? Number(format.duration) : null

  return {
    container_format: format.format_name ?? null,
    video_codec: (video?.codec_name as string) ?? null,
    audio_codec: (audio?.codec_name as string) ?? null,
    duration_sec: duration,
    width: video?.width ? Number(video.width) : null,
    height: video?.height ? Number(video.height) : null,
    bitrate: format.bit_rate ? Number(format.bit_rate) : null,
    frame_count:
      video?.nb_frames && Number(video.nb_frames) > 0
        ? Number(video.nb_frames)
        : avgFrameRate && duration
          ? Math.round(avgFrameRate * duration)
          : null,
    avg_frame_rate: avgFrameRate,
    creation_time: format.tags?.creation_time ?? null,
    has_audio: Boolean(audio),
    keyframe_intervals: await keyframeIntervals(file),
  }
}

function parseRate(rate: string): number | null {
  const [num, den] = rate.split('/').map(Number)
  if (!num || !den) return null
  return num / den
}

/** Read keyframe (I-frame) timestamps and return the gaps between them. */
async function keyframeIntervals(file: string): Promise<number[] | null> {
  try {
    const { stdout } = await run(
      'ffprobe',
      [
        '-v', 'quiet',
        '-select_streams', 'v:0',
        '-skip_frame', 'nokey',
        '-show_entries', 'frame=pts_time',
        '-print_format', 'json',
        file,
      ],
      { timeoutMs: 30_000 },
    )
    const parsed = JSON.parse(stdout || '{}') as { frames?: Array<{ pts_time?: string }> }
    const times = (parsed.frames ?? [])
      .map((f) => (f.pts_time != null ? Number(f.pts_time) : NaN))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    if (times.length < 2) return null
    const intervals: number[] = []
    for (let i = 1; i < times.length; i++) intervals.push(Number((times[i] - times[i - 1]).toFixed(3)))
    return intervals
  } catch {
    return null
  }
}

/** Extract C2PA Content Credentials using c2patool, if installed. */
async function extractC2PA(file: string): Promise<C2PAResult> {
  try {
    const { stdout, code } = await run('c2patool', [file, '--detailed'], { timeoutMs: 20_000 })
    if (code !== 0 || !stdout.trim()) return emptyC2PA()
    const report = JSON.parse(stdout) as {
      validation_status?: Array<{ code?: string }>
      manifests?: Record<string, unknown>
      active_manifest?: string
    }
    const manifests = report.manifests ?? {}
    const active = report.active_manifest ? (manifests[report.active_manifest] as Record<string, unknown>) : undefined
    const status = report.validation_status ?? []
    const valid = status.length === 0 || status.every((s) => !s.code || s.code.startsWith('claimSignature.validated') || !s.code.includes('failed'))

    const signature = active?.signature_info as { issuer?: string } | undefined
    const claimGenerator = (active?.claim_generator as string) ?? null

    return {
      manifest_present: Object.keys(manifests).length > 0,
      valid,
      provenance_chain: Object.keys(manifests),
      generator: claimGenerator,
      signature_issuer: signature?.issuer ?? null,
    }
  } catch {
    return emptyC2PA()
  }
}

/**
 * Best-effort SynthID / watermark detection. A real implementation calls the
 * Google SynthID verifier (limited availability). Until that is provisioned we
 * return null (= "not checked") rather than a false negative.
 */
function detectWatermark(): WatermarkResult {
  return { synthid_detected: null, other_watermark: null }
}

function platformFromInfo(info: YtDlpInfo): PlatformMetadata {
  let channelAgeDays: number | null = null
  // yt-dlp rarely exposes channel creation date; leave null unless present.
  const uploadDate =
    info.upload_date && /^\d{8}$/.test(info.upload_date)
      ? `${info.upload_date.slice(0, 4)}-${info.upload_date.slice(4, 6)}-${info.upload_date.slice(6, 8)}`
      : info.timestamp
        ? new Date(info.timestamp * 1000).toISOString().slice(0, 10)
        : null

  return {
    platform: info.extractor_key ?? info.webpage_url_domain ?? null,
    channel_id: info.channel_id ?? info.uploader_id ?? null,
    channel_age_days: channelAgeDays,
    channel_video_count: info.playlist_count ?? null,
    upload_date: uploadDate,
    view_count: info.view_count ?? null,
    title: info.title ?? null,
    description: info.description ? info.description.slice(0, 2000) : null,
  }
}

/**
 * Download a URL with yt-dlp (handles direct files and ~1800 platforms),
 * probe it, extract provenance, and return a normalised ResolvedMedia.
 */
export async function resolve(rawUrl: string): Promise<ResolvedMedia> {
  const check = await assertPublicUrl(rawUrl)
  if (!check.ok) throw new ResolveError(`URL rejected: ${check.reason}`, 400)

  const dir = await mkdtemp(join(tmpdir(), 'resolver-'))
  try {
    const infoRaw = await run(
      'yt-dlp',
      [
        '--no-playlist',
        '--no-warnings',
        '--max-filesize', '200M',
        '--socket-timeout', '20',
        '-f', 'best[ext=mp4]/best',
        '--write-info-json',
        '--no-progress',
        '-o', join(dir, 'media.%(ext)s'),
        '--print-json',
        rawUrl,
      ],
      { timeoutMs: 90_000, maxBuffer: 8 * 1024 * 1024 },
    )

    let info: YtDlpInfo = {}
    const firstJsonLine = infoRaw.stdout.split('\n').find((l) => l.trim().startsWith('{'))
    if (firstJsonLine) {
      try {
        info = JSON.parse(firstJsonLine) as YtDlpInfo
      } catch {
        info = {}
      }
    }

    const files = (await readdir(dir)).filter((f) => f.startsWith('media.') && !f.endsWith('.info.json'))
    if (files.length === 0) throw new ResolveError('no media downloaded', 422)
    const mediaPath = join(dir, files[0])

    const [bytes, fileStat] = await Promise.all([readFile(mediaPath), stat(mediaPath)])
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    const ffprobe = await probe(mediaPath)
    const c2pa = await extractC2PA(mediaPath)

    const ext = files[0].split('.').pop() ?? 'bin'
    const lowQuality =
      (ffprobe.width != null && ffprobe.height != null && ffprobe.width * ffprobe.height < LOW_QUALITY_PIXELS) ||
      (ffprobe.bitrate != null && ffprobe.bitrate < LOW_QUALITY_BITRATE)

    return {
      buffer_base64: fileStat.size <= INLINE_LIMIT_BYTES ? bytes.toString('base64') : null,
      media_url: null,
      content_type: contentTypeFromExt(ext),
      size_bytes: fileStat.size,
      content_sha256: sha256,
      source_url: rawUrl,
      ffprobe,
      c2pa,
      watermark: detectWatermark(),
      cross_modal: emptyCrossModal(),
      platform: Object.keys(info).length ? platformFromInfo(info) : emptyPlatform(),
      low_quality: lowQuality,
    }
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

function contentTypeFromExt(ext: string): string {
  const map: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    m4a: 'audio/mp4',
  }
  return map[ext.toLowerCase()] ?? 'application/octet-stream'
}
