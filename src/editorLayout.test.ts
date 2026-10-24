// @vitest-environment jsdom
import {readFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {afterEach,describe,expect,it} from 'vitest';
function routeStyles(){
 const seen=new Set<string>();let css='';
 for(const source of ['src/main.tsx','src/EditorStudio.tsx','src/EditorRoute.tsx']){
  const code=readFileSync(source,'utf8');
  for(const match of code.matchAll(/import '(\.\/[^']+\.css)';/g)){
   const path=resolve(dirname(source),match[1]);if(seen.has(path))continue;seen.add(path);css+=readFileSync(path,'utf8')+'\n';
  }
 }
 const style=document.createElement('style');style.textContent=css;document.head.append(style);
}
afterEach(()=>{document.head.innerHTML='';document.body.innerHTML='';});
describe('lazy editor route layout',()=>{
 it.each(['ltr','rtl'])('keeps full-height canvas and horizontal header in %s',direction=>{
  document.documentElement.dir=direction;
  document.body.innerHTML=`<div class="studio-shell no-selection library-open inspector-closed pages-open" dir="${direction}"><header class="studio-topbar"></header><main class="studio-workspace"><section class="studio-canvas-zone"><div class="studio-canvas-scroll"></div></section></main></div>`;
  routeStyles();
  const header=getComputedStyle(document.querySelector('.studio-topbar')!);
  expect(header.display).toBe('flex');
  expect(getComputedStyle(document.querySelector('.studio-canvas-zone')!).display).toBe('block');
  expect(getComputedStyle(document.querySelector('.studio-canvas-scroll')!).height).toBe('100%');
 });
});
