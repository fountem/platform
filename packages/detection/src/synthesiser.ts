import type { Layer1Result } from './layer1-forensic'
import type { Layer2Result } from './layer2-provenance'
import type { Layer3Result } from './layer3-contextual'

export interface DetectionVerdictOutput {
  verdict: 'ai_generated' | 'likely_ai_generated' | 'inconclusive' | 'likely_real' | 'real'
  confidence_pct: number
  probable_generator: string
  evasion_detected: 'yes' | 'no' | 'suspected'
  evasion_description: string
  reasoning: string
  what_would_change_this: string
  layer1_signals: Layer1Result
  layer2_signals: Layer2Result
  layer3_signals: Layer3Result
  total_processing_ms: number
}

function detectEvasion(l1: Layer1Result, l2: Layer2Result): { detected: 'yes' | 'no' | 'suspected'; description: string } {
  const signals: string[] = []

  if (l1.codec_anomalies.includes('unusually_stable_bitrate') && l1.hive_ai_generated_score > 0.5)
    signals.push('video may have been re-encoded to obscure generation artifacts')

  if (l1.metadata_stripped && l1.hive_ai_generated_score > 0.4)
    signals.push('creation metadata has been stripped')

  if (!l2.c2pa_manifest_present && l1.hive_ai_generated_score > 0.7)
    signals.push('no C2PA provenance manifest present despite high AI generation score')

  if (signals.length === 0) return { detected: 'no', description: '' }
  if (signals.length >= 2) return { detected: 'yes', description: signals.join('; ') }
  return { detected: 'suspected', description: signals[0] }
}

export function synthesiseVerdict(
  l1: Layer1Result,
  l2: Layer2Result,
  l3: Layer3Result
): DetectionVerdictOutput {
  // Weighted composite score
  const score =
    l1.hive_ai_generated_score * 0.40 +
    l1.hive_deepfake_score * 0.15 +
    (l2.c2pa_manifest_present ? 0 : 0.10) +
    l2.sensity_score * 0.20 +
    l3.contextual_risk_score * 0.15

  const verdict =
    score >= 0.85 ? 'ai_generated' :
    score >= 0.65 ? 'likely_ai_generated' :
    score >= 0.40 ? 'inconclusive' :
    score >= 0.20 ? 'likely_real' : 'real'

  const evasion = detectEvasion(l1, l2)

  const reasoning = [
    `Hive AI-generation score: ${Math.round(l1.hive_ai_generated_score * 100)}%.`,
    l2.sensity_score > 0 ? `Sensity forensic score: ${Math.round(l2.sensity_score * 100)}%.` : '',
    `C2PA provenance: ${l2.c2pa_manifest_present ? `present (${l2.c2pa_manifest_valid ? 'valid' : 'invalid'})` : 'absent'}.`,
    l3.reasoning,
  ].filter(Boolean).join(' ')

  const totalMs = l1.processing_ms + l2.processing_ms + l3.processing_ms

  return {
    verdict,
    confidence_pct: Math.round(score * 100),
    probable_generator: l1.probable_generator,
    evasion_detected: evasion.detected,
    evasion_description: evasion.description,
    reasoning,
    what_would_change_this: l3.what_would_change_this,
    layer1_signals: l1,
    layer2_signals: l2,
    layer3_signals: l3,
    total_processing_ms: totalMs,
  }
}
