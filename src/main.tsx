import './routeStyles';
import { isDesignPath, isOrdersPath, isAdminOrdersPath } from './routing';
import { lazy, StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { isDashboardPath, isAccountPath, isAdminLibraryPath, isAdminShowcasePath, isEditorPath } from './routing';
const AdminStudioContent = lazy(() => import('./orders/AdminStudioContent').then(module => ({default: module.AdminStudioContent})));
const StudioContentProvider = lazy(() => import('./orders/StudioContent').then(module => ({default: module.StudioContentProvider})));
const DesignServices = lazy(() => import('./orders/DesignServices').then(module => ({default: module.DesignServices})));
const OrdersPage = lazy(() => import('./orders/OrdersPage').then(module => ({default: module.OrdersPage})));
const HomeRoute = lazy(() => import('./HomeRoute').then(module => ({default: module.HomeRoute})));
const EditorRoute = lazy(async () => {
  const [module, selection] = await Promise.all([import('./EditorRoute'), import('./tightAssetSelection')]);
  selection.installTightAssetSelection();
  return {default: module.EditorRoute};
});
const AdminLibraryPage = lazy(() => import('./AdminLibraryPage').then(module => ({default: module.AdminLibraryPage})));
const AdminLinesPage = lazy(() => import('./AdminLinesPage').then(module => ({default: module.AdminLinesPage})));
const AdminLinesShortcut = lazy(() => import('./AdminLinesShortcut').then(module => ({default: module.AdminLinesShortcut})));
const AdminShowcasePage = lazy(() => import('./AdminShowcasePage').then(module => ({default: module.AdminShowcasePage})));
const AdminShowcaseAccountPortal = lazy(() => import('./AdminShowcaseAccountPortal').then(module => ({default: module.AdminShowcaseAccountPortal})));
const UserDashboard = lazy(() => import('./UserDashboard').then(module => ({default: module.UserDashboard})));
const AccountPage = lazy(() => import('./AccountPage').then(module => ({default: module.AccountPage})));
const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isAdminLines = /^\/admin\/lines\/?$/.test(window.location.pathname);
const isAdminLibrary = isAdminLibraryPath(window.location.pathname);
const isAdminShowcase = isAdminShowcasePath(window.location.pathname);
const isDashboard = isDashboardPath(window.location.pathname);
const isAccount = isAccountPath(window.location.pathname);
const isEditor = isEditorPath(window.location.pathname);

// Scientific figure fonts are only needed on routes that render figures.
if (isEditor || isDashboard || isAdminLibrary || isAdminShowcase) {
  void import('./fonts/text-fonts.txt?raw').then(({default: css}) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  });
}
createRoot(root).render(
  <StrictMode><Suspense fallback={<div role="status" style={{padding:24}}>BioPlot…</div>}>
    {location.pathname.replace(/\/+$/,'')==='/admin/studio' ? <AdminStudioContent/> : isDesignPath(location.pathname) ? <StudioContentProvider><DesignServices/></StudioContentProvider> : isOrdersPath(location.pathname) ? <StudioContentProvider><OrdersPage/></StudioContentProvider> : isAdminOrdersPath(location.pathname) ? <StudioContentProvider><OrdersPage admin/></StudioContentProvider> : isAdminLines ? <AdminLinesPage /> : isAdminLibrary ? <><AdminLibraryPage/><AdminLinesShortcut/></> : isAdminShowcase ? <><AdminShowcasePage/></> : isDashboard ? <UserDashboard/> : isAccount ? <><AccountPage/><AdminShowcaseAccountPortal/></> : isEditor ? <EditorRoute /> : <HomeRoute />}
  </Suspense></StrictMode>
);
