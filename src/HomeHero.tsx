import {useEffect,useState} from 'react';
import {ShuffleHero} from './components/ui/shuffle-grid';
import {HOME_HERO_DEFAULTS,HOME_HERO_SLOTS,loadHomeHeroImages,homeHeroPublicUrl,type HomeHeroImage} from './homeHero';

export function homeHeroSlots(items:HomeHeroImage[],locale:'en'|'fa'){
 return HOME_HERO_SLOTS.map((slot,i)=>{const item=items.find(image=>image.slot===slot);return {src:item?homeHeroPublicUrl(item.storagePath):HOME_HERO_DEFAULTS[i],alt:item?(locale==='fa'?item.altFa:item.altEn):(locale==='fa'?'تصویر الهام‌بخش':'Visual inspiration')};});
}
export function HomeHero({locale,title,highlight,description,primaryText,secondaryText,socialProof,onCreate}:{locale:'en'|'fa';title:string;highlight:string;description:string;primaryText:string;secondaryText:string;socialProof:string;onCreate:()=>void}){
 const [items,setItems]=useState<HomeHeroImage[]>([]);
 useEffect(()=>{let alive=true;const refresh=()=>{void loadHomeHeroImages().then(next=>{if(alive)setItems(next);}).catch(()=>{});};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh);};},[]);
 const slots=homeHeroSlots(items,locale);
 return <ShuffleHero locale={locale} title={title} highlight={highlight} description={description} socialProof={socialProof} images={slots.map((image,i)=>({id:i+1,...image}))} primaryText={primaryText} secondaryText={secondaryText} onCreate={onCreate}/>;
}
