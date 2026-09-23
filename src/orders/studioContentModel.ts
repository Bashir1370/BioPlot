import copy from './studioCopy.json';
import blocks from './studioBlocks.json';
export type LocalText={fa:string;en:string};
export type StudioBlock={id:string;type:'faq'|'text'|'image';page:'design'|'orders';title:LocalText;body:LocalText;image:string};
export type StudioContent={copy:Record<string,LocalText>;images:Record<string,string>;blocks:StudioBlock[]};
export const copyFields=copy;
export const defaultStudioContent:StudioContent={copy:Object.fromEntries(Object.entries(copy).map(([key,value])=>[key,{fa:value.fa,en:value.en}])),images:{hero:'',figure:'',graphical_abstract:'',poster:'',orders:''},blocks:blocks as StudioBlock[]};
export function safeImageUrl(value:unknown):string {if(typeof value!=='string'||value.length>2048)return '';try{const url=new URL(value);return url.protocol==='https:'?url.href:'';}catch{return '';}}
const localText=(value:unknown,fallback:LocalText={fa:'',en:''}):LocalText=>{const v=value as Partial<LocalText>|null;return {fa:typeof v?.fa==='string'?v.fa.slice(0,12000):fallback.fa,en:typeof v?.en==='string'?v.en.slice(0,12000):fallback.en};};
export function normalizeStudioContent(value:unknown):StudioContent {
 const v=value as Partial<StudioContent>|null;
 const texts=Object.fromEntries(Object.entries(copy).map(([key,text])=>[key,localText(v?.copy?.[key],text)]));
 const images=Object.fromEntries(Object.keys(defaultStudioContent.images).map(key=>[key,safeImageUrl(v?.images?.[key])]));
 const seen=new Set<string>();const normalizedBlocks=Array.isArray(v?.blocks)?v.blocks.slice(0,60).filter(b=>{if(!b||typeof b.id!=='string'||!b.id||seen.has(b.id))return false;seen.add(b.id);return ['faq','text','image'].includes(b.type)&&['design','orders'].includes(b.page);}).map(b=>({id:b.id.slice(0,100),type:b.type,page:b.page,title:localText(b.title),body:localText(b.body),image:safeImageUrl(b.image)})):defaultStudioContent.blocks;
 return {copy:texts,images,blocks:normalizedBlocks};
}
