-- 20260926000000_conventions.sql
--
-- Redline's first migration. It creates no table, because this ticket needs
-- none: the reader's identity is Supabase's own `auth.users`, and a table that
-- only restated a row of it would be a second, staler answer to the same
-- question. The library (ticket 12) and the reader's red lines (ticket 11) own
-- their own schema and will add their own migrations.
--
-- What it does establish is the shape every later migration follows, plus the one
-- piece of plumbing they will all want.
--
--
-- CONVENTIONS FOR EVERY TABLE ADDED AFTER THIS
--
-- 1. Tables live in `public`. Supabase's API exposes that schema; a table
--    somewhere else is a table the application cannot read.
--
-- 2. `alter table … enable row level security;` is part of creating the table,
--    in the same migration, never a follow-up. An unprotected table in a
--    project whose anon key ships to the browser is readable by anybody who
--    opens the site. RLS on with no policy denies everything, which is the
--    right direction to fail in.
--
-- 3. A row belonging to a reader carries
--      `reader_id uuid not null references auth.users (id) on delete cascade`
--    and is reached through policies keyed on `(select auth.uid()) = reader_id`.
--    The `select` wrapper matters: it lets Postgres evaluate auth.uid() once for
--    the statement instead of once per row.
--
-- 4. Policies are written one per command — select, insert, update, delete —
--    and named for what they permit, so a `\d` of the table reads as a list of
--    what is allowed rather than a single opaque `using` clause.
--
-- 5. Every table carries `created_at timestamptz not null default now()`. A
--    table whose rows are edited also carries `updated_at timestamptz not null
--    default now()` and the trigger below, so the column cannot drift from the
--    truth by someone forgetting to set it.
--
-- 6. Deletion is real deletion. ADR 0005 has the library expiring on its own
--    clock and a reader able to withdraw a document immediately and completely;
--    nothing here is soft-deleted with a flag, because a flag leaves the
--    document text in the database.

-- The trigger function every table with an `updated_at` attaches.
--
-- `security invoker` so it runs as whoever wrote the row rather than as its
-- definer, and an empty `search_path` so the resolution of every name in the
-- body is pinned at creation and cannot be redirected by a caller's own
-- search_path.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.touch_updated_at() is
  'Sets updated_at to now() on the row being written. Attach as: create trigger <table>_touch_updated_at before update on public.<table> for each row execute function public.touch_updated_at();';

-- Nothing but the definer and the two Supabase API roles need to call it.
revoke execute on function public.touch_updated_at() from public;
grant execute on function public.touch_updated_at() to authenticated, anon, service_role;
