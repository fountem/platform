import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import type { Verdict, CorrectionPack, ClaimType } from '@fountem/db'
import { gatherEvidence, generateVerdict, applyCitationTiers, mockGenerateVerdict } from '@fountem/rag'
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
import { createHash, randomBytes } from 'crypto'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export const maxDuration = 60

const IP_HOURLY_LIMIT = Number(process.env.VERIFY_TEXT_IP_HOURLY_LIMIT ?? 30)
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://unfaked.ai'
const ATTRIBUTION = 'Checked by Unfaked · powered by Fountem evidence'

/** Normalise for dedup/caching: lowercased, whitespace-collapsed. */
function normaliseClaim(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Lightweight claim classification (no extra LLM call). */
function classifyClaim(text: string): ClaimType {
  return /\d|\bpercent\b|%|\bbillion\b|\bmillion\b|\bthousand\b/i.test(text) ? 'statistic' : 'general'
}

function serialise(verdict: Verdict, claimText: string, pack: CorrectionPack | null) {
  return serialiseClaimVerdict(verdict, claimText, pack, {
    baseUrl: BASE_URL,
    packPath: 'check',
    attribution: ATTRIBUTION,
  })
}

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

    const claimHash = createHash('sha256').update(normaliseClaim(claimText)).digest('hex')

    // Offline/demo mode: real verdict shaping on mock evidence; skip auth/quota/DB.
    if (isMockMode()) {
      const evidence = await gatherEvidence({ query: claimText, dbClient: {}, forceWeb: true })
      const result = mockGenerateVerdict(claimText, evidence.chunks, evidence.sourceMetadata)
      const now = new Date().toISOString()
      const verdict: Verdict = {
        id: `mock-${randomBytes(6).toString('hex')}`,
        claim_id: `mock-claim-${randomBytes(4).toString('hex')}`,
        verdict: result.verdict,
        confidence_pct: result.confidence_pct,
        summary: result.summary,
        reasoning: result.reasoning,
        what_would_change_this: result.what_would_change_this,
        evidence_chunk_ids: result.evidence_chunk_ids,
        source_citations: applyCitationTiers(result.source_citations, evidence.chunks, evidence.tierBySourceId),
        model_used: 'mock',
        prompt_tokens: result.prompt_tokens,
        completion_tokens: result.completion_tokens,
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
      return NextResponse.json(serialise(verdict, claimText, pack))
    }

    const db = createServiceClient()

    // Access control — B2B keys use their monthly quota; everyone else signs in.
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Sign in to check a claim.' }, { status: 401 })
      }
      userId = user.id

      const ip = clientIpFromHeaders(req.headers)
      const hourly = await rateLimit(`verify-text:h:${ip}`, IP_HOURLY_LIMIT, 3600)
      if (!hourly.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'retry-after': String(hourly.resetSec) } },
        )
      }
    }

    // Cache lookup by claim hash BEFORE charging quota (cached results are free).
    const { data: cachedClaim } = await db
      .from('claims')
      .select('id, claim_text')
      .eq('claim_hash', claimHash)
      .maybeSingle()
    if (cachedClaim) {
      const { data: cachedVerdict } = await db
        .from('verdicts')
        .select('*')
        .eq('claim_id', cachedClaim.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (cachedVerdict) {
        let { data: pack } = await db
          .from('correction_packs')
          .select('*')
          .eq('verdict_id', cachedVerdict.id)
          .maybeSingle()
        if (!pack) {
          const created = await db
            .from('correction_packs')
            .insert({ slug: randomBytes(4).toString('base64url'), verdict_id: cachedVerdict.id })
            .select()
            .single()
          pack = created.data
        }
        return NextResponse.json(serialise(cachedVerdict, cachedClaim.claim_text, pack))
      }
    }

    // Enforce spend limits for a real (uncached) run.
    if (!isApi && userId) {
      const { data: quota } = await db.rpc('increment_user_usage', {
        p_user_id: userId,
        p_product: 'unfaked',
        p_limit: DEFAULT_DAILY_LIMITS.unfaked,
      })
      const quotaRow = quota?.[0]
      if (quotaRow && !quotaRow.allowed) {
        return NextResponse.json(
          { error: `Daily free limit reached (${quotaRow.day_limit} checks). It resets tomorrow.` },
          { status: 429 },
        )
      }
      const { data: budget } = await db.rpc('increment_global_budget', {
        p_product: 'unfaked',
        p_cap: DEFAULT_GLOBAL_CAPS.unfaked,
      })
      const budgetRow = budget?.[0]
      if (budgetRow && !budgetRow.allowed) {
        return NextResponse.json(
          { error: 'Unfaked is at capacity for today. Please try again tomorrow.' },
          { status: 503 },
        )
      }
    }

    // Save the claim.
    const { data: claim, error: claimError } = await db
      .from('claims')
      .insert({
        claim_text: claimText,
        claim_type: classifyClaim(claimText),
        input_kind: 'text',
        claim_hash: claimHash,
        user_id: userId,
        status: 'processing',
        submitted_by: apiKey ? 'api' : 'web',
      })
      .select()
      .single()
    if (claimError || !claim) throw new Error(`Failed to save claim: ${claimError?.message}`)

    // Gather evidence (corpus-first, web-augmented) and generate the verdict.
    const evidence = await gatherEvidence({ query: claimText, dbClient: db, allowWeb: true })
    const verdictResult = await generateVerdict(claimText, evidence.chunks, evidence.sourceMetadata)
    const tieredCitations = applyCitationTiers(verdictResult.source_citations, evidence.chunks, evidence.tierBySourceId)

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
        source_citations: tieredCitations,
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

    return NextResponse.json(serialise(verdict, claimText, pack ?? null))
  } catch (error) {
    captureException(error, { route: 'POST /api/verify-text' })
    return NextResponse.json({ error: 'Verification failed. Please try again.' }, { status: 500 })
  }
}
