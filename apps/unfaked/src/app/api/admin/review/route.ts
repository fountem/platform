import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import type { VideoDetection } from '@fountem/db'
import { captureException } from '@fountem/core'
import { timingSafeEqual } from 'crypto'

const DETECTION_VERDICTS = ['ai_generated', 'likely_ai_generated', 'inconclusive', 'likely_real', 'real']

function authorised(req: NextRequest): boolean {
  const expected = process.env.ADMIN_TOKEN
  const provided = req.headers.get('x-admin-token')
  if (!expected || !provided) return false
  const a = Buffer.from(expected)
  const b = Buffer.from(provided)
  return a.length === b.length && timingSafeEqual(a, b)
}

// List detections pending human review (oldest first).
export async function GET(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from('video_detections')
      .select('id, video_url, verdict, confidence_pct, confidence_low, confidence_high, vendor_disagreement, reasoning, created_at')
      .eq('review_status', 'pending_review')
      .order('created_at', { ascending: true })
      .limit(50)
    if (error) throw error
    return NextResponse.json({ queue: data ?? [] })
  } catch (error) {
    captureException(error, { route: 'GET /api/admin/review' })
    return NextResponse.json({ error: 'Failed to load queue' }, { status: 500 })
  }
}

// Submit a human review decision.
export async function POST(req: NextRequest) {
  if (!authorised(req)) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  try {
    const body = (await req.json().catch(() => ({}))) as {
      id?: string
      verdict?: string
      reviewer?: string
      notes?: string
    }
    if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    if (body.verdict && !DETECTION_VERDICTS.includes(body.verdict)) {
      return NextResponse.json({ error: 'invalid verdict' }, { status: 400 })
    }

    const db = createServiceClient()
    const update: Partial<VideoDetection> = {
      review_status: 'human_reviewed',
      reviewed_by: body.reviewer ?? 'admin',
      reviewed_at: new Date().toISOString(),
      reviewer_notes: body.notes ?? null,
    }
    if (body.verdict) update.verdict = body.verdict as VideoDetection['verdict']

    const { error } = await db.from('video_detections').update(update).eq('id', body.id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'POST /api/admin/review' })
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
