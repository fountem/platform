// Shared verdict card schema — used by all apps and the bot

export interface SourceCitation {
  url: string
  title: string
  publisher: string
  quote: string
}

export interface VerdictCard {
  id: string
  type: 'claim' | 'detection'
  product: 'fountem' | 'unfaked'

  // Core verdict
  verdict: string
  verdict_label: string              // Human-readable: "Mostly False", "AI Generated", etc.
  verdict_colour: string             // Hex colour for UI rendering
  confidence_pct: number
  summary: string
  what_would_change_this: string

  // Claim-specific
  claim_text?: string
  speaker?: string
  party?: string
  source_citations?: SourceCitation[]

  // Detection-specific
  video_url?: string
  probable_generator?: string
  probable_generator_label?: string  // "Kling AI", "Google Veo", etc.
  evasion_detected?: string

  // Sharing
  correction_pack_url: string        // unfaked.ai/c/{slug}
  og_image_url?: string              // Pre-rendered 1200×630 OG card
  share_text: string                 // Pre-written tweet copy

  // Attribution (always present)
  attribution: string
  methodology_url: string
  created_at: string
}

export const VERDICT_META: Record<string, { label: string; colour: string; emoji: string }> = {
  // Claim verdicts
  true:           { label: 'True',           colour: '#16a34a', emoji: '✅' },
  mostly_true:    { label: 'Mostly True',    colour: '#65a30d', emoji: '🟢' },
  half_true:      { label: 'Half True',      colour: '#ca8a04', emoji: '🟡' },
  mostly_false:   { label: 'Mostly False',   colour: '#ea580c', emoji: '🟠' },
  false:          { label: 'False',          colour: '#dc2626', emoji: '❌' },
  misleading:     { label: 'Misleading',     colour: '#9333ea', emoji: '⚠️' },
  unverifiable:   { label: 'Unverifiable',   colour: '#6b7280', emoji: '❓' },
  inconclusive:   { label: 'Inconclusive',   colour: '#6b7280', emoji: '🔍' },
  // Detection verdicts
  ai_generated:         { label: 'AI Generated',        colour: '#dc2626', emoji: '🤖' },
  likely_ai_generated:  { label: 'Likely AI Generated', colour: '#ea580c', emoji: '⚠️' },
  likely_real:          { label: 'Likely Real',          colour: '#65a30d', emoji: '🟢' },
  real:                 { label: 'Real',                 colour: '#16a34a', emoji: '✅' },
}

export const GENERATOR_LABELS: Record<string, string> = {
  veo:     'Google Veo',
  kling:   'Kling AI',
  runway:  'Runway Gen-4',
  sora:    'OpenAI Sora',
  luma:    'Luma Dream Machine',
  pika:    'Pika Labs',
  unknown: 'Unknown Generator',
}
