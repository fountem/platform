import { classifyResult, computeScore } from '../src/eval'

describe('classifyResult', () => {
  it('detects exact matches', () => {
    expect(classifyResult('false', 'false')).toBe('exact')
  })
  it('detects adjacent matches', () => {
    expect(classifyResult('mostly_false', 'false')).toBe('adjacent')
    expect(classifyResult('true', 'mostly_true')).toBe('adjacent')
  })
  it('detects wrong matches', () => {
    expect(classifyResult('true', 'false')).toBe('wrong')
  })
})

describe('computeScore', () => {
  it('weights exact as full and adjacent as half', () => {
    const score = computeScore(['exact', 'exact', 'adjacent', 'wrong'])
    // (2*2 + 1) / (4*2) = 5/8 = 62.5 -> 63
    expect(score.accuracy).toBe(63)
    expect(score.exact).toBe(2)
    expect(score.adjacent).toBe(1)
    expect(score.wrong).toBe(1)
  })
  it('handles empty input', () => {
    expect(computeScore([]).accuracy).toBe(0)
  })
  it('all exact gives 100', () => {
    expect(computeScore(['exact', 'exact']).accuracy).toBe(100)
  })
})
