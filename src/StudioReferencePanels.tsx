import { useMemo } from 'react';
import type { ScientificAsset } from './assets';
import { markAssetStyleAutoOpenFromLibrary } from './assetStyling';
import { documentToSvg } from './export';
import type { BioPlotDocument, BioPlotPage } from './model';
import { StudioIcon } from './StudioIcon';
import type { CanvasSettings } from './studioPages';

export function AssetCatalogView({fa,assets,grouped,favorites,onAdd,onFavorite,onCategory}:{fa:boolean;assets:ScientificAsset[];grouped:boolean;favorites:Set<string>;onAdd:(asset:ScientificAsset)=>void;onFavorite:(id:string)=>void;onCategory:(category:string)=>void}){
  const categories=[...new Set(assets.map(asset=>asset.category))];
  const addFromLibrary=(asset:ScientificAsset)=>{markAssetStyleAutoOpenFromLibrary();onAdd(asset);};
  const card=(asset:ScientificAsset)=>{const displayName=fa&&asset.nameFa?asset.nameFa:asset.name;return <div className="asset-card-wrap" key={asset.id}><button className="asset-main" onClick={()=>addFromLibrary(asset)} title={displayName} aria-label={fa?`افزودن ${displayName}`:`Add ${displayName}`}><span dangerouslySetInnerHTML={{__html:asset.svg}}/></button><button className={`asset-favorite ${favorites.has(asset.id)?'active':''}`} aria-pressed={favorites.has(asset.id)} aria-label={fa?`علاقه‌مندی: ${displayName}`:`Favorite ${displayName}`} onClick={()=>onFavorite(asset.id)}><StudioIcon name="star"/></button></div>;};
  if(!assets.length)return <p className="asset-empty">{fa?'المانی پیدا نشد.':'No matching assets.'}</p>;
  if(!grouped)return <div className="catalog-results"><span>{assets.length} {fa?'المان':'icons'}</span><div className="studio-assets">{assets.map(card)}</div></div>;
  return <div className="catalog-browse">
    <div className="catalog-intro"><strong>{fa?'کتابخانهٔ علمی BioPlot':'Explore BioPlot icons'}</strong><span>{fa?'برای افزودن به بوم، روی المان کلیک کن.':'Click an icon to add it to your canvas.'}</span></div>
    {categories.slice(0,3).map(category=><section className="catalog-section" key={category}><div><h3>{category}</h3><button onClick={()=>onCategory(category)}>{fa?'مشاهده همه':'View all'}<StudioIcon name="chevron"/></button></div><div className="studio-assets">{assets.filter(asset=>asset.category===category).slice(0,4).map(card)}</div></section>)}
    <section className="catalog-categories"><h3>{fa?'مرور دسته‌ها':'Browse categories'}</h3>{categories.map(category=>{const matching=assets.filter(asset=>asset.category===category);return <button key={category} onClick={()=>onCategory(category)}><span className="category-preview" dangerouslySetInnerHTML={{__html:matching[0].svg}}/><span>{category}<small>{matching.length} {fa?'المان':'icons'}</small></span><StudioIcon name="chevron"/></button>;})}</section>
  </div>;
}
export function StudioPagesPanel({fa,documentState,onSelect,onAdd,onClose}:{fa:boolean;documentState:BioPlotDocument;onSelect:(id:string)=>void;onAdd:()=>void;onClose:()=>void}){
  const previews=useMemo(()=>documentState.pages.map(page=>({page,src:`data:image/svg+xml;charset=utf-8,${encodeURIComponent(documentToSvg({...documentState,activePageId:page.id}))}`})),[documentState]);
  return <aside className="reference-pages" dir={fa?'rtl':'ltr'}><div className="reference-panel-title"><h2>{fa?'صفحه‌ها':'Slides'}</h2><button onClick={onClose} aria-label={fa?'بستن صفحه‌ها':'Close slides'}><StudioIcon name="close"/></button></div><div className="page-actions"><button onClick={onAdd}><StudioIcon name="plus"/><span>{fa?'صفحه جدید':'New slide'}</span></button><span>{documentState.pages.length}</span></div><div className="page-list">{previews.map(({page,src},index)=><button key={page.id} className={`page-card ${page.id===documentState.activePageId?'active':''}`} aria-current={page.id===documentState.activePageId?'page':undefined} onClick={()=>onSelect(page.id)}><span>{index+1}<b>{page.name}</b></span><img src={src} alt={fa?`پیش‌نمایش ${page.name}`:`Preview of ${page.name}`} style={{aspectRatio:`${page.width}/${page.height}`}}/></button>)}</div></aside>;
}
export function CanvasSettingsForm({fa,page,onSettings}:{fa:boolean;page:BioPlotPage;onSettings:(settings:CanvasSettings)=>void}){
  return <form key={`${page.id}-${page.width}-${page.height}-${page.background}`} className="canvas-settings-form" onSubmit={event=>{event.preventDefault();const data=new FormData(event.currentTarget);const width=Number(data.get('width')),height=Number(data.get('height'));if(!Number.isFinite(width)||!Number.isFinite(height)||width<100||height<100||width>5000||height>5000)return;onSettings({width,height,background:String(data.get('background')||page.background)});event.currentTarget.closest('details')?.removeAttribute('open');}}><strong>{fa?'اندازه بوم':'Canvas size'}</strong><label>{fa?'عرض':'Width'}<input name="width" type="number" min="100" max="5000" required defaultValue={page.width}/><span>px</span></label><label>{fa?'ارتفاع':'Height'}<input name="height" type="number" min="100" max="5000" required defaultValue={page.height}/><span>px</span></label><label>{fa?'رنگ بوم':'Background'}<input type="color" name="background" defaultValue={page.background}/></label><button type="submit">{fa?'اعمال':'Apply'}</button></form>;
}
