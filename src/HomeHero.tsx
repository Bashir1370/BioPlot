import {useEffect,useState} from 'react';
import {loadHomeContent,HOME_FONT_STACKS,type HomeContent} from './homeContent';
import {ShuffleHero} from './components/ui/shuffle-grid';
import {HOME_HERO_SLOTS,loadHomeHeroImages,homeHeroPublicUrl,homeHeroPreviewPublicUrl,type HomeHeroImage} from './homeHero';

export function homeHeroSlots(items:HomeHeroImage[],locale:'en'|'fa'){
 return HOME_HERO_SLOTS.map(slot=>{const item=items.find(image=>image.slot===slot);return {src:item?homeHeroPreviewPublicUrl(item.storagePath):'',fallbackSrc:item?homeHeroPublicUrl(item.storagePath):'',alt:item?(locale==='fa'?item.altFa:item.altEn):(locale==='fa'?'تصویر الهام‌بخش':'Visual inspiration')};});
}
export function HomeHero({locale,eyebrow,title,highlight,description,primaryText,secondaryText,socialProof,onCreate}:{locale:'en'|'fa';eyebrow?:string;title:string;highlight:string;description:string;primaryText:string;secondaryText:string;socialProof:string;onCreate:()=>void}){
 const [items,setItems]=useState<HomeHeroImage[]>([]);
 const [loading,setLoading]=useState(true);
 const [content,setContent]=useState<HomeContent|null>(null);
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let alive=true;const refresh=()=>{setFailed(false);void loadHomeContent().then(next=>{if(alive)setContent(next);}).catch(()=>{});void loadHomeHeroImages().then(next=>{if(alive){setItems(next);setLoading(false);}}).catch(()=>{if(alive){setFailed(true);setLoading(false);}});};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh);};},[attempt]);
 const slots=homeHeroSlots(items,locale);
 const selectedFont=content?.[locale].fontFamily ?? (locale==='fa'?'vazirmatn':'inter');
 useEffect(()=>{
  const homeShell=document.querySelector<HTMLElement>('.home-shell');
  if(!homeShell)return;
  const previousFont=homeShell.style.fontFamily;
  homeShell.style.fontFamily=HOME_FONT_STACKS[selectedFont];
  return()=>{homeShell.style.fontFamily=previousFont;};
 },[selectedFont]);
 return <ShuffleHero fontFamily={HOME_FONT_STACKS[selectedFont]} loading={loading} loadFailed={failed} onRetry={()=>setAttempt(value=>value+1)} locale={locale} secondaryHref="/design" {...(content?.[locale] ?? {eyebrow:eyebrow ?? (locale==='fa'?'خدمات طراحی شکل علمی':'SCIENTIFIC FIGURE DESIGN'),title,highlight,description,socialProof,primaryText,secondaryText})} images={slots.map((image,i)=>({id:i+1,...image}))} onCreate={onCreate}/>;
}
