-- Keep customer ownership filtering; include accessible customer orders for admins.
create or replace function public.get_design_order_inbox()
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
  where o.user_id = (select auth.uid()) or (select public.is_bioplot_admin())
  order by case when (select public.is_bioplot_admin()) and o.status = 'submitted' then 0 else 1 end, o.updated_at desc
  limit 200;
$$;

