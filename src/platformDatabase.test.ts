import {PGlite} from '@electric-sql/pglite';
import {readFileSync,readdirSync} from 'node:fs';
import {afterAll,beforeAll,expect,it} from 'vitest';
const alice='11111111-1111-4111-8111-111111111111',bob='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333';
let db:PGlite;
const sql=(path:string)=>readFileSync(`supabase/${path}`,'utf8');
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create schema realtime;
 create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;
 create function realtime.topic() returns text language sql stable as $$select current_setting('test.topic',true)$$;
 create table realtime.messages(topic text);alter table realtime.messages enable row level security;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(bucket_id text,name text);alter table storage.objects enable row level security;
 grant usage on schema public,auth,storage,realtime to anon,authenticated;
 grant select,insert,update,delete on storage.objects to anon,authenticated;
 grant select,insert on realtime.messages to authenticated;`);
 await db.exec(sql('migrations/20260910000000_platform_foundation.sql'));
 // Supabase ships pgcrypto; PGlite already has gen_random_uuid built in.
 await db.exec(sql('schema.sql').replace('create extension if not exists pgcrypto;',''));
 for(const path of ['home_hero_images.sql','template_hero_images.sql','portfolio_showcase.sql'])await db.exec(sql(path));
 for(const path of readdirSync('supabase/migrations').sort().filter(path=>path!=='20260910000000_platform_foundation.sql'))await db.exec(sql(`migrations/${path}`));
 await db.exec(`insert into auth.users(id,email) values('${alice}','alice@example.test'),('${bob}','bob@example.test'),('${admin}','admin@example.test');insert into public.bioplot_admins values('${admin}');`);
},30000);
afterAll(async()=>{await db.close();});
async function asUser(id:string,role='authenticated'){await db.exec(`reset role;select set_config('test.uid','${id}',false);set role ${role};`);}
it('boots the full documented database and creates private profiles automatically',async()=>{
 await asUser(alice);
 expect((await db.query('select * from public.profiles')).rows).toHaveLength(1);
 await db.exec("update public.profiles set display_name='Alice',preferred_language='fa'");
 await expect(db.exec("update public.profiles set plan='admin'")).rejects.toThrow();
 expect((await db.query<{admin:boolean}>('select public.is_bioplot_admin() as admin')).rows[0].admin).toBe(false);
 await expect(db.exec(`insert into public.bioplot_admins values('${alice}')`)).rejects.toThrow();
});
it('publishes library assets only as admin and hides drafts from the public',async()=>{
 await asUser(admin);
 await db.exec("insert into public.assets(name,render_svg,is_published) values('Draft','<svg/>',false),('Published','<svg/>',true)");
 expect((await db.query('select * from public.assets')).rows).toHaveLength(2);
 await asUser(alice);
 expect((await db.query('select * from public.assets')).rows).toHaveLength(1);
 await expect(db.exec("insert into public.assets(name,render_svg) values('Injected','<svg/>')")).rejects.toThrow();
 await asUser('','anon');
 expect((await db.query('select * from public.assets')).rows).toHaveLength(1);
});
it('restricts private realtime messages to the document owner',async()=>{
 await asUser(alice);
 await db.exec(`insert into public.bioplot_projects(id,user_id,title,document) values('figure','${alice}','Figure','{}');select set_config('test.topic','bioplot:figure',false);insert into realtime.messages values('bioplot:figure');`);
 expect((await db.query('select * from realtime.messages')).rows).toHaveLength(1);
 await asUser(bob);
 expect((await db.query('select * from realtime.messages')).rows).toHaveLength(0);
 await expect(db.exec("insert into realtime.messages values('bioplot:figure')")).rejects.toThrow();
});
