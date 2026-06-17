/**
 * Atomic claim decomposition.
 *
 * Compound political claims ("X raised spending by 20% and cut waiting lists")
 * can't be fairly graded as one unit — one half may be true and the other false.
 * We split into atomic sub-claims, verify each independently, then aggregate.
 *
 * The LLM split is thin; the aggregation is a pure, unit-tested function.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { VerdictValue } from '@fountem/db'

let _client: Anthropic | null = null
function client(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return _client
}

const DECOMPOSE_PROMPT = `Split the following political claim into its atomic, independently checkable factual sub-claims.
- Each sub-claim must be a single, self-contained factual assertion.
- Preserve named entities, numbers, dates and qualifiers from the original.
- If the claim is already atomic, return it unchanged as a single-item list.
- Do NOT add claims that were not stated.

Respond ONLY with JSON: { "sub_claims": ["...", "..."] }`

export async function decomposeClaim(claimText: string): Promise<string[]> {
  const response = await client().messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 512,
    messages: [{ role: 'user', content: `${DECOMPOSE_PROMPT}\n\nCLAIM: "${claimText}"` }],
  })
  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return [claimText]
  try {
    const parsed = JSON.parse(match[0]) as { sub_claims?: string[] }
    const subs = (parsed.sub_claims ?? []).map((s) => s.trim()).filter(Boolean)
    return subs.length > 0 ? subs : [claimText]
  } catch {
    return [claimText]
  }
}

const TRUTH_SCORE: Record<string, number | null> = {
  true: 1,
  mostly_true: 0.8,
  half_true: 0.5,
  mostly_false: 0.2,
  misleading: 0.2,
  false: 0,
  unverifiable: null,
  inconclusive: null,
}

export interface AggregateResult {
  verdict: VerdictValue
  confidence_pct: number
  verifiable_count: number
}

/**
 * Combine sub-claim verdicts into one overall verdict. A claim that mixes a clearly
 * true part with a clearly false part is "misleading" (cherry-picking), not "half true".
 */
export function aggregateSubVerdicts(
  subVerdicts: Array<{ verdict: VerdictValue; confidence_pct: number }>
): AggregateResult {
  const scored = subVerdicts
    .map((s) => ({ score: TRUTH_SCORE[s.verdict], confidence: s.confidence_pct }))
    .filter((s): s is { score: number; confidence: number } => s.score !== null)

  if (scored.length === 0) {
    return { verdict: 'unverifiable', confidence_pct: 0, verifiable_count: 0 }
  }

  const avg = scored.reduce((sum, s) => sum + s.score, 0) / scored.length
  const hasTrue = scored.some((s) => s.score >= 0.8)
  const hasFalse = scored.some((s) => s.score <= 0.2)
  const avgConfidence = Math.round(scored.reduce((sum, s) => sum + s.confidence, 0) / scored.length)

  let verdict: VerdictValue
  if (hasTrue && hasFalse) {
    verdict = 'misleading'
  } else if (avg >= 0.9) verdict = 'true'
  else if (avg >= 0.7) verdict = 'mostly_true'
  else if (avg >= 0.45) verdict = 'half_true'
  else if (avg >= 0.25) verdict = 'mostly_false'
  else verdict = 'false'

  return { verdict, confidence_pct: avgConfidence, verifiable_count: scored.length }
}
