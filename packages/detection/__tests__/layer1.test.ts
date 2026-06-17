import { extractGeneratorFingerprint, runLayer1, type HiveClass } from '../src/layer1-forensic'

describe('extractGeneratorFingerprint', () => {
  it('returns null when no classes', () => {
    expect(extractGeneratorFingerprint(undefined)).toBeNull()
  })

  it('returns null when no known generator crosses 0.5', () => {
    const classes: HiveClass[] = [{ class: 'sora', score: 0.3 }]
    expect(extractGeneratorFingerprint(classes)).toBeNull()
  })

  it('picks the highest-scoring known generator above threshold', () => {
    const classes: HiveClass[] = [
      { class: 'runway', score: 0.6 },
      { class: 'gen_ai_sora', score: 0.81 },
    ]
    expect(extractGeneratorFingerprint(classes)).toBe('sora')
  })
})

describe('runLayer1', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
    delete process.env.HIVE_API_KEY
    delete process.env.SENSITY_API_KEY
  })

  it('throws when HIVE_API_KEY missing', async () => {
    await expect(runLayer1(Buffer.from('x'), 'http://x')).rejects.toThrow('HIVE_API_KEY')
  })

  it('parses Hive scores and generator from a mocked response', async () => {
    process.env.HIVE_API_KEY = 'test'
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        media_outputs: [
          { output: [{ ai_generated: { prob: 0.91 }, deepfake: { prob: 0.2 }, classes: [{ class: 'veo', score: 0.77 }] }] },
        ],
      }),
    }) as unknown as typeof fetch

    const signals = await runLayer1(Buffer.from('video'), 'http://x', { fetchImpl, qualityDegraded: true })
    expect(signals.hive_ai_generated_score).toBe(0.91)
    expect(signals.generator_fingerprint).toBe('veo')
    expect(signals.quality_degraded).toBe(true)
    expect(signals.sensity_score).toBeNull()
  })
})
