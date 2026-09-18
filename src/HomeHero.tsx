import {useEffect,useState} from 'react';
import {loadHomeContent,type HomeContent} from './homeContent';
import {ShuffleHero} from './components/ui/shuffle-grid';
import {HOME_HERO_DEFAULTS,HOME_HERO_SLOTS,loadHomeHeroImages,homeHeroPublicUrl,type HomeHeroImage} from './homeHero';

export function homeHeroSlots(items:HomeHeroImage[],locale:'en'|'fa'){
 return HOME_HERO_SLOTS.map((slot,i)=>{const item=items.find(image=>image.slot===slot);return {src:item?homeHeroPublicUrl(item.storagePath):HOME_HERO_DEFAULTS[i],alt:item?(locale==='fa'?item.altFa:item.altEn):(locale==='fa'?'تصویر الهام‌بخش':'Visual inspiration')};});
}
export function HomeHero({locale,title,highlight,description,primaryText,secondaryText,socialProof,onCreate}:{locale:'en'|'fa';title:string;highlight:string;description:string;primaryText:string;secondaryText:string;socialProof:string;onCreate:()=>void}){
 const [items,setItems]=useState<HomeHeroImage[]|null>(null);
 const [content,setContent]=useState<HomeContent|null>(null);
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{let alive=true;const refresh=()=>{setFailed(false);void loadHomeContent().then(next=>{if(alive)setContent(next);}).catch(()=>{});void loadHomeHeroImages().then(next=>{if(alive)setItems(next);}).catch(()=>{if(alive)setFailed(true);});};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh);};},[attempt]);
 const slots=items ? homeHeroSlots(items,locale) : [];
 return <ShuffleHero loading={items===null} loadFailed={failed && items===null} onRetry={()=>setAttempt(value=>value+1)} locale={locale} {...(content?.[locale] ?? {title,highlight,description,socialProof,primaryText,secondaryText})} images={slots.map((image,i)=>({id:i+1,...image}))} onCreate={onCreate}/>;
}
