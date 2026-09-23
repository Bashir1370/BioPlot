// Local UI integration: real PostgreSQL policies/RPCs via PGlite, mocked Auth/Storage transport.
// No calls are sent to the live Supabase project.
import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import {PGlite} from '@electric-sql/pglite';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const customer='11111111-1111-4111-8111-111111111111',admin='33333333-3333-4333-8333-333333333333';
console.log('DB setup');const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;create table auth.users(id uuid primary key);insert into auth.users values('${customer}'),('${admin}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('test.uid',true),'')::uuid$$;create function public.is_bioplot_admin() returns boolean language sql stable as $$select auth.uid()='${admin}'::uuid$$;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));alter table storage.objects enable row level security;grant usage on schema public,auth,storage to authenticated,anon;grant select,insert,delete on storage.objects to authenticated;`);
await db.exec(readFileSync('supabase/migrations/20260923150000_scientific_design_orders.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20260923200000_design_studio_content.sql','utf8'));
console.log('Starting browser');const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const errors=[];let chain=Promise.resolve();
const user=id=>({id,aud:'authenticated',role:'authenticated',email:id===admin?'team@example.test':'customer@example.test',created_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{display_name:id===admin?'Design team':'Researcher'}});
async function context(id){
 const ctx=await browser.newContext({viewport:{width:1440,height:1040}});
 await ctx.addInitScript(({id,user})=>{localStorage.setItem('bioplot-lang','fa');if(id){const token=btoa('{}')+'.'+btoa(JSON.stringify({sub:id,exp:Math.floor(Date.now()/1000)+3600}))+'.test';localStorage.setItem('sb-bovvqelbnqocllsxssus-auth-token',JSON.stringify({access_token:token,refresh_token:'test-refresh',expires_at:Math.floor(Date.now()/1000)+3600,expires_in:3600,token_type:'bearer',user}));}},{id,user:id?user(id):null});
 await ctx.route('https://*.supabase.co/**',route=>{chain=chain.then(async()=>{
 const req=route.request(),url=new URL(req.url()),path=url.pathname;const respond=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(path==='/auth/v1/user')return respond(user(id));
 if(path==='/rest/v1/profiles')return respond({...user(id),display_name:id===admin?'Design team':'Researcher',preferred_language:'fa',plan:'free'});
 if(path==='/rest/v1/rpc/is_bioplot_admin')return respond(id===admin);
 try{
 await db.exec(`reset role;select set_config('test.uid','${id||''}',false);set role ${id?'authenticated':'anon'};`);
 if(path==='/rest/v1/design_studio_content'){const result=await db.query('select to_jsonb(t) as row from public.design_studio_content t');return respond(req.headers().accept?.includes('vnd.pgrst.object')?result.rows[0].row:result.rows.map(r=>r.row));}
 if(path==='/rest/v1/rpc/save_design_studio_content'){const p=req.postDataJSON();const result=await db.query('select public.save_design_studio_content($1,$2)::text as version',[JSON.stringify(p.p_content),p.p_version]);return respond(result.rows[0].version);}
 if(path.startsWith('/storage/v1/object/bioplot-studio-media/')){await db.query("insert into storage.objects(bucket_id,name) values('bioplot-studio-media',$1)",[path.split('/').pop()]);return respond({Key:path});}
 if(path.startsWith('/storage/v1/object/public/bioplot-studio-media/'))return route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=','base64')});
 if(path.startsWith('/storage/v1/object/bioplot-order-files/')){const name=decodeURIComponent(path.split('/bioplot-order-files/')[1]);await db.query("insert into storage.objects(bucket_id,name) values('bioplot-order-files',$1)",[name]);return respond({Key:'bioplot-order-files/'+name,Id:crypto.randomUUID()});}
 if(path.startsWith('/storage/v1/object/sign/'))return respond({signedURL:'/object/download/test?token=test'});
 if(path==='/storage/v1/object/download/test')return route.fulfill({contentType:'image/svg+xml',headers:{'content-disposition':'attachment; filename=final.svg'},body:'<svg xmlns="http://www.w3.org/2000/svg"/>'});
 if(path==='/rest/v1/rpc/create_design_order'){const p=req.postDataJSON();const result=await db.query('select to_jsonb(public.create_design_order($1,$2,$3,$4,$5)) as row',[p.p_id,p.p_title,p.p_kind,JSON.stringify(p.p_brief),p.p_requested_date]);return respond(result.rows[0].row);}
 if(path==='/rest/v1/rpc/advance_design_order'){const p=req.postDataJSON();const result=await db.query('select to_jsonb(public.advance_design_order($1,$2,$3,$4,$5)) as row',[p.p_id,p.p_expected_updated_at,p.p_status,p.p_note,p.p_quote?JSON.stringify(p.p_quote):null]);return respond(result.rows[0].row);}
 const table=path.split('/').pop();if(!['design_orders','design_order_messages','design_order_files','design_order_events'].includes(table))return respond([]);
 if(req.method()==='POST'){const values=req.postDataJSON(),keys=Object.keys(values);assert.ok(keys.every(k=>/^[a-z_]+$/.test(k)));await db.query(`insert into public.${table}(${keys.join(',')}) values(${keys.map((_,i)=>'$'+(i+1)).join(',')})`,Object.values(values));return respond(null,201);}
 const clauses=[],values=[];for(const key of ['id','order_id','user_id'])if(url.searchParams.has(key)){clauses.push(`${key}=$${values.length+1}`);values.push(url.searchParams.get(key).slice(3));}
 const sort=table==='design_orders'?'updated_at desc':'created_at';const result=await db.query(`select to_jsonb(t) as row from public.${table} t ${clauses.length?'where '+clauses.join(' and '):''} order by ${sort}`,values);const rows=result.rows.map(r=>r.row);return respond(req.headers().accept?.includes('vnd.pgrst.object')?rows[0]:rows);
 }catch(error){return respond({code:error.code||'P0001',message:error.message},400);}
 });return chain;});
 const page=await ctx.newPage();page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));return {ctx,page};
}
try{
 const team=await context(admin),guest=await context(null),customerPage=await context(customer);const page=team.page;
 console.log('Admin page');await page.goto('http://127.0.0.1:5173/admin/studio');await page.getByLabel('علم از شما.',{exact:true}).fill('پژوهش شما، طراحی ما');
 console.log('Preview');await page.getByRole('button',{name:'پیش‌نمایش خدمات',exact:true}).click();await page.getByRole('dialog').getByRole('heading',{name:/پژوهش شما، طراحی ما/}).waitFor();await page.keyboard.press('Escape');
 console.log('Upload');await page.getByRole('button',{name:'تصاویر',exact:true}).click();await page.getByLabel('تصویر اصلی خدمات طراحی',{exact:true}).setInputFiles({name:'hero.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5WQAAAAASUVORK5CYII=','base64')});await page.locator('.cms-image-field img').waitFor();
 console.log('Blocks');await page.getByRole('button',{name:'بلوک‌ها و پرسش‌ها',exact:true}).click();await page.getByRole('button',{name:'+ پرسش‌وپاسخ',exact:true}).click();const block=page.locator('.cms-block-editor').last();await block.getByLabel('پرسش',{exact:true}).fill('آیا فایل اولیه را بررسی می‌کنید؟');await block.getByLabel('پاسخ',{exact:true}).fill('بله، پیش از شروع طراحی فایل و توضیحات شما بررسی می‌شود.');await block.getByLabel('انتقال بلوک به بالا').click();
 console.log('Publish');await page.getByRole('button',{name:'انتشار تغییرات',exact:true}).click();await page.getByRole('status').waitFor();await page.reload();await page.getByRole('button',{name:'بلوک‌ها و پرسش‌ها',exact:true}).click();assert.ok(await page.locator('.cms-block-editor input').evaluateAll(inputs=>inputs.some(input=>input.value==='آیا فایل اولیه را بررسی می‌کنید؟')));
 await guest.page.goto('http://127.0.0.1:5173/design');await guest.page.getByRole('heading',{name:/پژوهش شما، طراحی ما/}).waitFor();await guest.page.getByText('آیا فایل اولیه را بررسی می‌کنید؟',{exact:true}).click();await guest.page.getByText('بله، پیش از شروع طراحی فایل و توضیحات شما بررسی می‌شود.',{exact:true}).waitFor();assert.ok(await guest.page.locator('.studio-hero-image img').getAttribute('src'));
 await customerPage.page.goto('http://127.0.0.1:5173/admin/studio');await customerPage.page.getByText('این بخش فقط برای مدیر سایت در دسترس است.',{exact:true}).waitFor();assert.equal(await customerPage.page.getByRole('button',{name:'انتشار تغییرات'}).count(),0);
 // Capture original defaults as well as the order form at desktop and mobile sizes.
 await db.exec("reset role;update public.design_studio_content set content='{}';");
 await guest.page.reload();await guest.page.getByRole('heading',{name:/علم از شما/}).waitFor();await guest.page.screenshot({path:'/tmp/studio-services-desktop.png',fullPage:true});
 await customerPage.page.goto('http://127.0.0.1:5173/orders?new=1');await customerPage.page.getByLabel('عنوان سفارش').waitFor();await customerPage.page.screenshot({path:'/tmp/studio-orders-desktop.png',fullPage:true});
 await page.screenshot({path:'/tmp/studio-cms-desktop.png',fullPage:true});
 for(const [p,name] of [[guest.page,'services'],[customerPage.page,'orders'],[page,'cms']]){await p.setViewportSize({width:390,height:844});await p.screenshot({path:`/tmp/studio-${name}-mobile.png`,fullPage:true});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),name+' overflows');}
 assert.deepEqual(errors,[]);console.log('PASS: admin gating, preview, image upload, FAQ creation/reorder, publication/reload, public rendering, desktop/mobile layouts.');
}catch(error){for(const ctx of browser.contexts()){for(const page of ctx.pages()){console.log('PAGE',page.url(),await page.locator('body').innerText());await page.screenshot({path:'/tmp/cms-failure-'+browser.contexts().indexOf(ctx)+'.png',fullPage:true});}}throw error;}finally{await browser.close();await server.close();await db.close();}
