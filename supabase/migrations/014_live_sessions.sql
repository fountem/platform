-- 014_live_sessions.sql
-- Live video/audio fact-checking (paste a live URL → streaming claim verdicts).
--
-- Design constraints (see context/legal/defamation-liability-memo.md):
--   * Live output is PROVISIONAL and unreviewed → owner-only, NO public read.
--   * Never auto-published to the archive or bot; promotion requires human review.
--   * Raw audio is never stored — only transcript text + claim verdicts, with a
--     retention TTL enforced out-of-band (see B4 retention job).

-- ─── Allow the live quota product ───────────────────────────────────────────
alter table public.user_usage drop constraint if exists user_usage_product_check;
alter table public.user_usage add constraint user_usage_product_check
  check (product in ('unfaked', 'fountem', 'unfaked_live'));

-- ─── Sessions ───────────────────────────────────────────────────────────────
create table if not exists public.live_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  source_kind text not null default 'live_url'
    check (source_kind in ('live_url', 'mic', 'tab', 'upload')),
  source_ref text,
  source_title text,
  status text not null default 'active'
    check (status in ('active', 'ended', 'error')),
  claim_count integer not null default 0,
  election_mode boolean not null default false,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);

create index if not exists idx_live_sessions_user on public.live_sessions(user_id);
create index if not exists idx_live_sessions_status on public.live_sessions(status);

-- ─── Transcript chunks ──────────────────────────────────────────────────────
create table if not exists public.live_transcript_chunks (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  speaker_label text,
  text text not null,
  ts_start_ms integer,
  ts_end_ms integer,
  processed_for_claims boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_live_chunks_session on public.live_transcript_chunks(session_id, created_at);
create index if not exists idx_live_chunks_unprocessed
  on public.live_transcript_chunks(session_id) where processed_for_claims = false;

-- ─── Claims (the live feed) ─────────────────────────────────────────────────
create table if not exists public.live_claims (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references public.live_sessions(id) on delete cascade,
  transcript_excerpt text,
  claim_text text not null,
  speaker_label text,
  status text not null default 'pending'
    check (status in ('pending', 'checking', 'supported', 'disputed', 'needs_context', 'unverifiable', 'error')),
  verdict_summary text,
  correction text,
  what_would_change_this text,
  confidence_pct integer check (confidence_pct between 0 and 100),
  source_citations jsonb not null default '[]',
  claim_hash text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_live_claims_session_status on public.live_claims(session_id, status);
create unique index if not exists idx_live_claims_session_hash
  on public.live_claims(session_id, claim_hash) where claim_hash is not null;

-- ─── RLS: owner-only, no public read ────────────────────────────────────────
alter table public.live_sessions enable row level security;
alter table public.live_transcript_chunks enable row level security;
alter table public.live_claims enable row level security;

-- Owners may read their own live data. All writes go through the service role
-- (gateway/worker) — there are deliberately no insert/update policies for users.
drop policy if exists live_sessions_select_own on public.live_sessions;
create policy live_sessions_select_own on public.live_sessions
  for select using (auth.uid() = user_id);

drop policy if exists live_chunks_select_own on public.live_transcript_chunks;
create policy live_chunks_select_own on public.live_transcript_chunks
  for select using (
    exists (select 1 from public.live_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

drop policy if exists live_claims_select_own on public.live_claims;
create policy live_claims_select_own on public.live_claims
  for select using (
    exists (select 1 from public.live_sessions s where s.id = session_id and s.user_id = auth.uid())
  );

-- ─── Atomic claim counter (denormalised for caps/UX) ────────────────────────
create or replace function public.increment_live_claim_count(p_session_id uuid)
returns integer
language plpgsql
security definer set search_path = public
as $$
declare
  new_count integer;
begin
  update public.live_sessions
  set claim_count = claim_count + 1
  where id = p_session_id
  returning claim_count into new_count;
  return new_count;
end;
$$;

-- ─── Realtime: push claim + transcript changes to the owner's live console ───
-- (Supabase Realtime respects RLS, so only the owner receives their rows.)
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.live_claims;
    alter publication supabase_realtime add table public.live_transcript_chunks;
  end if;
exception
  when duplicate_object then null; -- already in publication
end $$;
