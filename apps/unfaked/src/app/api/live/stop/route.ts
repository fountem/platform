import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@fountem/db'
import { captureException, isMockMode } from '@fountem/core'
import { createSupabaseServerClient } from '../../../../lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { session_id?: string }
    const sessionId = body.session_id?.trim()
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 })
    }

    if (isMockMode() || sessionId.startsWith('mock-')) {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
    }

    const db = createServiceClient()
    // Only the owner can end their own session.
    const { error } = await db
      .from('live_sessions')
      .update({ status: 'ended', ended_at: new Date().toISOString() })
      .eq('id', sessionId)
      .eq('user_id', user.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (error) {
    captureException(error, { route: 'POST /api/live/stop' })
    return NextResponse.json({ error: 'Could not stop the session.' }, { status: 500 })
  }
}
