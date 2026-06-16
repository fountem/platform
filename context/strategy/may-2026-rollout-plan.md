# Fountem — May 2026 Rollout Plan

**Election day:** 1 May 2026
**Stack:** Next.js + Tailwind CSS + Supabase/Postgres
**Scope:** Postcode lookup → candidate profiles → party positions → evidence panels → methodology page.

## Week-by-Week

### Week 1 (27 March – 2 April): Foundation
- Vercel + Supabase + Next.js scaffolded
- Democracy Club API key requested
- 5 issues + 5 parties seeded
- Environment variables set

### Week 2 (3–9 April): Postcode Lookup + Candidate Pages
- Core product feature ships
- User enters postcode → sees every candidate in ward
- Candidate profile pages
- Address picker flow for split postcodes

### Week 3 (10–16 April): Party Positions + Evidence Panels
- All 25 Party_Issue_Positions records (5 parties × 5 issues)
- Issue pages `/issue/[id]` with evidence panels
- Party pages `/party/[id]` with track record
- Methodology page `/methodology`

### Week 4 (17–23 April): QA, Data Gaps, Soft Launch
- Mobile layout QA (iPhone SE minimum)
- Lighthouse ≥85 mobile Performance
- Axe accessibility check
- Soft launch to 5-10 trusted contacts
- Feedback form via Tally/Typeform

### Week 5 (24–30 April): Public Launch + Outreach
- Email outreach to 5 local democracy journalists
- Post on X and LinkedIn with specific postcode example
- Submit to civic tech newsletters

### Election Day (1 May 2026)
- No new features. Read-only mode. Monitor errors. Log corrections.

## Go/No-Go Gates
- End Week 1: fountem.ai loads HTTPS, Supabase live, API key requested, PostHog receiving events
- End Week 2: valid postcode returns ≥1 candidate, no crash on invalid postcode
- End Week 3: all 25 positions in DB, all issue/party pages live, methodology published
- End Week 4: Lighthouse ≥85, zero critical a11y violations, tested by ≥5 real users
- End Week 5: ≥1 journalist/civic org contacted and responded

## Cost Summary
Phase 1 to election day: under £200 total (Vercel free, Supabase free, LLM API £30-50, domain registered).
