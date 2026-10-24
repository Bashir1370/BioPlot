-- Apply before the dated feature migrations on a new Supabase project.
-- Existing installations keep their administrator function and auth triggers.
begin;
create table if not exists public.bioplot_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.bioplot_admins enable row level security;
revoke all on public.bioplot_admins from public, anon, authenticated;
do $setup$
begin
 if to_regprocedure('public.is_bioplot_admin()') is null then
  execute 'create function public.is_bioplot_admin() returns boolean language sql stable security definer set search_path=public as $fn$ select exists(select 1 from public.bioplot_admins where user_id=auth.uid()) $fn$';
 end if;
end $setup$;
grant execute on function public.is_bioplot_admin() to anon, authenticated;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text,
 preferred_language text not null default 'en' check(preferred_language in ('en','fa')),
 plan text not null default 'free',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update(display_name,preferred_language,updated_at) on public.profiles to authenticated;
drop policy if exists profiles_own_read on public.profiles;
create policy profiles_own_read on public.profiles for select to authenticated using(id=auth.uid());
drop policy if exists profiles_own_update on public.profiles;
create policy profiles_own_update on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
create or replace function public.create_bioplot_profile() returns trigger language plpgsql security definer set search_path=public as $$
begin
 insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1))) on conflict(id) do nothing;
 return new;
end;$$;
revoke all on function public.create_bioplot_profile() from public,anon,authenticated;
drop trigger if exists bioplot_create_profile on auth.users;
create trigger bioplot_create_profile after insert on auth.users for each row execute function public.create_bioplot_profile();
insert into public.profiles(id,display_name) select id,coalesce(raw_user_meta_data->>'display_name',split_part(email,'@',1)) from auth.users on conflict(id) do nothing;

create table if not exists public.asset_categories (
 slug text primary key, name_en text not null, name_fa text,
 active boolean not null default true, sort_order integer not null default 10,
 updated_at timestamptz not null default now()
);
create table if not exists public.assets (
 id uuid primary key default gen_random_uuid(), name text not null, name_fa text,
 category text not null default 'Uncategorized', keywords text[] not null default '{}', keywords_fa text[] not null default '{}',
 asset_type text not null default 'svg', storage_path text not null default '',
 is_premium boolean not null default false, is_reviewed boolean not null default false, is_published boolean not null default false,
 description_en text, description_fa text, render_svg text not null,
 featured boolean not null default false, sort_order integer not null default 10, version integer not null default 1,
 color_slots jsonb not null default '[]', metadata jsonb not null default '{}',
 created_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into public.asset_categories(slug,name_en) values('Uncategorized','Uncategorized') on conflict(slug) do nothing;
alter table public.assets enable row level security;
alter table public.asset_categories enable row level security;
revoke all on public.assets,public.asset_categories from public,anon,authenticated;
grant select on public.assets,public.asset_categories to anon,authenticated;
grant insert,update,delete on public.assets,public.asset_categories to authenticated;
drop policy if exists assets_public_read on public.assets;
create policy assets_public_read on public.assets for select to anon,authenticated using(is_published or public.is_bioplot_admin());
drop policy if exists assets_admin_write on public.assets;
create policy assets_admin_write on public.assets for all to authenticated using(public.is_bioplot_admin()) with check(public.is_bioplot_admin());
drop policy if exists categories_public_read on public.asset_categories;
create policy categories_public_read on public.asset_categories for select to anon,authenticated using(active or public.is_bioplot_admin());
drop policy if exists categories_admin_write on public.asset_categories;
create policy categories_admin_write on public.asset_categories for all to authenticated using(public.is_bioplot_admin()) with check(public.is_bioplot_admin());
insert into storage.buckets(id,name,public,file_size_limit) values('public-assets','public-assets',true,8000000) on conflict(id) do nothing;
drop policy if exists public_assets_read on storage.objects;
create policy public_assets_read on storage.objects for select to anon,authenticated using(bucket_id='public-assets');
drop policy if exists public_assets_admin_insert on storage.objects;
create policy public_assets_admin_insert on storage.objects for insert to authenticated with check(bucket_id='public-assets' and public.is_bioplot_admin());
drop policy if exists public_assets_admin_update on storage.objects;
create policy public_assets_admin_update on storage.objects for update to authenticated using(bucket_id='public-assets' and public.is_bioplot_admin()) with check(bucket_id='public-assets' and public.is_bioplot_admin());
drop policy if exists public_assets_admin_delete on storage.objects;
create policy public_assets_admin_delete on storage.objects for delete to authenticated using(bucket_id='public-assets' and public.is_bioplot_admin());
commit;
