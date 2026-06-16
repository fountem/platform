import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { hybridRetrieve, generateVerdict } from '@fountem/rag'
import { serialiseClaimVerdict } from '@fountem/verdict'
import { randomBytes } from 'crypto'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { claim?: string; speaker?: string; context?: string }
    const claim = body.claim?.trim()

    if (!claim) {
      return NextResponse.json({ error: 'claim is required' }, { status: 400 })
    }

    const db = createServiceClient()

    // Create claim record
    const { data: claimRecord, error: claimError } = await db
      .from('claims')
      .insert({
        claim_text: claim,
        claim_type: 'statistic',
        speaker: body.speaker ?? null,
        submitted_by: 'api',
        status: 'processing',
      })
      .select()
      .single()

    if (claimError || !claimRecord) {
      throw new Error(`Failed to create claim: ${claimError?.message}`)
    }

    // Retrieve relevant evidence chunks
    const chunks = await hybridRetrieve(claim, 8)

    if (chunks.length === 0) {
      // No relevant evidence found
      await db.from('claims').update({ status: 'complete' }).eq('id', claimRecord.id)
      return NextResponse.json({ error: 'Insufficient evidence in database to verify this claim' }, { status: 422 })
    }

    // Generate verdict via Claude Sonnet Citations API
    const verdictOutput = await generateVerdict(claim, chunks, { speaker: body.speaker })

    // Save verdict
    const { data: verdict, error: verdictError } = await db
      .from('verdicts')
      .insert({
        claim_id: claimRecord.id,
        verdict: verdictOutput.verdict,
        confidence_pct: verdictOutput.confidence_pct,
        summary: verdictOutput.summary,
        reasoning: verdictOutput.reasoning,
        what_would_change_this: verdictOutput.what_would_change_this,
        evidence_chunk_ids: chunks.map(c => c.id),
        source_citations: verdictOutput.source_citations,
        model_used: verdictOutput.model_used,
        prompt_tokens: verdictOutput.prompt_tokens,
        completion_tokens: verdictOutput.completion_tokens,
      })
      .select()
      .single()

    if (verdictError || !verdict) {
      throw new Error(`Failed to save verdict: ${verdictError?.message}`)
    }

    // Update claim status
    await db.from('claims').update({ status: 'complete' }).eq('id', claimRecord.id)

    // Create correction pack
    const slug = randomBytes(4).toString('base64url')
    const { data: pack, error: packError } = await db
      .from('correction_packs')
      .insert({ slug, verdict_id: verdict.id })
      .select()
      .single()

    if (packError || !pack) {
      throw new Error(`Failed to create correction pack: ${packError?.message}`)
    }

    const card = serialiseClaimVerdict(verdict, claim, pack)
    return NextResponse.json(card)
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Verification failed' },
      { status: 500 }
    )
  }
}
