-- Editable three-image collage for the Templates page hero.
create table if not exists public.template_hero_images (
  slot smallint primary key check (slot between 1 and 3),
  storage_path text not null,
  alt_en text not null default '',
  alt_fa text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.template_hero_images enable row level security;

drop policy if exists "template_hero_public_read" on public.template_hero_images;
create policy "template_hero_public_read"
  on public.template_hero_images for select
  using (true);

drop policy if exists "template_hero_admin_insert" on public.template_hero_images;
create policy "template_hero_admin_insert"
  on public.template_hero_images for insert
  with check (is_bioplot_admin());

drop policy if exists "template_hero_admin_update" on public.template_hero_images;
create policy "template_hero_admin_update"
  on public.template_hero_images for update
  using (is_bioplot_admin())
  with check (is_bioplot_admin());

drop policy if exists "template_hero_admin_delete" on public.template_hero_images;
create policy "template_hero_admin_delete"
  on public.template_hero_images for delete
  using (is_bioplot_admin());
