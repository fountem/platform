import OpenAI from 'openai'
import type { Layer3Signals } from '@fountem/db'
import type { PlatformMetadata, CrossModalResult } from './resolver'
import { isMockMode, mockLayer3 } from './mock'

/**
 * Layer 3 — Contextual.
 *
 * GPT-4o reasons over REAL platform metadata supplied by the resolver (channel age,
 * upload date, view count, title) plus the cross-modal lip-sync signal — not over a
 * bare URL string. Context the file cannot contain (recontextualised real media,
 * suspicious channel patterns) is where pure detectors fail.
 */

let _openai: OpenAI | null = null
function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  return _openai
}

export interface Layer3Input {
  videoUrl: string
  layer1Score: number
  layer2Valid: boolean
  platform: PlatformMetadata
  crossModal: CrossModalResult
}

interface ContextualResult {
  redFlags: string[]
  behaviouralScore: number
}

async function runGPTContextualAnalysis(input: Layer3Input): Promise<ContextualResult> {
  const { videoUrl, layer1Score, layer2Valid, platform } = input
  const prompt = `You are analysing a video for CONTEXTUAL signs of AI generation or manipulation. You are one layer of a multi-signal system; focus only on context, not pixel forensics.

Video URL: ${videoUrl}
Platform: ${platform.platform ?? 'unknown'}
Channel/account age (days): ${platform.channel_age_days ?? 'unknown'}
Channel video count: ${platform.channel_video_count ?? 'unknown'}
Upload date: ${platform.upload_date ?? 'unknown'}
View count: ${platform.view_count ?? 'unknown'}
Title: ${platform.title ?? 'unknown'}
Layer 1 (forensic) AI score: ${(layer1Score * 100).toFixed(0)}%
Layer 2 (provenance) C2PA valid: ${layer2Valid}

Identify contextual red flags such as: brand-new account, very few prior uploads, sudden political content, mismatch between title and likely content, posting during a sensitive electoral period.

Respond ONLY with JSON:
{
  "red_flags": ["<flag>", "..."],
  "behavioural_plausibility_score": <0.0-1.0, higher = more plausibly organic/real>,
  "reasoning": "<brief>"
}`

  const response = await openai().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0]?.message?.content ?? '{}') as {
    red_flags?: string[]
    behavioural_plausibility_score?: number
  }
  return {
    redFlags: parsed.red_flags ?? [],
    behaviouralScore: clamp01(parsed.behavioural_plausibility_score ?? 0.5),
  }
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n))
}

export async function runLayer3(input: Layer3Input): Promise<Layer3Signals> {
  if (isMockMode()) return mockLayer3(input)

  const { platform, crossModal } = input
  const contextual = await runGPTContextualAnalysis(input)

  const redFlags = [...contextual.redFlags]
  if (crossModal.lip_sync_anomaly) {
    redFlags.push('Audio and lip movements are out of sync (possible voice clone or dub)')
  }

  return {
    channel_age_days: platform.channel_age_days,
    channel_video_count: platform.channel_video_count,
    audio_cleanliness_score: crossModal.audio_cleanliness_score,
    clip_transition_intervals: null,
    behavioural_plausibility_score: contextual.behaviouralScore,
    contextual_red_flags: redFlags,
    audio_visual_sync_score: crossModal.av_sync_score,
    lip_sync_anomaly: crossModal.lip_sync_anomaly,
  }
}
