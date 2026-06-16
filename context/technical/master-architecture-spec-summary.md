# Fountem & Unfaked — Master Architecture Spec (Summary)
**Version 1.0 — June 16, 2026**

Full spec: art_1gtSoqEW in Obvious workspace prj_KcdwPpDg

## The 30-Second Brief
Fountem and Unfaked are two products sharing one codebase, one database, and one detection engine. The entire stack is a Turborepo monorepo. Two Next.js 15 apps. Five shared packages. One Supabase instance. Deployed on Vercel.

## Monorepo Structure
```
fountem/platform/
├── apps/
│   ├── unfaked/          # unfaked.ai — deepfake detection
│   ├── fountem/          # fountem.ai — political intelligence
│   ├── marketing/        # landing page
│   └── bot/              # X bot — Vercel Cron
├── packages/
│   ├── ui/               # Shared design system (Tailwind + shadcn/ui + brand tokens)
│   ├── db/               # Supabase client, schema types
│   ├── rag/              # RAG pipeline — ingestion, chunking, retrieval, Claude verdict
│   ├── detection/        # Deepfake detection — Hive, Sensity, C2PA, GPT-4o
│   └── verdict/          # Shared verdict card schema, serialiser
├── supabase/migrations/  # 7 numbered SQL files
└── scripts/
    ├── seed-evidence.ts
    └── eval-harness.ts
```

## Supabase Schema (11 tables)
- `evidence_sources` — ONS/IFS/Hansard/Full Fact documents
- `evidence_chunks` — 150-300 token semantic units with pgvector embeddings
- `claims` — political statements to verify
- `verdicts` — RAG pipeline output with citations
- `video_detections` — Unfaked pipeline output
- `parties` — 5 parties (lab, con, ld, grn, ref)
- `issues` — 5 issues (housing, social_care, local_economy, transport, local_tax)
- `party_issue_positions` — 5×5 matrix
- `track_record_scores` — computed from commitments
- `correction_packs` — shareable verdict artefacts
- `api_keys` — B2B licensing

## RAG Pipeline
1. Hybrid retrieval: BM25 (pg_trgm) + pgvector semantic search → RRF merge
2. Claude Sonnet Citations API for verdict generation
3. Source hierarchy: ONS > IFS > Hansard > NAO > Resolution Foundation > Full Fact (corroboration only)
4. Chunk size: 150-300 tokens, one-sentence overlap

## Detection Pipeline (3 Layers)
1. **Forensic (50% weight):** Hive Moderation API + FFprobe metadata
2. **Provenance (20% weight):** C2PA manifest via c2pa-node + SynthID (deferred)
3. **Contextual (30% weight):** GPT-4o reasoning over channel patterns, audio, physics

## Three Competitive Differentiators
1. **Evidence Chain** — every verdict traces to primary source documents
2. **Public Deepfake Archive** — `/cases` — first UK public political deepfake archive
3. **Falsifiability Statement** — `what_would_change_this` on every verdict

## API Surface
- `POST /api/verify` — verify political claim, returns verdict with evidence trail
- `POST /api/detect` — detect AI-generated video, returns detection verdict
- `GET /api/cases` — paginated public deepfake archive

## Rate Limits
| Tier | /api/verify | /api/detect | Price |
|---|---|---|---|
| Free | 10/month | 5/month | £0 |
| Newsroom Pro | 500/month | 200/month | £299/month |
| Enterprise | Unlimited | Unlimited | Custom |

## Build Sequence (completed)
- Week 1: Repo scaffolded, Supabase migrations run ✅
- Week 2: RAG pipeline returns verdicts, detection pipeline handles Wakefield case ✅
- Week 3-5: Apps built, tests passing (42/42) ✅
- Remaining: Deploy to hosting, wire API keys, seed evidence, run evals
