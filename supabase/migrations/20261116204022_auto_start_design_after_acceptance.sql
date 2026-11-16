-- Start the agreed design window when the customer explicitly accepts a proposal.
create or replace function public.advance_design_order(p_id uuid,p_expected_updated_at timestamptz,p_status text,p_note text default '',p_quote jsonb default null)
returns public.design_orders language plpgsql security definer set search_path=public as $$
declare o public.design_orders; admin boolean; allowed boolean:=false; event_detail jsonb;
begin
 if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
 select * into o from public.design_orders where id=p_id for update;
 admin:=public.is_bioplot_admin();
 if not found or not (o.user_id=auth.uid() or admin) then raise exception 'UNAUTHORIZED'; end if;
 if p_expected_updated_at is distinct from o.updated_at then raise exception 'ORDER_CHANGED'; end if;
 if char_length(coalesce(p_note,''))>6000 then raise exception 'NOTE_TOO_LONG'; end if;
 if admin then
  allowed:=case o.status when 'submitted' then p_status in ('reviewing','cancelled') when 'reviewing' then p_status in ('quoted','cancelled') when 'quoted' then p_status in ('reviewing','cancelled') when 'accepted' then p_status='designing' when 'designing' then p_status='review' when 'approved' then p_status='delivered' when 'revision_requested' then p_status in ('designing','quoted') when 'delivered' then p_status='completed' else false end;
 end if;
 if not allowed and o.user_id=auth.uid() then
  allowed:=case o.status when 'submitted' then p_status='cancelled' when 'reviewing' then p_status='cancelled' when 'quoted' then p_status in ('accepted','cancelled') when 'review' then p_status in ('approved','revision_requested') when 'delivered' then p_status in ('revision_requested','completed') else false end;
 end if;
 if not allowed then raise exception 'INVALID_TRANSITION'; end if;
 if p_status in ('revision_requested','cancelled') and char_length(trim(coalesce(p_note,'')))<3 then raise exception 'NOTE_REQUIRED'; end if;
 if p_status='quoted' then
  if p_quote is null or coalesce((p_quote->>'amount')::numeric,0)<=0 or coalesce(char_length(trim(p_quote->>'scope')),0)<10 or char_length(p_quote->>'scope')>6000
   or coalesce((p_quote->>'days')::integer,0) not between 1 and 365 or coalesce((p_quote->>'revisions')::integer,-1) not between 0 and 20
   or coalesce(p_quote->>'currency','') not in ('IRT','USD','EUR') then raise exception 'INVALID_QUOTE'; end if;
  o.quote_amount:=(p_quote->>'amount')::numeric;o.quote_currency:=p_quote->>'currency';o.quote_scope:=trim(p_quote->>'scope');o.quote_days:=(p_quote->>'days')::integer;o.quote_revisions:=(p_quote->>'revisions')::integer;
 end if;
 if p_status in ('review','delivered') and not exists(select 1 from public.design_order_files where order_id=p_id and kind=case p_status when 'review' then 'preview' else 'final' end and created_at>=coalesce((select max(created_at) from public.design_order_events where order_id=p_id and status='designing'),o.created_at)) then raise exception 'FILES_REQUIRED'; end if;
 event_detail:=jsonb_build_object('note',coalesce(p_note,''));
 if p_status in ('quoted','accepted') then event_detail:=event_detail||jsonb_build_object('amount',o.quote_amount,'currency',o.quote_currency,'scope',o.quote_scope,'days',o.quote_days,'revisions',o.quote_revisions); end if;
 if p_status='accepted' then event_detail:=event_detail||jsonb_build_object('delivery_due_at',clock_timestamp()+o.quote_days*interval '24 hours'); end if;
 update public.design_orders set status=p_status,quote_amount=o.quote_amount,quote_currency=o.quote_currency,quote_scope=o.quote_scope,quote_days=o.quote_days,quote_revisions=o.quote_revisions,
 revision_round=case when p_status='quoted' then 0 else revision_round+case when p_status='revision_requested' then 1 else 0 end end,updated_at=clock_timestamp() where id=p_id returning * into o;
 insert into public.design_order_events(order_id,actor_id,status,detail) values(p_id,auth.uid(),p_status,event_detail);
 if p_status='accepted' then
  -- Keep consent and production start atomic; customers cannot request arbitrary design transitions.
  update public.design_orders set status='designing',updated_at=clock_timestamp() where id=p_id returning * into o;
  insert into public.design_order_events(order_id,actor_id,status,detail)
   values(p_id,auth.uid(),'designing',jsonb_build_object('automatic',true,'delivery_due_at',event_detail->'delivery_due_at'));
 end if;
 return o;
end;$$;
revoke all on function public.advance_design_order(uuid,timestamptz,text,text,jsonb) from public,anon;
grant execute on function public.advance_design_order(uuid,timestamptz,text,text,jsonb) to authenticated;
