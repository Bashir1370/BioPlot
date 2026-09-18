import type { ScientificAsset } from './assets';
import type { DrawLineSettings } from './lineGeometry';
import type { LineCap } from './model';

export const LINE_CATEGORY='Lines & Arrows';
export const LINE_CATEGORIES=[
  {id:'arrows',en:'Arrows',fa:'فلش‌ها'},
  {id:'circular',en:'Circular',fa:'دایره‌ای'},
] as const;
export type LineCategoryId=typeof LINE_CATEGORIES[number]['id'];
const prefix='bioplot-line-category:';
export function lineCategoryOf(asset:Pick<ScientificAsset,'synonyms'>):LineCategoryId {
  const id=asset.synonyms.en.find(tag=>tag.startsWith(prefix))?.slice(prefix.length);
  return LINE_CATEGORIES.find(category=>category.id===id)?.id??'arrows';
}
export function lineCategoryTags(tags:string[],category:LineCategoryId){return [...tags.filter(tag=>!tag.startsWith(prefix)),prefix+category];}
export type LinePreset={id:string;en:string;fa:string;category:LineCategoryId;settings:DrawLineSettings};
export const CUSTOM_LINE:DrawLineSettings={stroke:'#087f79',strokeWidth:2,lineStyle:'solid',startHead:'none',endHead:'none',pathMode:'straight',presetId:'straight'};
// Keep the starter gallery small; published admin assets are listed separately.
export const LINE_PRESETS:readonly LinePreset[]=[
  {id:'arrow-straight',category:'arrows',en:'Straight arrow',fa:'فلش مستقیم',settings:{...CUSTOM_LINE,endHead:'arrow'}},
  {id:'arrow-curved',category:'arrows',en:'Curved arrow',fa:'فلش منحنی',settings:{...CUSTOM_LINE,presetId:'arc',pathMode:'curved',endHead:'arrow'}},
  {id:'arrow-double',category:'arrows',en:'Double arrow',fa:'فلش دوطرفه',settings:{...CUSTOM_LINE,startHead:'arrow',endHead:'arrow'}},
  ...(['none','arrow','both'] as const).map((head,index)=>({
    id:`circular-${head}`,category:'circular' as const,
    en:['Circular line','Circular arrow','Double circular arrow'][index],
    fa:['خط دایره‌ای','فلش دایره‌ای','فلش دایره‌ای دوطرفه'][index],
    settings:{...CUSTOM_LINE,presetId:'circular',pathMode:'curved' as const,
      startHead:(head==='both'?'arrow':'none') as LineCap,endHead:(head==='none'?'none':'arrow') as LineCap},
  })),
];
