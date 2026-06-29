/**
 * Check-worthy claim extraction (gateway-side). Mirrors @fountem/live's
 * claim-extractor; vendored because services build standalone. Includes the
 * personal-character guardrail (RPA s.106 / defamation risk).
 */
import OpenAI from 'openai'
import { createHash } from 'node:crypto'
import type { TranscriptSegment } from './deepgram.js'

export interface ExtractedClaim {
  claimText: string
  transcriptExcerpt: string
  speaker: string | null
  checkWorthiness: number
}

const CHARACTER_TERMS =
  /\b(liar|lied|corrupt|criminal|fraud(ster)?|paedophile|racist|crook|cheat(ed|er)?|adulter|drunk|coward|traitor)\b/i

export function isCharacterAttack(text: string): boolean {
  return CHARACTER_TERMS.test(text)
}

export function claimHash(text: string): string {
  return createHash('sha256').update(text.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex')
}

const SYSTEM_PROMPT = `You extract CHECK-WORTHY factual claims from a live transcript of a debate or interview.

A check-worthy claim is a specific, verifiable assertion of fact (statistics, events, comparisons, records, policy outcomes).

DO NOT extract:
- opinions, predictions, rhetorical questions, or value judgements
- attacks on a person's personal character or private conduct
- vague or non-falsifiable statements

Return STRICT JSON: {"claims":[{"claim_text":"...","transcript_excerpt":"...","speaker":"...","check_worthiness":0.0-1.0}]}
If there are none, return {"claims":[]}.`

let _openai: OpenAI | null = null
function openai(key: string): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: key })
  return _openai
}

export async function extractClaims(
  segments: TranscriptSegment[],
  opts: { apiKey: string; contextText?: string; minCheckWorthiness?: number; seenHashes: Set<string> },
): Promise<ExtractedClaim[]> {
  const finals = segments.filter((s) => s.isFinal && s.text.trim().length > 0)
  if (finals.length === 0) return []

  const transcript = finals.map((s) => `${s.speaker ?? 'Speaker'}: ${s.text}`).join('\n')
  const userContent = [
    opts.contextText ? `RECENT CONTEXT (already processed, do not re-extract):\n${opts.contextText}` : '',
    `NEW TRANSCRIPT:\n${transcript}`,
  ].filter(Boolean).join('\n\n')

  let candidates: ExtractedClaim[] = []
  try {
    const res = await openai(opts.apiKey).chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 700,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    })
    const parsed = JSON.parse(res.choices[0]?.message?.content ?? '{"claims":[]}') as {
      claims?: { claim_text?: string; transcript_excerpt?: string; speaker?: string; check_worthiness?: number }[]
    }
    candidates = (parsed.claims ?? []).map((c) => ({
      claimText: (c.claim_text ?? '').trim(),
      transcriptExcerpt: (c.transcript_excerpt ?? c.claim_text ?? '').trim(),
      speaker: c.speaker ?? null,
      checkWorthiness: typeof c.check_worthiness === 'number' ? Math.max(0, Math.min(1, c.check_worthiness)) : 0.5,
    }))
  } catch (e) {
    console.error('[gateway] extract error', (e as Error).message)
    return []
  }

  const minWorth = opts.minCheckWorthiness ?? 0.5
  const out: ExtractedClaim[] = []
  for (const c of candidates) {
    if (!c.claimText || c.claimText.length < 8) continue
    if (c.checkWorthiness < minWorth) continue
    if (isCharacterAttack(c.claimText)) continue
    const h = claimHash(c.claimText)
    if (opts.seenHashes.has(h)) continue
    opts.seenHashes.add(h)
    out.push(c)
  }
  return out
}
