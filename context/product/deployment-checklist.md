# Fountem & Unfaked — Deployment Checklist

**Repo:** github.com/fountem/platform
**Build status:** 42/42 tests passing · 153 files committed (as of June 16, 2026)

## Step 1 — Supabase (database) ✅ DONE
All 11 tables created. Extensions enabled. RLS policies active. Seed data loaded.

Tables: evidence_sources, evidence_chunks, claims, verdicts, video_detections, parties, issues, party_issue_positions, track_record_scores, correction_packs, api_keys

## Step 2 — API keys (PENDING)
| Key | Where | Required for |
|---|---|---|
| ANTHROPIC_API_KEY | console.anthropic.com | Fountem RAG verdict engine |
| OPENAI_API_KEY | platform.openai.com | Embeddings |
| HIVE_API_KEY | thehive.ai | Unfaked Layer 1 forensic detection |
| SENSITY_API_KEY | sensity.ai | Optional at launch |
| X_API_KEY + secrets | developer.twitter.com | @unfaked bot (deferred) |

## Step 3 — Vercel (BLOCKED — Flatfile SSO)
**Issue:** GitHub account is gated by Flatfile Inc. SSO. Vercel Hobby cannot access GitHub org repos.
**Recommended path:** Use Netlify instead (free, supports GitHub org repos natively).

Import `github.com/fountem/platform` into Netlify. Set root directories:
- `apps/unfaked` → unfaked.ai
- `apps/fountem` → fountem.ai
- `apps/marketing` → marketing site

## Step 4 — Seed evidence database (PENDING)
```bash
cd fountem-platform
cp .env.example .env.local  # Fill in API keys
npx ts-node scripts/seed-evidence.ts
```

## Step 5 — Run eval harness (PENDING)
```bash
npx ts-node scripts/eval-harness.ts
# Target: ≥8/10 correct verdicts
```

## Step 6 — End-to-end test
- Unfaked: paste Wakefield deepfake URL → verdict card in <15s → AI_GENERATED verdict
- Fountem: enter "Housing starts rose by 12% under Labour since 2024" → FALSE verdict with ONS citation

## Step 7 — Pre-launch
- [ ] unfaked.ai live and loading
- [ ] fountem.ai live and loading
- [ ] ≥3 real detection cases in public archive
- [ ] Methodology page published
- [ ] Outreach: Demos, Full Fact, Electoral Commission, Alan Turing Institute
