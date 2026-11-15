// Independent, local-development entry for the postponed scientific editor.
// Production builds intentionally exclude editor.html and this entire dependency graph.
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {EditorRoute} from './EditorRoute';
import './styles-v3.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/vazirmatn';
import './persian-typography.css';

const root=document.getElementById('root');
if (!root) throw new Error('BioPlot editor root element was not found.');
void import('./tightAssetSelection').then(module=>module.installTightAssetSelection());
createRoot(root).render(<StrictMode><EditorRoute/></StrictMode>);
