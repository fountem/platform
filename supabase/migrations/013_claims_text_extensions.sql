-- 013_claims_text_extensions.sql
-- Text verification on Unfaked (shared engine, two front doors).
-- Adds claim provenance/dedup columns, a general claim type, and broadens the
-- evidence source taxonomy so the open-web evidence layer can persist sources.

-- 1. Claims: track origin, owner, and a dedup hash so identical claims are cached
--    (and don't burn quota) — parity with video_detections' video_hash cache.
alter table claims add column if not exists input_kind text
  check (input_kind in ('text', 'video', 'live'));
alter table claims add column if not exists claim_hash text;
alter table claims add column if not exists user_id uuid references auth.users(id) on delete set null;

create unique index if not exists idx_claims_claim_hash on claims(claim_hash) where claim_hash is not null;
create index if not exists idx_claims_user on claims(user_id);
create index if not exists idx_claims_input_kind on claims(input_kind);

-- 2. Allow a general-purpose claim type (Unfaked checks beyond UK fiscal stats).
alter table claims drop constraint if exists claims_claim_type_check;
alter table claims add constraint claims_claim_type_check check (claim_type in (
  'statistic', 'policy', 'historical', 'prediction',
  'deepfake_video', 'deepfake_audio', 'ai_generated_image',
  'general'
));

-- 3. Broaden the evidence source taxonomy for open-web augmentation. Existing
--    primary-source types are retained; new general/web tiers are added.
alter table evidence_sources drop constraint if exists evidence_sources_source_type_check;
alter table evidence_sources add constraint evidence_sources_source_type_check check (source_type in (
  'ons', 'ifs', 'hansard', 'full_fact', 'resolution_foundation',
  'nao', 'bbc_reality_check', 'academic', 'government',
  'web', 'news', 'fact_checker', 'official', 'reference'
));

-- Note: per-citation source_tier ('primary' | 'web') is stored inside the
-- verdicts.source_citations JSONB payload — no column change required.
