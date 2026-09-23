import { objectTypeFa } from './editorLabels';
import {ShapeControls} from './ShapeControls';
import { useMemo, useState } from 'react';
import { assetTintColor, setAssetTint } from './assetStyling';
import { StudioIcon } from './StudioIcon';
import { NativePathControls } from './NativePathControls';
import { Bounds, selectionBounds } from './engine';
import { downloadPng, downloadSvg, EXPORT_DPI_PRESETS, JOURNAL_WIDTH_PRESETS } from './export';
import { BioPlotDocument, BioPlotObject, ConnectorObject, ConnectorPort, LabelObject, TextObject } from './model';
import { checkPublicationQuality, qualityScore } from './publication';
import { SCIENTIFIC_FONTS, SCIENTIFIC_SYMBOLS } from './typography';

type Tab = 'properties' | 'layers' | 'quality' | 'export';
type Commit = (label: string, transform: (object: BioPlotObject) => BioPlotObject) => void;

export function EditorInspector({
  fa, tab, setTab, documentState, bounds, selectedObjects, objects, selected,
  onBounds, onCommit, onLock, onHide, onSelect, onLayerStep, onLayerReorder,
  onToggleObjectLock, onToggleObjectHidden, onCollapse
}: {
  fa: boolean;
  tab: Tab;
  setTab: (tab: Tab) => void;
  documentState: BioPlotDocument;
  bounds: Bounds | null;
  selectedObjects: BioPlotObject[];
  objects: BioPlotObject[];
  selected: Set<string>;
  onBounds: (field: 'x' | 'y' | 'width' | 'height', value: number) => void;
  onCommit: Commit;
  onLock: (locked: boolean) => void;
  onHide: () => void;
  onSelect: (object: BioPlotObject) => void;
  onLayerStep: (id: string, action: 'forward' | 'backward') => void;
  onLayerReorder: (draggedId: string, targetId: string) => void;
  onToggleObjectLock: (object: BioPlotObject) => void;
  onToggleObjectHidden: (object: BioPlotObject) => void;
  onCollapse: () => void;
}) {
  return <aside className="studio-inspector">
    <div className="inspector-tabs">
      <button className={tab === 'properties' ? 'active' : ''} onClick={() => setTab('properties')} aria-pressed={tab === 'properties'}><StudioIcon name="settings"/>{fa ? 'ویژگی‌ها' : 'Properties'}</button>
      <button className={tab === 'layers' ? 'active' : ''} onClick={() => setTab('layers')} aria-pressed={tab === 'layers'}><StudioIcon name="layers"/>{fa ? 'لایه‌ها' : 'Layers'}</button>
      <button className={tab === 'quality' ? 'active' : ''} onClick={() => setTab('quality')} aria-pressed={tab === 'quality'}><StudioIcon name="check"/>{fa ? 'کیفیت' : 'Quality'}</button>
      <button className={tab === 'export' ? 'active' : ''} onClick={() => setTab('export')} aria-pressed={tab === 'export'}><StudioIcon name="download"/>{fa ? 'خروجی' : 'Export'}</button>
      <button className="collapse-inspector" onClick={onCollapse} aria-label={fa?'بستن پنل':'Close panel'}><StudioIcon name="close"/></button>
    </div>
    {tab === 'properties' && <Properties fa={fa} bounds={bounds} selectedObjects={selectedObjects} objects={objects} onBounds={onBounds} onCommit={onCommit} onLock={onLock} onHide={onHide} />}
    {tab === 'layers' && <Layers fa={fa} objects={objects} selected={selected} onSelect={onSelect} onLayerStep={onLayerStep} onLayerReorder={onLayerReorder} onToggleObjectLock={onToggleObjectLock} onToggleObjectHidden={onToggleObjectHidden} />}
    {tab === 'quality' && <QualityPanel fa={fa} documentState={documentState} onSelectIssue={id => { const object = objects.find(item => item.id === id); if (object) onSelect(object); }} />}
    {tab === 'export' && <ExportPanel fa={fa} documentState={documentState} selected={selected} />}
  </aside>;
}

function Properties({ fa, selectedObjects, objects, onCommit }: {
  fa: boolean;
  bounds: ReturnType<typeof selectionBounds>;
  selectedObjects: BioPlotObject[];
  objects: BioPlotObject[];
  onBounds: (field: 'x' | 'y' | 'width' | 'height', value: number) => void;
  onCommit: Commit;
  onLock: (locked: boolean) => void;
  onHide: () => void;
}) {
  const single = selectedObjects.length === 1 ? selectedObjects[0] : null;

  return <div className={`studio-properties ${single?.type==='arrow'?'bp-line-inspector':''}`}>
    <div className="property-selection">

      <h2>{selectedObjects.length === 0 ? (fa ? 'بدون انتخاب' : 'No selection') : single ? single.name : `${selectedObjects.length} ${fa ? 'جزء انتخاب‌شده' : 'objects'}`}</h2>

    </div>


    {single && (single.type === 'text' || single.type === 'label') && <TextProperties fa={fa} single={single} onCommit={onCommit} />}
    {single && (single.type === 'arrow' || single.type === 'connector') && <LineProperties fa={fa} single={single} objects={objects} onCommit={onCommit} />}
    {single?.type === 'shape' && <ShapeControls fa={fa} object={single} onCommit={onCommit}/> }
    {single?.type === 'image' && <section><h3>{fa ? 'تصویر' : 'Image'}</h3><div className="property-actions"><button className={single.fit === 'contain' ? 'active' : ''} onClick={() => onCommit('Image fit', object => object.id === single.id && object.type === 'image' ? { ...object, fit: 'contain' } : object)}>{fa?'نمایش کامل':'Contain'}</button><button className={single.fit === 'cover' ? 'active' : ''} onClick={() => onCommit('Image fit', object => object.id === single.id && object.type === 'image' ? { ...object, fit: 'cover' } : object)}>{fa?'پر کردن کادر':'Cover'}</button></div>{single.naturalWidth && <p className="property-hint">{fa?'ابعاد تصویر اصلی: ':'Source size: '}<bdi>{single.naturalWidth} × {single.naturalHeight}</bdi> {fa?'پیکسل':'px'}</p>}</section>}
  </div>;
}

type TextPatch = Partial<Omit<TextObject, 'type' | 'id'>> & Partial<Omit<LabelObject, 'type' | 'id'>>;

function TextProperties({ fa, single, onCommit }: { fa: boolean; single: TextObject | LabelObject; onCommit: Commit }) {
  const change = (patch: TextPatch, label: string) => onCommit(label, object => {
    if (object.id !== single.id) return object;
    if (object.type === 'text') return { ...object, ...patch, type: 'text' } as TextObject;
    if (object.type === 'label') return { ...object, ...patch, type: 'label' } as LabelObject;
    return object;
  });
  const append = (value: string) => change({ text: `${single.text}${value}`, name: `${single.text}${value}`.slice(0, 32) || 'Text' }, 'Insert scientific symbol');

  return <section>
    <h3>{fa ? 'متن علمی' : 'Scientific text'}</h3>
    <label className="property-stack"><span>{fa ? 'محتوا' : 'Content'}</span><textarea value={single.text} onChange={event => change({ text: event.target.value, name: event.target.value.slice(0, 32) || 'Text' }, 'Edit text')} /></label>
    <div className="symbol-grid">{SCIENTIFIC_SYMBOLS.map(symbol => <button key={symbol} onClick={() => append(symbol)}>{symbol}</button>)}</div>
    <div className="property-grid">
      <label><span>{fa ? 'فونت' : 'Font'}</span><select value={single.fontFamily || 'Inter'} onChange={event => change({ fontFamily: event.target.value }, 'Font family')}>{SCIENTIFIC_FONTS.map(font => <option key={font}>{font}</option>)}</select></label>
      <label><span>{fa?'اندازه قلم':'Size'}</span><input type="number" min="6" max="96" value={single.fontSize} onChange={event => change({ fontSize: Number(event.target.value) }, 'Font size')} /></label>
      <label><span>{fa?'وزن قلم':'Weight'}</span><select value={single.fontWeight} onChange={event => change({ fontWeight: Number(event.target.value) }, 'Font weight')}>{[400, 500, 600, 700, 800].map(weight => <option key={weight}>{weight}</option>)}</select></label>
      <label><span>{fa ? 'تراز' : 'Align'}</span><select value={single.align} onChange={event => change({ align: event.target.value as 'left' | 'center' | 'right' }, 'Text align')}><option value="left">{fa?'چپ':'Left'}</option><option value="center">{fa?'وسط':'Center'}</option><option value="right">{fa?'راست':'Right'}</option></select></label>
    </div>
    {single.type === 'text' && <>
      <div className="property-actions"><button className={single.fontStyle === 'italic' ? 'active' : ''} onClick={() => change({ fontStyle: single.fontStyle === 'italic' ? 'normal' : 'italic' }, 'Italic')}><i>I</i></button><button className={single.textDecoration === 'underline' ? 'active' : ''} onClick={() => change({ textDecoration: single.textDecoration === 'underline' ? 'none' : 'underline' }, 'Underline')}><u>U</u></button><button onClick={() => append('²')}>x²</button><button onClick={() => append('₂')}>x₂</button></div>
      <div className="property-grid"><label><span>{fa?'فاصله سطرها':'Line'}</span><input type="number" step="0.05" min="0.8" max="2.5" value={single.lineHeight ?? 1.2} onChange={event => change({ lineHeight: Number(event.target.value) }, 'Line height')} /></label><label><span>{fa?'فاصله حروف':'Spacing'}</span><input type="number" step="0.1" min="-2" max="12" value={single.letterSpacing ?? 0} onChange={event => change({ letterSpacing: Number(event.target.value) }, 'Letter spacing')} /></label><label><span>{fa?'تراز عمودی':'Vertical'}</span><select value={single.verticalAlign ?? 'middle'} onChange={event => change({ verticalAlign: event.target.value as 'top' | 'middle' | 'bottom' }, 'Vertical align')}><option value="top">{fa?'بالا':'Top'}</option><option value="middle">{fa?'میانه':'Middle'}</option><option value="bottom">{fa?'پایین':'Bottom'}</option></select></label></div>
    </>}
  </section>;
}

function LineProperties({ fa, single, objects, onCommit }: { fa:boolean; single:Extract<BioPlotObject,{type:'arrow'|'connector'}>; objects:BioPlotObject[]; onCommit:Commit }) {
  const change=(patch:Partial<ConnectorObject>,label:string)=>onCommit(label,object=>object.id===single.id&&object.type==='connector'&&!object.locked?{...object,...patch}:object);
  const candidates=objects.filter(object=>object.id!==single.id&&object.type!=='connector'&&!object.hidden);
  return <section className="bp-contextual-line">
    <h3>{fa?'طراحی خط':'Line design'}</h3>
    {single.type==='arrow'?<NativePathControls fa={fa} line={single} onCommit={onCommit}/>:<>
      <div className="property-grid"><label><span>{fa?'ضخامت':'Width'}</span><input type="number" min="0.5" max="40" step="0.5" value={single.strokeWidth} onChange={event=>change({strokeWidth:Math.max(.5,Math.min(40,Number(event.target.value)||.5))},'Connector width')}/></label><label><span>{fa?'نوع خط':'Style'}</span><select value={single.lineStyle} onChange={event=>change({lineStyle:event.target.value as ConnectorObject['lineStyle']},'Connector style')}><option value="solid">{fa?'پیوسته':'Solid'}</option><option value="dashed">{fa?'خط‌چین':'Dashed'}</option><option value="dotted">{fa?'نقطه‌چین':'Dotted'}</option></select></label></div>
      <label className="property-stack"><span>{fa?'سر فلش':'Arrow head'}</span><select value={single.arrowHead} onChange={event=>change({arrowHead:event.target.value as ConnectorObject['arrowHead']},'Connector head')}><option value="end">{fa?'انتهای خط':'End'}</option><option value="both">{fa?'دو سر خط':'Both'}</option><option value="none">{fa?'بدون سرپیکان':'None'}</option><option value="inhibition">{fa?'مهار':'Inhibition'}</option></select></label>
      <label className="property-stack"><span>{fa?'مسیر':'Route'}</span><select value={single.route} onChange={event=>change({route:event.target.value as ConnectorObject['route']},'Connector route')}><option value="straight">{fa?'مستقیم':'Straight'}</option><option value="elbow">{fa?'شکسته':'Elbow'}</option><option value="curved">{fa?'منحنی':'Curved'}</option></select></label>
      <label className="property-stack"><span>{fa?'برچسب':'Label'}</span><input value={single.label??''} onChange={event=>change({label:event.target.value},'Connector label')}/></label>
      <div className="connector-bindings"><label><span>{fa?'شروع از':'From object'}</span><select value={single.fromObjectId??''} onChange={event=>change({fromObjectId:event.target.value||undefined},'Attach start')}><option value="">{fa?'آزاد':'Free'}</option>{candidates.map(object=><option key={object.id} value={object.id}>{object.name}</option>)}</select></label><label><span>{fa?'پایان به':'To object'}</span><select value={single.toObjectId??''} onChange={event=>change({toObjectId:event.target.value||undefined},'Attach end')}><option value="">{fa?'آزاد':'Free'}</option>{candidates.map(object=><option key={object.id} value={object.id}>{object.name}</option>)}</select></label></div>
      <div className="property-grid">{(['fromPort','toPort'] as const).map(field=><label key={field}><span>{field==='fromPort'?(fa?'نقطه اتصال شروع':'From port'):(fa?'نقطه اتصال پایان':'To port')}</span><select value={single[field]??'auto'} onChange={event=>change({[field]:event.target.value as ConnectorPort},'Connector port')}>{['auto','top','right','bottom','left','center'].map(port=><option key={port} value={port}>{fa?({auto:'خودکار',top:'بالا',right:'راست',bottom:'پایین',left:'چپ',center:'وسط'} as Record<string,string>)[port]:port}</option>)}</select></label>)}</div>
    </>}
  </section>;
}

function Layers({ fa, objects, selected, onSelect, onLayerStep, onLayerReorder, onToggleObjectLock, onToggleObjectHidden }: { fa: boolean; objects: BioPlotObject[]; selected: Set<string>; onSelect: (object: BioPlotObject) => void; onLayerStep: (id: string, action: 'forward' | 'backward') => void; onLayerReorder: (draggedId: string, targetId: string) => void; onToggleObjectLock: (object: BioPlotObject) => void; onToggleObjectHidden: (object: BioPlotObject) => void }) {
  const [query, setQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [dragged, setDragged] = useState<string | null>(null);
  const groups = useMemo(() => {
    const map = new Map<string, BioPlotObject[]>();
    objects.forEach(object => { const key = object.groupId ?? `single:${object.id}`; map.set(key, [...(map.get(key) ?? []), object]); });
    return [...map.entries()].reverse();
  }, [objects]);
  const normalized = query.trim().toLowerCase();

  return <div className="layers-panel-v2">
    <div className="studio-search compact">⌕<input value={query} onChange={event => setQuery(event.target.value)} placeholder={fa ? 'جست‌وجوی لایه…' : 'Search layers…'} /></div>
    <div className="studio-layers">{groups.map(([key, group]) => {
      const visible = group.filter(object => !normalized || `${object.name} ${object.type} ${objectTypeFa[object.type]||''}`.toLowerCase().includes(normalized));
      if (!visible.length) return null;
      const grouped = !key.startsWith('single:');
      const collapsed = collapsedGroups.has(key);
      return <div className="layer-group" key={key}>
        {grouped && <button className="layer-group-title" onClick={() => setCollapsedGroups(current => { const next = new Set(current); next.has(key) ? next.delete(key) : next.add(key); return next; })}><span>{collapsed ? '▸' : '▾'}</span><b>{fa ? 'گروه' : 'Group'}</b><small>{group.length}</small></button>}
        {!collapsed && visible.slice().reverse().map(object => <div draggable key={object.id} className={`${selected.has(object.id) ? 'active' : ''} ${object.hidden ? 'hidden-layer' : ''}`} onDragStart={() => setDragged(object.id)} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragged && dragged !== object.id) onLayerReorder(dragged, object.id); setDragged(null); }}>
          <button className="layer-main" onClick={() => onSelect(object)}><i><StudioIcon name={object.type==='text'?'text':object.type==='image'?'upload':'elements'}/></i><span><b>{object.name}</b><small>{fa?objectTypeFa[object.type]||object.type:object.type}{object.groupId ? (fa?' · گروه':' · group') : ''}</small></span></button>
          <div className="layer-actions"><button title={fa?'نمایش یا پنهان کردن':'Show/hide'} onClick={() => onToggleObjectHidden(object)}>{object.hidden ? '○' : '●'}</button><button title={fa?'قفل یا باز کردن':'Lock/unlock'} onClick={() => onToggleObjectLock(object)}>{object.locked ? '⌑' : '◇'}</button><button title={fa?'یک لایه بالاتر':'Move up'} onClick={() => onLayerStep(object.id, 'forward')}>↑</button><button title={fa?'یک لایه پایین‌تر':'Move down'} onClick={() => onLayerStep(object.id, 'backward')}>↓</button></div>
        </div>)}
      </div>;
    })}</div>
  </div>;
}

const qualityTextFa = {
  OUTSIDE_ARTBOARD: ['شکل بیرون از بوم', 'بخشی از این شکل خارج از محدوده خروجی قرار دارد.'],
  SMALL_TEXT: ['متن ریز است', 'برای خوانایی بهتر، اندازه قلم را دست‌کم ۱۰ پیکسل در نظر بگیرید.'],
  LOW_CONTRAST: ['خوانایی کم متن', 'رنگ متن را از رنگ پس‌زمینه متمایزتر کنید.'],
  FONT_MIX: ['تنوع زیاد قلم‌ها', 'استفاده از حداکثر سه خانواده قلم به یکدستی طرح کمک می‌کند.'],
  STROKE_MIX: ['ضخامت‌های نامنظم', 'برای هماهنگی بیشتر، تعداد ضخامت‌های متفاوت خطوط را کاهش دهید.'],
  LOW_IMAGE_DPI: ['وضوح پایین تصویر', 'وضوح این تصویر در اندازه خروجی انتخاب‌شده کمتر از ۱۵۰ نقطه در اینچ است.'],
  EMPTY_TEXT: ['کادر متن خالی', 'این کادر نوشته‌ای ندارد؛ آن را تکمیل یا حذف کنید.'],
  NO_PANEL_LABELS: ['بخش‌ها برچسب ندارند', 'اگر شکل چندبخشی است، برای بخش‌ها برچسب‌هایی مانند A، B و C بگذارید.'],
};

function QualityPanel({ fa, documentState, onSelectIssue }: { fa: boolean; documentState: BioPlotDocument; onSelectIssue: (id: string) => void }) {
  const issues = useMemo(() => checkPublicationQuality(documentState), [documentState]);
  const score = qualityScore(issues);
  return <div className="quality-panel">
    <div className="quality-score"><strong>{score}</strong><div><b>{fa ? 'امتیاز آمادگی انتشار' : 'Publication readiness'}</b><small>{issues.length ? `${issues.length} ${fa ? 'مورد برای بررسی' : 'items to review'}` : (fa ? 'بدون هشدار' : 'No warnings')}</small></div></div>
    <div className="quality-list">{issues.length === 0 && <div className="quality-empty">✓ {fa ? 'این صفحه برای خروجی آماده به نظر می‌رسد.' : 'This page looks ready to export.'}</div>}{issues.map(issue => <button key={issue.id} className={`quality-issue ${issue.severity}`} onClick={() => issue.objectId && onSelectIssue(issue.objectId)}><i>{issue.severity === 'error' ? '!' : issue.severity === 'warning' ? '△' : 'i'}</i><span><b>{fa?qualityTextFa[issue.code][0]:issue.title}</b><small>{fa?<>{issue.objectId&&<bdi>{documentState.pages.flatMap(page=>page.objects).find(object=>object.id===issue.objectId)?.name}: </bdi>}{qualityTextFa[issue.code][1]}</>:issue.detail}</small></span></button>)}</div>
  </div>;
}

function ExportPanel({ fa, documentState, selected }: { fa: boolean; documentState: BioPlotDocument; selected: Set<string> }) {
  const [dpi, setDpi] = useState<number>(documentState.metadata.lastExportDpi ?? 300);
  const [widthMm, setWidthMm] = useState<number>(documentState.metadata.lastExportWidthMm ?? 160);
  const [transparent, setTransparent] = useState(false);
  const selection = selected.size ? new Set(selected) : undefined;
  const number = (value: number) => value.toLocaleString(fa ? 'fa-IR' : 'en-US');
  const widthLabels: Record<string, string> = {single:'تک‌ستونی','one-half':'یک‌ونیم‌ستونی',double:'دوستونی',a4:'عرض محتوای کاغذ A4'};
  return <div className="export-panel-v2 export-panel-refined">
    <div className="export-card"><span className="export-emblem"><StudioIcon name="download"/></span><h2>{fa ? 'دریافت فایل طرح' : 'Download your figure'}</h2><p>{fa ? 'اندازه و کیفیت خروجی را تنظیم کنید و فایل را دریافت کنید.' : 'Choose the size and quality, then download your figure.'}</p></div>
    <section><h3>{fa ? 'کیفیت تصویر' : 'Image resolution'} <bdi className="export-unit">DPI</bdi></h3><div className="export-presets export-resolution">{EXPORT_DPI_PRESETS.map(value => <button aria-pressed={dpi===value} className={dpi === value ? 'active' : ''} key={value} onClick={() => setDpi(value)}><b>{number(value)}</b><small>{value===300?(fa?'پیشنهادی':'Recommended'):value===600?(fa?'جزئیات بیشتر':'More detail'):(fa?'حجم کمتر':'Smaller file')}</small></button>)}</div><p className="export-hint">{fa?'این تنظیم برای فایل تصویری PNG است؛ فایل SVG با بزرگ‌نمایی افت کیفیت ندارد.':'Resolution applies to PNG. SVG stays sharp at any size.'}</p></section>
    <section><h3>{fa ? 'عرض طرح در چاپ' : 'Printed figure width'}</h3><div className="export-presets export-widths">{JOURNAL_WIDTH_PRESETS.map(preset => <button aria-pressed={widthMm===preset.widthMm} key={preset.id} className={widthMm === preset.widthMm ? 'active' : ''} onClick={() => setWidthMm(preset.widthMm)}><span>{fa?widthLabels[preset.id]:preset.label}</span><small>{number(preset.widthMm)} {fa?'میلی‌متر':'mm'}</small></button>)}</div><label className="export-custom-width"><span>{fa?'عرض دلخواه':'Custom width'}</span><input type="number" min="20" max="600" value={widthMm} onChange={event => setWidthMm(Number(event.target.value))} onBlur={()=>setWidthMm(Math.max(20,Math.min(600,widthMm||160)))}/><small>{fa?'میلی‌متر':'mm'}</small></label></section>
    <label className="export-toggle"><input type="checkbox" checked={transparent} onChange={event => setTransparent(event.target.checked)} /><span>{fa ? 'پس‌زمینه شفاف' : 'Transparent background'}</span></label>
    <div className="export-actions-v2"><button onClick={() => downloadSvg(documentState, { transparent })}><bdi>SVG</bdi><small>{fa?'فایل برداری':'Vector file'}</small></button><button className="primary" disabled={widthMm<20||widthMm>600} onClick={() => void downloadPng(documentState, dpi, widthMm, { transparent })}><bdi>PNG</bdi><small>{fa?'فایل تصویری':'Image file'}</small></button></div>
    {selection && <div className="export-selection"><b>{fa ? 'فقط اجزای انتخاب‌شده' : 'Selected objects only'}</b><p className="export-hint">{fa?'خروجی متناسب با محدوده انتخاب برش می‌خورد.':'The file is cropped to the selection.'}</p><div><button onClick={() => downloadSvg(documentState, { transparent, objectIds: selection, cropToSelection: true })}><bdi>SVG</bdi></button><button disabled={widthMm<20||widthMm>600} onClick={() => void downloadPng(documentState, dpi, widthMm, { transparent, objectIds: selection, cropToSelection: true })}><bdi>PNG</bdi></button></div></div>}
  </div>;
}

export function SelectionProperties({fa,bounds,selectedObjects,onBounds,onCommit,onLock,onHide}:{
  fa:boolean; bounds:Bounds|null; selectedObjects:BioPlotObject[];
  onBounds:(field:'x'|'y'|'width'|'height',value:number)=>void;
  onCommit:Commit; onLock:(locked:boolean)=>void; onHide:()=>void;
}) {
  const single=selectedObjects.length===1?selectedObjects[0]:null;
  const opacity = selectedObjects.length ? selectedObjects.reduce((sum, object) => sum + object.opacity, 0) / selectedObjects.length : 1;
  const allLocked=selectedObjects.length>0&&selectedObjects.every(object=>object.locked);
  let primaryColor = '#0b7a75';
  if (single?.type === 'text' || single?.type === 'label') primaryColor = single.color;
  else if (single?.type === 'shape' || single?.type === 'container') primaryColor = single.fill==='none'?'#ffffff':single.fill;
  else if (single?.type === 'arrow' || single?.type === 'connector') primaryColor = single.stroke;

  const title=single?single.name:selectedObjects.length?`${selectedObjects.length} ${fa?'آبجکت':'objects'}`:fa?'بدون انتخاب':'No selection';
  return <div className="studio-property-bar compact-property-tools" role="region" aria-label={fa?'ویژگی‌های انتخاب':'Selection properties'}>
    <span className="compact-selection-indicator" title={title} aria-label={title}><StudioIcon name="settings"/></span>
    <div className="precision-size-fields"><span>{fa?'اندازه':'Size'}</span>{(['width','height'] as const).map(field=><label key={field}><span>{field==='width'?'W':'H'}</span><input aria-label={fa?(field==='width'?'عرض انتخاب':'ارتفاع انتخاب'):(field==='width'?'Selection width':'Selection height')} disabled={!bounds||allLocked} type="number" min="1" value={bounds?Math.round(bounds[field]):''} placeholder="—" onChange={event=>{const value=Number(event.target.value);if(value>0)onBounds(field,value);}}/></label>)}</div>

    <details className="compact-property-tool transform-tool">
      <summary title={fa?'موقعیت و اندازه':'Position & size'} aria-label={fa?'موقعیت و اندازه':'Position & size'}><StudioIcon name="fit"/></summary>
      <div className="compact-property-popover transform-popover">
        <strong>{fa?'موقعیت و اندازه':'Position & size'} <small>px</small></strong>
        <div className="compact-transform-grid">
          {(['x','y','width','height'] as const).map(field=><label key={field}><span>{field==='width'?'W':field==='height'?'H':field.toUpperCase()}</span><input disabled={!bounds||allLocked} type="number" value={bounds?Math.round(bounds[field]):''} onChange={event=>onBounds(field,Number(event.target.value))}/></label>)}
        </div>
      </div>
    </details>

    <button className="compact-property-action" disabled={!selectedObjects.length} onClick={()=>onLock(!allLocked)} title={allLocked?(fa?'بازکردن قفل':'Unlock'):(fa?'قفل':'Lock')} aria-label={allLocked?(fa?'بازکردن قفل':'Unlock'):(fa?'قفل':'Lock')}><StudioIcon name={allLocked?'unlock':'lock'}/></button>
    <button className="compact-property-action" disabled={!selectedObjects.length} onClick={onHide} title={fa?'مخفی':'Hide'} aria-label={fa?'مخفی':'Hide'}><StudioIcon name="hide"/></button>

    {single?.type==='asset'&&<label className="compact-asset-tint" title={fa?'رنگ تصویر':'Image color'}>
      <input type="color" aria-label={fa?'رنگ تصویر':'Image color'} disabled={!!single.locked} value={assetTintColor(single)??'#000000'} onChange={event=>{
        const color=event.target.value;
        onCommit('Image color',object=>object.type==='asset'&&object.id===single.id?setAssetTint(object,color):object);
      }}/>
    </label>}

    <details className="compact-property-tool appearance-tool">
      <summary title={fa?'ظاهر':'Appearance'} aria-label={fa?'ظاهر':'Appearance'}><StudioIcon name="paint"/></summary>
      <div className="compact-property-popover appearance-popover">
        <strong>{fa?'ظاهر':'Appearance'}</strong>
        {single?.type==='asset'&&<button type="button" className="compact-tint-reset" disabled={!!single.locked||!assetTintColor(single)} onClick={()=>onCommit('Reset image color',object=>object.type==='asset'&&object.id===single.id?setAssetTint(object):object)}>{fa?'بازگشت به رنگ اصلی':'Restore original color'}</button>}
        <label className="compact-opacity"><span>{fa?'شفافیت':'Opacity'}</span><input disabled={!selectedObjects.length} type="range" min="5" max="100" value={Math.round(opacity*100)} onChange={event=>{const value=Number(event.target.value)/100;onCommit('Opacity',object=>({...object,opacity:value}));}}/><em>{Math.round(opacity*100)}%</em></label>
        {single&&!['asset','image','plot'].includes(single.type)&&<label className="compact-color"><span>{fa?'رنگ اصلی':'Primary color'}</span><input type="color" value={primaryColor} onChange={event=>{
          const color=event.target.value;
          onCommit('Color',object=>{
            if(object.type==='text'||object.type==='label')return {...object,color};
            if(object.type==='shape'||object.type==='container')return {...object,fill:color};
            if(object.type==='arrow'||object.type==='connector')return {...object,stroke:color};
            return object;
          });
        }}/></label>}
      </div>
    </details>
  </div>;
}
