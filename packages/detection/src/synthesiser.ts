import type {
  Layer1Signals,
  Layer2Signals,
  Layer3Signals,
  DetectionVerdict,
  EvasionStatus,
  SignalBreakdown,
  SignalContribution,
} from '@fountem/db'

export interface SynthesisResult {
  verdict: DetectionVerdict
  confidence_pct: number
  confidence_low: number
  confidence_high: number
  probable_generator: string | null
  evasion_detected: EvasionStatus
  evasion_description: string | null
  vendor_disagreement: boolean
  signal_breakdown: SignalBreakdown
  reasoning: string
  what_would_change_this: string
}

const AI_GENERATOR_HINTS = ['veo', 'kling', 'runway', 'sora', 'luma', 'pika', 'midjourney', 'firefly', 'dalle', 'stable diffusion', 'stable_diffusion', 'gpt', 'openai', 'generative']

// Base weights (sum to 1). Degradation-aware variant down-weights forensic, which is
// unreliable on compressed/low-res media, and leans on provenance + context.
const WEIGHTS_BASE = { forensic: 0.5, provenance: 0.25, contextual: 0.15, temporal: 0.1 }
const WEIGHTS_DEGRADED = { forensic: 0.35, provenance: 0.3, contextual: 0.2, temporal: 0.15 }

/** Discretised voting: quantise to 0.05 steps to discard meaningless real-world noise
 * without collapsing signals near the decision thresholds. */
function bin(x: number): number {
  return Math.round(clamp01(x) * 20) / 20
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x))
}

function clampPct(x: number): number {
  return Math.max(0, Math.min(100, Math.round(x)))
}

function c2paIndicatesAi(l2: Layer2Signals): boolean {
  const haystack = [l2.c2pa_signature_issuer ?? '', ...(l2.c2pa_provenance_chain ?? [])]
    .join(' ')
    .toLowerCase()
  return AI_GENERATOR_HINTS.some((h) => haystack.includes(h))
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
    tactics.push('Texture artifacts suggest re-encoding to reduce the AI score')
  }
  if (l3.audio_cleanliness_score !== null && l3.audio_cleanliness_score > 0.95 && l1.hive_ai_generated_score > 0.7) {
    tactics.push('Suspiciously clean audio on an AI-scored video — possible audio replacement')
  }
  if (l3.lip_sync_anomaly) {
    tactics.push('Audio and lip movement are out of sync')
  }
  if (l3.clip_transition_intervals && l3.clip_transition_intervals.length > 2 && new Set(l3.clip_transition_intervals).size === 1) {
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
  // ── Forensic (two-vendor) ────────────────────────────────────────────────
  const hiveScore = Math.max(l1.hive_ai_generated_score, l1.hive_deepfake_score)
  const vendorDisagreement =
    l1.sensity_score !== null && Math.abs(hiveScore - l1.sensity_score) > 0.3
  const forensicScore =
    l1.sensity_score !== null ? (hiveScore + l1.sensity_score) / 2 : hiveScore

  // ── Provenance ───────────────────────────────────────────────────────────
  const provenanceScore = l2.c2pa_valid ? 0.1 : l2.metadata_stripped ? 0.7 : 0.5

  // ── Contextual ───────────────────────────────────────────────────────────
  const behaviouralAi =
    l3.behavioural_plausibility_score !== null ? 1 - l3.behavioural_plausibility_score : 0.4
  const redFlagBoost = Math.min(0.2, (l3.contextual_red_flags?.length ?? 0) * 0.05)
  const contextualScore = clamp01(behaviouralAi + redFlagBoost)

  const contextualPresent =
    l3.behavioural_plausibility_score !== null || (l3.contextual_red_flags?.length ?? 0) > 0

  // ── Temporal / cross-modal ───────────────────────────────────────────────
  let temporalPresent = false
  let temporalScore = 0.4
  if (l3.audio_visual_sync_score !== null) {
    temporalScore = 1 - l3.audio_visual_sync_score
    temporalPresent = true
  }
  if (l3.lip_sync_anomaly) {
    temporalScore = Math.max(temporalScore, 0.8)
    temporalPresent = true
  }
  const intervals = l3.clip_transition_intervals
  if (intervals && intervals.length > 2) {
    temporalPresent = true
    if (new Set(intervals).size === 1) temporalScore = Math.max(temporalScore, 0.7)
  }

  const weights = l1.quality_degraded ? WEIGHTS_DEGRADED : WEIGHTS_BASE

  // Presence-aware fusion: only count signals we actually have, then renormalise the
  // weights over them. Unknown signals neither help nor (wrongly) drag the verdict.
  const present: SignalContribution[] = [
    {
      label: 'Forensic (Hive + Sensity)',
      score: bin(forensicScore),
      weight: weights.forensic,
      detail: `Hive ${(hiveScore * 100).toFixed(0)}%${l1.sensity_score !== null ? `, Sensity ${(l1.sensity_score * 100).toFixed(0)}%` : ', Sensity n/a'}${vendorDisagreement ? ' (vendors disagree)' : ''}`,
    },
    {
      label: 'Provenance (C2PA / watermark)',
      score: bin(provenanceScore),
      weight: weights.provenance,
      detail: l2.c2pa_valid ? `Valid C2PA${l2.c2pa_signature_issuer ? ` from ${l2.c2pa_signature_issuer}` : ''}` : l2.metadata_stripped ? 'No manifest; metadata stripped' : 'No manifest',
    },
  ]
  if (contextualPresent) {
    present.push({
      label: 'Contextual (GPT-4o)',
      score: bin(contextualScore),
      weight: weights.contextual,
      detail: l3.contextual_red_flags?.length ? `${l3.contextual_red_flags.length} red flag(s)` : 'No contextual red flags',
    })
  }
  if (temporalPresent) {
    present.push({
      label: 'Temporal / cross-modal',
      score: bin(temporalScore),
      weight: weights.temporal,
      detail: l3.lip_sync_anomaly ? 'Lip-sync anomaly' : l3.audio_visual_sync_score !== null ? `A/V sync ${(l3.audio_visual_sync_score * 100).toFixed(0)}%` : 'Clip-interval analysis',
    })
  }

  const weightSum = present.reduce((s, c) => s + c.weight, 0)
  const contributions: SignalContribution[] = present.map((c) => ({
    ...c,
    weight: Number((c.weight / weightSum).toFixed(3)),
  }))

  // ── Provenance-first short-circuit (Appendix A1) ─────────────────────────
  let composite: number
  let provenanceShortCircuit = false
  if (l2.synthid_detected === true || (l2.c2pa_valid && c2paIndicatesAi(l2))) {
    composite = 0.95
    provenanceShortCircuit = true
  } else if (l2.c2pa_valid && !l2.metadata_stripped) {
    composite = 0.08
    provenanceShortCircuit = true
  } else {
    composite = clamp01(contributions.reduce((sum, c) => sum + c.score * c.weight, 0))
  }

  // ── Verdict thresholds ───────────────────────────────────────────────────
  let verdict: DetectionVerdict
  if (composite >= 0.85) verdict = 'ai_generated'
  else if (composite >= 0.65) verdict = 'likely_ai_generated'
  else if (composite >= 0.4) verdict = 'inconclusive'
  else if (composite >= 0.2) verdict = 'likely_real'
  else verdict = 'real'

  // ── Calibrated confidence band ───────────────────────────────────────────
  const confidence_pct = clampPct(composite * 100)
  let halfWidth = 6
  if (provenanceShortCircuit) halfWidth = 3
  else {
    if (vendorDisagreement) halfWidth += 12
    if (l1.quality_degraded) halfWidth += 10
    if (l1.sensity_score === null) halfWidth += 5
  }
  const confidence_low = clampPct(confidence_pct - halfWidth)
  const confidence_high = clampPct(confidence_pct + halfWidth)

  const evasion = detectEvasion(l1, l2, l3)

  const reasoning = [
    provenanceShortCircuit
      ? composite > 0.5
        ? 'Provenance signals (watermark/C2PA) directly indicate AI generation — this short-circuits the forensic ensemble.'
        : 'A valid, intact C2PA manifest authenticates this media\u2019s origin — this short-circuits the forensic ensemble.'
      : `Ensemble of four signal groups${l1.quality_degraded ? ' (degradation-aware weighting applied — forensic down-weighted)' : ''}.`,
    `Forensic: Hive ${(l1.hive_ai_generated_score * 100).toFixed(0)}% AI / ${(l1.hive_deepfake_score * 100).toFixed(0)}% deepfake${l1.sensity_score !== null ? `; Sensity ${(l1.sensity_score * 100).toFixed(0)}%` : ''}.`,
    vendorDisagreement ? 'Note: forensic vendors materially disagree — treat with caution.' : null,
    l3.contextual_red_flags?.length ? `Contextual: ${l3.contextual_red_flags[0]}.` : null,
    `Composite (quantised): ${(composite * 100).toFixed(0)}% \u2192 confidence ${confidence_low}\u2013${confidence_high}%.`,
  ]
    .filter(Boolean)
    .join(' ')

  const what_would_change = l2.c2pa_valid
    ? 'A failed C2PA signature re-check, or a watermark indicating an AI generator, would move this toward AI-generated.'
    : 'A verified C2PA manifest from a trusted camera/editing tool, agreement from a second forensic vendor, or platform confirmation of an organic original upload would move this toward real.'

  return {
    verdict,
    confidence_pct,
    confidence_low,
    confidence_high,
    probable_generator: l1.generator_fingerprint,
    evasion_detected: evasion.detected,
    evasion_description: evasion.description,
    vendor_disagreement: vendorDisagreement,
    signal_breakdown: {
      contributions,
      composite_score: composite,
      provenance_short_circuit: provenanceShortCircuit,
    },
    reasoning,
    what_would_change_this: what_would_change,
  }
}
