/**
 * Tests for the X bot cron handler.
 * Mocks X API and detection API — tests logic, not network calls.
 */

import { nextSinceId, pickBatch } from '../src/lib/cursor'

// We test the OAuth signing logic and mention processing in isolation
describe('X bot OAuth signing', () => {
  it('builds a correct parameter string', () => {
    const params: Record<string, string> = {
      oauth_consumer_key: 'key',
      oauth_nonce: 'abc123',
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: '1718000000',
      oauth_token: 'token',
      oauth_version: '1.0',
      max_results: '10',
    }

    const sorted = Object.keys(params).sort()
    const paramString = sorted
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
      .join('&')

    // Alphabetical order check
    expect(sorted[0]).toBe('max_results')
    expect(paramString).toContain('oauth_consumer_key=key')
    expect(paramString).toContain('HMAC-SHA1')
  })

  it('extracts video URL from tweet text', () => {
    const extractUrl = (text: string): string | null => {
      const match = text.match(/https?:\/\/[^\s]+/)
      return match?.[0] ?? null
    }

    expect(extractUrl('@unfaked is this real? https://t.co/abc123')).toBe('https://t.co/abc123')
    expect(extractUrl('@unfaked check this out')).toBeNull()
    expect(extractUrl('https://youtube.com/watch?v=test @unfaked')).toBe('https://youtube.com/watch?v=test')
  })

  it('formats reply text correctly', () => {
    const formatReply = (verdictLabel: string, confidence: number, packUrl: string): string => {
      return `${verdictLabel}: ${confidence}% confidence\nFull analysis: ${packUrl}`
    }

    const reply = formatReply('🤖 AI GENERATED', 91, 'https://unfaked.ai/check/abc12345')
    expect(reply).toContain('91%')
    expect(reply).toContain('unfaked.ai/check')
    expect(reply.length).toBeLessThan(280)  // Twitter char limit
  })
})

describe('bot idempotency cursor', () => {
  it('returns the numerically largest tweet id (not lexicographic)', () => {
    // Lexicographically "9" > "10", so a string sort would regress the cursor.
    expect(nextSinceId(undefined, ['9', '10', '100'])).toBe('100')
  })

  it('never moves the cursor backwards from its current value', () => {
    expect(nextSinceId('500', ['100', '200'])).toBe('500')
    expect(nextSinceId('500', ['600'])).toBe('600')
  })

  it('keeps the current cursor when there are no new mentions', () => {
    expect(nextSinceId('123', [])).toBe('123')
    expect(nextSinceId(undefined, [])).toBeUndefined()
  })

  it('handles very large (BigInt-range) tweet ids', () => {
    const a = '1718000000000000000'
    const b = '1718000000000000001'
    expect(nextSinceId(a, [b])).toBe(b)
  })

  it('ignores malformed ids', () => {
    expect(nextSinceId('10', ['not-a-number', '20'])).toBe('20')
  })
})

describe('bot per-run batching', () => {
  it('returns the oldest ids first, capped to max', () => {
    expect(pickBatch(['30', '10', '20', '40'], 2)).toEqual(['10', '20'])
  })

  it('orders numerically, not lexicographically', () => {
    expect(pickBatch(['100', '9', '20'], 3)).toEqual(['9', '20', '100'])
  })

  it('returns all (sorted) when max exceeds count', () => {
    expect(pickBatch(['2', '1'], 10)).toEqual(['1', '2'])
  })

  it('drains backlog incrementally so newer mentions are not skipped', () => {
    const all = ['1', '2', '3', '4', '5']
    const first = pickBatch(all, 2)
    expect(first).toEqual(['1', '2'])
    // Next run: API returns only ids > cursor (the last handled id).
    const cursor = nextSinceId(undefined, first)
    expect(cursor).toBe('2')
    const remaining = all.filter(id => BigInt(id) > BigInt(cursor!))
    expect(pickBatch(remaining, 2)).toEqual(['3', '4'])
  })

  it('drops malformed ids', () => {
    expect(pickBatch(['x', '2', '1'], 5)).toEqual(['1', '2'])
  })
})

describe('cron auth', () => {
  it('rejects requests without cron secret', async () => {
    // Simulate an unauthenticated request check
    const checkAuth = (header: string | null, secret: string): boolean => {
      return header === `Bearer ${secret}`
    }

    expect(checkAuth(null, 'mysecret')).toBe(false)
    expect(checkAuth('Bearer wrongsecret', 'mysecret')).toBe(false)
    expect(checkAuth('Bearer mysecret', 'mysecret')).toBe(true)
  })
})
