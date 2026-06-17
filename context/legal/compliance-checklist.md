# Pre-Launch Legal & Compliance Checklist — Fountem / Unfaked

**Last updated:** June 17, 2026 · **Status:** Gate · **Not legal advice.**

**Rule:** no public launch (archive live + bot replying) until every **🔒 BLOCKING** item is
either ✅ done or has a **written, signed risk-acceptance** by the founder. Advisory items
should be done but won't hold launch.

---

## A. Data protection (UK GDPR / DPA 2018)

- [ ] 🔒 Register with the **ICO** and pay the data-protection fee.
- [ ] 🔒 Sign **Art.28 DPAs** with every processor: Supabase, Netlify, AWS, OpenAI, Anthropic, Hive, Sensity.
- [ ] 🔒 Put **IDTA / UK Addendum** + transfer risk assessment in place for each non-UK/EEA processor.
- [ ] 🔒 Finalise and approve the **DPIA** (`dpia.md`) with counsel/DPO.
- [ ] Publish a **full Privacy Policy** (done in this change) — counsel review.
- [ ] Define and implement **retention periods** (account, usage, cache, archive).
- [ ] Documented **DSAR + erasure** workflow with SLA; monitored `privacy@` inbox.
- [ ] **Breach-response runbook** (72-hour ICO notification path).
- [ ] Confirm **RLS** on all tables (✅ per migrations 007/010/011) and EU-region storage (✅).
- [ ] 🔒 **Rotate the Supabase keys** committed on 2026-06-16; confirm old keys revoked.

## B. Defamation / publication

- [ ] 🔒 Counsel **sign-off on standard verdict wording**, disclaimer, and `share_text`.
- [ ] 🔒 **Gate publication** (archive insert + bot reply) on **human review** for high-stakes cases.
- [ ] Wire a real **`corrections@` / `legal@`** inbox + response SLA.
- [ ] Implement **verdict versioning** + visible "corrected/updated" state (no silent edits).
- [ ] **Right-of-reply / takedown** policy published (`content-takedown-right-of-reply-policy.md`).
- [ ] **Election-period (RPA s.106)** editorial protocol documented.
- [ ] Keep the archive **free of third-party user-posted content**.

## C. AI transparency (EU AI Act Art.50)

- [ ] 🔒 Add **on-verdict AI-generation disclosure** for Fountem (Claude-generated text on public-interest matters) and/or document the human-editorial-review exemption.
- [ ] Add **"automated account"** disclosure to the @unfaked bot interactions.
- [ ] Publish a short **Art.50 statement** in methodology/legal.

## D. Electoral law

- [ ] Keep "**we do not tell you how to vote**" prominent (non-partisan posture).
- [ ] **No paid political advertising** without counsel + digital imprint.
- [ ] Re-assess imprint duties if we ever register as / coordinate with a campaigner.

## E. Online Safety Act

- [ ] Document the **"not an in-scope U2U service"** scoping conclusion.
- [ ] Re-test that conclusion **before** adding any comments/community/user-content feature.

## F. IP / content

- [ ] Corpus built from **primary sources**; fair-dealing extracts only; **attribution** on every source.
- [ ] Respect site **terms/robots** where fetching; do **not** re-publish source video.
- [ ] Choose a **licence for our own output** (e.g. CC-BY for verdicts).

## G. Consumer / contract

- [ ] Publish **Terms of Service** + **Acceptable Use Policy** (done in this change) — counsel review.
- [ ] Reasonable **liability cap + carve-outs** (UCTA/CRA); separate **B2B API agreement** for paying customers.
- [ ] **Cookie Policy** + (if non-essential cookies) consent banner.

## H. Corporate / operational

- [ ] **Company details** (name, number, registered office) shown on site.
- [ ] 🔒 **Media-liability + PI + cyber insurance** bound (or written risk-acceptance).
- [ ] **Accessibility** audit toward WCAG 2.2 AA; fix critical issues.

---

## Launch sign-off

| Gate | Owner | Sign-off | Date |
|---|---|---|---|
| All 🔒 BLOCKING items done or risk-accepted | Founder | | |
| Counsel review of pages + verdict wording | Solicitor | | |
| DPIA approved | Controller | | |
