import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './DashboardApp';
import { EditorStudio } from './EditorStudio';
import './styles-v3.css';
import './home-top-nav.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');
const isEditor = window.location.pathname.endsWith('/editor.html') || window.location.pathname.endsWith('editor.html');

createRoot(root).render(
  <StrictMode>
    {isEditor ? <EditorStudio /> : <DashboardApp />}
  </StrictMode>
);
