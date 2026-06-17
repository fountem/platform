import { aggregateSubVerdicts } from '../src/decompose'

describe('aggregateSubVerdicts', () => {
  it('returns unverifiable when nothing is checkable', () => {
    const r = aggregateSubVerdicts([
      { verdict: 'unverifiable', confidence_pct: 0 },
      { verdict: 'inconclusive', confidence_pct: 10 },
    ])
    expect(r.verdict).toBe('unverifiable')
    expect(r.verifiable_count).toBe(0)
  })

  it('flags a true+false mix as misleading (cherry-picking)', () => {
    const r = aggregateSubVerdicts([
      { verdict: 'true', confidence_pct: 90 },
      { verdict: 'false', confidence_pct: 85 },
    ])
    expect(r.verdict).toBe('misleading')
  })

  it('aggregates all-true to true', () => {
    const r = aggregateSubVerdicts([
      { verdict: 'true', confidence_pct: 95 },
      { verdict: 'mostly_true', confidence_pct: 80 },
    ])
    expect(['true', 'mostly_true']).toContain(r.verdict)
  })

  it('aggregates mostly-false content to false/mostly_false', () => {
    const r = aggregateSubVerdicts([
      { verdict: 'false', confidence_pct: 80 },
      { verdict: 'mostly_false', confidence_pct: 70 },
    ])
    expect(['false', 'mostly_false']).toContain(r.verdict)
  })

  it('ignores unverifiable sub-claims in the average', () => {
    const r = aggregateSubVerdicts([
      { verdict: 'true', confidence_pct: 90 },
      { verdict: 'unverifiable', confidence_pct: 0 },
    ])
    expect(r.verifiable_count).toBe(1)
    expect(['true', 'mostly_true']).toContain(r.verdict)
  })
})
