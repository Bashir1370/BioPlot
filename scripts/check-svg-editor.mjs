// Run with: node scripts/check-svg-editor.mjs (starts its own Vite server).
// Test dependency: npm install --no-save --package-lock=false @playwright/test@1.51.1
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {createServer} from 'vite';
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});
await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1400,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try {
  await page.goto('http://127.0.0.1:5173/editor');
  await page.waitForSelector('.studio-shell');
  await page.evaluate(async()=>{
    const {SvgEditingSession}=await import('/src/SvgTemplateEditor.tsx');
    const {sanitizeSvg}=await import('/src/assets.ts');
    const iframe=document.createElement('iframe');iframe.style.cssText='position:fixed;inset:0;width:1000px;height:650px;z-index:100000;background:white';document.body.append(iframe);
    iframe.contentDocument.head.innerHTML='<style>body{margin:0}body>svg{position:absolute;inset:0;width:100%;height:100%}.node-overlay{pointer-events:none}</style>';
    const source='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200"><defs><linearGradient id="color"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs><g id="group" transform="translate(20 10) scale(1.2)"><rect id="box" x="20" y="20" width="80" height="60" fill="url(#color)"/><path id="curve" d="M120 40C130 10 140 90 160 40" stroke="black" fill="none"/></g><circle id="dot" cx="300" cy="100" r="15" fill="green"/></svg>';
    const safe=sanitizeSvg(source);if(!safe.includes('url(#color)'))throw new Error('Gradient lost');
    const bad=sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://example.org/evil)" onclick="alert(1)"/><script>alert(1)</script></svg>');if(bad.includes('onclick')||bad.includes('<script')||bad.includes('https://'))throw new Error('Sanitization regressed');
    window.session=new SvgEditingSession(iframe.contentDocument,safe,state=>window.sessionState=state);window.testFrame=iframe;
    window.session.pick(window.session.root.querySelector('#box'));window.session.enterNodes();
  });
  assert.equal(await page.evaluate(()=>window.session.overlay.querySelectorAll('[data-handle]').length),4);
  const frame=page.frames().find(f=>f!==page.mainFrame()&&f.url()==='about:blank');
  const handle=frame.locator('[data-handle="2"]');const bounds=await handle.boundingBox();
  await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+35,bounds.y+20,{steps:4});await page.mouse.up();
  assert.equal(await page.evaluate(()=>window.session.index),2,'drag should be one undo step');
  await page.evaluate(()=>window.session.removeNode());
  assert.equal(await page.evaluate(()=>window.session.overlay.querySelectorAll('[data-handle]').length),3,'rectangle becomes triangle');
  await page.evaluate(()=>window.session.restore(-1));
  assert.equal(await page.evaluate(()=>window.session.root.querySelector('#box').getAttribute('d').match(/[ML]/g).length),4);
  await page.evaluate(()=>{const s=window.session;s.pick(s.root.querySelector('#curve'));s.enterNodes();});
  assert.equal(await page.evaluate(()=>window.session.overlay.querySelectorAll('[data-handle]').length),4,'curve anchors and control handles');
  await page.evaluate(()=>{const s=window.session;s.pick(s.root.querySelector('#dot'));s.remove();s.add('rect');s.addSvg('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><path d="M0 0L10 0L0 10Z"/></svg>');});
  assert.equal(await page.evaluate(()=>!!window.session.root.querySelector('#dot')),false);
  assert.equal(await page.evaluate(()=>window.session.root.querySelectorAll('svg').length),1);
  await page.evaluate(()=>{const s=window.session;s.pick(s.root.querySelector('#group'));s.ungroup();});
  assert.equal(await page.evaluate(()=>!!window.session.root.querySelector('#group')),false);
  await page.evaluate(()=>{window.session.dispose();window.testFrame.remove();});
  // Exercise the actual Canvas integration through an uploaded SVG asset.
  const input=page.locator('input[type=file][accept*="svg"]');
  if(await input.count()===0){await page.getByRole('button',{name:/Upload|آپلود/}).first().click();}
  await page.locator('input[type=file][accept*="svg"]').first().setInputFiles({name:'editable-test.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect id="test-rectangle" width="100" height="100" fill="red"/></svg>')});
  await page.getByRole('button',{name:/Edit SVG components|ویرایش اجزای SVG/}).click();
  await page.locator('.svg-editor-layers button').filter({hasText:'test-rectangle'}).click();
  await page.getByRole('button',{name:/^Edit nodes$|^ویرایش نقاط$/}).click();
  const modalFrame=page.frameLocator('.svg-editor-workspace iframe');
  await modalFrame.locator('[data-handle="2"]').click();
  await page.getByRole('button',{name:/^Delete node$|^حذف نقطه$/}).click();
  await page.screenshot({path:'/tmp/bioplot-svg-editor-open.png'});
  await page.getByRole('button',{name:/Apply changes|اعمال تغییرات/}).click();
  await page.waitForSelector('.svg-editor-dialog',{state:'detached'});
  assert.equal(await page.locator('.studio-artboard #test-rectangle').getAttribute('d'),'M0 0 L100 0 L0 100 Z');
  await page.getByRole('button',{name:/^Undo$|^واگرد$/}).first().click();
  assert.equal(await page.locator('.studio-artboard #test-rectangle').evaluate(el=>el.localName),'rect');
  await page.getByRole('button',{name:/Edit SVG components|ویرایش اجزای SVG/}).click();
  await page.getByRole('button',{name:/\+ Ellipse|\+ بیضی/}).click();
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('button',{name:/^Cancel$|^انصراف$/}).click();
  assert.equal(await page.locator('.studio-artboard ellipse').count(),0,'Cancel must not change the document');
  assert.deepEqual(errors,[]);
  await page.screenshot({path:'/tmp/bioplot-svg-editor-verified.png'});
  console.log('PASS: SVG import, nested transforms, real pointer drag, rectangle→triangle, Bézier handles, local undo, add/remove, ungroup, apply and project undo.');
} finally {await browser.close();await server.close();}
