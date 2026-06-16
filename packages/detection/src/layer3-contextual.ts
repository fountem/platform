import OpenAI from 'openai'
import type { Layer1Result } from './layer1-forensic'
import type { Layer2Result } from './layer2-provenance'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface Layer3Result {
  contextual_risk_score: number    // 0-1
  channel_suspicious: boolean
  audio_cleanliness_flag: boolean
  behavioural_plausibility: number // 0-1
  narrative_risk: string           // 'low' | 'medium' | 'high'
  reasoning: string
  what_would_change_this: string
  processing_ms: number
}

const CONTEXTUAL_PROMPT = `You are an AI video forensics analyst specialising in detecting AI-generated political content.

Analyse the provided forensic signals and video metadata to assess contextual risk.

Return strict JSON:
{
  "contextual_risk_score": 0-1,
  "channel_suspicious": true|false,
  "audio_cleanliness_flag": true|false,
  "behavioural_plausibility": 0-1,
  "narrative_risk": "low|medium|high",
  "reasoning": "Plain English explanation of contextual signals",
  "what_would_change_this": "What evidence would change this contextual assessment"
}`

export async function layer3Contextual(
  videoUrl: string,
  layer1: Layer1Result,
  layer2: Layer2Result
): Promise<Layer3Result> {
  const start = Date.now()

  const input = {
    video_url: videoUrl,
    forensic_summary: {
      ai_generated_score: layer1.hive_ai_generated_score,
      deepfake_score: layer1.hive_deepfake_score,
      probable_generator: layer1.probable_generator,
      codec_anomalies: layer1.codec_anomalies,
      metadata_stripped: layer1.metadata_stripped,
      c2pa_present: layer2.c2pa_manifest_present,
      c2pa_valid: layer2.c2pa_manifest_valid,
      sensity_score: layer2.sensity_score,
    },
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: CONTEXTUAL_PROMPT },
      { role: 'user', content: JSON.stringify(input) },
    ],
  })

  const parsed = JSON.parse(response.choices[0].message.content ?? '{}')

  return {
    ...parsed,
    processing_ms: Date.now() - start,
  }
}
