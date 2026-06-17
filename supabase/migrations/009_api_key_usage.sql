-- Atomic API-key quota enforcement.
--
-- Replaces the old read-then-write pattern (which had a race) with a single
-- function that resets the monthly counter when the window rolls over, increments
-- usage, and reports whether the call is within quota — all in one statement.

create or replace function increment_api_key_usage(p_key_hash text)
returns table(allowed boolean, requests_this_month int, monthly_limit int)
language plpgsql
as $$
declare
  v_row api_keys%rowtype;
begin
  select * into v_row from api_keys where key_hash = p_key_hash and is_active = true for update;

  if not found then
    return; -- no rows → caller treats as invalid key
  end if;

  -- Roll the monthly window if it has elapsed.
  if v_row.last_reset_at < date_trunc('month', now()) then
    update api_keys
      set requests_this_month = 0, last_reset_at = now()
      where id = v_row.id;
    v_row.requests_this_month := 0;
  end if;

  if v_row.requests_this_month >= v_row.monthly_limit then
    return query select false, v_row.requests_this_month, v_row.monthly_limit;
    return;
  end if;

  update api_keys
    set requests_this_month = requests_this_month + 1
    where id = v_row.id
    returning api_keys.requests_this_month into v_row.requests_this_month;

  return query select true, v_row.requests_this_month, v_row.monthly_limit;
end;
$$;
