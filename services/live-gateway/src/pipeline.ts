/**
 * Orchestrates a single live session: pull audio → ASR → batch finalised
 * segments on utterance boundaries → extract claims → persist + delegate verify.
 *
 * Enforces per-session caps (time, total claims, per-minute backpressure) and
 * session-scoped dedup.
 */
import { config } from './config.js'
import { pullLiveAudio } from './audio.js'
import { transcribe, type TranscriptSegment } from './deepgram.js'
import { extractClaims, claimHash } from './extract.js'
import { insertTranscript, insertPendingClaim, bumpClaimCount, delegateVerify, markSession } from './store.js'

export interface SessionHandle {
  stop: () => void
}

export function runSession(sessionId: string, url: string): SessionHandle {
  const startedAt = Date.now()
  const seenHashes = new Set<string>()
  let totalClaims = 0
  let recentClaimTimes: number[] = []
  let stopped = false

  // Buffer of finalised segments awaiting an extraction pass.
  let pending: TranscriptSegment[] = []
  let recentContext: string[] = []
  let extractTimer: ReturnType<typeof setTimeout> | null = null

  const audio = pullLiveAudio(url)

  const overTimeCap = () => Date.now() - startedAt >= config.maxMinutes * 60_000

  const stop = () => {
    if (stopped) return
    stopped = true
    if (extractTimer) clearTimeout(extractTimer)
    dg.close()
    audio.kill()
    void markSession(sessionId, 'ended')
  }

  async function flushExtraction() {
    if (stopped) return
    const batch = pending
    pending = []
    if (batch.length === 0) return

    const claims = await extractClaims(batch, {
      apiKey: config.openaiKey,
      contextText: recentContext.slice(-6).join('\n'),
      seenHashes,
    })

    for (const seg of batch) recentContext.push(`${seg.speaker ?? 'Speaker'}: ${seg.text}`)
    recentContext = recentContext.slice(-12)

    const now = Date.now()
    recentClaimTimes = recentClaimTimes.filter((t) => t > now - 60_000)

    for (const claim of claims) {
      if (overTimeCap()) { stop(); return }
      if (totalClaims >= config.maxClaims) continue
      if (recentClaimTimes.length >= config.maxClaimsPerMinute) break // backpressure

      const h = claimHash(claim.claimText)
      const claimId = await insertPendingClaim(sessionId, claim, h)
      if (!claimId) continue
      totalClaims += 1
      recentClaimTimes.push(now)
      void bumpClaimCount(sessionId)
      void delegateVerify(sessionId, claimId, claim.claimText)
    }
  }

  const onSegment = (seg: TranscriptSegment) => {
    if (stopped) return
    if (overTimeCap()) { stop(); return }
    void insertTranscript(sessionId, seg)
    pending.push(seg)
    // Debounce: extract shortly after the last finalised segment (utterance end).
    if (extractTimer) clearTimeout(extractTimer)
    extractTimer = setTimeout(() => void flushExtraction(), 1200)
  }

  const dg = transcribe(audio.pcm, config.deepgramKey, onSegment, (err) => {
    console.error('[gateway] deepgram error', err.message)
    stop()
    void markSession(sessionId, 'error')
  })

  // Hard stop at the time cap regardless of activity.
  const capTimer = setTimeout(() => stop(), config.maxMinutes * 60_000)
  const wrappedStop = () => { clearTimeout(capTimer); stop() }

  return { stop: wrappedStop }
}
