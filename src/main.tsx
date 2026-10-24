import {StudioContentProvider} from './orders/StudioContent';
import { isDesignPath, isOrdersPath, isAdminOrdersPath } from './routing';
import { lazy, StrictMode, Suspense } from 'react';
const AdminStudioContent=lazy(()=>import('./orders/AdminStudioContent').then(module=>({default:module.AdminStudioContent})));
const DesignServices=lazy(()=>import('./orders/DesignServices').then(module=>({default:module.DesignServices})));
const OrdersPage=lazy(()=>import('./orders/OrdersPage').then(module=>({default:module.OrdersPage})));
const HomeRoute=lazy(()=>import('./HomeRoute').then(module=>({default:module.HomeRoute})));
const EditorRoute=lazy(()=>import('./EditorRoute').then(module=>({default:module.EditorRoute})));
const AdminLibraryPage=lazy(()=>import('./AdminLibraryPage').then(module=>({default:module.AdminLibraryPage})));
const AdminLinesPage=lazy(()=>import('./AdminLinesPage').then(module=>({default:module.AdminLinesPage})));
const AdminLinesShortcut=lazy(()=>import('./AdminLinesShortcut').then(module=>({default:module.AdminLinesShortcut})));
const AdminShowcasePage=lazy(()=>import('./AdminShowcasePage').then(module=>({default:module.AdminShowcasePage})));
const AdminShowcaseAccountPortal=lazy(()=>import('./AdminShowcaseAccountPortal').then(module=>({default:module.AdminShowcaseAccountPortal})));
const UserDashboard=lazy(()=>import('./UserDashboard').then(module=>({default:module.UserDashboard})));
const AccountPage=lazy(()=>import('./AccountPage').then(module=>({default:module.AccountPage})));
import { createRoot } from 'react-dom/client';
import { isDashboardPath, isAccountPath, isAdminLibraryPath, isAdminShowcasePath, isEditorPath } from './routing';
import './styles-v3.css';
import './home-top-nav.css';
import './editor-pro.css';
import './template-previews-pro.css';
import './studio-polish.css';
import './studio-ribbon.css';
import './studio-reference.css';
import './studio-compact-ribbon.css';
import './studio-green-theme.css';
import './admin-asset-presets.css';
import './studio-tight-selection.css';
import './studio-multi-select.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/vazirmatn';
import './precision-studio.css';
import './persian-typography.css';
import './admin-library-redesign.css';
import './studio-contextual.css';
import './editor-persian-polish.css';
import './selection-controls.css';
import './components/ui/shine-border.css';
const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isAdminLines = /^\/admin\/lines\/?$/.test(window.location.pathname);
const isAdminLibrary = isAdminLibraryPath(window.location.pathname);
const isAdminShowcase = isAdminShowcasePath(window.location.pathname);
const isDashboard = isDashboardPath(window.location.pathname);
const isAccount = isAccountPath(window.location.pathname);
const isEditor = isEditorPath(window.location.pathname);

if (isEditor) {
  void import('./tightAssetSelection').then(module=>module.installTightAssetSelection());
}
createRoot(root).render(
  <StrictMode><Suspense fallback={<p role="status" style={{padding:32,textAlign:'center'}}>BioPlot…</p>}><StudioContentProvider>
    {location.pathname.replace(/\/+$/,'')==='/admin/studio' ? <AdminStudioContent/> : isDesignPath(location.pathname) ? <DesignServices/> : isOrdersPath(location.pathname) ? <OrdersPage/> : isAdminOrdersPath(location.pathname) ? <OrdersPage admin/> : isAdminLines ? <AdminLinesPage /> : isAdminLibrary ? <><AdminLibraryPage/><AdminLinesShortcut/></> : isAdminShowcase ? <><AdminShowcasePage/></> : isDashboard ? <UserDashboard/> : isAccount ? <><AccountPage/><AdminShowcaseAccountPortal/></> : isEditor ? <EditorRoute /> : <HomeRoute />}
  </StudioContentProvider></Suspense></StrictMode>
);
