import {useEffect,useState} from 'react';
import {List,X,House,Flask,Gear,SignOut,ChatCircleDots,Clock,ArrowRight,SquaresFour} from '@phosphor-icons/react';
import {accountDisplayName,accountInitial,type AccountState} from './accountAuth';
import {getOrderInbox,type OrderInboxItem} from './orders/orderRepository';
import {statusLabels} from './orders/orderModel';
import './admin-dashboard.css';

const teamActions=['submitted','reviewing','accepted','approved','revision_requested'];
export function AdminDashboard({account,locale,onLocaleChange,onLogout,busy}:{account:AccountState;locale:'fa'|'en';onLocaleChange:()=>void;onLogout:()=>void;busy:boolean}){
 const fa=locale==='fa',t=(f:string,e:string)=>fa?f:e;
 const [items,setItems]=useState<OrderInboxItem[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(false),[retry,setRetry]=useState(0),[mobile,setMobile]=useState(false);
 useEffect(()=>{
  let live=true,pending=false;
  const load=async()=>{if(pending)return;pending=true;try{const rows=await getOrderInbox();if(live){setItems(rows);setError(false);}}catch{if(live)setError(true);}finally{pending=false;if(live)setLoading(false);}};
  void load();const refresh=()=>{if(!document.hidden)void load();};
  window.addEventListener('focus',refresh);const timer=window.setInterval(refresh,30000);
  return()=>{live=false;window.removeEventListener('focus',refresh);window.clearInterval(timer);};
 },[account.user?.id,retry]);
 useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setMobile(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
 const submitted=items.filter(o=>o.status==='submitted');
 const unread=items.reduce((sum,o)=>sum+o.unread_count,0);
 const attention=items.filter(o=>teamActions.includes(o.status)||o.unread_count>0);
 const priority=(o:OrderInboxItem)=>o.status==='submitted'?0:o.unread_count>0?1:teamActions.includes(o.status)?2:3;
 const sorted=[...items].sort((a,b)=>priority(a)-priority(b)||b.updated_at.localeCompare(a.updated_at));
 const date=(v:string)=>new Date(v).toLocaleString(fa?'fa-IR':'en-US',{dateStyle:'medium',timeStyle:'short'});
 return <div className="workspace admin-workspace" dir={fa?'rtl':'ltr'}>
  <button className="workspace-mobile" aria-label={t('باز و بسته کردن منو','Toggle menu')} aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<List/>}</button>
  {mobile&&<button className="workspace-overlay" aria-label={t('بستن منو','Close menu')} onClick={()=>setMobile(false)}/>}
  <aside className={`workspace-sidebar ${mobile?'is-open':''}`}>
   <div className="workspace-brand"><a href="/"><b>B</b><span>BioPlot</span></a></div>
   <nav aria-label={t('منوی مدیریت','Admin navigation')}>
    <a href="/dashboard" aria-current="page"><SquaresFour size={22}/><span>{t('داشبورد مدیریت','Admin overview')}</span>{attention.length>0&&<b className="workspace-nav-badge">{attention.length.toLocaleString(fa?'fa-IR':'en-US')}</b>}</a>
    <a href="/admin/orders"><Flask size={22}/><span>{t('مدیریت سفارش‌ها','Manage orders')}</span></a>
    <a href="/admin/studio"><Gear size={22}/><span>{t('محتوای صفحات','Page content')}</span></a>
    <a href="/admin/library"><Gear size={22}/><span>{t('مدیریت سایت','Site administration')}</span></a>
    <a href="/"><House size={22}/><span>{t('خانه','Home')}</span></a>
    <button disabled={busy} onClick={onLogout}><SignOut size={22}/><span>{t('خروج','Sign out')}</span></button>
   </nav>
   <div className="workspace-identity"><b>{accountInitial(account)}</b><div><strong>{accountDisplayName(account)}</strong><small>{t('مدیر بیوپلات','BioPlot administrator')}</small></div></div>
  </aside>
  <main className="workspace-main">
   <header><div><small>BIOPLOT ADMIN</small><h1>{t('مرکز مدیریت سفارش‌ها','Order management dashboard')}</h1><p className="workspace-subtitle">{t('درخواست‌های تازه و پیام‌های مشتریان، برای رسیدگی شما','New requests and customer messages, ready for your attention')}</p></div><div className="workspace-header-actions"><button onClick={onLocaleChange}>{fa?'EN':'FA'}</button><button onClick={()=>{setLoading(true);setRetry(n=>n+1);}} disabled={loading}>{t('تازه‌سازی','Refresh')}</button><a className="workspace-primary" href="/admin/orders">{t('همه سفارش‌ها','Manage all orders')}<ArrowRight size={18}/></a></div></header>
   {error&&<p className="workspace-notice" role="alert">{t('دریافت سفارش‌ها انجام نشد؛ دوباره تلاش کنید.','Orders could not be loaded. Please retry.')} <button onClick={()=>{setLoading(true);setRetry(n=>n+1);}}>{t('تلاش دوباره','Retry')}</button></p>}
   {loading&&!items.length?<p role="status">{t('در حال دریافت سفارش‌های مشتریان…','Loading customer orders…')}</p>:<>
    {!error&&submitted.length>0&&<div className="admin-new-request" role="status"><span><Flask size={26}/></span><div><strong>{t(`${submitted.length.toLocaleString('fa-IR')} سفارش جدید منتظر بررسی شماست`,`${submitted.length} new requests are waiting for review`)}</strong><p>{t('برای مشاهده جزئیات و شروع بررسی، سفارش را باز کنید.','Open a request to read the brief and start reviewing.')}</p></div><a href={`/admin/orders?id=${encodeURIComponent(submitted[0].id)}`}>{t('بررسی سفارش جدید','Review a new request')}<ArrowRight size={18}/></a></div>}
    <section className="workspace-stats admin-order-stats" aria-label={t('وضعیت سفارش‌های مشتریان','Customer order overview')}>
     <article><Flask/><strong>{submitted.length.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{t('درخواست جدید','New requests')}</span></article>
     <article><ChatCircleDots/><strong>{unread.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{t('پیام خوانده‌نشده','Unread messages')}</span></article>
     <article><Clock/><strong>{attention.length.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{t('سفارش نیازمند رسیدگی','Orders needing attention')}</span></article>
    </section>
    <section className="admin-order-queue" aria-labelledby="admin-queue-title"><div className="workspace-order-heading"><div><h2 id="admin-queue-title">{t('سفارش‌های دریافتی','Incoming orders')}</h2><p>{t('درخواست‌های جدید و پیام‌های خوانده‌نشده بالاتر نمایش داده می‌شوند.','New requests and unread messages appear first.')}</p></div><small>{t('نمای ۲۰۰ سفارش اخیر','Up to 200 recent orders')}</small></div>
     {sorted.length?<div className="admin-order-list">{sorted.map(o=><a key={o.id} href={`/admin/orders?id=${encodeURIComponent(o.id)}`} className={`admin-order-row ${o.status==='submitted'?'is-new':''}`}><div className="admin-order-row-title"><strong dir="auto">{o.title}</strong><span className={`workspace-order-status status-${o.status}`}>{statusLabels[o.status][fa?0:1]}</span>{o.status==='submitted'&&<b className="workspace-order-unread">{t('جدید','New')}</b>}{o.unread_count>0&&<b className="workspace-order-unread">{o.unread_count.toLocaleString(fa?'fa-IR':'en-US')} {t('پیام جدید','new messages')}</b>}</div>{o.last_message_body&&<p dir="auto">{o.last_message_body}</p>}<div className="admin-order-row-meta"><small><bdi>#{o.id.slice(0,8)}</bdi> · {date(o.updated_at)}</small><span>{t('مشاهده و رسیدگی','Open request')}<ArrowRight size={18}/></span></div></a>)}</div>:!error&&<div className="workspace-order-empty"><p>{t('هنوز سفارشی از مشتریان دریافت نشده است. درخواست‌های جدید همین‌جا نمایش داده می‌شوند.','No customer orders yet. New requests will appear here.')}</p></div>}
    </section>
   </>}
  </main>
 </div>;
}
