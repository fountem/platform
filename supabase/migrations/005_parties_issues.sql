create table parties (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  short_name text,
  colour_hex text,
  logo_url text,
  founded_year int,
  current_leader text,
  is_active boolean default true
);

create table issues (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  description text,
  category text
);

create table party_issue_positions (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id),
  issue_id uuid references issues(id),
  position_summary text not null,
  stated_commitment text,
  source_url text,
  source_date date,
  unique(party_id, issue_id)
);

create table track_record_scores (
  id uuid primary key default uuid_generate_v4(),
  party_id uuid references parties(id),
  issue_id uuid references issues(id),
  score int check (score between 0 and 100),
  score_reasoning text,
  evidence_chunk_ids uuid[] default '{}',
  calculated_at timestamptz default now(),
  unique(party_id, issue_id)
);
