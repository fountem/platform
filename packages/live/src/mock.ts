/**
 * Offline fixtures for the live pipeline (active under MOCK_SERVICES).
 * Lets the whole live flow run with no ASR / LLM / web keys.
 */

import type { ExtractedClaim, LiveVerdict, TranscriptSegment } from './types'

export function isLiveMockMode(): boolean {
  const v = process.env.MOCK_SERVICES ?? process.env.NEXT_PUBLIC_MOCK_SERVICES
  return v === '1' || v === 'true'
}

function seededUnit(seed: string): number {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

/** A statement "looks check-worthy" if it asserts a verifiable fact. */
const FACTUAL_SIGNALS = /\d|\bpercent\b|%|\bbillion\b|\bmillion\b|\bmost\b|\bhighest\b|\blowest\b|\bfell\b|\brose\b|\bincreased\b|\bdoubled\b|\bhalved\b|\bnever\b|\balways\b/i

export function mockExtractClaims(segments: TranscriptSegment[]): ExtractedClaim[] {
  return segments
    .filter((s) => s.isFinal && FACTUAL_SIGNALS.test(s.text) && s.text.split(' ').length >= 4)
    .map((s) => ({
      claimText: s.text,
      transcriptExcerpt: s.text,
      speaker: s.speaker,
      checkWorthiness: 0.6 + seededUnit(s.text) * 0.4,
    }))
}

const STATUSES = ['supported', 'disputed', 'needs_context', 'unverifiable'] as const

export function mockVerifyClaim(claimText: string): LiveVerdict {
  const status = STATUSES[Math.floor(seededUnit(claimText) * STATUSES.length)]
  return {
    status,
    summary: `(Mock) On the available evidence, this claim is provisionally assessed as "${status.replace('_', ' ')}".`,
    correction: status === 'disputed' ? 'A more accurate figure differs from the one stated; see sources.' : null,
    whatWouldChangeThis: 'A primary-source release covering the exact period and definition cited.',
    confidencePct: 50 + Math.floor(seededUnit(`c:${claimText}`) * 40),
    citations: [
      {
        chunk_id: 'mock-live-1',
        source_title: 'Reuters — reporting',
        source_url: 'https://www.reuters.com/example',
        publisher: 'reuters.com',
        published_at: '2026-06-18',
        excerpt: 'Contemporaneous reporting on the figure cited.',
        source_tier: 'web',
      },
    ],
  }
}
