# Scoring Rubrics — Alignment + Credibility (Party-level)

## Core Principles
1. Two signals: Alignment (does policy address root causes?), Factual Credibility (how accurate are claims?), Track Record (are commitments kept?)
2. Evidence links on every score — drill down to claim, source, rationale
3. "Unknown" is allowed — insufficient evidence → say so
4. No moralising — assess factual accuracy and policy mechanisms, not intentions

## Alignment Score (0-100)
Measures whether party's stated approach targets likely root causes AND has plausible delivery mechanisms.

| Component | Weight | Description |
|---|---|---|
| Root cause match | 30 | 0=symptom/scapegoat, 30=targets primary causes |
| Mechanism plausibility | 25 | 0=vague promises, 25=clear mechanism + constraints |
| Local deliverability | 20 | 0=national-only, 20=strong local levers |
| Trade-offs acknowledged | 15 | 0=no constraints, 15=budget/time/legal constraints shown |
| Evidence grounding | 10 | 0=rhetorical, 10=grounded in ONS/IFS/NAO |

Evidence quality grade: A (ONS/IFS/NAO/Resolution Foundation), B (reputable journalism/think tanks), C (party materials/opinion-heavy).

## Credibility Score (0-100)
Measures accuracy of high-impact factual claims. Start at 100, subtract weighted penalties.

Penalties: True=0, Mostly true=-5, Misleading=-15, False=-30, Unverified=-10
Weight by reach: 1=niche, 2=repeated by senior figures, 3=central narrative/high-viral

## Track Record Score (0-100)
Verdicts: Kept (+10), Partially Kept (+5), Failed (-10), Inconclusive (0)
Weight by prominence: 1=minor pledge, 2=significant commitment, 3=central manifesto promise

Formula: `Track Record Score = 50 + (Weighted_Score / Range) * 50`
(50=neutral, 0=all failed, 100=all kept)

## Combined Presentation
Never "Vote for X." Output:
- "Based on your interests, these parties' *policies appear most aligned* with root causes."
- "Here is what we've verified about each party's *factual claims*."
- "Here is how consistently each party has *delivered on past promises*."

If combined score shown: user-tunable weighting with explicit disclaimer that it's a presentation aid, not objective truth.
