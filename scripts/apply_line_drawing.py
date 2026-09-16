"""One-time, fail-closed source migration. The companion Actions job validates and commits the result."""
from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    file = Path('src') / path
    source = file.read_text(encoding='utf-8')
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f'{path}: expected exactly one anchor, got {count}: {old[:95]!r}')
    file.write_text(source.replace(old, new, 1), encoding='utf-8')
    print('Patched', path)

replace('EditorObjectView.tsx', "import { BioPlotObject } from './model';", "import { BioPlotObject } from './model';\nimport { lineSvgBody } from './lineGeometry';")
replace('EditorObjectView.tsx',
    "  if (rendered.type === 'arrow') return <div {...common}><svg width=\"100%\" height=\"100%\" viewBox={`0 0 ${rendered.width} ${rendered.height}`}><Markers object={rendered}/><line x1=\"4\" y1={rendered.height/2} x2={rendered.width-9} y2={rendered.height/2} stroke={rendered.stroke} strokeWidth={rendered.strokeWidth} strokeDasharray={dash(rendered.lineStyle)} markerStart={rendered.arrowHead==='both'?`url(#start-${rendered.id})`:undefined} markerEnd={rendered.arrowHead==='none'?undefined:`url(#end-${rendered.id})`}/></svg></div>;",
    "  if (rendered.type === 'arrow') return <div {...common}><svg width=\"100%\" height=\"100%\" viewBox={`0 0 ${rendered.width} ${rendered.height}`} style={{overflow:'visible'}}>{rendered.startPoint&&rendered.endPoint?<g dangerouslySetInnerHTML={{__html:lineSvgBody(rendered)}}/>:<><Markers object={rendered}/><line x1=\"4\" y1={rendered.height/2} x2={rendered.width-9} y2={rendered.height/2} stroke={rendered.stroke} strokeWidth={rendered.strokeWidth} strokeDasharray={dash(rendered.lineStyle)} markerStart={rendered.arrowHead==='both'?`url(#start-${rendered.id})`:undefined} markerEnd={rendered.arrowHead==='none'?undefined:`url(#end-${rendered.id})`}/></>}</svg></div>;")
replace('export.ts', "import { fontStackForText } from './typography';", "import { fontStackForText } from './typography';\nimport { lineSvgBody } from './lineGeometry';")
replace('export.ts', "function renderArrow(object:Extract<BioPlotObject,{type:'arrow'}>){return", "function renderArrow(object:Extract<BioPlotObject,{type:'arrow'}>){if(object.startPoint&&object.endPoint)return `<g transform=\"${transform(object)}\" opacity=\"${object.opacity}\">${lineSvgBody(object)}</g>`;return")

replace('EditorInspector.tsx',
    "  const change = (patch: Partial<ConnectorObject>, label: string) => onCommit(label, object => {",
    "  const change = (patch: Partial<ConnectorObject> | Partial<Extract<BioPlotObject,{type:'arrow'}>>, label: string) => onCommit(label, object => {")
replace('EditorInspector.tsx',
    "    <label className=\"property-stack\"><span>{fa ? 'سر فلش' : 'Arrow head'}</span>",
    """    {single.type==='arrow'&&<><label className="property-stack"><span>{fa?'رنگ خط':'Line color'}</span><input type="color" value={single.stroke} onChange={e=>change({stroke:e.target.value},'Line color')}/></label><div className="property-grid">{(['startHead','endHead'] as const).map(field=><label key={field}><span>{field==='startHead'?(fa?'ابتدای خط':'Start'):(fa?'انتهای خط':'End')}</span><select value={single[field]??(field==='startHead'?(single.arrowHead==='both'?'arrow':'none'):(single.arrowHead==='none'?'none':'arrow'))} onChange={e=>change({[field]:e.target.value as 'none'|'arrow'|'circle'|'bar'|'diamond'},'Line endpoint style')}>{(['none','arrow','circle','bar','diamond'] as const).map(head=><option key={head} value={head}>{head}</option>)}</select></label>)}</div></>}
    <label className="property-stack"><span>{fa ? 'سر فلش' : 'Arrow head'}</span>""")

replace('EditorStudio.tsx', "import { EditorObjectView } from './EditorObjectView';", "import { EditorObjectView } from './EditorObjectView';\nimport { createDrawnLine, updateLineEndpoint, type DrawLineSettings } from './lineGeometry';")
replace('EditorStudio.tsx', "import './editor-studio.css';", "import './editor-studio.css';\nimport './line-drawing.css';")
replace('EditorStudio.tsx', "  const [showGrid,setShowGrid]=useState(false);", "  const [showGrid,setShowGrid]=useState(false);\n  const [lineTool,setLineTool]=useState<DrawLineSettings|null>(null);\n  const [linePreview,setLinePreview]=useState<{sx:number;sy:number;ex:number;ey:number}|null>(null);")
replace('EditorStudio.tsx', "  const page=activePage(documentState);", "  const page=activePage(documentState);\n  useEffect(()=>{const activate=(event:Event)=>{setLineTool((event as CustomEvent<DrawLineSettings>).detail);setSelected(new Set());setAssetEditOpen(false);setPanel('lines');setLibraryCollapsed(false);};window.addEventListener('bioplot:activate-line',activate);return()=>window.removeEventListener('bioplot:activate-line',activate);},[]);")
replace('EditorStudio.tsx', "      if(event.key==='Escape'){setSelected(new Set());setAssetEditOpen(false);setContextMenu(null);return;}", "      if(event.key==='Escape'){setLineTool(null);setLinePreview(null);setSelected(new Set());setAssetEditOpen(false);setContextMenu(null);return;}")

replace('EditorStudio.tsx',
    "  function beginMarquee(event:ReactPointerEvent<HTMLDivElement>){if(event.target!==event.currentTarget||!artboardRef.current)return;",
    """  function beginLineDraw(event:ReactPointerEvent<HTMLDivElement>){
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
  function beginLineEndpoint(event:ReactPointerEvent,which:'start'|'end'){
    event.preventDefault();event.stopPropagation();
    const line=selectedObjects.length===1&&selectedObjects[0].type==='arrow'?selectedObjects[0]:null;
    if(!line||!line.startPoint||!line.endPoint||line.locked||!artboardRef.current)return;
    const before=[structuredClone(line)];const rect=artboardRef.current.getBoundingClientRect();
    const move=(pointer:PointerEvent)=>{const point={x:(pointer.clientX-rect.left)/zoom,y:(pointer.clientY-rect.top)/zoom};storeRef.current.preview([updateLineEndpoint(line,which,point)]);};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);const changed=activePage(storeRef.current.snapshot).objects.find(item=>item.id===line.id);if(changed)storeRef.current.commitObjectState(before,[structuredClone(changed)],'Move line endpoint');};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  }
  function beginMarquee(event:ReactPointerEvent<HTMLDivElement>){if(lineTool){beginLineDraw(event);return;}if(event.target!==event.currentTarget||!artboardRef.current)return;""")
replace('EditorStudio.tsx', "      <section className=\"studio-canvas-zone\"><div className=\"studio-canvas-scroll\"", "      <section className={`studio-canvas-zone ${lineTool?'bp-line-drawing':''}`}><div className=\"studio-canvas-scroll\"")
replace('EditorStudio.tsx', "onPointerDown={beginMarquee}>{renderObjects.map(object=>", "onPointerDown={beginMarquee}>{linePreview&&<svg aria-hidden=\"true\" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',overflow:'visible',zIndex:200}}><line x1={linePreview.sx} y1={linePreview.sy} x2={linePreview.ex} y2={linePreview.ey} stroke={lineTool?.stroke||'#087f79'} strokeWidth={lineTool?.strokeWidth||2} strokeDasharray=\"5 4\"/></svg>}{renderObjects.map(object=>")
replace('EditorStudio.tsx',
    "{['nw','n','ne','e','se','s','sw','w'].map(handle=><button key={handle} className={`studio-handle ${handle}`} onPointerDown={event=>beginResize(event,handle)}/>)}</div>",
    "{['nw','n','ne','e','se','s','sw','w'].map(handle=><button key={handle} className={`studio-handle ${handle}`} onPointerDown={event=>beginResize(event,handle)}/>)}{selectedObjects.length===1&&selectedObjects[0].type==='arrow'&&selectedObjects[0].startPoint&&selectedObjects[0].endPoint&&(['start','end'] as const).map(which=><button key={which} type=\"button\" className=\"bp-line-endpoint\" title={which==='start'?'Drag start point':'Drag end point'} style={{left:`${(which==='start'?selectedObjects[0].startPoint!.x:selectedObjects[0].endPoint!.x)*100}%`,top:`${(which==='start'?selectedObjects[0].startPoint!.y:selectedObjects[0].endPoint!.y)*100}%`}} onPointerDown={event=>beginLineEndpoint(event,which)}/>)}</div>")
replace('EditorStudio.tsx', "    <main className=\"studio-workspace\" style={{gridTemplateColumns:columns}}>", "    <main className=\"studio-workspace\" style={{gridTemplateColumns:columns}}>{lineTool&&<div className=\"bp-line-tool-banner\" role=\"status\">{fa?'روی بوم بکشید؛ Esc برای لغو':'Drag on canvas to draw · Esc to cancel'}</div>}")

replace('VectorStudio.tsx', "  const insert = async (preset: Preset) => {",
    """  const armNative=(preset:Preset)=>{
    const kind=preset.id==='double'?'both':preset.id==='inhibition'?'bar':preset.id==='straight'?'none':'end';
    const settings:DrawLineSettings={stroke:color,strokeWidth:width,lineStyle:preset.style==='dashed'?'dashed':preset.style==='dotted'?'dotted':'solid',startHead:kind==='both'?'arrow':'none',endHead:kind==='none'?'none':kind==='bar'?'bar':'arrow',axis:preset.id==='horizontal'?'horizontal':preset.id==='vertical'?'vertical':undefined};
    window.dispatchEvent(new CustomEvent('bioplot:activate-line',{detail:settings}));
    setMessage(fa?'ابزار فعال است؛ روی بوم بکشید.':'Tool active; drag on canvas.');
  };
  const insert = async (preset: Preset) => {""")
replace('VectorStudio.tsx', "import type { ScientificAsset } from './assets';", "import type { ScientificAsset } from './assets';\nimport type { DrawLineSettings } from './lineGeometry';")
replace('VectorStudio.tsx', "      if (preset.native) {", "      if (preset.native==='straight'||preset.native==='arrow') { armNative(preset); } else if (preset.native) {")
replace('VectorStudio.tsx', "      } else await importAsCanvasImage(svgFor(preset, color, width), `BioPlot-${preset.id}.svg`);", "      } else if (['horizontal','vertical','dashed','dotted','double','activation','inhibition'].includes(preset.id)) armNative(preset); else await importAsCanvasImage(svgFor(preset, color, width), `BioPlot-${preset.id}.svg`);")
print('All anchored edits applied. Run typecheck and production build before committing.')
