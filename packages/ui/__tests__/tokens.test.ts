import { verdictToTailwind, confidenceToColour, verdictTone, toneChipClasses, verdictLabel, BRAND, cls } from '../src/tokens'

describe('verdictTone', () => {
  it('maps positive verdicts to "true"', () => {
    expect(verdictTone('real')).toBe('true')
    expect(verdictTone('likely_real')).toBe('true')
    expect(verdictTone('mostly_true')).toBe('true')
  })
  it('maps AI/false verdicts to "false"', () => {
    expect(verdictTone('ai_generated')).toBe('false')
    expect(verdictTone('false')).toBe('false')
  })
  it('maps soft verdicts to "misleading"', () => {
    expect(verdictTone('likely_ai_generated')).toBe('misleading')
    expect(verdictTone('half_true')).toBe('misleading')
  })
  it('falls back to "unverified"', () => {
    expect(verdictTone('unknown_value')).toBe('unverified')
    expect(verdictTone('inconclusive')).toBe('unverified')
  })
})

describe('toneChipClasses', () => {
  it('returns forest classes for true on light surface', () => {
    expect(toneChipClasses('real', 'light')).toContain('forest')
  })
  it('returns emerald classes for true on dark surface', () => {
    expect(toneChipClasses('real', 'dark')).toContain('emerald')
  })
  it('returns red classes for ai_generated', () => {
    expect(verdictToTailwind('ai_generated')).toContain('red')
  })
})

describe('confidenceToColour', () => {
  it('returns forest green for high confidence', () => {
    expect(confidenceToColour(90)).toBe('#3a7d4e')
  })
  it('returns amber for medium', () => {
    expect(confidenceToColour(60)).toBe('#d97706')
  })
  it('returns red for low', () => {
    expect(confidenceToColour(40)).toBe('#dc2626')
  })
})

describe('verdictLabel', () => {
  it('humanises verdict keys', () => {
    expect(verdictLabel('likely_ai_generated')).toBe('Likely Ai Generated')
  })
})

describe('BRAND + cls', () => {
  it('exposes the forest CTA colour', () => {
    expect(BRAND.forest[800]).toBe('#245233')
  })
  it('joins truthy classes', () => {
    expect(cls('a', false, 'b', undefined)).toBe('a b')
  })
})
