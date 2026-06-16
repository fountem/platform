create table claims (
  id uuid primary key default uuid_generate_v4(),
  claim_text text not null,
  claim_type text not null check (claim_type in (
    'statistic', 'policy', 'historical', 'prediction',
    'deepfake_video', 'deepfake_audio', 'ai_generated_image'
  )),
  speaker text,
  party text,
  spoken_at date,
  source_url text,
  source_context text,
  submitted_by text default 'public',
  status text default 'pending' check (
    status in ('pending', 'processing', 'complete', 'failed', 'archived')
  ),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table verdicts (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid references claims(id) on delete cascade,
  verdict text not null check (verdict in (
    'true', 'mostly_true', 'half_true', 'mostly_false', 'false',
    'misleading', 'unverifiable', 'inconclusive'
  )),
  confidence_pct int check (confidence_pct between 0 and 100),
  summary text not null,
  reasoning text not null,
  what_would_change_this text,
  evidence_chunk_ids uuid[] default '{}',
  source_citations jsonb default '[]',
  model_used text default 'claude-sonnet-4-6',
  prompt_tokens int,
  completion_tokens int,
  reviewed_by text,
  reviewed_at timestamptz,
  probable_generator text,
  evasion_detected text,
  created_at timestamptz default now()
);

create index idx_verdicts_claim on verdicts(claim_id);
create index idx_claims_status on claims(status);
create index idx_claims_party on claims(party);
