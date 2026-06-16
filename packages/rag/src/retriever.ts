/**
 * Hybrid BM25 + pgvector retriever with Reciprocal Rank Fusion (RRF) merge.
 * BM25 catches exact term matches (e.g. "housing starts 2024").
 * Vector catches semantic matches (e.g. "new homes built" → "housing construction").
 * RRF merges both ranked lists into a single ordered result.
 */

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface RetrievedChunk {
  id: string
  content: string
  source_id: string
  topic_tags: string[]
  bm25_rank: number | null
  vector_rank: number | null
  rrf_score: number
}

const RRF_K = 60 // Standard RRF constant

function rrfScore(bm25Rank: number | null, vectorRank: number | null): number {
  const bm25 = bm25Rank !== null ? 1 / (RRF_K + bm25Rank) : 0
  const vec  = vectorRank !== null ? 1 / (RRF_K + vectorRank) : 0
  return bm25 + vec
}

export async function embedQuery(query: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  return response.data[0].embedding
}

export interface HybridRetrieveOptions {
  query: string
  limit?: number
  topicTags?: string[]
  dbClient: any  // Supabase client
}

export async function hybridRetrieve({
  query,
  limit = 8,
  topicTags,
  dbClient,
}: HybridRetrieveOptions): Promise<RetrievedChunk[]> {
  // Run BM25 and vector search in parallel
  const [bm25Results, embedding] = await Promise.all([
    dbClient.rpc('bm25_search', { query_text: query, limit: limit * 2 }),
    embedQuery(query),
  ])

  const vectorResults = await dbClient.rpc('vector_search', {
    query_embedding: embedding,
    limit: limit * 2,
  })

  // Build rank maps
  const bm25Map = new Map<string, number>()
  const vectorMap = new Map<string, number>()
  const chunkMap = new Map<string, any>()

  ;(bm25Results.data ?? []).forEach((chunk: any, rank: number) => {
    bm25Map.set(chunk.id, rank)
    chunkMap.set(chunk.id, chunk)
  })

  ;(vectorResults.data ?? []).forEach((chunk: any, rank: number) => {
    vectorMap.set(chunk.id, rank)
    chunkMap.set(chunk.id, chunk)
  })

  // Merge all chunk IDs
  const allIds = new Set([...bm25Map.keys(), ...vectorMap.keys()])

  // Score with RRF
  const scored: RetrievedChunk[] = []
  for (const id of allIds) {
    const chunk = chunkMap.get(id)
    if (!chunk) continue

    // Filter by topic tags if specified
    if (topicTags && topicTags.length > 0) {
      const chunkTags: string[] = chunk.topic_tags ?? []
      const hasTag = topicTags.some(t => chunkTags.includes(t))
      if (!hasTag) continue
    }

    scored.push({
      id,
      content: chunk.content,
      source_id: chunk.source_id,
      topic_tags: chunk.topic_tags ?? [],
      bm25_rank: bm25Map.get(id) ?? null,
      vector_rank: vectorMap.get(id) ?? null,
      rrf_score: rrfScore(bm25Map.get(id) ?? null, vectorMap.get(id) ?? null),
    })
  }

  // Sort by RRF score descending, return top-N
  return scored.sort((a, b) => b.rrf_score - a.rrf_score).slice(0, limit)
}
