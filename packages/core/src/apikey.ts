/**
 * API-key authentication + monthly quota enforcement for the B2B API.
 *
 * Quota is enforced ATOMICALLY in Postgres via the `increment_api_key_usage` RPC
 * (migration 010), which increments the counter and returns whether the call is
 * allowed — avoiding the read-then-write race in the old code path.
 */

import { createHash } from 'crypto'

export interface ApiKeyResult {
  ok: boolean
  /** 'public' when no key supplied; otherwise the key's tier. */
  tier: string
  /** HTTP status to return when !ok. */
  status: number
  message?: string
  remaining?: number
}

export interface ApiKeyUsageRow {
  allowed: boolean
  requests_this_month: number
  monthly_limit: number
}

/** Atomically increment usage for `keyHash`, returning the quota row, or null if the
 * key is unknown/inactive. The caller supplies this (typically wrapping the Supabase
 * `increment_api_key_usage` RPC) so this module stays free of DB-client generics. */
export type IncrementUsage = (keyHash: string) => Promise<ApiKeyUsageRow | null>

export function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex')
}

/**
 * Returns `{ ok: true, tier: 'public' }` when no key is supplied (caller should then
 * apply IP-based rate limiting). With a key, validates it and enforces the monthly quota.
 */
export async function enforceApiKey(apiKey: string | null, incrementUsage: IncrementUsage): Promise<ApiKeyResult> {
  if (!apiKey) return { ok: true, tier: 'public', status: 200 }

  const keyHash = hashApiKey(apiKey)
  let row: ApiKeyUsageRow | null
  try {
    row = await incrementUsage(keyHash)
  } catch {
    return { ok: false, tier: 'unknown', status: 500, message: 'Could not validate API key' }
  }

  if (!row) return { ok: false, tier: 'unknown', status: 401, message: 'Invalid or inactive API key' }
  if (!row.allowed) {
    return {
      ok: false,
      tier: 'api',
      status: 429,
      message: `Monthly quota of ${row.monthly_limit} requests exceeded`,
      remaining: 0,
    }
  }
  return {
    ok: true,
    tier: 'api',
    status: 200,
    remaining: Math.max(0, row.monthly_limit - row.requests_this_month),
  }
}
