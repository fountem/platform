# UK & EU Legal Landscape — Fountem / Unfaked

**Last updated:** June 17, 2026 · **Status:** Draft research for counsel review · **Not legal advice.**

This document maps every body of law that materially touches the product, what it requires
of us, our current position, and the gap to close. Jurisdiction of incorporation and
primary operation is assumed to be **England & Wales** (Fountem Ltd), serving primarily
UK users, hosted in the EU/London region (Supabase eu-west-2, Netlify).

Legend for **Status**: ✅ addressed · 🟡 partial / needs work · 🔴 gap / blocking.

---

## 1. Defamation (Defamation Act 2013; common law libel; Scots law of defamation)

**Why it applies.** Both products make and publish *statements about identifiable people*:
- Fountem: "Party X's claim is **false / misleading**" — and parties/politicians are identifiable.
- Unfaked: "This video is **AI-generated / likely AI-generated**" — which, applied to a video
  of a named politician, can imply the *publisher* of that video acted dishonestly, or
  (if we are wrong and the video is real) can imply the *person depicted* said/did something
  fabricated, or undermine a genuine recording.

**What the law requires / gives us.**
- A statement is defamatory only if it causes or is likely to cause **serious harm** to
  reputation (s.1). For a body trading for profit, serious harm requires **serious financial
  loss** (s.1(2)).
- Core defences: **Truth** (s.2), **Honest opinion** (s.3), **Publication on a matter of
  public interest** (s.4, the *Reynolds*-successor — reasonable belief that publishing was
  in the public interest), and **operators-of-websites**/secondary-publisher protections.
- **Single publication rule** (s.8): the 1-year limitation runs from first publication, not
  each view — important for the public archive.
- **Malicious falsehood** (separate tort): a false statement, published maliciously, causing
  financial loss — does **not** require the statement to be defamatory. Relevant if we wrongly
  flag a genuine video as fake and a creator loses income.

**Our position.** 🟡 Calibrated, falsifiable verdicts with "not definitive proof"
disclaimers, a transparent methodology page, source citations (Fountem) and per-signal
breakdown (Unfaked), plus a human-review queue for high-stakes cases. These are strong
*foundations* for the truth / honest-opinion / public-interest defences.

**Gap to close.** Verdict-wording discipline (see `defamation-liability-memo.md`), a
documented public-interest editorial process, fast right-of-reply, and (pre-launch) counsel
sign-off on standard verdict phrasings. Consider media-liability insurance.

---

## 2. Malicious falsehood & "false flag" risk (Unfaked-specific)

A **false positive** (real video labelled AI-generated) is our most dangerous single error
because it can (a) defame the person depicted/the publisher, (b) cause financial loss to a
creator, and (c) be weaponised ("even Unfaked says it's fake"). 🟡 Mitigated by confidence
bands, `what_would_change_this`, vendor-disagreement surfacing, escalation to human review,
and never asserting 100% certainty. **Action:** treat any verdict naming a person at the
`ai_generated`/`false` end as high-stakes → mandatory human review before publication to the
archive (see risk register R-1, R-2).

---

## 3. UK GDPR + Data Protection Act 2018

**Why it applies.** We process personal data: account emails; claim text (may name people);
verdicts about identifiable politicians; submitted video URLs and derived signals about
videos that depict identifiable people; IP-derived rate-limit data.

**Key requirements & our position.**
- **Lawful basis (Art.6).** We rely on **legitimate interests** (Art.6(1)(f)) — countering
  election misinformation / improving public debate — balanced against data-subject rights
  via a Legitimate Interests Assessment (LIA, in `dpia.md`). Account email for service
  delivery may also rest on contract (Art.6(1)(b)). 🟡
- **Special category data (Art.9).** Political opinions are special-category data. We
  process information *about politicians' public statements and party positions* (public
  domain, journalistic/research context) — but must avoid building profiles of *private
  individuals'* political opinions. **The s.106 DPA 2018 "journalism" and Art.85 special
  purposes exemptions are central** and must be assessed by counsel. 🟡/🔴
- **DPIA (Art.35).** Required for processing likely to result in high risk, incl.
  large-scale processing, evaluation/scoring, and matters of substantial public interest.
  We should have one. 🟡 → see `dpia.md`.
- **Data minimisation & storage limitation (Art.5).** ✅ Architecture stores derived
  signals + verdict + URL/hash, **not** source media; define retention periods (gap 🟡).
- **Data-subject rights (Arts.12–22).** Access, rectification, erasure, objection. We
  publish a `privacy@` route. Need a documented internal process + SLA. 🟡
- **International transfers (Ch.V).** OpenAI/Anthropic/Hive/Sensity may process outside the
  UK/EEA → need **IDTA / UK Addendum to SCCs** + transfer risk assessment per processor. 🔴
- **Processors (Art.28).** Need Art.28-compliant DPAs with Supabase, Netlify, OpenAI,
  Anthropic, Hive, Sensity. 🔴 (check each vendor's standard DPA is accepted)
- **ICO registration / data-protection fee.** Controller must pay the ICO fee + (likely)
  appoint a contact. 🔴
- **Breach notification (Art.33/34).** 72-hour ICO notification process needed. 🟡

---

## 4. Online Safety Act 2023 (OSA) + Ofcom regime

**Status of the law (as of 2026).** Illegal-content duties in force since **17 March 2025**;
protection-of-children duties since **25 July 2025**. Ofcom expects to publish the **register
of categorised services in July 2026**. A service has **3 months from launch** to complete
an illegal-content risk assessment.

**Does it apply to us?** OSA bites on **user-to-user (U2U)** services and **search**
services. Analysis:
- Fountem and Unfaked websites are primarily **publisher** services (we publish our own
  verdicts/archive) → publisher content is generally **out of scope** of the U2U duties.
- **But** two features need scrutiny: (a) the **public archive / `/cases`** if it ever
  surfaces user-submitted content or comments; (b) the **@unfaked X bot** — the bot posts on
  *X's* platform (X is the U2U service, not us), so we are a *user* of X, not a provider.
- If we never let users post content visible to other users, we are very likely **not** an
  in-scope U2U service. 🟡 — **Action:** document this scoping conclusion (a "we are not a
  U2U service because…" memo) and re-test it before adding any community/comment feature.

**If we ever become in scope:** illegal-content risk assessment within 3 months, reporting
& complaints tooling, content moderation, record-keeping; categorisation duties if we hit
thresholds (unlikely at our scale). Track Ofcom's Autumn 2026 additional-measures statement.

---

## 5. Electoral law (Representation of the People Act 1983; Elections Act 2022)

**RPA 1983 s.106** — it is an offence to publish a **false statement of fact about the
*personal character or conduct* of a candidate** before/during an election to affect the
election, unless you reasonably believed it true. This bites on *fact-checking a candidate*
and on any *wrong* verdict about a candidate during an election period. 🟡 — mitigated by
focusing on **policy claims and public statements**, not personal character, and by the
public-interest/accuracy process. **Action:** election-period editorial caution + counsel note.

**Digital imprint regime (Elections Act 2022, Part 6)** — in force **1 November 2023**.
Requires an **imprint** (who promoted it / on whose behalf) on:
- **paid-for** political advertising, and
- certain **organic** election material published by candidates / registered third-party
  campaigners that **encourages voting in a particular way**.

**Our position.** We are **non-partisan**, we do **not** tell people how to vote, and we
are **not** a registered campaigner. Our content is journalistic/analytical, not "vote for
X". On current scope, organic imprint rules **likely do not apply**. 🟡 — **Action:** (a) if
we ever run **paid** promotion of political content, add an imprint; (b) keep "we do not
tell you how to vote" language prominent; (c) re-assess if we ever register as a campaigner
or coordinate with one. **Do not** run paid political ads without counsel.

**Political impartiality / electoral integrity.** Strengthen the "proudly non-partisan"
posture with a documented **editorial-independence + methodology** policy; this is both a
trust asset and a legal/defamation asset.

---

## 6. EU AI Act (Regulation (EU) 2024/1689) — Article 50 transparency

**Status.** Art.50 transparency obligations apply from **2 August 2026**. (A grace period
to 2 December 2026 applies *only* to Art.50(2) machine-readable marking for systems already
on the market — **not** to the deepfake/text disclosure duties.)

**Territorial scope.** The AI Act can apply where **output is used in the EU** or systems
are placed on the EU market. We must assume **some EU exposure** if EU users access the apps.

**Which limbs touch us.**
- **Art.50(1) — interactive AI disclosure.** If we expose a chatbot-like interface, users
  must be told they're interacting with AI. (The X bot's replies are arguably this.) 🟡
- **Art.50(4) first limb — deepfakes.** Applies to **deployers who generate or manipulate**
  deepfakes. **Unfaked does the opposite — it detects them — so this limb does not bite us.** ✅
- **Art.50(4) second limb — AI-generated text on matters of public interest.** Where text
  that **informs the public on matters of public interest** is AI-generated/manipulated and
  **has not undergone human review** with editorial responsibility, it must be **disclosed
  as AI-generated**. **This directly touches Fountem's verdicts** (Claude-generated text on
  political matters). 🔴/🟡 — **Action:** disclose AI generation on Fountem verdicts (we
  already cite the model in methodology; make the *on-verdict* disclosure explicit), and/or
  route through documented human editorial review to qualify for the exemption.

**Our position.** ✅ Methodology pages already name the models used. **Gap:** add an explicit
"this verdict text was generated by an AI model and [is/was not] human-reviewed" disclosure
on Fountem verdict cards, and an "you are interacting with an automated account" line on the
bot. Document the stance in a short "EU AI Act Art.50 statement".

---

## 7. Copyright & database rights (CDPA 1988; UK database right)

**Why it applies.** We ingest and quote **primary sources** (ONS, IFS, Hansard, NAO,
Resolution Foundation, Full Fact, manifestos, news reporting) into an evidence corpus, and
we fetch third-party video for analysis.

**Key points.**
- **Hansard / parliamentary material** — covered by **Open Parliament Licence**; reusable. ✅
- **ONS / most gov statistics** — **Open Government Licence (OGL)**; reusable with
  attribution. ✅
- **IFS / Resolution Foundation / Full Fact / news** — **all-rights-reserved**; rely on
  **fair dealing for reporting current events / criticism & review / quotation** (CDPA
  ss.30, 30A) with **sufficient acknowledgement**, and keep quoted extracts proportionate.
  🟡 — **Action:** store *citations + short extracts*, not full copies; attribute every
  source; honour robots/terms where scraping.
- **Database right** — copying substantial parts of a third party's database can infringe
  even where individual facts aren't protected. 🟡 — **Action:** build our corpus from
  primary sources, not by bulk-copying an aggregator.
- **Video we fetch (Unfaked)** — we **do not store** source video (✅ data-min + copyright
  friendly); transient processing for analysis is defensible (analysis ≠ communication to
  the public), but **do not** re-publish the source video.
- **Our own output** — verdict cards, methodology, archive are our copyright; choose a
  licence for reuse (e.g. CC-BY for verdicts to encourage citation by newsrooms). 🟡

---

## 8. PECR + cookies (Privacy and Electronic Communications Regulations)

**Why it applies.** Cookies/local storage and any email outreach.
- **Strictly-necessary** cookies (auth/session via Supabase) — no consent needed. ✅
- **Analytics / non-essential** cookies — require **consent** (banner) **before** setting. 🟡
  → If/when analytics is added, ship a consent banner. Currently minimise non-essential
  cookies to keep this simple. **Action:** publish a **Cookie Policy** listing each cookie.
- **Marketing email** — soft opt-in / consent rules apply. 🟡

---

## 9. Consumer & contract law (B2B API + free consumer tier)

- **Terms of Service** needed for both the **free consumer** use and the **B2B API**. 🔴 →
  drafted as `terms` pages; B2B should have a separate commercial agreement at contract time.
- **Consumer Rights Act 2015 / Consumer Contracts Regulations** apply to consumer users —
  even free services need fair terms, clear info, and cannot exclude liability for death/
  personal injury or fraud, or unfairly exclude statutory rights. ✅ reflected in drafting.
- **Limitation/exclusion of liability** must be **reasonable** (UCTA / CRA) — we can cap and
  exclude *indirect* loss and disclaim accuracy, but not rely on a blanket "we're never
  liable". 🟡 — counsel to tune the liability clause, especially for paying B2B customers.

---

## 10. Accessibility & equality

- **Equality Act 2010** — service providers must make reasonable adjustments; aim for
  **WCAG 2.2 AA**. 🟡 (design-system work helps; needs an accessibility audit pre-launch).

---

## 11. Company / regulatory housekeeping

- Company registered details + registered office on the website (Companies Act). 🟡
- Clear **contact/complaints** address. 🟡 (covered by takedown policy + footer email)
- **Insurance:** professional indemnity + **media/defamation liability** + cyber. 🔴 strongly advised.

---

## Cross-jurisdiction note

Although we operate UK-first, the apps are reachable globally. The two regimes most likely
to reach us extraterritorially are **UK GDPR/EU GDPR** (data subjects) and the **EU AI Act**
(output used in EU). US defamation standards are *more* publisher-friendly than the UK, so a
UK-defensible posture is generally safe elsewhere — **except** that UK libel law is claimant-
friendlier, so designing for UK defamation defences is the conservative choice.

---

## Summary of blocking (🔴) items before launch

1. Processor DPAs + international-transfer mechanism (IDTA) for OpenAI/Anthropic/Hive/Sensity/Supabase/Netlify.
2. ICO data-protection fee registration.
3. Terms of Service + Acceptable Use + Cookie + full Privacy + Disclaimer pages published.
4. EU AI Act Art.50 disclosure on Fountem AI-generated verdict text + bot interaction notice.
5. Counsel sign-off on standard verdict wordings (defamation memo).
6. Media-liability insurance in place (or written risk-acceptance).
