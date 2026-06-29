import { filterClaims, isCharacterAttack, claimHash } from '../src/claim-extractor'
import type { ExtractedClaim } from '../src/types'

const mk = (claimText: string, checkWorthiness = 0.8): ExtractedClaim => ({
  claimText,
  transcriptExcerpt: claimText,
  speaker: 'Speaker 0',
  checkWorthiness,
})

describe('isCharacterAttack', () => {
  it('flags personal character attacks', () => {
    expect(isCharacterAttack('The minister is a liar and a fraud')).toBe(true)
    expect(isCharacterAttack('Unemployment fell to 4 percent last year')).toBe(false)
  })
})

describe('filterClaims', () => {
  it('drops character attacks (legal guardrail)', () => {
    const out = filterClaims([mk('He is corrupt'), mk('Inflation rose to 3 percent')])
    expect(out).toHaveLength(1)
    expect(out[0].claimText).toContain('Inflation')
  })

  it('drops low check-worthiness and too-short claims', () => {
    const out = filterClaims([mk('Maybe', 0.9), mk('I think it might rain', 0.2)], { minCheckWorthiness: 0.5 })
    expect(out).toHaveLength(0)
  })

  it('dedupes within a session', () => {
    const seen = new Set<string>()
    const first = filterClaims([mk('GDP grew by 2 percent')], { seenHashes: seen })
    const second = filterClaims([mk('gdp grew by 2 percent')], { seenHashes: seen })
    expect(first).toHaveLength(1)
    expect(second).toHaveLength(0)
  })
})

describe('claimHash', () => {
  it('is case- and whitespace-insensitive', () => {
    expect(claimHash('GDP  grew')).toBe(claimHash('gdp grew'))
  })
})
