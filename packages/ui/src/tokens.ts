/**
 * Design tokens + verdict helpers for the Fountem / Unfaked design system.
 * Hex values mirror `tailwind-preset.cjs` for use in inline SVG / canvas.
 */

export const BRAND = {
  forest: {
    50: '#f0f7f2',
    500: '#3a7d4e',
    800: '#245233',
    900: '#1a3d26',
    950: '#0d1f14',
  },
  parchment: '#faf8f3',
  ink: { DEFAULT: '#1c1c1e', secondary: '#545456', muted: '#8a8a8e' },
  font: {
    serif: "var(--font-lora), Lora, Georgia, serif",
    sans: "var(--font-inter), Inter, system-ui, sans-serif",
    mono: "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace",
  },
} as const

export type VerdictTone = 'true' | 'misleading' | 'false' | 'unverified'

/** Maps every fact-check and detection verdict to a semantic tone. */
const TONE_BY_VERDICT: Record<string, VerdictTone> = {
  // Fact-check verdicts
  true: 'true',
  mostly_true: 'true',
  half_true: 'misleading',
  misleading: 'misleading',
  mostly_false: 'false',
  false: 'false',
  unverifiable: 'unverified',
  inconclusive: 'unverified',
  // Detection verdicts
  real: 'true',
  likely_real: 'true',
  likely_ai_generated: 'misleading',
  ai_generated: 'false',
}

export function verdictTone(verdict: string): VerdictTone {
  return TONE_BY_VERDICT[verdict] ?? 'unverified'
}

export const TONE_HEX: Record<VerdictTone, string> = {
  true: '#3a7d4e',
  misleading: '#d97706',
  false: '#dc2626',
  unverified: '#8e8e93',
}

/** Tailwind classes for a verdict chip on the editorial (light) surface. */
const TONE_CHIP_LIGHT: Record<VerdictTone, string> = {
  true: 'text-forest-700 bg-forest-50 border-forest-200',
  misleading: 'text-amber-700 bg-amber-50 border-amber-200',
  false: 'text-red-700 bg-red-50 border-red-200',
  unverified: 'text-ink-secondary bg-parchment-300 border-ink-muted/30',
}

/** Tailwind classes for a verdict chip on the forensic (dark) surface. */
const TONE_CHIP_DARK: Record<VerdictTone, string> = {
  true: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
  misleading: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
  false: 'text-red-300 bg-red-500/10 border-red-500/30',
  unverified: 'text-zinc-300 bg-zinc-500/10 border-zinc-500/30',
}

export function toneChipClasses(verdict: string, surface: 'light' | 'dark' = 'light'): string {
  const tone = verdictTone(verdict)
  return surface === 'dark' ? TONE_CHIP_DARK[tone] : TONE_CHIP_LIGHT[tone]
}

/** Hex for a confidence percentage (used by gauges). */
export function confidenceToColour(pct: number): string {
  if (pct >= 80) return TONE_HEX.true
  if (pct >= 55) return TONE_HEX.misleading
  return TONE_HEX.false
}

/** Backwards-compatible verdict→class helper (light surface). */
export function verdictToTailwind(verdict: string): string {
  return toneChipClasses(verdict, 'light')
}

export function cls(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

/** Human label for a verdict key. */
export function verdictLabel(verdict: string): string {
  return verdict
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
