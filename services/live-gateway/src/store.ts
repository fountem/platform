/**
 * Supabase writes (service role) + verify delegation.
 *
 * The gateway persists transcript + claim rows and asks the Unfaked app to run
 * verification (which reuses @fountem/rag + @fountem/live). Keeping the
 * evidence/verdict logic in ONE place (the app) avoids duplicating the RAG
 * pipeline in this service.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { config } from './config.js'
import type { TranscriptSegment } from './deepgram.js'
import type { ExtractedClaim } from './extract.js'

let _client: SupabaseClient | null = null
function db(): SupabaseClient {
  if (!_client) _client = createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false } })
  return _client
}

export async function insertTranscript(sessionId: string, seg: TranscriptSegment): Promise<void> {
  await db().from('live_transcript_chunks').insert({
    session_id: sessionId,
    speaker_label: seg.speaker,
    text: seg.text,
    ts_start_ms: seg.tsStartMs,
    ts_end_ms: seg.tsEndMs,
    processed_for_claims: true,
  })
}

export async function insertPendingClaim(
  sessionId: string,
  claim: ExtractedClaim,
  claimHash: string,
): Promise<string | null> {
  const { data, error } = await db()
    .from('live_claims')
    .insert({
      session_id: sessionId,
      transcript_excerpt: claim.transcriptExcerpt,
      claim_text: claim.claimText,
      speaker_label: claim.speaker,
      status: 'pending',
      claim_hash: claimHash,
    })
    .select('id')
    .single()
  if (error) {
    // Unique violation on (session_id, claim_hash) => already surfaced.
    if (error.code !== '23505') console.error('[gateway] insert claim error', error.message)
    return null
  }
  return data?.id ?? null
}

export async function bumpClaimCount(sessionId: string): Promise<void> {
  await db().rpc('increment_live_claim_count', { p_session_id: sessionId }).then(
    () => {},
    () => {}, // RPC optional; ignore if absent
  )
}

export async function markSession(sessionId: string, status: 'ended' | 'error'): Promise<void> {
  await db()
    .from('live_sessions')
    .update({ status, ended_at: new Date().toISOString() })
    .eq('id', sessionId)
}

/** Ask the Unfaked app to verify a claim (it owns the RAG/verdict logic). */
export async function delegateVerify(sessionId: string, claimId: string, claimText: string): Promise<void> {
  try {
    await fetch(`${config.appBaseUrl}/api/live/verify-claim`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-internal-key': config.internalKey },
      body: JSON.stringify({ session_id: sessionId, claim_id: claimId, claim_text: claimText }),
    })
  } catch (e) {
    console.error('[gateway] delegateVerify error', (e as Error).message)
  }
}
