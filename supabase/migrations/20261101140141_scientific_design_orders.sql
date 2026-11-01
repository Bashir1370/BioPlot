-- Requires existing public.is_bioplot_admin() and Supabase Auth/Storage.
begin;
create table public.design_orders (
 id uuid primary key, user_id uuid not null references auth.users(id),
 title text not null check(char_length(title) between 3 and 160),
 kind text not null check(kind in ('figure','graphical_abstract','poster')),
 brief jsonb not null check(jsonb_typeof(brief)='object' and octet_length(brief::text)<=30000),
 requested_date date,
 status text not null default 'submitted' check(status in ('submitted','reviewing','quoted','accepted','designing','review','approved','revision_requested','delivered','completed','cancelled')),
 quote_amount numeric(12,2) check(quote_amount>0), quote_currency text check(quote_currency in ('IRT','USD','EUR')),
 quote_scope text, quote_days integer check(quote_days between 1 and 365), quote_revisions integer check(quote_revisions between 0 and 20),
 revision_round integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index design_orders_owner on public.design_orders(user_id,updated_at desc);
create index design_orders_queue on public.design_orders(status,updated_at desc);
create table public.design_order_files (
 id uuid primary key, order_id uuid not null references public.design_orders(id), uploader_id uuid not null references auth.users(id),
 kind text not null check(kind in ('reference','preview','final')), name text not null check(char_length(name) between 1 and 200),
 path text not null unique, size bigint not null check(size between 1 and 20971520), created_at timestamptz not null default now()
);
create table public.design_order_messages (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.design_orders(id),
 author_id uuid not null references auth.users(id), body text not null check(char_length(trim(body)) between 1 and 6000),created_at timestamptz not null default now()
);
create table public.design_order_events (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.design_orders(id),
 actor_id uuid not null references auth.users(id),status text not null,detail jsonb not null default '{}',created_at timestamptz not null default now()
);
create index design_order_files_order on public.design_order_files(order_id,created_at);
create index design_order_messages_order on public.design_order_messages(order_id,created_at);
create index design_order_events_order on public.design_order_events(order_id,created_at);
alter table public.design_orders enable row level security;
alter table public.design_order_files enable row level security;
alter table public.design_order_messages enable row level security;
alter table public.design_order_events enable row level security;
create function public.can_access_design_order(p_id uuid) returns boolean language sql stable security definer set search_path=public as $$
 select auth.uid() is not null and exists(select 1 from public.design_orders where id=p_id and (user_id=auth.uid() or public.is_bioplot_admin()));
$$;
revoke all on function public.can_access_design_order(uuid) from public;
grant execute on function public.can_access_design_order(uuid) to authenticated;
create policy orders_read on public.design_orders for select to authenticated using (user_id=auth.uid() or public.is_bioplot_admin());
create policy files_read on public.design_order_files for select to authenticated using(public.can_access_design_order(order_id));
create policy messages_read on public.design_order_messages for select to authenticated using(public.can_access_design_order(order_id));
create policy events_read on public.design_order_events for select to authenticated using(public.can_access_design_order(order_id));
create policy messages_write on public.design_order_messages for insert to authenticated with check(
 author_id=auth.uid() and public.can_access_design_order(order_id) and exists(select 1 from public.design_orders where id=order_id and status not in ('completed','cancelled'))
);
create policy files_write on public.design_order_files for insert to authenticated with check(
 uploader_id=auth.uid() and public.can_access_design_order(order_id) and (kind='reference' or public.is_bioplot_admin())
 and path=order_id::text||'/'||auth.uid()::text||'/'||id::text||'.'||lower(substring(name from '[^.]+$'))
 and lower(name) ~ '\.(pdf|png|jpe?g|webp|svg|pptx|docx|zip)$'
 and exists(select 1 from storage.objects where bucket_id='bioplot-order-files' and name=path)
 and exists(select 1 from public.design_orders where id=order_id and status not in ('completed','cancelled'))
);
revoke all on public.design_orders,public.design_order_files,public.design_order_messages,public.design_order_events from public,anon,authenticated;
grant select on public.design_orders,public.design_order_files,public.design_order_messages,public.design_order_events to authenticated;
grant insert(id,order_id,uploader_id,kind,name,path,size) on public.design_order_files to authenticated;
grant insert(order_id,author_id,body) on public.design_order_messages to authenticated;
-- Status and financial fields can only change through this validated, atomic API.
create function public.create_design_order(p_id uuid,p_title text,p_kind text,p_brief jsonb,p_requested_date date default null)
returns public.design_orders language plpgsql security definer set search_path=public as $$
declare result public.design_orders;
begin
 if auth.uid() is null then raise exception 'UNAUTHORIZED'; end if;
 select * into result from public.design_orders where id=p_id;
 if found then
  if result.user_id<>auth.uid() then raise exception 'UNAUTHORIZED'; end if;
  return result; -- Retrying a timed-out submit never creates a second order.
 end if;
 if coalesce(char_length(trim(p_brief->>'message')),0)<20 or char_length(p_brief->>'message')>12000
 or coalesce(p_brief->>'route','') not in ('idea','reference','polish')
 or jsonb_typeof(p_brief->'formats') is distinct from 'array' then raise exception 'INVALID_BRIEF'; end if;
 if exists(select 1 from jsonb_each(p_brief) where key in ('message','route','audience','requirements','style','sourceProject') and jsonb_typeof(value)<>'string')
 or exists(select 1 from jsonb_array_elements(p_brief->'formats') f where jsonb_typeof(f)<>'string' or f#>>'{}' not in ('PNG','PDF','SVG','PPTX')) then raise exception 'INVALID_BRIEF'; end if;
 if jsonb_array_length(p_brief->'formats')<1 or jsonb_array_length(p_brief->'formats')>8 then raise exception 'INVALID_BRIEF'; end if;
 if p_requested_date<current_date then raise exception 'INVALID_DATE'; end if;
 insert into public.design_orders(id,user_id,title,kind,brief,requested_date) values(p_id,auth.uid(),trim(p_title),p_kind,p_brief,p_requested_date) returning * into result;
 insert into public.design_order_events(order_id,actor_id,status) values(p_id,auth.uid(),'submitted');return result;
end;$$;
create function public.advance_design_order(p_id uuid,p_expected_updated_at timestamptz,p_status text,p_note text default '',p_quote jsonb default null)
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
 update public.design_orders set status=p_status,quote_amount=o.quote_amount,quote_currency=o.quote_currency,quote_scope=o.quote_scope,quote_days=o.quote_days,quote_revisions=o.quote_revisions,
 revision_round=case when p_status='quoted' then 0 else revision_round+case when p_status='revision_requested' then 1 else 0 end end,updated_at=clock_timestamp() where id=p_id returning * into o;
 insert into public.design_order_events(order_id,actor_id,status,detail) values(p_id,auth.uid(),p_status,event_detail);
 return o;
end;$$;
revoke all on function public.create_design_order(uuid,text,text,jsonb,date),public.advance_design_order(uuid,timestamptz,text,text,jsonb) from public;
grant execute on function public.create_design_order(uuid,text,text,jsonb,date),public.advance_design_order(uuid,timestamptz,text,text,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit) values('bioplot-order-files','bioplot-order-files',false,20971520);
-- Guard casts with CASE, so an arbitrary storage path cannot break other buckets.
create policy design_files_storage_read on storage.objects for select to authenticated using(
 bucket_id='bioplot-order-files' and case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then public.can_access_design_order(split_part(name,'/',1)::uuid) else false end
);
create policy design_files_storage_insert on storage.objects for insert to authenticated with check(
 bucket_id='bioplot-order-files' and split_part(name,'/',2)=auth.uid()::text
 and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(pdf|png|jpe?g|webp|svg|pptx|docx|zip)$'
 and case when split_part(name,'/',1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then exists(select 1 from public.design_orders where id=split_part(name,'/',1)::uuid and status not in ('completed','cancelled') and (user_id=auth.uid() or public.is_bioplot_admin())) else false end
);
-- Allow cleanup of interrupted uploads only; registered versions are immutable.
create policy design_files_storage_cleanup on storage.objects for delete to authenticated using(
 bucket_id='bioplot-order-files' and split_part(name,'/',2)=auth.uid()::text
 and not exists(select 1 from public.design_order_files f where f.path=storage.objects.name)
);
commit;
