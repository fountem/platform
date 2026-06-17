import { resolveMedia, getMediaBuffer, ResolverError, type ResolvedMedia } from '../src/resolver'

function fakeMedia(): ResolvedMedia {
  return {
    buffer_base64: Buffer.from('hello').toString('base64'),
    media_url: null,
    content_type: 'video/mp4',
    size_bytes: 5,
    content_sha256: 'abc',
    source_url: 'https://youtube.com/watch?v=x',
    ffprobe: {
      container_format: 'mp4', video_codec: 'h264', audio_codec: 'aac', duration_sec: 12,
      width: 1280, height: 720, bitrate: 1000, frame_count: 360, avg_frame_rate: 30,
      creation_time: '2026-01-01', has_audio: true, keyframe_intervals: [2, 2, 2],
    },
    c2pa: { manifest_present: false, valid: false, provenance_chain: [], generator: null, signature_issuer: null },
    watermark: { synthid_detected: null, other_watermark: null },
    cross_modal: { av_sync_score: 0.9, lip_sync_anomaly: false, audio_cleanliness_score: 0.7 },
    platform: { platform: 'youtube', channel_id: 'c', channel_age_days: 1000, channel_video_count: 50, upload_date: '2026-01-01', view_count: 1000, title: 't', description: 'd' },
    low_quality: false,
  }
}

describe('resolver client', () => {
  afterEach(() => {
    delete process.env.RESOLVER_URL
    delete process.env.RESOLVER_API_KEY
  })

  it('throws when not configured', async () => {
    await expect(resolveMedia('https://x')).rejects.toThrow(ResolverError)
  })

  it('posts to the resolver and returns parsed media', async () => {
    process.env.RESOLVER_URL = 'https://resolver.internal'
    process.env.RESOLVER_API_KEY = 'secret'
    const media = fakeMedia()
    const fetchImpl = jest.fn().mockResolvedValue({ ok: true, json: async () => media }) as unknown as typeof fetch
    const result = await resolveMedia('https://youtube.com/watch?v=x', { fetchImpl })
    expect(result.content_sha256).toBe('abc')
    expect((fetchImpl as jest.Mock).mock.calls[0][0]).toBe('https://resolver.internal/resolve')
  })

  it('raises ResolverError on non-ok responses', async () => {
    process.env.RESOLVER_URL = 'https://resolver.internal'
    process.env.RESOLVER_API_KEY = 'secret'
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, status: 502, text: async () => 'bad gateway' }) as unknown as typeof fetch
    await expect(resolveMedia('https://x', { fetchImpl })).rejects.toThrow('502')
  })

  it('decodes the inline buffer', () => {
    expect(getMediaBuffer(fakeMedia())?.toString()).toBe('hello')
  })
})
