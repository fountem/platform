# Contract Review — Fountem API Services Agreement (B2B)

*Produced with the `contract-review` Agent Skill (CUAD framework, SaaS/MSA checklist + market
benchmarks), adapted to **England & Wales**. **Not legal advice** — counsel must sign off the
liability, indemnity and DPA before first signature.*

**Document reviewed:** `context/legal/b2b-api-agreement.md` (v0.1 draft)
**Document type:** SaaS / API Master Services Agreement
**Our position:** **Provider (vendor)** reviewing its **own template**. The skill's job here is
two-sided: (a) confirm we're adequately **protected**, and (b) predict what a sophisticated B2B
customer (e.g. a newsroom's legal team) will **push back on**, so we know our fallbacks.
**Risk Level (to us):** 🟢 **Low–Medium** — protective and broadly market-standard; a few
points a customer will negotiate.

---

## Pre-Review Alerts

| Alert | Detail |
|---|---|
| 🟡 Draft / placeholders | Many `[...]` deal terms (fees, term, cap %, notice periods) — expected for a template; fill via Order Form. |
| 🔴 Schedule 3 (DPA) incomplete | The DPA is a stub "to be completed with counsel" — **blocking** before any real customer data flows. |
| 🟡 Entity details | Company numbers / registered offices are placeholders. |
| 🟢 SLA quantified | Schedule 2 has real uptime tiers + credits + chronic-failure trigger. |

---

## SaaS / MSA Checklist (from the skill)

| Category | Check | Status | Location |
|---|---|---|---|
| **Liability cap** | 12+ months = standard | ✅ 12 months' fees | §13.3 / Order Form |
| **Uptime SLA** | 99.9% with credits = standard | ✅ 99.9%, tiered credits, chronic-failure termination | Sch.2 |
| **Suspension rights** | Notice required? | ✅ Notice + cure where practicable; immediate only for serious/illegal/security | §6 |
| **Data ownership** | Customer owns its data | ✅ Customer owns Customer Data | §10.2 |
| **Data export** | Format, duration, cost on termination | ✅ JSON/CSV, 90 days post-termination | §9.4 |
| **Price increases** | Capped? Notice? | ✅ Greater of CPI or 5%, 90 days' notice | §4.3 |
| **Auto-renewal notice** | 90+ days = good | ✅ 90-day notice (Order Form) | §5 / Order Form |
| **Termination** | Mutual for convenience? Cure for cause? | ✅ Convenience (end of term) + 30-day cure | §5.2/5.3 |
| **Subprocessors** | Notice of changes? Objection? | ✅ Notice + reasonable objection | §9.3 / Sch.3 |
| **Insurance** | Vendor carries E&O / cyber? | ⚠️ **Not addressed** | — |

---

## Red Flags Quick Scan

| Flag | Present? | Note |
|---|---|---|
| Liability cap < 6 months | No | 12-month cap — market standard |
| Uncapped indemnification | ⚠️ Watch | §12.1 customer indemnity is **uncapped via §13.1 carve-outs only** — confirm §12.3 subjects it to the cap (it does, except where law prevents) |
| "As-is" with no warranty | Mitigated | §11.2 adds reasonable-skill-and-care; "as is" only for accuracy/fitness — appropriate for a detection tool |
| Unilateral suspension w/o notice | No | §6 requires notice/cure where practicable |
| Unilateral amendment | No | §16.5 variation needs signed writing; API changes via notice — fair |
| Perpetual obligations | No | Survival list is scoped (§5.5) |
| Offshore jurisdiction | No | England & Wales |
| Asymmetric assignment | No | §16.2 symmetric (affiliate/sale carve-out both ways) |

---

## Risk Analysis

### 🔴 Critical (to us)

**B-1 · DPA (Schedule 3) is a stub.** Without a completed Art.28 DPA + UK IDTA, processing
Customer Data through US AI/forensic subprocessors is unlawful. **Action:** complete Schedule 3
with counsel **before** onboarding; cross-reference `dpia.md`. (Mirrors risk-register R-3/R-8.)

### 🟡 Important

**B-2 · No insurance clause.** Market B2B MSAs usually state the provider carries
**professional indemnity / E&O + cyber** cover. Ties to risk-register R-15. **Action:** add an
insurance clause once cover is bound (or leave out deliberately and accept the commercial ask).

**B-3 · IP indemnity scope (customer push-back expected).** §12.2 we defend UK IP claims on the
**API as provided**. A customer republishing Verdicts editorially may ask for a **defamation /
content indemnity** for the Verdicts themselves. **Hold the line:** Verdicts are *assessments*
the customer exercises editorial judgement over (§§2.3, 8, 11.3); do **not** give a broad
content/defamation indemnity. Fallback: narrow warranty that Verdicts are produced with
reasonable skill and care (already in §11.2).

**B-4 · Liability cap on a low-fee deal.** A 12-month-fees cap is fine, but for a **small**
contract the cap may be commercially trivial; consider a **floor** (e.g. greater of 12 months'
fees or £[x]) — customers sometimes ask for this. Decide per deal in the Order Form.

**B-5 · "Sole remedy" SLA credits (§7.1/13.4).** Standard and good for us; sophisticated
customers may carve out **chronic failure** (already addressed — termination right in Sch.2).
Acceptable.

### 🟢 Reviewed & Acceptable

| Category | Status | Notes |
|---|---|---|
| "Assessment, not proof" risk allocation | ✓ | §§2.3, 11.3 push editorial responsibility to customer — key for our defamation posture |
| Acceptable use / republication integrity | ✓ | §8.1(a) bars stripping band/citations; §10.3 attribution — protects accuracy + brand |
| Election-period / private-data limits | ✓ | §8.1(b)(c) mirror RPA s.106 + UK GDPR posture |
| Data export + deletion | ✓ | 90-day export then deletion — avoids lock-in complaints |
| Survival, severability, third-party rights | ✓ | §§5.5, 16.6, 16.7 |
| Governing law / jurisdiction | ✓ | England & Wales, exclusive |

---

## Missing Provisions

| Provision | Priority | Why it matters | Suggested fix |
|---|---|---|---|
| **DPA body (Schedule 3)** | Critical | Lawful processing/transfers | Complete with counsel + IDTA |
| **Insurance** | Important | Customer expectation; backs indemnity | "Each party maintains adequate insurance; Provider maintains professional indemnity and cyber cover of £[x]." |
| **Audit / security info** | Important | Newsrooms may ask | Offer a security summary / right to reasonable info in lieu of on-site audit |
| **Beta / deprecation policy** | Standard | API change management | Note beta features are "as is"; [60]-day deprecation notice (partly in §2.2) |
| **Anti-bribery / sanctions / compliance** | Standard | Standard B2B reps | Short compliance-with-laws + anti-bribery clause |
| **Order of precedence** | Standard | Resolve Order Form vs body conflicts | "Order Form prevails over the body; DPA prevails on data-protection matters" (DPA precedence is in §9.1 — add Order Form precedence) |

---

## Internal Consistency

- ⚠️ **Precedence:** §9.1 says the DPA prevails on data matters, but there's no general
  Order-Form-vs-body precedence line — add one.
- ⚠️ **Defined terms:** "Documentation" defined but lightly used; "Confidential Information"
  used in §14 without a one-line definition — add a short definition.
- ✅ Liability cap figure consistent between Order Form and §13.3.
- ✅ SLA target referenced consistently (Order Form ↔ §7 ↔ Sch.2).

---

## Market Benchmarks (UK-adapted)

| Provision | This draft | Market standard | Verdict |
|---|---|---|---|
| Liability cap | 12 months' fees | 12 months | ✅ On standard |
| SLA uptime | 99.9% + credits | 99.9% + credits | ✅ On standard |
| Auto-renewal notice | 90 days | 90+ days | ✅ Good |
| Price-increase cap | CPI or 5% | CPI / ~5% | ✅ On standard |
| Data export | 90 days, JSON/CSV | 90 days, standard format | ✅ On standard |
| Cure period | 30 days | 30 days | ✅ On standard |
| Indemnity | Mutual, capped, narrow IP | Mutual, capped | ✅ Slightly provider-favourable (intended) |

---

## Negotiation Priority (what a customer will ask for, and our line)

| # | Likely customer ask | Our position | Fallback |
|---|---|---|---|
| 1 | Broad **defamation/content indemnity** on Verdicts | **Decline** — Verdicts are assessments; editorial responsibility is theirs (§§2.3, 11.3) | Reasonable-skill-and-care warranty only |
| 2 | **Higher / uncapped** liability | Hold 12-month cap; carve-outs already fair | Add a modest floor (B-4) |
| 3 | **Security/audit** rights | Offer security summary, not on-site audit | Limited audit on breach |
| 4 | **Higher SLA** (99.95%) | Possible for premium tier | Tier pricing |
| 5 | Remove **"sole remedy"** on SLA | Keep; point to chronic-failure termination | — |

---

## Priority Fix List

| # | Item | Action | Effort |
|---|---|---|---|
| 1 | B-1 DPA stub | Complete Schedule 3 + IDTA with counsel | Medium |
| 2 | B-2 insurance | Add clause once cover bound | Low |
| 3 | Precedence + defs | Add Order-Form precedence; define Confidential Information | Low |
| 4 | B-4 cap floor | Decide per-deal floor | Low |
| 5 | Compliance/anti-bribery | Add short clause | Low |

---

## Skill limitations applied

- US defaults re-based to England & Wales; "arbitration/class-waiver" framing intentionally
  **not** imported (B2B UK litigation in E&W courts is appropriate).
- First-pass review; **counsel sign-off required** on §§12–13 and Schedule 3.
- No hallucination: only clauses present in the draft are quoted/flagged.

*This review is for informational purposes only. Material terms should be reviewed by qualified
legal counsel.*
