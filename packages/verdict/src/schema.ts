import type { VerdictValue, DetectionVerdict } from '@fountem/db'

export const VERDICT_META: Record<VerdictValue | DetectionVerdict, {
  label: string
  colour: string
  bgColour: string
  icon: string
  sharePrefix: string
}> = {
  true:               { label: 'TRUE',              colour: '#22c55e', bgColour: '#052e16', icon: '✓',  sharePrefix: '✅ VERIFIED TRUE' },
  mostly_true:        { label: 'MOSTLY TRUE',       colour: '#86efac', bgColour: '#052e16', icon: '✓',  sharePrefix: '✅ MOSTLY TRUE' },
  half_true:          { label: 'HALF TRUE',         colour: '#facc15', bgColour: '#1c1807', icon: '~',  sharePrefix: '⚠️ HALF TRUE' },
  mostly_false:       { label: 'MOSTLY FALSE',      colour: '#fb923c', bgColour: '#1c0a00', icon: '✗',  sharePrefix: '❌ MOSTLY FALSE' },
  false:              { label: 'FALSE',             colour: '#ef4444', bgColour: '#1c0000', icon: '✗',  sharePrefix: '❌ FALSE' },
  misleading:         { label: 'MISLEADING',        colour: '#f97316', bgColour: '#1c0800', icon: '!',  sharePrefix: '⚠️ MISLEADING' },
  unverifiable:       { label: 'UNVERIFIABLE',      colour: '#94a3b8', bgColour: '#0f172a', icon: '?',  sharePrefix: '❓ UNVERIFIABLE' },
  inconclusive:       { label: 'INCONCLUSIVE',      colour: '#64748b', bgColour: '#0f172a', icon: '?',  sharePrefix: '❓ INCONCLUSIVE' },
  ai_generated:       { label: 'AI GENERATED',      colour: '#ef4444', bgColour: '#1c0000', icon: '🤖', sharePrefix: '🤖 AI GENERATED' },
  likely_ai_generated:{ label: 'LIKELY AI GENERATED', colour: '#f97316', bgColour: '#1c0800', icon: '🤖', sharePrefix: '🤖 LIKELY AI GENERATED' },
  likely_real:        { label: 'LIKELY REAL',       colour: '#86efac', bgColour: '#052e16', icon: '✓',  sharePrefix: '✅ LIKELY REAL' },
  real:               { label: 'REAL',              colour: '#22c55e', bgColour: '#052e16', icon: '✓',  sharePrefix: '✅ REAL' },
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

export const CONFIDENCE_THRESHOLDS = {
  HIGH:   85,
  MEDIUM: 60,
  LOW:    0,
} as const

export function confidenceLabel(pct: number): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (pct >= CONFIDENCE_THRESHOLDS.HIGH) return 'HIGH'
  if (pct >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'MEDIUM'
  return 'LOW'
}
