# Fountem / Unfaked — Production Implementation Plan

**Owner:** Elroy · **Author:** engineering agent · **Created:** June 16, 2026
**Status:** Active · This is the canonical execution plan. Work top-to-bottom by phase.

---

## 0. Guiding decisions (read first)

These decisions shape everything below. They are derived from the June 2026 evaluation
(market research + full code audit). Change them deliberately, not by accident.

1. **Launch scope = both Unfaked + Fountem together.** (Decision: Elroy, 16 Jun 2026.)
   Unfaked is consumer reach/brand; Fountem Evidence Chain is the B2B revenue engine.
2. **Business model = B2B (newsrooms/civic) + grants.** Consumer is distribution/brand, not
   revenue. Do not build consumer billing for launch. (Market evidence: Logically pre-pack
   administration 2026; Full Fact lost £1M Google funding; platforms retreating from paid
   fact-checking.)
3. **Verdicts are never binary certainties.** Real-world detector accuracy on compressed
   social media is 54–77% with 10–25% false positives. Every verdict ships calibrated
   confidence + `what_would_change_this` + a "not definitive proof" disclaimer. This is a
   product principle AND a legal shield.
4. **Provenance-first is the moat.** C2PA Content Credentials + watermark checks are a
   first-class signal (primary filter), not a side tab. Detection is the fallback when
   provenance is absent. Either make C2PA work or remove the claim — no marketing ahead of
   implementation.
5. **No public endpoint without auth + rate limiting + SSRF protection.** Non-negotiable.
6. **Truth-in-advertising:** the `/methodology` page must describe only what the code does.
7. **Accuracy is the wedge.** We win on *transparent, calibrated, multi-signal, human-in-the-
   loop* verification — not on a black-box "98% accurate" claim. See Appendix A.

### Locked infrastructure decisions (Elroy, 16 Jun 2026)
| Concern | Decision |
|---|---|
| Hosting (web apps) | **Netlify** (3 sites: unfaked, fountem, marketing) — drop Vercel/SSO blocker |
| Video resolver service | **AWS** (containerised yt-dlp worker — see 3.1 / Appendix B) |
| Resolver engine | **yt-dlp** (industry standard 2026) + managed proxy fallback for blocked platforms |
| Rate-limit / cache store | **AWS ElastiCache for Valkey** |
| Forensic detection | Hive **+ Sensity at launch** (both) |
| Launch | Unfaked **and** Fountem together |

> Note: Netlify runs the Next.js apps. The **resolver and any heavy/native work (yt-dlp,
> ffmpeg, c2pa-node, Sensity polling) live in the AWS service**, not in Netlify functions,
> which keeps serverless cold-starts and native-build issues out of the web tier.

### Definition of "production ready / go live"
- [ ] No unauthenticated, uncapped, cost-incurring endpoints
- [ ] No secrets in git; keys rotated
- [ ] SSRF-safe server-side fetching
- [ ] Detection works end-to-end on at least YouTube + X + direct MP4 for the canonical
      Wakefield test case
- [ ] RAG returns evidence-backed verdicts on a seeded corpus; eval harness ≥ 8/10
- [ ] CI fails on type errors and lint errors; integration tests cover both API routes
- [ ] Error tracking (Sentry) + product analytics live
- [ ] Methodology page accurate; legal disclaimer on every verdict
- [ ] Deployed to hosting (Vercel or Netlify) with all env vars set

---

## Phase 0 — Security & secrets (BLOCKER, do first)

**Goal:** stop the bleeding. Nothing else ships until this is done.

| # | Task | Files / actions | Acceptance |
|---|------|-----------------|------------|
| 0.1 | Rotate all leaked credentials | Supabase service+anon keys, regen project keys; any keys ever committed | Old keys invalid; new keys only in env/secret store |
| 0.2 | Scrub secrets from repo & docs | `context/AGENT_CONTEXT.md`, `supabase/migrations/applied.md` — remove project ref + keys; replace with placeholders | `git grep` finds no live keys/refs; rewrite history if already pushed |
| 0.3 | Add secret scanning | `.github/workflows/ci.yml` — add `gitleaks` step | CI fails on committed secret |
| 0.4 | Confirm `.gitignore` covers `.env*` | repo root `.gitignore` | No env files tracked |

---

## Phase 1 — Foundation hardening

**Goal:** make the repo trustworthy to build on. CI must catch what humans miss.

| # | Task | Files / actions | Acceptance |
|---|------|-----------------|------------|
| 1.1 | Add `tsconfig.json` to `apps/fountem` and `apps/unfaked` | extend root config, Next.js paths | `tsc --noEmit` runs per app |
| 1.2 | Add `postcss.config.js` / verify Tailwind build per app | apps/* | `next build` produces styled output |
| 1.3 | Real CI: remove `|| true`, run `tsc --noEmit` across all packages+apps and **fail** on error | `.github/workflows/ci.yml` | Type error breaks the build |
| 1.4 | Add ESLint (next/core-web-vitals + ts) and wire `turbo run lint` | root + per-app `.eslintrc`, `turbo.json` | `npm run lint` enforces, CI fails on lint error |
| 1.5 | Tighten TS: drop `strict:false` in Jest transform; remove `any` in DB/API layers | `package.json` jest block, `getApiTierLimit`, retriever `dbClient` | Tests run under strict; typed Supabase client |
| 1.6 | Complete typed `Database` interface (currently `Functions: {}` empty) | `packages/db/src` | RPC + tables typed end-to-end |
| 1.7 | Add error tracking | `@sentry/nextjs` in both apps + bot | Errors visible in Sentry from a forced test throw |
| 1.8 | Add product analytics | PostHog (privacy-friendly) on unfaked + fountem | Pageview + "verdict viewed" events firing |

---

## Phase 2 — Abuse prevention & access control

**Goal:** every endpoint is safe to expose. This gates public launch.

| # | Task | Files / actions | Acceptance |
|---|------|-----------------|------------|
| 2.1 | SSRF guard for server fetches | new `packages/detection` or app util: URL allowlist (http/https only), block private/loopback/link-local IPs + cloud metadata (169.254.169.254), DNS-resolve check, max content-length, timeout | Requests to internal IPs rejected; >N MB rejected |
| 2.2 | Rate limiting | **AWS ElastiCache for Valkey** + middleware: IP limit for public, key limit for API; sliding-window counters | Burst over limit returns 429 with headers |
| 2.3 | Wire API-key quota enforcement | `apps/fountem/.../verify/route.ts` `getApiTierLimit` — increment `requests_this_month`, enforce `monthly_limit`, reset monthly | Over-quota key returns 429; counter increments atomically |
| 2.4 | Decide public-vs-key policy & document | both routes | Consistent: public tier (low limit) + API tiers; documented |
| 2.5 | Fix cache-miss-without-pack re-insert bug | `detect/route.ts:44-50` — handle existing detection w/o pack (create pack instead of re-running) | No unique-constraint crash on repeat URL |
| 2.6 | Complete RLS | `supabase/migrations/008_rls_complete.sql` — enable + policies for `parties`, `issues`, `party_issue_positions`, `track_record_scores`, `api_keys` (no public read) | All tables RLS-enabled; api_keys not publicly readable |

---

## Phase 3 — Detection pipeline completion (Unfaked)

**Goal:** the core product actually works on real social URLs end-to-end.

| # | Task | Files / actions | Acceptance |
|---|------|-----------------|------------|
| 3.1 | Social video resolver | **AWS containerised yt-dlp worker** (ECS Fargate or EC2) behind authenticated internal API + proxy fallback (Apify/Browserless) for blocked platforms; unfaked calls it to get bytes. See Appendix B | YouTube + X + TikTok URL returns real video buffer |
| 3.2 | Make C2PA real (or remove claim) | add `c2pa-node` to `packages/detection/package.json`; verify `layer2-provenance.ts` works; handle native build on Vercel (or move to resolver service) | Signed C2PA test asset returns `valid:true` w/ chain |
| 3.3 | Real generator fingerprinting | replace heuristic in `layer1-forensic.ts` with Hive's model attribution output | Generator reflects Hive response, not score thresholds |
| 3.4 | FFprobe metadata extraction | wire FFprobe in resolver service; feed Layer 1/2 | Real container/codec/creation metadata in signals |
| 3.5 | Layer 3 real URL metadata | `layer3-contextual.ts` `extractUrlMetadata` stub → fetch channel/title/age via platform APIs | GPT-4o receives real context, not just URL string |
| 3.6 | Calibrated confidence + disclaimer | `synthesiser.ts` + UI verdict card | Confidence **band** + "not definitive proof" on every verdict (Appendix A3) |
| 3.7 | Detection integration tests | `packages/detection/__tests__` + route test w/ mocked Hive/GPT | Happy path + failure modes covered |
| 3.8 | Provenance-first decision tree | `pipeline.ts` — short-circuit on valid C2PA/watermark; reverse-image lookup; detection as fallback | Provenance verdict precedes forensic when present (Appendix A1) |
| 3.9 | Multi-signal ensemble fusion | `synthesiser.ts` — degradation-aware weighting + discretised (0.1) binning; surface vendor disagreement | Low-res inputs down-weight noisy signals; Hive/Sensity disagreement shown (Appendix A2) |
| 3.10 | Temporal + cross-modal signals | new detection modules — frame coherence + audio/lip-sync correlation | Lip-sync/voice fakes flagged; evasion (splice/speed/grain) detected (Appendix A2) |
| 3.11 | Per-signal explainability in card | verdict UI | Card shows each layer's finding + weight (Appendix A3) |

---

## Phase 4 — RAG / Evidence pipeline completion (Fountem)

**Goal:** evidence-backed verdicts work on a real seeded corpus.

| # | Task | Files / actions | Acceptance |
|---|------|-----------------|------------|
| 4.1 | Fix seed script | `scripts/seed-evidence.ts` — pass `dbClient`, fix field names (`chunksIngested`, `published_at`) | Script runs; evidence_chunks populated |
| 4.2 | Expand evidence corpus | add ONS/IFS/Hansard/NAO/Resolution Foundation passages (target ≥ 50 across the 5 issues) | Corpus covers launch issues |
| 4.3 | Fix eval harness | `scripts/eval-harness.ts` — correct `hybridRetrieve`/`generateVerdict` signatures; expand to ≥ 10 cases | Harness runs; reports accuracy |
| 4.4 | Hit eval bar | tune retrieval/prompt | ≥ 8/10 correct verdicts on eval set |
| 4.5 | Fix party pages | `apps/fountem/.../parties/[slug]/page.tsx` — match schema (`title`, `party_id` FK, `score`, `score_reasoning`) | Party pages render real DB data |
| 4.6 | Populate track records | seed `track_record_scores` with real scored data (not all inconclusive) | Each party/issue has a real score + reasoning |
| 4.7 | RAG integration test against Supabase | new test | Retrieval + verdict tested against seeded DB |

---

## Phase 5 — Differentiators (what sets us apart)

**Goal:** ship the trust + distribution features competitors lack. Prioritised by moat × effort.

| # | Feature | Why it wins | Scope for launch |
|---|---------|-------------|------------------|
| 5.1 | **Public Deepfake Case Archive** | No consumer competitor has it; SEO + dataset moat | Polish `/cases`: pagination, search, permanent shareable records, OG cards |
| 5.2 | **Correction Packs** (share objects) | Best distribution lever; cheap | X reply card, WhatsApp card, screenshot/PNG card via `@vercel/og` |
| 5.3 | **Provenance-first verdict UI** | Durable moat; ages well w/ EU AI Act Art.50 (Aug 2026) | Surface C2PA/watermark as primary signal in card |
| 5.4 | **Calibrated + falsifiable verdicts** | Trust edge vs black-box 98%-accuracy claims | `what_would_change_this` centerpiece + public versioned methodology/accuracy page |
| 5.5 | **Evidence Chain (Fountem)** | B2B newsroom selling point + defamation defence | Navigable claim→verdict→primary-source chain UI |
| 5.6 | **`@unfaked` social bot** | New consumer behaviour (<30s structured reply) | Finish bot: set `BOT_USER_ID`, `UNFAKED_API_URL`, persist `since_id`, dedup. **Defer go-live until after first B2B revenue** (X API cost). Code-complete only. |

| 5.7 | **Human-in-the-loop review queue** | Accuracy + trust moat; builds proprietary labelled dataset | Auto-escalate low-confidence/high-virality/named-politician cases; reviewer edits reasoning trace (shared scratchpad) before publishing as `human-reviewed`; log overrides (Appendix A4) |
| 5.8 | **Atomic claim decomposition (Fountem)** | More accurate compound-claim verdicts | Split into sub-claims, verify each, aggregate logically; prune to necessary-and-sufficient rationales (Appendix A5) |
| 5.9 | **Published methodology + accuracy page** | Transparency competitors can't match | Versioned page with precision/recall/FPR; updated each release (Appendix A6) |

**Explicitly NOT building for launch:** full viral prediction (data/cost), identity/geolocation intelligence (GDPR), consumer billing.

---

## Phase 6 — Legal, compliance, content

| # | Task | Acceptance |
|---|------|------------|
| 6.1 | Defamation/liability review of verdict wording | Legal sign-off or documented risk acceptance |
| 6.2 | "Not definitive proof" disclaimer on every verdict + methodology page | Present in UI + API responses |
| 6.3 | Privacy policy + GDPR basis (esp. any URL/IP logging) | Published; data retention defined |
| 6.4 | EU AI Act Art. 50 awareness note (disclosure rules from Aug 2026) | Documented stance |
| 6.5 | Methodology page truth-audit | Page describes only implemented capability |

---

## Phase 7 — Deploy & launch

| # | Task | Acceptance |
|---|------|------------|
| 7.1 | Deploy 3 sites to **Netlify** + resolver to **AWS** | All deploy from main; resolver reachable only by apps |
| 7.2 | Set all env vars in Netlify + AWS (Secrets Manager) | Build green, runtime keys present |
| 7.3 | Wire live API keys (Anthropic, OpenAI, Hive) | Real verdicts in prod |
| 7.4 | End-to-end test: canonical Wakefield case | Verdict generated, archived, shareable |
| 7.5 | Smoke + load test rate limits / SSRF in prod | Limits enforced; internal IPs blocked |
| 7.6 | Launch checklist sign-off (Definition of done above) | All boxes ticked |

---

## Execution order & milestones

- **Milestone A — Safe (Phases 0–2):** repo secure, CI real, endpoints protected. *Gate for any deploy.*
- **Milestone B — Works (Phases 3–4):** both pipelines functional end-to-end on real inputs.
- **Milestone C — Differentiated (Phase 5):** archive + correction packs + provenance UI live.
- **Milestone D — Live (Phases 6–7):** legal cleared, deployed, launch checklist green.

Phases 3 and 4 can run in parallel after Milestone A. Phase 5 starts once its dependency
pipeline (3 or 4) is green.

---

## Resolved decisions (16 Jun 2026)
1. Hosting: **Netlify** (web) + **AWS** (resolver). ✅
2. Resolver: **yt-dlp** engine + proxy fallback. ✅ (Appendix B)
3. Launch scope: **both apps together**. ✅
4. Rate-limit store: **AWS ElastiCache for Valkey**. ✅
5. Budget: see **Appendix C** (recommendation below; needs Elroy sign-off on the ceiling).
6. Sensity: **included at launch**. ✅ (needs commercial quote — Appendix C flags as unknown.)

### Still needs Elroy
- Confirm the **monthly API budget ceiling** (Appendix C recommends ~£550–£900/mo all-in,
  excluding the Sensity contract which needs a quote).
- Obtain keys/contracts: Anthropic, OpenAI, Hive, **Sensity** (enterprise — start sales now),
  proxy provider (Apify/Browserless).
- AWS account access for the resolver + Valkey + Secrets Manager.

---

## Appendix A — Accuracy & verification differentiation strategy

This is *how we stand apart and stay accurate*. Grounded in 2026 research: ensemble fusion,
cross-modal consistency, provenance-first, calibration, and human-in-the-loop explainability.
No single detector is reliable; our edge is the **system around the detectors** and the
**transparency of the output**.

### A1. Provenance-first decision tree (primary filter)
Order of trust, highest first. Short-circuit when high-confidence provenance exists.
1. **C2PA Content Credentials** valid + signed → authenticated origin (state generator/edits).
2. **Watermark** (SynthID etc., where supported) → flags known AI generators.
3. **Reverse-image / first-seen lookup** → catches recontextualised real media (real video,
   false caption/date — the failure mode pure detectors miss entirely).
4. Only if 1–3 are inconclusive → fall through to forensic detection (below).
*Why it wins:* shifts the question from "prove it's fake" (hard, adversarial) to "prove it's
real" (tractable) and ages well with EU AI Act Art. 50 disclosure rules (from Aug 2026).

### A2. Multi-signal ensemble (not score-averaging)
Combine architecturally diverse signals so no single generator artifact fools us:
- **Forensic** — Hive **and** Sensity (two independent vendors = built-in cross-check).
- **Temporal** — frame-to-frame coherence; flag splice/speed/grain-overlay evasion.
- **Cross-modal consistency** — audio↔lip-sync correlation (±50ms window); a top discriminator
  for lip-sync/voice-clone fakes that frame models miss.
- **Semantic/contextual** — GPT-4o over real channel/account/title metadata + physics sanity.
- **Provenance** — C2PA/watermark signals from A1.
**Fusion:** degradation-aware weighting (down-weight signals when input is low-res/compressed)
+ **discretised confidence binning** (quantise to 0.1 steps before aggregating — research shows
this beats continuous averaging on real-world noise). Output a single **calibrated** score with
an explicit uncertainty band, never a bare percentage.

### A3. Calibrated, falsifiable, explainable output (the trust layer)
Every verdict card shows:
- Verdict + **confidence band** (e.g. "likely AI-generated, 70–80%"), not false precision.
- **Per-signal breakdown** — what each layer found and how much it counted (explainability).
- **`what_would_change_this`** — the falsifiability statement (our signature feature).
- **Disclaimer** — "not definitive proof; one input to human judgement."
- **Vendor disagreement surfaced** — if Hive and Sensity disagree, say so. Honesty = trust.

### A4. Human-in-the-loop escalation (high-stakes path)
- Auto-route low-confidence / high-virality / named-politician cases to a **review queue**.
- Reviewer sees the model's reasoning trace as an editable **shared scratchpad** (Co-FactChecker
  pattern) and can correct/override before a verdict is published as "confirmed".
- Every override is logged → builds our proprietary labelled dataset (compounding moat).
- Public verdicts carry a status: `automated` vs `human-reviewed`.

### A5. Fountem claim verification edge (RAG side)
- **Atomic claim decomposition** — split compound claims into sub-claims with logical structure
  (AND/OR/IMPLIES), verify each, aggregate logically (TRUST-Agents pattern).
- **Source hierarchy enforced** — ONS > IFS > Hansard > NAO > Resolution Foundation > Full Fact
  (corroboration only); every verdict links the **primary** source (Evidence Chain).
- **Necessary-and-sufficient rationales** — keep only reasoning steps that change the verdict;
  prune filler so explanations are auditable.
- **Uncertainty-first** — three-state verdicts (supported / refuted / unverifiable) with
  calibrated confidence; never fabricate certainty from thin evidence.

### A6. Continuous accuracy assurance (don't rot)
- **Eval harness in CI** — block deploys that drop below the accuracy bar (≥8/10 to start;
  raise over time). Track precision/recall + false-positive rate, not just "accuracy".
- **Generator-diversity test set** — include diffusion + GAN + lip-sync + voice samples so we
  catch cross-model generalisation failures (the #1 real-world failure mode).
- **Published, versioned methodology + accuracy page** — competitors (Logically, Electoral
  Commission pilot) *can't* publish theirs. We can. That openness is the brand moat.

### A7. What makes us unique vs each competitor (summary)
| Competitor | Their gap | Our differentiator |
|---|---|---|
| Reality Defender | Enterprise black box, no public UI, undisclosed test sets | Public, free, calibrated, methodology published |
| Hive (we resell) | Single-vendor API, no context layer | Two-vendor ensemble + temporal + cross-modal + provenance |
| Logically | Can't publish methodology (gov clients) | Radical transparency + public case archive |
| Full Fact | 24–48h human cycle, no deepfake detection | Minutes, deepfake + claim under one brand |
| Electoral Commission pilot | Internal, not consumer-facing, opaque | Consumer-facing, explainable, shareable |

---

## Appendix B — Video resolver service (AWS)

**Engine:** yt-dlp (confirmed 2026 industry standard) + ffmpeg, in a container.
**Why a service (not Netlify functions):** native binaries (yt-dlp, ffmpeg, c2pa-node), long
runtimes, memory, and IP reputation/proxy needs don't fit serverless.

- **Compute:** ECS Fargate (or EC2 if cheaper at volume) running an authenticated internal API.
- **Contract:** `POST /resolve { url }` → validates (SSRF guard), downloads via yt-dlp, extracts
  ffprobe metadata, returns video bytes (or S3 pre-signed URL) + metadata to the unfaked app.
- **Auth:** shared secret / IAM; resolver is **not** publicly reachable — only the apps call it.
- **Anti-blocking:** rotating residential proxies (Apify/Browserless) + cookie support for
  platforms that bot-gate; async job queue (SQS) for concurrency.
- **Hardening:** per-request size + duration caps, timeout, allowlist of supported platforms,
  block private IP ranges before fetch.
- **Storage:** ephemeral; optionally S3 with short TTL lifecycle for caching/dedup by hash.

---

## Appendix C — Go-live budget recommendation

Two buckets: fixed infra (predictable) + variable AI/detection (capped). Set hard daily caps in
Valkey so spend can't run away; rate limits are derived from the ceiling.

### Fixed monthly infrastructure (~£170–£300/mo)
| Item | Est. /mo |
|---|---|
| Netlify (Pro, 3 sites) | ~£15–£35 |
| Supabase (Pro — needed for prod backups/limits) | ~£20 |
| AWS resolver (Fargate small, mostly idle) | ~£30–£70 |
| AWS ElastiCache for Valkey (small node) | ~£15–£40 |
| AWS S3 + data transfer + Secrets Manager | ~£10–£25 |
| Sentry (team) + PostHog (free→paid) | ~£25–£60 |
| Proxy provider (Apify/Browserless starter) | ~£40–£60 |
| Domains/email | ~£15 |

### Variable AI / detection (recommend cap **£300–£500/mo** at launch)
| Item | Driver | Note |
|---|---|---|
| Hive | per image/video call | dominant variable cost; cap calls/day |
| Anthropic Claude Sonnet | per token (RAG verdicts) | prompt caching reduces ~90% |
| OpenAI embeddings | per token | negligible (~£0.02/1M) |
| GPT-4o(-mini) contextual | per call | cheap |
| **Sensity** | enterprise contract | **UNKNOWN — get a quote; likely the biggest single line.** May be £100s–£1,000s/mo. Confirm before committing to "Sensity at launch." |

### Recommended go-live ceiling
**~£550–£900/mo all-in, excluding the Sensity contract.** With Sensity, budget depends entirely
on their quote — get it first; if it's enterprise-priced, consider a low-volume launch tier or
defer Sensity to post-first-revenue and launch on Hive + our ensemble (still differentiated).

**Rate caps derived from the ceiling (example at £400 variable cap):** set a global daily cap
(e.g. 300 detections/day) + per-IP cap (e.g. 5/hour, 20/day) + API-key tier quotas, all enforced
in Valkey, with a kill-switch when the monthly cap is hit.
