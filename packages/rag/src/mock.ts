/**
 * Offline fixtures for the RAG pipeline. Active only when MOCK_SERVICES is set.
 *
 * Replaces OpenAI embeddings + the Supabase evidence corpus (mockRetrieve) and the
 * Claude verdict engine (mockGenerateVerdict) with deterministic data, so a claim check
 * runs end-to-end locally with no keys and no database. The verdict shaping, citation
 * structure and serialisers are still the real ones — only the model/corpus are faked.
 */

import type { VerdictValue, SourceCitation } from '@fountem/db'
import type { RetrievedChunk } from './retriever'
import type { RagVerdictResult } from './verdict-engine'

export function isMockMode(): boolean {
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

interface MockSourceMeta {
  title: string
  url: string
  publisher: string
  published_at: string
}

const MOCK_CHUNKS: { chunk: RetrievedChunk; meta: MockSourceMeta; excerpt: string }[] = [
  {
    chunk: { id: 'mock-chunk-ons', content: 'ONS data shows the relevant metric changed by a measured amount over the stated period, with year-on-year figures published quarterly.', source_id: 'mock-src-ons', topic_tags: ['economy', 'statistics'], bm25_rank: 0, vector_rank: 0, rrf_score: 0.9 },
    meta: { title: 'ONS Quarterly Statistics', url: 'https://www.ons.gov.uk/', publisher: 'Office for National Statistics', published_at: '2026-03-01' },
    excerpt: 'the relevant metric changed by a measured amount over the stated period',
  },
  {
    chunk: { id: 'mock-chunk-ifs', content: 'IFS analysis notes important context and caveats that qualify headline figures, including baseline effects and definitional choices.', source_id: 'mock-src-ifs', topic_tags: ['economy', 'analysis'], bm25_rank: 1, vector_rank: 2, rrf_score: 0.7 },
    meta: { title: 'IFS Briefing Note', url: 'https://ifs.org.uk/', publisher: 'Institute for Fiscal Studies', published_at: '2026-02-10' },
    excerpt: 'important context and caveats that qualify headline figures',
  },
  {
    chunk: { id: 'mock-chunk-hansard', content: 'Hansard records the original statement as made in the House on the date in question.', source_id: 'mock-src-hansard', topic_tags: ['parliament'], bm25_rank: 2, vector_rank: 1, rrf_score: 0.6 },
    meta: { title: 'Hansard Debate Record', url: 'https://hansard.parliament.uk/', publisher: 'UK Parliament', published_at: '2026-01-22' },
    excerpt: 'the original statement as made in the House',
  },
]

export function mockRetrieve(query: string): {
  chunks: RetrievedChunk[]
  sourceMetadata: Record<string, MockSourceMeta>
} {
  // "no evidence" / very short → return empty so the engine returns unverifiable.
  if (/no evidence|gibberish|asdf/i.test(query)) {
    return { chunks: [], sourceMetadata: {} }
  }
  const sourceMetadata: Record<string, MockSourceMeta> = {}
  MOCK_CHUNKS.forEach(({ chunk, meta }) => {
    sourceMetadata[chunk.source_id] = meta
  })
  return { chunks: MOCK_CHUNKS.map((c) => c.chunk), sourceMetadata }
}

const VERDICTS: VerdictValue[] = ['true', 'mostly_true', 'half_true', 'misleading', 'mostly_false', 'false']

export function mockGenerateVerdict(
  claimText: string,
  chunks: RetrievedChunk[],
  sourceMetadata: Record<string, { title: string; url: string; publisher: string; published_at: string }>,
): RagVerdictResult {
  if (chunks.length === 0) {
    return {
      verdict: 'unverifiable',
      confidence_pct: 0,
      summary: 'No relevant evidence found in the (mock) evidence database for this claim.',
      reasoning: 'No evidence passages were retrieved for this query, so the claim cannot be assessed.',
      what_would_change_this: 'Adding relevant primary-source data (ONS, Hansard, IFS) would allow this claim to be assessed.',
      source_citations: [],
      evidence_chunk_ids: [],
      prompt_tokens: 0,
      completion_tokens: 0,
    }
  }

  // Absolute/superlative claims skew toward "misleading"; otherwise seeded.
  const superlatives = /(record|most|more than any|fastest|highest|lowest|ever|never)/i.test(claimText)
  const verdict = superlatives ? 'misleading' : VERDICTS[Math.floor(seededUnit(claimText) * VERDICTS.length)]
  const confidence = 55 + Math.floor(seededUnit(`c:${claimText}`) * 35)

  const citations: SourceCitation[] = MOCK_CHUNKS.filter((c) => chunks.some((rc) => rc.id === c.chunk.id)).map((c) => {
    const meta = sourceMetadata[c.chunk.source_id] ?? c.meta
    return {
      chunk_id: c.chunk.id,
      source_title: meta.title,
      source_url: meta.url,
      publisher: meta.publisher,
      published_at: meta.published_at,
      excerpt: c.excerpt,
    }
  })

  return {
    verdict,
    confidence_pct: confidence,
    summary: `(Mock verdict) On the available primary sources, this claim is assessed as "${verdict.replace('_', ' ')}".`,
    reasoning:
      'This is a locally-generated mock verdict for offline development. The ONS figures provide the headline measure, the IFS note adds context and caveats, and Hansard confirms the original statement — together they support the verdict shown. Replace MOCK_SERVICES with real keys for a genuine assessment.',
    what_would_change_this: 'More recent ONS releases, or a clearer definition of the metric being claimed, could change this verdict.',
    source_citations: citations,
    evidence_chunk_ids: chunks.map((c) => c.id),
    prompt_tokens: 0,
    completion_tokens: 0,
  }
}
