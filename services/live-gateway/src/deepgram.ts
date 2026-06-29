/**
 * Deepgram streaming ASR client. Opens a WebSocket, streams 16k mono PCM, and
 * emits finalised transcript segments (with speaker diarization).
 */
import WebSocket from 'ws'
import type { Readable } from 'node:stream'
import { PCM_SAMPLE_RATE } from './audio.js'

export interface TranscriptSegment {
  speaker: string | null
  text: string
  tsStartMs: number
  tsEndMs: number
  isFinal: boolean
}

function streamUrl(): string {
  const params = new URLSearchParams({
    model: process.env.DEEPGRAM_MODEL ?? 'nova-3',
    language: process.env.DEEPGRAM_LANGUAGE ?? 'en',
    encoding: 'linear16',
    sample_rate: String(PCM_SAMPLE_RATE),
    diarize: 'true',
    interim_results: 'false',
    punctuate: 'true',
    smart_format: 'true',
    utterance_end_ms: '1500',
    vad_events: 'true',
  })
  return `wss://api.deepgram.com/v1/listen?${params.toString()}`
}

/** Parse a Deepgram "Results" message into a TranscriptSegment (or null). */
export function parseDeepgramMessage(raw: unknown): TranscriptSegment | null {
  let msg: any
  try {
    msg = typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    return null
  }
  if (msg?.type && msg.type !== 'Results') return null
  const alt = msg?.channel?.alternatives?.[0]
  const text: string | undefined = alt?.transcript?.trim()
  if (!text) return null
  const speakerNum = alt?.words?.find((w: any) => typeof w.speaker === 'number')?.speaker
  const startMs = Math.round((msg.start ?? alt?.words?.[0]?.start ?? 0) * 1000)
  const durMs = Math.round((msg.duration ?? 0) * 1000)
  return {
    speaker: typeof speakerNum === 'number' ? `Speaker ${speakerNum}` : null,
    text,
    tsStartMs: startMs,
    tsEndMs: startMs + durMs,
    isFinal: Boolean(msg.is_final || msg.speech_final),
  }
}

export interface DeepgramStream {
  close: () => void
}

/** Connect Deepgram and pipe PCM in; finalised segments go to onSegment. */
export function transcribe(
  pcm: Readable,
  apiKey: string,
  onSegment: (seg: TranscriptSegment) => void,
  onError: (err: Error) => void,
): DeepgramStream {
  const ws = new WebSocket(streamUrl(), { headers: { Authorization: `Token ${apiKey}` } })

  ws.on('open', () => {
    pcm.on('data', (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk)
    })
    pcm.on('end', () => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'CloseStream' }))
    })
  })

  ws.on('message', (data: WebSocket.RawData) => {
    const seg = parseDeepgramMessage(data.toString())
    if (seg && seg.isFinal) onSegment(seg)
  })
  ws.on('error', (e: Error) => onError(e))

  return {
    close: () => {
      try { ws.close() } catch { /* noop */ }
    },
  }
}
