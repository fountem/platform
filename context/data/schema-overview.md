# Fountem — Data Schema Overview

## Supabase Tables (production: pubjwxyslvcsmdiiaisd.supabase.co)

All 11 tables were created via SQL Editor migration on June 16, 2026.

### evidence_sources
Indexed primary source documents (ONS, IFS, Hansard, Full Fact, Resolution Foundation, NAO).
Fields: id, source_type, title, url, publisher, published_at, retrieved_at, raw_text, is_active

### evidence_chunks
150-300 token semantic units with pgvector embeddings (1536 dims, OpenAI text-embedding-3-small).
Fields: id, source_id, chunk_index, content, content_tsv, embedding, topic_tags[], party_relevance[]
Indexes: ivfflat on embedding (cosine), gin on content_tsv, gin on topic_tags

### claims
Political statements submitted for verification.
Fields: id, claim_text, claim_type, speaker, party, spoken_at, source_url, submitted_by, status
Claim types: statistic, policy, historical, prediction, deepfake_video, deepfake_audio, ai_generated_image

### verdicts
Output of RAG pipeline. Always includes what_would_change_this (falsifiability statement).
Fields: id, claim_id, verdict, confidence_pct, summary, reasoning, what_would_change_this, evidence_chunk_ids[], source_citations (jsonb), model_used, probable_generator, evasion_detected
Verdicts: true, mostly_true, half_true, mostly_false, false, misleading, unverifiable, inconclusive

### video_detections
Output of Unfaked 3-layer detection pipeline. Powers the public archive at /cases.
Fields: id, claim_id, video_url, video_hash, verdict, confidence_pct, probable_generator, evasion_detected, layer1_signals (jsonb), layer2_signals (jsonb), layer3_signals (jsonb), is_public, case_title
Verdicts: ai_generated, likely_ai_generated, inconclusive, likely_real, real
Generators: veo, kling, runway, sora, luma, pika, unknown

### parties
5 parties with slugs. See parties.csv for seed data.

### issues
5 issues with descriptions. See issues.csv for seed data.

### party_issue_positions
5×5 matrix (parties × issues) with position summaries and alignment scores.
Fields: id, party_id, issue_id, position_summary, stated_commitment, source_url, source_date

### track_record_scores
Evidence-derived scores (not editorial) per party per issue.
Fields: id, party_id, issue_id, score (0-100), score_reasoning, evidence_chunk_ids[], calculated_at

### correction_packs
Shareable verdict artefacts. URL format: unfaked.ai/c/[slug]
Fields: id, slug, verdict_id, detection_id, og_image_url, share_count

### api_keys
B2B licensing. Key hash stored only — raw key shown once on creation.
Fields: id, key_hash, label, organisation, tier (free/newsroom/enterprise), monthly_limit, requests_this_month

## Seed Data Status (June 16, 2026)
- Parties: 5 records ✅
- Issues: 5 records ✅
- Interest Map: 5 records ✅
- Claims: 2 records (ref-imm-001, ref-imm-002) ✅
- Evidence: 2 records ✅
- Verdicts: 2 records ✅
- Commitments: 5 records (one per party, all inconclusive) ✅
- Track Record Scores: 5 records (all inconclusive pending population) ✅
- Party Issue Positions: 0 records — NEEDS POPULATION
- Evidence Sources: 0 records — run scripts/seed-evidence.ts
- Evidence Chunks: 0 records — run scripts/seed-evidence.ts

## Priority Data Work
1. Run `scripts/seed-evidence.ts` to populate evidence_sources + evidence_chunks
2. Populate party_issue_positions (5×5=25 rows) — hardest content task
3. Run `scripts/eval-harness.ts` to validate RAG pipeline
