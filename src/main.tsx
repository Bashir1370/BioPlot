import {AppErrorBoundary} from './AppErrorBoundary';
import { isDesignPath, isOrdersPath, isAdminOrdersPath } from './routing';
import { lazy, StrictMode, Suspense } from 'react';
const AdminStudioContent=lazy(()=>import('./orders/AdminStudioEntry').then(module=>({default:module.AdminStudioEntry})));

const OrdersPage=lazy(()=>import('./orders/OrdersEntry').then(module=>({default:module.OrdersEntry})));
const HomeRoute=lazy(()=>import('./HomeRoute').then(module=>({default:module.HomeRoute})));
const AdminLibraryPage=lazy(()=>import('./AdminLibraryPage').then(module=>({default:module.AdminLibraryPage})));
const AdminLinesPage=lazy(()=>import('./AdminLinesPage').then(module=>({default:module.AdminLinesPage})));
const AdminLinesShortcut=lazy(()=>import('./AdminLinesShortcut').then(module=>({default:module.AdminLinesShortcut})));
const AdminShowcasePage=lazy(()=>import('./AdminShowcasePage').then(module=>({default:module.AdminShowcasePage})));
const AdminShowcaseAccountPortal=lazy(()=>import('./AdminShowcaseAccountPortal').then(module=>({default:module.AdminShowcaseAccountPortal})));
const UserDashboard=lazy(()=>import('./UserDashboard').then(module=>({default:module.UserDashboard})));
const AccountPage=lazy(()=>import('./AccountPage').then(module=>({default:module.AccountPage})));
import { createRoot } from 'react-dom/client';
import { isDashboardPath, isAccountPath, isAdminLibraryPath, isAdminShowcasePath, isEditorPath } from './routing';
import './tailwind.css';
import './styles-v3.css';
// Public entry: only shared type, reset and typography styles.
import '@fontsource-variable/inter';
import '@fontsource-variable/vazirmatn';
import './persian-typography.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isAdminLines = /^\/admin\/lines\/?$/.test(window.location.pathname);
const isAdminLibrary = isAdminLibraryPath(window.location.pathname);
const isAdminShowcase = isAdminShowcasePath(window.location.pathname);
const isDashboard = isDashboardPath(window.location.pathname);
const isAccount = isAccountPath(window.location.pathname);
const isEditor = isEditorPath(window.location.pathname);

// Editor development continues in editor.html locally; there is no editor in
// the production dependency graph. Existing bookmarks get a helpful message.
function StudioComingSoon(){
  const fa=localStorage.getItem('bioplot-lang')==='fa';
  return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#f4f8f8',fontFamily:'inherit'}}>
    <section style={{maxWidth:510,width:'100%',background:'#fff',border:'1px solid #dce9e7',borderRadius:20,padding:'clamp(25px,5vw,44px)',textAlign:'center',boxShadow:'0 14px 42px #163d4512'}}>
      <strong style={{color:'#087f79',fontSize:13}}>BIOPLOT FIGURE STUDIO</strong>
      <h1 style={{color:'#173e46',fontSize:26,margin:'15px 0'}}>{fa?'استودیو شکل علمی به‌زودی فعال می‌شود':'Scientific Figure Studio is coming soon'}</h1>
      <p style={{color:'#667f85',lineHeight:2,fontSize:14}}>{fa?'فعلاً می‌توانید طراحی علمی را به تیم BioPlot بسپارید.':'For now, our design team can help you create scientific figures.'}</p>
      <a href="/design" style={{display:'inline-block',padding:'11px 22px',marginTop:12,borderRadius:11,background:'#087f79',color:'#fff',textDecoration:'none'}}>{fa?'ثبت سفارش طراحی':'Request a design'}</a>
      <a href="/" style={{display:'block',marginTop:18,color:'#547379',fontSize:13}}>{fa?'بازگشت به خانه':'Back to Home'}</a>
    </section>
  </main>;
}
createRoot(root).render(
  <StrictMode><AppErrorBoundary><Suspense fallback={<p role="status" style={{padding:32,textAlign:'center'}}>BioPlot…</p>}>
    {location.pathname.replace(/\/+$/,'')==='/admin/studio' ? <AdminStudioContent/> : isDesignPath(location.pathname) ? <OrdersPage initialNewOrder/> : isOrdersPath(location.pathname) ? <OrdersPage/> : isAdminOrdersPath(location.pathname) ? <OrdersPage admin/> : isAdminLines ? <AdminLinesPage /> : isAdminLibrary ? <><AdminLibraryPage/><AdminLinesShortcut/></> : isAdminShowcase ? <><AdminShowcasePage/></> : isDashboard ? <UserDashboard/> : isAccount ? <><AccountPage/><AdminShowcaseAccountPortal/></> : isEditor ? <StudioComingSoon /> : <HomeRoute />}
  </Suspense></AppErrorBoundary></StrictMode>
);
