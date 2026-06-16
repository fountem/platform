import type { Layer1Signals, Layer2Signals, Layer3Signals, DetectionVerdict, EvasionStatus } from '@fountem/db'

export interface SynthesisResult {
  verdict: DetectionVerdict
  confidence_pct: number
  probable_generator: string | null
  evasion_detected: EvasionStatus
  evasion_description: string | null
  reasoning: string
  what_would_change_this: string
}

const WEIGHTS = {
  layer1: 0.55,  // Forensic signals — highest weight
  layer2: 0.25,  // Provenance — strong signal when present
  layer3: 0.20,  // Contextual — corroborating signal
}

function detectEvasion(l1: Layer1Signals, l2: Layer2Signals, l3: Layer3Signals): {
  detected: EvasionStatus
  description: string | null
} {
  const tactics: string[] = []

  if (l2.metadata_stripped && l1.hive_ai_generated_score > 0.6) {
    tactics.push('Metadata stripped — common technique to remove AI generation markers')
  }
  if (l1.texture_artifacts && l1.hive_ai_generated_score < 0.7) {
    tactics.push('Texture artifacts suggest re-encoding to reduce AI score')
  }
  if (l3.audio_cleanliness_score !== null && l3.audio_cleanliness_score > 0.95 && l1.hive_ai_generated_score > 0.7) {
    tactics.push('Suspiciously clean audio on AI-scored video — may indicate audio replacement')
  }
  if (l3.clip_transition_intervals && new Set(l3.clip_transition_intervals).size === 1) {
    tactics.push('Uniform clip intervals suggest automated batch processing')
  }

  if (tactics.length === 0) return { detected: 'no', description: null }
  if (tactics.length === 1) return { detected: 'suspected', description: tactics[0] }
  return { detected: 'yes', description: tactics.join('; ') }
}

export function synthesiseVerdict(
  l1: Layer1Signals,
  l2: Layer2Signals,
  l3: Layer3Signals
): SynthesisResult {
  // Layer 1 score: max of Hive AI + Hive deepfake, boosted by Sensity
  const hiveScore = Math.max(l1.hive_ai_generated_score, l1.hive_deepfake_score)
  const sensityBoost = l1.sensity_score ? (l1.sensity_score - hiveScore) * 0.3 : 0
  const layer1Score = Math.min(1, hiveScore + sensityBoost)

  // Layer 2 score: absence of valid C2PA from known camera = suspicious
  // Presence of valid C2PA from trusted source = strong real signal
  const layer2Score = l2.c2pa_valid
    ? 0.1  // Valid provenance → low AI likelihood
    : l2.metadata_stripped ? 0.8 : 0.5  // Stripped metadata → suspicious

  // Layer 3 score: inverted behavioural plausibility
  const behaviouralScore = l3.behavioural_plausibility_score !== null
    ? 1 - l3.behavioural_plausibility_score
    : 0.4  // Unknown → neutral-ish

  const redFlagBoost = Math.min(0.2, (l3.contextual_red_flags?.length ?? 0) * 0.05)

  // Weighted composite
  const compositeScore =
    layer1Score * WEIGHTS.layer1 +
    layer2Score * WEIGHTS.layer2 +
    (behaviouralScore + redFlagBoost) * WEIGHTS.layer3

  const confidence_pct = Math.round(compositeScore * 100)

  // Verdict thresholds
  let verdict: DetectionVerdict
  if (compositeScore >= 0.85) verdict = 'ai_generated'
  else if (compositeScore >= 0.65) verdict = 'likely_ai_generated'
  else if (compositeScore >= 0.40) verdict = 'inconclusive'
  else if (compositeScore >= 0.20) verdict = 'likely_real'
  else verdict = 'real'

  const evasion = detectEvasion(l1, l2, l3)

  const reasoning = [
    `Layer 1 (forensic): Hive AI score ${(l1.hive_ai_generated_score * 100).toFixed(0)}%, deepfake score ${(l1.hive_deepfake_score * 100).toFixed(0)}%.`,
    l1.sensity_score !== null ? `Sensity corroborates at ${(l1.sensity_score * 100).toFixed(0)}%.` : null,
    l2.c2pa_valid ? 'Layer 2 (provenance): Valid C2PA manifest present — strong provenance signal.' : `Layer 2 (provenance): No valid C2PA manifest. ${l2.metadata_stripped ? 'Metadata stripped.' : ''}`,
    l3.contextual_red_flags?.length ? `Layer 3 (contextual): ${l3.contextual_red_flags.length} red flag(s) — ${l3.contextual_red_flags[0]}.` : 'Layer 3 (contextual): No contextual red flags.',
    `Composite weighted score: ${(compositeScore * 100).toFixed(0)}%.`,
  ].filter(Boolean).join(' ')

  const what_would_change = l2.c2pa_valid
    ? 'This verdict would change if C2PA manifest verification failed or a known generator fingerprint was identified.'
    : 'A verified C2PA manifest from a trusted camera manufacturer, or independent platform confirmation of organic upload, would shift this verdict toward real.'

  return {
    verdict,
    confidence_pct,
    probable_generator: l1.generator_fingerprint,
    evasion_detected: evasion.detected,
    evasion_description: evasion.description,
    reasoning,
    what_would_change_this: what_would_change,
  }
}
