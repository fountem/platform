import type { Config } from 'tailwindcss'

/**
 * Shared Tailwind preset — the Fountem / Unfaked design system.
 *
 * Two surfaces share one palette:
 *   - Editorial (light): warm parchment + forest green + Lora serif. Marketing,
 *     trust, archive, methodology. "GOV.UK rigour + fintech warmth."
 *   - Forensic (dark):  near-black forest + emerald/amber data accents + mono.
 *     The analysis/result views where we show our working.
 *
 * Rule: red is ONLY for the "false / AI-generated" verdict. Never brand chrome.
 */
const preset: Omit<Config, 'content'> = {
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f2',
          100: '#dceee2',
          200: '#bcdcc8',
          300: '#8fc1a4',
          400: '#5ba07b',
          500: '#3a7d4e',
          600: '#2f6741',
          700: '#285738',
          800: '#245233',
          900: '#1a3d26',
          950: '#0d1f14',
        },
        parchment: {
          DEFAULT: '#faf8f3',
          100: '#faf8f3',
          200: '#f8f4ec',
          300: '#f1ebdd',
          400: '#e7ddc8',
        },
        ink: {
          DEFAULT: '#1c1c1e',
          secondary: '#545456',
          muted: '#8a8a8e',
        },
        verdict: {
          true: '#3a7d4e',
          misleading: '#d97706',
          false: '#dc2626',
          unverified: '#8e8e93',
        },
      },
      fontFamily: {
        serif: ['var(--font-lora)', 'Lora', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '0.875rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 40, 24, 0.04), 0 8px 24px -12px rgba(16, 40, 24, 0.18)',
        'card-lg': '0 2px 4px rgba(16, 40, 24, 0.05), 0 24px 48px -24px rgba(16, 40, 24, 0.25)',
      },
      maxWidth: {
        content: '64rem',
      },
    },
  },
}

export default preset
