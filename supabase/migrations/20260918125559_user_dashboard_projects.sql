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


revoke all on public.bioplot_projects from anon;
grant select, insert, update, delete on public.bioplot_projects to authenticated;
