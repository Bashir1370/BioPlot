create table if not exists public.home_hero_images (
slot smallint primary key check (slot between 1 and 16),
storage_path text not null check (storage_path like 'home-hero/%'),
alt_en text not null default '', alt_fa text not null default '',
updated_by uuid references auth.users(id) on delete set null,
updated_at timestamptz not null default now());
alter table public.home_hero_images enable row level security;
revoke all on public.home_hero_images from public, anon, authenticated;
grant select on public.home_hero_images to anon, authenticated;
grant insert, update, delete on public.home_hero_images to authenticated;
create policy home_hero_public_read on public.home_hero_images for select to anon, authenticated using (true);
create policy home_hero_admin_insert on public.home_hero_images for insert to authenticated with check (public.is_bioplot_admin() and updated_by = (select auth.uid()));
create policy home_hero_admin_update on public.home_hero_images for update to authenticated using (public.is_bioplot_admin()) with check (public.is_bioplot_admin() and updated_by = (select auth.uid()));
create policy home_hero_admin_delete on public.home_hero_images for delete to authenticated using (public.is_bioplot_admin());
