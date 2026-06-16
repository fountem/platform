# Tech Stack Blueprint — Fountem/Unfaked

## Frontend
- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS with Fountem design tokens
- **Components:** shadcn/ui + custom components in packages/ui
- **Deployment:** Vercel (3 separate projects) or Netlify

## Backend
- **Database:** Supabase (PostgreSQL) with pgvector + pg_trgm
- **Auth:** Supabase Auth + Row Level Security
- **API:** Next.js Route Handlers (REST for B2B), tRPC for internal

## AI/ML
- **Primary LLM:** Claude Sonnet via Anthropic API (RAG verdicts)
- **Embeddings:** OpenAI text-embedding-3-small (1536 dims)
- **Contextual layer:** GPT-4o (video detection Layer 3)
- **Deepfake detection:** Hive Moderation API + Sensity AI
- **Provenance:** c2pa-node (in-process)

## Infrastructure
- **Monorepo:** Turborepo
- **CI:** GitHub Actions (lint, typecheck, tests on push)
- **Cron (bot):** Vercel Cron (every 5 minutes, polls X)
- **Storage:** Supabase Storage (video files)

## Cost at Phase 1 Launch Volume
| Service | Monthly |
|---|---|
| Vercel Pro | £16 |
| Supabase (free tier) | £0 |
| Anthropic (Claude Sonnet) | ~£15 |
| OpenAI (embeddings) | ~£3 |
| Hive Moderation | ~£20 |
| **Total** | **~£54** |

## Cost at Phase 2 (X bot, Basic API)
Add: X API Basic (£160/month) → ~£214/month total
Add: X API Pro when funded ($5,000/month) → ~£4,200/month total
