import { StudioIcon } from './StudioIcon';
import type { Bounds } from './engine';
import type { BioPlotObject } from './model';

type Commit = (label: string, transform: (object: BioPlotObject) => BioPlotObject) => void;

export function CompactSelectionProperties({fa,bounds,selectedObjects,onBounds,onCommit,onLock,onHide}:{
  fa:boolean;
  bounds:Bounds|null;
  selectedObjects:BioPlotObject[];
  onBounds:(field:'x'|'y'|'width'|'height',value:number)=>void;
  onCommit:Commit;
  onLock:(locked:boolean)=>void;
  onHide:()=>void;
}) {
  const single=selectedObjects.length===1?selectedObjects[0]:null;
  const opacity=selectedObjects.length?selectedObjects.reduce((sum,object)=>sum+object.opacity,0)/selectedObjects.length:1;
  const allLocked=selectedObjects.length>0&&selectedObjects.every(object=>object.locked);
  let primaryColor='#0b7a75';
  if(single?.type==='text'||single?.type==='label')primaryColor=single.color;
  else if(single?.type==='shape'||single?.type==='container')primaryColor=single.fill;
  else if(single?.type==='arrow'||single?.type==='connector')primaryColor=single.stroke;
  const title=single?single.name:selectedObjects.length?`${selectedObjects.length} ${fa?'آبجکت':'objects'}`:fa?'بدون انتخاب':'No selection';

  return <div className="studio-property-bar compact-property-tools" role="region" aria-label={fa?'ویژگی‌های انتخاب':'Selection properties'}>
    <span className="compact-selection-indicator" title={title} aria-label={title}><StudioIcon name="settings"/></span>

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

    <details className="compact-property-tool appearance-tool">
      <summary title={fa?'ظاهر':'Appearance'} aria-label={fa?'ظاهر':'Appearance'}><StudioIcon name="paint"/></summary>
      <div className="compact-property-popover appearance-popover">
        <strong>{fa?'ظاهر':'Appearance'}</strong>
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
