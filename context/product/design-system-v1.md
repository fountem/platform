# Fountem Design System v1.0

## Design Rationale

Six decisions define the visual language:
- **Forest Green (#245233)** — not any UK political party colour. Trustworthy, grounded.
- **Warm Parchment (#faf8f3)** — not clinical white. Signals permanence and care.
- **Lora (serif) + Inter (sans)** — authority (serif) + clarity (sans). The Guardian register.
- **Mobile-first, content-first** — core user is on phone, about to share something.
- **Amber (#f59e0b) for alerts** — politically neutral. Never red or blue for brand elements.
- **GOV.UK rigour + fintech warmth** — credibility of a public institution, approachability of a product.

## Colour Palette

### Primary: Forest Green
| Token | Hex | Use |
|---|---|---|
| forest-950 | #0d1f14 | Deepest backgrounds (Unfaked) |
| forest-900 | #1a3d26 | Nav, dark panels, hero |
| forest-800 | #245233 | **Primary CTA buttons** |
| forest-50 | #f0f7f2 | Tag/pill backgrounds |

### Background: Warm Parchment
| Token | Hex |
|---|---|
| parchment-100 | #faf8f3 |
| parchment-200 | #f8f4ec |

### Verdict / Status Colours
| Status | Colour | Background |
|---|---|---|
| ✓ Verified True | #3a7d4e (forest-600) | #f0f7f2 |
| ⚠ Misleading | #d97706 (amber-600) | #fffbeb |
| ✗ False | #dc2626 (red-600) | #fef2f2 |
| ○ Unverified | #8e8e93 (slate-400) | #f2f2f7 |

**Rule:** Red is ONLY for "False" verdict. Never as brand, button, or decoration. Same for blue.

## Typography
- Font serif: Lora, Georgia, serif
- Font sans: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- Never bold serif — Lora at 400 weight is more authoritative than 700
- Italic serif for brand copy emphasis

## Tailwind Config
```js
module.exports = {
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f2', 800: '#245233', 900: '#1a3d26', 950: '#0d1f14',
        },
        parchment: { 100: '#faf8f3', 200: '#f8f4ec' },
        ink: { DEFAULT: '#1c1c1e', secondary: '#545456' },
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

## Product Differentiation
| | Fountem | Unfaked |
|---|---|---|
| Hero colour | forest-900 | forest-950 (darker, more urgent) |
| Primary action | "Check my ballot" (postcode) | "@Unfaked [tag post]" |
| Tone | Exploratory, empowering | Definitive, authoritative |
| Shared | Logo, colour palette, typography, spacing, card patterns, status chips |
