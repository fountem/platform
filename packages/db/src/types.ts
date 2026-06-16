// Auto-generated from Supabase schema — do not edit manually
// Run: npx supabase gen types typescript --local > packages/db/src/types.ts

export type VerdictLevel =
  | 'true'
  | 'mostly_true'
  | 'half_true'
  | 'mostly_false'
  | 'false'
  | 'misleading'
  | 'unverifiable'
  | 'inconclusive'

export type DetectionVerdict =
  | 'ai_generated'
  | 'likely_ai_generated'
  | 'inconclusive'
  | 'likely_real'
  | 'real'

export type ClaimType =
  | 'statistic'
  | 'policy'
  | 'historical'
  | 'prediction'
  | 'deepfake_video'
  | 'deepfake_audio'
  | 'ai_generated_image'

export type SourceType =
  | 'ons'
  | 'ifs'
  | 'hansard'
  | 'full_fact'
  | 'resolution_foundation'
  | 'nao'
  | 'bbc_reality_check'
  | 'academic'
  | 'government'

export type ProbableGenerator =
  | 'veo'
  | 'kling'
  | 'runway'
  | 'sora'
  | 'luma'
  | 'pika'
  | 'unknown'

export interface EvidenceSource {
  id: string
  source_type: SourceType
  title: string
  url: string
  publisher: string
  published_at: string
  retrieved_at: string
  raw_text?: string
  is_active: boolean
}

export interface EvidenceChunk {
  id: string
  source_id: string
  chunk_index: number
  content: string
  embedding?: number[]
  topic_tags: string[]
  party_relevance: string[]
  created_at: string
}

export interface Claim {
  id: string
  claim_text: string
  claim_type: ClaimType
  speaker?: string
  party?: string
  spoken_at?: string
  source_url?: string
  source_context?: string
  submitted_by: string
  status: 'pending' | 'processing' | 'complete' | 'failed' | 'archived'
  created_at: string
  updated_at: string
}

export interface SourceCitation {
  source_id: string
  url: string
  title: string
  publisher: string
  quote: string
  relevance: number
}

export interface Verdict {
  id: string
  claim_id: string
  verdict: VerdictLevel
  confidence_pct: number
  summary: string
  reasoning: string
  what_would_change_this: string
  evidence_chunk_ids: string[]
  source_citations: SourceCitation[]
  model_used: string
  prompt_tokens?: number
  completion_tokens?: number
  reviewed_by?: string
  reviewed_at?: string
  probable_generator?: ProbableGenerator
  evasion_detected?: string
  created_at: string
}

export interface VideoDetection {
  id: string
  claim_id?: string
  video_url?: string
  video_hash?: string
  verdict: DetectionVerdict
  confidence_pct: number
  probable_generator?: ProbableGenerator
  reasoning?: string
  what_would_change_this?: string
  evasion_detected?: 'yes' | 'no' | 'suspected'
  evasion_description?: string
  layer1_signals?: Record<string, unknown>
  layer2_signals?: Record<string, unknown>
  layer3_signals?: Record<string, unknown>
  is_public: boolean
  case_title?: string
  created_at: string
}

export interface CorrectionPack {
  id: string
  slug: string
  verdict_id?: string
  detection_id?: string
  og_image_url?: string
  share_count: number
  created_at: string
}

export interface Party {
  id: string
  slug: string
  name: string
  short_name?: string
  colour_hex?: string
  logo_url?: string
  founded_year?: number
  current_leader?: string
  is_active: boolean
}

// Supabase Database type wrapper
export type Database = {
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
    Functions: {
      bm25_search: { Args: { query_text: string; limit: number }; Returns: EvidenceChunk[] }
      vector_search: { Args: { query_embedding: number[]; limit: number }; Returns: EvidenceChunk[] }
    }
  }
}
