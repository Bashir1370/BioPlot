import {chromium} from '@playwright/test';
import {createServer} from 'vite';
import assert from 'node:assert/strict';
const server=await createServer({server:{host:'127.0.0.1',port:5173,strictPort:true}});await server.listen();
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1600,height:1050}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
try{
 await page.addInitScript(()=>localStorage.setItem('bioplot-lang','fa'));
 await page.goto('http://127.0.0.1:5173/editor');await page.waitForSelector('.studio-artboard');
 if(await page.getByRole('button',{name:'FA',exact:true}).count())await page.getByRole('button',{name:'FA',exact:true}).click();
 const title=page.getByRole('textbox',{name:'نام پروژه',exact:true});
 assert.equal(await title.inputValue(),'');assert.equal(await title.getAttribute('placeholder'),'نام پروژه را وارد کنید…');
 await page.evaluate(async()=>{
   const {saveCustomAsset}=await import('/src/assets.ts');
   saveCustomAsset({name:'Test cell',nameFa:'سلول آزمایشی',category:'Cell biology',svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#c4b5fd"/><circle cx="53" cy="55" r="25" fill="#7c3aed"/><ellipse cx="43" cy="36" rx="15" ry="7" fill="#e9d5ff"/></svg>',synonyms:{fa:[],en:[]},colorSlots:[],reviewStatus:'reviewed',premium:false,active:true});
 });
 const category=page.locator('.asset-category-select');
 assert.equal(await category.locator('option[value="Cell biology"]').textContent(),'زیست‌شناسی سلولی');
 await category.selectOption('Cell biology');await page.getByRole('button',{name:'افزودن سلول آزمایشی',exact:true}).click();
 await page.waitForSelector('.asset-style-panel');
 await page.locator('.asset-style-presets').getByRole('button',{name:'آبی',exact:true}).click();
 await page.getByRole('button',{name:'خروجی',exact:true}).first().click();
 await page.waitForSelector('.export-panel-refined');
 const text=await page.locator('.export-panel-refined').innerText();
 assert.ok(text.includes('تک‌ستونی'));assert.ok(!text.includes('Single column'));assert.ok(!text.includes('PUBLICATION EXPORT'));
 await page.screenshot({path:'/tmp/bioplot-editor-polish.png',fullPage:true});
 await title.fill('پروژه آزمایشی');await title.press('Tab');
 await page.waitForFunction(()=>location.search.includes('id='),{timeout:15000});
 await page.reload();await page.waitForSelector('.studio-shell');assert.equal(await title.inputValue(),'پروژه آزمایشی');
 const colors=await page.evaluate(async()=>{
   const {applyAssetPreset,assetSvgWithTint}=await import('/src/assetStyling.ts');
   const {objectToSvg}=await import('/src/export.ts');
   const {migrateDocument,createBlankDocument}=await import('/src/model.ts');
   const {categoryLabel}=await import('/src/editorLabels.ts');
   localStorage.setItem('bioplot_cloud_categories_v1',JSON.stringify([{slug:'Custom category',nameEn:'Custom category',nameFa:'دسته دلخواه',active:true}]));
   if(categoryLabel('Custom category',true)!=='دسته دلخواه')throw Error('Admin category name lost');
   const asset={id:'pixels',type:'asset',name:'test',assetId:'test',x:0,y:0,width:100,height:100,rotation:0,opacity:1,colors:[],svg:'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="0" width="30" height="80" fill="#404040"/><rect x="35" width="30" height="80" fill="#808080"/><rect x="70" width="30" height="80" fill="#c0c0c0"/></svg>'};
   const pixels=async svg=>{
     const image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);await image.decode();
     const canvas=document.createElement('canvas');canvas.width=100;canvas.height=100;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0,100,100);
     return [[15,40],[50,40],[85,40],[50,95]].map(([x,y])=>[...ctx.getImageData(x,y,1,1).data]);
   };
   const result={};
   for(const color of ['teal','blue','violet','pink','orange','green']){
     const styled=applyAssetPreset(asset,color),document=createBlankDocument();document.pages[0].objects=[styled];
     const restored=migrateDocument(JSON.parse(JSON.stringify(document))).pages[0].objects[0];
     if(restored.paletteColor!==styled.paletteColor)throw Error('Palette lost on reload');
     result[color]={preview:await pixels(assetSvgWithTint(styled)),export:await pixels('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">'+objectToSvg(styled)+'</svg>')};
   }
   return result;
 });
 for(const [name,{preview,export:output}] of Object.entries(colors)){
   assert.deepEqual(preview,output,`${name}: preview and export differ`);
   assert.equal(preview[3][3],0,'alpha preserved');
   assert.ok(preview[0][0]+preview[0][1]+preview[0][2]<preview[2][0]+preview[2][1]+preview[2][2],'shading preserved');
 }
 const blue=colors.blue.preview[1],green=colors.green.preview[1],orange=colors.orange.preview[1];
 assert.ok(blue[2]>blue[0]+80&&blue[2]>blue[1]+50,'blue is blue');
 assert.ok(green[1]>green[0]+80&&green[1]>green[2]+40,'green is green');
 assert.ok(orange[0]>orange[1]+80&&orange[1]>orange[2]+40,'orange is orange');
 await page.getByRole('button',{name:'EN',exact:true}).click();await page.getByRole('button',{name:'Export',exact:true}).first().click();
 assert.ok((await page.locator('.export-panel-refined').innerText()).includes('Single column'));
 assert.equal(await page.getByRole('textbox',{name:'Project name',exact:true}).inputValue(),'پروژه آزمایشی');
 assert.deepEqual(errors,[]);console.log('PASS: Persian categories/filtering, title save/reload, bilingual export, palette hue/shading/alpha, export parity and persistence.');
}finally{await browser.close();await server.close();}
