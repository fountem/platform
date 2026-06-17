import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import type { VideoDetection, CorrectionPack, DetectionVerdict, EvasionStatus } from '@fountem/db'
import { runDetectionPipeline, resolveMedia, shouldEscalateForReview } from '@fountem/detection'
import { serialiseDetectionVerdict } from '@fountem/verdict'
import {
  rateLimit,
  clientIpFromHeaders,
  enforceApiKey,
  validateSubmittedUrl,
  captureException,
  isMockMode,
  DEFAULT_DAILY_LIMITS,
  DEFAULT_GLOBAL_CAPS,
} from '@fountem/core'
import { createHash, randomBytes } from 'crypto'
import { createSupabaseServerClient } from '../../../lib/supabase/server'

export const maxDuration = 60

// Per-IP safety net (in addition to per-account quotas) for signed-in users.
const IP_HOURLY_LIMIT = Number(process.env.DETECT_IP_HOURLY_LIMIT ?? 15)

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { video_url?: string }
    const videoUrl = body.video_url?.trim()
    if (!videoUrl) {
      return NextResponse.json({ error: 'video_url is required' }, { status: 400 })
    }

    // 1. SSRF pre-check (authoritative SSRF defence is in the resolver service).
    const urlCheck = validateSubmittedUrl(videoUrl)
    if (!urlCheck.ok) {
      return NextResponse.json({ error: urlCheck.reason ?? 'Invalid URL' }, { status: 400 })
    }

    // Offline/demo mode: run the real pipeline on mock signals, skip auth/quota/DB.
    if (isMockMode()) {
      const media = await resolveMedia(videoUrl)
      const result = await runDetectionPipeline(media)
      const now = new Date().toISOString()
      const detection: VideoDetection = {
        id: `mock-${createHash('sha256').update(videoUrl).digest('hex').slice(0, 12)}`,
        claim_id: null,
        video_url: videoUrl,
        video_hash: createHash('sha256').update(videoUrl).digest('hex'),
        verdict: result.verdict as DetectionVerdict,
        confidence_pct: result.confidence_pct,
        confidence_low: result.confidence_low,
        confidence_high: result.confidence_high,
        probable_generator: result.probable_generator,
        reasoning: result.reasoning,
        what_would_change_this: result.what_would_change_this,
        evasion_detected: result.evasion_detected as EvasionStatus,
        evasion_description: result.evasion_description,
        vendor_disagreement: result.vendor_disagreement,
        signal_breakdown: result.signal_breakdown,
        review_status: shouldEscalateForReview(result) ? 'pending_review' : 'automated',
        reviewed_by: null,
        reviewed_at: null,
        reviewer_notes: null,
        layer1_signals: result.layer1_signals,
        layer2_signals: result.layer2_signals,
        layer3_signals: result.layer3_signals,
        is_public: true,
        case_title: null,
        created_at: now,
      }
      const pack: CorrectionPack = {
        id: 'mock-pack', slug: randomBytes(4).toString('base64url'),
        verdict_id: null, detection_id: detection.id, og_image_url: null, share_count: 0, created_at: now,
      }
      return NextResponse.json(serialiseDetectionVerdict(detection, pack))
    }

    const db = createServiceClient()

    // 2. Access control. B2B keys use their monthly quota; everyone else must be
    //    signed in (so anonymous traffic can't burn paid-API credit).
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
        return NextResponse.json({ error: 'Sign in to run a check.' }, { status: 401 })
      }
      userId = user.id

      // Per-IP safety net against a single compromised account.
      const ip = clientIpFromHeaders(req.headers)
      const hourly = await rateLimit(`detect:h:${ip}`, IP_HOURLY_LIMIT, 3600)
      if (!hourly.allowed) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again shortly.' },
          { status: 429, headers: { 'retry-after': String(hourly.resetSec) } },
        )
      }
    }

    // 3. Cache lookup by URL hash (cached results don't consume quota/budget).
    const urlHash = createHash('sha256').update(videoUrl).digest('hex')
    const { data: existing } = await db
      .from('video_detections')
      .select('*')
      .eq('video_hash', urlHash)
      .maybeSingle()

    if (existing) {
      let { data: pack } = await db
        .from('correction_packs')
        .select('*')
        .eq('detection_id', existing.id)
        .maybeSingle()
      if (!pack) {
        // Detection exists but pack was never created — create it now (no re-run).
        const slug = randomBytes(4).toString('base64url')
        const created = await db
          .from('correction_packs')
          .insert({ slug, detection_id: existing.id })
          .select()
          .single()
        pack = created.data
      }
      return NextResponse.json(serialiseDetectionVerdict(existing, pack))
    }

    // 4. Enforce spend limits for a real (uncached) run: per-account daily quota
    //    + global daily budget circuit-breaker.
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

    // 5. Resolve media via the AWS resolver (download + ffprobe + C2PA + cross-modal).
    const media = await resolveMedia(videoUrl)

    // 5. Run the multi-signal detection pipeline.
    const result = await runDetectionPipeline(media)
    const reviewStatus = shouldEscalateForReview(result) ? 'pending_review' : 'automated'

    // 6. Persist.
    const { data: detection, error: detectionError } = await db
      .from('video_detections')
      .insert({
        video_url: videoUrl,
        video_hash: urlHash,
        verdict: result.verdict as never,
        confidence_pct: result.confidence_pct,
        confidence_low: result.confidence_low,
        confidence_high: result.confidence_high,
        probable_generator: result.probable_generator,
        reasoning: result.reasoning,
        what_would_change_this: result.what_would_change_this,
        evasion_detected: result.evasion_detected as never,
        evasion_description: result.evasion_description,
        vendor_disagreement: result.vendor_disagreement,
        signal_breakdown: result.signal_breakdown,
        review_status: reviewStatus,
        layer1_signals: result.layer1_signals,
        layer2_signals: result.layer2_signals,
        layer3_signals: result.layer3_signals,
        is_public: true,
      })
      .select()
      .single()

    if (detectionError || !detection) {
      throw new Error(`Failed to save detection: ${detectionError?.message}`)
    }

    // 7. Correction pack.
    const slug = randomBytes(4).toString('base64url')
    const { data: pack, error: packError } = await db
      .from('correction_packs')
      .insert({ slug, detection_id: detection.id })
      .select()
      .single()

    if (packError || !pack) {
      throw new Error(`Failed to create correction pack: ${packError?.message}`)
    }

    return NextResponse.json(serialiseDetectionVerdict(detection, pack))
  } catch (error) {
    captureException(error, { route: 'POST /api/detect' })
    return NextResponse.json(
      { error: 'Detection failed. Please try again.' },
      { status: 500 }
    )
  }
}
