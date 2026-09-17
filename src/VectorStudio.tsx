import { useEffect, useMemo, useState } from 'react';
import { getAssetCatalog, type ScientificAsset } from './assets';
import { nativePresetSvg, parseNativeLinePreset, type DrawLineSettings } from './lineGeometry';
import { CUSTOM_LINE, LINE_CATEGORIES, LINE_CATEGORY, LINE_PRESETS, lineCategoryOf, type LineCategoryId } from './lineCatalog';
import { StudioIcon } from './StudioIcon';
import './vector-studio.css';

export function VectorStudio({fa}:{fa:boolean}) {
  const [category,setCategory]=useState<LineCategoryId>('lines');
  const [libraryVersion,setLibraryVersion]=useState(0);
  const [message,setMessage]=useState('');
  const published=useMemo(()=>getAssetCatalog().filter(asset=>asset.category===LINE_CATEGORY),[libraryVersion]);
  useEffect(()=>{
    const refresh=()=>setLibraryVersion(value=>value+1);
    window.addEventListener('bioplot:asset-library-changed',refresh);
    return()=>window.removeEventListener('bioplot:asset-library-changed',refresh);
  },[]);
  const insert=(settings:DrawLineSettings)=>{
    window.dispatchEvent(new CustomEvent('bioplot:insert-native-line',{detail:settings}));
    setMessage(fa?'خط اضافه شد':'Line added');
  };
  const insertAsset=(asset:ScientificAsset)=>{
    const settings=parseNativeLinePreset(asset.svg);
    if(settings){insert(settings);return;}
    window.dispatchEvent(new CustomEvent('bioplot:insert-line-asset',{detail:asset}));
    setMessage(fa?'تصویر اضافه شد':'Image added');
  };
  const presets=LINE_PRESETS.filter(preset=>preset.category===category);
  const assets=published.filter(asset=>lineCategoryOf(asset)===category);
  const current=LINE_CATEGORIES.find(item=>item.id===category)!;
  return <div className="bp-line-browser" dir={fa?'rtl':'ltr'}>
    <nav className="bp-line-categories" aria-label={fa?'دسته‌های خطوط':'Line categories'}>
      {LINE_CATEGORIES.map(item=><button key={item.id} type="button" aria-pressed={category===item.id} aria-controls="line-category-gallery" className={category===item.id?'active':''} onClick={()=>{setCategory(item.id);setMessage('');}}>
        <span className="bp-category-symbol" aria-hidden="true" dangerouslySetInnerHTML={{__html:nativePresetSvg({...LINE_PRESETS.find(preset=>preset.category===item.id)!.settings,stroke:'#40515c',strokeWidth:3})}}/>
        <span>{fa?item.fa:item.en}</span><span className="bp-category-chevron" aria-hidden="true">›</span>
      </button>)}
      <button className="bp-line-custom" type="button" onClick={()=>{
        window.dispatchEvent(new CustomEvent('bioplot:activate-line',{detail:CUSTOM_LINE}));
        setMessage(fa?'روی بوم بکشید؛ Esc برای لغو':'Drag on canvas · Esc to cancel');
      }}><StudioIcon name="edit"/><span>{fa?'رسم دلخواه':'Custom'}</span></button>
    </nav>
    <section id="line-category-gallery" className="bp-line-gallery" aria-label={fa?current.fa:current.en}>
      <div className="bp-line-gallery-grid">
        {presets.map(preset=><button type="button" key={preset.id} title={fa?preset.fa:preset.en} aria-label={fa?`افزودن ${preset.fa}`:`Add ${preset.en}`} onClick={()=>insert(preset.settings)}>
          <span aria-hidden="true" dangerouslySetInnerHTML={{__html:nativePresetSvg({...preset.settings,stroke:'#40515c',strokeWidth:3})}}/>
        </button>)}
      </div>
      {assets.length>0&&<div className="bp-line-gallery-grid bp-published-lines">{assets.map(asset=><button type="button" key={asset.id} title={fa?asset.nameFa||asset.name:asset.name} aria-label={fa?`افزودن ${asset.nameFa||asset.name}`:`Add ${asset.name}`} onClick={()=>insertAsset(asset)}><span aria-hidden="true" dangerouslySetInnerHTML={{__html:asset.svg}}/></button>)}</div>}
    </section>
    <p className="bp-line-browser-status" role="status">{message}</p>
  </div>;
}
