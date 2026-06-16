# Fountem / Unfaked — Agent Context Package
**Last updated:** June 16, 2026 · **Author:** Elroy (elroy@flatfile.io)

## Read This First

This is the canonical handoff document for any AI agent resuming work on Fountem / Unfaked. Read this file first. Everything else in this `/context` folder is linked from here.

Fountem is a UK political intelligence platform (`fountem.ai`). Unfaked is its consumer deepfake detection product (`unfaked.ai`). They share one codebase, one database, and one mission: give UK voters access to evidence-backed political intelligence and a free deepfake detection tool for democratic integrity.

---

## Current State of Play (June 2026)

### What exists and works
| Component | Status | Location |
|---|---|---|
| GitHub monorepo | ✅ Live | github.com/fountem/platform |
| Supabase database | ✅ Live | pubjwxyslvcsmdiiaisd.supabase.co |
| 11 Supabase tables | ✅ Created | eu-west-2 (London), free tier |
| 42/42 tests passing | ✅ | packages/* |
| Vercel configs | ✅ Written | apps/*/vercel.json |
| All 30+ research docs | ✅ This folder | /context subdirs |

### What still needs doing
1. **Deploy to Vercel** — Three separate projects (unfaked, fountem, marketing). Blocked on GitHub org/SSO issue (Flatfile SSO gates GitHub account). Consider Netlify as alternative.
2. **Wire live API keys** — `ANTHROPIC_API_KEY`, `HIVE_API_KEY` not yet set in production.
3. **Seed evidence database** — Run `scripts/seed-evidence.ts` after API keys are in Vercel.
4. **Run eval harness** — `scripts/eval-harness.ts` validates RAG pipeline against 10 test claims.
5. **X bot** — Deferred. Requires X API Basic (£160/month). Do after first B2B revenue.

---

## Products

### Unfaked (`unfaked.ai`)
Free public deepfake detection for political video/images. Paste a URL, get a verdict in <15 seconds.

**Detection pipeline (3 layers):**
1. **Forensic** — Hive Moderation API + FFprobe metadata extraction → AI score, generator fingerprint
2. **Provenance** — C2PA manifest check via c2pa-node + SynthID (Veo-specific, deferred)
3. **Contextual** — GPT-4o contextual reasoning over channel patterns, audio, physics

Weighted synthesis → verdict: `ai_generated | likely_ai_generated | inconclusive | likely_real | real`

Every verdict includes:
- Confidence percentage
- Probable generator (Veo / Kling / Runway / Sora / Luma / Pika / unknown)
- `what_would_change_this` — the falsifiability statement (key differentiator)
- Evasion detection (re-encoding, grain overlay, speed manipulation)
- Public case record logged to `video_detections` table

**X bot (@unfaked):** Polls X for `@unfaked` mentions every 5 minutes via Vercel Cron. Reply with verdict card. Currently deferred — code exists in `apps/bot/`.

### Fountem (`fountem.ai`)
Political intelligence platform. Enter a claim, get an evidence-backed verdict with traceable source chain.

**RAG pipeline:**
- Hybrid BM25 + pgvector retrieval (OpenAI `text-embedding-3-small`)
- Claude Sonnet Citations API for verdict generation
- Source hierarchy: ONS > IFS > Hansard > NAO > Resolution Foundation > Full Fact (corroboration only)
- Agent layer (LangGraph) for multi-part claim decomposition — Phase 2

**Five issues × five parties:**
- Issues: housing, social care, local economy, transport, local tax
- Parties: Labour, Conservative, Liberal Democrats, Green, Reform UK
- Each has alignment score (0-100), credibility score, track record score

**Three competitive differentiators:**
1. Evidence Chain — every verdict links to primary source documents
2. Public Deepfake Archive — `/cases` page, timestamped, searchable
3. Falsifiability Statement — `what_would_change_this` on every verdict

---

## Infrastructure

### GitHub
- **Org:** fountem
- **Repo:** github.com/fountem/platform
- **Branch:** main
- **Structure:** Turborepo monorepo
  - `apps/unfaked` — Next.js 15 deepfake detection app
  - `apps/fountem` — Next.js 15 political intelligence platform
  - `apps/marketing` — Landing page
  - `apps/bot` — X bot (Vercel Cron)
  - `packages/db` — Supabase client + types
  - `packages/rag` — RAG pipeline (chunker, retriever, Claude verdict engine)
  - `packages/detection` — 3-layer video detection
  - `packages/verdict` — Shared verdict card schema
  - `packages/ui` — Design system (Tailwind + brand tokens)

### Supabase
- **Project URL:** https://pubjwxyslvcsmdiiaisd.supabase.co
- **Region:** eu-west-2 (London)
- **Publishable key:** `sb_publishable_Uhthqa2expJHSIcWleh4gA_OMW1bAnP`
- **Service role key:** In Elroy's 1Password / env vars (never commit)

**11 tables live:**
`evidence_sources`, `evidence_chunks`, `claims`, `verdicts`, `video_detections`, `parties`, `issues`, `party_issue_positions`, `track_record_scores`, `correction_packs`, `api_keys`

**Extensions:** `vector` (pgvector), `pg_trgm`, `uuid-ossp`

### Seed data (in Supabase)
- 5 parties: Labour, Conservative, Liberal Democrats, Green, Reform UK
- 5 issues: housing, social care, local economy, transport, local tax
- 5 interest map entries (user-facing labels)
- 2 claims (ref-imm-001, ref-imm-002) with evidence and verdicts
- 5 commitments (one per party)
- 5 track record score records (all inconclusive — needs population)

---

## LLM Decisions

| Task | Model | Reason |
|---|---|---|
| RAG verdict engine | Claude Sonnet (Anthropic) | ~3% hallucination rate vs ~6% for GPT. Citations API purpose-built for document-grounded reasoning. 90% prompt caching discount. |
| Embeddings | OpenAI text-embedding-3-small | Claude has no embedding model. OpenAI at £0.02/1M tokens. |
| Layer 3 contextual (video) | GPT-4o | Fast, cheap, good at contextual reasoning tasks |
| Claim decomposition | Claude Haiku | Fast, cheap for decomposition sub-step |

---

## Business Model

| Phase | Revenue source | Target |
|---|---|---|
| Now–Q3 2026 | Grant funding (JRRT most likely at 30-40% probability) | £0–£75k |
| Q4 2026 | First B2B API customers (newsrooms) | £10k–£30k |
| 2027 | B2B ARR growing | £100k–£200k ARR |
| 2028 | Break-even | £200k–£400k ARR |

**Four grant applications written:**
- Innovate UK Frontier AI Phase 1 (£105-175k, 10-15% chance)
- Nuffield Foundation (£180k, 5-10% chance, needs academic partner)
- JRRT UK Democracy Fund (£75k, 30-40% chance — priority)
- Luminate (£250k, 5% now / 25% after launch demo)

---

## Brand

- **Fountem:** political intelligence platform. Forest green (#245233), parchment (#faf8f3), Lora + Inter.
- **Unfaked:** deepfake detection bot. Same brand, darker/more urgent tone (forest-950).
- **Attribution line:** "Unfaked · powered by Fountem"
- **Domains owned:** unfaked.ai (until 2028), fountem.com, fountem.co.uk, fountem.ai

---

## Key Decisions Made (Do Not Revisit)

1. **Supabase over Neon** — Supabase at $25/mo includes Auth + Storage + Realtime. Neon at equivalent compute ~$73/mo before auth provider.
2. **Claude Sonnet as primary LLM** — Better hallucination rate, Citations API, prompt caching economics.
3. **Turborepo monorepo** — All apps share packages. Single CI pipeline.
4. **RAG before fine-tuning** — Fine-tuning needs 10k+ labelled examples and £5k-50k+ GPU compute. Phase 1 RAG is correct.
5. **SynthID deferred** — Still Vertex AI preview. Hive + Sensity sufficient for launch.
6. **X bot at Basic API** — £160/month polling every 60s. Start there. Upgrade to Pro ($5k/month) when funded.

---

## Context Folder Index

```
context/
├── AGENT_CONTEXT.md             ← You are here
├── research/
│   ├── competitor-analysis.md
│   ├── idea-evaluation-fake-news.md
│   └── idea-evaluation-voter-platform.md
├── strategy/
│   ├── strategy-and-roadmap.md
│   ├── brand-analysis.md
│   ├── brand-decision.md
│   ├── cost-model-and-revenue.md
│   ├── funding-probability-assessment.md
│   ├── feature-edge-opportunities.md
│   ├── feature-prioritization-matrix.md
│   ├── 12-week-product-roadmap.md
│   ├── single-founder-execution-board.md
│   ├── product-strategy-memo-moat.md
│   ├── pre-election-marketing-rollout.md
│   └── may-2026-rollout-plan.md
├── funding/
│   ├── grant-innovate-uk.md
│   ├── grant-nuffield-foundation.md
│   ├── grant-jrrt.md
│   └── luminate-pitch.md
├── product/
│   ├── product-spec.md
│   ├── design-system-v1.md
│   ├── feature-mocks-annotated.md
│   ├── wireframes-voter-platform.md
│   ├── wireframes-fake-news-tool.md
│   ├── scoring-rubrics.md
│   ├── live-case-study-wakefield.md
│   ├── week1-2-handoff.md
│   └── deployment-checklist.md
├── technical/
│   ├── master-architecture-spec.md
│   ├── tech-architecture-implementation-guide.md
│   ├── tech-stack-blueprint.md
│   ├── ai-video-detection-spec.md
│   └── ai-video-detection-agent-prompt.md
└── data/
    ├── schema-overview.md
    ├── parties.csv
    ├── issues.csv
    ├── interest-map.csv
    ├── claims.csv
    ├── evidence.csv
    ├── verdicts.csv
    └── commitments.csv
```

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://pubjwxyslvcsmdiiaisd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_Uhthqa2expJHSIcWleh4gA_OMW1bAnP
SUPABASE_SERVICE_ROLE_KEY=<in 1Password>

# LLM
ANTHROPIC_API_KEY=<get from console.anthropic.com>
OPENAI_API_KEY=<get from platform.openai.com>

# Detection
HIVE_API_KEY=<get from thehive.ai>
SENSITY_API_KEY=<optional at launch>

# X Bot (defer)
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=
X_BEARER_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://unfaked.ai   # or fountem.ai per app
CRON_SECRET=<random string>
```

---

## What To Do Next (Priority Order)

1. **Resolve Vercel deployment** — Netlify is the easiest path given Flatfile SSO blocking GitHub org access. All apps are Next.js 15, Netlify supports this natively. Root directories: `apps/unfaked`, `apps/fountem`, `apps/marketing`.
2. **Get API keys** — Anthropic key (claude.ai → API), Hive key (thehive.ai → API), OpenAI key (already may exist).
3. **Set env vars in hosting platform** — Reference `.env.example` in repo root.
4. **Run `scripts/seed-evidence.ts`** — Seeds ONS/IFS/Hansard/Full Fact passages into `evidence_chunks`.
5. **Run `scripts/eval-harness.ts`** — Validate RAG pipeline. Target ≥8/10 correct verdicts.
6. **End-to-end test** — Wakefield deepfake case is the canonical test. URL is in `/cases` archive.
7. **Outreach** — Full Fact, Demos, Electoral Commission, Alan Turing Institute. Use product-spec.md for pitch framing.

---

*Founder: Elroy · elroy@flatfile.io · SRE at Flatfile*
*This context package was generated June 16, 2026 from the Obvious project workspace (prj_KcdwPpDg)*
