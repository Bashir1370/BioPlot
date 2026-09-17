import type {BioPlotObject,ShapeObject} from './model';
import {SHAPE_CATALOG} from './shapeGeometry';
export function patchShape(object:BioPlotObject,id:string,patch:Partial<ShapeObject>):BioPlotObject{
  return object.id===id&&object.type==='shape'&&!object.locked?{...object,...patch,id:object.id,type:'shape'}:object;
}
export function ShapeControls({object,fa,onCommit}:{object:ShapeObject;fa:boolean;onCommit:(label:string,change:(item:BioPlotObject)=>BioPlotObject)=>void}){
  const change=(patch:Partial<ShapeObject>,label:string)=>onCommit(label,item=>patchShape(item,object.id,patch));
  return <fieldset className="shape-controls" disabled={!!object.locked}>
    <label>{fa?'شکل':'Shape'}<select value={object.shape} onChange={e=>change({shape:e.target.value as ShapeObject['shape'],...(e.target.value==='circle'?{height:object.width}:{}),...(e.target.value==='rounded'?{radius:16}:e.target.value==='rect'?{radius:0}:{})},'Shape type')}>{SHAPE_CATALOG.map(s=><option key={s.shape} value={s.shape}>{fa?s.fa:s.en}</option>)}</select></label>
    <label>{fa?'رنگ داخل':'Fill'}<input type="color" aria-label={fa?'رنگ داخل':'Fill color'} value={object.fill==='none'?'#ffffff':object.fill} onChange={e=>change({fill:e.target.value},'Shape fill')}/></label>
    <label className="shape-check"><input type="checkbox" checked={object.fill==='none'} onChange={e=>change({fill:e.target.checked?'none':'#dff2ef'},'Shape fill')}/>{fa?'بدون رنگ داخل':'No fill'}</label>
    <label>{fa?'رنگ حاشیه':'Border color'}<input type="color" value={object.stroke} onChange={e=>change({stroke:e.target.value},'Shape border color')}/></label>
    <label>{fa?'ضخامت حاشیه':'Border width'}<input type="number" min="0" max="40" step=".5" value={object.strokeWidth} onChange={e=>{if(e.target.value)change({strokeWidth:Math.max(0,Math.min(40,Number(e.target.value)||0))},'Shape border width');}}/></label>
    <label>{fa?'نوع حاشیه':'Border style'}<select value={object.lineStyle??'solid'} onChange={e=>change({lineStyle:e.target.value as ShapeObject['lineStyle']},'Shape border style')}><option value="solid">{fa?'پیوسته':'Solid'}</option><option value="dashed">{fa?'خط‌چین':'Dashed'}</option><option value="dotted">{fa?'نقطه‌چین':'Dotted'}</option></select></label>
    {(object.shape==='rect'||object.shape==='rounded')&&<label>{fa?'گردی گوشه':'Corner radius'}<input type="number" min="0" max={Math.min(object.width,object.height)/2} value={object.radius} onChange={e=>change({radius:Math.max(0,Math.min(object.width/2,object.height/2,Number(e.target.value)||0))},'Shape corners')}/></label>}
    <label>{fa?'شفافیت':'Opacity'}<input type="range" min="0" max="100" value={Math.round(object.opacity*100)} onChange={e=>change({opacity:Number(e.target.value)/100},'Shape opacity')}/><output>{Math.round(object.opacity*100)}%</output></label>
  </fieldset>;
}
