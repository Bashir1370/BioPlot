-- BioPlot public portfolio showcase managed by authenticated admins.
create table if not exists public.portfolio_showcase_items (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  source_project_id text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_showcase_sort_idx
  on public.portfolio_showcase_items(sort_order asc, created_at asc);

alter table public.portfolio_showcase_items enable row level security;

drop policy if exists "portfolio_showcase_public_read" on public.portfolio_showcase_items;
create policy "portfolio_showcase_public_read"
  on public.portfolio_showcase_items for select
  using (active = true);

drop policy if exists "portfolio_showcase_admin_read_all" on public.portfolio_showcase_items;
create policy "portfolio_showcase_admin_read_all"
  on public.portfolio_showcase_items for select
  using (is_bioplot_admin());

drop policy if exists "portfolio_showcase_admin_insert" on public.portfolio_showcase_items;
create policy "portfolio_showcase_admin_insert"
  on public.portfolio_showcase_items for insert
  with check (is_bioplot_admin() and created_by = auth.uid());

drop policy if exists "portfolio_showcase_admin_update" on public.portfolio_showcase_items;
create policy "portfolio_showcase_admin_update"
  on public.portfolio_showcase_items for update
  using (is_bioplot_admin())
  with check (is_bioplot_admin());

drop policy if exists "portfolio_showcase_admin_delete" on public.portfolio_showcase_items;
create policy "portfolio_showcase_admin_delete"
  on public.portfolio_showcase_items for delete
  using (is_bioplot_admin());
