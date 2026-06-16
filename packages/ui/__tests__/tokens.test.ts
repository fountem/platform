import { verdictToTailwind, confidenceToColour, BRAND } from '../src/index'

describe('verdictToTailwind', () => {
  it('returns red classes for ai_generated', () => {
    expect(verdictToTailwind('ai_generated')).toContain('red')
  })
  it('returns green classes for true', () => {
    expect(verdictToTailwind('true')).toContain('green')
  })
  it('returns fallback for unknown verdict', () => {
    expect(verdictToTailwind('unknown_value')).toContain('zinc')
  })
})

describe('confidenceToColour', () => {
  it('returns green for high confidence', () => {
    expect(confidenceToColour(90)).toBe('#22c55e')
  })
  it('returns yellow for medium', () => {
    expect(confidenceToColour(70)).toBe('#facc15')
  })
  it('returns orange for low', () => {
    expect(confidenceToColour(45)).toBe('#f97316')
  })
})

describe('BRAND', () => {
  it('has primary colour defined', () => {
    expect(BRAND.primary).toBe('#ef4444')
  })
})
