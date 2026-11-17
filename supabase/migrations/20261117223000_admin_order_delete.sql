begin;
-- Delete through a single atomic, administrator-only RPC; direct DELETE remains denied.
create or replace function public.delete_design_order(p_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not coalesce(public.is_bioplot_admin(),false) then
  raise exception 'UNAUTHORIZED' using errcode='42501';
 end if;
 perform 1 from public.design_orders where id=p_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 delete from public.design_order_reads where order_id=p_id;
 delete from public.design_order_messages where order_id=p_id;
 delete from public.design_order_events where order_id=p_id;
 delete from public.design_order_files where order_id=p_id;
 delete from public.design_orders where id=p_id;
 -- Storage binaries stay private and may be cleaned separately through the Storage API.
end;
$$;
revoke all on function public.delete_design_order(uuid) from public,anon;
grant execute on function public.delete_design_order(uuid) to authenticated;
commit;
