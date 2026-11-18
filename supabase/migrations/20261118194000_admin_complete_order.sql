begin;
create or replace function public.complete_design_order(p_id uuid,p_expected_updated_at timestamptz,p_note text default '')
returns public.design_orders language plpgsql security definer set search_path=public as $$
declare o public.design_orders;
begin
 if auth.uid() is null or not coalesce(public.is_bioplot_admin(),false) then raise exception 'UNAUTHORIZED' using errcode='42501'; end if;
 select * into o from public.design_orders where id=p_id for update;
 if not found then raise exception 'ORDER_NOT_FOUND'; end if;
 if o.updated_at is distinct from p_expected_updated_at then raise exception 'ORDER_CHANGED'; end if;
 if o.status not in ('approved','delivered') then raise exception 'INVALID_TRANSITION'; end if;
 if char_length(coalesce(p_note,''))>6000 then raise exception 'INVALID_NOTE'; end if;
 update public.design_orders set status='completed',updated_at=clock_timestamp() where id=p_id returning * into o;
 insert into public.design_order_events(order_id,actor_id,status,detail)
 values(p_id,auth.uid(),'completed',jsonb_build_object('note',trim(coalesce(p_note,'')),'closed_by_admin',true));
 return o;
end;$$;
revoke all on function public.complete_design_order(uuid,timestamptz,text) from public,anon;
grant execute on function public.complete_design_order(uuid,timestamptz,text) to authenticated;
commit;
