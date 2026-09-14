import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { TemplatesPage } from './TemplatesPage';
import '@fontsource-variable/inter';
import '@fontsource-variable/vazirmatn';
import './persian-typography.css';

const root = document.getElementById('root');
if (!root) throw new Error('BioPlot templates root element was not found.');

createRoot(root).render(
  <StrictMode>
    <TemplatesPage />
  </StrictMode>,
);
