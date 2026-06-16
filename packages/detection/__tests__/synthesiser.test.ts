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
}

const noCPA: Layer2Signals = {
  c2pa_manifest_present: false,
  c2pa_valid: false,
  c2pa_provenance_chain: [],
  synthid_detected: null,
  metadata_stripped: true,
  container_format: 'mp4',
}

const suspiciousContext: Layer3Signals = {
  channel_age_days: 2,
  channel_video_count: 1,
  audio_cleanliness_score: 0.99,
  clip_transition_intervals: [2, 2, 2, 2],
  behavioural_plausibility_score: 0.1,
  contextual_red_flags: ['Channel created 2 days ago', 'Only 1 video', 'Uniform intervals'],
}

const cleanRealSignals: Layer1Signals = {
  hive_ai_generated_score: 0.05,
  hive_deepfake_score: 0.03,
  sensity_score: 0.04,
  temporal_inconsistency: false,
  physics_anomaly: false,
  texture_artifacts: false,
  generator_fingerprint: null,
}

const validC2PA: Layer2Signals = {
  c2pa_manifest_present: true,
  c2pa_valid: true,
  c2pa_provenance_chain: ['Canon EOS R5', 'Adobe Premiere'],
  synthid_detected: false,
  metadata_stripped: false,
  container_format: 'mp4',
}

const cleanContext: Layer3Signals = {
  channel_age_days: 1825,
  channel_video_count: 342,
  audio_cleanliness_score: 0.7,
  clip_transition_intervals: [3.2, 5.1, 2.8],
  behavioural_plausibility_score: 0.9,
  contextual_red_flags: [],
}

describe('synthesiseVerdict', () => {
  it('returns ai_generated for strong AI signals', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.verdict).toBe('ai_generated')
    expect(result.confidence_pct).toBeGreaterThanOrEqual(85)
    expect(result.probable_generator).toBe('veo')
  })

  it('returns real for clean signals with valid C2PA', () => {
    const result = synthesiseVerdict(cleanRealSignals, validC2PA, cleanContext)
    expect(['real', 'likely_real']).toContain(result.verdict)
    expect(result.confidence_pct).toBeLessThan(40)
  })

  it('detects evasion when metadata stripped with high AI score', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(['yes', 'suspected']).toContain(result.evasion_detected)
  })

  it('includes reasoning string', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.reasoning).toContain('Hive')
    expect(result.reasoning).toContain('Layer 2')
  })

  it('includes what_would_change_this', () => {
    const result = synthesiseVerdict(strongAISignals, noCPA, suspiciousContext)
    expect(result.what_would_change_this).toBeTruthy()
    expect(result.what_would_change_this.length).toBeGreaterThan(20)
  })
})
