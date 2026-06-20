'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LiveClaim, LiveClaimStatus, LiveTranscriptChunk } from '@fountem/db'
import { createSupabaseBrowserClient } from './supabase/client'

export type LiveStatus = 'idle' | 'starting' | 'active' | 'ended' | 'error'

interface StartResponse {
  session_id: string
  mock: boolean
  gateway_url: string | null
  token: string
  caps: { maxMinutes: number; maxClaims: number; maxClaimsPerMinute: number }
  election_mode: boolean
}

export interface UseLiveSession {
  status: LiveStatus
  error: string | null
  needsLogin: boolean
  sessionId: string | null
  transcript: LiveTranscriptChunk[]
  claims: LiveClaim[]
  electionMode: boolean
  start: (url: string) => Promise<void>
  stop: () => Promise<void>
}

function upsertById<T extends { id: string }>(list: T[], row: T): T[] {
  const idx = list.findIndex((r) => r.id === row.id)
  if (idx === -1) return [...list, row]
  const next = [...list]
  next[idx] = { ...next[idx], ...row }
  return next
}

export function useLiveSession(): UseLiveSession {
  const [status, setStatus] = useState<LiveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState<LiveTranscriptChunk[]>([])
  const [claims, setClaims] = useState<LiveClaim[]>([])
  const [electionMode, setElectionMode] = useState(false)

  const cleanupRef = useRef<(() => void) | null>(null)

  const teardown = useCallback(() => {
    cleanupRef.current?.()
    cleanupRef.current = null
  }, [])

  const start = useCallback(async (url: string) => {
    setStatus('starting')
    setError(null)
    setNeedsLogin(false)
    setTranscript([])
    setClaims([])
    try {
      const res = await fetch('/api/live/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      if (res.status === 401) {
        setNeedsLogin(true)
        setStatus('error')
        return
      }
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      const data = (await res.json()) as StartResponse
      setSessionId(data.session_id)
      setElectionMode(data.election_mode)
      setStatus('active')

      if (data.mock) {
        cleanupRef.current = runMockSimulation(setTranscript, setClaims)
      } else {
        cleanupRef.current = connectLive(data, setTranscript, setClaims)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the live session')
      setStatus('error')
    }
  }, [])

  const stop = useCallback(async () => {
    teardown()
    if (sessionId) {
      await fetch('/api/live/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      }).catch(() => {})
    }
    setStatus('ended')
  }, [sessionId, teardown])

  useEffect(() => () => teardown(), [teardown])

  return { status, error, needsLogin, sessionId, transcript, claims, electionMode, start, stop }
}

/** Real path: kick the gateway to start pulling, then subscribe to DB changes. */
function connectLive(
  data: StartResponse,
  setTranscript: React.Dispatch<React.SetStateAction<LiveTranscriptChunk[]>>,
  setClaims: React.Dispatch<React.SetStateAction<LiveClaim[]>>,
): () => void {
  const supabase = createSupabaseBrowserClient()
  // supabase-js postgres_changes typings are awkward across versions; the
  // runtime contract is stable, so we relax the channel type here.
  const channel = (supabase.channel(`live:${data.session_id}`) as any)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'live_claims', filter: `session_id=eq.${data.session_id}` },
      (payload: { new: LiveClaim }) => setClaims((prev) => upsertById(prev, payload.new)),
    )
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'live_transcript_chunks', filter: `session_id=eq.${data.session_id}` },
      (payload: { new: LiveTranscriptChunk }) => setTranscript((prev) => upsertById(prev, payload.new)),
    )
    .subscribe()

  // Tell the gateway to begin pulling the live URL for this session.
  let ws: WebSocket | null = null
  if (data.gateway_url) {
    try {
      ws = new WebSocket(`${data.gateway_url}?token=${encodeURIComponent(data.token)}`)
    } catch {
      ws = null
    }
  }

  return () => {
    try { supabase.removeChannel(channel) } catch { /* noop */ }
    try { ws?.close() } catch { /* noop */ }
  }
}

/** Offline/demo path: synthesize a believable live session on the client. */
function runMockSimulation(
  setTranscript: React.Dispatch<React.SetStateAction<LiveTranscriptChunk[]>>,
  setClaims: React.Dispatch<React.SetStateAction<LiveClaim[]>>,
): () => void {
  const lines = [
    { speaker: 'Speaker 0', text: 'Under our government, unemployment has fallen to its lowest level in fifty years.' },
    { speaker: 'Speaker 1', text: 'That is simply not true — long-term unemployment has actually risen.' },
    { speaker: 'Speaker 0', text: 'We have built more new homes than any government in the past decade.' },
    { speaker: 'Speaker 1', text: 'NHS waiting lists have come down every single month this year.' },
  ]
  const timers: ReturnType<typeof setTimeout>[] = []
  const statuses: LiveClaimStatus[] = ['supported', 'disputed', 'needs_context', 'unverifiable']

  lines.forEach((line, i) => {
    timers.push(
      setTimeout(() => {
        const now = new Date().toISOString()
        setTranscript((prev) => [
          ...prev,
          {
            id: `mock-chunk-${i}`,
            session_id: 'mock',
            speaker_label: line.speaker,
            text: line.text,
            ts_start_ms: i * 4000,
            ts_end_ms: i * 4000 + 3500,
            processed_for_claims: true,
            created_at: now,
          },
        ])
        const claimId = `mock-claim-${i}`
        setClaims((prev) => [
          ...prev,
          {
            id: claimId,
            session_id: 'mock',
            transcript_excerpt: line.text,
            claim_text: line.text,
            speaker_label: line.speaker,
            status: 'pending',
            verdict_summary: null,
            correction: null,
            what_would_change_this: null,
            confidence_pct: null,
            source_citations: [],
            claim_hash: null,
            verified_at: null,
            created_at: now,
          },
        ])
        timers.push(
          setTimeout(() => {
            setClaims((prev) => prev.map((c) => (c.id === claimId ? { ...c, status: 'checking' } : c)))
          }, 900),
        )
        timers.push(
          setTimeout(() => {
            const status = statuses[i % statuses.length]
            setClaims((prev) =>
              prev.map((c) =>
                c.id === claimId
                  ? {
                      ...c,
                      status,
                      confidence_pct: 60 + ((i * 7) % 30),
                      verdict_summary: `(Demo) Provisionally assessed as "${status.replace('_', ' ')}" against the available evidence.`,
                      what_would_change_this: 'A primary-source release covering the exact period cited.',
                      source_citations: [
                        {
                          chunk_id: `mock-${i}`,
                          source_title: 'Reuters — reporting',
                          source_url: 'https://www.reuters.com/example',
                          publisher: 'reuters.com',
                          published_at: '2026-06-18',
                          excerpt: 'Contemporaneous reporting on the figure cited.',
                          source_tier: 'web',
                        },
                      ],
                    }
                  : c,
              ),
            )
          }, 2600),
        )
      }, i * 4200),
    )
  })

  return () => timers.forEach(clearTimeout)
}
