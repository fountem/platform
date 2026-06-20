/**
 * Evidence gathering orchestrator (corpus-first, web-augmented).
 *
 * Policy:
 *   1. Always retrieve from the trusted corpus first (hybrid BM25 + vector).
 *   2. Augment with open-web evidence when `allowWeb` is set AND either the
 *      caller forces it or corpus coverage is thin (few/low-ranked chunks).
 *   3. Tag every chunk's source with a tier ('primary' | 'web') so the verdict
 *      UI can show provenance and so web is visibly weighted below primary.
 *
 * Shared by `/api/verify-text` (Unfaked) and the live verify worker.
 */

import type { SourceCitation, SourceTier } from '@fountem/db'
import { hybridRetrieve, type RetrievedChunk } from './retriever'
import { webSearchEvidence, type WebSourceMeta } from './web-search'
import { isMockMode, mockRetrieve } from './mock'

export interface SourceMeta {
  title: string
  url: string
  publisher: string
  published_at: string
}

export interface GatheredEvidence {
  chunks: RetrievedChunk[]
  sourceMetadata: Record<string, SourceMeta>
  tierBySourceId: Record<string, SourceTier>
  usedWeb: boolean
}

export interface GatherEvidenceOptions {
  query: string
  dbClient: any
  /** Permit open-web augmentation at all. */
  allowWeb?: boolean
  /** Skip the coverage check and always pull web (used for live/general claims). */
  forceWeb?: boolean
  corpusLimit?: number
  webLimit?: number
  /** Bias web search toward recent material (good for live). */
  recencyDays?: number
}

/** Corpus is "thin" when we get few chunks or only weakly-ranked ones. */
function corpusCoverageIsThin(chunks: RetrievedChunk[]): boolean {
  if (chunks.length < 3) return true
  const top = chunks[0]?.rrf_score ?? 0
  return top < 0.02
}

export async function gatherEvidence(opts: GatherEvidenceOptions): Promise<GatheredEvidence> {
  const { query, dbClient, allowWeb = true, forceWeb = false, corpusLimit = 8, webLimit = 5, recencyDays } = opts

  // 1. Corpus retrieval (+ source metadata).
  let corpusChunks: RetrievedChunk[] = []
  const sourceMetadata: Record<string, SourceMeta> = {}
  const tierBySourceId: Record<string, SourceTier> = {}

  if (isMockMode()) {
    const mock = mockRetrieve(query)
    corpusChunks = mock.chunks
    Object.assign(sourceMetadata, mock.sourceMetadata)
  } else {
    corpusChunks = await hybridRetrieve({ query, limit: corpusLimit, dbClient })
    const sourceIds = [...new Set(corpusChunks.map((c) => c.source_id))]
    if (sourceIds.length > 0) {
      const { data: sources } = await dbClient
        .from('evidence_sources')
        .select('id, title, url, publisher, published_at')
        .in('id', sourceIds)
      ;(sources ?? []).forEach((s: any) => {
        sourceMetadata[s.id] = { title: s.title, url: s.url, publisher: s.publisher, published_at: s.published_at }
      })
    }
  }
  corpusChunks.forEach((c) => {
    tierBySourceId[c.source_id] = 'primary'
  })

  // 2. Web augmentation.
  let usedWeb = false
  if (allowWeb && (forceWeb || corpusCoverageIsThin(corpusChunks))) {
    const web = await webSearchEvidence(query, { limit: webLimit, recencyDays })
    if (web.chunks.length > 0) {
      usedWeb = true
      corpusChunks = [...corpusChunks, ...web.chunks]
      Object.entries(web.sourceMetadata).forEach(([id, meta]: [string, WebSourceMeta]) => {
        sourceMetadata[id] = meta
      })
      Object.assign(tierBySourceId, web.tierBySourceId)
    }
  }

  // 3. Re-rank by RRF so the strongest evidence (usually corpus) leads.
  corpusChunks.sort((a, b) => b.rrf_score - a.rrf_score)

  return { chunks: corpusChunks, sourceMetadata, tierBySourceId, usedWeb }
}

/**
 * Stamp each citation with its source tier so the UI can label provenance.
 * Citations carry a chunk_id; we map chunk → source → tier.
 */
export function applyCitationTiers(
  citations: SourceCitation[],
  chunks: RetrievedChunk[],
  tierBySourceId: Record<string, SourceTier>,
): SourceCitation[] {
  const sourceByChunk = new Map(chunks.map((c) => [c.id, c.source_id]))
  return citations.map((c) => {
    const sourceId = sourceByChunk.get(c.chunk_id)
    const tier = sourceId ? tierBySourceId[sourceId] : undefined
    return { ...c, source_tier: tier ?? 'primary' }
  })
}
