import type {BioPlotObject, LabelObject, TextObject} from './model';
import {SCIENTIFIC_FONTS, fontStackForText} from './typography';

type TextItem = TextObject | LabelObject;
export function patchTextItem(object:BioPlotObject,id:string,patch:Partial<TextItem>):BioPlotObject {
  if(object.id!==id||object.locked||(object.type!=='text'&&object.type!=='label'))return object;
  return {...object,...patch,id:object.id,type:object.type} as TextItem;
}
export function FloatingTextControls({object,fa,onCommit}:{object:TextItem;fa:boolean;onCommit:(label:string,change:(item:BioPlotObject)=>BioPlotObject)=>void}) {
  const change=(patch:Partial<TextItem>,label:string)=>onCommit(label,item=>patchTextItem(item,object.id,patch));
  return <fieldset className="floating-text-controls" disabled={!!object.locked}>
    <div className="floating-text-row">
      <select aria-label={fa?'فونت':'Font'} value={object.fontFamily||'Inter'} onChange={e=>change({fontFamily:e.target.value},'Font family')} style={{fontFamily:fontStackForText(object.text,object.fontFamily)}}>
        {SCIENTIFIC_FONTS.map(font=><option key={font} value={font}>{font}</option>)}
      </select>
      <input aria-label={fa?'اندازه فونت':'Font size'} type="number" min="6" max="200" value={object.fontSize} onChange={e=>{if(e.target.value)change({fontSize:Math.max(6,Math.min(200,Number(e.target.value)||16))},'Font size');}}/>
      <button type="button" aria-label={fa?'پررنگ':'Bold'} aria-pressed={object.fontWeight>=700} onClick={()=>change({fontWeight:object.fontWeight>=700?400:700},'Bold')}><b>B</b></button>
      <input type="color" aria-label={fa?'رنگ متن':'Text color'} title={fa?'رنگ متن':'Text color'} value={object.color} onChange={e=>change({color:e.target.value},'Text color')}/>
      <select aria-label={fa?'تراز متن':'Text alignment'} value={object.align} onChange={e=>change({align:e.target.value as TextItem['align']},'Text alignment')}>
        <option value="left">{fa?'چپ':'Left'}</option><option value="center">{fa?'وسط':'Center'}</option><option value="right">{fa?'راست':'Right'}</option>
      </select>
    </div>
    <textarea dir="auto" aria-label={fa?'متن':'Text content'} value={object.text} rows={2} onChange={e=>change({text:e.target.value,name:e.target.value.slice(0,32)||'Text'},'Edit text')}/>
    {object.type==='label'&&<div className="floating-text-row">
      <select aria-label={fa?'شکل کادر':'Frame shape'} value={object.frameShape??'rounded'} onChange={e=>{
        const frameShape=e.target.value as LabelObject['frameShape'];
        change({frameShape,...(frameShape==='circle'?{width:Math.max(object.width,object.height),height:Math.max(object.width,object.height)}:{})},'Frame shape');
      }}><option value="rect">{fa?'مستطیل':'Rectangle'}</option><option value="rounded">{fa?'گوشه‌گرد':'Rounded rectangle'}</option><option value="circle">{fa?'دایره':'Circle'}</option></select>
      <label>{fa?'زمینه':'Fill'}<input type="color" aria-label={fa?'رنگ کادر':'Frame fill'} value={object.background} onChange={e=>change({background:e.target.value},'Frame fill')}/></label>
      <label>{fa?'حاشیه':'Border'}<input type="color" aria-label={fa?'رنگ حاشیه':'Frame border'} value={object.borderColor} onChange={e=>change({borderColor:e.target.value},'Frame border')}/></label>
    </div>}
  </fieldset>;
}
