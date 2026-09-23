import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {supabase} from '../supabaseClient';
import {defaultStudioContent,normalizeStudioContent,type StudioContent} from './studioContentModel';
const Context=createContext<StudioContent>(defaultStudioContent);
export async function loadStudioContent(){const {data,error}=await supabase.from('design_studio_content').select('content,updated_at').eq('id',1).maybeSingle();if(error)throw error;return {content:normalizeStudioContent(data?.content),version:data?.updated_at as string|undefined};}
export function StudioContentProvider({children,value}:{children:ReactNode;value?:StudioContent}){
 const [content,setContent]=useState(defaultStudioContent);
 useEffect(()=>{if(value)return;let live=true;void loadStudioContent().then(result=>{if(live)setContent(result.content);}).catch(()=>{/* Public pages retain complete default content until the CMS is configured. */});return()=>{live=false;};},[value]);
 return <Context.Provider value={value??content}>{children}</Context.Provider>;
}
export const useStudioContent=()=>useContext(Context);
export function useStudioCopy(fa:boolean){const content=useStudioContent();return (f:string,e:string)=>content.copy[f]?.[fa?'fa':'en']??(fa?f:e);}
export function StudioBlocks({page,fa}:{page:'design'|'orders';fa:boolean}){const content=useStudioContent();const t=useStudioCopy(fa);const blocks=content.blocks.filter(b=>b.page===page);if(!blocks.length)return null;return <section className="studio-content-blocks" aria-label={t('اطلاعات بیشتر','More information')}>{page==='design'&&<h2>{t('پیش از شروع','Before you start')}</h2>}{blocks.map(block=>block.type==='faq'?<details key={block.id}><summary>{(block.title[fa?'fa':'en']||block.title[fa?'en':'fa'])}</summary><p>{(block.body[fa?'fa':'en']||block.body[fa?'en':'fa'])}</p></details>:<article key={block.id} className={`studio-block studio-block-${block.type}`}>{block.image&&<img src={block.image} alt={(block.title[fa?'fa':'en']||block.title[fa?'en':'fa'])} loading="lazy"/>}<div>{(block.title[fa?'fa':'en']||block.title[fa?'en':'fa'])&&<h3>{(block.title[fa?'fa':'en']||block.title[fa?'en':'fa'])}</h3>}<p>{(block.body[fa?'fa':'en']||block.body[fa?'en':'fa'])}</p></div></article>)}</section>;}
