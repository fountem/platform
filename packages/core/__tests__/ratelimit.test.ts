import { rateLimit, _setRateLimitStore, getRateLimitStore, clientIpFromHeaders } from '../src/ratelimit'

describe('rateLimit (memory fallback)', () => {
  beforeEach(() => _setRateLimitStore(null))

  it('allows up to the limit then blocks', async () => {
    const key = 'ip:test:detect'
    const r1 = await rateLimit(key, 2, 60)
    const r2 = await rateLimit(key, 2, 60)
    const r3 = await rateLimit(key, 2, 60)
    expect(r1.allowed).toBe(true)
    expect(r2.allowed).toBe(true)
    expect(r3.allowed).toBe(false)
    expect(r3.remaining).toBe(0)
  })

  it('tracks separate keys independently', async () => {
    const a = await rateLimit('k:a', 1, 60)
    const b = await rateLimit('k:b', 1, 60)
    expect(a.allowed).toBe(true)
    expect(b.allowed).toBe(true)
  })

  it('uses a singleton store', () => {
    expect(getRateLimitStore()).toBe(getRateLimitStore())
  })
})

describe('clientIpFromHeaders', () => {
  it('prefers x-forwarded-for first hop', () => {
    const h = new Headers({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' })
    expect(clientIpFromHeaders(h)).toBe('1.2.3.4')
  })
  it('falls back to unknown', () => {
    expect(clientIpFromHeaders(new Headers())).toBe('unknown')
  })
})
