import './hero-10.css';
export interface Hero10CTA {ctaEnabled:boolean;text:string;link:string;variant?:'default'|'outline';size?:'default'|'sm'|'lg';onClick?:()=>void}
export interface Hero10Props {title:string;titleLine2Prefix?:string;titleHighlight:string;description:string;socialProof?:string;images:string[];imageAlts?:string[];animation?:'subtle'|'none';primaryCTA?:Hero10CTA;secondaryCTA?:Hero10CTA}
// BioPlot implementation of the supplied Hero10 usage contract and visual reference.
export function Hero10({title,titleLine2Prefix,titleHighlight,description,socialProof,images,imageAlts,animation='subtle',primaryCTA,secondaryCTA}:Hero10Props){
 const cta=(item:Hero10CTA|undefined)=>item?.ctaEnabled&&(item.onClick?<button type="button" className={`hero10-cta ${item.variant??'default'} ${item.size??'default'}`} onClick={item.onClick}>{item.text}</button>:<a className={`hero10-cta ${item.variant??'default'} ${item.size??'default'}`} href={item.link||'#home'}>{item.text}</a>);
 return <section id="home" className={`hero10 hero10-${animation}`} aria-labelledby="hero10-title">
   <div className="hero10-copy"><h1 id="hero10-title">{title}<br/>{titleLine2Prefix&&<>{titleLine2Prefix} </>}<span>{titleHighlight}</span></h1><p>{description}</p><div className="hero10-actions">{cta(primaryCTA)}{cta(secondaryCTA)}</div>{socialProof&&<small>{socialProof}</small>}</div>
   <div className="hero10-fan" dir="ltr">{images.slice(0,3).map((src,index)=><figure key={index} className={`hero10-frame hero10-frame-${index+1}`}><img src={src} alt={imageAlts?.[index]??''} fetchPriority={index===1?'high':'auto'} onError={e=>{if(!e.currentTarget.src.endsWith('/images/scientific-cell-hero.webp'))e.currentTarget.src='/images/scientific-cell-hero.webp';}}/></figure>)}</div>
 </section>;
}
