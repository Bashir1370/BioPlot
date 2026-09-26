import {useEffect,useState} from 'react';
import {loadHomeContent,HOME_TEXT_FIELDS,type HomeContent} from './homeContent';
import {createPublicPageCache} from './publicPageCache';
import {ShuffleHero} from './components/ui/shuffle-grid';
import {HOME_HERO_DEFAULTS,HOME_HERO_SLOTS,loadHomeHeroImages,homeHeroPublicUrl,type HomeHeroImage} from './homeHero';

const imageCache = createPublicPageCache('bioplot-public-home-images-v1', loadHomeHeroImages,
 (value): value is HomeHeroImage[] => Array.isArray(value) && value.length <= 16 && value.every(item =>
   item && Number.isInteger(item.slot) && item.slot >= 1 && item.slot <= 16 &&
   ['storagePath','altEn','altFa','updatedAt'].every(key => typeof item[key] === 'string')));
const contentCache = createPublicPageCache('bioplot-public-home-content-v1', loadHomeContent,
 (value): value is HomeContent => !!value && typeof value === 'object' && ['en','fa'].every(locale =>
   HOME_TEXT_FIELDS.every(key => typeof (value as HomeContent)[locale as 'en'|'fa']?.[key] === 'string')));

export function homeHeroSlots(items:HomeHeroImage[],locale:'en'|'fa'){
 return HOME_HERO_SLOTS.map((slot,i)=>{const item=items.find(image=>image.slot===slot);return {src:item?homeHeroPublicUrl(item.storagePath):HOME_HERO_DEFAULTS[i],alt:item?(locale==='fa'?item.altFa:item.altEn):(locale==='fa'?'تصویر الهام‌بخش':'Visual inspiration')};});
}
export function HomeHero({locale,title,highlight,description,primaryText,secondaryText,socialProof,onCreate}:{locale:'en'|'fa';title:string;highlight:string;description:string;primaryText:string;secondaryText:string;socialProof:string;onCreate:()=>void}){
 const [items,setItems]=useState<HomeHeroImage[]>(() => imageCache.read() ?? []);
 const [content,setContent]=useState<HomeContent|null>(() => contentCache.read() ?? null);
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(() => {
   let alive = true;
   const refresh = (force = false) => {
     void contentCache.refresh(force).then(next => { if (alive) setContent(next); }).catch(() => {});
     void imageCache.refresh(force).then(next => {
       if (alive) { setItems(next); setFailed(false); }
     }).catch(() => { if (alive) setFailed(true); });
   };
   // Revalidate on navigation; focus events share requests and have a cooldown.
   refresh(true);
   const onFocus = () => refresh();
   const onOnline = () => refresh(true);
   window.addEventListener('focus', onFocus);
   window.addEventListener('online', onOnline);
   return () => {
     alive = false;
     window.removeEventListener('focus', onFocus);
     window.removeEventListener('online', onOnline);
   };
 }, [attempt]);
 const slots=homeHeroSlots(items,locale);
 return <ShuffleHero loadFailed={failed} onRetry={()=>setAttempt(value=>value+1)} locale={locale} {...(content?.[locale] ?? {title,highlight,description,socialProof,primaryText,secondaryText})} images={slots.map((image,i)=>({id:i+1,...image}))} onCreate={onCreate}/>;
}
