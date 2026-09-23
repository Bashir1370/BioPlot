import {AdminStudioContent} from './orders/AdminStudioContent';
import {StudioContentProvider} from './orders/StudioContent';
import { DesignServices } from './orders/DesignServices';
import { OrdersPage } from './orders/OrdersPage';
import { isDesignPath, isOrdersPath, isAdminOrdersPath } from './routing';
import textFontCss from './fonts/text-fonts.txt?raw';
const textFontStyle=document.createElement('style');
textFontStyle.textContent=textFontCss;
document.head.appendChild(textFontStyle);
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeRoute } from './HomeRoute';
import { EditorRoute } from './EditorRoute';
import { AdminLibraryPage } from './AdminLibraryPage';
import { AdminLinesPage } from './AdminLinesPage';
import { AdminLinesShortcut } from './AdminLinesShortcut';
import { AdminShowcasePage } from './AdminShowcasePage';
import { AdminShowcaseAccountPortal } from './AdminShowcaseAccountPortal';
import {UserDashboard} from './UserDashboard';
import { AccountPage } from './AccountPage';
import { isDashboardPath, isAccountPath, isAdminLibraryPath, isAdminShowcasePath, isEditorPath } from './routing';
import { installTightAssetSelection } from './tightAssetSelection';
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
  installTightAssetSelection();
}
createRoot(root).render(
  <StrictMode><StudioContentProvider>
    {location.pathname.replace(/\/+$/,'')==='/admin/studio' ? <AdminStudioContent/> : isDesignPath(location.pathname) ? <DesignServices/> : isOrdersPath(location.pathname) ? <OrdersPage/> : isAdminOrdersPath(location.pathname) ? <OrdersPage admin/> : isAdminLines ? <AdminLinesPage /> : isAdminLibrary ? <><AdminLibraryPage/><AdminLinesShortcut/></> : isAdminShowcase ? <><AdminShowcasePage/></> : isDashboard ? <UserDashboard/> : isAccount ? <><AccountPage/><AdminShowcaseAccountPortal/></> : isEditor ? <EditorRoute /> : <HomeRoute />}
  </StudioContentProvider></StrictMode>
);
