import OpenAI from 'openai'
import { chunkDocument } from './chunker'
import type { SourceType } from '@fountem/db'

// Lazy-init so importing this module doesn't require OPENAI_API_KEY at build.
let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export interface IngestSourceOptions {
  sourceType: SourceType
  title: string
  url: string
  publisher: string
  publishedAt: string
  rawText: string
  topicTags?: string[]
  partyRelevance?: string[]
  dbClient: any
}

export async function ingestSource(opts: IngestSourceOptions): Promise<{ sourceId: string; chunksIngested: number }> {
  const { dbClient, rawText, sourceType, title, url, publisher, publishedAt, topicTags = [], partyRelevance = [] } = opts

  // Upsert source
  const { data: source, error: sourceError } = await dbClient
    .from('evidence_sources')
    .upsert({ source_type: sourceType, title, url, publisher, published_at: publishedAt, raw_text: rawText })
    .select()
    .single()

  if (sourceError || !source) throw new Error(`Failed to upsert source: ${sourceError?.message}`)

  // Chunk document
  const chunks = chunkDocument(rawText)

  // Embed all chunks
  const texts = chunks.map(c => c.content)
  const embeddingResponse = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })

  // Insert chunks with embeddings
  const rows = chunks.map((chunk, i) => ({
    source_id: source.id,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    embedding: embeddingResponse.data[i].embedding,
    topic_tags: topicTags,
    party_relevance: partyRelevance,
  }))

  // Delete existing chunks for this source (re-ingest)
  await dbClient.from('evidence_chunks').delete().eq('source_id', source.id)

  // Insert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50)
    const { error } = await dbClient.from('evidence_chunks').insert(batch)
    if (error) throw new Error(`Failed to insert chunks batch ${i}: ${error.message}`)
  }

  return { sourceId: source.id, chunksIngested: chunks.length }
}
