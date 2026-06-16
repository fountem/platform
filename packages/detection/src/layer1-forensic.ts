export interface Layer1Result {
  hive_ai_generated_score: number   // 0-1
  hive_deepfake_score: number        // 0-1
  hive_raw: Record<string, unknown>
  codec_anomalies: string[]
  metadata_stripped: boolean
  probable_generator: string
  processing_ms: number
}

const HIVE_ENDPOINT = 'https://api.thehive.ai/api/v2/task/sync'

export async function layer1Forensic(
  videoBuffer: Buffer,
  apiKey: string
): Promise<Layer1Result> {
  const start = Date.now()

  const formData = new FormData()
  formData.append('media', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4')

  const response = await fetch(HIVE_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Accept': 'application/json',
    },
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Hive API error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json() as Record<string, unknown>

  // Parse Hive response structure
  const classes = (data as any)?.status?.[0]?.response?.output?.[0]?.classes ?? []
  const getScore = (name: string) =>
    classes.find((c: any) => c.class === name)?.score ?? 0

  const aiGeneratedScore = getScore('ai_generated')
  const deepfakeScore = getScore('deepfake')

  return {
    hive_ai_generated_score: aiGeneratedScore,
    hive_deepfake_score: deepfakeScore,
    hive_raw: data,
    codec_anomalies: detectCodecAnomalies(data),
    metadata_stripped: detectMetadataStripped(data),
    probable_generator: identifyGenerator(aiGeneratedScore, data),
    processing_ms: Date.now() - start,
  }
}

function detectCodecAnomalies(hiveData: unknown): string[] {
  const anomalies: string[] = []
  const d = hiveData as any
  if (d?.bitrate_variance < 0.02) anomalies.push('unusually_stable_bitrate')
  if (d?.codec_signature?.includes('synthetic')) anomalies.push('synthetic_codec_signature')
  return anomalies
}

function detectMetadataStripped(hiveData: unknown): boolean {
  const d = hiveData as any
  return !d?.metadata?.creation_time && !d?.metadata?.encoder
}

function identifyGenerator(score: number, hiveData: unknown): string {
  if (score < 0.4) return 'unknown'
  const d = hiveData as any
  const signals = d?.model_signals ?? {}
  if (signals.veo_probability > 0.7) return 'veo'
  if (signals.kling_probability > 0.7) return 'kling'
  if (signals.runway_probability > 0.7) return 'runway'
  if (signals.sora_probability > 0.7) return 'sora'
  if (signals.luma_probability > 0.7) return 'luma'
  if (signals.pika_probability > 0.7) return 'pika'
  return 'unknown'
}
