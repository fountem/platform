export type VerdictValue = 'true' | 'mostly_true' | 'half_true' | 'mostly_false' | 'false' | 'misleading' | 'unverifiable' | 'inconclusive'
export type ClaimType = 'statistic' | 'policy' | 'historical' | 'prediction' | 'deepfake_video' | 'deepfake_audio' | 'ai_generated_image' | 'general'
export type ClaimStatus = 'pending' | 'processing' | 'complete' | 'failed' | 'archived'
/** How a claim entered the system: typed text, extracted from a video, or from a live session. */
export type ClaimInputKind = 'text' | 'video' | 'live'
export type SourceType =
  | 'ons' | 'ifs' | 'hansard' | 'full_fact' | 'resolution_foundation' | 'nao' | 'bbc_reality_check' | 'academic' | 'government'
  // General / open-web evidence categories (used by the live web-evidence layer).
  | 'web' | 'news' | 'fact_checker' | 'official' | 'reference'
/** Evidence provenance tier — primary trusted corpus vs open-web augmentation. */
export type SourceTier = 'primary' | 'web'
export type DetectionVerdict = 'ai_generated' | 'likely_ai_generated' | 'inconclusive' | 'likely_real' | 'real'
export type EvasionStatus = 'yes' | 'no' | 'suspected'
export type ApiTier = 'free' | 'newsroom' | 'enterprise'

export type EvidenceSource = {
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

export type EvidenceChunk = {
  id: string
  source_id: string
  chunk_index: number
  content: string
  topic_tags: string[]
  party_relevance: string[]
  created_at: string
}

export type Claim = {
  id: string
  claim_text: string
  claim_type: ClaimType
  /** Origin of the claim (typed text, video extraction, live session). */
  input_kind: ClaimInputKind | null
  /** SHA-256 of the normalised claim text — used for dedup/caching. */
  claim_hash: string | null
  /** The signed-in user who submitted it (null for API/public). */
  user_id: string | null
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

export type Verdict = {
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
  /** Trust tier of the cited source. Absent on legacy rows (treat as 'primary'). */
  source_tier?: SourceTier
}

export type ReviewStatus = 'automated' | 'pending_review' | 'human_reviewed'

export type VideoDetection = {
  id: string
  claim_id: string | null
  video_url: string | null
  video_hash: string | null
  verdict: DetectionVerdict
  confidence_pct: number
  /** Calibrated confidence band (lower/upper bound) — never a bare point estimate. */
  confidence_low: number | null
  confidence_high: number | null
  probable_generator: string | null
  reasoning: string | null
  what_would_change_this: string | null
  evasion_detected: EvasionStatus | null
  evasion_description: string | null
  /** True when independent forensic vendors (Hive vs Sensity) materially disagree. */
  vendor_disagreement: boolean | null
  /** Per-signal contribution breakdown for the explainability UI. */
  signal_breakdown: SignalBreakdown | null
  review_status: ReviewStatus | null
  reviewed_by: string | null
  reviewed_at: string | null
  reviewer_notes: string | null
  layer1_signals: Layer1Signals | null
  layer2_signals: Layer2Signals | null
  layer3_signals: Layer3Signals | null
  is_public: boolean
  case_title: string | null
  created_at: string
}

export interface SignalContribution {
  label: string
  /** 0–1 AI-likelihood this signal indicates. */
  score: number
  /** 0–1 how much this signal counted toward the final verdict (post degradation-aware reweighting). */
  weight: number
  detail: string
}

export interface SignalBreakdown {
  contributions: SignalContribution[]
  /** Quantised composite (0–1) after discretised voting. */
  composite_score: number
  provenance_short_circuit: boolean
}

export interface Layer1Signals {
  hive_ai_generated_score: number
  hive_deepfake_score: number
  sensity_score: number | null
  temporal_inconsistency: boolean
  physics_anomaly: boolean
  texture_artifacts: boolean
  generator_fingerprint: string | null
  /** True when the input is low-res / heavily compressed (degradation-aware fusion). */
  quality_degraded: boolean
}

export interface Layer2Signals {
  c2pa_manifest_present: boolean
  c2pa_valid: boolean
  c2pa_provenance_chain: string[]
  c2pa_signature_issuer: string | null
  synthid_detected: boolean | null
  watermark_other: string | null
  metadata_stripped: boolean
  container_format: string | null
  /** ISO date the media was first seen online (reverse-image lookup) — catches recontextualised real media. */
  reverse_image_first_seen: string | null
}

export interface Layer3Signals {
  channel_age_days: number | null
  channel_video_count: number | null
  audio_cleanliness_score: number | null
  clip_transition_intervals: number[] | null
  behavioural_plausibility_score: number | null
  contextual_red_flags: string[]
  /** Cross-modal audio↔visual (lip-sync) correlation, 0–1; null when no audio/face. */
  audio_visual_sync_score: number | null
  lip_sync_anomaly: boolean
}

export type CorrectionPack = {
  id: string
  slug: string
  verdict_id: string | null
  detection_id: string | null
  og_image_url: string | null
  share_count: number
  created_at: string
}

export type Party = {
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

export type Issue = {
  id: string
  slug: string
  title: string
  description: string | null
  category: string | null
}

export type PartyIssuePosition = {
  id: string
  party_id: string
  issue_id: string
  position_summary: string
  stated_commitment: string | null
  source_url: string | null
  source_date: string | null
}

export type TrackRecordScore = {
  id: string
  party_id: string
  issue_id: string
  score: number | null
  score_reasoning: string | null
  evidence_chunk_ids: string[]
  calculated_at: string
}

export type ApiKey = {
  id: string
  key_hash: string
  label: string | null
  organisation: string | null
  tier: ApiTier
  monthly_limit: number
  requests_this_month: number
  last_reset_at: string
  is_active: boolean
  created_at: string
}

export type Profile = {
  id: string
  email: string | null
  display_name: string | null
  plan: 'free' | 'pro' | 'team'
  created_at: string
}

export type UserUsage = {
  user_id: string
  usage_date: string
  product: 'unfaked' | 'fountem' | 'unfaked_live'
  count: number
}

// ── Live fact-checking ────────────────────────────────────────────────────────

export type LiveSourceKind = 'live_url' | 'mic' | 'tab' | 'upload'
export type LiveSessionStatus = 'active' | 'ended' | 'error'

/**
 * Verdict vocabulary for LIVE claims — deliberately softer than the 8-value
 * claim scale. Live output is provisional and unreviewed, so we avoid blunt
 * "FALSE/TRUE" judgements (see context/legal/defamation-liability-memo.md).
 */
export type LiveClaimStatus =
  | 'pending'        // extracted, awaiting verification
  | 'checking'       // verification in progress
  | 'supported'      // evidence supports the claim
  | 'disputed'       // evidence contradicts the claim
  | 'needs_context'  // technically defensible but misleading without context
  | 'unverifiable'   // insufficient evidence right now
  | 'error'          // verification failed

export type LiveSession = {
  id: string
  user_id: string | null
  source_kind: LiveSourceKind
  source_ref: string | null
  source_title: string | null
  status: LiveSessionStatus
  /** Number of claims surfaced (denormalised counter for caps/UX). */
  claim_count: number
  election_mode: boolean
  started_at: string
  ended_at: string | null
}

export type LiveTranscriptChunk = {
  id: string
  session_id: string
  speaker_label: string | null
  text: string
  ts_start_ms: number | null
  ts_end_ms: number | null
  processed_for_claims: boolean
  created_at: string
}

export type LiveClaim = {
  id: string
  session_id: string
  transcript_excerpt: string | null
  claim_text: string
  speaker_label: string | null
  status: LiveClaimStatus
  verdict_summary: string | null
  correction: string | null
  what_would_change_this: string | null
  confidence_pct: number | null
  source_citations: SourceCitation[]
  claim_hash: string | null
  verified_at: string | null
  created_at: string
}

export type ServiceBudget = {
  budget_date: string
  product: string
  count: number
}

export type BotCursor = {
  bot: string
  since_id: string | null
  updated_at: string
}

export type ProcessedMention = {
  tweet_id: string
  replied: boolean
  processed_at: string
}

// Supabase Database type for generic client.
// NOTE: Views / CompositeTypes keys are required for supabase-js (>=2.47) to infer
// the public schema; without them the client falls back to `never` for all ops.
export interface Database {
  public: {
    Tables: {
      evidence_sources: { Row: EvidenceSource; Insert: Partial<EvidenceSource>; Update: Partial<EvidenceSource>; Relationships: [] }
      evidence_chunks: { Row: EvidenceChunk; Insert: Partial<EvidenceChunk>; Update: Partial<EvidenceChunk>; Relationships: [] }
      claims: { Row: Claim; Insert: Partial<Claim>; Update: Partial<Claim>; Relationships: [] }
      verdicts: { Row: Verdict; Insert: Partial<Verdict>; Update: Partial<Verdict>; Relationships: [] }
      video_detections: { Row: VideoDetection; Insert: Partial<VideoDetection>; Update: Partial<VideoDetection>; Relationships: [] }
      correction_packs: { Row: CorrectionPack; Insert: Partial<CorrectionPack>; Update: Partial<CorrectionPack>; Relationships: [] }
      parties: { Row: Party; Insert: Partial<Party>; Update: Partial<Party>; Relationships: [] }
      issues: { Row: Issue; Insert: Partial<Issue>; Update: Partial<Issue>; Relationships: [] }
      party_issue_positions: { Row: PartyIssuePosition; Insert: Partial<PartyIssuePosition>; Update: Partial<PartyIssuePosition>; Relationships: [] }
      track_record_scores: { Row: TrackRecordScore; Insert: Partial<TrackRecordScore>; Update: Partial<TrackRecordScore>; Relationships: [] }
      api_keys: { Row: ApiKey; Insert: Partial<ApiKey>; Update: Partial<ApiKey>; Relationships: [] }
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile>; Relationships: [] }
      user_usage: { Row: UserUsage; Insert: Partial<UserUsage>; Update: Partial<UserUsage>; Relationships: [] }
      service_budget: { Row: ServiceBudget; Insert: Partial<ServiceBudget>; Update: Partial<ServiceBudget>; Relationships: [] }
      bot_cursor: { Row: BotCursor; Insert: Partial<BotCursor>; Update: Partial<BotCursor>; Relationships: [] }
      processed_mentions: { Row: ProcessedMention; Insert: Partial<ProcessedMention>; Update: Partial<ProcessedMention>; Relationships: [] }
      live_sessions: { Row: LiveSession; Insert: Partial<LiveSession>; Update: Partial<LiveSession>; Relationships: [] }
      live_transcript_chunks: { Row: LiveTranscriptChunk; Insert: Partial<LiveTranscriptChunk>; Update: Partial<LiveTranscriptChunk>; Relationships: [] }
      live_claims: { Row: LiveClaim; Insert: Partial<LiveClaim>; Update: Partial<LiveClaim>; Relationships: [] }
    }
    Views: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
    Functions: {
      bm25_search: {
        Args: { query_text: string; limit: number }
        Returns: EvidenceChunk[]
      }
      vector_search: {
        Args: { query_embedding: number[]; limit: number }
        Returns: EvidenceChunk[]
      }
      increment_api_key_usage: {
        Args: { p_key_hash: string }
        Returns: { allowed: boolean; requests_this_month: number; monthly_limit: number }[]
      }
      increment_user_usage: {
        Args: { p_user_id: string; p_product: string; p_limit: number }
        Returns: { allowed: boolean; used: number; day_limit: number }[]
      }
      increment_global_budget: {
        Args: { p_product: string; p_cap: number }
        Returns: { allowed: boolean; used: number; cap: number }[]
      }
    }
    Enums: { [_ in never]: never }
  }
}
