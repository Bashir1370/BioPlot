import {useEffect,useRef,useState} from 'react';
import {loadHomeContent,HOME_FONT_STACKS,type HomeContent} from './homeContent';
import {ShuffleHero} from './components/ui/shuffle-grid';
import {HOME_HERO_SLOTS,loadHomeHeroImages,homeHeroPublicUrl,homeHeroPreviewPublicUrl,type HomeHeroImage} from './homeHero';

// Session-only public CMS cache: show a warm Home immediately, then revalidate.
const HOME_CACHE_KEY='bioplot:home-hero:v2';
const CACHE_TTL_MS=15*60*1000;
type HeroSnapshot={updatedAt:number;content:HomeContent|null;items:HomeHeroImage[]};
function readHeroCache():HeroSnapshot|null{
 if(typeof window==='undefined')return null;
 try{
  const cache=JSON.parse(sessionStorage.getItem(HOME_CACHE_KEY)||'null') as HeroSnapshot|null;
  if(cache && typeof cache.updatedAt==='number' && Date.now()-cache.updatedAt<CACHE_TTL_MS
    && Array.isArray(cache.items))return cache;
 }catch{/* Corrupt or unavailable browser storage is harmless. */}
 return null;
}
function writeHeroCache(snapshot:HeroSnapshot){
 try{sessionStorage.setItem(HOME_CACHE_KEY,JSON.stringify({...snapshot,updatedAt:Date.now()}));}
 catch{/* CMS display must never depend on web storage. */}
}

export function homeHeroSlots(items:HomeHeroImage[],locale:'en'|'fa'){
 return HOME_HERO_SLOTS.map(slot=>{const item=items.find(image=>image.slot===slot);return {src:item?homeHeroPreviewPublicUrl(item.storagePath):'',fallbackSrc:item?homeHeroPublicUrl(item.storagePath):'',alt:item?(locale==='fa'?item.altFa:item.altEn):(locale==='fa'?'تصویر الهام‌بخش':'Visual inspiration')};});
}
export function HomeHero({locale,onCreate}:{locale:'en'|'fa';onCreate:()=>void;eyebrow?:string;title?:string;highlight?:string;description?:string;primaryText?:string;secondaryText?:string;socialProof?:string}){
 const [cached]=useState(readHeroCache);
 const [items,setItems]=useState<HomeHeroImage[]>(()=>cached?.items??[]);
 const [loading,setLoading]=useState(!cached);
 const [content,setContent]=useState<HomeContent|null>(()=>cached?.content??null);
 const [contentLoading,setContentLoading]=useState(!cached?.content);
 const [contentFailed,setContentFailed]=useState(false);
 const contentLoaded=useRef(Boolean(cached?.content));
 const snapshot=useRef({content:cached?.content??null,items:cached?.items??[]});
 const [failed,setFailed]=useState(false);
 const [attempt,setAttempt]=useState(0);
 useEffect(()=>{
  let alive=true;
  let lastRefresh=0;
  const refresh=(force=false)=>{
   const now=Date.now();
   if(!force && now-lastRefresh<60_000)return;
   lastRefresh=now;
   setFailed(false);
   void loadHomeContent().then(next=>{
    if(!alive)return;
    contentLoaded.current=true;
    snapshot.current.content=next;
    setContent(next);
    setContentFailed(false);
    setContentLoading(false);
    writeHeroCache({...snapshot.current,updatedAt:now});
   }).catch(()=>{
    if(alive && !contentLoaded.current){setContentFailed(true);setContentLoading(false);}
   });
   void loadHomeHeroImages().then(next=>{
    if(!alive)return;
    snapshot.current.items=next;
    setItems(next);
    setLoading(false);
    writeHeroCache({...snapshot.current,updatedAt:now});
   }).catch(()=>{
    if(alive){setFailed(true);setLoading(false);}
   });
  };
  refresh(true);
  const onFocus=()=>refresh();
  window.addEventListener('focus',onFocus);
  return()=>{alive=false;window.removeEventListener('focus',onFocus);};
 },[attempt]);
 const slots=homeHeroSlots(items,locale);
 const selectedFont=content?.[locale].fontFamily ?? (locale==='fa'?'vazirmatn':'inter');
 useEffect(()=>{
  const homeShell=document.querySelector<HTMLElement>('.home-shell');
  if(!homeShell)return;
  const previousFont=homeShell.style.fontFamily;
  homeShell.style.fontFamily=HOME_FONT_STACKS[selectedFont];
  return()=>{homeShell.style.fontFamily=previousFont;};
 },[selectedFont]);
 return <ShuffleHero fontStack={HOME_FONT_STACKS[selectedFont]} copyLoading={contentLoading} copyFailed={contentFailed} loading={loading} loadFailed={failed} onRetry={()=>{if(contentFailed)setContentLoading(true);setAttempt(value=>value+1);}} locale={locale} secondaryHref="/design" {...(content?.[locale] ?? {})} primaryText="" images={slots.map((image,i)=>({id:i+1,...image}))} onCreate={onCreate}/>;
}
