/**
 * Short-lived signed session tokens for live fact-checking.
 *
 * The web app authenticates the user (Supabase + quota), then mints a token the
 * live gateway can verify WITHOUT a round-trip to Supabase. This keeps the raw
 * client from talking to the gateway unauthenticated. HMAC-SHA256, compact,
 * no external dependency.
 */

import { createHmac, timingSafeEqual } from 'crypto'

export interface LiveTokenPayload {
  /** Live session id. */
  sid: string
  /** Owning user id (null for API-tier callers). */
  uid: string | null
  /** Issued-at (epoch seconds). */
  iat: number
  /** Expiry (epoch seconds). */
  exp: number
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url')
}

/** Mint a signed token. Default TTL 2 hours (covers a long session). */
export function signLiveToken(
  payload: Omit<LiveTokenPayload, 'iat' | 'exp'>,
  secret: string,
  ttlSeconds = 7200,
): string {
  const now = Math.floor(Date.now() / 1000)
  const full: LiveTokenPayload = { ...payload, iat: now, exp: now + ttlSeconds }
  const body = b64url(JSON.stringify(full))
  return `${body}.${sign(body, secret)}`
}

/** Verify a token. Returns the payload, or null if invalid/expired. */
export function verifyLiveToken(token: string, secret: string): LiveTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts

  const expected = sign(body, secret)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as LiveTokenPayload
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null
    return payload
  } catch {
    return null
  }
}
