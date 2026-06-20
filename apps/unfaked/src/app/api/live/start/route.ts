import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import {
  rateLimit,
  clientIpFromHeaders,
  validateSubmittedUrl,
  captureException,
  isMockMode,
  signLiveToken,
  DEFAULT_DAILY_LIMITS,
  DEFAULT_GLOBAL_CAPS,
  LIVE_SESSION_CAPS,
} from '@fountem/core'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

const IP_HOURLY_LIMIT = Number(process.env.LIVE_START_IP_HOURLY_LIMIT ?? 10)
const ELECTION_MODE = process.env.LIVE_ELECTION_MODE === '1'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { url?: string }
    const url = body.url?.trim()
    if (!url) {
      return NextResponse.json({ error: 'A live stream URL is required.' }, { status: 400 })
    }
    const urlCheck = validateSubmittedUrl(url)
    if (!urlCheck.ok) {
      return NextResponse.json({ error: urlCheck.reason ?? 'Invalid URL' }, { status: 400 })
    }

    // Offline/demo mode: client runs a simulated session, no gateway needed.
    if (isMockMode()) {
      return NextResponse.json({
        session_id: `mock-${Date.now()}`,
        mock: true,
        gateway_url: null,
        token: 'mock-token',
        caps: LIVE_SESSION_CAPS,
        election_mode: ELECTION_MODE,
      })
    }

    // Live is consumer-only and signed-in for v1 (provisional, capped).
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Sign in to start a live session.' }, { status: 401 })
    }
    const userId = user.id

    const ip = clientIpFromHeaders(req.headers)
    const hourly = await rateLimit(`live-start:h:${ip}`, IP_HOURLY_LIMIT, 3600)
    if (!hourly.allowed) {
      return NextResponse.json(
        { error: 'Too many live sessions started. Please try again shortly.' },
        { status: 429, headers: { 'retry-after': String(hourly.resetSec) } },
      )
    }

    const db = createServiceClient()

    // Per-user daily session quota + global live budget circuit-breaker.
    const { data: quota } = await db.rpc('increment_user_usage', {
      p_user_id: userId,
      p_product: 'unfaked_live',
      p_limit: DEFAULT_DAILY_LIMITS.unfaked_live,
    })
    const quotaRow = quota?.[0]
    if (quotaRow && !quotaRow.allowed) {
      return NextResponse.json(
        { error: `Daily live session limit reached (${quotaRow.day_limit}). It resets tomorrow.` },
        { status: 429 },
      )
    }
    const { data: budget } = await db.rpc('increment_global_budget', {
      p_product: 'unfaked_live',
      p_cap: DEFAULT_GLOBAL_CAPS.unfaked_live,
    })
    const budgetRow = budget?.[0]
    if (budgetRow && !budgetRow.allowed) {
      return NextResponse.json(
        { error: 'Live fact-checking is at capacity for today. Please try again tomorrow.' },
        { status: 503 },
      )
    }

    const signingKey = process.env.LIVE_SESSION_SIGNING_KEY
    const gatewayUrl = process.env.NEXT_PUBLIC_LIVE_GATEWAY_URL
    if (!signingKey || !gatewayUrl) {
      return NextResponse.json({ error: 'Live fact-checking is not configured.' }, { status: 503 })
    }

    const { data: session, error: sessionError } = await db
      .from('live_sessions')
      .insert({
        user_id: userId,
        source_kind: 'live_url',
        source_ref: url,
        status: 'active',
        election_mode: ELECTION_MODE,
      })
      .select()
      .single()
    if (sessionError || !session) throw new Error(`Failed to create session: ${sessionError?.message}`)

    const token = signLiveToken({ sid: session.id, uid: userId }, signingKey)

    return NextResponse.json({
      session_id: session.id,
      mock: false,
      gateway_url: gatewayUrl,
      token,
      caps: LIVE_SESSION_CAPS,
      election_mode: ELECTION_MODE,
    })
  } catch (error) {
    captureException(error, { route: 'POST /api/live/start' })
    return NextResponse.json({ error: 'Could not start the live session. Please try again.' }, { status: 500 })
  }
}
