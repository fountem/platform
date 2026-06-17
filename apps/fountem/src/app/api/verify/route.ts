import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import type { Verdict, CorrectionPack } from '@fountem/db'
import { hybridRetrieve, generateVerdict, mockRetrieve, mockGenerateVerdict } from '@fountem/rag'
import { serialiseClaimVerdict } from '@fountem/verdict'
import {
  rateLimit,
  clientIpFromHeaders,
  enforceApiKey,
  captureException,
  isMockMode,
  DEFAULT_DAILY_LIMITS,
  DEFAULT_GLOBAL_CAPS,
} from '@fountem/core'
import { randomBytes } from 'crypto'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export const maxDuration = 60

// Per-IP safety net (in addition to per-account quotas) for signed-in users.
const IP_HOURLY_LIMIT = Number(process.env.VERIFY_IP_HOURLY_LIMIT ?? 30)

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { claim?: string }
    const claimText = body.claim?.trim()
    if (!claimText || claimText.length < 10) {
      return NextResponse.json({ error: 'claim must be at least 10 characters' }, { status: 400 })
    }
    if (claimText.length > 500) {
      return NextResponse.json({ error: 'claim must be under 500 characters' }, { status: 400 })
    }

    // Offline/demo mode: run the real verdict shaping on mock evidence, skip auth/quota/DB.
    if (isMockMode()) {
      const { chunks, sourceMetadata } = mockRetrieve(claimText)
      const verdictResult = mockGenerateVerdict(claimText, chunks, sourceMetadata)
      const now = new Date().toISOString()
      const verdict: Verdict = {
        id: `mock-${randomBytes(6).toString('hex')}`,
        claim_id: `mock-claim-${randomBytes(4).toString('hex')}`,
        verdict: verdictResult.verdict,
        confidence_pct: verdictResult.confidence_pct,
        summary: verdictResult.summary,
        reasoning: verdictResult.reasoning,
        what_would_change_this: verdictResult.what_would_change_this,
        evidence_chunk_ids: verdictResult.evidence_chunk_ids,
        source_citations: verdictResult.source_citations,
        model_used: 'mock',
        prompt_tokens: verdictResult.prompt_tokens,
        completion_tokens: verdictResult.completion_tokens,
        reviewed_by: null,
        reviewed_at: null,
        probable_generator: null,
        evasion_detected: null,
        created_at: now,
      }
      const pack: CorrectionPack = {
        id: 'mock-pack', slug: randomBytes(4).toString('base64url'),
        verdict_id: verdict.id, detection_id: null, og_image_url: null, share_count: 0, created_at: now,
      }
      return NextResponse.json(serialiseClaimVerdict(verdict, claimText, pack))
    }

    const db = createServiceClient()

    // Access control. B2B keys use their monthly quota; everyone else must be
    // signed in (so anonymous traffic can't burn paid-API credit).
    const apiKey = req.headers.get('x-api-key')
    const auth = await enforceApiKey(apiKey, async (keyHash) => {
      const { data, error } = await db.rpc('increment_api_key_usage', { p_key_hash: keyHash })
      if (error) throw error
      return data?.[0] ?? null
    })
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message ?? 'Unauthorised' }, { status: auth.status })
    }

    const isApi = auth.tier === 'api'
    let userId: string | null = null
    if (!isApi) {
      const supabase = await createSupabaseServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Sign in to check a claim.' }, { status: 401 })
      }
      userId = user.id

      const ip = clientIpFromHeaders(req.headers)
      const hourly = await rateLimit(`verify:h:${ip}`, IP_HOURLY_LIMIT, 3600)
      if (!hourly.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'retry-after': String(hourly.resetSec) } },
        )
      }

      // Per-account daily quota + global daily budget circuit-breaker.
      const { data: quota } = await db.rpc('increment_user_usage', {
        p_user_id: userId,
        p_product: 'fountem',
        p_limit: DEFAULT_DAILY_LIMITS.fountem,
      })
      const quotaRow = quota?.[0]
      if (quotaRow && !quotaRow.allowed) {
        return NextResponse.json(
          { error: `Daily free limit reached (${quotaRow.day_limit} checks). It resets tomorrow.` },
          { status: 429 },
        )
      }

      const { data: budget } = await db.rpc('increment_global_budget', {
        p_product: 'fountem',
        p_cap: DEFAULT_GLOBAL_CAPS.fountem,
      })
      const budgetRow = budget?.[0]
      if (budgetRow && !budgetRow.allowed) {
        return NextResponse.json(
          { error: 'Fountem is at capacity for today. Please try again tomorrow.' },
          { status: 503 },
        )
      }
    }

    // Save claim.
    const { data: claim, error: claimError } = await db
      .from('claims')
      .insert({ claim_text: claimText, claim_type: 'statistic', status: 'processing', submitted_by: apiKey ? 'api' : 'web' })
      .select()
      .single()
    if (claimError || !claim) throw new Error(`Failed to save claim: ${claimError?.message}`)

    // Retrieve evidence.
    const chunks = await hybridRetrieve({ query: claimText, limit: 8, dbClient: db })

    const sourceIds = [...new Set(chunks.map((c) => c.source_id))]
    const { data: sources } = await db
      .from('evidence_sources')
      .select('id, title, url, publisher, published_at')
      .in('id', sourceIds)
    const sourceMetadata: Record<string, { title: string; url: string; publisher: string; published_at: string }> = {}
    ;(sources ?? []).forEach((s) => {
      sourceMetadata[s.id] = { title: s.title, url: s.url, publisher: s.publisher, published_at: s.published_at }
    })

    // Generate verdict with Claude (document-grounded, citations enforced).
    const verdictResult = await generateVerdict(claimText, chunks, sourceMetadata)

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

    await db.from('claims').update({ status: 'complete' }).eq('id', claim.id)

    const slug = randomBytes(4).toString('base64url')
    const { data: pack } = await db
      .from('correction_packs')
      .insert({ slug, verdict_id: verdict.id })
      .select()
      .single()

    return NextResponse.json(serialiseClaimVerdict(verdict, claimText, pack ?? null))
  } catch (error) {
    captureException(error, { route: 'POST /api/verify' })
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 })
  }
}
