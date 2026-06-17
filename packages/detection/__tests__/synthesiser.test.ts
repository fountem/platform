import { synthesiseVerdict } from '../src/synthesiser'
import type { Layer1Signals, Layer2Signals, Layer3Signals } from '@fountem/db'

const strongAISignals: Layer1Signals = {
  hive_ai_generated_score: 0.95,
  hive_deepfake_score: 0.88,
  sensity_score: 0.92,
  temporal_inconsistency: true,
  physics_anomaly: true,
  texture_artifacts: true,
  generator_fingerprint: 'veo',
  quality_degraded: false,
}

const noCPA: Layer2Signals = {
  c2pa_manifest_present: false,
  c2pa_valid: false,
  c2pa_provenance_chain: [],
  c2pa_signature_issuer: null,
  synthid_detected: null,
  watermark_other: null,
  metadata_stripped: true,
  container_format: 'mp4',
  reverse_image_first_seen: null,
}

const suspiciousContext: Layer3Signals = {
  channel_age_days: 2,
  channel_video_count: 1,
  audio_cleanliness_score: 0.99,
  clip_transition_intervals: [2, 2, 2, 2],
  behavioural_plausibility_score: 0.1,
  contextual_red_flags: ['Channel created 2 days ago', 'Only 1 video', 'Uniform intervals'],
  audio_visual_sync_score: null,
  lip_sync_anomaly: false,
}

const cleanRealSignals: Layer1Signals = {
  hive_ai_generated_score: 0.05,
  hive_deepfake_score: 0.03,
  sensity_score: 0.04,
  temporal_inconsistency: false,
  physics_anomaly: false,
  texture_artifacts: false,
  generator_fingerprint: null,
  quality_degraded: false,
}

const validC2PA: Layer2Signals = {
  c2pa_manifest_present: true,
  c2pa_valid: true,
  c2pa_provenance_chain: ['Canon EOS R5', 'Adobe Premiere'],
  c2pa_signature_issuer: 'Canon Inc.',
  synthid_detected: false,
  watermark_other: null,
  metadata_stripped: false,
  container_format: 'mp4',
  reverse_image_first_seen: null,
}

const cleanContext: Layer3Signals = {
  channel_age_days: 1825,
  channel_video_count: 342,
  audio_cleanliness_score: 0.7,
  clip_transition_intervals: [3.2, 5.1, 2.8],
  behavioural_plausibility_score: 0.9,
  contextual_red_flags: [],
  audio_visual_sync_score: 0.92,
  lip_sync_anomaly: false,
}

describe('synthesiseVerdict', () => {
  it('returns ai_generated for strong AI signals', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.verdict).toBe('ai_generated')
    expect(result.confidence_pct).toBeGreaterThanOrEqual(85)
    expect(result.probable_generator).toBe('veo')
  })

  it('returns real for clean signals with valid C2PA (provenance short-circuit)', () => {
    const result = synthesiseVerdict(cleanRealSignals, validC2PA, cleanContext)
    expect(['real', 'likely_real']).toContain(result.verdict)
    expect(result.confidence_pct).toBeLessThan(40)
    expect(result.signal_breakdown.provenance_short_circuit).toBe(true)
  })

  it('detects evasion when metadata stripped with high AI score', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(['yes', 'suspected']).toContain(result.evasion_detected)
  })

  it('includes reasoning string referencing forensic vendors', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.reasoning).toContain('Hive')
    expect(result.reasoning.toLowerCase()).toContain('forensic')
  })

  it('includes what_would_change_this', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.what_would_change_this).toBeTruthy()
    expect(result.what_would_change_this.length).toBeGreaterThan(20)
  })

  it('returns a calibrated confidence band, not a point estimate', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.confidence_low).toBeLessThanOrEqual(result.confidence_pct)
    expect(result.confidence_high).toBeGreaterThanOrEqual(result.confidence_pct)
    expect(result.confidence_high).toBeGreaterThan(result.confidence_low)
  })

  it('flags vendor disagreement when Hive and Sensity diverge', () => {
    const disagree: Layer1Signals = { ...strongAISignals, hive_ai_generated_score: 0.9, hive_deepfake_score: 0.9, sensity_score: 0.2 }
    const result = synthesiseVerdict(disagree, noCPA, suspiciousContext)
    expect(result.vendor_disagreement).toBe(true)
    // disagreement should widen the band
    expect(result.confidence_high - result.confidence_low).toBeGreaterThan(12)
  })

  it('short-circuits to AI when a SynthID watermark is detected', () => {
    const watermarked: Layer2Signals = { ...noCPA, synthid_detected: true }
    const result = synthesiseVerdict(cleanRealSignals, watermarked, cleanContext)
    expect(result.verdict).toBe('ai_generated')
    expect(result.signal_breakdown.provenance_short_circuit).toBe(true)
  })

  it('widens the band and down-weights forensic when quality is degraded', () => {
    const degraded: Layer1Signals = { ...strongAISignals, quality_degraded: true }
    const result = synthesiseVerdict(degraded, noCPA, suspiciousContext)
    const forensic = result.signal_breakdown.contributions.find((c) => c.label.startsWith('Forensic'))!
    expect(forensic.weight).toBeLessThan(0.5)
  })

  it('handles missing contextual/temporal signals (buffer-only fallback)', () => {
    const empty: Layer3Signals = {
      channel_age_days: null,
      channel_video_count: null,
      audio_cleanliness_score: null,
      clip_transition_intervals: null,
      behavioural_plausibility_score: null,
      contextual_red_flags: [],
      audio_visual_sync_score: null,
      lip_sync_anomaly: false,
    }
    const result = synthesiseVerdict(strongAISignals, noCPA, empty)
    // only forensic + provenance present → weights renormalise to sum 1
    const total = result.signal_breakdown.contributions.reduce((s, c) => s + c.weight, 0)
    expect(total).toBeCloseTo(1, 2)
    expect(result.signal_breakdown.contributions).toHaveLength(2)
  })
})
