import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeRoute } from './HomeRoute';
import { EditorRoute } from './EditorRoute';
import { AdminLibraryPage } from './AdminLibraryPage';
import { AccountPage } from './AccountPage';
import { isAccountPath, isAdminLibraryPath, isEditorPath } from './routing';
import { installSelectionDragToolbarBehavior } from './selectionDragToolbar';
import { installTightAssetSelection } from './tightAssetSelection';
import { installCanvasWheelZoom } from './canvasWheelZoom';
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
import './studio-floating-selection.css';
import './studio-drag-toolbar.css';
import './studio-tight-selection.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isAdminLibrary = isAdminLibraryPath(window.location.pathname);
const isAccount = isAccountPath(window.location.pathname);
const isEditor = isEditorPath(window.location.pathname);

if (isEditor) {
  installSelectionDragToolbarBehavior();
  installTightAssetSelection();
  installCanvasWheelZoom();
}

createRoot(root).render(
  <StrictMode>
    {isAdminLibrary ? <AdminLibraryPage /> : isAccount ? <AccountPage /> : isEditor ? <EditorRoute /> : <HomeRoute />}
  </StrictMode>
);
