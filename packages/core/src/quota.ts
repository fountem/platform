/**
 * Anti-abuse helpers: Cloudflare Turnstile verification + per-account / global
 * quota result types. Spend is defended in three layers:
 *   1. per-account daily quota  (increment_user_usage RPC)
 *   2. per-IP rate limit         (ratelimit.ts)
 *   3. global daily budget cap   (increment_global_budget RPC) — hard ceiling
 */

export interface QuotaRow {
  allowed: boolean
  used: number
  day_limit: number
}

export interface BudgetRow {
  allowed: boolean
  used: number
  cap: number
}

/** Default free-tier daily limits per product (override via env). */
export const DEFAULT_DAILY_LIMITS = {
  unfaked: Number(process.env.UNFAKED_FREE_DAILY_LIMIT ?? 5),
  fountem: Number(process.env.FOUNTEM_FREE_DAILY_LIMIT ?? 10),
} as const

/** Default global daily spend caps per product (hard ceiling). */
export const DEFAULT_GLOBAL_CAPS = {
  unfaked: Number(process.env.UNFAKED_GLOBAL_DAILY_CAP ?? 2000),
  fountem: Number(process.env.FOUNTEM_GLOBAL_DAILY_CAP ?? 4000),
} as const

/**
 * Verify a Cloudflare Turnstile token server-side. Returns true when the secret
 * is unset (so local/dev without Turnstile still works) — set TURNSTILE_SECRET_KEY
 * in production to enforce it.
 */
export async function verifyTurnstile(
  token: string | null,
  opts: { secret?: string; remoteIp?: string; fetchImpl?: typeof fetch } = {},
): Promise<boolean> {
  const secret = opts.secret ?? process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // not configured → skip (dev)
  if (!token) return false

  const fetchImpl = opts.fetchImpl ?? fetch
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (opts.remoteIp) body.set('remoteip', opts.remoteIp)
    const res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return false
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch {
    return false
  }
}
