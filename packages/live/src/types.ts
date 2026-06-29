import type { LiveClaimStatus, SourceCitation } from '@fountem/db'

/** A finalised transcript segment from the ASR stream. */
export interface TranscriptSegment {
  speaker: string | null
  text: string
  tsStartMs: number
  tsEndMs: number
  /** True only for finalised (non-interim) ASR results. */
  isFinal: boolean
}

/** A check-worthy claim extracted from the transcript. */
export interface ExtractedClaim {
  claimText: string
  transcriptExcerpt: string
  speaker: string | null
  /** Extractor confidence that this is a verifiable factual claim (0–1). */
  checkWorthiness: number
}

/** The result of verifying a single live claim. */
export interface LiveVerdict {
  status: Exclude<LiveClaimStatus, 'pending' | 'checking'>
  summary: string
  correction: string | null
  whatWouldChangeThis: string | null
  confidencePct: number
  citations: SourceCitation[]
}

/** Verdict vocabulary allowed for live (deliberately softer than the 8-value scale). */
export const LIVE_VERDICT_VALUES = ['supported', 'disputed', 'needs_context', 'unverifiable'] as const
export type LiveVerdictValue = (typeof LIVE_VERDICT_VALUES)[number]

export interface LiveVerdictMeta {
  label: string
  colour: string
}

export const LIVE_VERDICT_META: Record<LiveClaimStatus, LiveVerdictMeta> = {
  pending: { label: 'Pending', colour: '#94a3b8' },
  checking: { label: 'Checking…', colour: '#facc15' },
  supported: { label: 'Supported', colour: '#22c55e' },
  disputed: { label: 'Disputed', colour: '#ef4444' },
  needs_context: { label: 'Needs context', colour: '#f97316' },
  unverifiable: { label: 'Unverifiable', colour: '#94a3b8' },
  error: { label: 'Check failed', colour: '#64748b' },
}
