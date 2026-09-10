const $=id=>document.getElementById(id);
const artboard=$('artboard'),panelContent=$('panelContent'),viewport=$('canvasViewport'),shell=$('artboardShell');
const selectionBox=$('selectionBox'),guideV=$('guideV'),guideH=$('guideH');
const propX=$('propX'),propY=$('propY'),propW=$('propW'),propH=$('propH'),propRotation=$('propRotation');
const opacityRange=$('opacityRange'),opacityValue=$('opacityValue'),selectionName=$('selectionName'),layersList=$('layersList');
const saveState=$('saveState'),contextBar=$('contextBar'),zoomValue=$('zoomValue'),langBtn=$('langBtn');
const state={panel:'assets',lang:'en',zoom:.8,selected:new Set(),history:[],redo:[],clipboard:[],groupSeq:1,objectSeq:20,editing:null};

const assets=[
{name:'Neuron',cat:'Neuroscience',svg:`<svg viewBox="0 0 90 70"><g fill="none" stroke="#3d8b86" stroke-width="4" stroke-linecap="round"><path d="M34 36C20 22 15 11 6 5"/><path d="M34 36C18 40 11 52 4 63"/><path d="M34 36C18 34 10 34 3 34"/><path d="M53 36C67 35 75 29 87 18"/><path d="M53 36C68 40 76 49 88 60"/></g><ellipse cx="43" cy="36" rx="16" ry="14" fill="#dff2ef" stroke="#3d8b86" stroke-width="3"/><circle cx="43" cy="36" r="5" fill="#78bcb6"/></svg>`},
{name:'Mitochondrion',cat:'Cell biology',svg:`<svg viewBox="0 0 90 60"><path d="M8 30C9 9 27 6 43 11c13 4 22-4 34 2 14 7 13 34-3 40-12 5-21-3-34 0-18 5-33-3-32-23Z" fill="#fee8cf" stroke="#d48d4c" stroke-width="3"/><path d="M22 21c9 11 14-8 23 5s14-6 25 5" fill="none" stroke="#d48d4c" stroke-width="3"/></svg>`},
{name:'DNA',cat:'Molecular biology',svg:`<svg viewBox="0 0 80 70"><path d="M20 5c28 18 12 43 40 60M60 5C32 23 48 48 20 65" fill="none" stroke="#6c5aa8" stroke-width="4"/><g stroke="#9d91cb" stroke-width="2"><path d="M27 12h26"/><path d="M22 24h36"/><path d="M27 36h26"/><path d="M22 48h36"/><path d="M27 60h26"/></g></svg>`},
{name:'Cell',cat:'Cell biology',svg:`<svg viewBox="0 0 80 70"><path d="M11 37C8 18 21 7 41 8s31 12 29 30c-2 17-14 25-31 24S14 54 11 37Z" fill="#e8f5ee" stroke="#5d9f80" stroke-width="3"/><circle cx="42" cy="35" r="12" fill="#b9decf" stroke="#5d9f80" stroke-width="2"/><circle cx="28" cy="23" r="3" fill="#f1ba75"/><circle cx="58" cy="49" r="3" fill="#f1ba75"/></svg>`},
{name:'Protein',cat:'Biochemistry',svg:`<svg viewBox="0 0 80 70"><path d="M12 44c5-27 29-39 47-24 17 14 7 38-11 39-17 1-19-19-36-15Z" fill="#e6eef8" stroke="#4f7da2" stroke-width="3"/><path d="M24 38c7-13 20-15 31-7-2 12-12 18-25 15" fill="none" stroke="#7fa3c1" stroke-width="3"/></svg>`},
{name:'Mouse',cat:'Models',svg:`<svg viewBox="0 0 90 70"><ellipse cx="43" cy="39" rx="27" ry="18" fill="#eef0f2" stroke="#7b8992" stroke-width="3"/><circle cx="66" cy="33" r="10" fill="#eef0f2" stroke="#7b8992" stroke-width="3"/><circle cx="69" cy="23" r="5" fill="#f2cfd1" stroke="#7b8992" stroke-width="2"/><circle cx="72" cy="32" r="2" fill="#273847"/><path d="M17 44C2 45 4 60 17 58" fill="none" stroke="#7b8992" stroke-width="3"/></svg>`}
];

const objectEls=()=>[...artboard.querySelectorAll('.canvas-object')];
const selectedEls=()=>[...state.selected].filter(el=>el?.isConnected);
const uid=()=>`obj-${Date.now().toString(36)}-${state.objectSeq++}`;
const num=(v,f=0)=>Number.isFinite(parseFloat(v))?parseFloat(v):f;
const rotationOf=el=>num((el.style.getPropertyValue('--rot')||'0').replace('deg',''),0);
const setRotation=(el,d)=>el.style.setProperty('--rot',`${Math.round(d*10)/10}deg`);
const rectOf=el=>({x:num(el.style.left),y:num(el.style.top),w:el.offsetWidth,h:el.offsetHeight});

function boundsOf(els=selectedEls()){
  if(!els.length)return null;
  const rs=els.map(rectOf),x=Math.min(...rs.map(r=>r.x)),y=Math.min(...rs.map(r=>r.y));
  const right=Math.max(...rs.map(r=>r.x+r.w)),bottom=Math.max(...rs.map(r=>r.y+r.h));
  return {x,y,w:right-x,h:bottom-y,right,bottom,cx:(x+right)/2,cy:(y+bottom)/2};
}
function cleanClone(){
  const clone=artboard.cloneNode(true);
  clone.querySelector('#selectionBox')?.remove();clone.querySelector('#guideV')?.remove();clone.querySelector('#guideH')?.remove();
  clone.querySelectorAll('.is-selected').forEach(e=>e.classList.remove('is-selected'));
  clone.querySelectorAll('[contenteditable]').forEach(e=>e.removeAttribute('contenteditable'));
  return clone;
}
function snapshot(){return cleanClone().innerHTML}
function saveSnapshot(){state.history.push(snapshot());if(state.history.length>40)state.history.shift();state.redo=[];updateHistoryButtons()}
function restore(html){
  artboard.innerHTML=html;
  artboard.insertAdjacentHTML('beforeend',`<div id="guideV" class="snap-guide vertical hidden"></div><div id="guideH" class="snap-guide horizontal hidden"></div><div id="selectionBox" class="selection-box hidden"><div class="rotate-stem"></div><button class="rotate-handle" data-rotate title="Rotate"></button><button class="resize-handle nw" data-resize="nw"></button><button class="resize-handle n" data-resize="n"></button><button class="resize-handle ne" data-resize="ne"></button><button class="resize-handle e" data-resize="e"></button><button class="resize-handle se" data-resize="se"></button><button class="resize-handle s" data-resize="s"></button><button class="resize-handle sw" data-resize="sw"></button><button class="resize-handle w" data-resize="w"></button></div>`);
  rebindGlobals();state.selected.clear();bindAllObjects();bindSelectionBox();renderSelection();renderLayers();renderContext();
}
function rebindGlobals(){window.selectionBox=$('selectionBox');window.guideV=$('guideV');window.guideH=$('guideH')}
function markSaved(){
  saveState.textContent=
    state.lang==='fa'
      ?'در حال ذخیره…'
      :'Saving…';

  window.dispatchEvent(
    new CustomEvent('bioplot:document-changed')
  );

  clearTimeout(window._save);

  window._save=setTimeout(()=>{
    saveState.textContent=
      state.lang==='fa'
        ?'ذخیره محلی شد'
        :'Saved locally';
  },350);
}
function updateHistoryButtons(){$('undoBtn').disabled=!state.history.length;$('redoBtn').disabled=!state.redo.length}

function assetPanel(){return `<h2 class="panel-title" data-en="Scientific library" data-fa="کتابخانه علمی">Scientific library</h2><div class="search-box"><input id="assetSearch" placeholder="Search cells, proteins, organs…"></div><div class="chip-row"><button class="chip active" data-cat="All">All</button><button class="chip" data-cat="Cell biology">Cell</button><button class="chip" data-cat="Neuroscience">Neuro</button><button class="chip" data-cat="Molecular biology">Molecular</button></div><div class="section-label"><span>Recommended</span><span style="color:var(--muted);font-weight:500">${assets.length} assets</span></div><div id="assetGrid" class="asset-grid">${assets.map((a,i)=>`<button class="asset-card" data-asset="${i}" data-cat-name="${a.cat}">${a.svg}<small>${a.name}</small></button>`).join('')}</div>`}
function templatesPanel(){return `<h2 class="panel-title" data-en="Templates" data-fa="قالب‌ها">Templates</h2><div class="search-box"><input placeholder="Search scientific templates…"></div><div class="template-stack"><button class="template-card"><div class="template-preview"><div class="template-sheet"></div></div><div class="template-meta"><b>Mechanism figure</b><span>Publication-ready pathway</span></div></button><button class="template-card"><div class="template-preview"><div class="template-sheet"></div></div><div class="template-meta"><b>Graphical abstract</b><span>Structured manuscript summary</span></div></button><button class="template-card"><div class="template-preview"><div class="template-sheet"></div></div><div class="template-meta"><b>Experimental workflow</b><span>Methods and study design</span></div></button></div>`}
function designPanel(){return `<h2 class="panel-title" data-en="Design tools" data-fa="ابزار طراحی">Design tools</h2><div class="design-stack"><button class="design-action" data-create="text"><b>T</b><span>Text</span></button><button class="design-action" data-create="shape"><b>□</b><span>Shape</span></button><button class="design-action" data-create="arrow"><b>→</b><span>Arrow</span></button><button class="design-action" data-create="line"><b>—</b><span>Line</span></button><button class="design-action" data-create="label"><b>Aa</b><span>Label</span></button></div>`}
function plotsPanel(){return `<h2 class="panel-title" data-en="Plots & data" data-fa="نمودار و داده">Plots & data</h2><p style="color:var(--muted);font-size:11px;margin-top:-4px">Data visualization lives in the same BioPlot workspace.</p><div class="plot-grid"><button class="plot-card" data-plot="Bar plot"><div class="plot-preview bars"><i style="height:35%"></i><i style="height:70%"></i><i style="height:50%"></i><i style="height:88%"></i></div><small>Bar plot</small></button><button class="plot-card" data-plot="Scatter"><div class="plot-preview scatter"><i style="left:20%;top:62%"></i><i style="left:37%;top:37%"></i><i style="left:56%;top:52%"></i><i style="left:71%;top:24%"></i></div><small>Scatter</small></button><button class="plot-card" data-plot="Volcano"><div class="plot-preview bars"><i style="height:80%"></i><i style="height:45%"></i><i style="height:65%"></i><i style="height:32%"></i></div><small>Volcano</small></button><button class="plot-card" data-plot="PCA"><div class="plot-preview scatter"><i style="left:25%;top:28%"></i><i style="left:44%;top:61%"></i><i style="left:60%;top:33%"></i><i style="left:76%;top:68%"></i></div><small>PCA</small></button></div><div style="margin-top:12px;padding:10px;border-radius:9px;background:#f2f7fb;color:#4d6f86;font-size:10px">Prototype plots are insertable now. Statistical data binding comes in the next data module.</div>`}
function uploadPanel(){return `<h2 class="panel-title" data-en="Upload" data-fa="آپلود">Upload</h2><div class="upload-drop"><div style="font-size:26px;margin-bottom:7px">⇧</div><b>Import editable SVG</b><p style="font-size:10px">SVG assets are inserted as scalable BioPlot objects.</p><button id="chooseSvg" class="ghost-btn">Choose SVG</button></div>`}
function renderPanel(){panelContent.innerHTML=state.panel==='assets'?assetPanel():state.panel==='templates'?templatesPanel():state.panel==='design'?designPanel():state.panel==='plots'?plotsPanel():uploadPanel();bindPanel();applyLanguage()}
function bindPanel(){
  document.querySelectorAll('[data-asset]').forEach(btn=>btn.onclick=()=>addAsset(assets[+btn.dataset.asset]));
  document.querySelectorAll('[data-create]').forEach(btn=>btn.onclick=()=>createObject(btn.dataset.create));
  document.querySelectorAll('[data-plot]').forEach(btn=>btn.onclick=()=>createPlot(btn.dataset.plot));
  $('chooseSvg')&&($('chooseSvg').onclick=()=>$('svgInput').click());
  const search=$('assetSearch');if(search)search.oninput=()=>filterAssets(search.value,document.querySelector('.chip.active')?.dataset.cat||'All');
  document.querySelectorAll('.chip[data-cat]').forEach(chip=>chip.onclick=()=>{document.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));chip.classList.add('active');filterAssets(search?.value||'',chip.dataset.cat)});
}
function filterAssets(q,cat){q=q.toLowerCase();document.querySelectorAll('.asset-card').forEach((card,i)=>{const a=assets[i],okText=a.name.toLowerCase().includes(q)||a.cat.toLowerCase().includes(q),okCat=cat==='All'||a.cat===cat;card.style.display=okText&&okCat?'grid':'none'})}

function bindAllObjects(){objectEls().forEach(bindObject)}
function bindObject(el){
  if(!el.dataset.id)el.dataset.id=uid();
  el.onpointerdown=e=>{
    if(state.editing===el)return;
    e.stopPropagation();
    if(e.shiftKey)toggleSelection(el);else if(!state.selected.has(el))selectOnly(el);else if(el.dataset.group)selectGroup(el.dataset.group);
    beginMove(e);
  };
  if(el.dataset.type==='text'){
    el.ondblclick=e=>{e.stopPropagation();enterTextEdit(el)};
  }
}
function selectOnly(el){state.selected.clear();if(el?.dataset.group)selectGroup(el.dataset.group,false);else if(el)state.selected.add(el);renderSelection()}
function selectGroup(groupId,clear=true){if(clear)state.selected.clear();objectEls().filter(o=>o.dataset.group===groupId).forEach(o=>state.selected.add(o));renderSelection()}
function toggleSelection(el){if(el.dataset.group){const members=objectEls().filter(o=>o.dataset.group===el.dataset.group),all=members.every(m=>state.selected.has(m));members.forEach(m=>all?state.selected.delete(m):state.selected.add(m))}else state.selected.has(el)?state.selected.delete(el):state.selected.add(el);renderSelection()}
function renderSelection(){
  objectEls().forEach(o=>o.classList.toggle('is-selected',state.selected.has(o)));
  const box=boundsOf();
  const sel=$('selectionBox');
  if(!box){sel.classList.add('hidden')}else{sel.classList.remove('hidden');Object.assign(sel.style,{left:`${box.x}px`,top:`${box.y}px`,width:`${box.w}px`,height:`${box.h}px`})}
  syncProps();renderLayers();renderContext();
}
function syncProps(){
  const els=selectedEls(),box=boundsOf();
  selectionName.textContent=!els.length?(state.lang==='fa'?'بدون انتخاب':'No selection'):els.length===1?(els[0].dataset.label||'Object'):`${els.length} ${state.lang==='fa'?'آبجکت':'objects'}`;
  [propX,propY,propW,propH,propRotation,opacityRange].forEach(i=>i.disabled=!els.length);
  if(!box)return;
  propX.value=Math.round(box.x);propY.value=Math.round(box.y);propW.value=Math.round(box.w);propH.value=Math.round(box.h);
  propRotation.value=els.length===1?Math.round(rotationOf(els[0])):'';
  const op=Math.round(els.reduce((s,e)=>s+(num(e.style.opacity,1)),0)/els.length*100);opacityRange.value=op;opacityValue.textContent=op+'%';
}
function renderLayers(){
  const reversed=objectEls().reverse();
  layersList.innerHTML=reversed.map((o,i)=>`<div class="layer-item ${state.selected.has(o)?'active':''}" data-layer-id="${o.dataset.id}"><span class="layer-dot"></span><span>${o.dataset.label||'Object'}${o.dataset.group?' · G':''}</span><span class="layer-actions"><button data-layer-up="${o.dataset.id}" title="Bring forward">↑</button><button data-layer-down="${o.dataset.id}" title="Send backward">↓</button></span></div>`).join('');
  document.querySelectorAll('[data-layer-id]').forEach(item=>item.onclick=e=>{if(e.target.closest('button'))return;const el=objectEls().find(o=>o.dataset.id===item.dataset.layerId);e.shiftKey?toggleSelection(el):selectOnly(el)});
  document.querySelectorAll('[data-layer-up]').forEach(b=>b.onclick=e=>{e.stopPropagation();reorderLayer(b.dataset.layerUp,1)});
  document.querySelectorAll('[data-layer-down]').forEach(b=>b.onclick=e=>{e.stopPropagation();reorderLayer(b.dataset.layerDown,-1)});
}
function renderContext(){
  const els=selectedEls(),single=els.length===1,t=single?els[0].dataset.type:null,grouped=els.length>0&&els.every(e=>e.dataset.group)&&new Set(els.map(e=>e.dataset.group)).size===1;
  if(!els.length){contextBar.innerHTML=`<button class="context-tool">↖ Select</button><button class="context-tool" data-new="text">T Text</button><button class="context-tool" data-new="shape">□ Shape</button><button class="context-tool" data-new="arrow">→ Arrow</button>`}
  else contextBar.innerHTML=`${single&&t==='text'?'<button class="context-tool" data-edit-text>✎ Edit text</button><span class="context-sep"></span>':''}<button class="context-tool" data-duplicate>⧉ Duplicate</button><button class="context-tool" data-copy>Copy</button><span class="context-sep"></span>${els.length>1&&!grouped?'<button class="context-tool" data-group>Group</button>':''}${grouped?'<button class="context-tool" data-ungroup>Ungroup</button>':''}<button class="context-tool" data-front>Front</button><button class="context-tool" data-back>Back</button><button class="context-tool" data-delete>Delete</button>`;
  contextBar.querySelectorAll('[data-new]').forEach(b=>b.onclick=()=>createObject(b.dataset.new));
  contextBar.querySelector('[data-edit-text]')&&(contextBar.querySelector('[data-edit-text]').onclick=()=>enterTextEdit(els[0]));
  contextBar.querySelector('[data-duplicate]')&&(contextBar.querySelector('[data-duplicate]').onclick=duplicateSelected);
  contextBar.querySelector('[data-copy]')&&(contextBar.querySelector('[data-copy]').onclick=copySelected);
  contextBar.querySelector('[data-group]')&&(contextBar.querySelector('[data-group]').onclick=groupSelected);
  contextBar.querySelector('[data-ungroup]')&&(contextBar.querySelector('[data-ungroup]').onclick=ungroupSelected);
  contextBar.querySelector('[data-front]')&&(contextBar.querySelector('[data-front]').onclick=()=>arrangeSelection('front'));
  contextBar.querySelector('[data-back]')&&(contextBar.querySelector('[data-back]').onclick=()=>arrangeSelection('back'));
  contextBar.querySelector('[data-delete]')&&(contextBar.querySelector('[data-delete]').onclick=deleteSelected);
}

function beginMove(e){
  const els=selectedEls();if(!els.length)return;saveSnapshot();
  const startX=e.clientX,startY=e.clientY,starts=els.map(el=>({el,...rectOf(el)})),box=boundsOf(els);let moved=false;
  const move=ev=>{moved=true;let dx=(ev.clientX-startX)/state.zoom,dy=(ev.clientY-startY)/state.zoom;const snapped=snapMove(box,dx,dy,els);dx=snapped.dx;dy=snapped.dy;starts.forEach(s=>{s.el.style.left=`${s.x+dx}px`;s.el.style.top=`${s.y+dy}px`});renderSelectionBoxOnly()};
  const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);hideGuides();if(!moved)state.history.pop();updateHistoryButtons();renderSelection();markSaved()};
  document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
}
function snapMove(box,dx,dy,els){
  const threshold=6,target={x:box.x+dx,y:box.y+dy,w:box.w,h:box.h};target.right=target.x+target.w;target.bottom=target.y+target.h;target.cx=target.x+target.w/2;target.cy=target.y+target.h/2;
  const others=objectEls().filter(o=>!els.includes(o)).map(rectOf);const vx=[artboard.clientWidth/2,...others.flatMap(r=>[r.x,r.x+r.w,r.x+r.w/2])],hy=[artboard.clientHeight/2,...others.flatMap(r=>[r.y,r.y+r.h,r.y+r.h/2])];
  const tx=[target.x,target.right,target.cx],ty=[target.y,target.bottom,target.cy];let bestX=null,bestY=null;
  vx.forEach(v=>tx.forEach(x=>{const d=v-x;if(Math.abs(d)<=threshold&&(!bestX||Math.abs(d)<Math.abs(bestX.d)))bestX={v,d}}));
  hy.forEach(v=>ty.forEach(y=>{const d=v-y;if(Math.abs(d)<=threshold&&(!bestY||Math.abs(d)<Math.abs(bestY.d)))bestY={v,d}}));
  if(bestX){dx+=bestX.d;const g=$('guideV');g.style.left=bestX.v+'px';g.classList.remove('hidden')}else $('guideV').classList.add('hidden');
  if(bestY){dy+=bestY.d;const g=$('guideH');g.style.top=bestY.v+'px';g.classList.remove('hidden')}else $('guideH').classList.add('hidden');
  return {dx,dy};
}
function hideGuides(){$('guideV').classList.add('hidden');$('guideH').classList.add('hidden')}
function renderSelectionBoxOnly(){const box=boundsOf();const sel=$('selectionBox');if(!box)return;Object.assign(sel.style,{left:`${box.x}px`,top:`${box.y}px`,width:`${box.w}px`,height:`${box.h}px`})}

function bindSelectionBox(){
  const sel=$('selectionBox');
  sel.onpointerdown=e=>{if(e.target.dataset.resize||e.target.dataset.rotate)return;e.stopPropagation();beginMove(e)};
  sel.querySelectorAll('[data-resize]').forEach(h=>h.onpointerdown=e=>beginResize(e,h.dataset.resize));
  sel.querySelector('[data-rotate]').onpointerdown=beginRotate;
}
function beginResize(e,handle){
  e.stopPropagation();e.preventDefault();const els=selectedEls();if(!els.length)return;saveSnapshot();
  const start={x:e.clientX,y:e.clientY},box=boundsOf(els),starts=els.map(el=>({el,...rectOf(el)}));
  const move=ev=>{const dx=(ev.clientX-start.x)/state.zoom,dy=(ev.clientY-start.y)/state.zoom;let nb={...box};
    if(handle.includes('e'))nb.w=Math.max(12,box.w+dx);if(handle.includes('s'))nb.h=Math.max(12,box.h+dy);
    if(handle.includes('w')){nb.x=Math.min(box.x+box.w-12,box.x+dx);nb.w=box.w+(box.x-nb.x)}
    if(handle.includes('n')){nb.y=Math.min(box.y+box.h-12,box.y+dy);nb.h=box.h+(box.y-nb.y)}
    const sx=nb.w/box.w,sy=nb.h/box.h;starts.forEach(s=>{s.el.style.left=`${nb.x+(s.x-box.x)*sx}px`;s.el.style.top=`${nb.y+(s.y-box.y)*sy}px`;s.el.style.width=`${Math.max(8,s.w*sx)}px`;s.el.style.height=`${Math.max(8,s.h*sy)}px`});renderSelectionBoxOnly();syncProps();
  };
  const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);renderSelection();markSaved()};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
}
function beginRotate(e){
  e.stopPropagation();e.preventDefault();const els=selectedEls();if(!els.length)return;saveSnapshot();const box=boundsOf(els),art=artboard.getBoundingClientRect(),cx=art.left+(box.cx*state.zoom),cy=art.top+(box.cy*state.zoom);const starts=els.map(el=>({el,rot:rotationOf(el)}));const startA=Math.atan2(e.clientY-cy,e.clientX-cx)*180/Math.PI;
  const move=ev=>{const a=Math.atan2(ev.clientY-cy,ev.clientX-cx)*180/Math.PI,delta=a-startA;starts.forEach(s=>setRotation(s.el,s.rot+delta));if(els.length===1)propRotation.value=Math.round(rotationOf(els[0]))};
  const up=()=>{document.removeEventListener('pointermove',move);document.removeEventListener('pointerup',up);markSaved()};document.addEventListener('pointermove',move);document.addEventListener('pointerup',up,{once:true});
}

function addAsset(asset){saveSnapshot();const el=document.createElement('div');el.className='canvas-object';el.dataset.id=uid();el.dataset.label=asset.name;el.dataset.type='asset';el.style.cssText='left:390px;top:400px;width:140px;height:100px;--rot:0deg';el.innerHTML=asset.svg.replace('<svg ','<svg width="100%" height="100%" ');artboard.insertBefore(el,$('guideV'));bindObject(el);selectOnly(el);markSaved()}
function createObject(type){saveSnapshot();const el=document.createElement('div');el.className='canvas-object';el.dataset.id=uid();el.dataset.type=type;el.style.cssText='left:390px;top:410px;--rot:0deg';
  if(type==='text'){el.dataset.label='Scientific text';el.classList.add('text-object');el.style.cssText+=';width:190px;height:42px';el.textContent='Scientific annotation'}
  else if(type==='shape'){el.dataset.label='Shape';el.classList.add('shape-object');el.style.cssText+=';width:130px;height:82px'}
  else if(type==='arrow'){el.dataset.label='Arrow';el.classList.add('arrow-object');el.style.cssText+=';width:110px;height:44px';el.textContent='→'}
  else if(type==='line'){el.dataset.label='Line';el.classList.add('line-object');el.style.cssText+=';width:150px;height:3px'}
  else{el.dataset.label='Label';el.dataset.type='text';el.classList.add('label-object');el.style.cssText+=';width:110px;height:36px';el.textContent='Label'}
  artboard.insertBefore(el,$('guideV'));bindObject(el);selectOnly(el);markSaved()}
function createPlot(label){saveSnapshot();const el=document.createElement('div');el.className='canvas-object plot-object';el.dataset.id=uid();el.dataset.type='plot';el.dataset.label=label;el.style.cssText='left:365px;top:410px;width:220px;height:120px;--rot:0deg';el.innerHTML='<i style="height:35%"></i><i style="height:70%"></i><i style="height:48%"></i><i style="height:88%"></i><i style="height:62%"></i>';artboard.insertBefore(el,$('guideV'));bindObject(el);selectOnly(el);markSaved()}
function duplicateSelected(){const els=selectedEls();if(!els.length)return;saveSnapshot();const clones=els.map(el=>{const c=el.cloneNode(true);c.dataset.id=uid();delete c.dataset.group;c.style.left=(num(el.style.left)+18)+'px';c.style.top=(num(el.style.top)+18)+'px';artboard.insertBefore(c,$('guideV'));bindObject(c);return c});state.selected=new Set(clones);renderSelection();markSaved()}
function deleteSelected(){const els=selectedEls();if(!els.length)return;saveSnapshot();els.forEach(el=>el.remove());state.selected.clear();renderSelection();markSaved()}
function groupSelected(){const els=selectedEls();if(els.length<2)return;saveSnapshot();const id='g'+state.groupSeq++;els.forEach(el=>el.dataset.group=id);renderSelection();markSaved()}
function ungroupSelected(){const els=selectedEls();if(!els.length)return;saveSnapshot();els.forEach(el=>delete el.dataset.group);renderSelection();markSaved()}
function copySelected(){state.clipboard=selectedEls().map(el=>el.outerHTML)}
function pasteClipboard(){if(!state.clipboard.length)return;saveSnapshot();const clones=state.clipboard.map(html=>{const wrap=document.createElement('div');wrap.innerHTML=html;const c=wrap.firstElementChild;c.dataset.id=uid();delete c.dataset.group;c.classList.remove('is-selected');c.style.left=(num(c.style.left)+24)+'px';c.style.top=(num(c.style.top)+24)+'px';artboard.insertBefore(c,$('guideV'));bindObject(c);return c});state.selected=new Set(clones);renderSelection();markSaved()}
function reorderLayer(id,dir){const el=objectEls().find(o=>o.dataset.id===id);if(!el)return;saveSnapshot();if(dir>0){let n=el.nextElementSibling;while(n&& !n.classList.contains('canvas-object'))n=n.nextElementSibling;if(n)n.after(el)}else{let p=el.previousElementSibling;while(p&& !p.classList.contains('canvas-object'))p=p.previousElementSibling;if(p)p.before(el)}renderLayers();markSaved()}
function arrangeSelection(where){const els=selectedEls();if(!els.length)return;saveSnapshot();if(where==='front')els.forEach(el=>artboard.insertBefore(el,$('guideV')));else els.slice().reverse().forEach(el=>{const first=artboard.querySelector('.canvas-object');first?artboard.insertBefore(el,first):artboard.insertBefore(el,$('guideV'))});renderLayers();markSaved()}

function enterTextEdit(el){if(!el||el.dataset.type!=='text')return;state.editing=el;el.setAttribute('contenteditable','true');el.focus();document.execCommand?.('selectAll',false,null);el.onblur=()=>exitTextEdit(el);el.onkeydown=e=>{if(e.key==='Escape'){e.preventDefault();el.blur()}if((e.ctrlKey||e.metaKey)&&e.key==='Enter')el.blur()}}
function exitTextEdit(el){el.removeAttribute('contenteditable');state.editing=null;el.dataset.label=(el.textContent||'Text').trim().slice(0,32)||'Text';renderLayers();markSaved()}

function undo(){if(!state.history.length)return;state.redo.push(snapshot());restore(state.history.pop());updateHistoryButtons();markSaved()}
function redo(){if(!state.redo.length)return;state.history.push(snapshot());restore(state.redo.pop());updateHistoryButtons();markSaved()}
function setZoom(z){state.zoom=Math.max(.45,Math.min(1.35,z));shell.style.transform=`scale(${state.zoom})`;zoomValue.textContent=Math.round(state.zoom*100)+'%'}
function applyLanguage(){const fa=state.lang==='fa';document.documentElement.lang=fa?'fa':'en';document.documentElement.dir=fa?'rtl':'ltr';document.body.classList.toggle('rtl',fa);langBtn.textContent=fa?'EN':'FA';document.querySelectorAll('[data-en]').forEach(el=>el.textContent=fa?el.dataset.fa:el.dataset.en);syncProps()}

function applyBoxFromProps(){const els=selectedEls(),old=boundsOf();if(!els.length||!old)return;saveSnapshot();const nb={x:num(propX.value,old.x),y:num(propY.value,old.y),w:Math.max(8,num(propW.value,old.w)),h:Math.max(8,num(propH.value,old.h))},sx=nb.w/old.w,sy=nb.h/old.h;els.forEach(el=>{const r=rectOf(el);el.style.left=`${nb.x+(r.x-old.x)*sx}px`;el.style.top=`${nb.y+(r.y-old.y)*sy}px`;el.style.width=`${Math.max(8,r.w*sx)}px`;el.style.height=`${Math.max(8,r.h*sy)}px`});renderSelection();markSaved()}
function applyRotationProp(){const els=selectedEls();if(!els.length)return;saveSnapshot();els.forEach(el=>setRotation(el,num(propRotation.value)));renderSelection();markSaved()}

async function importSvg(file){if(!file)return;const text=await file.text();if(!/<svg[\s>]/i.test(text)){alert('Please choose a valid SVG file.');return}const parsed=new DOMParser().parseFromString(text,'image/svg+xml');const svg=parsed.documentElement;if(!svg||svg.nodeName.toLowerCase()!=='svg'||parsed.querySelector('parsererror')){alert('Please choose a valid SVG file.');return}parsed.querySelectorAll('script,foreignObject,iframe,object,embed').forEach(n=>n.remove());parsed.querySelectorAll('*').forEach(n=>{[...n.attributes].forEach(a=>{const name=a.name.toLowerCase(),value=a.value.trim().toLowerCase();if(name.startsWith('on')||((name==='href'||name.endsWith(':href'))&&value.startsWith('javascript:')))n.removeAttribute(a.name)})});saveSnapshot();const el=document.createElement('div');el.className='canvas-object';el.dataset.id=uid();el.dataset.type='asset';el.dataset.label=file.name.replace(/\.svg$/i,'');el.style.cssText='left:370px;top:380px;width:180px;height:140px;--rot:0deg';const safeSvg=new XMLSerializer().serializeToString(svg);el.innerHTML=safeSvg;const inserted=el.querySelector('svg');if(inserted){inserted.setAttribute('width','100%');inserted.setAttribute('height','100%')}artboard.insertBefore(el,$('guideV'));bindObject(el);selectOnly(el);markSaved()}
async function buildExportSvg(){const clone=cleanClone();clone.removeAttribute('id');clone.style.boxShadow='none';clone.style.margin='0';const css=await fetch('styles.css').then(r=>r.text()).catch(()=>'.artboard{position:relative;width:960px;height:620px;background:#fff}.canvas-object{position:absolute}');const xhtml=`<div xmlns="http://www.w3.org/1999/xhtml"><style>${css}</style>${clone.outerHTML}</div>`;return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="620" viewBox="0 0 960 620"><foreignObject x="0" y="0" width="960" height="620">${xhtml}</foreignObject></svg>`}
function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
async function exportSvg(){const svg=await buildExportSvg();downloadBlob(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),`${safeTitle()}.svg`)}
async function exportPng(){const svg=await buildExportSvg(),blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1240;const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(b=>downloadBlob(b,`${safeTitle()}.png`),'image/png');URL.revokeObjectURL(url)};img.onerror=()=>{URL.revokeObjectURL(url);alert('PNG export is not supported by this browser for this figure. SVG export remains available.')};img.src=url}
function safeTitle(){return ($('docTitle').value||'bioplot-figure').trim().replace(/[^a-z0-9-_]+/gi,'-').replace(/^-|-$/g,'')||'bioplot-figure'}

// bindings
rebindGlobals();bindAllObjects();bindSelectionBox();renderPanel();setZoom(.8);selectOnly(artboard.querySelector('[data-id="obj-neuron"]'));updateHistoryButtons();
document.querySelectorAll('.rail-item[data-panel]').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('.rail-item[data-panel]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');state.panel=btn.dataset.panel;renderPanel()});
artboard.onpointerdown=e=>{if(e.target===artboard||e.target.closest('.figure-heading')||e.target.classList.contains('canvas-footer')){state.selected.clear();renderSelection()}};
[propX,propY,propW,propH].forEach(i=>i.onchange=applyBoxFromProps);propRotation.onchange=applyRotationProp;
opacityRange.oninput=()=>{const els=selectedEls();if(!els.length)return;els.forEach(el=>el.style.opacity=opacityRange.value/100);opacityValue.textContent=opacityRange.value+'%';markSaved()};
document.querySelectorAll('.swatch').forEach(btn=>btn.onclick=()=>{const els=selectedEls();if(!els.length)return;saveSnapshot();const color=btn.dataset.color;els.forEach(el=>{if(el.dataset.type==='text'||el.dataset.type==='arrow'||el.dataset.type==='line')el.style.color=color;else el.style.filter=`drop-shadow(0 0 0 ${color})`});markSaved()});
$('deleteBtn').onclick=deleteSelected;$('undoBtn').onclick=undo;$('redoBtn').onclick=redo;
$('zoomIn').onclick=()=>setZoom(state.zoom+.1);$('zoomOut').onclick=()=>setZoom(state.zoom-.1);$('fitBtn').onclick=()=>setZoom(.8);$('gridBtn').onclick=()=>viewport.classList.toggle('grid-on');
langBtn.onclick=()=>{state.lang=state.lang==='en'?'fa':'en';renderPanel();applyLanguage()};
$('docTitle').oninput=markSaved;
$('svgInput').onchange=e=>{importSvg(e.target.files?.[0]);e.target.value=''};
$('exportBtn').onclick=e=>{e.stopPropagation();$('exportMenu').classList.toggle('hidden')};document.addEventListener('click',()=>$('exportMenu').classList.add('hidden'));$('exportMenu').onclick=e=>e.stopPropagation();
document.querySelectorAll('[data-export]').forEach(b=>b.onclick=()=>{b.dataset.export==='svg'?exportSvg():exportPng();$('exportMenu').classList.add('hidden')});
document.addEventListener('keydown',e=>{
  if(state.editing)return;const mod=e.ctrlKey||e.metaKey;
  if(mod&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if(mod&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}
  if(mod&&e.key.toLowerCase()==='c'){e.preventDefault();copySelected();return}
  if(mod&&e.key.toLowerCase()==='v'){e.preventDefault();pasteClipboard();return}
  if(mod&&e.key.toLowerCase()==='g'){e.preventDefault();e.shiftKey?ungroupSelected():groupSelected();return}
  if(e.key==='Delete'||e.key==='Backspace'){if(!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();deleteSelected()}return}
  if(e.key==='Enter'&&selectedEls().length===1&&selectedEls()[0].dataset.type==='text'){e.preventDefault();enterTextEdit(selectedEls()[0]);return}
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();const step=e.shiftKey?10:1,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;if(selectedEls().length){saveSnapshot();selectedEls().forEach(el=>{el.style.left=num(el.style.left)+dx+'px';el.style.top=num(el.style.top)+dy+'px'});renderSelection();markSaved()}}
});
