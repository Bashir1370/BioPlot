import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import {it,expect} from 'vitest';
it('returns the order owner full name only to admins, with a legacy profile fallback',async()=>{
 const db=new PGlite(),id='11111111-1111-4111-8111-111111111111';
 try{
 await db.exec(`create role anon;create role authenticated;create schema auth;
 create function auth.uid() returns uuid language sql stable as $$select '${id}'::uuid$$;
 create function public.is_bioplot_admin() returns boolean language sql stable as $$select current_setting('test.admin',true)='yes'$$;
 create table auth.users(id uuid,raw_user_meta_data jsonb);create table profiles(id uuid,display_name text);create table design_orders(id uuid,user_id uuid);
 insert into auth.users values('${id}','{"first_name":"زیبا","last_name":"ملکشاهی"}');insert into profiles values('${id}','Legacy name');insert into design_orders values('${id}','${id}');
 grant usage on schema public,auth to authenticated,anon;`);
 await db.exec(readFileSync('supabase/migrations/20261117234000_admin_order_owner.sql','utf8'));
 await db.exec(`select set_config('test.admin','no',false);set role authenticated;`);
 await expect(db.query('select * from get_design_order_owner($1)',[id])).rejects.toThrow('UNAUTHORIZED');
 await db.exec(`reset role;select set_config('test.admin','yes',false);set role authenticated;`);
 expect((await db.query('select * from get_design_order_owner($1)',[id])).rows).toEqual([{full_name:'زیبا ملکشاهی'}]);
 await db.exec(`reset role;update auth.users set raw_user_meta_data='{}';set role authenticated;`);
 expect((await db.query('select * from get_design_order_owner($1)',[id])).rows).toEqual([{full_name:'Legacy name'}]);
 await db.exec('reset role;set role anon');await expect(db.query('select * from get_design_order_owner($1)',[id])).rejects.toThrow();
 }finally{await db.close();}
},30000);
