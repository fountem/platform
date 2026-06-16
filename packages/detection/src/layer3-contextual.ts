import OpenAI from 'openai'
import type { Layer3Signals } from '@fountem/db'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

interface VideoMetadata {
  url: string
  channelAgeDays?: number
  channelVideoCount?: number
}

async function extractUrlMetadata(videoUrl: string): Promise<VideoMetadata> {
  const metadata: VideoMetadata = { url: videoUrl }

  // For YouTube/TikTok/Twitter: in production, use platform APIs
  // For now: heuristic signals from URL structure
  try {
    const url = new URL(videoUrl)
    // Channel age signal: very new channels are suspicious
    // These would come from platform API calls in production
  } catch { /* invalid URL — continue */ }

  return metadata
}

async function runGPTContextualAnalysis(
  videoUrl: string,
  layer1Score: number,
  layer2Valid: boolean,
  metadata: VideoMetadata
): Promise<{ redFlags: string[]; behaviouralScore: number; audioCleanlinessScore: number }> {
  const prompt = `You are analysing a video for contextual signs of AI generation or manipulation.

Video URL: ${videoUrl}
Layer 1 (forensic) AI score: ${(layer1Score * 100).toFixed(0)}%
Layer 2 (provenance) C2PA valid: ${layer2Valid}
Channel age: ${metadata.channelAgeDays ?? 'unknown'} days
Channel video count: ${metadata.channelVideoCount ?? 'unknown'}

Based on these signals, identify contextual red flags. Look for:
- Suspicious channel patterns (new channel, few videos, sudden political content)
- URL structure anomalies
- Temporal patterns (video posted during sensitive political period)
- Platform hosting patterns

Respond ONLY with JSON:
{
  "red_flags": ["<flag 1>", "<flag 2>"],
  "behavioural_plausibility_score": <0.0-1.0>,
  "audio_cleanliness_score": <0.0-1.0>,
  "reasoning": "<brief explanation>"
}`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{}') as {
    red_flags?: string[]
    behavioural_plausibility_score?: number
    audio_cleanliness_score?: number
  }

  return {
    redFlags: parsed.red_flags ?? [],
    behaviouralScore: parsed.behavioural_plausibility_score ?? 0.5,
    audioCleanlinessScore: parsed.audio_cleanliness_score ?? 0.5,
  }
}

export async function runLayer3(
  videoUrl: string,
  layer1Score: number,
  layer2Valid: boolean
): Promise<Layer3Signals> {
  const metadata = await extractUrlMetadata(videoUrl)
  const contextual = await runGPTContextualAnalysis(videoUrl, layer1Score, layer2Valid, metadata)

  return {
    channel_age_days: metadata.channelAgeDays ?? null,
    channel_video_count: metadata.channelVideoCount ?? null,
    audio_cleanliness_score: contextual.audioCleanlinessScore,
    clip_transition_intervals: null,  // Would come from FFprobe in production
    behavioural_plausibility_score: contextual.behaviouralScore,
    contextual_red_flags: contextual.redFlags,
  }
}
