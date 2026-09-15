import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeRoute } from './HomeRoute';
import { EditorRoute } from './EditorRoute';
import { AdminLibraryPage } from './AdminLibraryPage';
import { AdminShowcasePage } from './AdminShowcasePage';
import { AdminShowcaseAccountPortal } from './AdminShowcaseAccountPortal';
import { AdminTemplateHeroPortal } from './AdminTemplateHeroPortal';
import { AccountPage } from './AccountPage';
import { isAccountPath, isAdminLibraryPath, isAdminShowcasePath, isEditorPath } from './routing';
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
const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isAdminLibrary = isAdminLibraryPath(window.location.pathname);
const isAdminShowcase = isAdminShowcasePath(window.location.pathname);
const isAccount = isAccountPath(window.location.pathname);
const isEditor = isEditorPath(window.location.pathname);

if (isEditor) {
  installTightAssetSelection();
}
createRoot(root).render(
  <StrictMode>
    {isAdminLibrary ? <AdminLibraryPage /> : isAdminShowcase ? <><AdminShowcasePage/><AdminTemplateHeroPortal/></> : isAccount ? <><AccountPage/><AdminShowcaseAccountPortal/></> : isEditor ? <EditorRoute /> : <HomeRoute />}
  </StrictMode>
);
