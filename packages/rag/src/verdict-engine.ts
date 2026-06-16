import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@fountem/db'
import type { RankedChunk } from './retriever'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are Fountem's verification engine. Your sole purpose is to assess UK political claims against provided source documents.

RULES — never break these:
1. Every factual assertion must cite a specific passage from the provided documents. Never reason from memory.
2. If documents lack sufficient evidence, return verdict: "inconclusive" and state exactly what is missing.
3. Never express a political opinion. Assess claims, not politicians.
4. The "what_would_change_this" field is MANDATORY. State specific evidence that would alter your verdict.
5. Use plain English. Write for a voter, not an academic.
6. Confidence must reflect evidential strength, not rhetorical certainty. Low evidence = low confidence.

OUTPUT — strict JSON only, no preamble:
{
  "verdict": "true|mostly_true|half_true|mostly_false|false|misleading|unverifiable|inconclusive",
  "confidence_pct": 0-100,
  "summary": "1-2 sentence plain-English verdict",
  "reasoning": "Full reasoning with inline source references",
  "what_would_change_this": "Specific evidence that would change this verdict",
  "source_citations": [
    {"url": "", "title": "", "publisher": "", "quote": "exact quote from source"}
  ]
}`

export interface VerdictOutput {
  verdict: string
  confidence_pct: number
  summary: string
  reasoning: string
  what_would_change_this: string
  source_citations: Array<{
    url: string
    title: string
    publisher: string
    quote: string
  }>
  prompt_tokens: number
  completion_tokens: number
  model_used: string
}

export async function generateVerdict(
  claim: string,
  chunks: RankedChunk[],
  context?: { speaker?: string; spoken_at?: string }
): Promise<VerdictOutput> {
  // Build document content blocks for Citations API
  const documentBlocks = chunks.map(chunk => ({
    type: 'document' as const,
    source: {
      type: 'text' as const,
      media_type: 'text/plain' as const,
      data: chunk.content,
    },
    title: `Source chunk (topic: ${chunk.topic_tags.join(', ')})`,
    citations: { enabled: true },
  }))

  const claimContext = context?.speaker
    ? `Claim by ${context.speaker}${context.spoken_at ? ` on ${context.spoken_at}` : ''}: "${claim}"`
    : `Claim to verify: "${claim}"`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          ...documentBlocks,
          { type: 'text', text: claimContext },
        ],
      },
    ],
  })

  const rawText = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('')

  // Parse JSON from response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude did not return valid JSON verdict')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    ...parsed,
    prompt_tokens: response.usage.input_tokens,
    completion_tokens: response.usage.output_tokens,
    model_used: 'claude-sonnet-4-6',
  }
}
