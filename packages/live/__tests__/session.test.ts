import { LiveSessionState } from '../src/session'

describe('LiveSessionState', () => {
  it('admits a fresh claim and dedupes repeats', () => {
    const s = new LiveSessionState(0, { maxClaimsPerMinute: 10, maxClaims: 100, maxMinutes: 90 })
    expect(s.admitClaim('Inflation rose', 1000)).toEqual({ admitted: true })
    expect(s.admitClaim('inflation  rose', 2000)).toEqual({ admitted: false, reason: 'duplicate' })
    expect(s.claimCount).toBe(1)
  })

  it('applies per-minute backpressure', () => {
    const s = new LiveSessionState(0, { maxClaimsPerMinute: 2, maxClaims: 100, maxMinutes: 90 })
    expect(s.admitClaim('a one', 1000).admitted).toBe(true)
    expect(s.admitClaim('b two', 2000).admitted).toBe(true)
    expect(s.admitClaim('c three', 3000)).toEqual({ admitted: false, reason: 'rate_limited' })
    // After the rolling window passes, capacity returns.
    expect(s.admitClaim('d four', 65000).admitted).toBe(true)
  })

  it('enforces the total claim cap', () => {
    const s = new LiveSessionState(0, { maxClaimsPerMinute: 100, maxClaims: 1, maxMinutes: 90 })
    expect(s.admitClaim('one claim', 1000).admitted).toBe(true)
    expect(s.admitClaim('two claim', 2000)).toEqual({ admitted: false, reason: 'claim_cap' })
  })

  it('enforces the time cap', () => {
    const s = new LiveSessionState(0, { maxClaimsPerMinute: 100, maxClaims: 100, maxMinutes: 1 })
    expect(s.admitClaim('late claim', 61_000)).toEqual({ admitted: false, reason: 'time_cap' })
    expect(s.isExpired(61_000)).toBe(true)
  })
})
