import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createServiceClient } from '@fountem/db'
import type { LiveClaim } from '@fountem/db'
import { captureException } from '@fountem/core'
import { verifyLiveClaim } from '@fountem/live'

export const maxDuration = 60

/**
 * Internal endpoint: the live gateway delegates claim verification here so the
 * heavy RAG/verdict logic lives in ONE place (this app, with the shared
 * packages). Authenticated with a shared internal key — never exposed to users.
 */

function authorised(provided: string | null): boolean {
  const expected = process.env.LIVE_INTERNAL_KEY ?? ''
  if (!expected || !provided) return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  try {
    if (!authorised(req.headers.get('x-internal-key'))) {
      return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as {
      session_id?: string
      claim_id?: string
      claim_text?: string
    }
    const { session_id: sessionId, claim_id: claimId, claim_text: claimText } = body
    if (!sessionId || !claimId || !claimText) {
      return NextResponse.json({ error: 'session_id, claim_id, claim_text required' }, { status: 400 })
    }

    const db = createServiceClient()

    // Mark in-progress so the live UI flips to "checking".
    await db.from('live_claims').update({ status: 'checking' }).eq('id', claimId)

    let update: Partial<LiveClaim>
    try {
      const verdict = await verifyLiveClaim(claimText, { dbClient: db })
      update = {
        status: verdict.status,
        verdict_summary: verdict.summary,
        correction: verdict.correction,
        what_would_change_this: verdict.whatWouldChangeThis,
        confidence_pct: verdict.confidencePct,
        source_citations: verdict.citations,
        verified_at: new Date().toISOString(),
      }
    } catch (err) {
      captureException(err, { route: 'POST /api/live/verify-claim', claimId })
      update = { status: 'error', verified_at: new Date().toISOString() }
    }

    await db.from('live_claims').update(update).eq('id', claimId)
    return NextResponse.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'POST /api/live/verify-claim' })
    return NextResponse.json({ error: 'verification failed' }, { status: 500 })
  }
}
