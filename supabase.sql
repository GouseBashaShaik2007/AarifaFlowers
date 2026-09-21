-- Run this once in Supabase: SQL Editor > New query > paste > Run.
-- It creates the place where products and photos are saved when the website is online.

create table if not exists public.products (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- The website talks to this table only from the server, using the service role key.
-- Turning on row level security with no policies keeps the table closed to everyone else.
alter table public.products enable row level security;

-- Public folder for garland photos. Anyone can view photos. Only the server can add or delete them.
insert into storage.buckets (id, name, public)
values ('garlands', 'garlands', true)
on conflict (id) do nothing;

-- WhatsApp tap counts: one number per garland per day. No visitor information is stored.
create table if not exists public.taps (
  product_id text not null,
  day date not null,
  count integer not null default 0,
  primary key (product_id, day)
);

alter table public.taps enable row level security;

create or replace function public.increment_tap(p_id text, p_day date)
returns void
language sql
as $$
  insert into public.taps (product_id, day, count)
  values (p_id, p_day, 1)
  on conflict (product_id, day) do update set count = public.taps.count + 1;
$$;

-- Only the server (service role key) may count taps. Visitors cannot call this directly.
revoke execute on function public.increment_tap(text, date) from public, anon, authenticated;
grant execute on function public.increment_tap(text, date) to service_role;
