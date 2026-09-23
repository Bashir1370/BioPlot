begin;
create table public.design_studio_content (
 id smallint primary key check(id=1),
 content jsonb not null default '{}'::jsonb check(jsonb_typeof(content)='object' and octet_length(content::text)<=500000),
 updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null
);
insert into public.design_studio_content(id) values(1);
alter table public.design_studio_content enable row level security;
revoke all on public.design_studio_content from public,anon,authenticated;
grant select on public.design_studio_content to anon,authenticated;
create policy studio_content_read on public.design_studio_content for select to anon,authenticated using(true);
create function public.save_design_studio_content(p_content jsonb,p_version timestamptz) returns timestamptz
language plpgsql security definer set search_path=public as $$
declare current_version timestamptz; next_version timestamptz;
begin
 if auth.uid() is null or public.is_bioplot_admin() is distinct from true then raise exception 'ADMIN_REQUIRED'; end if;
 select updated_at into current_version from public.design_studio_content where id=1 for update;
 if p_version is null or current_version is distinct from p_version then raise exception 'CONTENT_CHANGED'; end if;
 if jsonb_typeof(p_content) is distinct from 'object' or octet_length(p_content::text)>500000 or jsonb_typeof(p_content->'copy') is distinct from 'object' or jsonb_typeof(p_content->'images') is distinct from 'object' or jsonb_typeof(p_content->'blocks') is distinct from 'array' then raise exception 'CONTENT_INVALID'; end if;
 if jsonb_array_length(p_content->'blocks')>60 then raise exception 'CONTENT_INVALID'; end if;
 next_version=clock_timestamp();
 update public.design_studio_content set content=p_content,updated_at=next_version,updated_by=auth.uid() where id=1;
 return next_version;
end $$;
revoke all on function public.save_design_studio_content(jsonb,timestamptz) from public,anon;
grant execute on function public.save_design_studio_content(jsonb,timestamptz) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('bioplot-studio-media','bioplot-studio-media',true,5242880,array['image/png','image/jpeg','image/webp']);
create policy studio_media_admin_insert on storage.objects for insert to authenticated with check(bucket_id='bioplot-studio-media' and public.is_bioplot_admin());
-- Public marketing images only. Customer reference/delivery files remain in the private orders bucket.
create policy studio_media_read on storage.objects for select to anon,authenticated using(bucket_id='bioplot-studio-media');
commit;
