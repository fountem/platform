import OpenAI from 'openai'
import { createServiceClient, type EvidenceChunk } from '@fountem/db'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface RankedChunk extends EvidenceChunk {
  rrf_score: number
  bm25_rank?: number
  vector_rank?: number
}

function reciprocalRankFusion(
  bm25: EvidenceChunk[],
  vector: EvidenceChunk[],
  k = 60,
  topN = 8
): RankedChunk[] {
  const scores = new Map<string, { chunk: EvidenceChunk; score: number; bm25_rank?: number; vector_rank?: number }>()

  bm25.forEach((chunk, rank) => {
    scores.set(chunk.id, {
      chunk,
      score: 1 / (k + rank + 1),
      bm25_rank: rank + 1,
    })
  })

  vector.forEach((chunk, rank) => {
    const existing = scores.get(chunk.id)
    const vectorContribution = 1 / (k + rank + 1)
    if (existing) {
      existing.score += vectorContribution
      existing.vector_rank = rank + 1
    } else {
      scores.set(chunk.id, {
        chunk,
        score: vectorContribution,
        vector_rank: rank + 1,
      })
    }
  })

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ chunk, score, bm25_rank, vector_rank }) => ({
      ...chunk,
      rrf_score: score,
      bm25_rank,
      vector_rank,
    }))
}

export async function hybridRetrieve(
  query: string,
  topK = 8,
  topicFilter?: string[]
): Promise<RankedChunk[]> {
  const db = createServiceClient()

  // Generate embedding
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  })
  const embedding = embeddingResponse.data[0].embedding

  // Run BM25 and vector search in parallel
  const [bm25Response, vectorResponse] = await Promise.all([
    db.rpc('bm25_search', { query_text: query, limit: 20 }),
    db.rpc('vector_search', { query_embedding: embedding, limit: 20 }),
  ])

  const bm25Results: EvidenceChunk[] = bm25Response.data ?? []
  const vectorResults: EvidenceChunk[] = vectorResponse.data ?? []

  // Apply topic filter if provided
  const filterByTopic = (chunks: EvidenceChunk[]) =>
    topicFilter?.length
      ? chunks.filter(c => c.topic_tags.some(t => topicFilter.includes(t)))
      : chunks

  return reciprocalRankFusion(
    filterByTopic(bm25Results),
    filterByTopic(vectorResults),
    60,
    topK
  )
}
