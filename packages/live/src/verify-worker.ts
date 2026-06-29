/**
 * Live verify worker.
 *
 * Reuses the shared RAG evidence + verdict engine (corpus + live web), then maps
 * the 8-value claim verdict onto the deliberately softer LIVE vocabulary
 * (supported / disputed / needs_context / unverifiable). Live output is
 * provisional and unreviewed by design.
 */

import type { VerdictValue } from '@fountem/db'
import { gatherEvidence, generateVerdict, applyCitationTiers } from '@fountem/rag'
import type { LiveClaimStatus } from '@fountem/db'
import type { LiveVerdict } from './types'
import { isLiveMockMode, mockVerifyClaim } from './mock'

/** Map the full 8-value verdict scale to the softer live status set. */
export function mapToLiveStatus(verdict: VerdictValue): Exclude<LiveClaimStatus, 'pending' | 'checking'> {
  switch (verdict) {
    case 'true':
    case 'mostly_true':
      return 'supported'
    case 'false':
    case 'mostly_false':
      return 'disputed'
    case 'half_true':
    case 'misleading':
      return 'needs_context'
    case 'unverifiable':
    case 'inconclusive':
    default:
      return 'unverifiable'
  }
}

export interface VerifyLiveClaimOptions {
  dbClient: any
  /** Bias evidence toward recent material (live debates reference current facts). */
  recencyDays?: number
}

export async function verifyLiveClaim(claimText: string, opts: VerifyLiveClaimOptions): Promise<LiveVerdict> {
  if (isLiveMockMode()) return mockVerifyClaim(claimText)

  const evidence = await gatherEvidence({
    query: claimText,
    dbClient: opts.dbClient,
    allowWeb: true,
    forceWeb: true,
    recencyDays: opts.recencyDays ?? 30,
  })

  const result = await generateVerdict(claimText, evidence.chunks, evidence.sourceMetadata)
  const citations = applyCitationTiers(result.source_citations, evidence.chunks, evidence.tierBySourceId)
  const status = mapToLiveStatus(result.verdict)

  return {
    status,
    summary: result.summary,
    correction: status === 'disputed' ? result.reasoning : null,
    whatWouldChangeThis: result.what_would_change_this,
    confidencePct: result.confidence_pct,
    citations,
  }
}
