import { mockResolveMedia, mockLayer1, mockLayer3 } from '../src/mock'
import { runDetectionPipeline } from '../src/pipeline'
import { resolveMedia } from '../src/resolver'

describe('detection mock fixtures', () => {
  it('mockResolveMedia is deterministic for the same URL', () => {
    const a = mockResolveMedia('https://example.com/clip.mp4')
    const b = mockResolveMedia('https://example.com/clip.mp4')
    expect(a).toEqual(b)
  })

  it('steers provenance by URL keyword', () => {
    expect(mockResolveMedia('https://x.com/real-press-conf.mp4').c2pa.valid).toBe(true)
    expect(mockResolveMedia('https://x.com/deepfake-leak.mp4').watermark.synthid_detected).toBe(true)
  })

  it('mockLayer1 reflects intent', () => {
    expect(mockLayer1('https://x.com/deepfake.mp4', false).hive_ai_generated_score).toBeGreaterThan(0.8)
    expect(mockLayer1('https://x.com/authentic.mp4', false).hive_ai_generated_score).toBeLessThan(0.2)
  })

  it('mockLayer3 flags brand-new accounts for AI hints', () => {
    const sig = mockLayer3({
      videoUrl: 'https://x.com/synthetic.mp4',
      layer1Score: 0.9,
      layer2Valid: false,
      platform: mockResolveMedia('https://x.com/synthetic.mp4').platform,
      crossModal: mockResolveMedia('https://x.com/synthetic.mp4').cross_modal,
    })
    expect(sig.contextual_red_flags.length).toBeGreaterThan(0)
  })
})

describe('detection pipeline in mock mode (no keys)', () => {
  async function withMock<T>(fn: () => Promise<T>): Promise<T> {
    const prev = process.env.MOCK_SERVICES
    process.env.MOCK_SERVICES = '1'
    try {
      return await fn()
    } finally {
      if (prev === undefined) delete process.env.MOCK_SERVICES
      else process.env.MOCK_SERVICES = prev
    }
  }

  it('produces an AI-leaning verdict for a deepfake URL', async () => {
    await withMock(async () => {
      const media = await resolveMedia('https://x.com/deepfake-leak.mp4')
      const result = await runDetectionPipeline(media)
      expect(['ai_generated', 'likely_ai_generated']).toContain(result.verdict)
      expect(result.confidence_pct).toBeGreaterThan(0)
    })
  })

  it('produces a real-leaning verdict for a provenance-backed URL', async () => {
    await withMock(async () => {
      const media = await resolveMedia('https://x.com/real-authentic-clip.mp4')
      const result = await runDetectionPipeline(media)
      expect(['real', 'likely_real']).toContain(result.verdict)
    })
  })
})
