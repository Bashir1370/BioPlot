import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './DashboardApp';
import { EditorStudio } from './EditorStudio';
import { isEditorPath } from './routing';
import './styles-v3.css';
import './home-top-nav.css';
import './editor-pro.css';
import './figure-studio-v2.css';
import './template-previews-pro.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');

const isEditor = isEditorPath(window.location.pathname);

createRoot(root).render(
  <StrictMode>
    {isEditor ? <EditorStudio /> : <DashboardApp />}
  </StrictMode>
);
