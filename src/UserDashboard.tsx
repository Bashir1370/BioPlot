import {useEffect,useRef,useState,type FormEvent} from 'react';
import {List,X,SidebarSimple,House,SquaresFour,Clock,User,Gear,SignOut,Plus,ArrowRight,CloudArrowUp,MagnifyingGlass,Flask,Trash} from '@phosphor-icons/react';
import {accountDisplayName,accountInitial,getAccountState,subscribeAccountState,signOutUser,updateUserProfile,type AccountState} from './accountAuth';
import {projects,localProjects,type ProjectSummary} from './persistence';
import {openFigureDraft} from './figureDraft';
import {createBlankDocument,makeId} from './model';
import {documentToSvg} from './export';
import {deleteOptimistically} from './optimisticDeletion';
import {clearRecoverySnapshots} from './recovery';
import './user-dashboard.css';

type Tab='figures'|'activity'|'profile'|'settings';
const emptyAccount:AccountState={user:null,profile:null,isAdmin:false};
export function UserDashboard(){
 const [account,setAccount]=useState<AccountState>(emptyAccount);
 const [ready,setReady]=useState(false);
 const [locale,setLocale]=useState<'en'|'fa'>(()=>localStorage.getItem('bioplot-lang')==='fa'?'fa':'en');
 const [tab,setTab]=useState<Tab>('figures');
 const [collapsed,setCollapsed]=useState(false);
 const [mobile,setMobile]=useState(false);
 const [items,setItems]=useState<ProjectSummary[]>([]);
 const [thumbs,setThumbs]=useState<Record<string,string>>({});
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [busy,setBusy]=useState(false);
 const [query,setQuery]=useState('');
 const [sort,setSort]=useState('recent');
 const [name,setName]=useState('');
 const [message,setMessage]=useState('');
 const generation=useRef(0);
 const hiddenProjects=useRef(new Set<string>());
 const fa=locale==='fa';
 const text=(en:string,faText:string)=>fa?faText:en;
 useEffect(()=>{document.documentElement.dir=fa?'rtl':'ltr';document.documentElement.lang=locale;localStorage.setItem('bioplot-lang',locale);},[locale,fa]);
 useEffect(()=>{let alive=true;const receive=(state:AccountState)=>{if(!alive)return;setAccount(state);setName(state.user?accountDisplayName(state):'');setReady(true);};void getAccountState().then(receive).catch(()=>{if(alive){setReady(true);setError('Could not load account.');}});const unsubscribe=subscribeAccountState(receive);return()=>{alive=false;unsubscribe();};},[]);
 const refresh=async(background=false)=>{
  const request=++generation.current;if(!background)setLoading(true);setError('');
  try{const rows=await projects.list();if(request!==generation.current)return;setItems(rows.filter(row=>!hiddenProjects.current.has(row.id)));setLoading(false);
   const previews:Record<string,string>={};
   for(const row of rows.slice(0,24)){if(hiddenProjects.current.has(row.id))continue;try{const doc=await projects.load(row.id);if(request!==generation.current)return;if(doc&&!hiddenProjects.current.has(row.id))previews[row.id]=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(documentToSvg(doc))}`;}catch{/* Cards stay accessible if a preview is unavailable. */}}
   if(request===generation.current)setThumbs(Object.fromEntries(Object.entries(previews).filter(([id])=>!hiddenProjects.current.has(id))));
  }catch{if(request===generation.current){setError(text('Could not load your figures. Please retry.','دریافت شکل‌ها انجام نشد؛ دوباره تلاش کنید.'));setLoading(false);}}
 };
 useEffect(()=>{if(!ready)return;hiddenProjects.current=new Set();setItems([]);setThumbs({});void refresh();const focus=()=>void refresh(true);window.addEventListener('focus',focus);return()=>{generation.current++;hiddenProjects.current=new Set();window.removeEventListener('focus',focus);};},[ready,account.user?.id]);
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setMobile(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[]);
 const run=async(action:()=>Promise<void>)=>{setBusy(true);setMessage('');try{await action();}catch{setMessage(text('Could not complete this action. Please retry.','عملیات انجام نشد؛ دوباره تلاش کنید.'));}finally{setBusy(false);}};
 const create=()=>run(async()=>{const doc=createBlankDocument();doc.metadata.locale=locale;openFigureDraft(doc);});
 const rename=(row:ProjectSummary)=>{const title=window.prompt(text('Figure name','نام شکل'),row.title);if(!title?.trim())return;void run(async()=>{const doc=await projects.load(row.id);if(!doc)throw new Error('Missing figure');await projects.save({...doc,title:title.trim()});await refresh();});};
 const duplicate=(row:ProjectSummary)=>run(async()=>{const doc=await projects.load(row.id);if(!doc)throw new Error('Missing figure');const now=new Date().toISOString();await projects.save({...doc,id:makeId('doc'),title:`${doc.title} ${text('(copy)','(کپی)')}`,createdAt:now,updatedAt:now});await refresh();});
 const remove=(row:ProjectSummary)=>{
  if(busy||hiddenProjects.current.has(row.id)||!window.confirm(text(`Delete “${row.title}”? This cannot be undone.`,`پروژه «${row.title}» حذف شود؟ این کار قابل بازگشت نیست.`)))return;
  const hidden=hiddenProjects.current;
  const preview=thumbs[row.id];
  void deleteOptimistically(row.id,hidden,{
   hide:()=>{
    setMessage('');
    setItems(current=>current.filter(item=>item.id!==row.id));
    setThumbs(current=>{const next={...current};delete next[row.id];return next;});
   },
   remove:()=>projects.remove(row.id),
   commit:()=>{
    clearRecoverySnapshots(row.id);
    // No list/thumbnail refetch and no global busy lock for deletion.
   },
   restore:()=>{
    if(hiddenProjects.current!==hidden)return;
    // Ignore reads started before the failure; restore only this card, leaving
    // other concurrent deletions and edits intact.
    generation.current++;
    setLoading(false);
    setItems(current=>current.some(item=>item.id===row.id)?current:[...current,row].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)));
    if(preview)setThumbs(current=>({...current,[row.id]:preview}));
    setMessage(text(`Could not delete “${row.title}”. The project has been restored; please retry.`,`حذف «${row.title}» انجام نشد. پروژه به فهرست برگشت؛ دوباره تلاش کنید.`));
   },
  });
 };
 const importDrafts=()=>run(async()=>{const rows=await localProjects.list();let count=0;for(const row of rows){const doc=await localProjects.load(row.id);if(!doc||doc.ownerId)continue;await projects.save({...doc,ownerId:account.user!.id});count++;}await refresh();setMessage(text(`${count} device drafts moved to your account.`,`${count} طرح دستگاه به حساب منتقل شد.`));});
 const saveProfile=(event:FormEvent)=>{event.preventDefault();void run(async()=>{await updateUserProfile({displayName:name,preferredLanguage:locale});setAccount(await getAccountState());setMessage(text('Saved.','ذخیره شد.'));});};
 const logout=()=>run(async()=>{await signOutUser();window.location.href='/';});
 const nav=[{id:'figures' as Tab,label:text('My figures','شکل‌های من'),icon:SquaresFour},{id:'activity' as Tab,label:text('Recent activity','فعالیت‌های اخیر'),icon:Clock},{id:'profile' as Tab,label:text('Profile','پروفایل'),icon:User},{id:'settings' as Tab,label:text('Settings','تنظیمات'),icon:Gear}];
 const filtered=items.filter(row=>row.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a,b)=>sort==='name'?a.title.localeCompare(b.title,locale):sort==='oldest'?a.updatedAt.localeCompare(b.updatedAt):b.updatedAt.localeCompare(a.updatedAt));
 const recent=items.filter(row=>Date.now()-new Date(row.updatedAt).getTime()<7*86400000).length;
 const date=(value:string)=>new Intl.DateTimeFormat(fa?'fa-IR':'en-US',{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
 return <div className={`workspace ${collapsed?'is-collapsed':''}`} dir={fa?'rtl':'ltr'}>
  <button className="workspace-mobile" aria-label={text('Toggle menu','باز و بسته کردن منو')} aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<List/>}</button>
  {mobile&&<button className="workspace-overlay" aria-label={text('Close menu','بستن منو')} onClick={()=>setMobile(false)}/>}
  <aside className={`workspace-sidebar ${mobile?'is-open':''}`}>
   <div className="workspace-brand"><a href="/"><b>B</b><span>BioPlot</span></a><button className="workspace-collapse" title={text('Collapse sidebar','جمع کردن منو')} aria-label={text('Collapse sidebar','جمع کردن منو')} aria-expanded={!collapsed} onClick={()=>setCollapsed(!collapsed)}><SidebarSimple size={22}/></button></div>
   <nav aria-label={text('Workspace navigation','منوی داشبورد')}>
    {nav.map(item=><button key={item.id} title={item.label} aria-label={item.label} aria-current={tab===item.id?'page':undefined} onClick={()=>{setTab(item.id);setMobile(false);setMessage('');}}><item.icon size={22}/><span>{item.label}</span></button>)}
    <a href="/orders"><Flask size={22}/><span>{text('Design orders','سفارش‌های طراحی')}</span></a>
    {account.isAdmin&&<a href="/admin/studio">محتوای خدمات و سفارش</a>}{account.isAdmin&&<a href="/admin/orders"><Clock size={22}/><span>{text('Manage orders','مدیریت سفارش‌ها')}</span></a>}
    <a href="/" title={text('Home','خانه')}><House size={22}/><span>{text('Home','خانه')}</span></a>
    {account.isAdmin&&<a href="/admin/library"><Gear size={22}/><span>{text('Administration','مدیریت سایت')}</span></a>}
    {account.user?<button disabled={busy} onClick={()=>void logout()} title={text('Sign out','خروج')}><SignOut size={22}/><span>{text('Sign out','خروج')}</span></button>:<a href="/account?next=dashboard"><User size={22}/><span>{text('Sign in','ورود / ثبت‌نام')}</span></a>}
   </nav>
   <div className="workspace-identity"><b>{account.user?accountInitial(account):'B'}</b><div><strong>{account.user?accountDisplayName(account):text('Guest workspace','فضای مهمان')}</strong><small>{account.user?.email||text('Saved on this device','ذخیره در همین دستگاه')}</small></div></div>
  </aside>
  <main className="workspace-main">
   <header><div><small>BIOPLOT WORKSPACE</small><h1>{nav.find(item=>item.id===tab)?.label}</h1><p className="workspace-subtitle">{text('A home for your scientific ideas.','خانه‌ای برای ایده‌های علمی شما.')}</p></div><div className="workspace-header-actions"><button onClick={()=>setLocale(fa?'en':'fa')}>{fa?'EN':'FA'}</button><button className="workspace-primary" disabled={busy||!ready} onClick={()=>void create()}><Plus size={18}/>{text('New figure','شکل جدید')}</button></div></header>
   {message&&<p role="status" className="workspace-notice">{message}</p>}
   {!account.user&&ready&&<p className="workspace-notice">{text('Guest figures are saved on this device. Sign in to save to your account.','طرح‌های مهمان در همین دستگاه ذخیره می‌شوند. برای ذخیره در حساب وارد شوید.')} <a href="/account?next=dashboard">{text('Sign in','ورود')}</a></p>}
   {(tab==='figures'||tab==='activity')&&<>
    <section className="workspace-stats" aria-label={text('Workspace overview','نمای کلی داشبورد')}><article><SquaresFour/><strong>{items.length.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{text('Saved figures','شکل ذخیره‌شده')}</span></article><article><Clock/><strong>{recent.toLocaleString(fa?'fa-IR':'en-US')}</strong><span>{text('Updated this week','ویرایش این هفته')}</span></article><article><User/><strong>{account.user?text('Account','حساب کاربری'):text('Device','این دستگاه')}</strong><span>{text('Storage workspace','فضای ذخیره‌سازی')}</span></article></section>
    {loading?<p role="status">{text('Loading figures…','در حال دریافت شکل‌ها…')}</p>:error?<div role="alert" className="workspace-notice">{error}<button onClick={()=>void refresh()}>{text('Retry','تلاش دوباره')}</button></div>:tab==='activity'?<section className="workspace-activity">{items.length===0?<p>{text('No saved activity yet.','هنوز فعالیت ذخیره‌شده‌ای ندارید.')}</p>:items.map(row=><a key={row.id} href={`/editor?id=${encodeURIComponent(row.id)}`}><Clock/><div><strong>{row.title}</strong><small>{text('Last saved','آخرین ذخیره')} · {date(row.updatedAt)}</small></div><ArrowRight/></a>)}</section>:<>
     <div className="workspace-section-title"><h2>{text('Your collection','مجموعه شکل‌های شما')}</h2><span>{text(`${filtered.length} figures`,`${filtered.length.toLocaleString('fa-IR')} شکل`)}</span></div><div className="workspace-tools"><label className="workspace-search"><MagnifyingGlass size={20}/><input type="search" aria-label={text('Search figures','جستجوی شکل‌ها')} placeholder={text('Search your figures…','جستجوی شکل‌های شما…')} value={query} onChange={event=>setQuery(event.target.value)}/></label><select aria-label={text('Sort figures','مرتب‌سازی شکل‌ها')} value={sort} onChange={event=>setSort(event.target.value)}><option value="recent">{text('Recently updated','آخرین ویرایش')}</option><option value="oldest">{text('Oldest first','قدیمی‌ترین')}</option><option value="name">{text('Name A–Z','نام شکل')}</option></select>{account.user&&<button disabled={busy} onClick={()=>void importDrafts()}><CloudArrowUp size={18}/>{text('Move device drafts to account','انتقال طرح‌های دستگاه به حساب')}</button>}</div>
     {filtered.length===0?<div className="workspace-empty"><SquaresFour size={44}/><h2>{query?text('No matching figures','شکلی پیدا نشد'):text('Your next figure starts here','شکل بعدی شما از اینجا شروع می‌شود')}</h2>{!query&&<button className="workspace-primary" disabled={busy} onClick={()=>void create()}>{text('Create a figure','ساخت شکل')}</button>}</div>:<section className="workspace-figures">{filtered.map(row=><article key={row.id}><a href={`/editor?id=${encodeURIComponent(row.id)}`} className="workspace-preview">{thumbs[row.id]?<img src={thumbs[row.id]} alt={row.title} loading="lazy"/>:<div className="workspace-preview-placeholder"><Flask size={36} weight="duotone"/><span>{text('Scientific figure','شکل علمی')}</span></div>}</a><div className="workspace-card-copy"><a href={`/editor?id=${encodeURIComponent(row.id)}`}><h2>{row.title}</h2></a><small>{text('Edited','ویرایش')} · {date(row.updatedAt)}</small><div><button disabled={busy} onClick={()=>rename(row)}>{text('Rename','تغییر نام')}</button><button disabled={busy} onClick={()=>void duplicate(row)}>{text('Duplicate','ساخت کپی')}</button><button className="workspace-delete" disabled={busy} aria-label={text(`Delete ${row.title}`,`حذف ${row.title}`)} onClick={()=>remove(row)}><Trash size={14}/>{text('Delete','حذف')}</button><a href={`/editor?id=${encodeURIComponent(row.id)}`}>{text('Continue editing','ادامه ویرایش')} <ArrowRight size={15}/></a></div></div></article>)}</section>}
    </>}
   </>}
   {(tab==='profile'||tab==='settings')&&<section className="workspace-profile">{account.user?<form onSubmit={saveProfile}><div className="workspace-profile-avatar">{accountInitial(account)}</div><label>{text('Display name','نام نمایشی')}<input value={name} maxLength={100} onChange={event=>setName(event.target.value)}/></label><label>{text('Email','ایمیل')}<input value={account.user.email||''} readOnly dir="ltr"/></label><label>{text('Language','زبان')}<select value={locale} onChange={event=>setLocale(event.target.value as 'en'|'fa')}><option value="fa">فارسی</option><option value="en">English</option></select></label><button className="workspace-primary" disabled={busy}>{text('Save preferences','ذخیره تنظیمات')}</button></form>:<a href="/account?next=dashboard">{text('Sign in to manage your profile','برای مدیریت پروفایل وارد حساب شوید')}</a>}</section>}
  </main>
 </div>;
}
