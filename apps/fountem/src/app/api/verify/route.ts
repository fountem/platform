import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { hybridRetrieve } from '@fountem/rag'
import { generateVerdict } from '@fountem/rag'
import { serialiseClaimVerdict } from '@fountem/verdict'
import { randomBytes, createHash } from 'crypto'

export const maxDuration = 60

async function getApiTierLimit(apiKey: string | null, db: any): Promise<{ tier: string; limit: number } | null> {
  if (!apiKey) return { tier: 'public', limit: 10 }  // IP-based rate limit handled separately
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const { data } = await db.from('api_keys').select('tier, monthly_limit, requests_this_month, is_active').eq('key_hash', keyHash).single()
  if (!data || !data.is_active) return null
  return { tier: data.tier, limit: data.monthly_limit }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { claim?: string }
    const claimText = body.claim?.trim()
    if (!claimText || claimText.length < 10) {
      return NextResponse.json({ error: 'claim must be at least 10 characters' }, { status: 400 })
    }
    if (claimText.length > 500) {
      return NextResponse.json({ error: 'claim must be under 500 characters' }, { status: 400 })
    }

    const db = createServiceClient()
    const apiKey = req.headers.get('x-api-key')
    const tierInfo = await getApiTierLimit(apiKey, db)
    if (tierInfo === null) {
      return NextResponse.json({ error: 'Invalid or inactive API key' }, { status: 401 })
    }

    // Save claim
    const { data: claim, error: claimError } = await db
      .from('claims')
      .insert({ claim_text: claimText, claim_type: 'statistic', status: 'processing', submitted_by: apiKey ? 'api' : 'web' })
      .select()
      .single()

    if (claimError || !claim) throw new Error(`Failed to save claim: ${claimError?.message}`)

    // Retrieve evidence chunks
    const chunks = await hybridRetrieve({ query: claimText, limit: 8, dbClient: db })

    // Get source metadata for retrieved chunks
    const sourceIds = [...new Set(chunks.map(c => c.source_id))]
    const { data: sources } = await db.from('evidence_sources').select('id, title, url, publisher, published_at').in('id', sourceIds)
    const sourceMetadata: Record<string, any> = {}
    ;(sources ?? []).forEach((s: any) => { sourceMetadata[s.id] = s })

    // Generate verdict with Claude
    const verdictResult = await generateVerdict(claimText, chunks, sourceMetadata)

    // Save verdict
    const { data: verdict, error: verdictError } = await db
      .from('verdicts')
      .insert({
        claim_id: claim.id,
        verdict: verdictResult.verdict,
        confidence_pct: verdictResult.confidence_pct,
        summary: verdictResult.summary,
        reasoning: verdictResult.reasoning,
        what_would_change_this: verdictResult.what_would_change_this,
        evidence_chunk_ids: verdictResult.evidence_chunk_ids,
        source_citations: verdictResult.source_citations,
        model_used: 'claude-sonnet-4-5',
        prompt_tokens: verdictResult.prompt_tokens,
        completion_tokens: verdictResult.completion_tokens,
      })
      .select()
      .single()

    if (verdictError || !verdict) throw new Error(`Failed to save verdict: ${verdictError?.message}`)

    // Update claim status
    await db.from('claims').update({ status: 'complete' }).eq('id', claim.id)

    // Create correction pack
    const slug = randomBytes(4).toString('base64url')
    const { data: pack } = await db
      .from('correction_packs')
      .insert({ slug, verdict_id: verdict.id })
      .select()
      .single()

    const card = serialiseClaimVerdict(verdict, claimText, pack ?? null)
    return NextResponse.json(card)
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Verification failed' }, { status: 500 })
  }
}
