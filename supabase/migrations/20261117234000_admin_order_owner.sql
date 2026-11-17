begin;
create or replace function public.get_design_order_owner(p_order_id uuid)
returns table(full_name text)
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not coalesce(public.is_bioplot_admin(),false) then
  raise exception 'UNAUTHORIZED' using errcode='42501';
 end if;
 return query
 select coalesce(
  nullif(trim(concat_ws(' ',nullif(trim(u.raw_user_meta_data->>'first_name'),''),nullif(trim(u.raw_user_meta_data->>'last_name'),''))),''),
  nullif(trim(p.display_name),''),
  nullif(trim(u.raw_user_meta_data->>'display_name'),''),
  ''
 )
 from public.design_orders o join auth.users u on u.id=o.user_id
 left join public.profiles p on p.id=u.id where o.id=p_order_id;
end;
$$;
revoke all on function public.get_design_order_owner(uuid) from public,anon;
grant execute on function public.get_design_order_owner(uuid) to authenticated;
commit;
