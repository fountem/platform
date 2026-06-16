# Live Case Study — Wakefield Deepfake (March 2026)

**Date:** 27 March 2026
**Source:** BBC News West Yorkshire
**Claim ID:** deepfake-wakefield-001
**Election context:** UK local elections, May 2026

## What Happened
Wakefield councillor Armaan Khan (Normanton, Warmfield, Kirkthorpe and Heath) had an image doctored using AI. The original showed the group standing in open fields. The manipulated version placed them next to a housing estate — implying support for a development Khan had actively opposed at planning committee.

This follows a similar March 2026 York politician deepfake incident and a BBC investigation uncovering overseas content farms producing political deepfakes at scale.

The National Association of Councillors called the practice "widespread" and warned it "undermines democracy."

## Why This Matters for Fountem
1. The gap is real and documented — no fast, structured, shareable correction mechanism existed
2. Validates Correction Packs feature (#3 in roadmap)  
3. Validates Unfaked product case — bot could have replied within 30 seconds
4. It's a provenance problem as much as a detection problem — validates C2PA layer
5. Pattern is coordinated, not isolated — validates Narrative Tracker feature

## What Fountem Would Have Done
| Stage | What happened | What Fountem/Unfaked would do |
|---|---|---|
| Image circulates | Spreads on social media | User tags @unfaked_ai on the post |
| Verdict | None until BBC article | Bot replies in <30s: "⚠️ Manipulated image — original shows open fields, not housing estate." |
| Correction spreads | Councillor posts manually | Correction Pack: X reply, WhatsApp card, screenshot card |
| Narrative tracked | One-off news story | Narrative Tracker: "AI manipulation targeting local councillors — 3 incidents, March 2026" |

## Database Entry
- Claim ID: deepfake-wakefield-001
- Claim type: deepfake_image  
- Status: confirmed_false
- 3 evidence records: BBC article (primary), York precedent, overseas content farms

## Use In Pitches
This is a live, named, BBC-covered example of exactly the problem JRRT and Luminate applications describe. Use in grant applications and pitch deck.
