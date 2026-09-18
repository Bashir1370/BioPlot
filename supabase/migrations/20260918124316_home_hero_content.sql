create table public.home_hero_content (
 id smallint primary key check (id = 1),
 content jsonb not null default '{}'::jsonb check (jsonb_typeof(content) = 'object'),
 updated_by uuid references auth.users(id) on delete set null,
 updated_at timestamptz not null default now()
);
alter table public.home_hero_content enable row level security;
revoke all on public.home_hero_content from public, anon, authenticated;
grant select on public.home_hero_content to anon, authenticated;
grant insert, update on public.home_hero_content to authenticated;
create policy home_content_read on public.home_hero_content for select to anon, authenticated using (true);
create policy home_content_admin_insert on public.home_hero_content for insert to authenticated with check (public.is_bioplot_admin() and updated_by = (select auth.uid()));
create policy home_content_admin_update on public.home_hero_content for update to authenticated using (public.is_bioplot_admin()) with check (public.is_bioplot_admin() and updated_by = (select auth.uid()));
