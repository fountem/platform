# Fountem API Services Agreement (B2B) — Template

**Version:** 0.1 (draft) · **Last updated:** June 17, 2026 · **Governing law:** England & Wales
**Status:** Draft template for counsel review. **Not legal advice.** This is the "separate
written agreement and API terms" referenced in the consumer Terms of Service (§7) for both
Unfaked and Fountem. It is designed for B2B customers (e.g. newsrooms) consuming the detection
/ claim-evaluation APIs. Negotiated terms go in the **Order Form (Schedule 1)**; everything
else is the standard framework below.

> How to use: fill the **Order Form** for each customer; the rest is the master agreement.
> Square-bracketed `[...]` items are deal-specific. Have counsel confirm the liability cap,
> indemnity, and data-protection schedule before first signature.

---

## Order Form (Schedule 1) — deal-specific terms

| Field | Value |
|---|---|
| **Provider** | Fountem Ltd, company no. [number], registered office [address] |
| **Customer** | [legal name], company no. [number], registered office [address] |
| **Effective Date** | [date] |
| **Services / APIs** | [ ] Unfaked Detection API · [ ] Fountem Claim-Evaluation API |
| **Plan / quota** | [e.g. 10,000 calls/month; overage £[x]/1,000 calls] |
| **Fees** | £[amount] per [month/year], billed [monthly/annually] in advance |
| **Initial Term** | [12] months |
| **Renewal** | Auto-renew for successive [12]-month terms unless [90] days' notice |
| **Price-increase cap** | Greater of CPI or [5]% per renewal, on [90] days' notice |
| **SLA target** | [99.9]% monthly uptime (Schedule 2) |
| **Liability cap** | Fees paid in the **12 months** before the claim (see §13) |
| **Support** | [email], target response [1 business day] |
| **Permitted use / attribution** | "Powered by Fountem" attribution [required/optional] |
| **Notices to Provider** | legal@fountem.ai · **Notices to Customer** | [email] |

---

## 1. Definitions

- **"Agreement"** — this document, the Order Form, and Schedules.
- **"API"** — the application programming interface(s) identified in the Order Form, and
  related documentation and API keys.
- **"Verdict / Assessment"** — output of the API (a detection or claim-evaluation result),
  including confidence bands, reasoning, signal breakdowns and citations.
- **"Customer Data"** — data the Customer submits to the API (e.g. URLs, claim text).
- **"Personal Data", "process", "controller", "processor"** — as defined in UK GDPR.
- **"DPA"** — the Data Processing Schedule (Schedule 3).
- **"Documentation"** — the technical docs we make available for the API.
- **"Confidential Information"** — non-public information disclosed by one party to the other
  that is marked or would reasonably be understood to be confidential (including the API,
  pricing, and Customer Data), excluding the categories in §14.

**Order of precedence.** If there is a conflict, the documents apply in this order: (1) the
**DPA (Schedule 3)** on data-protection matters; (2) the **Order Form (Schedule 1)**; (3) the
body of this Agreement; (4) other Schedules and Documentation.

## 2. The Services

2.1 We grant the Customer a **non-exclusive, non-transferable, revocable** licence during the
Term to access and use the API for the Customer's **internal business purposes** and to
incorporate Verdicts into the Customer's editorial/products **subject to §8 (Acceptable Use)**.

2.2 We may improve, change or deprecate API features with **reasonable notice** for material
breaking changes (target [60] days), except where a change is needed for security, legal
compliance, or to prevent abuse.

2.3 The API is provided as a tool. **Verdicts are evidence-based assessments, not definitive
proof** (see §11). The Customer is responsible for its own editorial decisions.

## 3. API keys, security and quotas

3.1 We issue API keys. The Customer keeps them confidential, is responsible for all use under
its keys, and must notify us promptly of any suspected compromise.

3.2 Use is subject to the **quota/rate limits** in the Order Form. We may apply technical
controls to enforce them. Overage is billed per the Order Form.

3.3 The Customer must not share, resell or sublicense API access except as expressly permitted.

## 4. Fees, payment and price changes

4.1 The Customer pays the **Fees** in the Order Form. Unless stated, Fees are exclusive of VAT.

4.2 Invoices are due within **[30] days**. We may charge interest on late sums under the Late
Payment of Commercial Debts (Interest) Act 1998.

4.3 We may increase Fees on renewal on **[90] days' notice**, capped at the **greater of CPI
or [5]%** per renewal (Order Form). Larger increases give the Customer a right not to renew.

4.4 Fees are non-refundable except as expressly stated or required by law.

## 5. Term, renewal and termination

5.1 **Term.** This Agreement runs for the Initial Term and renews per the Order Form.

5.2 **Termination for convenience.** Either party may terminate at the end of the then-current
term by giving the renewal notice period stated in the Order Form.

5.3 **Termination for cause.** Either party may terminate immediately if the other commits a
**material breach** not remedied within **30 days** of notice, or becomes insolvent.

5.4 **Effect.** On termination, API access ends, the Customer stops using the API and (subject
to §9.4 data export) we may delete Customer Data per the DPA. Accrued Fees remain payable.

5.5 **Survival.** §§1, 4 (accrued), 6, 9–14, 16–17 survive termination.

## 6. Suspension

6.1 We may **suspend** access (in whole or part) where: (a) there is a material security risk;
(b) use breaches §8 or threatens the service or others; (c) required by law; or (d) Fees are
**[30]+ days overdue** after notice.

6.2 Where practicable we give **prior notice** and a chance to cure; for serious/illegal use or
security threats we may suspend immediately and notify as soon as practicable. We restore
access once the cause is resolved.

## 7. Service levels and support

7.1 We target the **uptime** in the Order Form, with **service credits** per **Schedule 2**
as the Customer's **sole remedy** for failing to meet it (without limiting termination for
material breach for sustained failure).

7.2 We provide support per the Order Form. Scheduled maintenance and force-majeure events are
excluded from uptime calculations (Schedule 2).

## 8. Acceptable use

8.1 The Customer must not, and must not permit others to:
(a) present a Verdict as **conclusive proof** or strip its confidence band, reasoning or
citations when republishing;
(b) use the API to harass, defame or mislead, or to make false statements of fact about a
candidate's personal character or conduct in an election period;
(c) submit **personal or special-category data** about identifiable **private** individuals
except as strictly necessary and lawful;
(d) reverse engineer, scrape beyond the API, benchmark for a competing product, or exceed
quotas;
(e) use the API unlawfully or in breach of the **Acceptable Use Policy** published on the
relevant site, which is incorporated by reference.

8.2 The Customer is responsible for its republication of Verdicts and for obtaining any rights
needed in Customer Data it submits.

## 9. Data protection and Customer Data

9.1 Each party complies with applicable **data protection law** (UK GDPR / Data Protection Act
2018). The **DPA (Schedule 3)** governs processing of Personal Data and prevails over the body
of this Agreement on data-protection matters.

9.2 **Roles.** For Customer Data submitted to the API, the Customer is **controller** and we
act as **processor** to deliver the Verdict; for our own service operation, security,
anti-abuse and the public-interest archive we act as an independent **controller**.

9.3 **Subprocessors.** We use subprocessors (e.g. AI model and forensic providers, hosting,
storage) listed in the DPA. We give **notice of changes** and the Customer may object on
reasonable data-protection grounds. International transfers are covered by the **UK IDTA /
Addendum** where applicable.

9.4 **Data export & deletion.** On request during the Term and for **[90] days** after
termination, we make the Customer's stored Verdict records available for **export** in a
standard format (JSON/CSV), after which we may delete them per the DPA and our retention policy.

9.5 The Customer must **not** submit personal/sensitive data beyond what is necessary, per §8.

## 10. Intellectual property; feedback

10.1 We (and our licensors) own the API, software, models, methodology and Documentation, and
all IP in them. No rights are granted except as expressly set out.

10.2 The Customer owns its **Customer Data**. The Customer grants us a licence to process it to
provide the Services and (for public political media/claims) to operate the public-interest
archive consistent with the privacy policy.

10.3 **Verdicts.** Subject to payment and §8, the Customer may use and republish Verdicts in
its editorial output **with attribution** as set in the Order Form and **without removing**
the confidence band, reasoning or citations.

10.4 **Feedback.** If the Customer gives feedback, we may use it to improve the Services with
no obligation or restriction. We will not identify the Customer as the source without consent.

## 11. Warranties and disclaimers

11.1 Each party warrants it has authority to enter this Agreement.

11.2 We warrant we will provide the Services with **reasonable skill and care**.

11.3 **Otherwise the API and Verdicts are provided "as is".** To the fullest extent permitted
by law we exclude all other warranties, including as to **accuracy, completeness or fitness for
a particular purpose**. Verdicts are **assessments, not definitive proof**; detection and
evaluation have known error rates; the Customer must apply its own editorial judgement and not
rely on a Verdict as the sole basis for any decision, publication or allegation.

## 12. Indemnities

12.1 **By the Customer.** The Customer indemnifies us against third-party claims arising from
(a) the Customer's breach of §8, (b) its republication of Verdicts (including without the
required band/citations), or (c) Customer Data infringing rights or breaching law.

12.2 **By us (IP).** We will defend the Customer against third-party claims that the API as
provided infringes that third party's UK IP rights, and pay damages finally awarded, provided
the Customer notifies us promptly, lets us control the defence, and cooperates. We may modify
or replace the API, or terminate and refund pre-paid unused Fees. This **does not** apply to
claims arising from Customer Data, modifications, or use in breach of this Agreement.

12.3 These indemnities are subject to the **liability cap (§13)** except where law prevents.

## 13. Limitation of liability

13.1 **Nothing** in this Agreement limits liability for **death or personal injury** caused by
negligence, **fraud**, or anything that cannot lawfully be limited.

13.2 Subject to 13.1, neither party is liable for **indirect or consequential loss**, or for
**loss of profit, revenue, goodwill, data, or anticipated savings**, however arising.

13.3 Subject to 13.1, each party's **total aggregate liability** under this Agreement is
limited to the **Fees paid by the Customer in the 12 months** before the event giving rise to
the claim (the cap in the Order Form). The Customer's payment obligations are excluded from
this cap.

13.4 The service credits in Schedule 2 are the Customer's sole financial remedy for missing the
SLA target.

## 13A. Insurance

Each party maintains insurance adequate to its obligations. During the Term we maintain
**professional indemnity / errors & omissions** and **cyber** cover of at least £[amount] per
claim, and will provide evidence on reasonable request.

## 13B. Compliance with laws; anti-bribery

Each party complies with applicable laws, including anti-bribery (Bribery Act 2010), sanctions
and anti-money-laundering laws, and has procedures to prevent associated persons from breaching
them.

## 14. Confidentiality

14.1 Each party keeps the other's **Confidential Information** secret, uses it only for the
Agreement, and protects it with reasonable care. Exceptions: information that is public (not
through breach), independently developed, lawfully received, or required to be disclosed by law
(with notice where lawful).

## 15. Publicity

Neither party uses the other's name or marks without prior written consent, except we may list
the Customer as a customer if permitted in the Order Form.

## 16. General

16.1 **Force majeure** — neither party is liable for failure caused by events beyond its
reasonable control.
16.2 **Assignment** — neither party may assign without consent (not unreasonably withheld),
save that either may assign to an affiliate or on a sale/reorganisation.
16.3 **Subcontracting** — we may use subcontractors/subprocessors per §9 and remain responsible
for them.
16.4 **Entire agreement** — this Agreement is the entire agreement and supersedes prior
discussions; neither party relies on any statement not set out here (save for fraud).
16.5 **Variation** — changes must be in writing and signed (or via the change process for the
API/Documentation).
16.6 **Severability / waiver** — if a term is unenforceable the rest stands; no waiver unless
in writing.
16.7 **Third-party rights** — no one other than the parties has rights under the Contracts
(Rights of Third Parties) Act 1999.
16.8 **Notices** — in writing to the addresses in the Order Form.
16.9 **Relationship** — independent contractors; no partnership or agency.

## 17. Governing law and jurisdiction

This Agreement and any non-contractual obligations are governed by the laws of **England &
Wales**, and the parties submit to the **exclusive jurisdiction** of the courts of England &
Wales.

---

## Signatures

| Provider — Fountem Ltd | Customer — [name] |
|---|---|
| Signature: | Signature: |
| Name: | Name: |
| Title: | Title: |
| Date: | Date: |

---

## Schedule 2 — Service Level Agreement (SLA)

- **Uptime target:** [99.9]% per calendar month, measured at the API endpoint, excluding
  (a) scheduled maintenance notified [24h] in advance, (b) force-majeure events, (c) issues
  caused by the Customer or its data, (d) third-party platform outages outside our control.
- **Service credits** (sole remedy):

| Monthly uptime | Credit (% of that month's Fees) |
|---|---|
| < 99.9% to ≥ 99.0% | 5% |
| < 99.0% to ≥ 95.0% | 10% |
| < 95.0% | 25% |

- **Claiming:** Customer requests credits within [30] days; credits apply to future invoices.
- **Chronic failure:** uptime < 95% for [2] consecutive months is a material breach allowing
  termination for cause.

## Schedule 3 — Data Processing Agreement (DPA) [to be completed with counsel]

Must cover (UK GDPR Art.28): subject-matter/duration; nature/purpose; types of Personal Data
and categories of data subjects; controller instructions; confidentiality; security measures;
**subprocessor list + change notice**; assistance with data-subject requests and breaches;
**breach notification** timelines; deletion/return on termination; audit rights; and the
**UK International Data Transfer Addendum** for transfers to non-UK/EEA subprocessors (AI model
and forensic vendors, hosting). Cross-reference `context/legal/dpia.md`.
