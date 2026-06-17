import { enforceApiKey, hashApiKey, type ApiKeyUsageRow } from '../src/apikey'

const inc = (row: ApiKeyUsageRow | null) => async () => row

describe('enforceApiKey', () => {
  it('returns public tier when no key', async () => {
    const res = await enforceApiKey(null, inc(null))
    expect(res).toEqual({ ok: true, tier: 'public', status: 200 })
  })

  it('rejects an unknown key with 401', async () => {
    const res = await enforceApiKey('bad', inc(null))
    expect(res.ok).toBe(false)
    expect(res.status).toBe(401)
  })

  it('rejects an over-quota key with 429', async () => {
    const res = await enforceApiKey('live', inc({ allowed: false, requests_this_month: 101, monthly_limit: 100 }))
    expect(res.ok).toBe(false)
    expect(res.status).toBe(429)
  })

  it('allows a within-quota key and reports remaining', async () => {
    const res = await enforceApiKey('live', inc({ allowed: true, requests_this_month: 10, monthly_limit: 100 }))
    expect(res.ok).toBe(true)
    expect(res.remaining).toBe(90)
  })

  it('returns 500 when the incrementer throws', async () => {
    const res = await enforceApiKey('live', async () => {
      throw new Error('db down')
    })
    expect(res.status).toBe(500)
  })

  it('hashes keys deterministically (sha256)', () => {
    expect(hashApiKey('abc')).toBe(hashApiKey('abc'))
    expect(hashApiKey('abc')).toHaveLength(64)
  })
})
