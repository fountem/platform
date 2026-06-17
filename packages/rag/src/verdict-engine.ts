/**
 * Claude Sonnet verdict engine — takes retrieved chunks and produces
 * a structured verdict with citations via the Anthropic Citations API.
 * 
 * Key principle: the model is CONSTRAINED to the retrieved passages.
 * It cannot hallucinate a source that isn't in the evidence set.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { VerdictValue, SourceCitation } from '@fountem/db'
import type { RetrievedChunk } from './retriever'
import { isMockMode, mockGenerateVerdict } from './mock'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface RagVerdictResult {
  verdict: VerdictValue
  confidence_pct: number
  summary: string
  reasoning: string
  what_would_change_this: string
  source_citations: SourceCitation[]
  evidence_chunk_ids: string[]
  prompt_tokens: number
  completion_tokens: number
}

const SYSTEM_PROMPT = `You are Fountem's fact-checking engine. Your sole job is to assess whether a political claim is accurate based on the evidence passages provided.

RULES — non-negotiable:
1. You MUST reason only from the provided evidence passages. Do not use any knowledge outside these passages.
2. Every factual claim in your verdict MUST be supported by a cited passage. If it isn't supported, don't state it.
3. If the evidence is insufficient to reach a verdict, return "unverifiable" — do not guess.
4. You MUST NOT express a political opinion or show favour to any party.
5. Return your verdict in the exact JSON format specified.

VERDICT VALUES (choose exactly one):
- "true": Claim is accurate and supported by evidence.
- "mostly_true": Claim is substantially accurate with minor inaccuracies.
- "half_true": Claim contains a mix of accurate and inaccurate elements.
- "mostly_false": Claim is substantially inaccurate with some accurate elements.
- "false": Claim is directly contradicted by evidence.
- "misleading": Claim may be technically accurate but creates a false impression.
- "unverifiable": Insufficient evidence to reach a verdict.
- "inconclusive": Evidence is conflicting or ambiguous.`

export async function generateVerdict(
  claimText: string,
  chunks: RetrievedChunk[],
  sourceMetadata: Record<string, { title: string; url: string; publisher: string; published_at: string }>
): Promise<RagVerdictResult> {
  if (isMockMode()) return mockGenerateVerdict(claimText, chunks, sourceMetadata)

  if (chunks.length === 0) {
    return {
      verdict: 'unverifiable',
      confidence_pct: 0,
      summary: 'No relevant evidence found in the Fountem evidence database for this claim.',
      reasoning: 'No evidence passages were retrieved for this query. The claim cannot be assessed.',
      what_would_change_this: 'Adding relevant primary source data (ONS statistics, Hansard records, IFS analysis) would allow this claim to be assessed.',
      source_citations: [],
      evidence_chunk_ids: [],
      prompt_tokens: 0,
      completion_tokens: 0,
    }
  }

  // Format chunks as Anthropic document blocks for Citations API
  const documentBlocks = chunks.map((chunk, i) => ({
    type: 'document' as const,
    source: {
      type: 'text' as const,
      media_type: 'text/plain' as const,
      data: chunk.content,
    },
    title: sourceMetadata[chunk.source_id]?.title ?? `Evidence passage ${i + 1}`,
    context: `Publisher: ${sourceMetadata[chunk.source_id]?.publisher ?? 'Unknown'} | Published: ${sourceMetadata[chunk.source_id]?.published_at ?? 'Unknown'} | URL: ${sourceMetadata[chunk.source_id]?.url ?? 'Unknown'}`,
    citations: { enabled: true },
  }))

  const userMessage = `CLAIM TO ASSESS: "${claimText}"

Assess this claim using ONLY the evidence passages provided above. Return your assessment as JSON in this exact format:

{
  "verdict": "<verdict_value>",
  "confidence_pct": <0-100>,
  "summary": "<1-2 sentence plain English summary for a general audience>",
  "reasoning": "<3-5 sentences explaining which evidence supports or contradicts the claim>",
  "what_would_change_this": "<what new evidence or data would change this verdict>"
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [...documentBlocks, { type: 'text', content: userMessage }] as any,
      },
    ],
  })

  const rawText = response.content
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('')

  // Extract JSON from response
  const jsonMatch = rawText.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Claude returned non-JSON response')

  const parsed = JSON.parse(jsonMatch[0]) as {
    verdict: VerdictValue
    confidence_pct: number
    summary: string
    reasoning: string
    what_would_change_this: string
  }

  // Extract citations from response blocks
  const citations: SourceCitation[] = []
  for (const block of response.content as any[]) {
    if (block.type === 'text' && block.citations) {
      for (const citation of block.citations) {
        const chunkId = chunks[citation.document_index]?.id
        const meta = chunkId ? sourceMetadata[chunks[citation.document_index]?.source_id] : null
        if (chunkId && meta && !citations.find(c => c.chunk_id === chunkId)) {
          citations.push({
            chunk_id: chunkId,
            source_title: meta.title,
            source_url: meta.url,
            publisher: meta.publisher,
            published_at: meta.published_at,
            excerpt: citation.cited_text?.slice(0, 300) ?? '',
          })
        }
      }
    }
  }

  return {
    verdict: parsed.verdict,
    confidence_pct: Math.min(100, Math.max(0, parsed.confidence_pct)),
    summary: parsed.summary,
    reasoning: parsed.reasoning,
    what_would_change_this: parsed.what_would_change_this,
    source_citations: citations,
    evidence_chunk_ids: chunks.map(c => c.id),
    prompt_tokens: response.usage.input_tokens,
    completion_tokens: response.usage.output_tokens,
  }
}
