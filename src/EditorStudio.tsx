import { assetLineEndpoints, updateAssetLineEndpoint, fullAssetLineBounds } from './assetLineGeometry';
import {readLineArtworkBounds} from './lineArtworkBounds';
import { LINE_CATEGORY } from './lineCatalog';
import {SHAPE_CATALOG,shapeSvgBody} from './shapeGeometry';
import { FloatingTextControls } from './FloatingTextControls';
import { PointerEvent as ReactPointerEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { assetToObject, favoriteAssetIds, favoriteAssets, getAssetCatalog, getAssetCategories, recentAssets, sanitizeSvg, saveCustomAsset, searchAssets, toggleFavoriteAsset } from './assets';
import { StyledAssetObject } from './assetStyling';
import { AssetStylePanel } from './AssetStylePanel';
import { SvgTemplateEditor } from './SvgTemplateEditor';
import { createAnonymousPresence, createCollaborationSession, CollaborationSession } from './collaboration';
import { resolveConnector } from './connectors';
import { AddObjectsCommand, AlignMode, BioPlotStore, buildSnapTargets, DeleteObjectsCommand, DistributionAxis, ObjectStateCommand, objectsInRect, PageObjectsCommand, rectFromPoints, reorderObjects, resizeObjects, rotateObjects, selectionBounds, snapDelta, alignObjects, distributeObjects, ZOrderAction } from './engine';
import { makeArrow, makeConnector, makeContainer, makeImage, makePanelLabel, makeShape, makeText } from './editorObjects';
import { EditorInspector, SelectionProperties } from './EditorInspector';
import { StudioIcon, StudioIconName } from './StudioIcon';
import { VectorStudio } from './VectorStudio';
import { AssetCatalogView, StudioPagesPanel, CanvasSettingsForm } from './StudioReferencePanels';
import { ShineBorder } from './components/ui/shine-border';
import { AddStudioPageCommand, CanvasSettingsCommand, CanvasSettings } from './studioPages';
import { EditorObjectView } from './EditorObjectView';
import { createDrawnLine, insertLineNode, removeLineNode, updateLineNode, worldLineNodes, lineSvgBody, type DrawLineSettings } from './lineGeometry';
import type { ScientificAsset } from './assets';
import { activePage, BioPlotDocument, BioPlotObject, cloneDocument, createBlankDocument, makeId, migrateDocument } from './model';
import { projects } from './persistence';
import {figureContent,readFigureDraft,clearFigureDraft} from './figureDraft';
import { saveRecoverySnapshot } from './recovery';
import { reloadRuntimeCloudAssetsFromBrowserCache } from './cloudAssetLibrary';
import './editor-studio.css';
import './line-drawing.css';
import { lineNodeDragPoint } from './linePointer';
import './line-polish.css';
import { FloatingSelectionToolbar } from './FloatingSelectionToolbar';
import { trackSelectionToolbarGesture } from './selectionToolbarGesture';

type Panel = 'assets'|'elements'|'upload'|'text'|'lines'|'shapes';
type InspectorTab = 'properties'|'layers'|'quality'|'export';
type Guides = {x?:number;y?:number};
type AssetMode='all'|'favorites'|'recent';
type ZoomPointer = {clientX:number;clientY:number};
type PendingZoomAnchor = ZoomPointer & {worldX:number;worldY:number};
type TightSelectionBounds = {x:number;y:number;width:number;height:number;right:number;bottom:number};

const MIN_ZOOM=.1;
const MAX_ZOOM=2.5;
const ZOOM_STEP=.1;
const WHEEL_STEP_THRESHOLD=18;

const cloneObjects = (objects:BioPlotObject[]) => structuredClone(objects);
const isEditable = (target:EventTarget|null) => target instanceof HTMLElement && ['INPUT','TEXTAREA','SELECT'].includes(target.tagName);
const clampZoom=(value:number)=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,value));
const normalizeWheelDelta=(event:WheelEvent)=>event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?120:1);
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
  const [selectionToolbarVisible,setSelectionToolbarVisible]=useState(true);
  const [panel,setPanel]=useState<Panel>('assets');
  const [assetEditOpen,setAssetEditOpen]=useState(false);
  const [vectorAsset,setVectorAsset]=useState<StyledAssetObject|null>(null);
  const [inspectorTab,setInspectorTab]=useState<InspectorTab>('properties');
  const [zoom,setZoom]=useState(.82);
  const [guides,setGuides]=useState<Guides>({});
  const [contextMenu,setContextMenu]=useState<{x:number;y:number}|null>(null);
  const [assetQuery,setAssetQuery]=useState('');
  const [assetCategory,setAssetCategory]=useState('');
  const [assetMode,setAssetMode]=useState<AssetMode>('all');
  const [favoriteVersion,setFavoriteVersion]=useState(0);
  const [libraryVersion,setLibraryVersion]=useState(0);
  const [saveState,setSaveState]=useState('');
  const savedContent=useRef('');
  const hasSaved=useRef(false);
  const pendingWrites=useRef(0);
  const saveQueue=useRef<Promise<void>>(Promise.resolve());
  const [documentReady,setDocumentReady]=useState(false);
  const [saveFailed,setSaveFailed]=useState(false);
  const [saveAttempt,setSaveAttempt]=useState(0);
  const [loadError,setLoadError]=useState(false);
  const [shareState,setShareState]=useState('Share');
  const [libraryWidth,setLibraryWidth]=useState(276);
  const [inspectorWidth,setInspectorWidth]=useState(300);
  const [libraryCollapsed,setLibraryCollapsed]=useState(window.innerWidth <= 820);
  const [inspectorCollapsed,setInspectorCollapsed]=useState(true);
  const [pagesCollapsed,setPagesCollapsed]=useState(window.innerWidth<1100);
  const [showGrid,setShowGrid]=useState(false);
  const [lineTool,setLineTool]=useState<DrawLineSettings|null>(null);
  const [linePreview,setLinePreview]=useState<{sx:number;sy:number;ex:number;ey:number}|null>(null);
  const clipboardRef=useRef<BioPlotObject[]>([]);
  const artboardRef=useRef<HTMLDivElement>(null);
  const canvasViewportRef=useRef<HTMLDivElement>(null);
  const collaborationRef=useRef<CollaborationSession|null>(null);
  const suppressBroadcast=useRef(false);
  const zoomRef=useRef(.82);
  const autoFitRef=useRef(true);
  const pendingZoomAnchorRef=useRef<PendingZoomAnchor|null>(null);
  const page=activePage(documentState);
  useEffect(()=>{
    const viewport=canvasViewportRef.current;
    if(!viewport)return;
    let stopGesture: (()=>void)|undefined;
    const pointerDown=(event:PointerEvent)=>{
      if(event.button!==0)return;
      stopGesture?.();
      const object=event.target instanceof Element?event.target.closest('.studio-object'):null;
      stopGesture=trackSelectionToolbarGesture(window,event,!!object,setSelectionToolbarVisible);
    };
    // Capture also sees resize/rotation/node handlers that stop propagation.
    viewport.addEventListener('pointerdown',pointerDown,true);
    return()=>{viewport.removeEventListener('pointerdown',pointerDown,true);stopGesture?.();};
  },[]);

  useEffect(()=>{
    const activate=(event:Event)=>{setLineTool((event as CustomEvent<DrawLineSettings>).detail);setSelected(new Set());setAssetEditOpen(false);setPanel('lines');setLibraryCollapsed(false);};
    const finishInsert=(object:BioPlotObject)=>{
      const current=activePage(storeRef.current.snapshot);
      const viewport=canvasViewportRef.current?.getBoundingClientRect();
      const art=artboardRef.current?.getBoundingClientRect();
      const cx=viewport&&art?(viewport.left+viewport.width/2-art.left)/zoomRef.current:current.width/2;
      const cy=viewport&&art?(viewport.top+viewport.height/2-art.top)/zoomRef.current:current.height/2;
      object.x=Math.max(0,Math.min(current.width-object.width,cx-object.width/2));
      object.y=Math.max(0,Math.min(current.height-object.height,cy-object.height/2));
      storeRef.current.dispatch(new AddObjectsCommand('Add library line',[object]));
      setLineTool(null);setLinePreview(null);setSelected(new Set([object.id]));setSelectionToolbarVisible(true);
      setAssetEditOpen(false);setPanel('lines');setInspectorCollapsed(false);setInspectorTab('properties');
    };
    const insertNative=(event:Event)=>{
      const settings=(event as CustomEvent<DrawLineSettings>).detail;
      if(!settings)return;
      const current=activePage(storeRef.current.snapshot);
      const length=Math.min(220,current.width*.6,current.height*.7);
      finishInsert(createDrawnLine({x:0,y:0},{x:length,y:0},settings));
    };
    const insert=(event:Event)=>{
      const asset=(event as CustomEvent<ScientificAsset>).detail;
      if(!asset?.svg)return;
      const object={...assetToObject(asset),lineAsset:true};
      finishInsert(object);
    };
    window.addEventListener('bioplot:activate-line',activate);
    window.addEventListener('bioplot:insert-line-asset',insert);
    window.addEventListener('bioplot:insert-native-line',insertNative);
    return()=>{window.removeEventListener('bioplot:activate-line',activate);window.removeEventListener('bioplot:insert-line-asset',insert);window.removeEventListener('bioplot:insert-native-line',insertNative);};
  },[]);

  const viewportCenter=():ZoomPointer|undefined=>{
    const viewport=canvasViewportRef.current;
    if(!viewport)return undefined;
    const rect=viewport.getBoundingClientRect();
    return {clientX:rect.left+rect.width/2,clientY:rect.top+rect.height/2};
  };

  const applyZoom=(nextZoom:number,pointer?:ZoomPointer)=>{
    const next=clampZoom(nextZoom);
    const current=zoomRef.current;
    if(Math.abs(next-current)<.0001)return;
    autoFitRef.current=false;
    if(pointer&&artboardRef.current){
      const rect=artboardRef.current.getBoundingClientRect();
      pendingZoomAnchorRef.current={
        ...pointer,
        worldX:(pointer.clientX-rect.left)/current,
        worldY:(pointer.clientY-rect.top)/current,
      };
    }else{
      pendingZoomAnchorRef.current=null;
    }
    zoomRef.current=next;
    setZoom(next);
  };

  const fitCanvas=()=>{
    const viewport=canvasViewportRef.current;
    if(!viewport)return;
    autoFitRef.current=true;
    pendingZoomAnchorRef.current=null;
    const style=getComputedStyle(viewport);
    const horizontal=parseFloat(style.paddingLeft)+parseFloat(style.paddingRight);
    const vertical=parseFloat(style.paddingTop)+parseFloat(style.paddingBottom);
    const next=clampZoom(Math.min(1,(viewport.clientWidth-horizontal)/page.width,(viewport.clientHeight-vertical)/page.height));
    zoomRef.current=next;
    setZoom(current=>Math.abs(current-next)<.0001?current:next);
  };

  useEffect(()=>{
    const viewport=canvasViewportRef.current;
    if(!viewport)return;
    fitCanvas();
    const observer=new ResizeObserver(()=>{if(autoFitRef.current)fitCanvas();});
    observer.observe(viewport);
    return()=>observer.disconnect();
  },[page.width,page.height]);

  useLayoutEffect(()=>{
    const anchor=pendingZoomAnchorRef.current;
    const viewport=canvasViewportRef.current;
    const artboard=artboardRef.current;
    if(!anchor||!viewport||!artboard)return;
    const rect=artboard.getBoundingClientRect();
    const nextClientX=rect.left+anchor.worldX*zoom;
    const nextClientY=rect.top+anchor.worldY*zoom;
    viewport.scrollLeft+=nextClientX-anchor.clientX;
    viewport.scrollTop+=nextClientY-anchor.clientY;
    pendingZoomAnchorRef.current=null;
  },[zoom]);

  useEffect(()=>{
    const viewport=canvasViewportRef.current;
    if(!viewport)return;
    // Wheel events arrive in very different units (mouse wheels, trackpads and
    // browser "smooth scrolling" all report different deltaY values). Keep a
    // small frame-batched delta and convert it to a predictable zoom amount.
    let accumulated=0;
    let frame=0;
    let pointer:ZoomPointer={clientX:0,clientY:0};
    const flush=()=>{
      frame=0;
      if(!accumulated)return;
      const delta=accumulated;
      accumulated=0;
      // 240 px of wheel travel is one normal tenth-step. Clamp each frame so
      // fast wheels cannot jump across the canvas.
      const zoomDelta=Math.max(-0.16,Math.min(0.16,-delta/240*ZOOM_STEP));
      applyZoom(zoomRef.current+zoomDelta,pointer);
    };
    const onWheel=(event:WheelEvent)=>{
      if(event.ctrlKey||event.metaKey||event.altKey)return;
      event.preventDefault();
      pointer={clientX:event.clientX,clientY:event.clientY};
      accumulated+=normalizeWheelDelta(event);
      if(!frame)frame=requestAnimationFrame(flush);
    };
    viewport.addEventListener('wheel',onWheel,{passive:false});
    return()=>{
      viewport.removeEventListener('wheel',onWheel);
      if(frame)cancelAnimationFrame(frame);
    };
  },[]);

  const objects=page.objects;
  const renderObjects=useMemo(()=>objects.map(object=>object.type==='connector'?resolveConnector(object,objects):object),[objects]);
  const selectedObjects=renderObjects.filter(object=>selected.has(object.id));
  const selectedLine=selectedObjects.length===1&&selectedObjects[0].type==='arrow'&&selectedObjects[0].startPoint&&selectedObjects[0].endPoint?selectedObjects[0]:null;
  const selectedLineAsset=selectedObjects.length===1&&selectedObjects[0].type==='asset'&&(selectedObjects[0].lineAsset||getAssetCatalog().some(asset=>selectedObjects[0].type==='asset'&&asset.id===selectedObjects[0].assetId&&asset.category===LINE_CATEGORY))?selectedObjects[0]:null;
  const [lineArtwork,setLineArtwork]=useState<{svg:string;bounds:typeof fullAssetLineBounds}|null>(null);
  const lineSvg=selectedLineAsset?.svg;
  useEffect(()=>{
    let alive=true;
    if(lineSvg)void readLineArtworkBounds(lineSvg).then(bounds=>{if(alive)setLineArtwork({svg:lineSvg,bounds});});
    return()=>{alive=false;};
  },[lineSvg]);
  const assetEndpointBounds=lineArtwork&&lineArtwork.svg===lineSvg?lineArtwork.bounds:fullAssetLineBounds;
  const selectedAssetEndpoints=selectedLineAsset?assetLineEndpoints(selectedLineAsset,assetEndpointBounds):[];
  const selectedLineNodes=selectedLine?worldLineNodes(selectedLine):[];
  const previewLine=linePreview&&lineTool?createDrawnLine({x:linePreview.sx,y:linePreview.sy},{x:linePreview.ex,y:linePreview.ey},lineTool):null;
  const selectedAsset=selectedObjects.length===1&&selectedObjects[0].type==='asset'?selectedObjects[0] as StyledAssetObject:null;
  const bounds=selectionBounds(selectedObjects);
  const fa=documentState.metadata.locale==='fa';
  const categories=useMemo(()=>getAssetCategories(),[documentState.updatedAt,libraryVersion]);
  const assets=useMemo(()=>{
    if(assetMode==='favorites')return favoriteAssets().filter(asset=>!assetCategory||asset.category===assetCategory).filter(asset=>!assetQuery||searchAssets(assetQuery,documentState.metadata.locale,assetCategory).some(found=>found.id===asset.id));
    if(assetMode==='recent')return recentAssets().filter(asset=>!assetCategory||asset.category===assetCategory).filter(asset=>!assetQuery||searchAssets(assetQuery,documentState.metadata.locale,assetCategory).some(found=>found.id===asset.id));
    return searchAssets(assetQuery,documentState.metadata.locale,assetCategory||undefined);
  },[assetQuery,assetCategory,assetMode,documentState.metadata.locale,documentState.updatedAt,favoriteVersion,libraryVersion]);
  const favoriteIds=useMemo(()=>new Set(favoriteAssetIds()),[favoriteVersion]);
  const grouped=selectedObjects.length>1&&selectedObjects.every(object=>object.groupId)&&new Set(selectedObjects.map(object=>object.groupId)).size===1;
  useEffect(()=>storeRef.current.subscribe(setDocumentState),[]);
  useEffect(()=>{
    const onLibraryChanged=()=>setLibraryVersion(value=>value+1);
    const onStorage=(event:StorageEvent)=>{
      if(event.key!=='bioplot_v3_custom_assets')return;
      reloadRuntimeCloudAssetsFromBrowserCache();
    };
    window.addEventListener('bioplot:asset-library-changed',onLibraryChanged);
    window.addEventListener('storage',onStorage);
    return()=>{
      window.removeEventListener('bioplot:asset-library-changed',onLibraryChanged);
      window.removeEventListener('storage',onStorage);
    };
  },[]);
  useEffect(()=>{
    if(assetCategory&&!categories.includes(assetCategory))setAssetCategory('');
  },[assetCategory,categories]);
  useEffect(()=>{
    let alive=true;
    const id=new URLSearchParams(window.location.search).get('id');
    void (async()=>{
      if(id){
        const found=await projects.load(id);
        if(!found)throw new Error('Figure unavailable');
        if(alive){const loaded=migrateDocument(found);savedContent.current=figureContent(loaded);hasSaved.current=true;storeRef.current.replace(loaded);setDocumentReady(true);}
        return;
      }
      const draftId=new URLSearchParams(window.location.search).get('draft');
      const draft=draftId?readFigureDraft(draftId):null;
      const fresh=draft?migrateDocument(draft):createBlankDocument();
      fresh.metadata.locale=localStorage.getItem('bioplot-lang')==='fa'?'fa':'en';
      savedContent.current=figureContent(fresh);
      hasSaved.current=false;
      if(!alive)return;
      storeRef.current.replace(fresh);
      setDocumentReady(true);
    })().catch(()=>{if(alive)setLoadError(true);});
    return()=>{alive=false;};
  },[]);
  useEffect(()=>{
    const locale=documentState.metadata.locale;
    document.documentElement.dir=locale==='fa'?'rtl':'ltr';
    document.documentElement.lang=locale;
    localStorage.setItem('bioplot-lang',locale);
  },[documentState.metadata.locale]);
  useEffect(()=>{
    if(!documentReady)return;
    const session=createCollaborationSession();
    collaborationRef.current=session;
    let unsubscribe=()=>{};
    void session.connect(documentState.id,createAnonymousPresence()).then(()=>{
      unsubscribe=session.subscribe(event=>{
        if(event.type!=='document')return;
        suppressBroadcast.current=true;
        storeRef.current.replace(migrateDocument(event.document));
        setSaveState(fa?'همگام شد':'Synced');
      });
    }).catch(()=>{});
    return()=>{unsubscribe();session.disconnect();collaborationRef.current=null;};
  },[documentState.id,fa,documentReady]);
  useEffect(()=>{setSelected(current=>new Set([...current].filter(id=>objects.some(object=>object.id===id&&!object.hidden))));},[objects]);
  useEffect(()=>{
    if(!documentReady)return;
    const content=figureContent(documentState);
    if(content===savedContent.current&&pendingWrites.current===0){
      setSaveState(hasSaved.current?(fa?'ذخیره شد':'Saved'):(fa?'پیش‌نویس · هنوز ذخیره نشده':'Draft · not saved yet'));
      return;
    }
    let current=true;
    setSaveFailed(false);
    setSaveState(fa?'در حال ذخیره…':'Saving…');
    const timer=window.setTimeout(()=>{
      // Serialize writes so a slow earlier request cannot overwrite a later edit.
      pendingWrites.current++;
      saveQueue.current=saveQueue.current.then(async()=>{
        try{
          await projects.save(documentState);
          savedContent.current=content;
          hasSaved.current=true;
          clearFigureDraft(documentState.id);
          history.replaceState(null,'',`/editor?id=${encodeURIComponent(documentState.id)}`);
          saveRecoverySnapshot(documentState);
          if(current)setSaveState(fa?'ذخیره شد':'Saved');
          if(suppressBroadcast.current)suppressBroadcast.current=false;else collaborationRef.current?.publishDocument(documentState);
        }catch{if(current){setSaveFailed(true);setSaveState(fa?'ذخیره ناموفق':'Save failed');}}
        finally{pendingWrites.current--;}
      });
    },420);
    return()=>{current=false;window.clearTimeout(timer);};
  },[documentState,fa,documentReady,saveAttempt]);
  useEffect(()=>{const close=()=>setContextMenu(null);window.addEventListener('pointerdown',close);return()=>window.removeEventListener('pointerdown',close);},[]);
  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      if(vectorAsset)return;
      if(isEditable(event.target))return;
      const mod=event.ctrlKey||event.metaKey,key=event.key.toLowerCase();
      if(mod&&key==='z'){event.preventDefault();event.shiftKey?storeRef.current.redo():storeRef.current.undo();return;}
      if(mod&&key==='y'){event.preventDefault();storeRef.current.redo();return;}
      if(mod&&key==='c'){event.preventDefault();copySelection();return;}
      if(mod&&key==='v'){event.preventDefault();pasteClipboard();return;}
      if(mod&&key==='d'){event.preventDefault();duplicateSelection();return;}
      if(mod&&key==='g'){event.preventDefault();event.shiftKey?ungroupSelection():groupSelection();return;}
      if(mod&&event.shiftKey&&key==='e'){event.preventDefault();setInspectorCollapsed(false);setInspectorTab('export');return;}
      if(mod&&event.shiftKey&&key==='q'){event.preventDefault();setInspectorCollapsed(false);setInspectorTab('quality');return;}
      if(event.key==='Delete'||event.key==='Backspace'){event.preventDefault();deleteSelection();return;}
      if(event.key==='Escape'){setLineTool(null);setLinePreview(null);setSelected(new Set());setAssetEditOpen(false);setContextMenu(null);return;}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){event.preventDefault();const step=event.shiftKey?10:1;nudge(event.key==='ArrowLeft'?-step:event.key==='ArrowRight'?step:0,event.key==='ArrowUp'?-step:event.key==='ArrowDown'?step:0);}
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  });
  function idsFor(object:BioPlotObject,additive=false){const ids=object.groupId?objects.filter(item=>item.groupId===object.groupId).map(item=>item.id):[object.id];if(!additive)return new Set(ids);const next=new Set(selected);ids.forEach(id=>next.has(id)?next.delete(id):next.add(id));return next;}
  function addObject(object:BioPlotObject){setSelectionToolbarVisible(true);storeRef.current.dispatch(new AddObjectsCommand('Add object',[object]));setSelected(new Set([object.id]));setAssetEditOpen(object.type==='asset');if(object.type==='asset')setLibraryCollapsed(false);setInspectorTab('properties');if(object.type==='arrow'||object.type==='shape')setInspectorCollapsed(false);}
  function commitSelected(label:string,transform:(object:BioPlotObject)=>BioPlotObject){const before=cloneObjects(selectedObjects);if(before.length)storeRef.current.dispatch(new ObjectStateCommand(label,before,before.map(transform)));}
  function commitAssetStyle(label:string,next:StyledAssetObject){const current=objects.find(object=>object.id===next.id);if(!current||current.type!=='asset'||current.locked)return;storeRef.current.dispatch(new ObjectStateCommand(label,[structuredClone(current)],[next]));}
  function copySelection(){clipboardRef.current=cloneObjects(selectedObjects);}
  function pasteClipboard(){if(!clipboardRef.current.length)return;const pasted=duplicateObjects(clipboardRef.current,28,28);clipboardRef.current=cloneObjects(pasted);storeRef.current.dispatch(new AddObjectsCommand('Paste objects',pasted));setSelected(new Set(pasted.map(object=>object.id)));setAssetEditOpen(pasted.length===1&&pasted[0].type==='asset');}
  function duplicateSelection(){if(!selectedObjects.length)return;const copies=duplicateObjects(selectedObjects);storeRef.current.dispatch(new AddObjectsCommand('Duplicate objects',copies));setSelected(new Set(copies.map(object=>object.id)));setAssetEditOpen(copies.length===1&&copies[0].type==='asset');}
  function deleteSelection(){const doomed=cloneObjects(selectedObjects.filter(object=>!object.locked));if(!doomed.length)return;storeRef.current.dispatch(new DeleteObjectsCommand('Delete objects',doomed));setSelected(new Set());setAssetEditOpen(false);}
  function nudge(dx:number,dy:number){commitSelected('Nudge objects',object=>object.locked?object:{...object,x:object.x+dx,y:object.y+dy});}
  function groupSelection(){if(selectedObjects.length<2||grouped||selectedObjects.some(object=>object.locked))return;const before=cloneObjects(selectedObjects);const groupId=makeId('group');storeRef.current.dispatch(new ObjectStateCommand('Group objects',before,before.map(object=>({...object,groupId}))));setAssetEditOpen(false);}
  function ungroupSelection(){if(!selectedObjects.some(object=>object.groupId)||selectedObjects.some(object=>object.locked))return;const before=cloneObjects(selectedObjects);storeRef.current.dispatch(new ObjectStateCommand('Ungroup objects',before,before.map(object=>({...object,groupId:undefined}))));}
  function setLocked(locked:boolean){commitSelected(locked?'Lock objects':'Unlock objects',object=>({...object,locked}));}
  function setHidden(ids:Set<string>,hidden:boolean){const before=cloneObjects(objects.filter(object=>ids.has(object.id)));if(!before.length)return;storeRef.current.dispatch(new ObjectStateCommand(hidden?'Hide objects':'Show objects',before,before.map(object=>({...object,hidden}))));if(hidden){setSelected(current=>new Set([...current].filter(id=>!ids.has(id))));setAssetEditOpen(false);}}
  function align(mode:AlignMode){const before=cloneObjects(selectedObjects.filter(object=>!object.locked));if(before.length>1)storeRef.current.dispatch(new ObjectStateCommand(`Align ${mode}`,before,alignObjects(before,mode)));}
  function distribute(axis:DistributionAxis){const before=cloneObjects(selectedObjects.filter(object=>!object.locked));if(before.length>2)storeRef.current.dispatch(new ObjectStateCommand(`Distribute ${axis}`,before,distributeObjects(before,axis)));}
  function zOrderFor(ids:Set<string>,action:ZOrderAction){const before=cloneObjects(objects);storeRef.current.dispatch(new PageObjectsCommand(`Layer ${action}`,before,reorderObjects(before,ids,action)));}
  function zOrder(action:ZOrderAction){if(selected.size)zOrderFor(selected,action);}
  function reorderLayer(draggedId:string,targetId:string){const before=cloneObjects(objects),dragged=before.find(object=>object.id===draggedId),targetIndex=before.findIndex(object=>object.id===targetId);if(!dragged||targetIndex<0)return;const after=before.filter(object=>object.id!==draggedId);after.splice(Math.min(targetIndex,after.length),0,dragged);storeRef.current.dispatch(new PageObjectsCommand('Reorder layer',before,after));}
  function changeBounds(field:'x'|'y'|'width'|'height',value:number){if(!bounds||!Number.isFinite(value))return;const before=cloneObjects(selectedObjects.filter(object=>!object.locked));if(!before.length)return;if(field==='x'||field==='y'){const delta=value-bounds[field];storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`,before,before.map(object=>field==='x'?{...object,x:object.x+delta}:{...object,y:object.y+delta})));}else{const next={x:bounds.x,y:bounds.y,width:bounds.width,height:bounds.height,[field]:Math.max(8,value)};storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`,before,resizeObjects(before,next)));}}
  function beginMove(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject){if(!event.shiftKey){if(object.type==='arrow'||object.type==='shape'){setInspectorTab('properties');}setAssetEditOpen(object.type==='asset');if(object.type==='asset')setLibraryCollapsed(false);}if(object.locked){setSelected(idsFor(object,event.shiftKey));return;}event.preventDefault();event.stopPropagation();const ids=!event.shiftKey&&selected.has(object.id)&&selected.size>1?new Set(selected):idsFor(object,event.shiftKey);setSelected(ids);if(event.shiftKey)return;const before=cloneObjects(objects.filter(item=>ids.has(item.id)&&!item.locked));const startBounds=selectionBounds(before);if(!before.length||!startBounds)return;const targets=buildSnapTargets(storeRef.current.snapshot,ids),sx=event.clientX,sy=event.clientY;const move=(pointer:PointerEvent)=>{const snapped=snapDelta(startBounds,(pointer.clientX-sx)/zoom,(pointer.clientY-sy)/zoom,targets);storeRef.current.preview(before.map(item=>({...item,x:item.x+snapped.dx,y:item.y+snapped.dy})));setGuides({x:snapped.guideX,y:snapped.guideY});};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);const after=cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item=>ids.has(item.id)&&!item.locked));storeRef.current.commitObjectState(before,after,'Move objects');setGuides({});if(object.type==='arrow'||object.type==='shape')setInspectorCollapsed(false);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}

  function beginResize(event:ReactPointerEvent,handle:string){
    event.preventDefault();
    event.stopPropagation();
    if(!bounds||!selectedObjects.length||selectedObjects.some(object=>object.locked))return;

    const before=cloneObjects(selectedObjects);
    const start={...bounds};
    const sx=event.clientX;
    const sy=event.clientY;
    const selection=artboardRef.current?.querySelector<HTMLElement>('.studio-selection.studio-selection-tight')??null;
    let tight:TightSelectionBounds|null=null;
    if(selection&&selectedObjects.length===1&&selectedObjects[0].type==='asset'){
      const x=Number.parseFloat(selection.style.getPropertyValue('--bioplot-tight-left'));
      const y=Number.parseFloat(selection.style.getPropertyValue('--bioplot-tight-top'));
      const width=Number.parseFloat(selection.style.getPropertyValue('--bioplot-tight-width'));
      const height=Number.parseFloat(selection.style.getPropertyValue('--bioplot-tight-height'));
      if([x,y,width,height].every(Number.isFinite)&&width>0&&height>0)tight={x,y,width,height,right:x+width,bottom:y+height};
    }
    const tightMap=tight?{
      fx:(tight.x-start.x)/start.width,
      fy:(tight.y-start.y)/start.height,
      fw:tight.width/start.width,
      fh:tight.height/start.height,
    }:null;

    const move=(pointer:PointerEvent)=>{
      const dx=(pointer.clientX-sx)/zoom;
      const dy=(pointer.clientY-sy)/zoom;

      if(tight&&tightMap&&tightMap.fw>0&&tightMap.fh>0){
        const horizontal=handle.includes('e')||handle.includes('w');
        const vertical=handle.includes('n')||handle.includes('s');

        if(horizontal&&vertical){
          // Scientific assets keep their aspect ratio from a corner. Projecting the
          // pointer onto that diagonal prevents transparent SVG padding from making
          // the visible selection box drift away from the resize handle.
          const signX=handle.includes('e')?1:-1;
          const signY=handle.includes('s')?1:-1;
          const denominator=tight.width*tight.width+tight.height*tight.height;
          const deltaScale=denominator?(signX*tight.width*dx+signY*tight.height*dy)/denominator:0;
          const minScale=Math.max(12/start.width,12/start.height);
          const scale=Math.max(minScale,1+deltaScale);
          const visualWidth=tight.width*scale;
          const visualHeight=tight.height*scale;
          const visualX=handle.includes('e')?tight.x:tight.right-visualWidth;
          const visualY=handle.includes('s')?tight.y:tight.bottom-visualHeight;
          const width=visualWidth/tightMap.fw;
          const height=visualHeight/tightMap.fh;
          const x=visualX-tightMap.fx*width;
          const y=visualY-tightMap.fy*height;
          storeRef.current.preview(resizeObjects(before,{x,y,width,height}));
          return;
        }

        // Side handles operate on the visible/tight rectangle, then convert the
        // result back to the model's full object box. This keeps handle motion and
        // object geometry in the same coordinate system.
        let x=start.x,y=start.y,width=start.width,height=start.height;
        if(handle.includes('e')){
          const visualWidth=Math.max(4,12*tightMap.fw,tight.width+dx);
          width=visualWidth/tightMap.fw;
          x=tight.x-tightMap.fx*width;
        }
        if(handle.includes('w')){
          const visualWidth=Math.max(4,12*tightMap.fw,tight.width-dx);
          const visualX=tight.right-visualWidth;
          width=visualWidth/tightMap.fw;
          x=visualX-tightMap.fx*width;
        }
        if(handle.includes('s')){
          const visualHeight=Math.max(4,12*tightMap.fh,tight.height+dy);
          height=visualHeight/tightMap.fh;
          y=tight.y-tightMap.fy*height;
        }
        if(handle.includes('n')){
          const visualHeight=Math.max(4,12*tightMap.fh,tight.height-dy);
          const visualY=tight.bottom-visualHeight;
          height=visualHeight/tightMap.fh;
          y=visualY-tightMap.fy*height;
        }
        storeRef.current.preview(resizeObjects(before,{x,y,width,height}));
        return;
      }

      let x=start.x,y=start.y,width=start.width,height=start.height;
      if(handle.includes('e'))width=Math.max(12,start.width+dx);
      if(handle.includes('s'))height=Math.max(12,start.height+dy);
      if(handle.includes('w')){x=Math.min(start.right-12,start.x+dx);width=start.right-x;}
      if(handle.includes('n')){y=Math.min(start.bottom-12,start.y+dy);height=start.bottom-y;}
      storeRef.current.preview(resizeObjects(before,{x,y,width,height}));
    };
    const up=()=>{
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerup',up);
      const after=cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item=>selected.has(item.id)));
      storeRef.current.commitObjectState(before,after,'Resize objects');
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up,{once:true});
  }

  function beginRotate(event:ReactPointerEvent){event.preventDefault();event.stopPropagation();if(!bounds||!artboardRef.current||selectedObjects.some(object=>object.locked))return;const before=cloneObjects(selectedObjects),rect=artboardRef.current.getBoundingClientRect(),cx=rect.left+bounds.cx*zoom,cy=rect.top+bounds.cy*zoom,start=Math.atan2(event.clientY-cy,event.clientX-cx)*180/Math.PI;const move=(pointer:PointerEvent)=>{const angle=Math.atan2(pointer.clientY-cy,pointer.clientX-cx)*180/Math.PI;storeRef.current.preview(rotateObjects(before,pointer.shiftKey?Math.round((angle-start)/15)*15:angle-start,{x:bounds.cx,y:bounds.cy}));};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);const after=cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item=>selected.has(item.id)));storeRef.current.commitObjectState(before,after,'Rotate objects');};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}
  function beginLineDraw(event:ReactPointerEvent<HTMLDivElement>){
    if(!lineTool||!artboardRef.current||event.button!==0)return;
    event.preventDefault();event.stopPropagation();
    const rect=artboardRef.current.getBoundingClientRect();
    const point=(clientX:number,clientY:number)=>({x:Math.max(0,Math.min(page.width,(clientX-rect.left)/zoom)),y:Math.max(0,Math.min(page.height,(clientY-rect.top)/zoom))});
    const start=point(event.clientX,event.clientY);
    const adjusted=(x:number,y:number)=>{const p=point(x,y);if(lineTool.axis==='horizontal')p.y=start.y;if(lineTool.axis==='vertical')p.x=start.x;return p;};
    setLinePreview({sx:start.x,sy:start.y,ex:start.x,ey:start.y});
    const move=(pointer:PointerEvent)=>{const end=adjusted(pointer.clientX,pointer.clientY);setLinePreview({sx:start.x,sy:start.y,ex:end.x,ey:end.y});};
    const up=(pointer:PointerEvent)=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);setLinePreview(null);const end=adjusted(pointer.clientX,pointer.clientY);if(Math.hypot(end.x-start.x,end.y-start.y)>=3)addObject(createDrawnLine(start,end,lineTool));setLineTool(null);};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }
  function beginAssetEndpoint(event:ReactPointerEvent,index:number){
    if(event.button!==0||!selectedLineAsset||selectedLineAsset.locked)return;
    event.preventDefault();event.stopPropagation();
    const asset=selectedLineAsset;
    const origin=selectedAssetEndpoints[index],opposite=selectedAssetEndpoints[1-index];
    const pointerDown={x:event.clientX,y:event.clientY};
    const before=structuredClone(asset);
    let changed=false;
    const move=(pointer:PointerEvent)=>{
      const point=lineNodeDragPoint(origin,pointerDown,{x:pointer.clientX,y:pointer.clientY},zoom,
        {width:page.width,height:page.height},pointer.shiftKey?opposite:undefined);
      storeRef.current.preview([updateAssetLineEndpoint(asset,index,point,assetEndpointBounds)]);changed=true;
    };
    const cleanup=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',cancel);};
    const up=()=>{
      cleanup();if(!changed)return;
      const after=activePage(storeRef.current.snapshot).objects.find(item=>item.id===asset.id);
      if(after)storeRef.current.commitObjectState([before],[structuredClone(after)],'Move uploaded arrow endpoint');
    };
    const cancel=()=>{cleanup();storeRef.current.preview([before]);};
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up,{once:true});
    window.addEventListener('pointercancel',cancel,{once:true});
  }
  function beginLineNode(event:ReactPointerEvent,index:number){
    if(event.button!==0)return;
    event.preventDefault();event.stopPropagation();
    const line=selectedLine;
    if(!line||line.locked||!artboardRef.current)return;
    const origin=selectedLineNodes[index];
    if(!origin)return;
    const opposite=selectedLineNodes[index===0?selectedLineNodes.length-1:0];
    const endpoint=index===0||index===selectedLineNodes.length-1;
    const pointerDown={x:event.clientX,y:event.clientY};
    const before=[structuredClone(line)];
    let changed=false;
    const move=(pointer:PointerEvent)=>{
      // Preserve the offset where the node was grabbed. Mapping the pointer
      // directly to the node made tiny handles jump on the first move.
      const point=lineNodeDragPoint(origin,pointerDown,{x:pointer.clientX,y:pointer.clientY},zoom,
        {width:page.width,height:page.height},pointer.shiftKey&&endpoint?opposite:undefined);
      storeRef.current.preview([updateLineNode(line,index,point)]);changed=true;
    };
    const up=()=>{
      window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);
      if(!changed)return;
      const after=activePage(storeRef.current.snapshot).objects.find(item=>item.id===line.id);
      if(after)storeRef.current.commitObjectState(before,[structuredClone(after)],'Move line node');
    };
    window.addEventListener('pointermove',move);
    window.addEventListener('pointerup',up,{once:true});
  }
  function addLineMidpoint(event:React.MouseEvent,index:number){
    event.preventDefault();event.stopPropagation();
    if(!selectedLine||selectedLine.locked)return;
    const after=insertLineNode(selectedLine,index);
    if(after!==selectedLine)storeRef.current.dispatch(new ObjectStateCommand('Add line node',[structuredClone(selectedLine)],[after]));
  }
  function deleteLineNode(event:React.MouseEvent,index:number){
    event.preventDefault();event.stopPropagation();
    if(!selectedLine||selectedLine.locked)return;
    const after=removeLineNode(selectedLine,index);
    if(after!==selectedLine)storeRef.current.dispatch(new ObjectStateCommand('Remove line node',[structuredClone(selectedLine)],[after]));
  }
  function beginMarquee(event:ReactPointerEvent<HTMLDivElement>){
    if(lineTool){beginLineDraw(event);return;}
    if(event.button!==0||event.target!==event.currentTarget||!artboardRef.current)return;
    const art=artboardRef.current.getBoundingClientRect();
    const sx=(event.clientX-art.left)/zoom,sy=(event.clientY-art.top)/zoom;
    const original=event.shiftKey?new Set(selected):new Set<string>();
    let marqueeSelection=original;
    let dragged=false;
    if(!event.shiftKey){setSelected(new Set());setAssetEditOpen(false);}
    const update=(pointer:PointerEvent)=>{
      if(pointer.pointerId!==event.pointerId)return;
      if(Math.hypot(pointer.clientX-event.clientX,pointer.clientY-event.clientY)>3)dragged=true;
      if(!dragged)return;
      const rect=rectFromPoints(sx,sy,(pointer.clientX-art.left)/zoom,(pointer.clientY-art.top)/zoom);
      marqueeSelection=new Set([...original,...objectsInRect(objects,rect).filter(object=>!object.locked).map(object=>object.id)]);
      setSelected(marqueeSelection);
    };
    const cleanup=()=>{
      window.removeEventListener('pointermove',update);
      window.removeEventListener('pointerup',up);
      window.removeEventListener('pointercancel',cancel);
      window.removeEventListener('blur',cleanup);
    };
    const up=(pointer:PointerEvent)=>{
      if(pointer.pointerId!==event.pointerId)return;
      update(pointer);
      cleanup();
      // Completing a multi-selection is distinct from moving selected artwork.
      if(dragged&&marqueeSelection.size>1)setSelectionToolbarVisible(true);
    };
    const cancel=(pointer:PointerEvent)=>{if(pointer.pointerId===event.pointerId)cleanup();};
    window.addEventListener('pointermove',update);
    window.addEventListener('pointerup',up);
    window.addEventListener('pointercancel',cancel);
    window.addEventListener('blur',cleanup);
  }

  function setTitle(title:string){const next=cloneDocument(documentState);next.title=title;next.updatedAt=new Date().toISOString();storeRef.current.replace(next);}
  function toggleLocale(){const next=cloneDocument(documentState);next.metadata.locale=fa?'en':'fa';storeRef.current.replace(next);}
  async function share(){await navigator.clipboard?.writeText(window.location.href);setShareState(fa?'کپی شد':'Copied');setTimeout(()=>setShareState(fa?'اشتراک':'Share'),1500);}
  async function importSvg(file?:File){if(!file)return;try{const safe=sanitizeSvg(await file.text());const asset=saveCustomAsset({name:file.name.replace(/\.svg$/i,''),category:'Custom',synonyms:{en:[file.name],fa:[]},svg:safe,colorSlots:[],reviewStatus:'draft',premium:false});addObject(assetToObject(asset));setPanel('assets');}catch(error){alert(error instanceof Error?error.message:'Could not import SVG.');}}
  function importImage(file?:File){if(!file)return;const reader=new FileReader();reader.onload=()=>{if(typeof reader.result!=='string')return;const image=new Image();image.onload=()=>addObject(makeImage(reader.result as string,file.name,340,230,image.naturalWidth,image.naturalHeight));image.onerror=()=>addObject(makeImage(reader.result as string,file.name));image.src=reader.result;};reader.readAsDataURL(file);}
  function resizePanel(side:'library'|'inspector',event:ReactPointerEvent){event.preventDefault();const start=event.clientX,initial=side==='library'?libraryWidth:inspectorWidth,direction=side==='library'?1:-1;const move=(pointer:PointerEvent)=>{const value=initial+(pointer.clientX-start)*direction;if(side==='library')setLibraryWidth(Math.max(220,Math.min(420,value)));else setInspectorWidth(Math.max(290,Math.min(440,value)));};const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});}
  function objectContext(event:ReactPointerEvent<HTMLDivElement>,object:BioPlotObject){event.preventDefault();event.stopPropagation();if(!selected.has(object.id))setSelected(idsFor(object));setAssetEditOpen(object.type==='asset');if(object.type==='asset')setLibraryCollapsed(false);setContextMenu({x:event.clientX,y:event.clientY});}
  function selectPage(id:string){
    if(!documentState.pages.some(item=>item.id===id))return;
    const next=cloneDocument(documentState);next.activePageId=id;
    storeRef.current.replace(next);setSelected(new Set());setAssetEditOpen(false);setContextMenu(null);
  }
  function addPage(){
    const newPage={id:makeId('page'),name:fa?`صفحه ${documentState.pages.length+1}`:`Figure ${documentState.pages.length+1}`,width:page.width,height:page.height,background:page.background,objects:[]};
    storeRef.current.dispatch(new AddStudioPageCommand(newPage,page.id));setSelected(new Set());setAssetEditOpen(false);
  }
  function changeCanvas(settings:CanvasSettings){storeRef.current.dispatch(new CanvasSettingsCommand({width:page.width,height:page.height,background:page.background},settings));}
  function openTool(tool:Panel){setLineTool(null);setLinePreview(null);setAssetEditOpen(false);setPanel(tool);setLibraryCollapsed(false);}
  function browseAssets(){setAssetEditOpen(false);setPanel('assets');setLibraryCollapsed(false);}
  const columns=`60px ${libraryCollapsed?0:panel==='lines'?Math.max(360,libraryWidth):libraryWidth}px 6px minmax(0,1fr) 6px ${!inspectorCollapsed?inspectorWidth:pagesCollapsed?0:196}px`;
  if(loadError)return <div className="editor-cloud-loading"><strong>{fa?'شکل در دسترس نیست یا دریافت آن انجام نشد.':'Figure unavailable or could not be loaded.'}</strong><button onClick={()=>window.location.reload()}>{fa?'تلاش دوباره':'Retry'}</button><a href="/dashboard">{fa?'داشبورد':'Dashboard'}</a></div>;
  if(!documentReady)return <div className="editor-cloud-loading"><strong>{fa?'در حال دریافت شکل…':'Loading figure…'}</strong></div>;
  return <div className={`studio-shell ${libraryCollapsed?'library-closed':'library-open'} ${inspectorCollapsed?'inspector-closed':'inspector-open'} ${pagesCollapsed?'pages-closed':'pages-open'} ${selectedObjects.length?'has-selection':'no-selection'} ${showGrid?'grid-visible':''}`} dir={fa?'rtl':'ltr'}>
    {vectorAsset&&<SvgTemplateEditor svg={vectorAsset.svg} fa={fa} onClose={()=>setVectorAsset(null)} onApply={svg=>{commitAssetStyle('Edit SVG components',{...vectorAsset,svg,tintColor:undefined});setVectorAsset(null);}}/>}
    <header className="studio-topbar">
      <div className="reference-document-card">
        <a className="studio-brand" href="/dashboard" aria-label="BioPlot"><span>B</span><strong>BioPlot</strong></a>
        <div className="studio-document"><input aria-label={fa?'نام شکل':'Figure title'} value={documentState.title} onChange={event=>setTitle(event.target.value)}/><small title={saveState}><i/>{saveState}</small>{saveFailed&&<button onClick={()=>setSaveAttempt(value=>value+1)}>{fa?'تلاش دوباره':'Retry save'}</button>}</div>
        <div className="studio-history"><button disabled={!storeRef.current.history.canUndo} onClick={()=>storeRef.current.undo()} title={fa?'واگرد':'Undo'} aria-label={fa?'واگرد':'Undo'}><StudioIcon name="undo"/></button><button disabled={!storeRef.current.history.canRedo} onClick={()=>storeRef.current.redo()} title={fa?'ازنو':'Redo'} aria-label={fa?'ازنو':'Redo'}><StudioIcon name="redo"/></button></div>
      </div>
      <details className="canvas-edit-details"><summary aria-label={fa?'ویرایش بوم':'Edit canvas'}><StudioIcon name="canvas"/><span>{fa?'ویرایش بوم':'Edit canvas'}</span></summary><CanvasSettingsForm fa={fa} page={page} onSettings={changeCanvas}/></details>
      <div className="studio-top-actions"><button onClick={toggleLocale}>{fa?'EN':'FA'}</button><button className="reference-check" title={fa?'بررسی کیفیت':'Publication check'} onClick={()=>{setInspectorCollapsed(false);setInspectorTab('quality');}} aria-label={fa?'بررسی کیفیت':'Publication check'}><StudioIcon name="check"/></button><button onClick={share}><StudioIcon name="share"/>{shareState==='Share'&&fa?'اشتراک':shareState}</button><button className="studio-export" onClick={()=>{setInspectorCollapsed(false);setInspectorTab('export');}}><StudioIcon name="download"/>{fa?'خروجی':'Export'}</button></div>
    </header>
    {bounds&&selectionToolbarVisible&&<FloatingSelectionToolbar viewportRef={canvasViewportRef} artboardRef={artboardRef} label={fa?'ویرایش انتخاب':'Edit selection'}>
      <div className="studio-command-row">
        {selectedAsset&&<button disabled={!!selectedAsset.locked} onClick={()=>setVectorAsset(structuredClone(selectedAsset))}>{fa?'ویرایش اجزای SVG':'Edit SVG components'}</button>}
        <SelectionToolbar fa={fa} selectedObjects={selectedObjects} grouped={grouped} onCopy={copySelection} onDuplicate={duplicateSelection} onAlign={align} onDistribute={distribute} onFront={()=>zOrder('front')} onBack={()=>zOrder('back')} onGroup={groupSelection} onUngroup={ungroupSelection} onLock={()=>setLocked(!selectedObjects.every(object=>object.locked))} onDelete={deleteSelection}/>
        <button className="ribbon-inspector-toggle" aria-pressed={!inspectorCollapsed} onClick={()=>setInspectorCollapsed(value=>!value)} title={fa?'پنل‌های ویرایش':'Editor panels'}><StudioIcon name="panel"/><span>{fa?'پنل‌ها':'Panels'}</span></button>
      </div>
      {selectedObjects.length===1&&(selectedObjects[0].type==='text'||selectedObjects[0].type==='label')&&<FloatingTextControls object={selectedObjects[0]} fa={fa} onCommit={commitSelected}/>}
      <SelectionProperties fa={fa} bounds={bounds} selectedObjects={selectedObjects} onBounds={changeBounds} onCommit={commitSelected} onLock={setLocked} onHide={()=>setHidden(selected,true)}/>
    </FloatingSelectionToolbar>}
    <main className="studio-workspace" style={{gridTemplateColumns:columns}}>{lineTool&&<div className="bp-line-tool-banner" role="status">{fa?'روی بوم بکشید؛ Esc برای لغو':'Drag on canvas to draw · Esc to cancel'}</div>}
      <nav className="reference-tool-rail" aria-label={fa?'ابزارهای طراحی':'Design tools'}>
        {([['assets','search',fa?'جستجو':'Search'],['upload','upload',fa?'آپلود':'Uploads'],['text','text',fa?'متن':'Text'],['lines','arrow',fa?'خطوط':'Lines'],['shapes','elements',fa?'شکل‌ها':'Shapes']] as [Panel,StudioIconName,string][]).map(([tool,icon,label])=><button key={tool} className={!assetEditOpen&&panel===tool&&!libraryCollapsed?'active':''} aria-pressed={!assetEditOpen&&panel===tool&&!libraryCollapsed} onClick={()=>openTool(tool)}><StudioIcon name={icon}/><span>{label}</span></button>)}
        <div className="reference-rail-spacer"/>
        <button className={!inspectorCollapsed?'active':''} aria-pressed={!inspectorCollapsed} onClick={()=>{setInspectorCollapsed(value=>!value);setInspectorTab('properties');}}><StudioIcon name="settings"/><span>{fa?'ویرایش':'Edit'}</span></button>
      </nav>
      <ShineBorder as="aside" dir={fa?'rtl':'ltr'} className={`studio-library ${libraryCollapsed?'collapsed':''}`} borderRadius={12} borderWidth={1.25} duration={18} color={['#d9e9e6','#74beb4','#d9e9e6']}>
        {selectedAsset&&assetEditOpen?<AssetStylePanel fa={fa} object={selectedAsset} onChange={commitAssetStyle} onBrowse={browseAssets}/>:<>
          <div className="studio-panel-heading"><div><h2>{panel==='assets'?(fa?'کتابخانه علمی':'Scientific assets'):panel==='upload'?(fa?'آپلود':'Uploads'):panel==='text'?(fa?'متن و برچسب':'Text & labels'):panel==='lines'?(fa?'خطوط و اتصال‌ها':'Lines & connectors'):(fa?'شکل‌ها':'Shapes')}</h2></div><button onClick={()=>setLibraryCollapsed(true)} aria-label={fa?'بستن کتابخانه':'Close library'}><StudioIcon name="close"/></button></div>
          {panel==='assets'&&<><div className="studio-search"><StudioIcon name="search"/><input aria-label={fa?'جستجوی المان علمی':'Search scientific assets'} value={assetQuery} onChange={event=>setAssetQuery(event.target.value)} placeholder={fa?'نورون، سلول، DNA…':'Neuron, cell, DNA…'}/></div><div className="asset-mode-tabs"><button className={assetMode==='all'?'active':''} onClick={()=>setAssetMode('all')}>{fa?'همه':'All'}</button><button className={assetMode==='favorites'?'active':''} onClick={()=>setAssetMode('favorites')}><StudioIcon name="star"/>{fa?'منتخب':'Favorites'}</button><button className={assetMode==='recent'?'active':''} onClick={()=>setAssetMode('recent')}><StudioIcon name="clock"/>{fa?'اخیر':'Recent'}</button></div><select className="asset-category-select" value={assetCategory} onChange={event=>setAssetCategory(event.target.value)}><option value="">{fa?'همه دسته‌ها':'All categories'}</option>{categories.map(category=><option key={category}>{category}</option>)}</select><AssetCatalogView fa={fa} assets={assets} grouped={!assetQuery&&!assetCategory&&assetMode==='all'} favorites={favoriteIds} onAdd={asset=>addObject(assetToObject(asset))} onFavorite={id=>{toggleFavoriteAsset(id);setFavoriteVersion(value=>value+1);}} onCategory={setAssetCategory}/></>}
          {panel==='lines'&&<VectorStudio fa={fa}/>}
          {['elements','text','shapes'].includes(panel)&&<Elements fa={fa} addObject={addObject} group={panel}/>} 
          {panel==='upload'&&<div className="studio-upload"><label><span><StudioIcon name="upload"/></span><b>{fa?'SVG علمی':'Scientific SVG'}</b><input hidden type="file" accept=".svg,image/svg+xml" onChange={event=>void importSvg(event.target.files?.[0])}/></label><label><span><StudioIcon name="image"/></span><b>{fa?'تصویر':'Raster image'}</b><small>PNG / JPG / WebP</small><input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event=>importImage(event.target.files?.[0])}/></label></div>}
        </>}
      </ShineBorder>
      <div className={`studio-splitter library-splitter ${libraryCollapsed?'disabled':''}`} onPointerDown={event=>!libraryCollapsed&&resizePanel('library',event)}/>
      <section className={`studio-canvas-zone ${lineTool?'bp-line-drawing':''}`}><div className="studio-canvas-scroll" ref={canvasViewportRef} onPointerDown={event=>{if(event.target===event.currentTarget){setSelected(new Set());setAssetEditOpen(false);setContextMenu(null);}}}><div className="studio-artboard-scale" style={{width:page.width*zoom,height:page.height*zoom}}><span className="reference-artboard-label">{page.width} × {page.height} px</span><div ref={artboardRef} className="studio-artboard" style={{width:page.width,height:page.height,background:page.background,transform:`scale(${zoom})`,transformOrigin:'top left'}} onPointerDown={beginMarquee}>{linePreview&&<svg aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible',zIndex:200}}><g opacity="0.7" transform={`translate(${previewLine?.x??0} ${previewLine?.y??0})`} dangerouslySetInnerHTML={{__html:previewLine?lineSvgBody(previewLine):''}}/></svg>}{renderObjects.map(object=><EditorObjectView key={object.id} object={object} objects={objects} selected={selected.has(object.id)} onPointerDown={beginMove} onContextMenu={objectContext}/>)}{selectedLineAsset&&!selectedLineAsset.locked&&selectedAssetEndpoints.map((point,index)=><button key={`asset-end-${index}`} type="button" className="bp-asset-endpoint" aria-label={fa?(index===0?'کشیدن ابتدای فلش':'کشیدن انتهای فلش'):(index===0?'Drag uploaded arrow start':'Drag uploaded arrow end')} title={fa?'جابجایی سر فلش · Shift برای تراز':'Drag endpoint · Shift to align'} style={{left:point.x,top:point.y,transform:`translate(-50%,-50%) scale(${1/zoom})`}} onPointerDown={event=>beginAssetEndpoint(event,index)}/>)}{guides.x!==undefined&&<div className="studio-guide vertical" style={{left:guides.x}}/>}{guides.y!==undefined&&<div className="studio-guide horizontal" style={{top:guides.y}}/>}{bounds&&<div className={`studio-selection ${selectedLine||selectedLineAsset?'bp-path-selected':''}`} style={{left:bounds.x,top:bounds.y,width:bounds.width,height:bounds.height}}><span className="studio-rotate-line"/><button className="studio-rotate" type="button" title={fa?'چرخاندن انتخاب (Shift: گام ۱۵ درجه)':'Rotate selection (Shift: 15° steps)'} aria-label={fa?'چرخاندن انتخاب':'Rotate selection'} onPointerDown={beginRotate}/>{(selectedLine||selectedLineAsset?['nw','ne','se','sw']:['nw','n','ne','e','se','s','sw','w']).map(handle=><button key={handle} type="button" aria-label={`${handle} resize handle`} title={fa?'تغییر اندازه':'Resize'} className={`studio-handle ${handle}`} onPointerDown={event=>beginResize(event,handle)}/>)}{selectedLine&&selectedLineNodes.map((point,index)=><button key={`node-${index}`} type="button" className={`bp-line-node ${index===0||index===selectedLineNodes.length-1?'is-endpoint':''}`} aria-label={index===0?'Drag line start':index===selectedLineNodes.length-1?'Drag line end':`Drag node ${index+1}; double-click to remove`} title={index===0?'Drag start':index===selectedLineNodes.length-1?'Drag end':'Drag node · Double-click to remove'} style={{left:point.x-bounds.x,top:point.y-bounds.y}} onPointerDown={event=>beginLineNode(event,index)} onDoubleClick={event=>deleteLineNode(event,index)}/>)}{selectedLine&&selectedLineNodes.slice(0,-1).map((point,index)=><button key={`insert-${index}`} type="button" className="bp-line-add-node" title={fa?'افزودن گره':'Add node'} aria-label={fa?'افزودن گره':'Add node'} style={{left:(point.x+selectedLineNodes[index+1].x)/2-bounds.x,top:(point.y+selectedLineNodes[index+1].y)/2-bounds.y}} onClick={event=>addLineMidpoint(event,index)}>+</button>)}</div>}</div></div></div></section>
      <div className={`studio-splitter inspector-splitter ${inspectorCollapsed?'disabled':''}`} onPointerDown={event=>!inspectorCollapsed&&resizePanel('inspector',event)}/>
      {inspectorCollapsed&&!pagesCollapsed&&<StudioPagesPanel fa={fa} documentState={documentState} onSelect={selectPage} onAdd={addPage} onClose={()=>setPagesCollapsed(true)}/>} 
      {!inspectorCollapsed&&<EditorInspector fa={fa} tab={inspectorTab} setTab={setInspectorTab} documentState={documentState} bounds={bounds} selectedObjects={selectedObjects} objects={objects} selected={selected} onBounds={changeBounds} onCommit={commitSelected} onLock={setLocked} onHide={()=>setHidden(selected,true)} onSelect={object=>{setSelected(idsFor(object));setAssetEditOpen(object.type==='asset');if(object.type==='asset')setLibraryCollapsed(false);setInspectorTab('properties');}} onLayerStep={(id,action)=>zOrderFor(new Set([id]),action)} onLayerReorder={reorderLayer} onToggleObjectLock={object=>storeRef.current.dispatch(new ObjectStateCommand(object.locked?'Unlock':'Lock',[structuredClone(object)],[{...object,locked:!object.locked}]))} onToggleObjectHidden={object=>setHidden(new Set([object.id]),!object.hidden)} onCollapse={()=>setInspectorCollapsed(true)}/>} 
    </main>
    <footer className="reference-bottom-bar">
      <span className="reference-object-count">{objects.length} {fa?'آبجکت':'objects'}</span>
      <div className="reference-canvas-actions">
        <details className="canvas-edit-details"><summary><StudioIcon name="canvas"/><span>{fa?'اندازه بوم':'Canvas size'}</span></summary><CanvasSettingsForm fa={fa} page={page} onSettings={changeCanvas}/></details>
        <label className="canvas-color-control"><StudioIcon name="paint"/><span>{fa?'رنگ بوم':'Canvas color'}</span><input aria-label={fa?'رنگ بوم':'Canvas color'} type="color" value={page.background} onChange={event=>changeCanvas({width:page.width,height:page.height,background:event.target.value})}/></label>
      </div>
      <div className="reference-zoom-controls"><button aria-label={fa?'کوچک‌نمایی':'Zoom out'} onClick={()=>applyZoom(zoomRef.current-ZOOM_STEP,viewportCenter())}><StudioIcon name="minus"/></button><input aria-label={fa?'بزرگ‌نمایی':'Zoom'} type="range" min="10" max="250" value={Math.round(zoom*100)} onChange={event=>applyZoom(Number(event.target.value)/100,viewportCenter())}/><button aria-label={fa?'بزرگ‌نمایی':'Zoom in'} onClick={()=>applyZoom(zoomRef.current+ZOOM_STEP,viewportCenter())}><StudioIcon name="plus"/></button><span>{Math.round(zoom*100)}%</span><button onClick={fitCanvas} title={fa?'جا دادن بوم':'Fit canvas'} aria-label={fa?'جا دادن بوم':'Fit canvas'}><StudioIcon name="fit"/></button><button className={showGrid?'active':''} aria-pressed={showGrid} onClick={()=>setShowGrid(value=>!value)} title={fa?'شبکه':'Grid'} aria-label={fa?'شبکه':'Grid'}><StudioIcon name="grid"/></button></div>
      <button className={`reference-slides-toggle ${!pagesCollapsed&&inspectorCollapsed?'active':''}`} aria-pressed={!pagesCollapsed&&inspectorCollapsed} onClick={()=>{if(!inspectorCollapsed){setInspectorCollapsed(true);setPagesCollapsed(false);}else setPagesCollapsed(value=>!value);}}><StudioIcon name="layers"/>{fa?'صفحه‌ها':'Slides'}</button>
      <span className="reference-page-count">{documentState.pages.findIndex(item=>item.id===page.id)+1} / {documentState.pages.length}</span>
    </footer>
    {contextMenu&&<div className="studio-context-menu" style={{left:contextMenu.x,top:contextMenu.y}} onPointerDown={event=>event.stopPropagation()}><button onClick={()=>{copySelection();setContextMenu(null);}}>Copy <kbd>⌘C</kbd></button><button onClick={()=>{pasteClipboard();setContextMenu(null);}}>Paste <kbd>⌘V</kbd></button><button onClick={()=>{duplicateSelection();setContextMenu(null);}}>Duplicate <kbd>⌘D</kbd></button><hr/>{selectedObjects.length>1&&<button onClick={()=>{grouped?ungroupSelection():groupSelection();setContextMenu(null);}}>{grouped?'Ungroup':'Group'}</button>}<button onClick={()=>{zOrder('front');setContextMenu(null);}}>Bring to front</button><button onClick={()=>{zOrder('back');setContextMenu(null);}}>Send to back</button><button onClick={()=>{setLocked(!selectedObjects.every(object=>object.locked));setContextMenu(null);}}>{selectedObjects.every(object=>object.locked)?'Unlock':'Lock'}</button><hr/><button className="danger" onClick={()=>{deleteSelection();setContextMenu(null);}}>Delete</button></div>}
  </div>;
}
function Elements({fa,addObject,group}:{fa:boolean;addObject:(object:BioPlotObject)=>void;group:Panel}){
  return <div className={`studio-elements element-group-${group}`}><section><h3>{fa?'متن و برچسب':'Text & labels'}</h3><div><button onClick={()=>addObject(makeText())}><span><StudioIcon name="text"/></span><b>{fa?'متن علمی':'Scientific text'}</b></button><button onClick={()=>addObject(makePanelLabel())}><span><StudioIcon name="text"/></span><b>{fa?'برچسب پنل':'Panel label'}</b></button></div></section><section><h3>{fa?'شکل‌ها':'Shapes'}</h3><div>{SHAPE_CATALOG.map(item=><button key={item.shape} onClick={()=>addObject(makeShape(item.shape))}><span><svg aria-hidden="true" width="48" height="36" viewBox="0 0 80 60" dangerouslySetInnerHTML={{__html:shapeSvgBody({...makeShape(item.shape),width:item.shape==='circle'?60:80,height:60,strokeWidth:2})}}/></span><b>{fa?item.fa:item.en}</b></button>)}<button onClick={()=>addObject(makeContainer())}><span><StudioIcon name="layers"/></span><b>{fa?'کانتینر':'Container'}</b></button></div></section><section><h3>{fa?'فلش و اتصال':'Arrows & connectors'}</h3><div><button onClick={()=>addObject(makeArrow())}><span><StudioIcon name="arrow"/></span><b>{fa?'فلش':'Arrow'}</b></button><button onClick={()=>addObject(makeConnector('straight'))}><span><StudioIcon name="arrow"/></span><b>{fa?'اتصال مستقیم':'Straight'}</b></button><button onClick={()=>addObject(makeConnector('elbow'))}><span><StudioIcon name="connector"/></span><b>{fa?'اتصال زاویه‌دار':'Elbow'}</b></button><button onClick={()=>addObject(makeConnector('curved'))}><span><StudioIcon name="curve"/></span><b>{fa?'اتصال منحنی':'Curved'}</b></button></div></section></div>;
}
export function SelectionToolbar({fa,selectedObjects,grouped,onCopy,onDuplicate,onAlign,onDistribute,onFront,onBack,onGroup,onUngroup,onLock,onDelete}:{fa:boolean;selectedObjects:BioPlotObject[];grouped:boolean;onCopy:()=>void;onDuplicate:()=>void;onAlign:(mode:AlignMode)=>void;onDistribute:(axis:DistributionAxis)=>void;onFront:()=>void;onBack:()=>void;onGroup:()=>void;onUngroup:()=>void;onLock:()=>void;onDelete:()=>void}){
  const disabled=!selectedObjects.length;
  const editableCount=selectedObjects.filter(object=>!object.locked).length;
  const action=(icon:StudioIconName,label:string,callback:()=>void,unavailable=disabled,danger=false)=><button type="button" disabled={unavailable} onClick={callback} title={label} aria-label={label} className={danger?'danger':''}><StudioIcon name={icon}/></button>;
  return <div className="studio-selection-toolbar" role="toolbar" aria-label={fa?'فرمان‌های انتخاب':'Selection commands'}>
    <div className="toolbar-group">
      {action('copy',fa?'کپی':'Copy',onCopy)}{action('duplicate',fa?'تکثیر':'Duplicate',onDuplicate)}
    </div>
    <div className="toolbar-group">
      {action('front',fa?'آوردن به جلو':'Bring to front',onFront)}{action('back',fa?'فرستادن به عقب':'Send to back',onBack)}
    </div>
    <div className="toolbar-group align-group" hidden={selectedObjects.length<2}>
      {(['left','center','right','top','middle','bottom'] as AlignMode[]).map((mode,index)=><span key={mode}>{action(mode as StudioIconName,fa?['تراز چپ','تراز وسط افقی','تراز راست','تراز بالا','تراز وسط عمودی','تراز پایین'][index]:`Align ${mode}`,()=>onAlign(mode),editableCount<2)}</span>)}
      {action('horizontal',fa?'توزیع افقی':'Distribute horizontally',()=>onDistribute('horizontal'),editableCount<3)}
      {action('vertical',fa?'توزیع عمودی':'Distribute vertically',()=>onDistribute('vertical'),editableCount<3)}
    </div>
    <div className="toolbar-group">
      {selectedObjects.length>1&&<>
        {action('group',fa?'گروه‌بندی':'Group',onGroup,grouped||editableCount!==selectedObjects.length)}
        {action('ungroup',fa?'بازکردن گروه':'Ungroup',onUngroup,!selectedObjects.some(object=>object.groupId)||editableCount!==selectedObjects.length)}
      </>}
      {action('trash',fa?'حذف':'Delete',onDelete,editableCount===0,true)}
    </div>
  </div>;
}
