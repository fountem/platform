# Legal & Compliance Package — Fountem / Unfaked

**Last updated:** June 17, 2026 · **Owner:** Elroy (elroy@flatfile.io) · **Status:** Draft for counsel review

> ⚠️ **This is not legal advice.** It is structured legal *research* and *drafting*
> produced to (a) map the legal surface of the product, (b) reduce the cost and time of
> obtaining counsel sign-off, and (c) give the team a defensible compliance posture from
> day one. Every document in this folder must be reviewed by a qualified UK solicitor
> (ideally one with media/defamation + data-protection experience) **before launch**.
> Where a document records a decision to accept a risk, that decision is the founder's,
> not this research's.

---

## How to use this folder

1. Read `uk-eu-legal-landscape.md` first — it is the map of every law that touches the
   product and what it requires of us.
2. `defamation-liability-memo.md` is the highest-stakes document. Political fact-checking
   and "this video is AI-generated" verdicts are the two activities most likely to draw a
   legal claim. Read it before changing any verdict wording.
3. `dpia.md` is the Data Protection Impact Assessment required (or strongly advisable)
   because we process data to evaluate political claims and publish a public archive.
4. `legal-risk-register.md` is the running list of risks, likelihood, impact and
   mitigation — the single page to bring to counsel and to investors/grant funders.
5. `compliance-checklist.md` is the pre-launch gate. Nothing goes live until the
   "blocking" items are green or have a written, signed risk-acceptance.
6. `content-takedown-right-of-reply-policy.md` is the operational policy behind the
   complaints/removal routes we promise in the published pages.

The user-facing legal pages that implement this research live in the apps:
`apps/{unfaked,fountem}/src/app/(site)/{privacy,terms,acceptable-use,cookies,disclaimer}/`.

---

## One-paragraph summary of our legal posture

Fountem and Unfaked are **independent, non-partisan** UK information-integrity tools. We
do not generate or distribute deepfakes; Unfaked *detects* them. We do not tell anyone how
to vote; Fountem *evaluates claims against primary sources*. Our core legal defences are
**truth, honest opinion, publication on a matter of public interest (Defamation Act 2013
ss.2–4), calibrated/falsifiable verdicts, transparent methodology, a human-review queue
for high-stakes cases, and a fast right-of-reply/takedown route.** Our data-protection
basis is **legitimate interests** (UK GDPR Art.6(1)(f)), supported by a DPIA and a
data-minimising architecture (we store derived signals and verdicts, not source media).
Our biggest exposures are **defamation/malicious falsehood** (a wrong "AI-generated" or
"false" verdict about a named person) and **UK GDPR** (publishing verdicts that name
living individuals). Both are mitigated, not eliminated.

---

## Document index

| File | Purpose |
|---|---|
| `uk-eu-legal-landscape.md` | Every applicable law + what it requires of us |
| `defamation-liability-memo.md` | Defamation/malicious-falsehood risk + mandatory verdict-wording rules |
| `dpia.md` | Data Protection Impact Assessment (UK GDPR Art.35) |
| `legal-risk-register.md` | Risk register: likelihood × impact × mitigation × owner |
| `compliance-checklist.md` | Pre-launch legal gate (blocking vs. advisory) |
| `content-takedown-right-of-reply-policy.md` | Notice-and-action, right of reply, corrections |
| `contract-review-product-terms.md` | Contract review of both apps' ToS/AUP (via the `contract-review` skill, UK-adapted) |
| `b2b-api-agreement.md` | B2B API Services Agreement template (Order Form + SLA + DPA stub) referenced by ToS §7 |
| `contract-review-b2b-api-agreement.md` | Contract review of the B2B API Agreement (SaaS/MSA checklist) |

## Cross-references into the codebase

- Verdict wording / disclaimers: `packages/verdict/src/serialiser.ts`,
  `apps/unfaked/src/components/VerdictPanel.tsx`, `apps/fountem/src/components/ClaimVerdictCard.tsx`
- Human-review escalation: `shouldEscalateForReview` in `packages/detection`, `/admin/review`
- Data we store: `supabase/migrations/` (`004_video_detections`, `003_claims_verdicts`, `011_auth_quotas`)
- Third-party processors: `.env.example` (Anthropic, OpenAI, Hive, Sensity, Supabase, Netlify)
