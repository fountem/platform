import { serialiseDetectionVerdict, serialiseClaimVerdict } from '../src/serialiser'
import type { VideoDetection, CorrectionPack, Verdict } from '@fountem/db'

const mockDetection: VideoDetection = {
  id: 'det_001',
  claim_id: null,
  video_url: 'https://example.com/video.mp4',
  video_hash: 'abc123',
  verdict: 'ai_generated',
  confidence_pct: 91,
  probable_generator: 'veo',
  reasoning: 'Strong Veo temporal signature detected across all 3 layers.',
  what_would_change_this: 'A verified C2PA manifest from a trusted camera would change this verdict.',
  evasion_detected: 'no',
  evasion_description: null,
  layer1_signals: {
    hive_ai_generated_score: 0.94,
    hive_deepfake_score: 0.87,
    sensity_score: 0.91,
    temporal_inconsistency: true,
    physics_anomaly: false,
    texture_artifacts: true,
    generator_fingerprint: 'veo',
  },
  layer2_signals: {
    c2pa_manifest_present: false,
    c2pa_valid: false,
    c2pa_provenance_chain: [],
    synthid_detected: null,
    metadata_stripped: true,
    container_format: 'mp4',
  },
  layer3_signals: {
    channel_age_days: 3,
    channel_video_count: 2,
    audio_cleanliness_score: 0.98,
    clip_transition_intervals: [2.0, 2.0, 2.0],
    behavioural_plausibility_score: 0.2,
    contextual_red_flags: ['Channel created 3 days ago', 'Only 2 videos uploaded', 'Uniform clip intervals suggest automated generation'],
  },
  is_public: true,
  case_title: 'Fake Farage Rally Video',
  created_at: '2026-06-16T10:00:00Z',
}

const mockPack: CorrectionPack = {
  id: 'pack_001',
  slug: 'abc12345',
  verdict_id: null,
  detection_id: 'det_001',
  og_image_url: null,
  share_count: 0,
  created_at: '2026-06-16T10:00:00Z',
}

describe('serialiseDetectionVerdict', () => {
  it('returns a verdict card with correct fields', () => {
    const card = serialiseDetectionVerdict(mockDetection, mockPack)
    expect(card.verdict).toBe('ai_generated')
    expect(card.verdict_label).toBe('AI GENERATED')
    expect(card.confidence_pct).toBe(91)
    expect(card.confidence_label).toBe('HIGH')
    expect(card.probable_generator).toBe('veo')
    expect(card.probable_generator_label).toBe('Google Veo')
    expect(card.evasion_detected).toBe('no')
    expect(card.correction_pack_slug).toBe('abc12345')
  })

  it('includes layer breakdown', () => {
    const card = serialiseDetectionVerdict(mockDetection, mockPack)
    expect(card.layer_breakdown).not.toBeNull()
    expect(card.layer_breakdown!.layer1.score).toBe(94)
    expect(card.layer_breakdown!.layer1.signals).toContain('Temporal inconsistency detected')
    expect(card.layer_breakdown!.layer2.provenance).toBe(false)
    expect(card.layer_breakdown!.layer2.metadata_stripped).toBe(true)
    expect(card.layer_breakdown!.layer3.red_flags).toHaveLength(3)
  })

  it('generates share text', () => {
    const card = serialiseDetectionVerdict(mockDetection, mockPack)
    expect(card.share_text).toContain('AI GENERATED')
    expect(card.share_text).toContain('Google Veo')
    expect(card.share_text).toContain('91%')
  })

  it('handles null pack gracefully', () => {
    const card = serialiseDetectionVerdict(mockDetection, null)
    expect(card.correction_pack_url).toBeNull()
    expect(card.correction_pack_slug).toBeNull()
  })
})

describe('serialiseClaimVerdict', () => {
  const mockVerdict: Verdict = {
    id: 'vrd_001',
    claim_id: 'clm_001',
    verdict: 'false',
    confidence_pct: 88,
    summary: 'Housing starts fell 8% in 2024 according to MHCLG data.',
    reasoning: 'The ONS reported a decline. The claim of a rise is false.',
    what_would_change_this: 'Revised MHCLG data showing a different figure.',
    evidence_chunk_ids: ['chunk_001'],
    source_citations: [{ chunk_id: 'chunk_001', source_title: 'MHCLG Housing Statistics', source_url: 'https://gov.uk/mhclg', publisher: 'MHCLG', published_at: '2025-03-01', excerpt: 'Housing starts fell 8.2% in 2024.' }],
    model_used: 'claude-sonnet-4-6',
    prompt_tokens: 2100,
    completion_tokens: 380,
    reviewed_by: null,
    reviewed_at: null,
    probable_generator: null,
    evasion_detected: null,
    created_at: '2026-06-16T10:00:00Z',
  }

  it('serialises claim verdict correctly', () => {
    const card = serialiseClaimVerdict(mockVerdict, 'Housing starts rose by 12% since 2024.', null)
    expect(card.verdict).toBe('false')
    expect(card.verdict_label).toBe('FALSE')
    expect(card.type).toBe('claim_check')
    expect(card.source_citations).toHaveLength(1)
    expect(card.share_text).toContain('FALSE')
  })
})
