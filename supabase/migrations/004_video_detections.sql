create table video_detections (
  id uuid primary key default uuid_generate_v4(),
  claim_id uuid references claims(id),
  video_url text,
  video_hash text unique,
  verdict text not null check (verdict in (
    'ai_generated', 'likely_ai_generated', 'inconclusive', 'likely_real', 'real'
  )),
  confidence_pct int check (confidence_pct between 0 and 100),
  probable_generator text,
  reasoning text,
  what_would_change_this text,
  evasion_detected text check (evasion_detected in ('yes', 'no', 'suspected')),
  evasion_description text,
  layer1_signals jsonb,
  layer2_signals jsonb,
  layer3_signals jsonb,
  is_public boolean default true,
  case_title text,
  created_at timestamptz default now()
);

create index idx_detections_verdict on video_detections(verdict);
create index idx_detections_generator on video_detections(probable_generator);
create index idx_detections_public on video_detections(is_public, created_at desc);
