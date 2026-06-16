// Design tokens
export const BRAND = {
  primary: '#ef4444',       // Unfaked red
  secondary: '#1d1d1f',     // Deep dark
  accent: '#facc15',        // Warning yellow
  surface: '#111113',       // Card surface
  border: '#27272a',        // Subtle border
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#52525b',
  },
  font: {
    sans: "'Inter', -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
} as const

// Verdict colour helpers
export function verdictToTailwind(verdict: string): string {
  const map: Record<string, string> = {
    true:                'text-green-400 bg-green-950 border-green-800',
    mostly_true:         'text-green-300 bg-green-950 border-green-800',
    half_true:           'text-yellow-400 bg-yellow-950 border-yellow-800',
    mostly_false:        'text-orange-400 bg-orange-950 border-orange-800',
    false:               'text-red-400 bg-red-950 border-red-800',
    misleading:          'text-orange-400 bg-orange-950 border-orange-800',
    unverifiable:        'text-slate-400 bg-slate-900 border-slate-700',
    inconclusive:        'text-zinc-400 bg-zinc-900 border-zinc-700',
    ai_generated:        'text-red-400 bg-red-950 border-red-800',
    likely_ai_generated: 'text-orange-400 bg-orange-950 border-orange-800',
    likely_real:         'text-green-300 bg-green-950 border-green-800',
    real:                'text-green-400 bg-green-950 border-green-800',
  }
  return map[verdict] ?? 'text-zinc-400 bg-zinc-900 border-zinc-700'
}

export function confidenceToColour(pct: number): string {
  if (pct >= 85) return '#22c55e'
  if (pct >= 60) return '#facc15'
  return '#f97316'
}

// Shared CSS class utilities
export const cls = (...classes: (string | undefined | null | false)[]): string =>
  classes.filter(Boolean).join(' ')

// Common layout classes
export const LAYOUT = {
  pageContainer: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8',
  section: 'py-12 sm:py-16',
  card: 'rounded-xl border border-zinc-800 bg-zinc-900 p-6',
  cardHover: 'rounded-xl border border-zinc-800 bg-zinc-900 p-6 hover:border-zinc-600 transition-colors',
} as const
