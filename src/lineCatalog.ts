import type { ScientificAsset } from './assets';
import type { DrawLineSettings } from './lineGeometry';
import type { LineCap } from './model';

export const LINE_CATEGORY='Lines & Arrows';
export const LINE_CATEGORIES=[
  {id:'lines',en:'Lines',fa:'خطوط'},
  {id:'arrows',en:'Arrows',fa:'فلش‌ها'},
  {id:'inhibitor',en:'Inhibitor',fa:'مهاری'},
  {id:'dots',en:'Dots',fa:'نقطه‌ها'},
  {id:'neurons',en:'Neurons',fa:'نورونی'},
  {id:'circular',en:'Circular',fa:'دایره‌ای'},
  {id:'brackets',en:'Brackets',fa:'براکت‌ها'},
] as const;
export type LineCategoryId=typeof LINE_CATEGORIES[number]['id'];
const prefix='bioplot-line-category:';
export function lineCategoryOf(asset:Pick<ScientificAsset,'synonyms'>):LineCategoryId {
  const id=asset.synonyms.en.find(tag=>tag.startsWith(prefix))?.slice(prefix.length);
  return LINE_CATEGORIES.find(category=>category.id===id)?.id??'lines';
}
export function lineCategoryTags(tags:string[],category:LineCategoryId){return [...tags.filter(tag=>!tag.startsWith(prefix)),prefix+category];}
export type LinePreset={id:string;en:string;fa:string;category:LineCategoryId;settings:DrawLineSettings};
export const CUSTOM_LINE:DrawLineSettings={stroke:'#087f79',strokeWidth:2,lineStyle:'solid',startHead:'none',endHead:'none',pathMode:'straight',presetId:'straight'};
const presets:LinePreset[]=[];
function add(category:LineCategoryId,geometry:string,en:string,fa:string,start:LineCap='none',end:LineCap='none'){
  const curved=['arc','s-curve','wave','curved','rounded-elbow','circular','semicircle','brace'].includes(geometry);
  const polygon=['elbow','corner','zigzag','bracket','square-bracket'].includes(geometry);
  for(const style of ['solid','dashed','dotted'] as const){
    presets.push({id:`${category}-${geometry}-${start}-${end}-${style}`,category,en:`${en} · ${style}`,fa:`${fa} · ${{solid:'پیوسته',dashed:'خط‌چین',dotted:'نقطه‌چین'}[style]}`,
      settings:{...CUSTOM_LINE,presetId:geometry,pathMode:curved?'curved':polygon?'polyline':'straight',lineStyle:style,startHead:start,endHead:end}});
  }
}
for(const [id,en,fa] of [['straight','Straight','مستقیم'],['corner','Corner','گوشه'],['rounded-elbow','Rounded elbow','گوشه گرد'],['elbow','Elbow','زاویه‌دار'],['arc','Arc','کمان'],['semicircle','Arch','قوس'],['s-curve','S curve','منحنی S'],['wave','Wave','موجی'],['zigzag','Zigzag','زیگزاگ']])add('lines',id,en,fa);
for(const [id,en,fa] of [['straight','Arrow','فلش'],['corner','Corner arrow','فلش گوشه'],['elbow','Elbow arrow','فلش زاویه‌دار'],['arc','Arc arrow','فلش منحنی'],['s-curve','S arrow','فلش S']])add('arrows',id,en,fa,'none','arrow');
add('arrows','straight','Double arrow','فلش دوطرفه','arrow','arrow');
add('arrows','straight','Open arrow','فلش باز','none','open-arrow');
for(const [id,en,fa] of [['straight','Inhibition','مهاری'],['elbow','Elbow inhibition','مهاری زاویه‌دار'],['arc','Curved inhibition','مهاری منحنی']])add('inhibitor',id,en,fa,'none','bar');
add('inhibitor','straight','Double inhibition','مهاری دوطرفه','bar','bar');
for(const [id,en,fa] of [['straight','Dot line','خط نقطه‌دار'],['elbow','Elbow dot','نقطه زاویه‌دار'],['arc','Curved dot','نقطه منحنی']])add('dots',id,en,fa,'none','filled-circle');
add('dots','straight','Double dots','دو نقطه','filled-circle','filled-circle');
for(const [id,en,fa] of [['straight','Neural connection','اتصال نورونی'],['elbow','Elbow neural connection','اتصال نورونی زاویه‌دار'],['arc','Curved neural connection','اتصال نورونی منحنی'],['s-curve','S neural connection','اتصال نورونی S']])add('neurons',id,en,fa,'chevron','filled-circle');
add('circular','circular','Circular line','خط دایره‌ای');
add('circular','circular','Circular arrow','فلش دایره‌ای','none','arrow');
add('circular','circular','Double circular arrow','فلش دایره‌ای دوطرفه','arrow','arrow');
add('brackets','square-bracket','Square bracket','براکت مربعی');
add('brackets','brace','Brace','آکولاد');
export const LINE_PRESETS:readonly LinePreset[]=presets;
