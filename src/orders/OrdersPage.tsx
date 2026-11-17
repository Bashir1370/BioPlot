import {useStudioCopy} from './StudioContent';
import {clearOrderSource} from './orderSource';
import {useEffect,useRef,useState} from 'react';
import {getAccountState,subscribeAccountState,type AccountState} from '../accountAuth';
import {OrderForm} from './OrderForm';
import {OrderDetail} from './OrderDetail';
import {createOrder,listOrders,loadOrder,markOrderRead,transitionOrder,sendOrderMessage,uploadOrderFile,downloadOrderFile,orderError} from './orderRepository';
import {serviceLabels,statusLabels,validateOrderFile,type DesignOrder,type OrderFile} from './orderModel';
import {HomeHeader} from '../HomeHeader';
import {WorkspaceSidebar} from '../WorkspaceSidebar';
import {HomeFooter} from '../HomeFooter';
import '../home.css';
import '../home-top-nav.css';
import '../home-mobile.css';
import './orders.css';
import './order-site-chrome.css';
const signedOut:AccountState={user:null,profile:null,isAdmin:false};
export function OrdersPage({admin=false,initialNewOrder=false}:{admin?:boolean;initialNewOrder?:boolean}){
 const [fa,setFa]=useState(()=>localStorage.getItem('bioplot-lang')!=='en'),[account,setAccount]=useState(signedOut),[ready,setReady]=useState(false),[orders,setOrders]=useState<DesignOrder[]>([]),[detail,setDetail]=useState<Awaited<ReturnType<typeof loadOrder>>|null>(null);
 const params=new URLSearchParams(location.search);const [selected,setSelected]=useState(params.get('id')),[newOrder,setNewOrder]=useState(!admin&&(initialNewOrder||params.get('new')==='1')),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState(''),[query,setQuery]=useState(''),[filter,setFilter]=useState(params.get('tab')==='revision'?'revision_requested':'all');
 const [collapsed,setCollapsed]=useState(false),[mobile,setMobile]=useState(false);
 const generation=useRef(0),actionBusy=useRef(false);const t=useStudioCopy(fa);
 useEffect(()=>{document.documentElement.dir=fa?'rtl':'ltr';document.documentElement.lang=fa?'fa':'en';localStorage.setItem('bioplot-lang',fa?'fa':'en');},[fa]);
 useEffect(()=>{let live=true;const receive=(next:AccountState)=>{if(live){setAccount(next);setReady(true);}};void getAccountState().then(receive).catch(()=>{if(live){setReady(true);setError(t('حساب دریافت نشد؛ دوباره تلاش کنید.','Could not load your account. Please retry.'));}});const off=subscribeAccountState(receive);return()=>{live=false;off();};},[]);
 const refresh=async(background=false)=>{const version=++generation.current;if(!background)setLoading(true);try{const rows=await listOrders(admin?undefined:account.user?.id);const record=selected?await loadOrder(selected):null;if(record)await markOrderRead(record.order.id);if(version===generation.current){setOrders(rows);setDetail(record);setError('');}}catch(e){if(version===generation.current)setError(orderError(e,fa));}finally{if(version===generation.current)setLoading(false);}};
 useEffect(()=>{setDetail(null);setOrders([]);if(!ready||!account.user||(admin&&!account.isAdmin)){setLoading(false);return;}void refresh();const focus=()=>{if(!document.hidden&&!actionBusy.current)void refresh(true);};window.addEventListener('focus',focus);const timer=window.setInterval(focus,30000);return()=>{generation.current++;window.removeEventListener('focus',focus);clearInterval(timer);};},[ready,account.user?.id,account.isAdmin,selected,admin]);
 const navigate=(id:string|null,create=false)=>{setSelected(id);setNewOrder(create);setDetail(null);setNotice('');setError('');const next=new URLSearchParams();if(id)next.set('id',id);if(create)next.set('new','1');else if(filter==='revision_requested')next.set('tab','revision');history.replaceState(null,'',`${admin?'/admin/orders':'/orders'}${next.size?'?'+next:''}`);};
 const run=async(work:()=>Promise<void>)=>{if(actionBusy.current)return false;actionBusy.current=true;setBusy(true);setError('');setNotice('');try{await work();return true;}catch(e){setError(orderError(e,fa));return false;}finally{actionBusy.current=false;setBusy(false);}};
 const upload=async(files:File[],kind:OrderFile['kind'])=>{
  if(!files.length||files.length>8||files.some(file=>!validateOrderFile(file)))throw new Error('FILE_INVALID');
  // Orders accepted before automatic design start still need the design event.
  if(kind==='preview'&&account.isAdmin&&detail?.order.status==='accepted'){
   await transitionOrder(detail.order,'designing','');
  }
  for(const file of files)await uploadOrderFile(selected!,account.user!.id,file,kind);
 };
 const sentPreviewFiles=useRef(new WeakMap<File,string>());
 const publishPreview=(files:File[],note:string)=>run(async()=>{
  if(!account.isAdmin||!account.user||!detail)throw new Error('ORDER_CHANGED');
  if(files.length>8||files.some(file=>!validateOrderFile(file)))throw new Error('FILE_INVALID');
  let record=detail;
  try{
   if(record.order.status==='accepted'||record.order.status==='revision_requested'){
    await transitionOrder(record.order,'designing','');
    record=await loadOrder(record.order.id);
   }
   if(record.order.status!=='designing')throw new Error('ORDER_CHANGED');
   const uploadKey=record.order.id+':'+record.order.updated_at;
   for(const file of files){
    if(sentPreviewFiles.current.get(file)===uploadKey)continue;
    await uploadOrderFile(record.order.id,account.user.id,file,'preview');
    sentPreviewFiles.current.set(file,uploadKey);
   }
   await transitionOrder(record.order,'review',note);
  }finally{
   await refresh(true);
  }
 });
 const revisions=orders.filter(order=>order.status==='revision_requested').length;
 const revisionTab=filter==='revision_requested';
 const selectFilter=(value:string)=>{
  setFilter(value);
  const next=new URLSearchParams(location.search);
  if(value==='revision_requested')next.set('tab','revision');else next.delete('tab');
  history.replaceState(null,'',location.pathname+(next.size?'?'+next:''));
 };
 const filtered=orders.filter(order=>(filter==='all'||filter==='active'&&!['completed','cancelled'].includes(order.status)||filter===order.status)&&`${order.title} ${order.id}`.toLowerCase().includes(query.trim().toLowerCase()));
 const access=ready&&account.user&&(!admin||account.isAdmin);
 const content=<div className="orders-shell" dir={fa?'rtl':'ltr'}><main className="orders-content">
 {account.isAdmin&&<nav className="order-workspace-links" aria-label={t('ابزارهای مدیریت','Administration tools')}><a href="/admin/studio">{t('ویرایش محتوای صفحات','Edit page content')}</a><a href={admin?'/orders':'/admin/orders'}>{admin?t('سفارش‌های شخصی','My orders'):t('مدیریت سفارش‌ها','Manage orders')}</a></nav>}

 {!newOrder&&selected&&!admin?<div className="order-journey-heading"><h1>{t('از ایدهٔ شما تا تصویر نهایی، قدم‌به‌قدم کنار هم','From your idea to the final visual, together at every step')}</h1></div>:!newOrder&&<div className="order-page-heading"><div><span className="order-eyebrow">{admin?t('میز کار تیم طراحی','Team workspace'):t('همراه شما تا تحویل نهایی','Together through final delivery')}</span><h1>{admin?t('مدیریت سفارش‌ها','Order management'):t('سفارش‌های من','My design orders')}</h1></div><div className="order-actions">{(selected||newOrder)&&<button disabled={busy} onClick={()=>navigate(null)}>{t('فهرست سفارش‌ها','All orders')}</button>}{access&&<button disabled={busy} onClick={()=>void refresh()}>{t('تازه‌سازی','Refresh')}</button>}{!admin&&!newOrder&&<button className="order-primary" disabled={busy} onClick={()=>navigate(null,true)}>{t('درخواست طراحی جدید','New design request')}</button>}</div></div>}
 {error&&<p className="order-alert" role="alert">{error}</p>}{notice&&<p className="order-success" role="status">{notice}</p>}
 {!ready?<p role="status">{t('در حال بررسی حساب…','Loading account…')}</p>:newOrder&&!admin?<OrderForm fa={fa} userId={account.user?.id??'guest'} allowAttachments={!!account.user} busy={busy} onCancel={()=>navigate(null)} onSubmit={async(input,files)=>{if(!account.user){try{sessionStorage.setItem('bioplot-order-draft:guest',JSON.stringify(input));}catch{setError(t('ذخیره موقت درخواست ممکن نشد؛ تنظیمات ذخیره‌سازی مرورگر را بررسی کنید.','Could not save the request draft. Please check browser storage settings.'));return;}window.location.href='/account?next=orders_new';return;}await run(async()=>{const order=await createOrder(input);sessionStorage.removeItem(`bioplot-order-draft:${account.user!.id}`);sessionStorage.removeItem('bioplot-order-draft:guest');clearOrderSource();let failed=false;try{for(const file of files)await uploadOrderFile(order.id,account.user!.id,file,'reference');}catch{failed=true;}navigate(order.id);setNotice(failed?t('درخواست ثبت شد، اما همه فایل‌ها بارگذاری نشدند. فایل‌های باقی‌مانده را در همین پرونده اضافه کنید.','Your request was saved, but some files could not be uploaded. Add the remaining files in this workspace.'):'');});}}/>:!account.user?<section className="order-card order-empty"><h2>{t('پروندهٔ طراحی شما، در حساب خودتان','Your design workspace, in your account')}</h2><p>{t('برای ثبت درخواست، گفت‌وگو با تیم و دریافت فایل‌ها وارد حساب شوید.','Sign in to submit a request, discuss it with the team and receive files.')}</p><a className="order-primary" href={`/account?next=${admin?'admin_orders':newOrder?'orders_new':'orders'}`}>{t('ورود یا ساخت حساب','Sign in or create an account')}</a></section>:admin&&!account.isAdmin?<section className="order-card"><h2>{t('این بخش مخصوص مدیران تیم است.','This workspace is for administrators.')}</h2><a href="/orders">{t('رفتن به سفارش‌های من','Go to my orders')}</a></section>:loading?<p role="status">{t('در حال دریافت سفارش‌ها…','Loading orders…')}</p>:selected?detail&&<OrderDetail key={detail.order.id} fa={fa} admin={admin} canManage={account.isAdmin} userId={account.user.id} {...detail} busy={busy} onPublishPreview={publishPreview} tools={<div className="order-request-tools"><button disabled={busy} onClick={()=>navigate(null)}>{t('فهرست سفارش‌ها','All orders')}</button><button disabled={busy} onClick={()=>void refresh()}>{t('تازه‌سازی','Refresh')}</button><button disabled={busy} onClick={()=>navigate(null,true)}>{t('سفارش جدید','New request')}</button></div>} onTransition={(status,note,quote)=>run(async()=>{await transitionOrder(detail.order,status,note,quote);await refresh(true);setNotice(t('مرحله سفارش به‌روزرسانی شد.','Order updated.'));})} onMessage={body=>run(async()=>{await sendOrderMessage(selected,account.user!.id,body);await refresh(true);})} onUpload={(files,kind)=>run(async()=>{try{await upload(files,kind);}finally{await refresh(true);}})} onDownload={file=>void run(()=>downloadOrderFile(file))}/>:<><section className="order-summary-grid"><article><b>{orders.filter(o=>!['completed','cancelled'].includes(o.status)).length}</b><span>{t('سفارش در جریان','Active orders')}</span></article><article><b>{orders.filter(o=>admin?o.status==='submitted'||o.status==='revision_requested':o.status==='quoted'||o.status==='review').length}</b><span>{t('نیازمند بررسی شما','Needs your attention')}</span></article><article><b>{orders.filter(o=>o.status==='delivered'||o.status==='completed').length}</b><span>{t('تحویل‌شده','Delivered')}</span></article></section><nav className="order-filter-tabs" aria-label={t('بخش‌های سفارش‌ها','Order categories')}><button type="button" aria-pressed={!revisionTab} onClick={()=>selectFilter('all')}>{t('همه سفارش‌ها','All orders')}</button><button type="button" aria-pressed={revisionTab} onClick={()=>selectFilter('revision_requested')}>{t('بازبینی','Revisions')} ({revisions.toLocaleString(fa?'fa-IR':'en-US')})</button></nav><div className="order-list-tools"><input aria-label={t('جستجوی سفارش','Search orders')} type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('جستجو با عنوان یا کد سفارش…','Search title or order code…')}/><select aria-label={t('وضعیت سفارش','Order status')} value={filter} onChange={e=>selectFilter(e.target.value)}><option value="all">{t('همه وضعیت‌ها','All statuses')}</option><option value="active">{t('در جریان','Active')}</option>{Object.entries(statusLabels).map(([id,label])=><option key={id} value={id}>{t(label[0],label[1])}</option>)}</select></div>{filtered.length?<div className="order-list">{filtered.map(order=><button key={order.id} onClick={()=>navigate(order.id)}><span className="order-list-kind">{t(serviceLabels[order.kind][0],serviceLabels[order.kind][1])}</span><strong dir="auto">{order.title}</strong><span className={`order-status status-${order.status}`}>{t(statusLabels[order.status][0],statusLabels[order.status][1])}</span><small><bdi>#{order.id.slice(0,8)}</bdi> · {new Date(order.updated_at).toLocaleDateString(fa?'fa-IR':'en-US')}</small></button>)}</div>:<section className="order-card order-empty"><h2>{query||filter!=='all'?t('سفارشی با این مشخصات پیدا نشد.','No matching orders.'):t('ایده بعدی شما از اینجا شروع می‌شود','Your next visual starts here')}</h2><p>{admin?t('درخواست‌های کاربران سایت در این فهرست نمایش داده می‌شوند.','Customer requests will appear here.'):t('توضیح یا نمونه‌تان را بفرستید تا محدوده کار و هزینه مشخص شود.','Share a brief or reference to receive a scoped quote.')}</p></section>}<p className="order-muted">{t('نمایش ۲۰۰ سفارش اخیر. برای دیدن پرونده‌های قدیمی‌تر از پیوند مستقیم آن‌ها استفاده کنید.','Showing the latest 200 orders. Older orders remain available through their direct links.')}</p></>}
 </main></div>;
 if(ready&&account.isAdmin&&!newOrder)return <div className={`workspace is-admin ${collapsed?'is-collapsed':''}`} dir={fa?'rtl':'ltr'} lang={fa?'fa':'en'}>
  <WorkspaceSidebar account={account} fa={fa} collapsed={collapsed} setCollapsed={setCollapsed} mobile={mobile} setMobile={setMobile} active={revisionTab||detail?.order.status==='revision_requested'?'revision':'orders'} revisionCount={revisions}/>
  <div className="workspace-main workspace-order-main"><div className="workspace-header-actions"><button onClick={()=>setFa(!fa)}>{fa?'EN':'FA'}</button></div>{content}</div>
 </div>;
 return <div className="home-shell order-site-layout" dir={fa?'rtl':'ltr'} lang={fa?'fa':'en'}>
  <HomeHeader locale={fa?'fa':'en'} onLocaleChange={()=>setFa(!fa)} currentPage={newOrder?'design':null}/>
  {content}
  <HomeFooter locale={fa?'fa':'en'}/>
 </div>;
}
