/**
 * Fixed-window rate limiter backed by AWS ElastiCache for Valkey (Redis protocol).
 *
 * In production set REDIS_URL to the Valkey endpoint. In dev/test (no REDIS_URL) it
 * falls back to an in-process store so limits still work locally and in unit tests.
 */

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  limit: number
  resetSec: number
}

export interface RateLimitStore {
  /** Increment the counter for `key`, returning the new count and seconds-to-reset. */
  incr(key: string, windowSec: number): Promise<{ count: number; ttl: number }>
}

interface RedisLike {
  incr(key: string): Promise<number>
  expire(key: string, seconds: number): Promise<number>
  ttl(key: string): Promise<number>
}

class MemoryStore implements RateLimitStore {
  private map = new Map<string, { count: number; expiresAt: number }>()

  async incr(key: string, windowSec: number): Promise<{ count: number; ttl: number }> {
    const now = Date.now()
    const existing = this.map.get(key)
    if (!existing || existing.expiresAt <= now) {
      const entry = { count: 1, expiresAt: now + windowSec * 1000 }
      this.map.set(key, entry)
      return { count: 1, ttl: windowSec }
    }
    existing.count += 1
    return { count: existing.count, ttl: Math.ceil((existing.expiresAt - now) / 1000) }
  }
}

class ValkeyStore implements RateLimitStore {
  constructor(private client: RedisLike) {}
  async incr(key: string, windowSec: number): Promise<{ count: number; ttl: number }> {
    const count = await this.client.incr(key)
    if (count === 1) await this.client.expire(key, windowSec)
    const ttl = await this.client.ttl(key)
    return { count, ttl: ttl >= 0 ? ttl : windowSec }
  }
}

let _store: RateLimitStore | null = null

export function getRateLimitStore(): RateLimitStore {
  if (_store) return _store
  const url = process.env.REDIS_URL
  if (url) {
    try {
      // Lazy require so the dependency is optional in environments without Valkey.
      const Redis = require('ioredis')
      _store = new ValkeyStore(new Redis(url) as RedisLike)
      return _store
    } catch {
      // ioredis missing or connection failed — fall back to memory.
    }
  }
  _store = new MemoryStore()
  return _store
}

/** For tests: inject a store and reset between cases. */
export function _setRateLimitStore(store: RateLimitStore | null): void {
  _store = store
}

export async function rateLimit(
  key: string,
  limit: number,
  windowSec: number
): Promise<RateLimitResult> {
  const { count, ttl } = await getRateLimitStore().incr(key, windowSec)
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
    resetSec: ttl,
  }
}

/** Extract a best-effort client IP from request headers (Netlify/Vercel/Cloud). */
export function clientIpFromHeaders(headers: Headers): string {
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]!.trim()
  return headers.get('x-real-ip') ?? headers.get('x-nf-client-connection-ip') ?? 'unknown'
}
