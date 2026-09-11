import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { assetToObject, getAssetCatalog, sanitizeSvg, saveCustomAsset, searchAssets } from './assets';
import { CollaborationSession, createAnonymousPresence, createCollaborationSession } from './collaboration';
import {
  AddObjectsCommand, AlignMode, BioPlotStore, buildSnapTargets, DeleteObjectsCommand, DistributionAxis,
  ObjectStateCommand, objectsInRect, PageObjectsCommand, rectFromPoints, reorderObjects, resizeObjects,
  rotateObjects, selectionBounds, snapDelta, alignObjects, distributeObjects, ZOrderAction
} from './engine';
import { makeArrow, makeConnector, makeContainer, makeImage, makePanelLabel, makeShape, makeTagLabel, makeText } from './editorObjects';
import { downloadPng, downloadSvg } from './export';
import { activePage, BioPlotDocument, BioPlotObject, cloneDocument, createBlankDocument, makeId, migrateDocument } from './model';
import { projects } from './persistence';
import { plotToSvg } from './plots';
import './editor-studio.css';

type Panel = 'assets' | 'elements' | 'upload';
type InspectorTab = 'properties' | 'layers';
type Guides = { x?: number; y?: number };
type Marquee = { x: number; y: number; width: number; height: number } | null;
type MenuPoint = { x: number; y: number } | null;

const cloneObjects = (objects: BioPlotObject[]) => structuredClone(objects);
const editableTarget = (target: EventTarget | null) => target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
const lineDash = (style?: 'solid' | 'dashed' | 'dotted') => style === 'dashed' ? '9 6' : style === 'dotted' ? '2 6' : undefined;

function connectorPath(object: Extract<BioPlotObject, { type: 'connector' }>) {
  const midY = object.height / 2;
  if (object.route === 'elbow') return `M4 ${midY} H${object.width / 2} V${Math.max(8, object.height - 8)} H${object.width - 9}`;
  if (object.route === 'curved') return `M4 ${midY} C${object.width * .3} 3 ${object.width * .7} ${object.height - 3} ${object.width - 9} ${midY}`;
  return `M4 ${midY} H${object.width - 9}`;
}

function duplicateObjects(source: BioPlotObject[], dx = 24, dy = 24) {
  const groupMap = new Map<string, string>();
  return source.map(object => {
    if (object.groupId && !groupMap.has(object.groupId)) groupMap.set(object.groupId, makeId('group'));
    return {
      ...structuredClone(object),
      id: makeId(),
      x: object.x + dx,
      y: object.y + dy,
      groupId: object.groupId ? groupMap.get(object.groupId) : undefined,
      parentId: undefined
    } as BioPlotObject;
  });
}

export function EditorStudio() {
  const storeRef = useRef(new BioPlotStore(createBlankDocument()));
  const [documentState, setDocumentState] = useState(storeRef.current.snapshot);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel>('assets');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('properties');
  const [zoom, setZoom] = useState(.82);
  const [guides, setGuides] = useState<Guides>({});
  const [marquee, setMarquee] = useState<Marquee>(null);
  const [contextMenu, setContextMenu] = useState<MenuPoint>(null);
  const [assetQuery, setAssetQuery] = useState('');
  const [saveState, setSaveState] = useState('Saved locally');
  const [shareState, setShareState] = useState('Share');
  const [libraryWidth, setLibraryWidth] = useState(286);
  const [inspectorWidth, setInspectorWidth] = useState(310);
  const [libraryCollapsed, setLibraryCollapsed] = useState(false);
  const [inspectorCollapsed, setInspectorCollapsed] = useState(false);
  const clipboardRef = useRef<BioPlotObject[]>([]);
  const artboardRef = useRef<HTMLDivElement>(null);
  const collaborationRef = useRef<CollaborationSession | null>(null);
  const suppressBroadcast = useRef(false);

  const page = activePage(documentState);
  const objects = page.objects;
  const selectedObjects = objects.filter(object => selected.has(object.id));
  const bounds = selectionBounds(selectedObjects);
  const locale = documentState.metadata.locale;
  const fa = locale === 'fa';
  const assets = useMemo(() => searchAssets(assetQuery, locale), [assetQuery, locale, documentState.updatedAt]);
  const grouped = selectedObjects.length > 1 && selectedObjects.every(object => object.groupId) && new Set(selectedObjects.map(object => object.groupId)).size === 1;

  useEffect(() => storeRef.current.subscribe(setDocumentState), []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    const boot = async () => {
      if (id) {
        const found = await projects.load(id);
        if (found) { storeRef.current.replace(migrateDocument(found)); return; }
      }
      const fresh = createBlankDocument();
      fresh.metadata.locale = localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en';
      storeRef.current.replace(fresh);
      await projects.save(fresh);
      history.replaceState(null, '', `editor.html?id=${encodeURIComponent(fresh.id)}`);
    };
    void boot();
  }, []);

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [fa, locale]);

  useEffect(() => {
    const session = createCollaborationSession();
    collaborationRef.current = session;
    let unsubscribe = () => {};
    void session.connect(documentState.id, createAnonymousPresence()).then(() => {
      unsubscribe = session.subscribe(event => {
        if (event.type !== 'document') return;
        suppressBroadcast.current = true;
        storeRef.current.replace(migrateDocument(event.document));
        setSaveState(fa ? 'همگام شد' : 'Synced');
      });
    }).catch(() => {});
    return () => { unsubscribe(); session.disconnect(); collaborationRef.current = null; };
  }, [documentState.id]);

  useEffect(() => {
    setSelected(current => new Set([...current].filter(id => objects.some(object => object.id === id && !object.hidden))));
  }, [objects]);

  useEffect(() => {
    setSaveState(fa ? 'در حال ذخیره…' : 'Saving…');
    const timer = window.setTimeout(async () => {
      await projects.save(documentState);
      setSaveState(fa ? 'ذخیره شد' : 'Saved');
      if (suppressBroadcast.current) suppressBroadcast.current = false;
      else collaborationRef.current?.publishDocument(documentState);
    }, 420);
    return () => window.clearTimeout(timer);
  }, [documentState, fa]);

  useEffect(() => {
    const closeMenus = () => setContextMenu(null);
    window.addEventListener('pointerdown', closeMenus);
    return () => window.removeEventListener('pointerdown', closeMenus);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (editableTarget(event.target)) return;
      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === 'z') { event.preventDefault(); event.shiftKey ? storeRef.current.redo() : storeRef.current.undo(); return; }
      if (mod && key === 'y') { event.preventDefault(); storeRef.current.redo(); return; }
      if (mod && key === 'c') { event.preventDefault(); copySelection(); return; }
      if (mod && key === 'v') { event.preventDefault(); pasteClipboard(); return; }
      if (mod && key === 'd') { event.preventDefault(); duplicateSelection(); return; }
      if (mod && key === 'g') { event.preventDefault(); event.shiftKey ? ungroupSelection() : groupSelection(); return; }
      if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelection(); return; }
      if (event.key === 'Escape') { setSelected(new Set()); setContextMenu(null); return; }
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)) {
        event.preventDefault();
        const step = event.shiftKey ? 10 : 1;
        const dx = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
        const dy = event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
        nudgeSelection(dx, dy);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function idsForObject(object: BioPlotObject, additive = false) {
    const groupIds = object.groupId ? objects.filter(item => item.groupId === object.groupId).map(item => item.id) : [object.id];
    if (!additive) return new Set(groupIds);
    const next = new Set(selected);
    groupIds.forEach(id => next.has(id) ? next.delete(id) : next.add(id));
    return next;
  }

  function addObject(object: BioPlotObject) {
    storeRef.current.dispatch(new AddObjectsCommand('Add object', [object]));
    setSelected(new Set([object.id]));
    setInspectorTab('properties');
  }

  function commitSelected(label: string, transform: (object: BioPlotObject) => BioPlotObject) {
    const before = cloneObjects(selectedObjects);
    if (!before.length) return;
    storeRef.current.dispatch(new ObjectStateCommand(label, before, before.map(transform)));
  }

  function beginMove(event: ReactPointerEvent, object: BioPlotObject) {
    if (object.locked) { setSelected(idsForObject(object, event.shiftKey)); return; }
    event.preventDefault(); event.stopPropagation();
    const ids = idsForObject(object, event.shiftKey);
    setSelected(ids);
    if (event.shiftKey) return;
    const before = cloneObjects(objects.filter(item => ids.has(item.id) && !item.locked));
    const startBounds = selectionBounds(before);
    if (!before.length || !startBounds) return;
    const targets = buildSnapTargets(storeRef.current.snapshot, ids);
    const startX = event.clientX; const startY = event.clientY;
    const move = (pointer: PointerEvent) => {
      const snapped = snapDelta(startBounds, (pointer.clientX - startX) / zoom, (pointer.clientY - startY) / zoom, targets);
      storeRef.current.preview(before.map(item => ({ ...item, x: item.x + snapped.dx, y: item.y + snapped.dy })));
      setGuides({ x: snapped.guideX, y: snapped.guideY });
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      const after = cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item => ids.has(item.id) && !item.locked));
      storeRef.current.commitObjectState(before, after, 'Move objects'); setGuides({});
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  }

  function beginResize(event: ReactPointerEvent, handle: string) {
    event.preventDefault(); event.stopPropagation();
    if (!bounds || !selectedObjects.length || selectedObjects.some(object => object.locked)) return;
    const before = cloneObjects(selectedObjects); const startBounds = { ...bounds }; const startX = event.clientX; const startY = event.clientY;
    const move = (pointer: PointerEvent) => {
      const dx = (pointer.clientX - startX) / zoom; const dy = (pointer.clientY - startY) / zoom;
      let { x, y, width, height } = startBounds;
      if (handle.includes('e')) width = Math.max(12, startBounds.width + dx);
      if (handle.includes('s')) height = Math.max(12, startBounds.height + dy);
      if (handle.includes('w')) { x = Math.min(startBounds.right - 12, startBounds.x + dx); width = startBounds.right - x; }
      if (handle.includes('n')) { y = Math.min(startBounds.bottom - 12, startBounds.y + dy); height = startBounds.bottom - y; }
      storeRef.current.preview(resizeObjects(before, { x, y, width, height }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      const after = cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item => selected.has(item.id)));
      storeRef.current.commitObjectState(before, after, 'Resize objects');
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  }

  function beginRotate(event: ReactPointerEvent) {
    event.preventDefault(); event.stopPropagation();
    if (!bounds || !selectedObjects.length || selectedObjects.some(object => object.locked) || !artboardRef.current) return;
    const before = cloneObjects(selectedObjects); const rect = artboardRef.current.getBoundingClientRect();
    const cx = rect.left + bounds.cx * zoom; const cy = rect.top + bounds.cy * zoom;
    const start = Math.atan2(event.clientY - cy, event.clientX - cx) * 180 / Math.PI;
    const move = (pointer: PointerEvent) => {
      const angle = Math.atan2(pointer.clientY - cy, pointer.clientX - cx) * 180 / Math.PI;
      storeRef.current.preview(rotateObjects(before, angle - start, { x: bounds.cx, y: bounds.cy }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
      const after = cloneObjects(activePage(storeRef.current.snapshot).objects.filter(item => selected.has(item.id)));
      storeRef.current.commitObjectState(before, after, 'Rotate objects');
    };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  }

  function beginMarquee(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !artboardRef.current) return;
    setContextMenu(null);
    const artRect = artboardRef.current.getBoundingClientRect();
    const startX = (event.clientX - artRect.left) / zoom; const startY = (event.clientY - artRect.top) / zoom;
    const original = event.shiftKey ? new Set(selected) : new Set<string>();
    if (!event.shiftKey) setSelected(new Set());
    const move = (pointer: PointerEvent) => {
      const x = (pointer.clientX - artRect.left) / zoom; const y = (pointer.clientY - artRect.top) / zoom;
      const rect = rectFromPoints(startX, startY, x, y); setMarquee(rect);
      const hits = objectsInRect(objects, rect).filter(object => !object.locked).map(object => object.id);
      setSelected(new Set([...original, ...hits]));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); setMarquee(null); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  }

  function copySelection() { clipboardRef.current = cloneObjects(selectedObjects); }
  function pasteClipboard() {
    if (!clipboardRef.current.length) return;
    const pasted = duplicateObjects(clipboardRef.current, 28, 28); clipboardRef.current = cloneObjects(pasted);
    storeRef.current.dispatch(new AddObjectsCommand('Paste objects', pasted)); setSelected(new Set(pasted.map(object => object.id)));
  }
  function duplicateSelection() {
    if (!selectedObjects.length) return; const copies = duplicateObjects(selectedObjects);
    storeRef.current.dispatch(new AddObjectsCommand('Duplicate objects', copies)); setSelected(new Set(copies.map(object => object.id)));
  }
  function deleteSelection() {
    const doomed = cloneObjects(selectedObjects.filter(object => !object.locked)); if (!doomed.length) return;
    storeRef.current.dispatch(new DeleteObjectsCommand('Delete objects', doomed)); setSelected(new Set());
  }
  function nudgeSelection(dx: number, dy: number) { commitSelected('Nudge objects', object => object.locked ? object : { ...object, x: object.x + dx, y: object.y + dy }); }
  function groupSelection() {
    if (selectedObjects.length < 2) return; const before = cloneObjects(selectedObjects); const groupId = makeId('group');
    storeRef.current.dispatch(new ObjectStateCommand('Group objects', before, before.map(object => ({ ...object, groupId }))));
  }
  function ungroupSelection() {
    if (!selectedObjects.some(object => object.groupId)) return; const before = cloneObjects(selectedObjects);
    storeRef.current.dispatch(new ObjectStateCommand('Ungroup objects', before, before.map(object => ({ ...object, groupId: undefined }))));
  }
  function setLocked(locked: boolean) { commitSelected(locked ? 'Lock objects' : 'Unlock objects', object => ({ ...object, locked })); }
  function setHiddenForIds(ids: Set<string>, hidden: boolean) {
    const before = cloneObjects(objects.filter(object => ids.has(object.id))); if (!before.length) return;
    storeRef.current.dispatch(new ObjectStateCommand(hidden ? 'Hide objects' : 'Show objects', before, before.map(object => ({ ...object, hidden }))));
    if (hidden) setSelected(current => new Set([...current].filter(id => !ids.has(id))));
  }
  function align(mode: AlignMode) {
    const before = cloneObjects(selectedObjects.filter(object => !object.locked)); if (before.length < 2) return;
    storeRef.current.dispatch(new ObjectStateCommand(`Align ${mode}`, before, alignObjects(before, mode)));
  }
  function distribute(axis: DistributionAxis) {
    const before = cloneObjects(selectedObjects.filter(object => !object.locked)); if (before.length < 3) return;
    storeRef.current.dispatch(new ObjectStateCommand(`Distribute ${axis}`, before, distributeObjects(before, axis)));
  }
  function zOrder(action: ZOrderAction) {
    if (!selected.size) return; const before = cloneObjects(objects); const after = reorderObjects(before, selected, action);
    storeRef.current.dispatch(new PageObjectsCommand(`Layer ${action}`, before, after));
  }
  function layerStep(id: string, action: 'forward' | 'backward') { zOrderForIds(new Set([id]), action); }
  function zOrderForIds(ids: Set<string>, action: ZOrderAction) {
    const before = cloneObjects(objects); storeRef.current.dispatch(new PageObjectsCommand(`Layer ${action}`, before, reorderObjects(before, ids, action)));
  }

  function changeBounds(field: 'x' | 'y' | 'width' | 'height', value: number) {
    if (!bounds || !Number.isFinite(value)) return; const before = cloneObjects(selectedObjects.filter(object => !object.locked)); if (!before.length) return;
    if (field === 'x' || field === 'y') {
      const delta = value - bounds[field]; storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`, before, before.map(object => ({ ...object, [field]: object[field] + delta })));
    } else {
      const next = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, [field]: Math.max(8, value) };
      storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`, before, resizeObjects(before, next)));
    }
  }

  function setDocumentTitle(title: string) { const next = cloneDocument(documentState); next.title = title; next.updatedAt = new Date().toISOString(); storeRef.current.replace(next); }
  function toggleLocale() { const next = cloneDocument(documentState); next.metadata.locale = fa ? 'en' : 'fa'; storeRef.current.replace(next); }
  async function share() { await navigator.clipboard?.writeText(window.location.href); setShareState(fa ? 'کپی شد' : 'Copied'); setTimeout(() => setShareState(fa ? 'اشتراک' : 'Share'), 1500); }

  async function importSvg(file?: File) {
    if (!file) return;
    try {
      const safe = sanitizeSvg(await file.text());
      const asset = saveCustomAsset({ name: file.name.replace(/\.svg$/i, ''), category: 'Custom', synonyms: { en: [file.name], fa: [] }, svg: safe, colorSlots: [], reviewStatus: 'draft', premium: false });
      addObject(assetToObject(asset)); setPanel('assets');
    } catch (error) { alert(error instanceof Error ? error.message : 'Could not import SVG.'); }
  }

  function importImage(file?: File) {
    if (!file) return; const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' && addObject(makeImage(reader.result, file.name)); reader.readAsDataURL(file);
  }

  function startPanelResize(side: 'library' | 'inspector', event: ReactPointerEvent) {
    event.preventDefault(); const startX = event.clientX; const initial = side === 'library' ? libraryWidth : inspectorWidth;
    const direction = (document.documentElement.dir === 'rtl' ? -1 : 1) * (side === 'library' ? 1 : -1);
    const move = (pointer: PointerEvent) => {
      const value = initial + (pointer.clientX - startX) * direction;
      side === 'library' ? setLibraryWidth(Math.max(220, Math.min(390, value))) : setInspectorWidth(Math.max(260, Math.min(390, value)));
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up, { once: true });
  }

  function contextForObject(event: ReactPointerEvent, object: BioPlotObject) {
    event.preventDefault(); event.stopPropagation(); if (!selected.has(object.id)) setSelected(idsForObject(object)); setContextMenu({ x: event.clientX, y: event.clientY });
  }

  function markerFor(head: string, objectId: string, stroke: string) {
    return <defs><marker id={`arr-${objectId}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={stroke}/></marker><marker id={`arr-start-${objectId}`} markerWidth="8" markerHeight="8" refX="1" refY="4" orient="auto-start-reverse"><path d="M8 0L0 4L8 8Z" fill={stroke}/></marker><marker id={`inhibit-${objectId}`} markerWidth="8" markerHeight="12" refX="7" refY="6" orient="auto"><path d="M7 1V11" stroke={stroke} strokeWidth="2"/></marker></defs>;
  }

  function renderObject(object: BioPlotObject) {
    if (object.hidden) return null;
    const style = { left: object.x, top: object.y, width: object.width, height: object.height, opacity: object.opacity, transform: `rotate(${object.rotation}deg)` };
    const common = {
      key: object.id, style, onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => beginMove(event, object), onContextMenu: (event: ReactPointerEvent<HTMLDivElement>) => contextForObject(event, object),
      className: `studio-object ${selected.has(object.id) ? 'is-selected' : ''} ${object.locked ? 'is-locked' : ''}`
    };
    if (object.type === 'text') return <div {...common} className={`${common.className} studio-text`} style={{ ...style, color: object.color, fontSize: object.fontSize, fontWeight: object.fontWeight, fontStyle: object.fontStyle ?? 'normal', textAlign: object.align, justifyContent: object.align === 'left' ? 'flex-start' : object.align === 'right' ? 'flex-end' : 'center' }}>{object.text}</div>;
    if (object.type === 'label') return <div {...common} className={`${common.className} studio-label label-${object.variant}`} style={{ ...style, color: object.color, background: object.background, borderColor: object.borderColor, fontSize: object.fontSize, fontWeight: object.fontWeight, textAlign: object.align }}>{object.text}</div>;
    if (object.type === 'shape') return <div {...common} style={{ ...style, background: object.fill, border: `${object.strokeWidth}px ${object.lineStyle === 'dashed' ? 'dashed' : object.lineStyle === 'dotted' ? 'dotted' : 'solid'} ${object.stroke}`, borderRadius: object.shape === 'ellipse' ? '50%' : object.radius }} />;
    if (object.type === 'container') return <div {...common} className={`${common.className} studio-container`} style={{ ...style, background: object.fill, border: `${object.strokeWidth}px solid ${object.stroke}`, borderRadius: object.radius }} />;
    if (object.type === 'arrow') return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`}>{markerFor(object.arrowHead, object.id, object.stroke)}<line x1="4" y1={object.height / 2} x2={object.width - 9} y2={object.height / 2} stroke={object.stroke} strokeWidth={object.strokeWidth} strokeDasharray={lineDash(object.lineStyle)} markerStart={object.arrowHead === 'both' ? `url(#arr-start-${object.id})` : undefined} markerEnd={object.arrowHead === 'none' ? undefined : `url(#arr-${object.id})`}/></svg></div>;
    if (object.type === 'connector') return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`}>{markerFor(object.arrowHead, object.id, object.stroke)}<path d={connectorPath(object)} fill="none" stroke={object.stroke} strokeWidth={object.strokeWidth} strokeDasharray={lineDash(object.lineStyle)} markerStart={object.arrowHead === 'both' ? `url(#arr-start-${object.id})` : undefined} markerEnd={object.arrowHead === 'none' ? undefined : object.arrowHead === 'inhibition' ? `url(#inhibit-${object.id})` : `url(#arr-${object.id})`}/>{object.label && <text x={object.width / 2} y={Math.max(12, object.height / 2 - 8)} textAnchor="middle" fontSize="11" fill="#526e7a">{object.label}</text>}</svg></div>;
    if (object.type === 'asset') return <div {...common} className={`${common.className} studio-asset`} dangerouslySetInnerHTML={{ __html: object.svg }} />;
    if (object.type === 'image') return <div {...common} className={`${common.className} studio-image`}><img src={object.src} alt={object.alt ?? object.name} style={{ objectFit: object.fit }}/></div>;
    return <div {...common} className={`${common.className} studio-plot`}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`} dangerouslySetInnerHTML={{ __html: plotToSvg(object.spec, object.width, object.height) }} /></div>;
  }

  const gridColumns = `58px ${libraryCollapsed ? 0 : libraryWidth}px 5px minmax(440px,1fr) 5px ${inspectorCollapsed ? 0 : inspectorWidth}px`;

  return <div className="studio-shell">
    <header className="studio-topbar">
      <a className="studio-brand" href="index.html"><span>B</span><strong>BioPlot</strong><em>Figure Studio</em></a>
      <div className="studio-document"><a href="index.html" className="studio-icon-btn" title={fa ? 'خانه' : 'Home'}>←</a><div><input value={documentState.title} onChange={event => setDocumentTitle(event.target.value)}/><small><i/>{saveState}</small></div></div>
      <div className="studio-history"><button disabled={!storeRef.current.history.canUndo} onClick={() => storeRef.current.undo()} title="Undo">↶</button><button disabled={!storeRef.current.history.canRedo} onClick={() => storeRef.current.redo()} title="Redo">↷</button></div>
      <div className="studio-top-actions"><button onClick={toggleLocale}>{fa ? 'EN' : 'FA'}</button><button onClick={share}>{shareState}</button><button onClick={() => downloadSvg(documentState)}>SVG</button><button className="studio-export" onClick={() => downloadPng(documentState, 300, 160)}>PNG 300 DPI</button></div>
    </header>

    <main className="studio-workspace" style={{ gridTemplateColumns: gridColumns }}>
      <nav className="studio-rail">
        {([['assets','◎',fa?'المان':'Assets'],['elements','✦',fa?'اجزا':'Elements'],['upload','⇧',fa?'آپلود':'Upload']] as Array<[Panel,string,string]>).map(([key, icon, label]) => <button key={key} className={panel === key ? 'active' : ''} onClick={() => { setPanel(key); setLibraryCollapsed(false); }}><span>{icon}</span><small>{label}</small></button>)}
        <div className="rail-spacer"/><button onClick={() => setLibraryCollapsed(value => !value)} title={fa ? 'نمایش/بستن پنل' : 'Toggle library'}><span>{libraryCollapsed ? '»' : '«'}</span><small>{fa ? 'پنل' : 'Panel'}</small></button>
      </nav>

      <aside className={`studio-library ${libraryCollapsed ? 'collapsed' : ''}`}>
        <div className="studio-panel-heading"><div><small>FIGURE STUDIO</small><h2>{panel === 'assets' ? (fa ? 'کتابخانه علمی' : 'Scientific assets') : panel === 'elements' ? (fa ? 'اجزای شکل' : 'Figure elements') : (fa ? 'آپلود' : 'Upload')}</h2></div><button onClick={() => setLibraryCollapsed(true)}>×</button></div>
        {panel === 'assets' && <><div className="studio-search">⌕<input value={assetQuery} onChange={event => setAssetQuery(event.target.value)} placeholder={fa ? 'نورون، سلول، DNA…' : 'Neuron, cell, DNA…'}/></div><div className="studio-assets">{assets.map(asset => <button key={asset.id} onClick={() => addObject(assetToObject(asset))}><span dangerouslySetInnerHTML={{ __html: asset.svg }}/><b>{asset.name}</b><small>{asset.category}</small></button>)}</div></>}
        {panel === 'elements' && <div className="studio-elements">
          <section><h3>{fa ? 'متن و برچسب' : 'Text & labels'}</h3><div><button onClick={() => addObject(makeText())}><span>T</span><b>{fa?'متن علمی':'Scientific text'}</b></button><button onClick={() => addObject(makePanelLabel())}><span>A</span><b>{fa?'برچسب پنل':'Panel label'}</b></button><button onClick={() => addObject(makeTagLabel())}><span>Tag</span><b>{fa?'برچسب':'Tag label'}</b></button></div></section>
          <section><h3>{fa ? 'شکل‌ها' : 'Shapes'}</h3><div><button onClick={() => addObject(makeShape('rect'))}><span>□</span><b>{fa?'مستطیل':'Rectangle'}</b></button><button onClick={() => addObject(makeShape('ellipse'))}><span>○</span><b>{fa?'بیضی':'Ellipse'}</b></button><button onClick={() => addObject(makeContainer())}><span>▣</span><b>{fa?'کانتینر':'Container'}</b></button></div></section>
          <section><h3>{fa ? 'فلش و اتصال' : 'Arrows & connectors'}</h3><div><button onClick={() => addObject(makeArrow())}><span>→</span><b>{fa?'فلش':'Arrow'}</b></button><button onClick={() => addObject(makeConnector('straight'))}><span>↦</span><b>{fa?'اتصال مستقیم':'Straight'}</b></button><button onClick={() => addObject(makeConnector('elbow'))}><span>⌟</span><b>{fa?'اتصال زاویه‌دار':'Elbow'}</b></button><button onClick={() => addObject(makeConnector('curved'))}><span>⌒</span><b>{fa?'اتصال منحنی':'Curved'}</b></button></div></section>
        </div>}
        {panel === 'upload' && <div className="studio-upload"><label><span>⇧</span><b>{fa?'SVG علمی':'Scientific SVG'}</b><small>{fa?'فایل برداری با پاک‌سازی امنیتی':'Sanitized vector import'}</small><input hidden type="file" accept=".svg,image/svg+xml" onChange={event => void importSvg(event.target.files?.[0])}/></label><label><span>▧</span><b>{fa?'تصویر':'Raster image'}</b><small>PNG / JPG / WebP</small><input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={event => importImage(event.target.files?.[0])}/></label><p>{fa?`${getAssetCatalog().length} المان علمی در کاتالوگ فعلی`:`${getAssetCatalog().length} scientific assets in the current catalog`}</p></div>}
      </aside>
      <div className={`studio-splitter ${libraryCollapsed ? 'disabled' : ''}`} onPointerDown={event => !libraryCollapsed && startPanelResize('library', event)}/>

      <section className="studio-canvas-zone">
        <div className="studio-selection-toolbar">
          {selectedObjects.length === 0 ? <span>{fa?'برای ویرایش، یک یا چند آبجکت را انتخاب کن':'Select one or more objects to edit'}</span> : <>
            <div className="toolbar-group"><button onClick={copySelection}>Copy</button><button onClick={duplicateSelection}>Duplicate</button></div>
            {selectedObjects.length > 1 && <div className="toolbar-group align-group"><button onClick={() => align('left')} title="Align left">⇤</button><button onClick={() => align('center')} title="Align center">↔</button><button onClick={() => align('right')} title="Align right">⇥</button><button onClick={() => align('top')} title="Align top">↥</button><button onClick={() => align('middle')} title="Align middle">↕</button><button onClick={() => align('bottom')} title="Align bottom">↧</button>{selectedObjects.length > 2 && <><button onClick={() => distribute('horizontal')} title="Distribute horizontal">⋯↔</button><button onClick={() => distribute('vertical')} title="Distribute vertical">⋮↕</button></>}</div>}
            <div className="toolbar-group"><button onClick={() => zOrder('front')}>Front</button><button onClick={() => zOrder('back')}>Back</button></div>
            {selectedObjects.length > 1 && !grouped && <button onClick={groupSelection}>Group</button>}{grouped && <button onClick={ungroupSelection}>Ungroup</button>}
            <button onClick={() => setLocked(!selectedObjects.every(object => object.locked))}>{selectedObjects.every(object => object.locked) ? 'Unlock' : 'Lock'}</button>
            <button className="danger" onClick={deleteSelection}>Delete</button>
          </>}
        </div>
        <div className="studio-canvas-scroll">
          <div className="studio-artboard-scale" style={{ transform: `scale(${zoom})` }}>
            <div ref={artboardRef} className="studio-artboard" style={{ width: page.width, height: page.height, background: page.background }} onPointerDown={beginMarquee} onContextMenu={event => { if (event.target === event.currentTarget) { event.preventDefault(); setContextMenu({ x: event.clientX, y: event.clientY }); } }}>
              {objects.map(renderObject)}
              {guides.x !== undefined && <div className="studio-guide vertical" style={{ left: guides.x }}/>} {guides.y !== undefined && <div className="studio-guide horizontal" style={{ top: guides.y }}/>} 
              {marquee && <div className="studio-marquee" style={marquee}/>} 
              {bounds && <div className="studio-selection" style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }}><span className="studio-rotate-line"/><button className="studio-rotate" onPointerDown={beginRotate}/>{['nw','n','ne','e','se','s','sw','w'].map(handle => <button key={handle} className={`studio-handle ${handle}`} onPointerDown={event => beginResize(event, handle)}/>)}</div>}
            </div>
          </div>
        </div>
        <div className="studio-statusbar"><span>{page.name} · {page.width} × {page.height}px</span><div><button onClick={() => setZoom(value => Math.max(.35, value - .1))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={() => setZoom(value => Math.min(1.8, value + .1))}>+</button><button onClick={() => setZoom(.82)}>Fit</button></div><span>{objects.length} {fa?'آبجکت':'objects'}</span></div>
      </section>

      <div className={`studio-splitter ${inspectorCollapsed ? 'disabled' : ''}`} onPointerDown={event => !inspectorCollapsed && startPanelResize('inspector', event)}/>
      <aside className={`studio-inspector ${inspectorCollapsed ? 'collapsed' : ''}`}>
        <div className="inspector-tabs"><button className={inspectorTab==='properties'?'active':''} onClick={() => setInspectorTab('properties')}>{fa?'ویژگی‌ها':'Properties'}</button><button className={inspectorTab==='layers'?'active':''} onClick={() => setInspectorTab('layers')}>{fa?'لایه‌ها':'Layers'}</button><button className="collapse-inspector" onClick={() => setInspectorCollapsed(true)}>×</button></div>
        {inspectorTab === 'properties' ? <PropertiesPanel fa={fa} bounds={bounds} selectedObjects={selectedObjects} changeBounds={changeBounds} commitSelected={commitSelected} setLocked={setLocked} setHidden={() => setHiddenForIds(selected, true)}/> : <div className="studio-layers">{objects.slice().reverse().map(object => <div key={object.id} className={`${selected.has(object.id)?'active':''} ${object.hidden?'hidden-layer':''}`}><button className="layer-main" onClick={() => { setSelected(idsForObject(object)); setInspectorTab('properties'); }}><i>{object.type.slice(0,1).toUpperCase()}</i><span><b>{object.name}</b><small>{object.type}{object.groupId?' · group':''}</small></span></button><div className="layer-actions"><button title="Show/hide" onClick={() => setHiddenForIds(new Set([object.id]), !object.hidden)}>{object.hidden?'○':'●'}</button><button title="Lock/unlock" onClick={() => { const before=[structuredClone(object)]; storeRef.current.dispatch(new ObjectStateCommand(object.locked?'Unlock':'Lock', before, [{...object,locked:!object.locked}])); }}>{object.locked?'⌑':'◇'}</button><button title="Move up" onClick={() => layerStep(object.id,'forward')}>↑</button><button title="Move down" onClick={() => layerStep(object.id,'backward')}>↓</button></div></div>)}</div>}
      </aside>
      {inspectorCollapsed && <button className="studio-open-inspector" onClick={() => setInspectorCollapsed(false)}>{fa?'ویژگی‌ها':'Inspector'} ‹</button>}
    </main>

    {contextMenu && <div className="studio-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }} onPointerDown={event => event.stopPropagation()}><button onClick={() => { copySelection(); setContextMenu(null); }}>Copy <kbd>⌘C</kbd></button><button onClick={() => { pasteClipboard(); setContextMenu(null); }}>Paste <kbd>⌘V</kbd></button><button onClick={() => { duplicateSelection(); setContextMenu(null); }}>Duplicate <kbd>⌘D</kbd></button><hr/>{selectedObjects.length > 1 && <button onClick={() => { grouped ? ungroupSelection() : groupSelection(); setContextMenu(null); }}>{grouped?'Ungroup':'Group'}</button>}<button onClick={() => { zOrder('front'); setContextMenu(null); }}>Bring to front</button><button onClick={() => { zOrder('back'); setContextMenu(null); }}>Send to back</button><button onClick={() => { setLocked(!selectedObjects.every(object => object.locked)); setContextMenu(null); }}>{selectedObjects.every(object => object.locked)?'Unlock':'Lock'}</button><hr/><button className="danger" onClick={() => { deleteSelection(); setContextMenu(null); }}>Delete</button></div>}
  </div>;
}

function PropertiesPanel({ fa, bounds, selectedObjects, changeBounds, commitSelected, setLocked, setHidden }: {
  fa: boolean;
  bounds: ReturnType<typeof selectionBounds>;
  selectedObjects: BioPlotObject[];
  changeBounds: (field: 'x'|'y'|'width'|'height', value: number) => void;
  commitSelected: (label: string, transform: (object: BioPlotObject) => BioPlotObject) => void;
  setLocked: (locked: boolean) => void;
  setHidden: () => void;
}) {
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null;
  const averageOpacity = selectedObjects.length ? selectedObjects.reduce((sum, object) => sum + object.opacity, 0) / selectedObjects.length : 1;
  const colorTarget = single?.type === 'text' || single?.type === 'label' ? single.color : single?.type === 'shape' || single?.type === 'container' ? single.fill : single?.type === 'arrow' || single?.type === 'connector' ? single.stroke : '#0b7a75';
  return <div className="studio-properties">
    <div className="property-selection"><small>SELECTION</small><h2>{selectedObjects.length===0?(fa?'بدون انتخاب':'No selection'):single?single.name:`${selectedObjects.length} ${fa?'آبجکت':'objects'}`}</h2>{single && <span>{single.type}</span>}</div>
    <section><h3>{fa?'موقعیت و اندازه':'Position & size'}</h3><div className="property-grid">{(['x','y','width','height'] as const).map(field => <label key={field}><span>{field==='width'?'W':field==='height'?'H':field.toUpperCase()}</span><input disabled={!bounds} type="number" value={bounds?Math.round(bounds[field]):''} onChange={event=>changeBounds(field,Number(event.target.value))}/></label>)}</div></section>
    <section><h3>{fa?'وضعیت':'Object state'}</h3><div className="property-actions"><button disabled={!selectedObjects.length} onClick={()=>setLocked(!selectedObjects.every(object=>object.locked))}>{selectedObjects.every(object=>object.locked)?'Unlock':'Lock'}</button><button disabled={!selectedObjects.length} onClick={setHidden}>{fa?'مخفی':'Hide'}</button></div></section>
    <section><h3>{fa?'ظاهر':'Appearance'}</h3><label className="property-range"><span>{fa?'شفافیت':'Opacity'}</span><input disabled={!selectedObjects.length} type="range" min="5" max="100" value={Math.round(averageOpacity*100)} onChange={event=>commitSelected('Opacity',object=>({...object,opacity:Number(event.target.value)/100}))}/><em>{Math.round(averageOpacity*100)}%</em></label>{single && !['asset','image','plot'].includes(single.type) && <label className="property-color"><span>{fa?'رنگ اصلی':'Primary color'}</span><input type="color" value={colorTarget} onChange={event=>{const color=event.target.value;commitSelected('Color',object=>object.type==='text'?{...object,color}:object.type==='label'?{...object,color}:object.type==='shape'?{...object,fill:color}:object.type==='container'?{...object,fill:color}:object.type==='arrow'?{...object,stroke:color}:object.type==='connector'?{...object,stroke:color}:object)}}/></label>}</section>
    {single && (single.type==='text'||single.type==='label') && <section><h3>{fa?'متن':'Text'}</h3><label className="property-stack"><span>{fa?'محتوا':'Content'}</span><textarea value={single.text} onChange={event=>{const text=event.target.value;commitSelected('Edit text',object=>object.id===single.id&&(object.type==='text'||object.type==='label')?{...object,text,name:text.slice(0,32)||'Text'}:object)}}/></label><div className="property-grid"><label><span>Size</span><input type="number" value={single.fontSize} onChange={event=>{const value=Number(event.target.value);commitSelected('Font size',object=>object.id===single.id&&(object.type==='text'||object.type==='label')?{...object,fontSize:value}:object)}}/></label><label><span>Weight</span><select value={single.fontWeight} onChange={event=>{const value=Number(event.target.value);commitSelected('Font weight',object=>object.id===single.id&&(object.type==='text'||object.type==='label')?{...object,fontWeight:value}:object)}}><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option></select></label></div></section>}
    {single && (single.type==='arrow'||single.type==='connector') && <section><h3>{fa?'خط و فلش':'Line & arrow'}</h3><label className="property-stack"><span>{fa?'نوع خط':'Line style'}</span><select value={single.lineStyle??'solid'} onChange={event=>{const value=event.target.value as 'solid'|'dashed'|'dotted';commitSelected('Line style',object=>object.id===single.id&&(object.type==='arrow'||object.type==='connector')?{...object,lineStyle:value}:object)}}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label><label className="property-stack"><span>{fa?'سر فلش':'Arrow head'}</span><select value={single.arrowHead} onChange={event=>{const value=event.target.value as typeof single.arrowHead;commitSelected('Arrow head',object=>object.id===single.id&&(object.type==='arrow'||object.type==='connector')?{...object,arrowHead:value as never}:object)}}><option value="end">End</option><option value="both">Both</option><option value="none">None</option>{single.type==='connector'&&<option value="inhibition">Inhibition</option>}</select></label></section>}
    {single && single.type==='image' && <section><h3>{fa?'تصویر':'Image'}</h3><div className="property-actions"><button className={single.fit==='contain'?'active':''} onClick={()=>commitSelected('Image fit',object=>object.id===single.id&&object.type==='image'?{...object,fit:'contain'}:object)}>Contain</button><button className={single.fit==='cover'?'active':''} onClick={()=>commitSelected('Image fit',object=>object.id===single.id&&object.type==='image'?{...object,fit:'cover'}:object)}>Cover</button></div></section>}
  </div>;
}
