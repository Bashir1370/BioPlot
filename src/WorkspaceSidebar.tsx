import {useEffect} from 'react';
import {List,X,SidebarSimple,House,User,Flask} from '@phosphor-icons/react';
import {accountDisplayName,accountInitial,type AccountState} from './accountAuth';
import './user-dashboard.css';

export function WorkspaceSidebar({account,fa,collapsed,setCollapsed,mobile,setMobile,unreadTotal=0,active,onProfile}:{
 account:AccountState;fa:boolean;collapsed:boolean;setCollapsed:(value:boolean)=>void;
 mobile:boolean;setMobile:(value:boolean)=>void;unreadTotal?:number;active?:'profile'|'orders';onProfile?:()=>void;
}){
 const text=(en:string,persian:string)=>fa?persian:en;
 useEffect(()=>{const close=(event:KeyboardEvent)=>{if(event.key==='Escape')setMobile(false);};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close);},[setMobile]);
 return <>
  <button className="workspace-mobile" aria-label={text('Toggle menu','باز و بسته کردن منو')} aria-expanded={mobile} onClick={()=>setMobile(!mobile)}>{mobile?<X/>:<List/>}</button>
  {mobile&&<button className="workspace-overlay" aria-label={text('Close menu','بستن منو')} onClick={()=>setMobile(false)}/>}
  <aside className={`workspace-sidebar ${mobile?'is-open':''}`}>
   <div className="workspace-brand"><a className="workspace-logo" href="/" dir="ltr" aria-label={text('BioPlot home','خانه BioPlot')}><b aria-hidden="true">B</b><span className="workspace-logo-tail" aria-hidden="true">ioPlot</span></a><button className="workspace-collapse" title={text('Collapse sidebar','جمع کردن منو')} aria-label={text('Collapse sidebar','جمع کردن منو')} aria-expanded={!collapsed} onClick={()=>setCollapsed(!collapsed)}><SidebarSimple size={22}/></button></div>
   <nav aria-label={text('Workspace navigation','منوی داشبورد')}>
    <a href="/" title={text('Home','خانه')}><House size={22}/><span>{text('Home','خانه')}</span></a>
    {onProfile?<button title={text('Profile','پروفایل')} aria-label={text('Profile','پروفایل')} aria-current={active==='profile'?'page':undefined} onClick={onProfile}><User size={22}/><span>{text('Profile','پروفایل')}</span></button>:<a href="/dashboard?tab=profile"><User size={22}/><span>{text('Profile','پروفایل')}</span></a>}
    <a className="workspace-order-link" href={account.isAdmin?'/admin/orders':'/orders'} aria-current={active==='orders'?'page':undefined}><Flask size={22}/><span>{text('Order list','لیست سفارش‌ها')}</span>{unreadTotal>0&&<b className="workspace-nav-badge" aria-label={text(`${unreadTotal} unread order messages`,`${unreadTotal.toLocaleString('fa-IR')} پیام خوانده‌نشده`)}>{unreadTotal>99?'99+':unreadTotal.toLocaleString(fa?'fa-IR':'en-US')}</b>}</a>
   </nav>
   <div className="workspace-identity"><b>{account.user?accountInitial(account):'B'}</b><div><strong>{account.user?accountDisplayName(account):text('Guest workspace','فضای مهمان')}</strong></div></div>
  </aside>
 </>;
}
