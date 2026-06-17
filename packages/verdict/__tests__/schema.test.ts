import { VERDICT_META, GENERATOR_LABELS, confidenceLabel } from '../src/schema'

describe('VERDICT_META', () => {
  it('has entries for all verdict values', () => {
    const expected: Array<keyof typeof VERDICT_META> = ['true', 'mostly_true', 'half_true', 'mostly_false', 'false', 'misleading', 'unverifiable', 'inconclusive', 'ai_generated', 'likely_ai_generated', 'likely_real', 'real']
    expected.forEach(v => {
      expect(VERDICT_META[v]).toBeDefined()
      expect(VERDICT_META[v].label).toBeTruthy()
      expect(VERDICT_META[v].colour).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})

describe('GENERATOR_LABELS', () => {
  it('has label for all known generators', () => {
    ['veo', 'kling', 'runway', 'sora', 'luma', 'pika', 'unknown'].forEach(g => {
      expect(GENERATOR_LABELS[g]).toBeTruthy()
    })
  })
})

describe('confidenceLabel', () => {
  it('returns HIGH for >= 85', () => expect(confidenceLabel(90)).toBe('HIGH'))
  it('returns HIGH for exactly 85', () => expect(confidenceLabel(85)).toBe('HIGH'))
  it('returns MEDIUM for 60-84', () => expect(confidenceLabel(72)).toBe('MEDIUM'))
  it('returns MEDIUM for exactly 60', () => expect(confidenceLabel(60)).toBe('MEDIUM'))
  it('returns LOW for < 60', () => expect(confidenceLabel(45)).toBe('LOW'))
  it('returns LOW for 0', () => expect(confidenceLabel(0)).toBe('LOW'))
})
