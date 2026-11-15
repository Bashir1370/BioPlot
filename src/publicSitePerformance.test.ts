import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';

const read=(file:string)=>readFileSync(file,'utf8');

describe('Public site / postponed editor isolation',()=>{
 it('keeps the editor code and styles outside the public entry',()=>{
  const main=read('src/main.tsx');
  const vite=read('vite.config.ts');
  const devEditor=read('src/editor-main.tsx');
  const editorRoute=read('src/EditorRoute.tsx');
  expect(main).not.toContain("import('./EditorRoute')");
  expect(main).not.toContain('StudioContentProvider');
  expect(main).not.toContain('editor-studio.css');
  expect(main).not.toContain('tightAssetSelection');
  expect(main).toContain('<StudioComingSoon />');
  expect(vite).not.toMatch(/editor:\s*resolve\(/);
  expect(devEditor).toContain("import {EditorRoute} from './EditorRoute'");
  expect(editorRoute).toContain("import './editor-studio.css'");
 });
 it('loads the order content provider only on order routes',()=>{
  const main=read('src/main.tsx');
  expect(main).toContain("import('./orders/OrdersEntry')");
  expect(main).toContain("import('./orders/AdminStudioEntry')");
  expect(read('src/orders/OrdersEntry.tsx')).toContain('<StudioContentProvider>');
 });
 it('does not block Home on decoding the entire gallery',()=>{
  const gallery=read('src/components/ui/shuffle-grid.tsx');
  expect(gallery).not.toContain('Promise.all(images.slice');
  expect(gallery).not.toContain('decodeImage(');
  expect(gallery).toContain('loading={i<4?');
  expect(read('src/PortfolioShowcase.tsx')).toContain("rootMargin:'450px 0px'");
 });
});
