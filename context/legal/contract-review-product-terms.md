# Contract Review — Product Terms (Unfaked & Fountem)

*Produced with the `contract-review` Agent Skill (CUAD 41-category framework, ContractEval,
LegalBench), adapted from the skill's US defaults to **England & Wales** law per the skill's
jurisdiction guardrail. **Not legal advice** — material terms need qualified UK counsel.*

**Documents reviewed:**
- `apps/unfaked/src/app/(site)/terms/page.tsx` — Unfaked Terms of Service (draft)
- `apps/fountem/src/app/(site)/terms/page.tsx` — Fountem Terms of Service (draft)
- `apps/{unfaked,fountem}/src/app/(site)/acceptable-use/page.tsx` — Acceptable Use Policy (draft)

**Our position:** Service provider publishing its **own template** to a **mixed audience**
(free consumers **and** B2B/API customers). For an own-template review the skill flags two
things: (a) **enforceability over-reach** (terms a UK court/consumer law would strike down,
which then weaken the *whole* document), and (b) **missing provisions** that leave *us*
exposed. Both are below.

> ⚠️ **Jurisdiction note.** The skill's market benchmarks (Delaware law, "12-month liability
> cap", arbitration/class-waiver framing) are US-centric. For a UK consumer-facing service the
> controlling regimes are the **Consumer Rights Act 2015 (CRA)**, **Unfair Contract Terms Act
> 1977 (UCTA)**, **Consumer Contracts (Information, Cancellation and Additional Charges)
> Regulations 2013**, and **UK GDPR**. Benchmarks have been re-based accordingly.

---

## Pre-Review Alerts

| Alert | Detail |
|---|---|
| 🟡 Draft status | Both documents are **drafts** marked "will be reviewed by counsel before launch" — review is informational; nothing executed. |
| 🟡 Placeholder entities | "Fountem Ltd" company **number** and **registered office** are not shown (CRA/Companies Act trader-identity requirement). |
| 🟡 Liability cap unquantified | §8 caps nothing in figures — "exclude indirect loss" but no **defined cap** for direct liability. |
| 🟡 Referenced-but-undrafted docs | Both ToS reference a "separate written agreement and **API terms**" (§7) that does not yet exist. |
| 🟢 Disclaimers present | "Assessment, not definitive proof" + links to disclaimer/methodology present in both. |

---

## Document Type

Closest skill checklist = **SaaS / MSA** (online service, account, free + paid tiers), with
a **consumer** overlay (CRA/UCTA) that the skill's US template does not cover.

**Risk Level:** 🟡 **Medium** — solid, honest, well-disclaimered drafts; the gaps are
*missing boilerplate* and a couple of *enforceability* points, not dangerous one-sided terms.

---

## Red Flags (Quick Scan)

| Flag | Found | Location | Note |
|---|---|---|---|
| Liability cap < market / unquantified | ⚠️ Yes | §8 | No numeric cap; relies on exclusions only |
| Uncapped indemnification (on user) | No | — | No user indemnity demanded (good for consumers) |
| "As-is" with no warranty | ⚠️ Partial | §8 | "as is" is fine **if** statutory consumer rights are preserved — they are (good) |
| Unilateral amendment rights | ⚠️ Yes | §9 | We may change terms; **no user-notice mechanism** specified → CRA fairness risk |
| Unilateral suspension without notice | ⚠️ Yes | §9 | "may suspend accounts that breach" — add notice/cure where practicable |
| No termination-for-convenience (user) | ⚠️ Yes | §9 | Users have no stated right to close account/stop using — add it |
| Perpetual obligations | No | — | — |
| Offshore jurisdiction | No | — | England & Wales — appropriate |
| Asymmetric assignment | ⚠️ Yes | (missing) | No assignment clause at all → add (we assign, user can't) |
| Class-action/arbitration over-reach | No | — | None imposed — **good**; do **not** add a US-style class waiver for UK consumers |

---

## Risk Analysis

### 🔴 Critical

**C-1 · Unilateral changes with no notice route (CRA fairness)** — ToS §9
> "We may update these terms … Material changes will be posted here."

- **Issue:** A right to vary terms unilaterally **without notifying** the consumer and
  **without a right to exit** is on the CRA Sch.2 "grey list" of potentially unfair terms.
- **UK standard:** Give **reasonable notice** of material changes (e.g. email to account
  holders / prominent notice) **and** a right to **stop using / close the account** before
  they take effect.
- **Negotiability:** N/A (our template) — **Fix:** add a notice + right-to-reject mechanism.

**C-2 · No defined liability cap** — ToS §8
- **Issue:** §8 excludes indirect loss but sets **no cap on direct liability**. For B2B
  customers an **uncapped** direct liability is worse for *us*; for consumers an attempt to
  cap too aggressively is unfair. We need a **two-tier** liability clause.
- **UK standard:** Consumers — preserve all non-excludable statutory rights, exclude only
  what UCTA/CRA permit, and make any cap **reasonable**. B2B — a negotiated cap (commonly
  tied to fees paid in the prior 12 months) in the separate API agreement.
- **Fix:** quantify a reasonable cap (e.g. for the **free** consumer tier, cap at a low fixed
  sum such as £100, since no fee is paid) and push B2B caps to the API agreement.

### 🟡 Important

**I-1 · Trader identity incomplete** — ToS §1 / footer
- CRA / Companies Act require the trader's **legal name, company number, registered office
  and a contact address**. Footer shows "Fountem Ltd" only. **Fix:** add number + registered
  office (in ToS §1 or footer).

**I-2 · No complaints / ADR / ODR signpost** — (missing)
- Consumer-facing services should signpost a **complaints process** and, where applicable,
  **Alternative Dispute Resolution**. We already have a corrections/right-of-reply route —
  **Fix:** reference it and the ICO route from the ToS.

**I-3 · No user termination-for-convenience** — ToS §9
- Only *we* can terminate. **Fix:** "You may stop using the service and close your account at
  any time" (mutual exit; cheap and fair).

**I-4 · Suspension without cure** — ToS §9
- "may suspend accounts that breach" with no notice/cure. **Fix:** "where practicable, with
  notice and an opportunity to remedy", reserving immediate suspension for serious/illegal use.

**I-5 · API terms referenced but absent** — ToS §7
- We promise B2B/API terms that don't exist. **Fix:** draft a **B2B API Agreement** (SaaS/MSA
  checklist: liability cap, uptime/SLA, data export, subprocessors, price caps, suspension,
  IP/feedback, indemnity, term/termination) **before** onboarding any paying customer.

### 🟢 Reviewed & Acceptable

| Category | Status | Notes |
|---|---|---|
| Accuracy disclaimer / no-reliance | ✓ | "Assessment, not definitive proof" + no-reliance in §3/§8 — strong defamation/CRA posture |
| Statutory rights preserved | ✓ | §8 expressly preserves consumer statutory rights and non-excludable liability |
| IP / user-content licence | ✓ | We don't store source media; user keeps rights, grants processing licence |
| Non-exclusion of death/PI/fraud | ✓ | §8 carve-out present — UCTA-compliant |
| Governing law / jurisdiction | ✓ | England & Wales — appropriate for a UK service |
| AI-generated content disclosure | ✓ (Fountem) | Fountem §4 discloses AI generation — supports EU AI Act Art.50(4) |

---

## Missing Provisions

| Provision | Priority | Why it matters | Suggested language |
|---|---|---|---|
| **Variation notice + right to reject** | Critical | CRA fairness (C-1) | "We'll give you reasonable notice of material changes by email or prominent notice. If you don't agree, you may stop using the service and close your account before they take effect." |
| **Defined liability cap (two-tier)** | Critical | UCTA/CRA reasonableness (C-2) | "For the free service, our total liability to you is limited to £100. Liability for paid/API use is set in your API agreement. Nothing limits liability that cannot lawfully be limited." |
| **User termination for convenience** | Important | Fairness (I-3) | "You may stop using the service and close your account at any time." |
| **Suspension with notice/cure** | Important | Fairness (I-4) | "Where practicable we'll give notice and a chance to put things right before suspending; we may act immediately for serious or unlawful breaches." |
| **Severability** | Important | Keeps the rest enforceable if one clause fails | "If any term is found unenforceable, the rest continues in force." |
| **Entire agreement** | Important | Prevents reliance on side-statements | "These terms are the entire agreement between us about the service." |
| **No third-party rights** | Important | Contracts (Rights of Third Parties) Act 1999 | "No one other than you and us has any rights under these terms." |
| **Assignment** | Important | We may need to assign (reorg/sale) | "You may not transfer your rights without our consent; we may transfer ours, e.g. on a reorganisation, without reducing your rights." |
| **Force majeure** | Standard | Excuses outages from events beyond control | "We're not liable for failures caused by events beyond our reasonable control." |
| **Notices / how we contact you** | Standard | Service of notices | "We'll contact you using your account email; notices to us go to legal@<domain>." |
| **Complaints / ICO signpost** | Standard | Consumer expectation (I-2) | "To complain, email corrections@<domain>; for data matters you may also contact the ICO." |
| **Company identity** | Important | CRA/Companies Act (I-1) | Add company number + registered office. |

---

## Internal Consistency

- ⚠️ **Numbering drift between apps.** Unfaked ToS has 10 sections; Fountem inserts §4 "AI-
  generated content", shifting later numbers. Fine, but keep cross-references self-consistent
  per app.
- ⚠️ **Email domains.** ToS uses `legal@unfaked.ai` / `legal@fountem.ai`; ensure these inboxes
  exist and are monitored (also `corrections@`, `privacy@`, `abuse@`).
- ✅ Defined term "assessment/verdict" used consistently and matches `VERDICT_DISCLAIMER`.

---

## Priority Fix List

| # | Issue | Action | Effort |
|---|---|---|---|
| 1 | C-1 unilateral changes | Add variation-notice + right-to-reject clause | Low |
| 2 | C-2 liability cap | Add two-tier defined cap; push B2B cap to API agreement | Low |
| 3 | I-3/I-4 termination & suspension | Add user exit + notice/cure | Low |
| 4 | Boilerplate gap | Add General section: severability, entire agreement, no third-party rights, assignment, force majeure, notices | Low |
| 5 | I-1 identity | Add company number + registered office | Low |
| 6 | I-2 complaints | Signpost corrections + ICO | Low |
| 7 | I-5 API terms | Draft separate B2B API Agreement (next deliverable) | Medium |

---

## Skill limitations applied here

- **US-law default** re-based to England & Wales (consumer law overlay added).
- **No hallucination:** only clauses actually present in the drafts are quoted/flagged.
- This is a **first-pass** review for issue-flagging — **counsel sign-off still required**,
  especially on the liability cap and the consumer variation clause.

*This review is for informational purposes only. Material terms should be reviewed by
qualified legal counsel.*
