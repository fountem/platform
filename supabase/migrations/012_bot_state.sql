-- X bot idempotency state.
-- The @unfaked bot polls mentions every 5 minutes. Without persisted state it
-- re-fetches and re-replies to the same mentions on every run (duplicate-reply
-- spam). These tables let the bot (a) advance a since_id cursor so it only pulls
-- new mentions, and (b) atomically claim each tweet so it is answered once.
-- Both are internal: written only by the service role (RLS on, no policies).

-- ─── Cursor: highest mention id processed per bot ────────────
create table if not exists public.bot_cursor (
  bot text primary key,
  since_id text,
  updated_at timestamptz not null default now()
);

-- ─── Per-mention claim / dedupe ─────────────────────────────
create table if not exists public.processed_mentions (
  tweet_id text primary key,
  replied boolean not null default false,
  processed_at timestamptz not null default now()
);

-- ─── RLS ────────────────────────────────────────────────────
-- Enable RLS with no policies: anon/authenticated get no access; the service
-- role (used by /api/cron) bypasses RLS. These are not user-facing tables.
alter table public.bot_cursor enable row level security;
alter table public.processed_mentions enable row level security;
