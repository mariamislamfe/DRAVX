-- DRAVX store: run once in Supabase → SQL Editor.
-- The app talks to Supabase from the server only, with the service-role key,
-- so row level security stays on with no policies (nobody else can read it).

create table if not exists public.store (
  id integer primary key,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.store enable row level security;

-- Private bucket for product photos and customer designs.
-- The site serves them through /uploads/<name>.
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', false)
on conflict (id) do nothing;
