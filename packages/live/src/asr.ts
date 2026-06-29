/**
 * Streaming ASR adapter (provider-agnostic).
 *
 * The actual WebSocket lives in `services/live-gateway`; this module owns the
 * pure, testable pieces: building the provider connection URL and normalising
 * provider messages into our `TranscriptSegment` shape. Deepgram Nova-3 is the
 * default provider (sub-300ms streaming + diarization).
 */

import { isLiveMockMode } from './mock'
import type { TranscriptSegment } from './types'

export interface DeepgramStreamOptions {
  /** PCM/Opus sample rate of the audio we send. */
  sampleRate?: number
  encoding?: 'linear16' | 'opus' | 'mp3' | 'aac'
  language?: string
  model?: string
  /** Enable speaker diarization (who said what). */
  diarize?: boolean
  /** Emit utterance-end events after this much silence (ms). */
  utteranceEndMs?: number
}

const DEFAULTS: Required<DeepgramStreamOptions> = {
  sampleRate: 16000,
  encoding: 'linear16',
  language: 'en',
  model: 'nova-3',
  diarize: true,
  utteranceEndMs: 1500,
}

/** Build the Deepgram streaming WebSocket URL with query params. */
export function deepgramStreamUrl(opts: DeepgramStreamOptions = {}): string {
  const o = { ...DEFAULTS, ...opts }
  const params = new URLSearchParams({
    model: o.model,
    language: o.language,
    encoding: o.encoding,
    sample_rate: String(o.sampleRate),
    diarize: String(o.diarize),
    interim_results: 'true',
    punctuate: 'true',
    smart_format: 'true',
    utterance_end_ms: String(o.utteranceEndMs),
    vad_events: 'true',
  })
  return `wss://api.deepgram.com/v1/listen?${params.toString()}`
}

interface DeepgramAlternative {
  transcript?: string
  words?: { speaker?: number; start?: number; end?: number }[]
}
interface DeepgramMessage {
  type?: string
  is_final?: boolean
  speech_final?: boolean
  start?: number
  duration?: number
  channel?: { alternatives?: DeepgramAlternative[] }
}

/**
 * Normalise a Deepgram results message into a TranscriptSegment.
 * Returns null for empty/non-transcript messages (e.g. Metadata, UtteranceEnd).
 */
export function parseDeepgramMessage(raw: unknown): TranscriptSegment | null {
  let msg: DeepgramMessage
  try {
    msg = (typeof raw === 'string' ? JSON.parse(raw) : raw) as DeepgramMessage
  } catch {
    return null
  }
  if (msg.type && msg.type !== 'Results') return null

  const alt = msg.channel?.alternatives?.[0]
  const text = alt?.transcript?.trim()
  if (!text) return null

  const speakerNum = alt?.words?.find((w) => typeof w.speaker === 'number')?.speaker
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

/**
 * Mock ASR: turn a block of text into finalised segments (one per sentence),
 * so the whole pipeline runs offline. Used by tests and `dev:mock`.
 */
export function mockTranscribe(text: string): TranscriptSegment[] {
  if (!isLiveMockMode() && process.env.NODE_ENV !== 'test') {
    // Still usable directly, but signal intent in non-mock runtime.
  }
  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0)
  let cursor = 0
  return sentences.map((s, i) => {
    const start = cursor
    const dur = Math.max(1000, s.length * 60)
    cursor += dur
    return {
      speaker: `Speaker ${i % 2}`,
      text: s.trim(),
      tsStartMs: start,
      tsEndMs: start + dur,
      isFinal: true,
    }
  })
}
