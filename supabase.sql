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
