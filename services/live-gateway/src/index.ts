/**
 * Live gateway server.
 *
 * - GET /health           liveness probe
 * - WS  /?token=<jwt>      client opens this to start/keep-alive a live session.
 *                          The token (minted by the Unfaked app) carries the
 *                          session id + source URL authorisation. On connect we
 *                          begin pulling the live URL and writing rows; the
 *                          client receives updates via Supabase Realtime.
 */
import express from 'express'
import { createServer } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { createClient } from '@supabase/supabase-js'
import { config, assertConfigured } from './config.js'
import { verifyLiveToken } from './token.js'
import { runSession, type SessionHandle } from './pipeline.js'

const app = express()
app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'live-gateway', ts: new Date().toISOString() })
})

const server = createServer(app)
const wss = new WebSocketServer({ server })

wss.on('connection', async (ws: WebSocket, req) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const token = url.searchParams.get('token') ?? ''
  const payload = verifyLiveToken(token, config.signingKey)
  if (!payload) {
    ws.send(JSON.stringify({ type: 'error', message: 'invalid token' }))
    ws.close()
    return
  }

  // Look up the session to get its source URL + confirm it's active.
  const db = createClient(config.supabaseUrl, config.supabaseServiceKey, { auth: { persistSession: false } })
  const { data: session, error } = await db
    .from('live_sessions')
    .select('id, source_ref, status')
    .eq('id', payload.sid)
    .maybeSingle()

  if (error || !session || session.status !== 'active' || !session.source_ref) {
    ws.send(JSON.stringify({ type: 'error', message: 'session not available' }))
    ws.close()
    return
  }

  console.log(`[gateway] starting session ${session.id}`)
  let handle: SessionHandle | null = null
  try {
    handle = runSession(session.id, session.source_ref)
    ws.send(JSON.stringify({ type: 'started', session_id: session.id }))
  } catch (e) {
    console.error('[gateway] failed to start session', (e as Error).message)
    ws.send(JSON.stringify({ type: 'error', message: 'failed to start' }))
    ws.close()
    return
  }

  const onClose = () => {
    console.log(`[gateway] closing session ${session.id}`)
    handle?.stop()
  }
  ws.on('close', onClose)
  ws.on('error', onClose)
})

const entry = process.argv[1] ?? ''
if (entry.endsWith('index.js') || entry.endsWith('index.ts')) {
  assertConfigured()
  server.listen(config.port, () => console.log(`[live-gateway] listening on :${config.port}`))
}

export { app, server }
