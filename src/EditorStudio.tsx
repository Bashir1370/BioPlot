import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { assetToObject, getAssetCatalog, sanitizeSvg, saveCustomAsset, searchAssets } from './assets';
import { createAnonymousPresence, createCollaborationSession, CollaborationSession } from './collaboration';
import { AddObjectsCommand, AlignMode, BioPlotStore, buildSnapTargets, DeleteObjectsCommand, DistributionAxis, ObjectStateCommand, objectsInRect, PageObjectsCommand, rectFromPoints, reorderObjects, resizeObjects, rotateObjects, selectionBounds, snapDelta, alignObjects, distributeObjects, ZOrderAction } from './engine';
import { makeArrow, makeConnector, makeContainer, makeImage, makePanelLabel, makeShape, makeTagLabel, makeText } from './editorObjects';
import { EditorInspector } from './EditorInspector';
import { EditorObjectView } from './EditorObjectView';
import { downloadPng, downloadSvg } from './export';
import { activePage, BioPlotDocument, BioPlotObject, cloneDocument, createBlankDocument, makeId, migrateDocument } from './model';
import { projects } from './persistence';
import './editor-studio.css';

type Panel = 'assets'|'elements'|'upload';
type InspectorTab = 'properties'|'layers';
type Guides = {x?:number;y?:number};
type Marquee = {x:number;y:number;width:number;height:number}|null;

const cloneObjects = (objects:BioPlotObject[]) => structuredClone(objects);
const isEditable = (target:EventTarget|null) => target instanceof HTMLElement && ['INPUT','TEXTAREA','SELECT'].includes(target.tagName);

function duplicateObjects(source:BioPlotObject[],dx=24,dy=24){
  const groupMap=new Map<string,string>();
  return source.map(object=>{
    if(object.groupId&&!groupMap.has(object.groupId)) groupMap.set(object.groupId,makeId('group'));
    return {...structuredClone(object),id:makeId(),x:object.x+dx,y:object.y+dy,groupId:object.groupId?groupMap.get(object.groupId):undefined,parentId:undefined} as BioPlotObject;
  });
}

export function EditorStudio(){
  const storeRef=useRef(new BioPlotStore(createBlankDocument()));
  const [documentState,setDocumentState]=useState(storeRef.current.snapshot);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [panel,setPanel]=useState<Panel>('assets');
  const [inspectorTab,setInspectorTab]=useState<InspectorTab>('properties');
  const [zoom,setZoom]=useState(.82);
  const [guides,setGuides]=useState<Guides>({});
  const [marquee,setMarquee]=useState<Marquee>(null);
  const [contextMenu,setContextMenu]=useState<{x:number;y:number}|null>(null);
  const [assetQuery,setAssetQuery]=useState('');
  const [saveState,setSaveState]=useState('Saved');
  const [shareState,setShareState]=useState('Share');
  const [libraryWidth,setLibraryWidth]=useState(286);
  const [inspectorWidth,setInspectorWidth]=useState(310);
  const [libraryCollapsed,setLibraryCollapsed]=useState(false);
  const [inspectorCollapsed,setInspectorCollapsed]=useState(false);
  const clipboardRef=useRef<BioPlotObject[]>([]);
  const artboardRef=useRef<HTMLDivElement>(null);
  const collaborationRef=useRef<CollaborationSession|null>(null);
  const suppressBroadcast=useRef(false);

  const page=activePage(documentState);
  const objects=page.objects;
  const selectedObjects=objects.filter(object=>selected.has(object.id));
  const bounds=selectionBounds(selectedObjects);
  const fa=documentState.metadata.locale==='fa';
  const assets=useMemo(()=>searchAssets(assetQuery,documentState.metadata.locale),[assetQuery,documentState.metadata.locale,documentState.updatedAt]);
  const grouped=selectedObjects.length>1&&selectedObjects.every(object=>object.groupId)&&new Set(selectedObjects.map(object=>object.groupId)).size===1;

  useEffect(()=>storeRef.current.subscribe(setDocumentState),[]);

  useEffect(()=>{
    const id=new URLSearchParams(window.location.search).get('id');
    void (async()=>{
      if(id){const found=await projects.load(id);if(found){storeRef.current.replace(migrateDocument(found));return;}}
      const fresh=createBlankDocument();
      fresh.metadata.locale=localStorage.getItem('bioplot-lang')==='fa'?'fa':'en';
      storeRef.current.replace(fresh);
      await projects.save(fresh);
      history.replaceState(null,'',`editor.html?id=${encodeURIComponent(fresh.id)}`);
    })();
  },[]);

  useEffect(()=>{
    const locale=documentState.metadata.locale;
    document.documentElement.dir=locale==='fa'?'rtl':'ltr';
    document.documentElement.lang=locale;
    localStorage.setItem('bioplot-lang',locale);
  },[documentState.metadata.locale]);

  useEffect(()=>{
    const session=createCollaborationSession();
    collaborationRef.current=session;
    let unsubscribe=()=>{};
    void session.connect(documentState.id,createAnonymousPresence()).then(()=>{
      unsubscribe=session.subscribe(event=>{
        if(event.type!=='document') return;
        suppressBroadcast.current=true;
        storeRef.current.replace(migrateDocument(event.document));
        setSaveState(fa?'همگام شد':'Synced');
      });
    }).catch(()=>{});
    return()=>{unsubscribe();session.disconnect();collaborationRef.current=null;};
  },[documentState.id,fa]);

  useEffect(()=>{
    setSelected(current=>new Set([...current].filter(id=>objects.some(object=>object.id===id&&!object.hidden))));
  },[objects]);

  useEffect(()=>{
    setSaveState(fa?'در حال ذخیره…':'Saving…');
    const timer=window.setTimeout(async()=>{
      await projects.save(documentState);
      setSaveState(fa?'ذخیره شد':'Saved');
      if(suppressBroadcast.current) suppressBroadcast.current=false;
      else collaborationRef.current?.publishDocument(documentState);
    },420);
    return()=>window.clearTimeout(timer);
  },[documentState,fa]);

  useEffect(()=>{
    const close=()=>setContextMenu(null);
    window.addEventListener('pointerdown',close);
    return()=>window.removeEventListener('pointerdown',close);
  },[]);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(isEditable(event.target)) return;
      const mod=event.ctrlKey||event.metaKey;
      const key=event.key.toLowerCase();
      if(mod&&key==='z'){event.preventDefault();event.shiftKey?storeRef.current.redo():storeRef.current.undo();return;}
      if(mod&&key==='y'){event.preventDefault();storeRef.current.redo();return;}
      if(mod&&key==='c'){event.preventDefault();copySelection();return;}
      if(mod&&key==='v'){event.preventDefault();pasteClipboard();return;}
      if(mod&&key==='d'){event.preventDefault();duplicateSelection();return;}
      if(mod&&key==='g'){event.preventDefault();event.shiftKey?ungroupSelection():groupSelection();return;}
      if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();deleteSelection();return;}
      if(event.key==='Escape'){setSelected(new Set());setContextMenu(null);return;}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){
        event.preventDefault();
        const step=event.shiftKey?10:1;
        nudge(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0);
      }
    };
    window.addEventListener('keydown',onKey);
    return()=>window.removeEventListener('keydown',onKey);
  });

  function idsFor(object:BioPlotObject,additive=false){
    const ids=object.groupId?objects.filter(item=>item.groupId===object.groupId).map(item=>item.id):[object.id];
    if(!additive) return new Set(ids);
    const next=new Set(selected);
    ids.forEach(id=>next.has(id)?next.delete(id):next.add(id));
    return next;
  }

  function addObject(object:BioPlotObject){storeRef.current.dispatch(new AddObjectsCommand('Add object',[object]));setSelected(new Set([object.id]));setInspectorTab('properties');}
  function commitSelected(label:string,transform:(object:BioPlotObject)=>BioPlotObject){const before=cloneObjects(selectedObjects);if(before.length)storeRef.current.dispatch(new ObjectStateCommand(label,before,before.map(transform)));}
  function copySelection(){clipboardRef.current=cloneObjects(selectedObjects);}
  function pasteClipboard(){if(!clipboardRef.current.length)return;const pasted=duplicateObjects(clipboardRef.current,28,28);clipboardRef.current=cloneObjects(pasted);storeRef.current.dispatch(new AddObjectsCommand('Paste objects',pasted));setSelected(new Set(pasted.map(object=>object.id)));}
  function duplicateSelection(){if(!selectedObjects.length)return;const copies=duplicateObjects(selectedObjects);storeRef.current.dispatch(new AddObjectsCommand('Duplicate objects',copies));setSelected(new Set(copies.map(object=>object.id)));}
  function deleteSelection(){const doomed=cloneObjects(selectedObjects.filter(object=>!object.locked));if(!doomed.length)return;storeRef.current.dispatch(new DeleteObjectsCommand('Delete objects',doomed));setSelected(new Set());}
  function nudge(dx:number,dy:number){commitSelected('Nudge objects',object=>object.locked?object:{...object,x:object.x+dx,y:object.y+dy});}
  function groupSelection(){if(selectedObjects.length<2)return;const before=cloneObjects(selectedObjects);const groupId=makeId('group');storeRef.current.dispatch(new ObjectStateCommand('Group objects',before,before.map(object=>({...object,groupId}))));}
  function ungroupSelection(){if(!selectedObjects.some(object=>object.groupId))return;const before=cloneObjects(selectedObjects);storeRef.current.dispatch(new ObjectStateCommand('Ungroup objects',before,before.map(object=>({...object,groupId:undefined}))));}
  function setLocked(locked:boolean){commitSelected(locked?'Lock objects':'Unlock objects',object=>({...object,locked}));}

  function setHidden(ids:Set<string>,hidden:boolean){
    const before=cloneObjects(objects.filter(object=>ids.has(object.id)));if(!before.length)return;
    storeRef.current.dispatch(new ObjectStateCommand(hidden?'Hide objects':'Show objects',before,before.map(object=>({...object,hidden}))));
    if(hidden)setSelected(current=>new Set([...current].filter(id=>!ids.has(id))));
  }

  function align(mode:AlignMode){const before=cloneObjects(selectedObjects.filter(object=>!object.locked));if(before.length>1)storeRef.current.dispatch(new ObjectStateCommand(`Align ${mode}`,before,alignObjects(before,mode)));}
  function distribute(axis:DistributionAxis){const before=cloneObjects(selectedObjects.filter(object=>!object.locked));if(before.length>2)storeRef.current.dispatch(new ObjectStateCommand(`Distribute ${axis}`,before,distributeObjects(before,axis)));}
  function zOrderFor(ids:Set<string>,action:ZOrderAction){const before=cloneObjects(objects);storeRef.current.dispatch(new PageObjectsCommand(`Layer ${action}`,before,reorderObjects(before,ids,action)));}
  function zOrder(action:ZOrderAction){if(selected.size)zOrderFor(selected,action);}

  function changeBounds(field:'x'|'y'|'width'|'height',value:number){
    if(!bounds||!Number.isFinite(value))return;
    const before=cloneObjects(selectedObjects.filter(object=>!object.locked));if(!before.length)return;
    if(field==='x'||field==='y'){
      const delta=value-bounds[field];
      const after=before.map(object=>field==='x'?{...object,x:object.x+delta}:{...object,y:object.y+delta});
      storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`,before,after));
    }else{
      const next={x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,[field]:Math.max(8,value)};
      storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`,before,resizeObjects(before,next)));
    }
  }

  function beginMove(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject){
    if(object.locked){setSelected(idsFor(object,event.shiftKey));return;}
    event.preventDefault();event.stopPropagation();
    const ids=idsFor(object,event.shiftKey);setSelected(ids);if(event.shiftKey)return;
    const before=cloneObjects(objects.filter(item=>ids.has(item.id)&&!item.locked));const startBounds=selectionBounds(before);if(!before.length||!startBounds)return;
    const targets=buildSnapTargets(storeRef.current.snapshot,ids);const sx=event.clientX,sy=event.clientY;
    const move=(pointer:PointerEvent)=>{const snapped=snapDelta(startBounds,(pointer.clientX-sx)/zoom,(pointer.clientY-sy)/zoom,targets);storeRef.current.preview(before.map(item=>({...item,x:item.x+snapped.dx,y:item.y+snapped.dy})));setGuides({x:snapped.guideX,y:snapped.guideY});};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);const after=cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item=>ids.has(item.id)&&!item.locked));storeRef.current.commitObjectState(before,after,'Move objects');setGuides({});};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }

  function beginResize(event:ReactPointerEvent,handle:string){
    event.preventDefault();event.stopPropagation();if(!bounds||!selectedObjects.length||selectedObjects.some(object=>object.locked))return;
    const before=cloneObjects(selectedObjects),start={...bounds},sx=event.clientX,sy=event.clientY;
    const move=(pointer:PointerEvent)=>{const dx=(pointer.clientX-sx)/zoom,dy=(pointer.clientY-sy)/zoom;let x=start.x,y=start.y,width=start.width,height=start.height;if(handle.includes('e'))width=Math.max(12,start.width+dx);if(handle.includes('s'))height=Math.max(12,start.height+dy);if(handle.includes('w')){x=Math.min(start.right-12,start.x+dx);width=start.right-x;}if(handle.includes('n')){y=Math.min(start.bottom-12,start.y+dy);height=start.bottom-y;}storeRef.current.preview(resizeObjects(before,{x,y,width,height}));};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);const after=cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item=>selected.has(item.id)));storeRef.current.commitObjectState(before,after,'Resize objects');};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }

  function beginRotate(event:ReactPointerEvent){
    event.preventDefault();event.stopPropagation();if(!bounds||!artboardRef.current||selectedObjects.some(object=>object.locked))return;
    const before=cloneObjects(selectedObjects),rect=artboardRef.current.getBoundingClientRect(),cx=rect.left+bounds.cx*zoom,cy=rect.top+bounds.cy*zoom,start=Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI;
    const move=(pointer:PointerEvent)=>{const angle=Math.atan2(pointer.clientY-cy,pointer.clientX-cx)*180/Math.PI;storeRef.current.preview(rotateObjects(before,angle-start,{x:bounds.cx,y:bounds.cy}));};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);const after=cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item=>selected.has(item.id)));storeRef.current.commitObjectState(before,after,'Rotate objects');};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }

  function beginMarquee(event:ReactPointerEvent<HTMLDivElement>){
    if(event.target!==event.currentTarget||!artboardRef.current)return;
    const art=artboardRef.current.getBoundingClientRect(),sx=(event.clientX-art.left)/zoom,sy=(event.clientY-art.top)/zoom,original=event.shiftKey?new Set(selected):new Set<string>();
    if(!event.shiftKey)setSelected(new Set());
    const move=(pointer:PointerEvent)=>{const rect=rectFromPoints(sx,sy,(pointer.clientX-art.left)/zoom,(pointer.clientY-art.top)/zoom);setMarquee(rect);setSelected(new Set([...original,...objectsInRect(objects,rect).filter(object=>!object.locked).map(object=>object.id)]));};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);setMarquee(null);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }

  function setTitle(title:string){const next=cloneDocument(documentState);next.title=title;next.updatedAt=new Date().toISOString();storeRef.current.replace(next);}
  function toggleLocale(){const next=cloneDocument(documentState);next.metadata.locale=fa?'en':'fa';storeRef.current.replace(next);}
  async function share(){await navigator.clipboard?.writeText(window.location.href);setShareState(fa?'کپی شد':'Copied');setTimeout(()=>setShareState(fa?'اشتراک':'Share'),1500);}

  async function importSvg(file?:File){if(!file)return;try{const safe=sanitizeSvg(await file.text());const asset=saveCustomAsset({name:file.name.replace(/\.svg$/i,''),category:'Custom',synonyms:{en:[file.name],fa:[]},svg:safe,colorSlots:[],reviewStatus:'draft',premium:false});addObject(assetToObject(asset));setPanel('assets');}catch(error){alert(error instanceof Error?error.message:'Could not import SVG.');}}
  function importImage(file?:File){if(!file)return;const reader=new FileReader();reader.onload=()=>typeof reader.result==='string'&&addObject(makeImage(reader.result,file.name));reader.readAsDataURL(file);}

  function resizePanel(side:'library'|'inspector',event:ReactPointerEvent){
    event.preventDefault();const start=event.clientX,initial=side==='library'?libraryWidth:inspectorWidth;const rtl=document.documentElement.dir==='rtl';const direction=(rtl?-1:1)*(side==='library'?1:-1);
    const move=(pointer:PointerEvent)=>{const value=initial+(pointer.clientX-start)*direction;if(side==='library')setLibraryWidth(Math.max(220,Math.min(390,value)));else setInspectorWidth(Math.max(260,Math.min(390,value)));};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }

  function objectContext(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject){event.preventDefault();event.stopPropagation();if(!selected.has(object.id))setSelected(idsFor(object));setContextMenu({x:event.clientX,y:event.clientY});}
  const columns=`58px ${libraryCollapsed?0:libraryWidth}px 5px minmax(440px,1fr) 5px ${inspectorCollapsed?0:inspectorWidth}px`;

  return <div className="studio-shell">
    <header className="studio-topbar"><a className="studio-brand" href="index.html"><span>B</span><strong>BioPlot</strong><em>Figure Studio</em></a><div className="studio-document"><a href="index.html" className="studio-icon-btn">←</a><div><input value={documentState.title} onChange={event=>setTitle(event.target.value)}/><small><i/>{saveState}</small></div></div><div className="studio-history"><button disabled={!storeRef.current.history.canUndo} onClick={()=>storeRef.current.undo()}>↶</button><button disabled={!storeRef.current.history.canRedo} onClick={()=>storeRef.current.redo()}>↷</button></div><div className="studio-top-actions"><button onClick={toggleLocale}>{fa?'EN':'FA'}</button><button onClick={share}>{shareState}</button><button onClick={()=>downloadSvg(documentState)}>SVG</button><button className="studio-export" onClick={()=>downloadPng(documentState,300,160)}>PNG 300 DPI</button></div></header>

    <main className="studio-workspace" style={{gridTemplateColumns:columns}}>
      <nav className="studio-rail">{([['assets','◎',fa?'المان':'Assets'],['elements','✦',fa?'اجزا':'Elements'],['upload','⇧',fa?'آپلود':'Upload']] as Array<[Panel,string,string]>).map(([key,icon,label])=><button key={key} className={panel===key?'active':''} onClick={()=>{setPanel(key);setLibraryCollapsed(false);}}><span>{icon}</span><small>{label}</small></button>)}<div className="rail-spacer"/><button onClick={()=>setLibraryCollapsed(value=>!value)}><span>{libraryCollapsed?'»':'«'}</span><small>{fa?'پنل':'Panel'}</small></button></nav>

      <aside className={`studio-library ${libraryCollapsed?'collapsed':''}`}><div className="studio-panel-heading"><div><small>FIGURE STUDIO</small><h2>{panel==='assets'?(fa?'کتابخانه علمی':'Scientific assets'):panel==='elements'?(fa?'اجزای شکل':'Figure elements'):(fa?'آپلود':'Upload')}</h2></div><button onClick={()=>setLibraryCollapsed(true)}>×</button></div>{panel==='assets'&&<><div className="studio-search">⌕<input value={assetQuery} onChange={event=>setAssetQuery(event.target.value)} placeholder={fa?'نورون، سلول، DNA…':'Neuron, cell, DNA…'}/></div><div className="studio-assets">{assets.map(asset=><button key={asset.id} onClick={()=>addObject(assetToObject(asset))}><span dangerouslySetInnerHTML={{__html:asset.svg}}/><b>{asset.name}</b><small>{asset.category}</small></button>)}</div></>}{panel==='elements'&&<Elements fa={fa} addObject={addObject}/>} {panel==='upload'&&<div className="studio-upload"><label><span>⇧</span><b>{fa?'SVG علمی':'Scientific SVG'}</b><small>{fa?'فایل برداری با پاک‌سازی امنیتی':'Sanitized vector import'}</small><input hidden type="file" accept=".svg,image/svg+xml" onChange={event=>void importSvg(event.target.files?.[0])}/></label><label><span>▧</span><b>{fa?'تصویر':'Raster image'}</b><small>PNG / JPG / WebP</small><input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>importImage(event.target.files?.[0])}/></label><p>{fa?`${getAssetCatalog().length} المان علمی در کاتالوگ فعلی`:`${getAssetCatalog().length} scientific assets in the current catalog`}</p></div>}</aside>
      <div className={`studio-splitter ${libraryCollapsed?'disabled':''}`} onPointerDown={event=>!libraryCollapsed&&resizePanel('library',event)}/>

      <section className="studio-canvas-zone"><SelectionToolbar fa={fa} selectedObjects={selectedObjects} grouped={grouped} onCopy={copySelection} onDuplicate={duplicateSelection} onAlign={align} onDistribute={distribute} onFront={()=>zOrder('front')} onBack={()=>zOrder('back')} onGroup={groupSelection} onUngroup={ungroupSelection} onLock={()=>setLocked(!selectedObjects.every(object=>object.locked))} onDelete={deleteSelection}/><div className="studio-canvas-scroll"><div className="studio-artboard-scale" style={{transform:`scale(${zoom})`}}><div ref={artboardRef} className="studio-artboard" style={{width:page.width,height:page.height,background:page.background}} onPointerDown={beginMarquee}>{objects.map(object=><EditorObjectView key={object.id} object={object} selected={selected.has(object.id)} onPointerDown={beginMove} onContextMenu={objectContext}/>)}{guides.x!==undefined&&<div className="studio-guide vertical" style={{left:guides.x}}/>}{guides.y!==undefined&&<div className="studio-guide horizontal" style={{top:guides.y}}/>}{marquee&&<div className="studio-marquee" style={marquee}/>} {bounds&&<div className="studio-selection" style={{left:bounds.x,top:bounds.y,width:bounds.width,height:bounds.height}}><span className="studio-rotate-line"/><button className="studio-rotate" onPointerDown={beginRotate}/>{['nw','n','ne','e','se','s','sw','w'].map(handle=><button key={handle} className={`studio-handle ${handle}`} onPointerDown={event=>beginResize(event,handle)}/>)}</div>}</div></div></div><div className="studio-statusbar"><span>{page.name} · {page.width} × {page.height}px</span><div><button onClick={()=>setZoom(value=>Math.max(.35,value-.1))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(value=>Math.min(1.8,value+.1))}>+</button><button onClick={()=>setZoom(.82)}>Fit</button></div><span>{objects.length} {fa?'آبجکت':'objects'}</span></div></section>

      <div className={`studio-splitter ${inspectorCollapsed?'disabled':''}`} onPointerDown={event=>!inspectorCollapsed&&resizePanel('inspector',event)}/>
      {!inspectorCollapsed&&<EditorInspector fa={fa} tab={inspectorTab} setTab={setInspectorTab} bounds={bounds} selectedObjects={selectedObjects} objects={objects} selected={selected} onBounds={changeBounds} onCommit={commitSelected} onLock={setLocked} onHide={()=>setHidden(selected,true)} onSelect={object=>{setSelected(idsFor(object));setInspectorTab('properties');}} onLayerStep={(id,action)=>zOrderFor(new Set([id]),action)} onToggleObjectLock={object=>storeRef.current.dispatch(new ObjectStateCommand(object.locked?'Unlock':'Lock',[structuredClone(object)],[{...object,locked:!object.locked}]))} onToggleObjectHidden={object=>setHidden(new Set([object.id]),!object.hidden)} onCollapse={()=>setInspectorCollapsed(true)}/>} {inspectorCollapsed&&<button className="studio-open-inspector" onClick={()=>setInspectorCollapsed(false)}>{fa?'ویژگی‌ها':'Inspector'} ‹</button>}
    </main>

    {contextMenu&&<div className="studio-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onPointerDown={event=>event.stopPropagation()}><button onClick={()=>{copySelection();setContextMenu(null);}}>Copy <kbd>⌘C</kbd></button><button onClick={()=>{pasteClipboard();setContextMenu(null);}}>Paste <kbd>⌘V</kbd></button><button onClick={()=>{duplicateSelection();setContextMenu(null);}}>Duplicate <kbd>⌘D</kbd></button><hr/>{selectedObjects.length>1&&<button onClick={()=>{grouped?ungroupSelection():groupSelection();setContextMenu(null);}}>{grouped?'Ungroup':'Group'}</button>}<button onClick={()=>{zOrder('front');setContextMenu(null);}}>Bring to front</button><button onClick={()=>{zOrder('back');setContextMenu(null);}}>Send to back</button><button onClick={()=>{setLocked(!selectedObjects.every(object=>object.locked));setContextMenu(null);}}>{selectedObjects.every(object=>object.locked)?'Unlock':'Lock'}</button><hr/><button className="danger" onClick={()=>{deleteSelection();setContextMenu(null);}}>Delete</button></div>}
  </div>;
}

function Elements({fa,addObject}:{fa:boolean;addObject:(object:BioPlotObject)=>void}){
  return <div className="studio-elements"><section><h3>{fa?'متن و برچسب':'Text & labels'}</h3><div><button onClick={()=>addObject(makeText())}><span>T</span><b>{fa?'متن علمی':'Scientific text'}</b></button><button onClick={()=>addObject(makePanelLabel())}><span>A</span><b>{fa?'برچسب پنل':'Panel label'}</b></button><button onClick={()=>addObject(makeTagLabel())}><span>Tag</span><b>{fa?'برچسب':'Tag label'}</b></button></div></section><section><h3>{fa?'شکل‌ها':'Shapes'}</h3><div><button onClick={()=>addObject(makeShape('rect'))}><span>□</span><b>{fa?'مستطیل':'Rectangle'}</b></button><button onClick={()=>addObject(makeShape('ellipse'))}><span>○</span><b>{fa?'بیضی':'Ellipse'}</b></button><button onClick={()=>addObject(makeContainer())}><span>▣</span><b>{fa?'کانتینر':'Container'}</b></button></div></section><section><h3>{fa?'فلش و اتصال':'Arrows & connectors'}</h3><div><button onClick={()=>addObject(makeArrow())}><span>→</span><b>{fa?'فلش':'Arrow'}</b></button><button onClick={()=>addObject(makeConnector('straight'))}><span>↦</span><b>{fa?'اتصال مستقیم':'Straight'}</b></button><button onClick={()=>addObject(makeConnector('elbow'))}><span>⌟</span><b>{fa?'اتصال زاویه‌دار':'Elbow'}</b></button><button onClick={()=>addObject(makeConnector('curved'))}><span>⌒</span><b>{fa?'اتصال منحنی':'Curved'}</b></button></div></section></div>;
}

function SelectionToolbar({fa,selectedObjects,grouped,onCopy,onDuplicate,onAlign,onDistribute,onFront,onBack,onGroup,onUngroup,onLock,onDelete}:{fa:boolean;selectedObjects:BioPlotObject[];grouped:boolean;onCopy:()=>void;onDuplicate:()=>void;onAlign:(mode:AlignMode)=>void;onDistribute:(axis:DistributionAxis)=>void;onFront:()=>void;onBack:()=>void;onGroup:()=>void;onUngroup:()=>void;onLock:()=>void;onDelete:()=>void}){
  if(!selectedObjects.length)return <div className="studio-selection-toolbar"><span>{fa?'برای ویرایش، یک یا چند آبجکت را انتخاب کن':'Select one or more objects to edit'}</span></div>;
  return <div className="studio-selection-toolbar"><div className="toolbar-group"><button onClick={onCopy}>Copy</button><button onClick={onDuplicate}>Duplicate</button></div>{selectedObjects.length>1&&<div className="toolbar-group align-group"><button onClick={()=>onAlign('left')}>⇤</button><button onClick={()=>onAlign('center')}>↔</button><button onClick={()=>onAlign('right')}>⇥</button><button onClick={()=>onAlign('top')}>↥</button><button onClick={()=>onAlign('middle')}>↕</button><button onClick={()=>onAlign('bottom')}>↧</button>{selectedObjects.length>2&&<><button onClick={()=>onDistribute('horizontal')}>⋯↔</button><button onClick={()=>onDistribute('vertical')}>⋮↕</button></>}</div>}<div className="toolbar-group"><button onClick={onFront}>Front</button><button onClick={onBack}>Back</button></div>{selectedObjects.length>1&&!grouped&&<button onClick={onGroup}>Group</button>}{grouped&&<button onClick={onUngroup}>Ungroup</button>}<button onClick={onLock}>{selectedObjects.every(object=>object.locked)?'Unlock':'Lock'}</button><button className="danger" onClick={onDelete}>Delete</button></div>;
}
