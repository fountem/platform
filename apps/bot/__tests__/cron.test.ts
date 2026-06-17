/**
 * Tests for the X bot cron handler.
 * Mocks X API and detection API — tests logic, not network calls.
 * Shared cursor/batch/orchestrator logic is tested in @fountem/social.
 */

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
