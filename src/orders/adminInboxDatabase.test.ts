import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
const customer='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333',stranger='99999999-9999-4999-8999-999999999999';
let db:PGlite;
async function asUser(id:string){await db.exec(`reset role;select set_config('test.uid','${id}',false);set role authenticated;`);}
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function public.is_bioplot_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
 create table public.design_orders(id uuid primary key,user_id uuid,title text,status text,updated_at timestamptz);
 create table public.design_order_reads(order_id uuid,user_id uuid,last_read_at timestamptz);
 create table public.design_order_messages(order_id uuid,author_id uuid,body text,created_at timestamptz);
 alter table design_orders enable row level security;alter table design_order_reads enable row level security;alter table design_order_messages enable row level security;
 create policy orders_read on design_orders for select to authenticated using(user_id=auth.uid() or is_bioplot_admin());
 create policy reads_own on design_order_reads for select to authenticated using(user_id=auth.uid());
 create policy messages_read on design_order_messages for select to authenticated using(exists(select 1 from design_orders where id=order_id));
 grant usage on schema public,auth to authenticated;grant select on design_orders,design_order_reads,design_order_messages to authenticated;
 insert into design_orders values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${customer}','Updated quote','quoted',now()),('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','${other}','New request','submitted',now()-interval '1 day');
 insert into design_order_messages values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','${customer}','Please review my request',now());`);
 await db.exec(readFileSync('supabase/migrations/20261116130532_admin_order_inbox.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
describe.sequential('admin inbox access',()=>{
 it('shows admins customer requests even without messages and prioritizes new requests',async()=>{
  await asUser(admin);const {rows}=await db.query<{title:string;unread_count:number}>('select * from public.get_design_order_inbox()');
  expect(rows.map(r=>r.title)).toEqual(['New request','Updated quote']);
  expect(Number(rows[0].unread_count)).toBe(0);expect(Number(rows[1].unread_count)).toBe(1);
 });
 it('keeps customers restricted to their own requests',async()=>{
  await asUser(customer);expect((await db.query('select * from public.get_design_order_inbox()')).rows).toHaveLength(1);
  await asUser(stranger);expect((await db.query('select * from public.get_design_order_inbox()')).rows).toHaveLength(0);
 });
});
