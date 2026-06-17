-- Auth, per-account usage quotas, and a global daily budget circuit-breaker.
-- Public browsing stays open; running a check/verify requires a signed-in user
-- (or a B2B API key). This is the primary defence against credit-burn abuse.

-- ─── Profiles (1:1 with auth.users) ─────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Per-user daily usage ───────────────────────────────────
create table if not exists public.user_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  usage_date date not null default current_date,
  product text not null check (product in ('unfaked', 'fountem')),
  count integer not null default 0,
  primary key (user_id, usage_date, product)
);

-- Atomically increment and enforce a per-user daily limit.
-- Returns whether the call is allowed plus current usage.
create or replace function public.increment_user_usage(
  p_user_id uuid,
  p_product text,
  p_limit integer
)
returns table (allowed boolean, used integer, day_limit integer)
language plpgsql
security definer set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.user_usage (user_id, usage_date, product, count)
  values (p_user_id, current_date, p_product, 0)
  on conflict (user_id, usage_date, product) do nothing;

  select count into current_count
  from public.user_usage
  where user_id = p_user_id and usage_date = current_date and product = p_product
  for update;

  if current_count >= p_limit then
    return query select false, current_count, p_limit;
    return;
  end if;

  update public.user_usage
  set count = count + 1
  where user_id = p_user_id and usage_date = current_date and product = p_product
  returning count into current_count;

  return query select true, current_count, p_limit;
end;
$$;

-- ─── Global daily budget circuit-breaker ────────────────────
create table if not exists public.service_budget (
  budget_date date not null default current_date,
  product text not null,
  count integer not null default 0,
  primary key (budget_date, product)
);

-- Atomically increment and enforce a global daily cap across all users.
-- Bounds total paid-API spend even if individual quotas are bypassed.
create or replace function public.increment_global_budget(
  p_product text,
  p_cap integer
)
returns table (allowed boolean, used integer, cap integer)
language plpgsql
security definer set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.service_budget (budget_date, product, count)
  values (current_date, p_product, 0)
  on conflict (budget_date, product) do nothing;

  select count into current_count
  from public.service_budget
  where budget_date = current_date and product = p_product
  for update;

  if current_count >= p_cap then
    return query select false, current_count, p_cap;
    return;
  end if;

  update public.service_budget
  set count = count + 1
  where budget_date = current_date and product = p_product
  returning count into current_count;

  return query select true, current_count, p_cap;
end;
$$;

-- ─── RLS ────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.user_usage enable row level security;
alter table public.service_budget enable row level security;

-- Owners can read their own profile + usage. All writes go through SECURITY
-- DEFINER functions / the service role. service_budget is service-role only.
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id);

drop policy if exists user_usage_select_own on public.user_usage;
create policy user_usage_select_own on public.user_usage
  for select using (auth.uid() = user_id);
