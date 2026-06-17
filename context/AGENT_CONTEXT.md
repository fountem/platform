# Fountem / Unfaked — Agent Context Package
**Last updated:** June 17, 2026 · **Author:** Elroy (elroy@flatfile.io)

## Read This First

This is the canonical handoff document for any AI agent resuming work on Fountem / Unfaked. Read this file first. Everything else in this `/context` folder is linked from here.

Fountem is a UK political intelligence platform (`fountem.ai`). Unfaked is its consumer deepfake detection product (`unfaked.ai`). They share one codebase, one database, and one mission: give UK voters access to evidence-backed political intelligence and a free deepfake detection tool for democratic integrity.

---

## Current State of Play (June 2026)

### What exists and works
| Component | Status | Location |
|---|---|---|
| GitHub monorepo | ✅ Live | github.com/fountem/platform |
| Supabase database | ✅ Live | project ref in secret store (not committed) |
| 14 Supabase tables + 11 migrations | ✅ Created | eu-west-2 (London) |
| Full RLS on all tables | ✅ | `supabase/migrations/007,010,011` |
| 103/103 tests passing | ✅ | `npx jest` (19 suites) |
| Type-check 10/10 workspaces | ✅ | `npm run type-check` |
| All 3 web apps build clean | ✅ | `turbo run build` |
| ESLint flat config, 0 warnings | ✅ | `eslint.config.mjs` |
| CI: secret-scan + test + tsc + lint | ✅ | `.github/workflows/ci.yml` |
| Netlify configs (per app) | ✅ Written | `apps/*/netlify.toml` |
| AWS resolver service + Terraform | ✅ Written | `services/resolver/` |
| Shared `@fountem/core` (rate-limit, api-key, ssrf, monitoring, quota/Turnstile) | ✅ | `packages/core/` |
| **Design system `@fountem/ui`** (tokens preset + components) | ✅ | `packages/ui/` |
| **Supabase Auth** (magic link + Google) on both apps | ✅ | `apps/*/src/lib/supabase`, `middleware.ts` |
| **Per-account quotas + global budget circuit-breaker** | ✅ | `011_auth_quotas.sql`, gated `/api/detect`,`/api/verify` |
| Human-review queue (API + admin UI) | ✅ | `apps/unfaked/.../admin/review` |
| Privacy/GDPR + methodology pages | ✅ | both apps |
| All 30+ research docs | ✅ This folder | /context subdirs |

### What still needs doing (deploy-time)
1. **Provision AWS resolver** — `cd services/resolver/infra && terraform apply` (needs `vpc_id`, subnets, `resolver_api_key`). Then build/push the Docker image. See `services/resolver/README.md`. Outputs give `RESOLVER_URL` + `VALKEY_URL`.
2. **Create Netlify sites** — one per app (unfaked, fountem, marketing, bot), base directory = the app folder. `netlify.toml` is already committed in each.
3. **Wire live API keys + secrets** — set every var in `.env.example` in each Netlify site (and `RESOLVER_API_KEY`/`PORT` on the resolver). Generate `ADMIN_TOKEN`, `RESOLVER_API_KEY`, `CRON_SECRET` with `openssl rand -hex 32`.
4. **Rotate the Supabase keys** that were committed on 2026-06-16 (treat as compromised).
5. **Seed data** — `scripts/seed-reference.ts` (parties/issues) then `scripts/seed-evidence.ts` (corpus).
6. **Run eval harness** — `scripts/eval-harness.ts` validates RAG against 10 test claims (target ≥8/10).
7. **Apply migration 011 + enable auth providers** — run `011_auth_quotas.sql`, then in the Supabase dashboard enable Email (magic link) + Google providers and add `<app-url>/auth/callback` as a redirect URL for unfaked + fountem. Optionally create a Cloudflare Turnstile widget and set `TURNSTILE_SECRET_KEY` / `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (left unset = captcha skipped).

---

## Design system & auth (June 17, 2026 redesign)

**Design system — `@fountem/ui`.** One palette, two surfaces:
- **Editorial (light):** warm parchment `#faf8f3` + forest green (`forest-800 #245233` CTA, `forest-900` chrome) + **Lora** serif headlines + **Inter** body. Used for marketing, home, archive, methodology, privacy, party dossiers, claim results.
- **Forensic (dark):** near-black `forest-950` + emerald/amber data accents + **JetBrains Mono** labels. Used for the Unfaked video result view (`VerdictPanel`): radial `ConfidenceGauge`, per-signal `SignalBar`s, layer cards.
- Rule: **red is only the "false / AI-generated" verdict**, never brand chrome.
- Tokens live in `packages/ui/tailwind-preset.ts` (imported by each app's `tailwind.config.ts` via `presets:[...]`; each app's `content` also scans `../../packages/ui/src`). Fonts wired with `next/font` CSS variables (`--font-lora/-inter/-mono`) in each `app/layout.tsx`.
- Components: `Button`/`ButtonLink`, `Input`, `Card`, `StatusChip`, `ConfidenceGauge`, `SignalBar`, `Container`, `Eyebrow`, `Stat`, `ShieldMark` + `verdictTone`/`toneChipClasses` helpers (light+dark).

**App structure.** Each Next app now has a `(site)` route group holding the shared nav+footer chrome; `/login` and `/auth/*` live outside it (full-bleed). Root `app/layout.tsx` only sets `<html>`, fonts, and parchment `<body>`.

**Auth — Supabase Auth (`@supabase/ssr`).** Per app: `src/lib/supabase/{server,client}.ts`, `middleware.ts` (session refresh), `app/auth/callback` (code exchange), `app/auth/signout`, and an editorial `app/login` page (magic link + Google + optional Turnstile). `getUser()` returns null when env is absent so pages still render locally.

**Anti-abuse (credit protection), three layers** — public browsing stays open; running a check requires a signed-in user OR a B2B API key:
1. **Per-account daily quota** — `increment_user_usage` RPC, limits in `DEFAULT_DAILY_LIMITS` (`UNFAKED_FREE_DAILY_LIMIT=5`, `FOUNTEM_FREE_DAILY_LIMIT=10`).
2. **Per-IP rate limit** — existing `@fountem/core` ratelimit as a safety net.
3. **Global daily budget circuit-breaker** — `increment_global_budget` RPC, hard ceiling (`*_GLOBAL_DAILY_CAP`). Quota/budget are consumed only on real (uncached) runs.
Migration `011_auth_quotas.sql` adds `profiles` (+ signup trigger), `user_usage`, `service_budget`, the RPCs, and RLS.

---

## Products

### Unfaked (`unfaked.ai`)
Free public deepfake detection for political video/images. Paste a URL, get a verdict in <60 seconds.

**Architecture:** The web app (`apps/unfaked`) never touches native binaries. A separate
network-isolated **AWS resolver service** (`services/resolver/`) does yt-dlp download,
ffprobe, C2PA extraction and SSRF-safe fetching, returning a normalised `ResolvedMedia`
object (contract: `packages/detection/src/resolver.ts`). The detection package
(`@fountem/detection`) consumes that object — no `c2pa-node`/`yt-dlp` in the serverless tier.

**Detection pipeline (provenance-first ensemble):**
1. **Provenance first** — valid C2PA manifest from a trusted issuer → decisive; AI watermark (SynthID) → decisive the other way. Short-circuits the rest.
2. **Forensic ensemble (when provenance absent)** — Hive + Sensity (two vendors), with **vendor-disagreement** surfaced, not hidden.
3. **Contextual** — GPT-4o-mini over real platform metadata (channel age, upload history).
4. **Temporal / cross-modal** — keyframe-interval regularity + audio↔lip-sync correlation.

Synthesis (`packages/detection/src/synthesiser.ts`) does **presence-aware** weighting
(missing signals renormalise, never silently drag the score), **degradation-aware**
down-weighting of forensics on low-res/compressed media, 0.05-step binning, and emits a
**calibrated confidence band** (`confidence_low`/`confidence_high`) — not a single number.

Verdict: `ai_generated | likely_ai_generated | inconclusive | likely_real | real`. Every
verdict includes the band, probable generator, `what_would_change_this` falsifiability
statement, an explicit not-definitive disclaimer, a per-signal breakdown, and a public case
record in `video_detections`. Uncertain/high-stakes cases auto-escalate to a
**human-review queue** (`shouldEscalateForReview`) surfaced at `/admin/review`
(token-protected via `ADMIN_TOKEN`; API at `/api/admin/review`).

**X bot (@unfaked):** `apps/bot` polls X mentions every 5 minutes via a **Netlify Scheduled
Function** (`apps/bot/netlify/functions/poll.mts`) that calls `/api/cron`. Calls `/api/detect`
with `UNFAKED_API_KEY` so it uses the B2B quota, not the per-IP limit.

### Fountem (`fountem.ai`)
Political intelligence platform. Enter a claim, get an evidence-backed verdict with traceable source chain.

**RAG pipeline:**
- **Atomic claim decomposition** (`packages/rag/src/decompose.ts`) — split bundled claims into independently checkable sub-claims, verify each, aggregate (`aggregateSubVerdicts`).
- Hybrid BM25 + pgvector retrieval (OpenAI `text-embedding-3-small`)
- Claude Sonnet for grounded, sourced verdicts; returns **unverifiable** when no adequate evidence (no guessing)
- Source hierarchy: ONS > IFS > Hansard > NAO > Resolution Foundation > Full Fact (corroboration only)
- Pure eval scoring (`packages/rag/src/eval.ts`: `classifyResult`, `computeScore`) drives `scripts/eval-harness.ts`

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
- **Structure:** Turborepo monorepo (workspaces: `apps/*`, `packages/*`; `services/*` is deployed separately)
  - `apps/unfaked` — Next.js 15 deepfake detection app (+ `/admin/review`, `/methodology`, `/privacy`, `/cases`)
  - `apps/fountem` — Next.js 15 political intelligence platform (+ `/methodology`, `/privacy`, `/pack/[slug]`)
  - `apps/marketing` — Landing page
  - `apps/bot` — X bot (Netlify Scheduled Function → `/api/cron`)
  - `packages/db` — Supabase client + types (typed `Database`, RPCs)
  - `packages/rag` — RAG pipeline (chunker, retriever, decompose, verdict engine, eval)
  - `packages/detection` — provenance-first ensemble + resolver client + temporal + synthesiser
  - `packages/verdict` — Shared verdict card schema + serialisers (with disclaimer/confidence band)
  - `packages/core` — shared utils: `ratelimit` (Valkey/in-memory), `apikey`, `url-guard` (SSRF), `monitoring`
  - `packages/ui` — Design system (Tailwind + brand tokens)
  - `services/resolver` — **standalone** AWS service (Express + yt-dlp/ffprobe/c2patool); own `package.json`, `Dockerfile`, Terraform in `infra/`. NOT an npm workspace — install/build it from inside its own dir.

### Supabase
- **Project URL:** in secret store as `NEXT_PUBLIC_SUPABASE_URL` (never commit)
- **Region:** eu-west-2 (London)
- **Publishable / anon key:** in secret store as `NEXT_PUBLIC_SUPABASE_ANON_KEY` (never commit)
- **Service role key:** in secret store as `SUPABASE_SERVICE_ROLE_KEY` (never commit)

> ⚠️ The original keys committed to this repo on 2026-06-16 must be treated as compromised
> and **rotated** in the Supabase dashboard. See `context/IMPLEMENTATION_PLAN.md` Phase 0.

**11 tables live:**
`evidence_sources`, `evidence_chunks`, `claims`, `verdicts`, `video_detections`, `parties`, `issues`, `party_issue_positions`, `track_record_scores`, `correction_packs`, `api_keys`

**Extensions:** `vector` (pgvector), `pg_trgm`, `uuid-ossp`

**Migrations (`supabase/migrations/`, apply in order — see `applied.md`):**
`001_extensions` → `002_evidence` → `003_claims_verdicts` → `004_video_detections` →
`005_parties_issues` → `006_correction_packs_api` → `007_rls` →
`008_detection_enhancements` (confidence band, vendor_disagreement, signal_breakdown, review_status/reviewed_by/at/notes) →
`009_api_key_usage` (atomic `increment_api_key_usage` RPC for monthly quota) →
`010_rls_complete` (RLS on reference tables; public read, service-role write).

> ⚠️ Any new migration created locally must be applied to the live DB and logged in `applied.md`.

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
5. **Netlify, not Vercel** — Flatfile SSO gated the GitHub org. Each app is a Netlify site (base dir = app folder); `netlify.toml` committed per app. Bot cron = Netlify Scheduled Function.
6. **AWS for the resolver** — heavy/native/untrusted media work (yt-dlp, ffprobe, c2patool) runs in ECS Fargate behind an internal ALB in private subnets, never in serverless. Terraform in `services/resolver/infra/`.
7. **Valkey (ElastiCache) for rate limiting** — provisioned by the resolver Terraform; `@fountem/core` rate-limiter uses it via `VALKEY_URL`, falling back to in-memory.
8. **Sensity + Hive both at launch** — two-vendor ensemble; we surface vendor disagreement rather than hiding it.
9. **Launch Unfaked + Fountem together.**
10. **No 100%-accuracy claims** — calibrated confidence bands + human-in-the-loop; methodology pages describe only what is actually implemented.

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

The canonical, commented list is in `.env.example` at the repo root. Summary:

```bash
# Supabase (from secret store — never commit real values)
NEXT_PUBLIC_SUPABASE_URL=  NEXT_PUBLIC_SUPABASE_ANON_KEY=  SUPABASE_SERVICE_ROLE_KEY=
# LLM
ANTHROPIC_API_KEY=  OPENAI_API_KEY=
# Detection vendors (both at launch)
HIVE_API_KEY=  SENSITY_API_KEY=
# AWS resolver (from `terraform output`)
RESOLVER_URL=  RESOLVER_API_KEY=
# Rate limiting (falls back to in-memory if unset)
VALKEY_URL=
# Admin human-review queue
ADMIN_TOKEN=
# Observability (optional; logs to stdout if unset)
SENTRY_DSN=
# X bot
X_API_KEY= X_API_SECRET= X_ACCESS_TOKEN= X_ACCESS_TOKEN_SECRET= X_BEARER_TOKEN=
X_BOT_USER_ID=  UNFAKED_API_URL=  UNFAKED_API_KEY=  BOT_SELF_URL=  CRON_SECRET=
# App
NEXT_PUBLIC_APP_URL=   # set per app (unfaked.ai / fountem.ai)
```

The resolver service has its own `services/resolver/.env.example` (`PORT`, `RESOLVER_API_KEY`).

---

## What To Do Next (Priority Order)

All application code, tests (91/91), type-checks (10/10) and lint are green locally. Remaining
work is provisioning/deploy, not coding:

1. **Provision the resolver on AWS** — `cd services/resolver/infra && terraform init && terraform apply` with your `vpc_id`, `private_subnet_ids`, `alb_subnet_ids`, `resolver_api_key`. Then build & push the Docker image (steps in `services/resolver/README.md`). Capture `resolver_url` and `valkey_url` outputs.
2. **Create the 4 Netlify sites** — base dir per app; set all env vars from `.env.example` (including `RESOLVER_URL`, `VALKEY_URL`, `ADMIN_TOKEN`). The bot needs `BOT_SELF_URL` + `CRON_SECRET` for the scheduled function.
3. **Rotate the leaked Supabase keys** and set the fresh ones.
4. **Get/Set API keys** — Anthropic, OpenAI, Hive, Sensity.
5. **Seed** — `scripts/seed-reference.ts` then `scripts/seed-evidence.ts`.
6. **Run `scripts/eval-harness.ts`** — target ≥8/10 correct verdicts.
7. **End-to-end test** — Wakefield deepfake case (`/cases`).
8. **Outreach** — Full Fact, Demos, Electoral Commission, Alan Turing Institute.

## Build / verify commands

```bash
npm install                 # root workspaces
npm run type-check          # turbo tsc across 10 workspaces
npx jest                    # 91 tests, 18 suites
npx eslint .                # 0 warnings
# resolver (separate, from its own dir):
cd services/resolver && npm install && npx tsc -p tsconfig.json --noEmit && node --import tsx --test 'src/*.test.ts'
```

---

---

## Session changelog — June 17, 2026 (production-hardening pass)

Everything below was implemented, type-checked, tested and linted this session:

- **Security (Phase 0/2):** scrubbed committed secrets from repo/docs; Gitleaks in CI; expanded `.gitignore`. SSRF guard (`@fountem/core/url-guard` client-side + `services/resolver/src/ssrf.ts` server-side, blocks private/reserved/metadata IPs). API-key auth with atomic monthly quota (`009_api_key_usage`). Full RLS (`007` + `010`).
- **Foundation (Phase 1/1b):** per-package + per-app `tsconfig.json`; real CI (secret-scan, jest, tsc, eslint); strict typing; typed Supabase `Database` (interfaces→type aliases, added `Views`/`CompositeTypes`/`Relationships`, RPC sigs). Flat-config ESLint (`eslint.config.mjs`), 0 warnings. Dependency-free `captureException` monitoring (optional Sentry).
- **Detection (Phase 3):** resolver client contract; provenance-first synthesiser with presence-aware + degradation-aware weighting, vendor disagreement, 0.05 binning, calibrated confidence bands; temporal + cross-modal signals; `shouldEscalateForReview`. New migration `008`.
- **Resolver service (Phase 3b):** `services/resolver/` — Express app (`/health`, `/resolve`), yt-dlp/ffprobe/c2patool orchestration, hardened exec (arg arrays, timeouts, output caps, non-root), Dockerfile, full Terraform (ECR, ECS Fargate, internal ALB, SGs, Secrets Manager, **ElastiCache Valkey**), README, tests.
- **RAG (Phase 4):** atomic claim decomposition + aggregation; pure eval scoring; rewritten `seed-evidence.ts`, `seed-reference.ts`, `eval-harness.ts`; fixed party pages + issue slug alignment.
- **Differentiators UI (Phase 5):** human-review queue API + `/admin/review` page; calibrated bands + provenance + disclaimers in Unfaked detect/correction-pack UI and Fountem claim/pack UI; rewritten Unfaked **and** Fountem methodology pages (truth-in-advertising).
- **Legal (Phase 6):** `/privacy` GDPR pages for both apps; not-definitive disclaimers throughout.
- **Deploy (Phase 7):** switched Vercel→Netlify (`apps/*/netlify.toml`, removed `vercel.json`); bot cron as Netlify Scheduled Function (`apps/bot/netlify/functions/poll.mts`); expanded root `.env.example`; this context update.

**Status:** code-complete and green. Outstanding items are infra provisioning + secrets + seeding (see "What To Do Next").

---

*Founder: Elroy · elroy@flatfile.io · SRE at Flatfile*
*This context package was generated June 16, 2026 from the Obvious project workspace (prj_KcdwPpDg); updated June 17, 2026.*
