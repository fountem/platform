/**
 * Verify the short-lived live session token minted by the Unfaked app.
 * Mirrors `@fountem/core` signLiveToken/verifyLiveToken (HMAC-SHA256). Vendored
 * here because services are built standalone (not workspace-linked).
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

export interface LiveTokenPayload {
  sid: string
  uid: string | null
  iat: number
  exp: number
}

export function verifyLiveToken(token: string, secret: string): LiveTokenPayload | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = createHmac('sha256', secret).update(body).digest('base64url')
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
