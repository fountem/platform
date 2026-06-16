create table correction_packs (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  verdict_id uuid references verdicts(id),
  detection_id uuid references video_detections(id),
  og_image_url text,
  share_count int default 0,
  created_at timestamptz default now()
);

create table api_keys (
  id uuid primary key default uuid_generate_v4(),
  key_hash text unique not null,
  label text,
  organisation text,
  tier text default 'free' check (tier in ('free', 'newsroom', 'enterprise')),
  monthly_limit int default 100,
  requests_this_month int default 0,
  last_reset_at timestamptz default now(),
  is_active boolean default true,
  created_at timestamptz default now()
);
