import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('denies users and anonymous callers, and lets admins atomically delete orders and related records',async()=>{
 const db=new PGlite();const id='11111111-1111-4111-8111-111111111111';
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function public.is_bioplot_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;
 create table design_orders(id uuid primary key);
 create table design_order_reads(order_id uuid references design_orders(id));
 create table design_order_messages(order_id uuid references design_orders(id));
 create table design_order_events(order_id uuid references design_orders(id));
 create table design_order_files(order_id uuid references design_orders(id));
 grant usage on schema public,auth to authenticated,anon;
 insert into design_orders values('${id}');
 insert into design_order_reads values('${id}');insert into design_order_messages values('${id}');
 insert into design_order_events values('${id}');insert into design_order_files values('${id}');`);
 await db.exec(readFileSync('supabase/migrations/20261117223000_admin_order_delete.sql','utf8'));
 await db.exec('set role anon');await expect(db.query('select delete_design_order($1)',[id])).rejects.toThrow();
 await db.exec(`reset role;select set_config('test.uid','${id}',false);select set_config('test.admin','no',false);set role authenticated;`);
 await expect(db.query('select delete_design_order($1)',[id])).rejects.toThrow('UNAUTHORIZED');
 await expect(db.query('delete from design_orders where id=$1',[id])).rejects.toThrow();
 await db.exec(`reset role;select set_config('test.admin','yes',false);set role authenticated;`);
 await db.query('select delete_design_order($1)',[id]);await db.exec('reset role');
 for(const table of ['design_orders','design_order_reads','design_order_messages','design_order_events','design_order_files'])expect((await db.query(`select * from ${table}`)).rows).toHaveLength(0);
 }finally{await db.close();}
},30000);
