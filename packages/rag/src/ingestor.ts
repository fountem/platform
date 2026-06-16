import OpenAI from 'openai'
import { createServiceClient, type SourceType } from '@fountem/db'
import { chunkDocument } from './chunker'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const BATCH_SIZE = 20

async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return response.data.map(d => d.embedding)
}

export async function ingestSource(params: {
  url: string
  title: string
  publisher: string
  published_at: string
  source_type: SourceType
  raw_text: string
}): Promise<{ source_id: string; chunks_created: number }> {
  const db = createServiceClient()

  // Upsert source record
  const { data: source, error: sourceError } = await db
    .from('evidence_sources')
    .upsert({
      url: params.url,
      title: params.title,
      publisher: params.publisher,
      published_at: params.published_at,
      source_type: params.source_type,
      raw_text: params.raw_text,
      is_active: true,
    }, { onConflict: 'url' })
    .select()
    .single()

  if (sourceError || !source) throw new Error(`Source upsert failed: ${sourceError?.message}`)

  // Chunk the document
  const chunks = chunkDocument(params.raw_text)

  // Delete existing chunks for this source (re-ingestion)
  await db.from('evidence_chunks').delete().eq('source_id', source.id)

  // Generate embeddings in batches
  let chunksCreated = 0
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE)
    const embeddings = await generateEmbeddings(batch.map(c => c.content))

    const rows = batch.map((chunk, idx) => ({
      source_id: source.id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      embedding: JSON.stringify(embeddings[idx]),
      topic_tags: chunk.topic_tags,
      party_relevance: chunk.party_relevance,
    }))

    const { error: insertError } = await db.from('evidence_chunks').insert(rows)
    if (insertError) throw new Error(`Chunk insert failed: ${insertError.message}`)

    chunksCreated += batch.length
    await new Promise(r => setTimeout(r, 200)) // Rate limit
  }

  return { source_id: source.id, chunks_created: chunksCreated }
}
