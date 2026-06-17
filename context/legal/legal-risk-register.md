# Legal Risk Register — Fountem / Unfaked

**Last updated:** June 17, 2026 · **Status:** Living document · **Not legal advice.**

Scoring: **Likelihood** L/M/H · **Impact** L/M/H · **Priority** = combined.
Bring this page to counsel and to grant funders/investors. Review monthly and on any feature change.

| ID | Risk | L | Impact | Priority | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|
| R-1 | **Unfaked false positive** — real video labelled AI-generated; defames person/publisher, harms creator | M | H | **P0** | Calibrated bands; `what_would_change_this`; vendor-disagreement surfaced; mandatory human review + publication gating for high-stakes; fast correction/unpublish; insurance | Founder | 🟡 |
| R-2 | **Defamation claim** over a Fountem "false/misleading" verdict about a politician/party | M | H | **P0** | Truth (citations) + honest-opinion framing + s.4 public-interest editorial process + right of reply + corrections log; counsel sign-off on wording | Founder | 🟡 |
| R-3 | **International transfer** to US AI/forensic vendors without IDTA/SCCs | H | M | **P0** | Sign Art.28 DPAs; IDTA/UK Addendum + transfer risk assessment per processor | Founder | 🔴 |
| R-4 | **No ICO registration / data-protection fee** | H | M | **P0** | Register with ICO; pay fee; name a contact | Founder | 🔴 |
| R-5 | **Missing core legal pages** (Terms, AUP, Cookies, full Privacy, Disclaimer) | H | M | **P0** | Publish all pages (drafted in this change); counsel review | Founder | 🟡 |
| R-6 | **EU AI Act Art.50(4)** — Fountem AI-generated verdict text on public-interest matters not disclosed as AI | M | M | **P1** | On-verdict AI-generation disclosure + document human-review stance; bot "automated account" notice | Founder | 🟡 |
| R-7 | **RPA 1983 s.106** — wrong/false statement about a candidate's character in election period | L | H | **P1** | Focus on policy not character; mandatory review in regulated period; hold-and-escalate protocol | Founder | 🟡 |
| R-8 | **Special-category (political opinion) processing** without sound exemption | M | H | **P1** | Counsel sign-off on journalism/special-purposes route; restrict to public statements; no private-individual profiling | Founder | 🔴 |
| R-9 | **Copyright / database-right infringement** ingesting IFS/news/aggregator content | M | M | **P1** | Build corpus from primary sources; fair-dealing extracts only; attribution; respect terms/robots | Founder | 🟡 |
| R-10 | **OSA scope creep** — adding comments/community makes us an in-scope U2U service | L | M | **P2** | Keep archive free of user-posted content; re-assess before any community feature | Founder | 🟡 |
| R-11 | **DSAR / erasure failures** (no process/SLA) | M | M | **P1** | Documented DSAR/erasure workflow + SLA; monitored `privacy@` | Founder | 🟡 |
| R-12 | **Security breach** of emails/submissions | L | H | **P1** | RLS (✅); EU region; secret rotation; breach runbook (72h ICO) | Founder | 🟡 |
| R-13 | **Unreasonable liability exclusion** unenforceable / B2B reliance loss | L | M | **P2** | Reasonable cap + carve-outs (UCTA/CRA); separate B2B contract | Founder | 🟡 |
| R-14 | **Cookie/PECR** non-essential cookies set without consent | L | M | **P2** | Minimise non-essential cookies; consent banner if analytics added; Cookie Policy | Founder | 🟡 |
| R-15 | **No media/PI/cyber insurance** when archive/bot go live | M | H | **P1** | Bind media-liability + PI + cyber cover, or written risk-acceptance | Founder | 🔴 |
| R-16 | **Accessibility (Equality Act / WCAG 2.2 AA)** gaps | M | L | **P2** | Accessibility audit pre-launch; fix criticals | Founder | 🟡 |
| R-17 | **Leaked Supabase keys** (committed 2026-06-16) | H | H | **P0** | Rotate keys (already flagged in AGENT_CONTEXT); confirm done | Founder | 🟡 |

**P0 = must be resolved or formally risk-accepted before public launch.**

## Top 6 to clear before launch
1. R-3 transfers/DPAs · 2. R-4 ICO registration · 3. R-5 legal pages live + reviewed ·
4. R-17 rotate leaked keys · 5. R-1/R-2 verdict review-gating + counsel wording sign-off ·
6. R-15 insurance (or written risk-acceptance).
