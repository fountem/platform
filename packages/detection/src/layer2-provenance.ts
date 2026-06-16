export interface Layer2Result {
  c2pa_manifest_present: boolean
  c2pa_manifest_valid: boolean
  c2pa_claimed_origin?: string
  sensity_score: number             // 0-1
  sensity_signals: Record<string, unknown>
  processing_ms: number
}

export async function layer2Provenance(
  videoBuffer: Buffer,
  sensityApiKey: string
): Promise<Layer2Result> {
  const start = Date.now()

  // C2PA check (dynamic import — c2pa-node is a native module)
  let c2paResult = { has_manifest: false, is_valid: false, claimed_origin: undefined as string | undefined }
  try {
    const { createC2pa } = await import('c2pa-node')
    const c2pa = createC2pa()
    const result = await c2pa.read({ buffer: videoBuffer, mimeType: 'video/mp4' })
    c2paResult = {
      has_manifest: !!result?.manifestStore,
      is_valid: result?.validationStatus === 'valid',
      claimed_origin: result?.manifestStore?.activeManifest?.claimGenerator,
    }
  } catch {
    // c2pa-node not available in this environment — continue
  }

  // Sensity AI check
  let sensityScore = 0
  let sensitySignals: Record<string, unknown> = {}
  try {
    const form = new FormData()
    form.append('file', new Blob([videoBuffer], { type: 'video/mp4' }), 'video.mp4')

    const sensityResponse = await fetch('https://api.sensity.ai/v1/detect', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sensityApiKey}` },
      body: form,
    })

    if (sensityResponse.ok) {
      const data = await sensityResponse.json() as Record<string, unknown>
      sensityScore = (data as any)?.score ?? 0
      sensitySignals = data
    }
  } catch {
    // Sensity unavailable — Hive covers primary detection
  }

  return {
    c2pa_manifest_present: c2paResult.has_manifest,
    c2pa_manifest_valid: c2paResult.is_valid,
    c2pa_claimed_origin: c2paResult.claimed_origin,
    sensity_score: sensityScore,
    sensity_signals: sensitySignals,
    processing_ms: Date.now() - start,
  }
}
