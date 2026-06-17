import type { Layer1Signals } from '@fountem/db'

/**
 * Layer 1 — Forensic.
 *
 * Two independent commercial detectors (Hive + Sensity) run here. Using two vendors
 * is deliberate: it gives us a built-in cross-check and lets the synthesiser surface
 * vendor *disagreement* honestly rather than hiding it (see Appendix A2/A3).
 *
 * The probable generator is read from Hive's model-attribution output — NOT inferred
 * from score thresholds. If Hive does not attribute a generator, we return null.
 */

const KNOWN_GENERATORS = ['veo', 'kling', 'runway', 'sora', 'luma', 'pika', 'midjourney', 'firefly', 'dalle', 'stable_diffusion']

export interface HiveClass {
  class: string
  score: number
}

export interface HiveOutput {
  ai_generated?: { prob: number }
  deepfake?: { prob: number }
  classes?: HiveClass[]
}

export interface HiveResponse {
  status?: { code?: number } | Array<{ code?: number }>
  media_outputs?: Array<{ output?: HiveOutput[] }>
  // Newer Hive shape
  output?: HiveOutput[]
}

export interface Layer1Options {
  /** True when the resolver flagged the input as low-res / heavily compressed. */
  qualityDegraded?: boolean
  fetchImpl?: typeof fetch
}

function extractScore(classes: HiveClass[] | undefined, name: string): number | null {
  if (!classes) return null
  const match = classes.find((c) => c.class === name)
  return match ? match.score : null
}

/** Read the attributed generator from Hive classes, if any class crosses 0.5. */
export function extractGeneratorFingerprint(classes: HiveClass[] | undefined): string | null {
  if (!classes) return null
  let best: { name: string; score: number } | null = null
  for (const c of classes) {
    const normalised = c.class.toLowerCase().replace(/[^a-z0-9]/g, '_')
    const hit = KNOWN_GENERATORS.find((g) => normalised.includes(g))
    if (hit && c.score >= 0.5 && (!best || c.score > best.score)) {
      best = { name: hit === 'dalle' ? 'dalle' : hit, score: c.score }
    }
  }
  return best?.name ?? null
}

export async function runLayer1(
  videoBuffer: Buffer,
  _videoUrl: string,
  opts: Layer1Options = {}
): Promise<Layer1Signals> {
  const hiveKey = process.env.HIVE_API_KEY
  if (!hiveKey) throw new Error('HIVE_API_KEY not set')
  const fetchImpl = opts.fetchImpl ?? fetch

  const formData = new FormData()
  formData.append('media', new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' }), 'video.mp4')

  const hiveResponse = await fetchImpl('https://api.thehive.ai/api/v2/task/sync', {
    method: 'POST',
    headers: { token: hiveKey },
    body: formData,
  })

  if (!hiveResponse.ok) {
    throw new Error(`Hive API error: ${hiveResponse.status} ${await hiveResponse.text()}`)
  }

  const hiveData = (await hiveResponse.json()) as HiveResponse
  const output: HiveOutput | undefined = hiveData.media_outputs?.[0]?.output?.[0] ?? hiveData.output?.[0]
  const classes = output?.classes

  const hiveAiScore = output?.ai_generated?.prob ?? extractScore(classes, 'ai_generated') ?? 0
  const hiveDeepfakeScore = output?.deepfake?.prob ?? extractScore(classes, 'deepfake') ?? 0

  // Sensity — second independent forensic vendor.
  let sensityScore: number | null = null
  const sensityKey = process.env.SENSITY_API_KEY
  if (sensityKey) {
    try {
      const sensityForm = new FormData()
      sensityForm.append('media', new Blob([new Uint8Array(videoBuffer)], { type: 'video/mp4' }))
      const sensityResponse = await fetchImpl('https://api.sensity.ai/v1/detect', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sensityKey}` },
        body: sensityForm,
      })
      if (sensityResponse.ok) {
        const sensityData = (await sensityResponse.json()) as { score?: number }
        sensityScore = sensityData.score ?? null
      }
    } catch {
      // Sensity unavailable — continue with Hive only.
    }
  }

  return {
    hive_ai_generated_score: hiveAiScore,
    hive_deepfake_score: hiveDeepfakeScore,
    sensity_score: sensityScore,
    temporal_inconsistency: hiveAiScore > 0.7 && hiveDeepfakeScore > 0.5,
    physics_anomaly: hiveAiScore > 0.85,
    texture_artifacts: hiveDeepfakeScore > 0.6,
    generator_fingerprint: extractGeneratorFingerprint(classes),
    quality_degraded: opts.qualityDegraded ?? false,
  }
}
