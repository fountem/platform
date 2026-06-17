# Defamation & Liability Memo — Fountem / Unfaked

**Last updated:** June 17, 2026 · **Status:** Draft research for counsel review · **Not legal advice.**
**Audience:** founder + anyone editing verdict wording, methodology, or the public archive.

This is the single most important legal document for the product. Read it before changing
any verdict phrasing, the disclaimer, or the archive.

---

## 1. The exposure, in plain terms

We publish two kinds of statement about identifiable people and organisations:

1. **Fountem — "this political claim is false / misleading / unsupported."**
   Risk: a party, politician, or commentator says our verdict defames them or harms them
   financially (malicious falsehood), or breaches RPA 1983 s.106 in an election period.
2. **Unfaked — "this video is AI-generated / likely AI-generated."**
   Two distinct risks:
   - **False positive** (a *real* video labelled fake): defames the person depicted and/or
     the publisher; causes a creator financial loss; can be weaponised to discredit genuine
     footage. **This is our worst-case error.**
   - **False negative / mislabel** that implies a named publisher *created* a deepfake (i.e.
     acted dishonestly) — an allegation of serious misconduct.

Defamation in England & Wales is **claimant-friendly** relative to the US. We design to the
UK standard; that keeps us safe in most other jurisdictions too.

---

## 2. The four defences we are building toward

Under the **Defamation Act 2013**, our defences are:

### (a) Truth — s.2
The statement is **substantially true**. For Fountem, this is why **every verdict cites
primary sources** and why we return **`unverifiable`** instead of guessing. For Unfaked,
truth is harder (detection is probabilistic) — which is why we lean on honest opinion +
public interest + calibration rather than asserting fact.

### (b) Honest opinion — s.3
The statement is (i) **opinion**, (ii) **indicates the basis** of the opinion, and (iii) an
honest person **could** hold it on the facts. **This is our primary shield for verdicts.**
Practical consequences for wording:
- Frame verdicts as **assessments/evaluations**, not bare assertions of fact.
- **Always show the basis** (citations for Fountem; per-signal breakdown for Unfaked). The
  `signal_breakdown`, `layer_breakdown`, `source_citations` and `reasoning` fields exist
  precisely to satisfy limb (ii).
- Keep `what_would_change_this` populated — it demonstrates the opinion is held honestly and
  is falsifiable.

### (c) Publication on a matter of public interest — s.4
The statement is on a **matter of public interest** and we **reasonably believed** publishing
it was in the public interest. Election integrity and misinformation plainly qualify. To
*earn* this defence we must show a **responsible editorial process**:
- verification against sources / multiple detection signals,
- seeking the subject's side where practicable (**right of reply**),
- tone and scope proportionate to the public interest,
- prompt correction when wrong.
**Action:** the human-review queue + right-of-reply policy + corrections log are the
evidence of this process. Keep them.

### (d) Serious-harm threshold — s.1
No claim succeeds unless the statement caused/will likely cause **serious reputational
harm** (and **serious financial loss** for a company claimant). Calibrated, hedged,
clearly-opinion verdicts with disclaimers are **less likely to clear this bar** — another
reason the wording discipline below matters.

### Also relevant
- **Single publication rule (s.8):** limitation runs from first publication — but **material
  changes** to an archived verdict can restart it. Version verdicts; don't silently rewrite.
- **Operators of websites / secondary publisher** defences mostly matter if we host *third-
  party* content. Our verdicts are **our own** content, so we are a **primary publisher** and
  must stand behind them. (Keep the archive free of user-posted content to avoid taking on
  intermediary-liability complexity — see OSA scoping in the landscape doc.)

---

## 3. Mandatory verdict-wording rules

These rules operationalise the defences above. They should be enforced in
`packages/verdict/src/serialiser.ts`, the schema labels in `packages/verdict/src/schema.ts`,
and the UI components. **Counsel must sign off the standard phrasings before launch.**

**DO**
- Use **graduated, opinion-framed labels** (already the case): `ai_generated`,
  `likely_ai_generated`, `inconclusive`, `likely_real`, `real`; and for claims
  `true / misleading / false / unverifiable`. Prefer "**our assessment is…**",
  "**the evidence indicates…**", "**signals are consistent with…**".
- Always render the **disclaimer** (`VERDICT_DISCLAIMER`) — it is present on every card; keep
  it visible, not hidden behind a toggle.
- Always show the **confidence band** (`confidence_low`/`confidence_high`) and
  `what_would_change_this`.
- Surface **vendor disagreement** when present (`vendor_disagreement`) rather than hiding it.
- Attribute precisely: "the **video**" / "the **claim**", not "**[Person] lied**" or
  "**[Person] faked this**". Critique the **artifact and the statement**, not the person's
  character.

**DON'T**
- Don't state or imply **certainty** ("proven fake", "100%", "confirmed deepfake",
  "[Person] is lying"). No 100%-accuracy claims anywhere (this is an existing product rule).
- Don't allege **dishonesty, criminality or bad faith** by a named person ("X deliberately
  spread a deepfake") unless that is independently, robustly evidenced **and** counsel-cleared.
- Don't editorialise beyond the evidence in `reasoning`/`summary`.
- Don't let `share_text` (auto-generated for social) drop the hedging — short social copy is
  *more* dangerous because it loses the band and disclaimer. Keep "assessment"/confidence in it.

---

## 4. High-stakes cases → mandatory human review

A verdict is **high-stakes** (must pass human review *before* publication to the archive or
the bot replying) when **any** of:
- it names or clearly identifies a **specific living individual** (esp. a candidate/politician);
- the verdict is at a **strong adverse** end (`ai_generated`, `false`) **about** such a person;
- **vendor disagreement** is present, or confidence band is wide / near a threshold;
- it concerns an **election** within the regulated period;
- `shouldEscalateForReview` already flags it.

This is enforced via the existing escalation hook (`shouldEscalateForReview` in
`packages/detection`) and the `/admin/review` queue. **Action:** ensure the *publication path*
(archive insert + bot reply) is **gated** on `review_status` for high-stakes cases, not just
that the case lands in the queue.

---

## 5. Right of reply, corrections & takedown

A fast, visible correction route is both the right thing and a core part of the s.4 defence.
See `content-takedown-right-of-reply-policy.md`. Minimum:
- a per-verdict "**challenge this verdict**" / contact route (already promised on the privacy
  pages — wire it to a real inbox: `corrections@`/`legal@`);
- a target **response SLA** (e.g. acknowledge ≤ 2 working days; resolve ≤ 10);
- a **corrections log** and visible "updated/【corrected】" state on amended verdicts (don't
  silently delete — annotate);
- ability to **rapidly unpublish** a contested archive item pending review.

---

## 6. RPA 1983 s.106 (election period) — extra caution

During a regulated election period, do **not** publish **false statements of fact about the
personal character or conduct of a candidate**. Mitigations:
- Keep Fountem focused on **policy claims and public statements**, not personal character.
- Apply mandatory human review to any candidate-related verdict in the period.
- If unsure, **hold** and seek counsel — the downside is criminal/electoral, not just civil.

---

## 7. Liability limitation (contract side)

In the Terms we will:
- disclaim warranties of accuracy and fitness, and state verdicts are **assessments, not
  advice**, not to be relied on as the sole basis for any decision;
- exclude **indirect/consequential loss** and **cap** direct liability (reasonable cap; for
  free consumer use, a low cap; for paying B2B, negotiated);
- **not** exclude liability for **death/personal injury from negligence, fraud, or anything
  that can't lawfully be excluded** (UCTA / CRA 2015) — a blanket exclusion is unenforceable
  and counter-productive.
Counsel to finalise the cap and carve-outs, especially for B2B API customers who may rely on
verdicts editorially.

---

## 8. Insurance

Strongly advise **media/defamation liability** + **professional indemnity** + **cyber**
cover before the archive or bot goes live publicly. Record the decision either way.

---

## 9. Action checklist (defamation)

- [ ] Counsel sign-off on standard verdict labels + disclaimer + `share_text` wording.
- [ ] Gate archive publication + bot replies on human review for high-stakes cases.
- [ ] Wire a real `corrections@`/`legal@` inbox and an SLA.
- [ ] Implement versioning + visible "corrected/updated" state on amended verdicts.
- [ ] Election-period editorial protocol (s.106) documented.
- [ ] Media-liability insurance bound (or risk accepted in writing).
- [ ] Keep the archive free of third-party user-posted content (avoid intermediary liability).
