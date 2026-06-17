import { verifyTurnstile, DEFAULT_DAILY_LIMITS, DEFAULT_GLOBAL_CAPS } from '../src/quota'

describe('verifyTurnstile', () => {
  it('passes through when no secret configured (dev)', async () => {
    expect(await verifyTurnstile(null, { secret: undefined })).toBe(true)
  })

  it('fails when secret set but token missing', async () => {
    expect(await verifyTurnstile(null, { secret: 'sk_test' })).toBe(false)
  })

  it('returns true on a successful siteverify response', async () => {
    const fetchImpl = (async () =>
      ({ ok: true, json: async () => ({ success: true }) }) as Response) as typeof fetch
    expect(await verifyTurnstile('tok', { secret: 'sk_test', fetchImpl })).toBe(true)
  })

  it('returns false on a failed siteverify response', async () => {
    const fetchImpl = (async () =>
      ({ ok: true, json: async () => ({ success: false }) }) as Response) as typeof fetch
    expect(await verifyTurnstile('tok', { secret: 'sk_test', fetchImpl })).toBe(false)
  })

  it('returns false when the request throws', async () => {
    const fetchImpl = (async () => {
      throw new Error('network')
    }) as typeof fetch
    expect(await verifyTurnstile('tok', { secret: 'sk_test', fetchImpl })).toBe(false)
  })
})

describe('quota defaults', () => {
  it('exposes per-product daily limits and global caps', () => {
    expect(DEFAULT_DAILY_LIMITS.unfaked).toBeGreaterThan(0)
    expect(DEFAULT_DAILY_LIMITS.fountem).toBeGreaterThan(0)
    expect(DEFAULT_GLOBAL_CAPS.unfaked).toBeGreaterThan(0)
    expect(DEFAULT_GLOBAL_CAPS.fountem).toBeGreaterThan(0)
  })
})
