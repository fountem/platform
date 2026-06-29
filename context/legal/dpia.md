# Data Protection Impact Assessment (DPIA) — Fountem / Unfaked

**Last updated:** June 20, 2026 · **Status:** Draft DPIA for counsel/DPO review · **Not legal advice.**
**Controller:** Fountem Ltd (England & Wales). **Screening conclusion:** a DPIA is required/
strongly advisable because the processing involves evaluation/scoring, matters of substantial
public interest, processing of data relating to political matters, and public-facing
publication of verdicts about identifiable people (UK GDPR Art.35; ICO screening criteria).

This DPIA follows the ICO template structure: (1) need, (2) processing description, (3)
consultation, (4) necessity & proportionality, (5) risks, (6) measures.

---

## 1. Why we need a DPIA

The processing is **innovative** (AI deepfake detection + LLM claim evaluation), at
**potential scale**, involves **automated evaluation** that produces published verdicts about
identifiable people, and touches **politically sensitive** subject matter. Several ICO
"likely high risk" triggers are met, so a DPIA is the correct control.

---

## 2. Description of the processing

### 2.1 What we process (by product)

**Unfaked (deepfake detection)**
| Data | Personal data? | Source | Purpose |
|---|---|---|---|
| Submitted video URL + content hash | Sometimes (URL may identify a person/channel) | User submission | Run detection, caching, public archive |
| Derived technical signals (codec, C2PA, forensic/contextual scores) | Indirectly (about a video depicting a person) | Resolver + vendors | Produce verdict |
| Verdict + reasoning + confidence band | Yes, where it concerns an identifiable person | Our pipeline | Publish result |
| Account email | Yes | User | Auth, quota, abuse prevention |
| Per-day usage counts; IP-derived rate-limit data | Yes (IP) | System | Free-tier limits, anti-abuse |

> We deliberately **do not store the source video** — only derived signals, the verdict, and
> the URL/hash. This is a primary data-minimisation control.

**Fountem (claim evaluation)**
| Data | Personal data? | Source | Purpose |
|---|---|---|---|
| Claim text submitted | Possibly (may name people / contain personal data) | User submission | Decompose, retrieve, evaluate |
| Evidence chunks + citations | Public-domain primary sources | Our corpus | Ground the verdict |
| Verdict + reasoning + sources | Yes, where it concerns an identifiable politician | Our pipeline (Claude) | Publish result |
| Account email; usage counts; IP | Yes | User/System | Auth, quota, anti-abuse |

**Unfaked — text claim verification** *(new)*
| Data | Personal data? | Source | Purpose |
|---|---|---|---|
| Claim text submitted | Possibly (may name people / contain personal data) | User submission | Classify, retrieve evidence, evaluate |
| `claim_hash` (SHA-256 of normalised text) | Indirectly | Derived | Dedup / cache (no plaintext key) |
| Evidence chunks + citations (corpus + open web) | Public-domain sources; web pages | Corpus + Tavily web search | Ground the verdict |
| Verdict + reasoning + tiered sources | Yes, where it concerns an identifiable politician | Our pipeline (Claude) | Show / optionally publish a correction pack |

**Unfaked — live fact-checking** *(new — highest-sensitivity flow)*
| Data | Personal data? | Source | Purpose |
|---|---|---|---|
| Live stream URL | Sometimes (channel/person) | User submission | Pull broadcast audio |
| Transient audio (16 kHz PCM) | Yes — identifiable speech | yt-dlp/ffmpeg → Deepgram | Streaming ASR (not stored) |
| Transcript chunks + speaker diarisation labels | Yes | Deepgram | Claim extraction, display |
| Extracted check-worthy claims | Yes (about speakers) | LLM (GPT-4o-mini) | Verify in real time |
| Provisional live verdicts + confidence | Yes | RAG pipeline | Assistive on-screen signal (not published) |
| Session metadata (owner, status, counts, signed token) | Yes (owner) | System | Auth, caps, anti-abuse |

> **Live data-minimisation:** raw audio is **processed transiently and never stored** (no
> recording, no voiceprint/biometric template). Transcripts and live claims are owner-scoped
> (RLS), carry a **session TTL**, and are **never auto-published, auto-shared, or archived**.

### 2.2 Special category data (Art.9)
Verdicts touch **political opinions/positions** — special-category data. We process these in
relation to **public figures' public statements and party positions** in a **journalistic/
research** context, relying on the **special-purposes / journalism** provisions (DPA 2018
Sch.2 Part 5 / s.106; UK GDPR Art.85). **We do not** build profiles of *private individuals'*
political opinions, and we instruct users **not to submit personal/sensitive data** in claims
or URLs (notice on the Fountem privacy page).

### 2.3 Recipients / processors
OpenAI (embeddings + claim extraction), Anthropic (Claude verdicts), Hive + Sensity (forensic
scoring), **Deepgram (streaming ASR + diarisation — live)**, **Tavily (open-web evidence
search — text/live)**, Supabase (storage/auth, EU/London), Netlify/Vercel (hosting), AWS
(resolver + live-gateway ECS). Each needs an Art.28 DPA and, where data leaves the UK/EEA, an
IDTA/UK Addendum + transfer risk assessment. **Deepgram processes identifiable speech**, so its
DPA + transfer assessment is a launch blocker for the live feature.

### 2.4 Retention (to be finalised — currently a gap)
Proposed defaults, subject to counsel:
- Account data: life of account + 30 days after deletion request.
- Usage/quota counters: rolling, ≤ 13 months.
- Verdicts in the **public archive**: retained in the public interest (journalism/research),
  subject to correction/erasure review on request.
- Non-archived/cached detection results: define a TTL (e.g. 90 days) for cache rows.

---

## 3. Consultation

- **Internal:** founder/engineering (architecture & data flows). 
- **External (recommended before launch):** solicitor (media + data protection); optionally
  an information-rights / fact-checking body (e.g. Full Fact) on responsible-publication norms.
- **Data subjects:** their interests are represented via right-of-reply + erasure routes and
  the published privacy notice.

---

## 4. Necessity & proportionality (incl. Legitimate Interests Assessment)

**Lawful basis:** **Legitimate interests** (Art.6(1)(f)), with **contract** (Art.6(1)(b)) for
account/service delivery, and the **journalism/special-purposes** route for special-category
content.

**Legitimate Interests Assessment (3-part test):**
1. **Purpose test** — the interest is **countering election misinformation and improving the
   quality of public debate**: a legitimate, indeed important, public-interest aim.
2. **Necessity test** — publishing **evidence-backed, calibrated** verdicts about public
   claims/media is a proportionate way to achieve it; less-intrusive alternatives (e.g. not
   naming public claims) would defeat the purpose. We minimise by storing derived signals
   not source media, and by discouraging personal data in submissions.
3. **Balancing test** — against data-subject rights: subjects are mostly **public figures
   acting in public life**, the topics are matters of **public interest**, verdicts are
   **hedged, falsifiable and correctable**, and a **right of reply / erasure** route exists.
   For **private individuals** the balance can tip the other way → mandatory human review and
   a strong presumption against publishing verdicts that identify private individuals.

**Conclusion:** legitimate interests is available for the public-figure / public-claim core;
the LIA tips against publishing about **private individuals**, which we therefore restrict.

---

## 5. Risks to individuals

| # | Risk | Likelihood | Severity |
|---|---|---|---|
| D-1 | A **wrong verdict** about an identifiable person causes reputational/financial harm | Medium | High |
| D-2 | Publishing a verdict that **names a private individual** without adequate basis | Low–Med | High |
| D-3 | **Special-category** (political opinion) processing without a sound exemption | Medium | High |
| D-4 | **Unlawful international transfer** to a US AI/vendor without IDTA | High (until fixed) | Medium |
| D-5 | **Excessive retention** of claim text / URLs containing personal data | Medium | Medium |
| D-6 | **Re-identification** via the public archive (aggregating URLs/verdicts) | Low–Med | Medium |
| D-7 | **Security breach** exposing account emails / submissions | Low | High |
| D-8 | **Inability to honour DSARs/erasure** in time | Medium | Medium |
| D-9 | **Live provisional verdict** about a named person shown before human review (real-time defamation) | Medium | High |
| D-10 | **ASR transcription / speaker-attribution error** misattributes a claim | Medium | Medium |
| D-11 | **Identifiable speech processed** by a US ASR vendor (transfer + special-category) | Medium | Medium |
| D-12 | **Lower-trust open-web evidence** over-weighted in a verdict | Medium | Medium |

---

## 6. Measures to reduce risk

| Risk | Measure | Status |
|---|---|---|
| D-1 | Calibrated bands + `what_would_change_this` + human review for high-stakes + fast corrections | 🟡 (review-gating to finalise) |
| D-2 | Presumption against identifying private individuals; mandatory review; erasure on request | 🟡 |
| D-3 | Counsel sign-off on journalism/special-purposes route; restrict to public statements/positions | 🔴 |
| D-4 | Sign vendor DPAs; put IDTA/UK Addendum + transfer risk assessment in place per US processor | 🔴 |
| D-5 | Define + implement retention TTLs; "don't submit personal data" notice | 🟡 |
| D-6 | Archive only public political media; review/removal route; no bulk personal-data linkage | 🟡 |
| D-7 | RLS on all tables, EU region storage, secret hygiene, breach-response runbook (72h ICO) | 🟡 (RLS ✅; runbook pending) |
| D-8 | Documented DSAR/erasure workflow + SLA; `privacy@` monitored | 🟡 |
| D-9 | Verdicts shown **provisional** only; no auto-publish/share/archive; character-attack filter; election-mode human gate for named candidates; one-tap retract; per-minute + per-session caps | 🟡 |
| D-10 | Diarisation confidence surfaced; neutral "Speaker" label unless high-confidence ID; source transcript shown beside each claim | 🟡 |
| D-11 | Transient audio (never stored); no voiceprint; Deepgram DPA + IDTA/transfer assessment; session TTL on transcripts | 🔴 |
| D-12 | Source **tiering** (`primary` vs `web`) on every citation; corpus preferred; confidence reduced for web-only; never definitive on web-only | 🟡 |

---

## 7. Sign-off

| Role | Name | Decision | Date |
|---|---|---|---|
| Controller / founder | Elroy | | |
| Solicitor (external) | | | |
| (Optional) DPO / adviser | | | |

**Residual risk after measures:** to be recorded by the controller. Re-assess this DPIA on
any material change (new data type, new processor, new feature such as comments/community,
or change to retention/publication scope).
