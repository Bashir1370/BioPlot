begin;

create table public.design_order_reads (
  order_id uuid not null references public.design_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  primary key (order_id, user_id)
);

alter table public.design_order_reads enable row level security;
revoke all on public.design_order_reads from public, anon, authenticated;
grant select, insert, update on public.design_order_reads to authenticated;

create policy order_reads_select_own on public.design_order_reads
  for select to authenticated
  using (user_id = (select auth.uid()) and public.can_access_design_order(order_id));
create policy order_reads_insert_own on public.design_order_reads
  for insert to authenticated
  with check (user_id = (select auth.uid()) and public.can_access_design_order(order_id));
create policy order_reads_update_own on public.design_order_reads
  for update to authenticated
  using (user_id = (select auth.uid()) and public.can_access_design_order(order_id))
  with check (user_id = (select auth.uid()) and public.can_access_design_order(order_id));

create function public.get_design_order_inbox()
returns table (
  id uuid,
  title text,
  status text,
  updated_at timestamptz,
  last_message_at timestamptz,
  last_message_author_id uuid,
  last_message_body text,
  unread_count bigint
)
language sql stable security invoker set search_path = public as $$
  select o.id, o.title, o.status, o.updated_at,
         recent.created_at, recent.author_id, recent.body,
         coalesce(unread.count, 0)::bigint
  from public.design_orders o
  left join public.design_order_reads r
    on r.order_id = o.id and r.user_id = (select auth.uid())
  left join lateral (
    select m.created_at, m.author_id, m.body
    from public.design_order_messages m
    where m.order_id = o.id
    order by m.created_at desc
    limit 1
  ) recent on true
  left join lateral (
    select count(*) as count
    from public.design_order_messages m
    where m.order_id = o.id
      and m.author_id <> (select auth.uid())
      and (r.last_read_at is null or m.created_at > r.last_read_at)
  ) unread on true
  where o.user_id = (select auth.uid())
  order by o.updated_at desc
  limit 200;
$$;

create function public.mark_design_order_read(p_order_id uuid)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare read_time timestamptz := clock_timestamp();
begin
  if auth.uid() is null or not public.can_access_design_order(p_order_id) then
    raise exception 'UNAUTHORIZED';
  end if;
  insert into public.design_order_reads(order_id, user_id, last_read_at)
  values (p_order_id, auth.uid(), read_time)
  on conflict (order_id, user_id) do update set last_read_at = excluded.last_read_at;
  return read_time;
end;
$$;

revoke all on function public.get_design_order_inbox() from public, anon;
grant execute on function public.get_design_order_inbox() to authenticated;
revoke all on function public.mark_design_order_read(uuid) from public, anon;
grant execute on function public.mark_design_order_read(uuid) to authenticated;

commit;
