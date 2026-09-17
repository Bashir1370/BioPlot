import {useEffect,useState} from 'react';
import {Hero10} from './components/ui/hero-10';
import {HOME_HERO_DEFAULTS,loadHomeHeroImages,homeHeroPublicUrl,type HomeHeroImage} from './homeHero';

export function homeHeroSlots(items:HomeHeroImage[],locale:'en'|'fa'){
 return [1,2,3].map((slot,i)=>{const item=items.find(image=>image.slot===slot);return {src:item?homeHeroPublicUrl(item.storagePath):HOME_HERO_DEFAULTS[i],alt:item?(locale==='fa'?item.altFa:item.altEn):(locale==='fa'?'تصویر الهام‌بخش':'Visual inspiration')};});
}
export function HomeHero({locale,title,highlight,description,primaryText,secondaryText,socialProof,onCreate}:{locale:'en'|'fa';title:string;highlight:string;description:string;primaryText:string;secondaryText:string;socialProof:string;onCreate:()=>void}){
 const [items,setItems]=useState<HomeHeroImage[]>([]);
 useEffect(()=>{let alive=true;const refresh=()=>{void loadHomeHeroImages().then(next=>{if(alive)setItems(next);}).catch(()=>{});};refresh();window.addEventListener('focus',refresh);return()=>{alive=false;window.removeEventListener('focus',refresh);};},[]);
 const slots=homeHeroSlots(items,locale);
 return <Hero10 title={title} titleHighlight={highlight} description={description} socialProof={socialProof} images={slots.map(s=>s.src)} imageAlts={slots.map(s=>s.alt)} animation="subtle" primaryCTA={{ctaEnabled:true,text:primaryText,link:'',onClick:onCreate}} secondaryCTA={{ctaEnabled:true,text:secondaryText,link:'/templates',variant:'outline'}}/>;
}
