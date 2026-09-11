import { PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createAIProvider } from './ai';
import { assetToObject, getAssetCatalog, sanitizeSvg, saveCustomAsset, searchAssets } from './assets';
import { BroadcastChannelCollaboration, createAnonymousPresence } from './collaboration';
import { AddObjectsCommand, BioPlotStore, buildSnapTargets, DeleteObjectsCommand, ObjectStateCommand, resizeObjects, rotateObjects, selectionBounds, snapDelta } from './engine';
import { downloadPng, downloadSvg } from './export';
import { activePage, ArrowObject, BioPlotDocument, BioPlotObject, cloneDocument, createBlankDocument, makeId, ShapeObject, TextObject } from './model';
import { localProjects } from './persistence';
import { createPlotObject, csvToPlotSpec, plotToSvg } from './plots';

type Panel = 'assets' | 'design' | 'plots' | 'ai' | 'upload';

type Guides = { x?: number; y?: number };

const copyObjects = (objects: BioPlotObject[]) => structuredClone(objects);

function makeText(): TextObject {
  return { id: makeId(), type: 'text', name: 'Scientific text', text: 'Scientific annotation', x: 360, y: 270, width: 220, height: 42, rotation: 0, opacity: 1, color: '#17303f', fontSize: 16, fontWeight: 700, align: 'center' };
}

function makeShape(): ShapeObject {
  return { id: makeId(), type: 'shape', name: 'Shape', shape: 'rect', x: 390, y: 280, width: 150, height: 90, rotation: 0, opacity: 1, fill: '#dff2ef', stroke: '#4c9993', strokeWidth: 2, radius: 12 };
}

function makeArrow(): ArrowObject {
  return { id: makeId(), type: 'arrow', name: 'Arrow', x: 390, y: 300, width: 120, height: 32, rotation: 0, opacity: 1, stroke: '#607986', strokeWidth: 3, arrowHead: 'end' };
}

export function EditorApp() {
  const storeRef = useRef(new BioPlotStore(createBlankDocument()));
  const [documentState, setDocumentState] = useState(storeRef.current.snapshot);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [panel, setPanel] = useState<Panel>('assets');
  const [zoom, setZoom] = useState(0.82);
  const [guides, setGuides] = useState<Guides>({});
  const [assetQuery, setAssetQuery] = useState('');
  const [csv, setCsv] = useState('Group,Value\nControl,35\nTreatment,68\nRecovery,51');
  const [aiPrompt, setAiPrompt] = useState('Oxaliplatin activates neuronal stress and mitochondrial dysfunction');
  const [aiNote, setAiNote] = useState('');
  const [saveState, setSaveState] = useState('Saved locally');
  const [shareState, setShareState] = useState('Share');
  const artboardRef = useRef<HTMLDivElement>(null);
  const collaborationRef = useRef<BroadcastChannelCollaboration | null>(null);
  const suppressBroadcast = useRef(false);
  const aiProvider = useMemo(() => createAIProvider(), []);
  const page = activePage(documentState);
  const objects = page.objects;
  const selectedObjects = objects.filter(object => selected.has(object.id));
  const bounds = selectionBounds(selectedObjects);
  const locale = documentState.metadata.locale;
  const fa = locale === 'fa';

  useEffect(() => storeRef.current.subscribe(setDocumentState), []);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
      const fresh = createBlankDocument();
      fresh.metadata.locale = localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en';
      storeRef.current.replace(fresh);
      localProjects.save(fresh);
      history.replaceState(null, '', `editor.html?id=${encodeURIComponent(fresh.id)}`);
      return;
    }
    localProjects.load(id).then(found => {
      if (found) storeRef.current.replace(found);
    });
  }, []);

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);

  useEffect(() => {
    const session = new BroadcastChannelCollaboration();
    collaborationRef.current = session;
    const user = createAnonymousPresence();
    session.connect(documentState.id, user);
    const unsubscribe = session.subscribe(event => {
      if (event.type === 'document') {
        suppressBroadcast.current = true;
        storeRef.current.replace(event.document);
        setSaveState(fa ? 'همگام شد' : 'Synced');
      }
    });
    return () => { unsubscribe(); session.disconnect(); collaborationRef.current = null; };
  }, [documentState.id]);

  useEffect(() => {
    setSaveState(fa ? 'در حال ذخیره…' : 'Saving…');
    const timer = window.setTimeout(async () => {
      await localProjects.save(documentState);
      setSaveState(fa ? 'ذخیره شد' : 'Saved locally');
      if (suppressBroadcast.current) suppressBroadcast.current = false;
      else collaborationRef.current?.publishDocument(documentState);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [documentState, fa]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === 'z') { event.preventDefault(); event.shiftKey ? storeRef.current.redo() : storeRef.current.undo(); return; }
      if (mod && event.key.toLowerCase() === 'y') { event.preventDefault(); storeRef.current.redo(); return; }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) { event.preventDefault(); deleteSelection(); }
      if (mod && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelection(); }
      if (mod && event.key.toLowerCase() === 'g') { event.preventDefault(); event.shiftKey ? ungroupSelection() : groupSelection(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const assets = useMemo(() => searchAssets(assetQuery, locale), [assetQuery, locale, documentState.updatedAt]);

  function selectedIdsForObject(object: BioPlotObject, event: ReactPointerEvent) {
    if (event.shiftKey) {
      const next = new Set(selected);
      if (next.has(object.id)) next.delete(object.id); else next.add(object.id);
      return next;
    }
    if (object.groupId) return new Set(objects.filter(item => item.groupId === object.groupId).map(item => item.id));
    if (selected.has(object.id)) return new Set(selected);
    return new Set([object.id]);
  }

  function beginMove(event: ReactPointerEvent, object: BioPlotObject) {
    if (object.locked) return;
    event.stopPropagation();
    const ids = selectedIdsForObject(object, event);
    setSelected(ids);
    if (event.shiftKey) return;
    const startObjects = copyObjects(objects.filter(item => ids.has(item.id) && !item.locked));
    if (!startObjects.length) return;
    const startBounds = selectionBounds(startObjects);
    if (!startBounds) return;
    const targets = buildSnapTargets(storeRef.current.snapshot, ids);
    const startX = event.clientX;
    const startY = event.clientY;
    const move = (nextEvent: PointerEvent) => {
      const rawDx = (nextEvent.clientX - startX) / zoom;
      const rawDy = (nextEvent.clientY - startY) / zoom;
      const snapped = snapDelta(startBounds, rawDx, rawDy, targets);
      const moved = startObjects.map(item => ({ ...item, x: item.x + snapped.dx, y: item.y + snapped.dy }));
      storeRef.current.preview(moved);
      setGuides({ x: snapped.guideX, y: snapped.guideY });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const after = copyObjects(activePage(storeRef.current.snapshot).objects.filter(item => ids.has(item.id)));
      storeRef.current.commitObjectState(startObjects, after, 'Move objects');
      setGuides({});
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function beginResize(event: ReactPointerEvent, handle: string) {
    event.stopPropagation();
    event.preventDefault();
    if (!bounds || !selectedObjects.length) return;
    const before = copyObjects(selectedObjects);
    const start = { x: event.clientX, y: event.clientY };
    const startBounds = { ...bounds };
    const move = (nextEvent: PointerEvent) => {
      const dx = (nextEvent.clientX - start.x) / zoom;
      const dy = (nextEvent.clientY - start.y) / zoom;
      let x = startBounds.x;
      let y = startBounds.y;
      let width = startBounds.width;
      let height = startBounds.height;
      if (handle.includes('e')) width = Math.max(16, startBounds.width + dx);
      if (handle.includes('s')) height = Math.max(16, startBounds.height + dy);
      if (handle.includes('w')) { x = Math.min(startBounds.right - 16, startBounds.x + dx); width = startBounds.right - x; }
      if (handle.includes('n')) { y = Math.min(startBounds.bottom - 16, startBounds.y + dy); height = startBounds.bottom - y; }
      storeRef.current.preview(resizeObjects(before, { x, y, width, height }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const after = copyObjects(activePage(storeRef.current.snapshot).objects.filter(item => selected.has(item.id)));
      storeRef.current.commitObjectState(before, after, 'Resize objects');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function beginRotate(event: ReactPointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    if (!bounds || !selectedObjects.length || !artboardRef.current) return;
    const before = copyObjects(selectedObjects);
    const rect = artboardRef.current.getBoundingClientRect();
    const centerX = rect.left + bounds.cx * zoom;
    const centerY = rect.top + bounds.cy * zoom;
    const startAngle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * 180 / Math.PI;
    const move = (nextEvent: PointerEvent) => {
      const angle = Math.atan2(nextEvent.clientY - centerY, nextEvent.clientX - centerX) * 180 / Math.PI;
      storeRef.current.preview(rotateObjects(before, angle - startAngle, { x: bounds.cx, y: bounds.cy }));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const after = copyObjects(activePage(storeRef.current.snapshot).objects.filter(item => selected.has(item.id)));
      storeRef.current.commitObjectState(before, after, 'Rotate objects');
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function addObject(object: BioPlotObject) {
    storeRef.current.dispatch(new AddObjectsCommand('Add object', [object]));
    setSelected(new Set([object.id]));
  }

  function deleteSelection() {
    const doomed = copyObjects(objects.filter(object => selected.has(object.id)));
    if (!doomed.length) return;
    storeRef.current.dispatch(new DeleteObjectsCommand('Delete objects', doomed));
    setSelected(new Set());
  }

  function duplicateSelection() {
    const duplicates = selectedObjects.map(object => ({ ...structuredClone(object), id: makeId(), groupId: undefined, x: object.x + 22, y: object.y + 22 }));
    if (!duplicates.length) return;
    storeRef.current.dispatch(new AddObjectsCommand('Duplicate objects', duplicates));
    setSelected(new Set(duplicates.map(object => object.id)));
  }

  function groupSelection() {
    if (selectedObjects.length < 2) return;
    const before = copyObjects(selectedObjects);
    const groupId = makeId('group');
    const after = before.map(object => ({ ...object, groupId }));
    storeRef.current.dispatch(new ObjectStateCommand('Group objects', before, after));
  }

  function ungroupSelection() {
    if (!selectedObjects.some(object => object.groupId)) return;
    const before = copyObjects(selectedObjects);
    const after = before.map(object => ({ ...object, groupId: undefined }));
    storeRef.current.dispatch(new ObjectStateCommand('Ungroup objects', before, after));
  }

  function commitSelected(label: string, transform: (object: BioPlotObject) => BioPlotObject) {
    if (!selectedObjects.length) return;
    const before = copyObjects(selectedObjects);
    const after = before.map(transform);
    storeRef.current.dispatch(new ObjectStateCommand(label, before, after));
  }

  function changeBounds(field: 'x' | 'y' | 'width' | 'height', value: number) {
    if (!bounds || !Number.isFinite(value)) return;
    const before = copyObjects(selectedObjects);
    if (field === 'x' || field === 'y') {
      const delta = value - bounds[field];
      const after = before.map(object => ({ ...object, [field]: object[field] + delta }));
      storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`, before, after));
    } else {
      const next = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, [field]: Math.max(8, value) };
      storeRef.current.dispatch(new ObjectStateCommand(`Change ${field}`, before, resizeObjects(before, next)));
    }
  }

  function setDocumentTitle(title: string) {
    const next = cloneDocument(documentState);
    next.title = title;
    next.updatedAt = new Date().toISOString();
    storeRef.current.replace(next);
  }

  function toggleLocale() {
    const next = cloneDocument(documentState);
    next.metadata.locale = fa ? 'en' : 'fa';
    storeRef.current.replace(next);
  }

  async function runAiDraft() {
    setAiNote(fa ? 'در حال ساخت پیش‌نویس…' : 'Generating draft…');
    try {
      const result = await aiProvider.draft({ prompt: aiPrompt, locale });
      storeRef.current.dispatch(new AddObjectsCommand('AI draft', result.objects));
      setSelected(new Set(result.objects.map(object => object.id)));
      setAiNote(result.note);
    } catch (error) {
      setAiNote(error instanceof Error ? error.message : 'AI draft failed.');
    }
  }

  async function importSvg(file: File | undefined) {
    if (!file) return;
    try {
      const safe = sanitizeSvg(await file.text());
      const asset = saveCustomAsset({ name: file.name.replace(/\.svg$/i, ''), category: 'Custom', synonyms: { en: [file.name], fa: [] }, svg: safe, colorSlots: [], reviewStatus: 'draft', premium: false });
      addObject(assetToObject(asset));
      setPanel('assets');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Could not import SVG.');
    }
  }

  async function share() {
    await navigator.clipboard?.writeText(window.location.href);
    setShareState(fa ? 'لینک کپی شد' : 'Link copied');
    window.setTimeout(() => setShareState(fa ? 'اشتراک' : 'Share'), 1600);
  }

  function renderObject(object: BioPlotObject) {
    const style = { left: object.x, top: object.y, width: object.width, height: object.height, opacity: object.opacity, transform: `rotate(${object.rotation}deg)` };
    const common = { key: object.id, className: `canvas-object-v3 ${selected.has(object.id) ? 'selected' : ''} ${object.locked ? 'locked' : ''}`, style, onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => beginMove(event, object) };
    if (object.hidden) return null;
    if (object.type === 'text') return <div {...common} className={`${common.className} text-v3`} style={{ ...style, color: object.color, fontSize: object.fontSize, fontWeight: object.fontWeight, textAlign: object.align, justifyContent: object.align === 'left' ? 'flex-start' : object.align === 'right' ? 'flex-end' : 'center' }}>{object.text}</div>;
    if (object.type === 'shape') return <div {...common} style={{ ...style, background: object.fill, border: `${object.strokeWidth}px solid ${object.stroke}`, borderRadius: object.shape === 'ellipse' ? '50%' : object.radius }} />;
    if (object.type === 'arrow') return <div {...common}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`}><defs><marker id={`arr-${object.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill={object.stroke}/></marker></defs><line x1="4" y1={object.height / 2} x2={object.width - 8} y2={object.height / 2} stroke={object.stroke} strokeWidth={object.strokeWidth} strokeLinecap="round" markerEnd={object.arrowHead === 'none' ? undefined : `url(#arr-${object.id})`}/></svg></div>;
    if (object.type === 'asset') return <div {...common} className={`${common.className} asset-object-v3`} dangerouslySetInnerHTML={{ __html: object.svg }} />;
    return <div {...common} className={`${common.className} plot-object-v3`}><svg width="100%" height="100%" viewBox={`0 0 ${object.width} ${object.height}`} dangerouslySetInnerHTML={{ __html: plotToSvg(object.spec, object.width, object.height) }} /></div>;
  }

  const grouped = selectedObjects.length > 0 && selectedObjects.every(object => object.groupId) && new Set(selectedObjects.map(object => object.groupId)).size === 1;

  return <div className="editor-shell-v3">
    <header className="editor-topbar-v3">
      <a className="brand-v3" href="index.html"><span className="brand-mark-v3">B</span><b>BioPlot</b><small>v3</small></a>
      <div className="document-meta-v3"><a href="index.html" className="icon-button">←</a><div><input value={documentState.title} onChange={event => setDocumentTitle(event.target.value)} /><small>{saveState}</small></div></div>
      <div className="top-actions-v3"><button className="icon-button" disabled={!storeRef.current.history.canUndo} onClick={() => storeRef.current.undo()}>↶</button><button className="icon-button" disabled={!storeRef.current.history.canRedo} onClick={() => storeRef.current.redo()}>↷</button><button className="ghost" onClick={toggleLocale}>{fa ? 'EN' : 'FA'}</button><button className="ghost" onClick={share}>{shareState}</button><button className="export-small" onClick={() => downloadSvg(documentState)}>SVG</button><button className="primary" onClick={() => downloadPng(documentState, 300, 160)}>PNG 300 DPI</button></div>
    </header>
    <main className="editor-workspace-v3">
      <nav className="tool-rail-v3">
        {([['assets','◫',fa?'المان':'Assets'],['design','✦',fa?'طراحی':'Design'],['plots','⌁',fa?'نمودار':'Plots'],['ai','✧','AI'],['upload','⇧',fa?'آپلود':'Upload']] as Array<[Panel,string,string]>).map(([key, icon, label]) => <button key={key} className={panel === key ? 'active' : ''} onClick={() => setPanel(key)}><span>{icon}</span><small>{label}</small></button>)}
      </nav>
      <aside className="library-v3">
        {panel === 'assets' && <><h2>{fa ? 'کتابخانه علمی' : 'Scientific library'}</h2><input className="search-input-v3" value={assetQuery} onChange={event => setAssetQuery(event.target.value)} placeholder={fa ? 'نورون، سلول، DNA…' : 'Neuron, cell, DNA…'} /><div className="asset-grid-v3">{assets.map(asset => <button key={asset.id} onClick={() => addObject(assetToObject(asset))}><span dangerouslySetInnerHTML={{ __html: asset.svg }} /><small>{asset.name}</small><em>{asset.category}</em></button>)}</div></>}
        {panel === 'design' && <><h2>{fa ? 'ابزار طراحی' : 'Design tools'}</h2><div className="design-list-v3"><button onClick={() => addObject(makeText())}>T <span>{fa ? 'متن علمی' : 'Scientific text'}</span></button><button onClick={() => addObject(makeShape())}>□ <span>{fa ? 'شکل' : 'Shape'}</span></button><button onClick={() => addObject(makeArrow())}>→ <span>{fa ? 'فلش' : 'Arrow'}</span></button></div></>}
        {panel === 'plots' && <><h2>{fa ? 'نمودار و داده' : 'Plots & data'}</h2><p className="muted-copy">{fa ? 'CSV را وارد کن؛ نمودار به‌عنوان آبجکت داده‌محور باقی می‌ماند.' : 'Paste CSV; the plot remains an editable data-bound object.'}</p><textarea className="data-textarea" value={csv} onChange={event => setCsv(event.target.value)} /><div className="two-buttons"><button onClick={() => { const object = createPlotObject('bar'); try { object.spec = csvToPlotSpec(csv, 'bar'); } catch {} addObject(object); }}>{fa ? 'نمودار ستونی' : 'Bar plot'}</button><button onClick={() => { const object = createPlotObject('scatter'); try { object.spec = csvToPlotSpec(csv, 'scatter'); } catch {} addObject(object); }}>{fa ? 'پراکندگی' : 'Scatter'}</button></div></>}
        {panel === 'ai' && <><h2>BioPlot AI</h2><p className="muted-copy">{fa ? 'توضیح علمی بده تا یک پیش‌نویس کاملاً قابل ویرایش ساخته شود.' : 'Describe the biology and generate a fully editable first draft.'}</p><textarea className="data-textarea tall" value={aiPrompt} onChange={event => setAiPrompt(event.target.value)} /><button className="primary wide" onClick={runAiDraft}>✧ {fa ? 'ساخت پیش‌نویس' : 'Generate editable draft'}</button>{aiNote && <div className="info-box-v3">{aiNote}</div>}</>}
        {panel === 'upload' && <><h2>{fa ? 'آپلود و مدیریت دارایی' : 'Upload & asset admin'}</h2><label className="upload-box-v3">⇧<b>{fa ? 'SVG علمی اضافه کن' : 'Add scientific SVG'}</b><small>{fa ? 'اسکریپت و منابع خارجی هنگام ورود حذف می‌شوند.' : 'Scripts and external resources are stripped during ingestion.'}</small><input type="file" accept=".svg,image/svg+xml" hidden onChange={event => importSvg(event.target.files?.[0])} /></label><div className="info-box-v3">{fa ? `${getAssetCatalog().length} دارایی در کاتالوگ فعلی` : `${getAssetCatalog().length} assets in the current catalog`}</div></>}
      </aside>
      <section className="canvas-viewport-v3" onPointerDown={event => { if (event.target === event.currentTarget) setSelected(new Set()); }}>
        <div className="context-bar-v3">{selectedObjects.length ? <><button onClick={duplicateSelection}>⧉ {fa ? 'کپی' : 'Duplicate'}</button>{selectedObjects.length > 1 && !grouped && <button onClick={groupSelection}>{fa ? 'گروه' : 'Group'}</button>}{grouped && <button onClick={ungroupSelection}>{fa ? 'بازکردن گروه' : 'Ungroup'}</button>}<button onClick={deleteSelection}>{fa ? 'حذف' : 'Delete'}</button></> : <span>{fa ? 'یک آبجکت را انتخاب کن' : 'Select an object to edit'}</span>}</div>
        <div className="artboard-scale-v3" style={{ transform: `scale(${zoom})` }}>
          <div ref={artboardRef} className="artboard-v3" style={{ width: page.width, height: page.height, background: page.background }} onPointerDown={event => { if (event.target === event.currentTarget) setSelected(new Set()); }}>
            {objects.map(renderObject)}
            {guides.x !== undefined && <div className="guide-v3 vertical" style={{ left: guides.x }} />}{guides.y !== undefined && <div className="guide-v3 horizontal" style={{ top: guides.y }} />}
            {bounds && <div className="selection-box-v3" style={{ left: bounds.x, top: bounds.y, width: bounds.width, height: bounds.height }} onPointerDown={event => event.stopPropagation()}><span className="rotate-line-v3"/><button className="rotate-handle-v3" onPointerDown={beginRotate}/>{['nw','ne','se','sw'].map(handle => <button key={handle} className={`resize-handle-v3 ${handle}`} onPointerDown={event => beginResize(event, handle)} />)}</div>}
          </div>
        </div>
        <div className="zoom-controls-v3"><button onClick={() => setZoom(value => Math.max(.45, value - .1))}>−</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(value => Math.min(1.5, value + .1))}>+</button><button onClick={() => setZoom(.82)}>Fit</button></div>
      </section>
      <aside className="properties-v3"><div className="properties-head"><div><span className="eyebrow">SELECTION</span><h2>{selectedObjects.length === 0 ? (fa ? 'بدون انتخاب' : 'No selection') : selectedObjects.length === 1 ? selectedObjects[0].name : `${selectedObjects.length} ${fa ? 'آبجکت' : 'objects'}`}</h2></div><button className="icon-button danger" onClick={deleteSelection}>⌫</button></div>
        <section><h3>{fa ? 'موقعیت و اندازه' : 'Position & size'}</h3><div className="field-grid-v3"><label>X<input disabled={!bounds} type="number" value={bounds ? Math.round(bounds.x) : ''} onChange={event => changeBounds('x', Number(event.target.value))}/></label><label>Y<input disabled={!bounds} type="number" value={bounds ? Math.round(bounds.y) : ''} onChange={event => changeBounds('y', Number(event.target.value))}/></label><label>W<input disabled={!bounds} type="number" value={bounds ? Math.round(bounds.width) : ''} onChange={event => changeBounds('width', Number(event.target.value))}/></label><label>H<input disabled={!bounds} type="number" value={bounds ? Math.round(bounds.height) : ''} onChange={event => changeBounds('height', Number(event.target.value))}/></label></div></section>
        <section><h3>{fa ? 'ظاهر' : 'Appearance'}</h3><label className="range-v3"><span>{fa ? 'شفافیت' : 'Opacity'}</span><input disabled={!selectedObjects.length} type="range" min="10" max="100" value={selectedObjects.length ? Math.round(selectedObjects.reduce((sum, object) => sum + object.opacity, 0) / selectedObjects.length * 100) : 100} onChange={event => commitSelected('Change opacity', object => ({ ...object, opacity: Number(event.target.value) / 100 }))}/></label><div className="swatches-v3">{['#0b7a75','#316f9d','#c97842','#6c5aa8','#273847'].map(color => <button key={color} style={{ background: color }} onClick={() => commitSelected('Change color', object => object.type === 'text' ? { ...object, color } : object.type === 'shape' ? { ...object, fill: color } : object.type === 'arrow' ? { ...object, stroke: color } : object)} />)}</div>{selectedObjects.length === 1 && selectedObjects[0].type === 'text' && <label className="full-input-v3"><span>{fa ? 'متن' : 'Text'}</span><input value={selectedObjects[0].text} onChange={event => commitSelected('Edit text', object => object.type === 'text' ? { ...object, text: event.target.value, name: event.target.value.slice(0, 32) || 'Text' } : object)} /></label>}</section>
        <section><h3>{fa ? 'لایه‌ها' : 'Layers'}</h3><div className="layers-v3">{objects.slice().reverse().map(object => <button key={object.id} className={selected.has(object.id) ? 'active' : ''} onClick={() => setSelected(new Set(object.groupId ? objects.filter(item => item.groupId === object.groupId).map(item => item.id) : [object.id]))}><i>{object.type.slice(0,1).toUpperCase()}</i><span>{object.name}</span>{object.groupId && <em>G</em>}</button>)}</div></section>
        <div className="architecture-badge-v3"><b>BioPlot v3 engine</b><span>{fa ? 'سند ساختاریافته • تاریخچه Command • SVG برداری' : 'Structured document • Command history • Native SVG'}</span></div>
      </aside>
    </main>
  </div>;
}
