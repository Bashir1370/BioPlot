import { useEffect, useLayoutEffect } from 'react';
import { getAssetCatalog, ScientificAsset } from './assets';
import { AssetObject } from './model';
import { ASSET_STYLE_PRESETS, applyAssetPreset, applyConfiguredAssetPreset, AssetStylePresetConfig, assetCssFilter, consumeAssetStyleAutoOpenFromLibrary, normalizedAssetVisualStyle, recolorAssetSlot, resetAssetVisualStyle, StyledAssetObject, tintAssetSvg } from './assetStyling';
import { StudioIcon } from './StudioIcon';
import './asset-style-panel.css';

type AssetWithPresets = ScientificAsset & { stylePresets?: AssetStylePresetConfig[] };

function RangeRow({label,value,min,max,unit='%',onChange}:{label:string;value:number;min:number;max:number;unit?:string;onChange:(value:number)=>void}){
  return <label className="asset-style-range"><span>{label}</span><input type="number" min={min} max={max} value={Math.round(value)} onChange={event=>onChange(Number(event.target.value))}/><input type="range" min={min} max={max} value={value} onChange={event=>onChange(Number(event.target.value))}/><em>{unit}</em></label>;
}

export function AssetStylePanel({fa,object,onChange,onBrowse}:{fa:boolean;object:StyledAssetObject;onChange:(label:string,next:StyledAssetObject)=>void;onBrowse:()=>void}){
  const style=normalizedAssetVisualStyle(object);
  const original=getAssetCatalog(true).find(asset=>asset.id===object.assetId) as AssetWithPresets|undefined;
  const originalColors:AssetObject['colors']|undefined=original?.colorSlots.map(slot=>({key:slot.key,label:slot.label,value:slot.defaultValue}));
  const configuredPresets=original?.stylePresets;
  const setStyle=(label:string,patch:Partial<typeof style>)=>onChange(label,{...object,assetStyle:{...style,...patch}});
  const previewFilter=assetCssFilter(object);

  // Selection on the canvas can transiently request the style panel. Resolve that
  // before the browser paints so the Library never flashes for a single frame.
  useLayoutEffect(()=>{
    if(!consumeAssetStyleAutoOpenFromLibrary()) onBrowse();
  },[object.id,onBrowse]);

  useEffect(()=>{
    const dismissFromCanvas=(event:PointerEvent)=>{
      const target=event.target;
      if(target instanceof Element&&target.closest('.studio-artboard')) onBrowse();
    };
    window.addEventListener('pointerdown',dismissFromCanvas,true);
    return()=>window.removeEventListener('pointerdown',dismissFromCanvas,true);
  },[onBrowse]);

  return <div className="asset-style-panel">
    <div className="asset-style-titlebar">
      <button className="asset-style-back" onClick={onBrowse} title={fa?'بازگشت به کتابخانه':'Back to library'} aria-label={fa?'بازگشت به کتابخانه':'Back to library'}><StudioIcon name="arrow"/></button>
      <div><small>{fa?'ویرایش المان علمی':'EDIT SCIENTIFIC ASSET'}</small><h2>{object.name}</h2></div>
    </div>

    <div className="asset-style-preview" aria-hidden="true"><div style={{filter:previewFilter}} dangerouslySetInnerHTML={{__html:object.svg}}/></div>

    <section className="asset-style-section">
      <div className="asset-style-section-head"><div><b>{fa?'استایل':'Style'}</b><small>{fa?'پریست‌های سریع':'Quick presets'}</small></div><button onClick={()=>onChange('Reset asset style',resetAssetVisualStyle(object,original?.svg,originalColors))}>{fa?'بازنشانی':'Reset styles'}</button></div>
      {configuredPresets===undefined?<div className="asset-style-presets">
        {ASSET_STYLE_PRESETS.map(preset=><button key={preset.id} onClick={()=>onChange(`Apply ${preset.label} style`,applyAssetPreset(object,preset.id))} title={fa?preset.labelFa:preset.label}><span style={{filter:`saturate(${preset.saturation}%) brightness(${preset.brightness}%) contrast(${preset.contrast}%) hue-rotate(${preset.hueRotate}deg)`}} dangerouslySetInnerHTML={{__html:object.svg}}/><small>{fa?preset.labelFa:preset.label}</small></button>)}
      </div>:configuredPresets.length?<div className="asset-style-presets">
        {configuredPresets.map(preset=>{
          const source=original?.svg??object.svg;
          const preview=preset.kind==='original'?source:tintAssetSvg(source,preset.color??'#087f79');
          return <button key={preset.id} onClick={()=>onChange(`Apply ${preset.label} style`,applyConfiguredAssetPreset(object,preset,original?.svg,originalColors))} title={fa&&preset.labelFa?preset.labelFa:preset.label}><span dangerouslySetInnerHTML={{__html:preview}}/><small>{fa&&preset.labelFa?preset.labelFa:preset.label}</small></button>;
        })}
      </div>:<p className="asset-style-empty">{fa?'برای این المان پریست رنگی تعریف نشده است.':'No color presets are configured for this asset.'}</p>}
    </section>

    {object.colors.length>0&&<section className="asset-style-section">
      <div className="asset-style-section-head"><div><b>{fa?'رنگ‌های شکل':'Vector colors'}</b><small>{fa?'رنگ اجزای SVG را تغییر بده':'Edit SVG color slots'}</small></div></div>
      <div className="asset-color-slots">{object.colors.map((slot,index)=><label key={`${slot.key}-${index}`}><span>{slot.label||slot.key}</span><input type="color" value={/^#[0-9a-f]{6}$/i.test(slot.value)?slot.value:'#087b76'} onChange={event=>onChange(`Change ${slot.label||slot.key} color`,recolorAssetSlot(object,index,event.target.value))}/><code>{slot.value}</code></label>)}</div>
    </section>}

    <section className="asset-style-section">
      <div className="asset-style-section-head"><div><b>{fa?'تنظیم ظاهر':'Appearance'}</b><small>{object.colors.length?fa?'تنظیمات کلی شکل':'Global appearance':fa?'برای PNG و تصاویر رستری':'Works with PNG and raster assets'}</small></div></div>
      <div className="asset-style-controls">
        <RangeRow label={fa?'شفافیت':'Transparency'} value={(1-object.opacity)*100} min={0} max={100} onChange={value=>onChange('Change asset transparency',{...object,opacity:Math.max(0,Math.min(1,1-value/100))})}/>
        <RangeRow label={fa?'اشباع رنگ':'Saturation'} value={style.saturation} min={0} max={200} onChange={value=>setStyle('Change asset saturation',{saturation:value})}/>
        <RangeRow label={fa?'روشنایی':'Brightness'} value={style.brightness} min={40} max={180} onChange={value=>setStyle('Change asset brightness',{brightness:value})}/>
        <RangeRow label={fa?'کنتراست':'Contrast'} value={style.contrast} min={40} max={180} onChange={value=>setStyle('Change asset contrast',{contrast:value})}/>
        <RangeRow label={fa?'تن رنگ':'Hue'} value={style.hueRotate} min={-180} max={180} unit="°" onChange={value=>setStyle('Change asset hue',{hueRotate:value})}/>
        <RangeRow label={fa?'درخشش':'Glow'} value={style.glow} min={0} max={24} unit="px" onChange={value=>setStyle('Change asset glow',{glow:value})}/>
      </div>
    </section>

    <div className="asset-style-footer"><button onClick={onBrowse}><StudioIcon name="search"/>{fa?'بازگشت به کتابخانه و جایگزینی':'Browse / replace asset'}</button></div>
  </div>;
}
