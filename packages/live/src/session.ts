/**
 * Live session state machine.
 *
 * Owns the per-session invariants that bound cost and legal exposure:
 *   - session-scoped claim dedup (don't re-verify the same claim)
 *   - backpressure (max claims per rolling minute)
 *   - hard caps (max total claims, max session minutes)
 *
 * Pure and deterministic (time is injected) so it is fully unit-testable.
 */

import { LIVE_SESSION_CAPS } from '@fountem/core'
import { claimHash } from './claim-extractor'

export interface SessionCaps {
  maxMinutes: number
  maxClaims: number
  maxClaimsPerMinute: number
}

export type AdmitResult =
  | { admitted: true }
  | { admitted: false; reason: 'duplicate' | 'rate_limited' | 'claim_cap' | 'time_cap' }

export class LiveSessionState {
  readonly startedAtMs: number
  private readonly caps: SessionCaps
  private readonly seen = new Set<string>()
  private recentClaimTimes: number[] = []
  private total = 0
  private ended = false

  constructor(startedAtMs: number, caps: Partial<SessionCaps> = {}) {
    this.startedAtMs = startedAtMs
    this.caps = {
      maxMinutes: caps.maxMinutes ?? LIVE_SESSION_CAPS.maxMinutes,
      maxClaims: caps.maxClaims ?? LIVE_SESSION_CAPS.maxClaims,
      maxClaimsPerMinute: caps.maxClaimsPerMinute ?? LIVE_SESSION_CAPS.maxClaimsPerMinute,
    }
  }

  get claimCount(): number {
    return this.total
  }

  isExpired(nowMs: number): boolean {
    return this.ended || nowMs - this.startedAtMs >= this.caps.maxMinutes * 60_000
  }

  end(): void {
    this.ended = true
  }

  /**
   * Decide whether a claim may be surfaced+verified now. On success, records it
   * (so the same call mutates state). Check the result before acting on it.
   */
  admitClaim(claimText: string, nowMs: number): AdmitResult {
    if (this.isExpired(nowMs)) return { admitted: false, reason: 'time_cap' }
    if (this.total >= this.caps.maxClaims) return { admitted: false, reason: 'claim_cap' }

    const h = claimHash(claimText)
    if (this.seen.has(h)) return { admitted: false, reason: 'duplicate' }

    // Rolling 60s window backpressure.
    const windowStart = nowMs - 60_000
    this.recentClaimTimes = this.recentClaimTimes.filter((t) => t > windowStart)
    if (this.recentClaimTimes.length >= this.caps.maxClaimsPerMinute) {
      return { admitted: false, reason: 'rate_limited' }
    }

    this.seen.add(h)
    this.recentClaimTimes.push(nowMs)
    this.total += 1
    return { admitted: true }
  }
}
