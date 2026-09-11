import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardApp } from './DashboardApp';
import { EditorApp } from './EditorApp';
import './styles-v3.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot root element was not found.');
const isEditor = window.location.pathname.endsWith('/editor.html') || window.location.pathname.endsWith('editor.html');

createRoot(root).render(
  <StrictMode>
    {isEditor ? <EditorApp /> : <DashboardApp />}
  </StrictMode>
);
