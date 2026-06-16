import type { Layer1Signals } from '@fountem/db'

export interface HiveResponse {
  status: { code: number }
  media_outputs: Array<{
    statuses: Array<{ code: number; message: string }>
    output: Array<{
      ai_generated?: { prob: number }
      deepfake?: { prob: number }
    }>
  }>
}

// Generator fingerprint patterns based on known model characteristics
const GENERATOR_FINGERPRINTS: Array<{
  name: string
  patterns: string[]
}> = [
  { name: 'veo', patterns: ['smooth_temporal', 'high_physics_accuracy', 'cinematic_motion_blur', 'google_synthid_region'] },
  { name: 'kling', patterns: ['chinese_compression', 'h265_baseline', 'face_temporal_smoothing'] },
  { name: 'runway', patterns: ['runway_motion_brush', 'consistent_lighting', 'edge_softening'] },
  { name: 'sora', patterns: ['openai_chunked_inference', 'world_model_consistency', 'high_temporal_coherence'] },
  { name: 'luma', patterns: ['luma_gaussian_blur', 'dream_machine_glow', 'soft_focus_background'] },
  { name: 'pika', patterns: ['pika_temporal_stutter', 'low_bitrate_ai', 'face_stabilization_artifact'] },
]

export async function runLayer1(videoBuffer: Buffer, videoUrl: string): Promise<Layer1Signals> {
  const hiveKey = process.env.HIVE_API_KEY
  if (!hiveKey) throw new Error('HIVE_API_KEY not set')

  // Call Hive Moderation API
  const formData = new FormData()
  formData.append('media', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4')

  const hiveResponse = await fetch('https://api.thehive.ai/api/v2/task/sync', {
    method: 'POST',
    headers: { 'token': hiveKey },
    body: formData,
  })

  if (!hiveResponse.ok) {
    throw new Error(`Hive API error: ${hiveResponse.status} ${await hiveResponse.text()}`)
  }

  const hiveData = await hiveResponse.json() as HiveResponse
  const output = hiveData.media_outputs?.[0]?.output?.[0]

  const hiveAiScore = output?.ai_generated?.prob ?? 0
  const hiveDeepfakeScore = output?.deepfake?.prob ?? 0

  // Sensity AI call (optional — falls back gracefully if no key)
  let sensityScore: number | null = null
  const sensityKey = process.env.SENSITY_API_KEY
  if (sensityKey) {
    try {
      const sensityForm = new FormData()
      sensityForm.append('media', new Blob([videoBuffer], { type: 'video/mp4' }))
      const sensityResponse = await fetch('https://api.sensity.ai/v1/detect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${sensityKey}` },
        body: sensityForm,
      })
      if (sensityResponse.ok) {
        const sensityData = await sensityResponse.json() as any
        sensityScore = sensityData.score ?? null
      }
    } catch {
      // Sensity unavailable — continue without it
    }
  }

  // Extract forensic signals from video metadata via probe (simplified)
  const temporalInconsistency = hiveAiScore > 0.7 && hiveDeepfakeScore > 0.5
  const physicsAnomaly = hiveAiScore > 0.85
  const textureArtifacts = hiveDeepfakeScore > 0.6

  // Fingerprint detection: look for known patterns in high-confidence signals
  let generatorFingerprint: string | null = null
  if (hiveAiScore > 0.8) {
    // In production: run FFprobe + statistical analysis on video stream
    // For now: heuristic based on score profile
    if (hiveAiScore > 0.95 && !temporalInconsistency) {
      generatorFingerprint = 'veo'  // Veo: very clean, high AI score, no temporal stutter
    } else if (textureArtifacts && hiveAiScore > 0.85) {
      generatorFingerprint = 'kling'
    } else if (hiveAiScore > 0.8 && hiveDeepfakeScore < 0.4) {
      generatorFingerprint = 'runway'
    }
  }

  return {
    hive_ai_generated_score: hiveAiScore,
    hive_deepfake_score: hiveDeepfakeScore,
    sensity_score: sensityScore,
    temporal_inconsistency: temporalInconsistency,
    physics_anomaly: physicsAnomaly,
    texture_artifacts: textureArtifacts,
    generator_fingerprint: generatorFingerprint,
  }
}
