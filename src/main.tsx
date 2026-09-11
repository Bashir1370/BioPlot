import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './DashboardApp';
import { EditorStudio } from './EditorStudio';
import { AdminLibraryPage } from './AdminLibraryPage';
import { isAdminLibraryPath, isEditorPath } from './routing';
import './styles-v3.css';
import './home-top-nav.css';
import './editor-pro.css';
import './template-previews-pro.css';
import './studio-polish.css';
import './studio-ribbon.css';
import './studio-reference.css';
import './studio-compact-ribbon.css';
import './studio-green-theme.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isAdminLibrary = isAdminLibraryPath(window.location.pathname);
const isEditor = isEditorPath(window.location.pathname);

createRoot(root).render(
  <StrictMode>
    {isAdminLibrary ? <AdminLibraryPage /> : isEditor ? <EditorStudio /> : <DashboardApp />}
  </StrictMode>
);
