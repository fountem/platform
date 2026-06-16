export type VerdictValue = 'true' | 'mostly_true' | 'half_true' | 'mostly_false' | 'false' | 'misleading' | 'unverifiable' | 'inconclusive'
export type ClaimType = 'statistic' | 'policy' | 'historical' | 'prediction' | 'deepfake_video' | 'deepfake_audio' | 'ai_generated_image'
export type ClaimStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'archived'
export type SourceType = 'ons' | 'ifs' | 'hansard' | 'full_fact' | 'resolution_foundation' | 'nao' | 'bbc_reality_check' | 'academic' | 'government'
export type DetectionVerdict = 'ai_generated' | 'likely_ai_generated' | 'inconclusive' | 'likely_real' | 'real'
export type EvasionStatus = 'yes' | 'no' | 'suspected'
export type ApiTier = 'free' | 'newsroom' | 'enterprise'

export interface EvidenceSource {
  id: string
  source_type: SourceType
  title: string
  url: string
  publisher: string
  published_at: string
  retrieved_at: string
  raw_text: string | null
  is_active: boolean
}

export interface EvidenceChunk {
  id: string
  source_id: string
  chunk_index: number
  content: string
  topic_tags: string[]
  party_relevance: string[]
  created_at: string
}

export interface Claim {
  id: string
  claim_text: string
  claim_type: ClaimType
  speaker: string | null
  party: string | null
  spoken_at: string | null
  source_url: string | null
  source_context: string | null
  submitted_by: string
  status: ClaimStatus
  created_at: string
  updated_at: string
}

export interface Verdict {
  id: string
  claim_id: string
  verdict: VerdictValue
  confidence_pct: number
  summary: string
  reasoning: string
  what_would_change_this: string | null
  evidence_chunk_ids: string[]
  source_citations: SourceCitation[]
  model_used: string
  prompt_tokens: number | null
  completion_tokens: number | null
  reviewed_by: string | null
  reviewed_at: string | null
  probable_generator: string | null
  evasion_detected: string | null
  created_at: string
}

export interface SourceCitation {
  chunk_id: string
  source_title: string
  source_url: string
  publisher: string
  published_at: string
  excerpt: string
}

export interface VideoDetection {
  id: string
  claim_id: string | null
  video_url: string | null
  video_hash: string | null
  verdict: DetectionVerdict
  confidence_pct: number
  probable_generator: string | null
  reasoning: string | null
  what_would_change_this: string | null
  evasion_detected: EvasionStatus | null
  evasion_description: string | null
  layer1_signals: Layer1Signals | null
  layer2_signals: Layer2Signals | null
  layer3_signals: Layer3Signals | null
  is_public: boolean
  case_title: string | null
  created_at: string
}

export interface Layer1Signals {
  hive_ai_generated_score: number
  hive_deepfake_score: number
  sensity_score: number | null
  temporal_inconsistency: boolean
  physics_anomaly: boolean
  texture_artifacts: boolean
  generator_fingerprint: string | null
}

export interface Layer2Signals {
  c2pa_manifest_present: boolean
  c2pa_valid: boolean
  c2pa_provenance_chain: string[]
  synthid_detected: boolean | null
  metadata_stripped: boolean
  container_format: string | null
}

export interface Layer3Signals {
  channel_age_days: number | null
  channel_video_count: number | null
  audio_cleanliness_score: number | null
  clip_transition_intervals: number[] | null
  behavioural_plausibility_score: number | null
  contextual_red_flags: string[]
}

export interface CorrectionPack {
  id: string
  slug: string
  verdict_id: string | null
  detection_id: string | null
  og_image_url: string | null
  share_count: number
  created_at: string
}

export interface Party {
  id: string
  slug: string
  name: string
  short_name: string | null
  colour_hex: string | null
  logo_url: string | null
  founded_year: number | null
  current_leader: string | null
  is_active: boolean
}

// Supabase Database type for generic client
export interface Database {
  public: {
    Tables: {
      evidence_sources: { Row: EvidenceSource; Insert: Partial<EvidenceSource>; Update: Partial<EvidenceSource> }
      evidence_chunks: { Row: EvidenceChunk; Insert: Partial<EvidenceChunk>; Update: Partial<EvidenceChunk> }
      claims: { Row: Claim; Insert: Partial<Claim>; Update: Partial<Claim> }
      verdicts: { Row: Verdict; Insert: Partial<Verdict>; Update: Partial<Verdict> }
      video_detections: { Row: VideoDetection; Insert: Partial<VideoDetection>; Update: Partial<VideoDetection> }
      correction_packs: { Row: CorrectionPack; Insert: Partial<CorrectionPack>; Update: Partial<CorrectionPack> }
      parties: { Row: Party; Insert: Partial<Party>; Update: Partial<Party> }
    }
    Functions: {}
    Enums: {}
  }
}
