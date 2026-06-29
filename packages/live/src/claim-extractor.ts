/**
 * Check-worthy claim extraction.
 *
 * Turns finalised transcript segments into verifiable factual claims. Uses a
 * fast model (GPT-4o-mini) for latency; falls back to deterministic mocks
 * offline. Includes session-scoped dedup and a legal guardrail that drops
 * claims attacking a named individual's personal character/conduct
 * (see context/legal/defamation-liability-memo.md — RPA s.106 risk).
 */

import { createHash } from 'crypto'
import OpenAI from 'openai'
import type { ExtractedClaim, TranscriptSegment } from './types'
import { isLiveMockMode, mockExtractClaims } from './mock'

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export function claimHash(text: string): string {
  return createHash('sha256')
    .update(text.trim().toLowerCase().replace(/\s+/g, ' '))
    .digest('hex')
}

/**
 * Drop statements that attack a named person's character/conduct rather than a
 * policy/factual claim. Conservative: errs toward NOT surfacing such claims.
 */
const CHARACTER_TERMS = /\b(liar|lied|corrupt|criminal|fraud(ster)?|paedophile|racist|crook|cheat(ed|er)?|adulter|drunk|coward|traitor)\b/i
export function isCharacterAttack(text: string): boolean {
  return CHARACTER_TERMS.test(text)
}

export interface ExtractOptions {
  /** Hashes of claims already surfaced this session (for dedup). */
  seenHashes?: Set<string>
  /** Minimum check-worthiness to keep (0–1). */
  minCheckWorthiness?: number
  /** Recent transcript context to disambiguate references. */
  contextText?: string
}

const SYSTEM_PROMPT = `You extract CHECK-WORTHY factual claims from a live transcript of a debate or interview.

A check-worthy claim is a specific, verifiable assertion of fact (statistics, events, comparisons, records, policy outcomes). 

DO NOT extract:
- opinions, predictions, rhetorical questions, or value judgements
- attacks on a person's personal character or private conduct
- vague or non-falsifiable statements

Return STRICT JSON: {"claims":[{"claim_text": "...", "transcript_excerpt": "...", "speaker": "...", "check_worthiness": 0.0-1.0}]}
If there are no check-worthy claims, return {"claims":[]}.`

/** Extract claims from new finalised segments. */
export async function extractClaims(
  segments: TranscriptSegment[],
  opts: ExtractOptions = {},
): Promise<ExtractedClaim[]> {
  const minWorth = opts.minCheckWorthiness ?? 0.5
  const finals = segments.filter((s) => s.isFinal && s.text.trim().length > 0)
  if (finals.length === 0) return []

  let candidates: ExtractedClaim[]
  if (isLiveMockMode()) {
    candidates = mockExtractClaims(finals)
  } else {
    candidates = await llmExtract(finals, opts.contextText)
  }

  return filterClaims(candidates, { seenHashes: opts.seenHashes, minCheckWorthiness: minWorth })
}

/** Pure filtering: guardrail + min-worthiness + session dedup. Exposed for tests. */
export function filterClaims(
  candidates: ExtractedClaim[],
  opts: { seenHashes?: Set<string>; minCheckWorthiness?: number } = {},
): ExtractedClaim[] {
  const minWorth = opts.minCheckWorthiness ?? 0.5
  const seen = opts.seenHashes ?? new Set<string>()
  const out: ExtractedClaim[] = []
  for (const c of candidates) {
    if (!c.claimText || c.claimText.trim().length < 8) continue
    if (c.checkWorthiness < minWorth) continue
    if (isCharacterAttack(c.claimText)) continue
    const h = claimHash(c.claimText)
    if (seen.has(h)) continue
    seen.add(h)
    out.push(c)
  }
  return out
}

async function llmExtract(finals: TranscriptSegment[], contextText?: string): Promise<ExtractedClaim[]> {
  const transcript = finals.map((s) => `${s.speaker ?? 'Speaker'}: ${s.text}`).join('\n')
  const userContent = [
    contextText ? `RECENT CONTEXT (already processed, do not re-extract):\n${contextText}` : '',
    `NEW TRANSCRIPT:\n${transcript}`,
  ]
    .filter(Boolean)
    .join('\n\n')

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userContent },
    ],
  })

  const raw = response.choices[0]?.message?.content ?? '{"claims":[]}'
  let parsed: { claims?: { claim_text?: string; transcript_excerpt?: string; speaker?: string; check_worthiness?: number }[] }
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  return (parsed.claims ?? []).map((c) => ({
    claimText: (c.claim_text ?? '').trim(),
    transcriptExcerpt: (c.transcript_excerpt ?? c.claim_text ?? '').trim(),
    speaker: c.speaker ?? null,
    checkWorthiness: typeof c.check_worthiness === 'number' ? Math.max(0, Math.min(1, c.check_worthiness)) : 0.5,
  }))
}
