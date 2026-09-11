import { Bounds, selectionBounds } from './engine';
import { BioPlotObject } from './model';

type Tab = 'properties'|'layers';

export function EditorInspector({ fa, tab, setTab, bounds, selectedObjects, objects, selected, onBounds, onCommit, onLock, onHide, onSelect, onLayerStep, onToggleObjectLock, onToggleObjectHidden, onCollapse }:{
  fa:boolean;
  tab:Tab;
  setTab:(tab:Tab)=>void;
  bounds:Bounds|null;
  selectedObjects:BioPlotObject[];
  objects:BioPlotObject[];
  selected:Set<string>;
  onBounds:(field:'x'|'y'|'width'|'height',value:number)=>void;
  onCommit:(label:string,transform:(object:BioPlotObject)=>BioPlotObject)=>void;
  onLock:(locked:boolean)=>void;
  onHide:()=>void;
  onSelect:(object:BioPlotObject)=>void;
  onLayerStep:(id:string,action:'forward'|'backward')=>void;
  onToggleObjectLock:(object:BioPlotObject)=>void;
  onToggleObjectHidden:(object:BioPlotObject)=>void;
  onCollapse:()=>void;
}) {
  return <aside className="studio-inspector">
    <div className="inspector-tabs"><button className={tab==='properties'?'active':''} onClick={()=>setTab('properties')}>{fa?'ویژگی‌ها':'Properties'}</button><button className={tab==='layers'?'active':''} onClick={()=>setTab('layers')}>{fa?'لایه‌ها':'Layers'}</button><button className="collapse-inspector" onClick={onCollapse}>×</button></div>
    {tab==='properties'
      ? <Properties fa={fa} bounds={bounds} selectedObjects={selectedObjects} onBounds={onBounds} onCommit={onCommit} onLock={onLock} onHide={onHide}/>
      : <div className="studio-layers">{objects.slice().reverse().map(object=><div key={object.id} className={`${selected.has(object.id)?'active':''} ${object.hidden?'hidden-layer':''}`}><button className="layer-main" onClick={()=>onSelect(object)}><i>{object.type.slice(0,1).toUpperCase()}</i><span><b>{object.name}</b><small>{object.type}{object.groupId?' · group':''}</small></span></button><div className="layer-actions"><button title="Show/hide" onClick={()=>onToggleObjectHidden(object)}>{object.hidden?'○':'●'}</button><button title="Lock/unlock" onClick={()=>onToggleObjectLock(object)}>{object.locked?'⌑':'◇'}</button><button title="Move up" onClick={()=>onLayerStep(object.id,'forward')}>↑</button><button title="Move down" onClick={()=>onLayerStep(object.id,'backward')}>↓</button></div></div>)}</div>}
  </aside>;
}

function Properties({ fa, bounds, selectedObjects, onBounds, onCommit, onLock, onHide }:{
  fa:boolean;
  bounds:ReturnType<typeof selectionBounds>;
  selectedObjects:BioPlotObject[];
  onBounds:(field:'x'|'y'|'width'|'height',value:number)=>void;
  onCommit:(label:string,transform:(object:BioPlotObject)=>BioPlotObject)=>void;
  onLock:(locked:boolean)=>void;
  onHide:()=>void;
}) {
  const single = selectedObjects.length===1?selectedObjects[0]:null;
  const opacity = selectedObjects.length?selectedObjects.reduce((sum,object)=>sum+object.opacity,0)/selectedObjects.length:1;

  let primaryColor = '#0b7a75';
  if (single?.type==='text'||single?.type==='label') primaryColor=single.color;
  else if (single?.type==='shape'||single?.type==='container') primaryColor=single.fill;
  else if (single?.type==='arrow'||single?.type==='connector') primaryColor=single.stroke;

  return <div className="studio-properties">
    <div className="property-selection"><small>SELECTION</small><h2>{selectedObjects.length===0?(fa?'بدون انتخاب':'No selection'):single?single.name:`${selectedObjects.length} ${fa?'آبجکت':'objects'}`}</h2>{single&&<span>{single.type}</span>}</div>
    <section><h3>{fa?'موقعیت و اندازه':'Position & size'}</h3><div className="property-grid">{(['x','y','width','height'] as const).map(field=><label key={field}><span>{field==='width'?'W':field==='height'?'H':field.toUpperCase()}</span><input disabled={!bounds} type="number" value={bounds?Math.round(bounds[field]):''} onChange={event=>onBounds(field,Number(event.target.value))}/></label>)}</div></section>
    <section><h3>{fa?'وضعیت':'Object state'}</h3><div className="property-actions"><button disabled={!selectedObjects.length} onClick={()=>onLock(!selectedObjects.every(object=>object.locked))}>{selectedObjects.every(object=>object.locked)?'Unlock':'Lock'}</button><button disabled={!selectedObjects.length} onClick={onHide}>{fa?'مخفی':'Hide'}</button></div></section>
    <section><h3>{fa?'ظاهر':'Appearance'}</h3><label className="property-range"><span>{fa?'شفافیت':'Opacity'}</span><input disabled={!selectedObjects.length} type="range" min="5" max="100" value={Math.round(opacity*100)} onChange={event=>{const value=Number(event.target.value)/100;onCommit('Opacity',object=>({...object,opacity:value}));}}/><em>{Math.round(opacity*100)}%</em></label>{single&&!['asset','image','plot'].includes(single.type)&&<label className="property-color"><span>{fa?'رنگ اصلی':'Primary color'}</span><input type="color" value={primaryColor} onChange={event=>{const color=event.target.value;onCommit('Color',object=>{
      if(object.type==='text') return {...object,color};
      if(object.type==='label') return {...object,color};
      if(object.type==='shape') return {...object,fill:color};
      if(object.type==='container') return {...object,fill:color};
      if(object.type==='arrow') return {...object,stroke:color};
      if(object.type==='connector') return {...object,stroke:color};
      return object;
    });}}/></label>}</section>
    {single&&(single.type==='text'||single.type==='label')&&<section><h3>{fa?'متن':'Text'}</h3><label className="property-stack"><span>{fa?'محتوا':'Content'}</span><textarea value={single.text} onChange={event=>{const text=event.target.value;onCommit('Edit text',object=>{
      if(object.id!==single.id) return object;
      if(object.type==='text'||object.type==='label') return {...object,text,name:text.slice(0,32)||'Text'};
      return object;
    });}}/></label><div className="property-grid"><label><span>Size</span><input type="number" value={single.fontSize} onChange={event=>{const fontSize=Number(event.target.value);onCommit('Font size',object=>object.id===single.id&&(object.type==='text'||object.type==='label')?{...object,fontSize}:object);}}/></label><label><span>Weight</span><select value={single.fontWeight} onChange={event=>{const fontWeight=Number(event.target.value);onCommit('Font weight',object=>object.id===single.id&&(object.type==='text'||object.type==='label')?{...object,fontWeight}:object);}}><option value="400">400</option><option value="500">500</option><option value="600">600</option><option value="700">700</option><option value="800">800</option></select></label></div></section>}
    {single&&(single.type==='arrow'||single.type==='connector')&&<section><h3>{fa?'خط و فلش':'Line & arrow'}</h3><label className="property-stack"><span>{fa?'نوع خط':'Line style'}</span><select value={single.lineStyle??'solid'} onChange={event=>{const lineStyle=event.target.value as 'solid'|'dashed'|'dotted';onCommit('Line style',object=>object.id===single.id&&(object.type==='arrow'||object.type==='connector')?{...object,lineStyle}:object);}}><option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option></select></label><label className="property-stack"><span>{fa?'سر فلش':'Arrow head'}</span><select value={single.arrowHead} onChange={event=>{const value=event.target.value;onCommit('Arrow head',object=>{
      if(object.id!==single.id) return object;
      if(object.type==='arrow'&&(value==='end'||value==='both'||value==='none')) return {...object,arrowHead:value};
      if(object.type==='connector'&&(value==='end'||value==='both'||value==='none'||value==='inhibition')) return {...object,arrowHead:value};
      return object;
    });}}><option value="end">End</option><option value="both">Both</option><option value="none">None</option>{single.type==='connector'&&<option value="inhibition">Inhibition</option>}</select></label></section>}
    {single&&single.type==='image'&&<section><h3>{fa?'تصویر':'Image'}</h3><div className="property-actions"><button className={single.fit==='contain'?'active':''} onClick={()=>onCommit('Image fit',object=>object.id===single.id&&object.type==='image'?{...object,fit:'contain'}:object)}>Contain</button><button className={single.fit==='cover'?'active':''} onClick={()=>onCommit('Image fit',object=>object.id===single.id&&object.type==='image'?{...object,fit:'cover'}:object)}>Cover</button></div></section>}
  </div>;
}
