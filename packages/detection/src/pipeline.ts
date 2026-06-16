import { runLayer1 } from './layer1-forensic'
import { runLayer2 } from './layer2-provenance'
import { runLayer3 } from './layer3-contextual'
import { synthesiseVerdict } from './synthesiser'
import type { Layer1Signals, Layer2Signals, Layer3Signals } from '@fountem/db'

export interface DetectionResult {
  verdict: string
  confidence_pct: number
  probable_generator: string | null
  reasoning: string
  what_would_change_this: string
  evasion_detected: string
  evasion_description: string | null
  layer1_signals: Layer1Signals
  layer2_signals: Layer2Signals
  layer3_signals: Layer3Signals
}

export async function runDetectionPipeline(
  videoBuffer: Buffer,
  videoUrl: string
): Promise<DetectionResult> {
  // Run Layer 1 and Layer 2 in parallel — they're independent
  const [l1, l2] = await Promise.all([
    runLayer1(videoBuffer, videoUrl),
    runLayer2(videoBuffer),
  ])

  // Layer 3 uses Layer 1 score to inform contextual analysis
  const layer1Score = Math.max(l1.hive_ai_generated_score, l1.hive_deepfake_score)
  const l3 = await runLayer3(videoUrl, layer1Score, l2.c2pa_valid)

  const synthesis = synthesiseVerdict(l1, l2, l3)

  return {
    verdict: synthesis.verdict,
    confidence_pct: synthesis.confidence_pct,
    probable_generator: synthesis.probable_generator,
    reasoning: synthesis.reasoning,
    what_would_change_this: synthesis.what_would_change_this,
    evasion_detected: synthesis.evasion_detected,
    evasion_description: synthesis.evasion_description,
    layer1_signals: l1,
    layer2_signals: l2,
    layer3_signals: l3,
  }
}
