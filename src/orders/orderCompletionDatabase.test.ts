import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('restricts completion to admins, checks stale state and retains all related records',async()=>{
 const db=new PGlite(),id='11111111-1111-4111-8111-111111111111',stamp='2026-11-18T10:00:00Z';
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select '${id}'::uuid$$;
 create function is_bioplot_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;
 create table design_orders(id uuid primary key,status text,updated_at timestamptz);
 create table design_order_events(order_id uuid,actor_id uuid,status text,detail jsonb);
 create table design_order_messages(order_id uuid,body text);create table design_order_files(order_id uuid,name text);
 insert into design_orders values('${id}','approved','${stamp}');insert into design_order_messages values('${id}','Keep message');insert into design_order_files values('${id}','receipt.pdf');grant usage on schema public,auth to authenticated,anon;`);
 await db.exec(readFileSync('supabase/migrations/20261118194000_admin_complete_order.sql','utf8'));
 await db.exec(`select set_config('test.admin','no',false);set role authenticated`);
 await expect(db.query('select complete_design_order($1,$2,$3)',[id,stamp,''])).rejects.toThrow('UNAUTHORIZED');
 await db.exec(`reset role;select set_config('test.admin','yes',false);set role authenticated`);
 await expect(db.query('select complete_design_order($1,$2,$3)',[id,'2020-01-01',''])).rejects.toThrow('ORDER_CHANGED');
 await db.query('select complete_design_order($1,$2,$3)',[id,stamp,'Payment confirmed']);await db.exec('reset role');
 expect((await db.query('select status from design_orders')).rows).toEqual([{status:'completed'}]);
 expect((await db.query('select * from design_order_messages')).rows).toHaveLength(1);expect((await db.query('select * from design_order_files')).rows).toHaveLength(1);
 expect((await db.query('select status from design_order_events')).rows).toEqual([{status:'completed'}]);
 await db.exec('set role anon');await expect(db.query('select complete_design_order($1,$2,$3)',[id,stamp,''])).rejects.toThrow();
 }finally{await db.close();}
},30000);
