import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto('http://127.0.0.1:5173/editor');await page.waitForSelector('.studio-shell');
 await page.evaluate(async()=>{
  const {SvgEditingSession}=await import('/src/SvgTemplateEditor.tsx');
  const iframe=document.createElement('iframe');iframe.style.cssText='position:fixed;left:0;top:0;width:900px;height:600px;z-index:100000;background:white';document.body.append(iframe);
  iframe.contentDocument.head.innerHTML='<style>html,body{margin:0;width:100%;height:100%}body>svg:not(.node-overlay){position:absolute;left:24px;top:24px;width:calc(100% - 48px);height:calc(100% - 48px);overflow:visible;transform-origin:0 0;transform:translate(var(--svg-pan-x,0px),var(--svg-pan-y,0px)) scale(var(--svg-zoom,1))}.node-overlay{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}</style>';
  window.s=new SvgEditingSession(iframe.contentDocument,'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120"><g id="group" transform="translate(10 10)"><rect id="a" x="10" y="10" width="30" height="25" fill="red"/><rect id="b" x="100" y="20" width="30" height="25" fill="blue"/></g></svg>',state=>window.state=state);window.f=iframe;
  s.pick(s.root.querySelector('#a'));
 });
 const frame=page.frames().find(f=>f!==page.mainFrame()&&f.url()==='about:blank');
 let handle=await frame.locator('[data-transform=se]').boundingBox();
 const before=await frame.locator('#a').boundingBox();
 await page.mouse.move(handle.x+4,handle.y+4);await page.mouse.down();await page.mouse.move(handle.x+60,handle.y+40,{steps:5});await page.mouse.up();
 const after=await frame.locator('#a').boundingBox();assert.ok(after.width>before.width+40);assert.ok(after.height>before.height+20);
 assert.equal(await page.evaluate(()=>s.index),1,'resize is a single history step');
 handle=await frame.locator('[data-transform=rotate]').boundingBox();
 await page.mouse.move(handle.x+6,handle.y+6);await page.mouse.down();await page.mouse.move(handle.x+90,handle.y+90,{steps:6});await page.mouse.up();
 assert.ok(await frame.locator('#a').evaluate(e=>Math.abs(e.transform.baseVal.consolidate().matrix.b)>.05),'rotation changes matrix');
 await page.evaluate(()=>{s.restore(-1);s.restore(-1);});
 // Marquee starts on blank space and intersects two leaves, not their parent group.
 const a=await frame.locator('#a').boundingBox(),b=await frame.locator('#b').boundingBox();
 await page.mouse.move(b.x+b.width+12,b.y+b.height+12);await page.mouse.down();await page.mouse.move(a.x-12,a.y-12,{steps:8});
 assert.equal(await frame.locator('[data-marquee]').count(),1);await page.mouse.up();
 assert.equal(await page.evaluate(()=>s.selected.length),2);
 await page.evaluate(()=>s.group());assert.equal(await page.evaluate(()=>s.selected[0].children.length),2);
 // Drag a selected group by a child; selection must remain the group.
 const child=await frame.locator('#a').boundingBox();await page.mouse.move(child.x+10,child.y+10);await page.mouse.down();await page.mouse.move(child.x+35,child.y+35,{steps:3});await page.mouse.up();
 assert.equal(await page.evaluate(()=>s.selected[0].localName),'g');
 await page.evaluate(()=>s.ungroup());assert.equal(await page.evaluate(()=>s.selected.length),2);
 const groupedAcrossParents=await page.evaluate(()=>{
  const nested=s.doc.createElementNS('http://www.w3.org/2000/svg','g');nested.setAttribute('transform','translate(5 7) scale(.9)');s.root.append(nested);nested.append(s.root.querySelector('#b'));
  const a=s.root.querySelector('#a'),b=s.root.querySelector('#b');const before=[a,b].map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];});s.pick(a);s.pick(b,true);s.group();const after=[a,b].map(e=>{const r=e.getBoundingClientRect();return [r.x,r.y,r.width,r.height];});s.ungroup();return {before,after};
 });
 groupedAcrossParents.before.flat().forEach((value,i)=>assert.ok(Math.abs(value-groupedAcrossParents.after.flat()[i])<.01,'cross-parent grouping preserves geometry'));
 const source=await page.evaluate(()=>s.serialize());
 await page.mouse.move(400,300);await page.mouse.wheel(0,-200);await page.waitForFunction(()=>s.zoom>1);
 assert.equal(await page.evaluate(()=>s.serialize()),source,'camera zoom must not change stored SVG');
 // Fit must include artwork translated beyond the original SVG viewBox, with no camera state.
 const fit=await page.evaluate(()=>{const shape=s.root.querySelector('#b');shape.setAttribute('transform','translate(300 200)');s.checkpoint();const expected=s.root.getBBox(),output=s.fitted(),doc=new DOMParser().parseFromString(output,'image/svg+xml');return {box:[expected.x,expected.y,expected.width,expected.height],view:doc.documentElement.getAttribute('viewBox').split(' ').map(Number),output};});
 assert.ok(fit.view[0]<=fit.box[0]&&fit.view[1]<=fit.box[1]);assert.ok(fit.view[0]+fit.view[2]>=fit.box[0]+fit.box[2]);assert.ok(fit.view[1]+fit.view[3]>=fit.box[1]+fit.box[3]);assert.ok(!fit.output.includes('--svg-zoom'));
 await page.evaluate(()=>s.resetZoom());await frame.locator('#a').click();await page.keyboard.press('Delete');assert.equal(await frame.locator('#a').count(),0);
 await page.evaluate(()=>{s.dispose();f.remove();});
 // Main Canvas: wheel zoom, marquee, Delete and project undo.
 await page.evaluate(()=>{for(let i=0;i<2;i++)window.dispatchEvent(new CustomEvent('bioplot:insert-line-asset',{detail:{id:'line'+i,name:'test '+i,category:'Lines & Arrows',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40"><rect width="100" height="40" fill="blue"/></svg>',colorSlots:[]}}));});
 await page.waitForFunction(()=>document.querySelectorAll('.studio-object').length===2);
 let box=await page.locator('.studio-object').last().boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+180,box.y+box.height/2+80,{steps:8});await page.mouse.up();
 const zoom=await page.locator('.reference-zoom-controls input[type=range]').inputValue();
 const area=await page.locator('.studio-artboard').boundingBox();await page.mouse.move(area.x+50,area.y+50);await page.mouse.wheel(0,-180);
 await page.waitForFunction(z=>document.querySelector('.reference-zoom-controls input[type=range]').value!==z,zoom);
 const boxes=await page.locator('.studio-object').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
 const left=Math.min(...boxes.map(b=>b.x))-15,top=Math.min(...boxes.map(b=>b.y))-15,right=Math.max(...boxes.map(b=>b.right))+15,bottom=Math.max(...boxes.map(b=>b.bottom))+15;
 await page.mouse.move(left,top);await page.mouse.down();await page.mouse.move(right,bottom,{steps:10});assert.equal(await page.locator('.studio-marquee').count(),1);await page.mouse.up();
 await page.keyboard.press('Delete');assert.equal(await page.locator('.studio-object').count(),0);await page.keyboard.press('Control+z');assert.equal(await page.locator('.studio-object').count(),2);
 assert.deepEqual(errors,[]);console.log('PASS: resize, rotation, grouped dragging, marquee, grouping/ungrouping, fit outside viewBox, zoom independent of data, Delete, main Canvas zoom/marquee/Delete/Undo.');
}finally{await browser.close();await server.close();}
