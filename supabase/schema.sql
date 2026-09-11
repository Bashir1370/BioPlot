-- BioPlot v3 Supabase foundation
create extension if not exists pgcrypto;

create table if not exists public.bioplot_projects (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled scientific figure',
  document jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bioplot_projects_user_updated_idx
  on public.bioplot_projects(user_id, updated_at desc);

alter table public.bioplot_projects enable row level security;

drop policy if exists "Users read own BioPlot projects" on public.bioplot_projects;
create policy "Users read own BioPlot projects"
  on public.bioplot_projects for select
  using (auth.uid() = user_id);

drop policy if exists "Users create own BioPlot projects" on public.bioplot_projects;
create policy "Users create own BioPlot projects"
  on public.bioplot_projects for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users update own BioPlot projects" on public.bioplot_projects;
create policy "Users update own BioPlot projects"
  on public.bioplot_projects for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own BioPlot projects" on public.bioplot_projects;
create policy "Users delete own BioPlot projects"
  on public.bioplot_projects for delete
  using (auth.uid() = user_id);

create table if not exists public.bioplot_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  slug text unique,
  name text not null,
  category text not null,
  synonyms_en text[] not null default '{}',
  synonyms_fa text[] not null default '{}',
  svg text not null,
  color_slots jsonb not null default '[]'::jsonb,
  review_status text not null default 'draft' check (review_status in ('draft','reviewed')),
  premium boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bioplot_assets enable row level security;

drop policy if exists "Reviewed assets are readable" on public.bioplot_assets;
create policy "Reviewed assets are readable"
  on public.bioplot_assets for select
  using (review_status = 'reviewed' or auth.uid() = owner_id);

drop policy if exists "Users manage own assets" on public.bioplot_assets;
create policy "Users manage own assets"
  on public.bioplot_assets for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Realtime collaboration uses Supabase broadcast/presence channels and therefore
-- does not require a document-change table. Persistent version history can be
-- added later without changing the editor document schema.
