import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {allowedTransitions,type OrderStatus} from './orderModel';
const customer='11111111-1111-4111-8111-111111111111',stranger='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333',id='44444444-4444-4444-8444-444444444444';
let db:PGlite;
async function asUser(user:string){await db.exec(`reset role;select set_config('test.uid','${user}',false);set role authenticated;`);}
async function row(){return (await db.query<{updated_at:string;status:OrderStatus}>('select updated_at::text,status from public.design_orders where id=$1',[id])).rows[0];}
async function move(status:string,note='',quote:object|null=null){const o=await row();return db.query('select * from public.advance_design_order($1,$2,$3,$4,$5)',[id,o.updated_at,status,note,quote?JSON.stringify(quote):null]);}
async function file(kind:'preview'|'final',suffix:string){const path=`${id}/${admin}/${suffix}.svg`;await db.query("insert into storage.objects(bucket_id,name) values('bioplot-order-files',$1)",[path]);await db.query('insert into public.design_order_files(id,order_id,uploader_id,kind,name,path,size) values($1,$2,$3,$4,$5,$6,100)',[suffix,id,admin,kind,'diagram.svg',path]);return path;}
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key);
 insert into auth.users values('${customer}'),('${stranger}'),('${admin}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function public.is_bioplot_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
 alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage to authenticated,anon;
 grant select,insert,delete on storage.objects to authenticated;`);
 await db.exec(readFileSync('supabase/migrations/20260923150000_scientific_design_orders.sql','utf8'));
},30000);
afterAll(async()=>{await db.close();});
describe.sequential('order PostgreSQL policies and workflow',()=>{
 it('creates exactly one private order on retries and rejects empty briefs',async()=>{
  await asUser(customer);
  await expect(db.query('select public.create_design_order($1,$2,$3,$4,null)',[id,'Cancer figure','figure',JSON.stringify({route:'idea',message:'short',formats:['SVG']})])).rejects.toThrow('INVALID_BRIEF');
  await expect(db.query('select public.create_design_order($1,$2,$3,$4,null)',[id,'Cancer figure','figure',JSON.stringify({route:'idea',message:{text:'This is a nested object, not scientific text.'},formats:['SVG']})])).rejects.toThrow('INVALID_BRIEF');
  for(let i=0;i<2;i++)await db.query('select public.create_design_order($1,$2,$3,$4,null)',[id,'Cancer figure','figure',JSON.stringify({route:'idea',message:'A scientific diagram with multiple cellular pathways.',formats:['SVG']})]);
  expect((await db.query('select * from public.design_orders')).rows).toHaveLength(1);
  expect((await db.query('select * from public.design_order_events')).rows).toHaveLength(1);
  await expect(db.query("update public.design_orders set quote_amount=1 where id=$1",[id])).rejects.toThrow();
 });
 it('isolates orders, messages and files from another customer and anonymous users',async()=>{
  await asUser(stranger);
  expect((await db.query('select * from public.design_orders')).rows).toHaveLength(0);
  expect((await db.query('select * from public.design_order_events')).rows).toHaveLength(0);
  await expect(db.query('insert into public.design_order_messages(order_id,author_id,body) values($1,$2,$3)',[id,stranger,'Can I see this?'])).rejects.toThrow();
  await expect(db.query("insert into storage.objects(bucket_id,name) values('bioplot-order-files',$1)",[`${id}/${stranger}/55555555-5555-4555-8555-555555555555.svg`])).rejects.toThrow();
  await db.exec('reset role;set role anon;');await expect(db.query('select * from public.design_orders')).rejects.toThrow();
 });
 it('supports review, quote and owner acceptance while preventing stale or unauthorized transitions',async()=>{
  await asUser(admin);const before=await row();await move('reviewing');
  await expect(db.query('select public.advance_design_order($1,$2,$3,$4,null)',[id,before.updated_at,'cancelled','stale cancel'])).rejects.toThrow('ORDER_CHANGED');
  await expect(move('quoted','',{amount:0,currency:'IRT',scope:'A complete figure',days:5,revisions:2})).rejects.toThrow('INVALID_QUOTE');
  await move('quoted','',{amount:1500000,currency:'IRT',scope:'One illustration, SVG and PNG, two rounds; payment by agreement.',days:5,revisions:2});
  await expect(move('accepted')).rejects.toThrow('INVALID_TRANSITION');
  await asUser(customer);await expect(move('designing')).rejects.toThrow('INVALID_TRANSITION');await move('accepted');
  const events=await db.query<{detail:{amount:number}}>("select detail from public.design_order_events where status='accepted'");expect(events.rows[0].detail.amount).toBe(1500000);
 });
 it('prevents customer uploads from impersonating final delivery and keeps event authors server-owned',async()=>{
  await asUser(customer);
  const fileId='99999999-9999-4999-8999-999999999999',path=`${id}/${customer}/${fileId}.svg`;
  await db.query("insert into storage.objects(bucket_id,name) values('bioplot-order-files',$1)",[path]);
  await expect(db.query('insert into public.design_order_files(id,order_id,uploader_id,kind,name,path,size) values($1,$2,$3,$4,$5,$6,100)',[fileId,id,customer,'final','test.svg',path])).rejects.toThrow();
  await db.query("delete from storage.objects where name=$1",[path]);expect((await db.query('select * from storage.objects where name=$1',[path])).rows).toHaveLength(0);
  await expect(db.query('insert into public.design_order_events(order_id,actor_id,status) values($1,$2,$3)',[id,admin,'delivered'])).rejects.toThrow();
  await expect(db.query("insert into public.design_order_messages(order_id,author_id,body,created_at) values($1,$2,'forged','2000-01-01')",[id,customer])).rejects.toThrow();
 });
 it('requires fresh preview files, protects versions and enforces client preview approval',async()=>{
  await asUser(admin);await move('designing');await expect(move('review')).rejects.toThrow('FILES_REQUIRED');
  const path=await file('preview','66666666-6666-4666-8666-666666666666');await move('review');
  await db.query("delete from storage.objects where bucket_id='bioplot-order-files' and name=$1",[path]);
  expect((await db.query('select * from storage.objects where name=$1',[path])).rows).toHaveLength(1);
  await expect(move('delivered')).rejects.toThrow('INVALID_TRANSITION');
  await asUser(stranger);expect((await db.query('select * from storage.objects')).rows).toHaveLength(0);expect((await db.query('select * from public.design_order_files')).rows).toHaveLength(0);
  await asUser(customer);await expect(move('revision_requested','')).rejects.toThrow('NOTE_REQUIRED');await move('revision_requested','Please enlarge the cell labels.');
  await asUser(admin);await move('designing');await expect(move('review')).rejects.toThrow('FILES_REQUIRED');
  await file('preview','77777777-7777-4777-8777-777777777777');await move('review');
  await asUser(customer);await move('approved');
  await asUser(admin);await expect(move('delivered')).rejects.toThrow('FILES_REQUIRED');await file('final','88888888-8888-4888-8888-888888888888');await move('delivered');
  await asUser(customer);expect((await db.query('select * from public.design_order_files')).rows).toHaveLength(3);await move('completed');
  await expect(db.query('insert into public.design_order_messages(order_id,author_id,body) values($1,$2,$3)',[id,customer,'After completion'])).rejects.toThrow();
  expect(allowedTransitions((await row()).status,false)).toEqual([]);
 });
});
