import {OrderFilePicker} from './OrderFilePicker';
import {JalaliDatePicker} from './JalaliDatePicker';
import {readOrderSource} from './orderSource';
import {StudioBlocks,useStudioContent} from './StudioContent';
import {useState,type FormEvent} from 'react';
import {serviceLabels,validBrief,validateOrderFile,type OrderBrief,type ServiceKind} from './orderModel';
import './order-conversion.css';

type RequestDraft = {id:string;title:string;kind:ServiceKind;brief:OrderBrief;requested_date:string};
type ServiceCard = {kind:ServiceKind;number:string;fa:string;en:string;descriptionFa:string;descriptionEn:string};
const services:ServiceCard[] = [
 {kind:'figure',number:'01',fa:'تصویر علمی',en:'Scientific illustration',descriptionFa:'مسیرهای زیستی، مکانیسم‌ها و شکل مقاله',descriptionEn:'Pathways, mechanisms and publication figures'},
 {kind:'graphical_abstract',number:'02',fa:'چکیده تصویری',en:'Graphical abstract',descriptionFa:'روایت تصویری ایده و یافته اصلی مقاله',descriptionEn:'Visual storytelling for your paper'},
 {kind:'poster',number:'03',fa:'پوستر علمی',en:'Scientific poster',descriptionFa:'پوستر کنفرانس و ارائه پژوهشی',descriptionEn:'Conference and research posters'},
];
const startingPoints: Array<{id:OrderBrief['route'];fa:string;en:string;detailFa:string;detailEn:string}> = [
 {id:'idea',fa:'فقط ایده دارم',en:'I have an idea',detailFa:'طراحی از توضیح علمی من شروع شود',detailEn:'Start from my scientific description'},
 {id:'reference',fa:'نمونه یا مرجع دارم',en:'I have references',detailFa:'از نمونه‌های من برای جهت‌گیری طرح استفاده شود',detailEn:'Use my references for visual direction'},
 {id:'polish',fa:'طرح اولیه دارم',en:'I have a draft',detailFa:'طرح موجود را اصلاح یا تکمیل کنید',detailEn:'Improve or finish my existing figure'},
];
const prompts:Record<ServiceKind,[string,string]> = {
 figure:['موضوع علمی، اجزای اصلی و ارتباط بین آن‌ها را توضیح دهید.','Describe the scientific concept, key components and their connections.'],
 graphical_abstract:['سؤال پژوهش، روش و مهم‌ترین نتیجه مقاله را بنویسید.','Describe the research question, methods and most important finding.'],
 poster:['موضوع پوستر، بخش‌های موردنظر و رویداد یا کنفرانس را بنویسید.','Describe the poster topic, required sections and conference.'],
};
const formats=['PNG','SVG','PDF','PPTX'] as const;

export function OrderForm({fa,userId,onSubmit,busy,onCancel,preview=false,allowAttachments=true}:{fa:boolean;userId:string;preview?:boolean;allowAttachments?:boolean;onSubmit:(input:{id:string;title:string;kind:ServiceKind;brief:OrderBrief;requested_date:string|null},files:File[])=>Promise<void>;busy:boolean;onCancel:()=>void}){
 const t=(faText:string,enText:string)=>fa?faText:enText;
 const content=useStudioContent();
 const key='bioplot-order-draft:'+userId;
 const [source]=useState(()=>preview?null:readOrderSource());
 const [draft,setDraft]=useState<RequestDraft>(()=>{
  const queryKind=new URLSearchParams(location.search).get('kind');
  const kindFromUrl=queryKind&&Object.prototype.hasOwnProperty.call(serviceLabels,queryKind)?queryKind as ServiceKind:null;
  const fallback:RequestDraft={id:crypto.randomUUID(),title:source?.title==='Untitled scientific figure'?'':source?.title||'',kind:kindFromUrl??'figure',brief:{route:source?'polish':'idea',sourceProject:source?.projectId,message:'',audience:'',requirements:'',style:'',formats:['PNG','SVG']},requested_date:''};
  try{
   const stored=preview?null:sessionStorage.getItem(key)??(userId==='guest'?null:sessionStorage.getItem('bioplot-order-draft:guest'));
   const saved=JSON.parse(stored||'null') as Partial<RequestDraft>|null;
   if(saved&&typeof saved.id==='string'&&typeof saved.title==='string'&&saved.brief&&typeof saved.brief.message==='string'&&Array.isArray(saved.brief.formats)&&typeof saved.kind==='string'&&Object.prototype.hasOwnProperty.call(serviceLabels,saved.kind)){
    return {...fallback,...saved,kind:kindFromUrl??saved.kind,brief:{...fallback.brief,...saved.brief,route:startingPoints.some(point=>point.id===saved.brief?.route)?saved.brief.route:fallback.brief.route},requested_date:typeof saved.requested_date==='string'?saved.requested_date:''};
   }
  }catch{/* Corrupt draft never prevents a new request. */}
  return fallback;
 });
 const [files,setFiles]=useState<File[]>(()=>source?[new File([source.svg],'bioplot-draft.svg',{type:'image/svg+xml'})]:[]);
 const [error,setError]=useState('');
 const update=(patch:Partial<RequestDraft>)=>setDraft(current=>{const next={...current,...patch};try{if(!preview)sessionStorage.setItem(key,JSON.stringify(next));}catch{/* Draft storage is optional. */}return next;});
 const brief=(patch:Partial<OrderBrief>)=>update({brief:{...draft.brief,...patch}});
 const submit=(event:FormEvent)=>{event.preventDefault();if(preview)return;const briefWithDefaults={...draft.brief,formats:draft.brief.formats.length?draft.brief.formats:['PNG','SVG']};if(!validBrief(draft.title,briefWithDefaults)){setError(t('عنوان و توضیح درخواست را کامل کنید. توضیح باید حداقل ۲۰ نویسه باشد.','Enter a title and a description of at least 20 characters.'));return;}try{sessionStorage.setItem(key,JSON.stringify({...draft,brief:briefWithDefaults}));}catch{/* Optional draft storage */}void onSubmit({...draft,brief:briefWithDefaults,requested_date:draft.requested_date||null},allowAttachments?files:[]);};
 return <>
  <form className="order-form order-form-compact order-card order-conversion-form" onSubmit={submit}>
   <div className="order-intake-heading">
    <span className="order-eyebrow">BIOPLOT DESIGN STUDIO</span>
    <h1>{t('سفارش طراحی علمی، ساده و شفاف','Scientific design, made simple')}</h1>
    <p>{t('نیازتان را توضیح دهید؛ تیم پس از بررسی، هزینه و زمان را اعلام می‌کند. ثبت درخواست رایگان است و تعهدی برای پرداخت ایجاد نمی‌کند.','Tell us what you need. We will review your brief and propose a price and timeline. Submitting a request is free and does not commit you to paying.')}</p>
   </div>
   <fieldset className="order-intake-fieldset">
    <legend>{t('۱. چه نوع طراحی نیاز دارید؟','1. What do you need designed?')}</legend>
    <div className="order-service-choices">
     {services.map(service=><button type="button" key={service.kind} className={draft.kind===service.kind?'order-service-choice is-active':'order-service-choice'} aria-pressed={draft.kind===service.kind} onClick={()=>update({kind:service.kind})}>
      {content.images[service.kind]&&<img src={content.images[service.kind]} alt="" loading="lazy"/>}
      {!content.images[service.kind]&&<span className="order-service-mark" aria-hidden="true">{service.number}</span>}
      <strong>{t(service.fa,service.en)}</strong>
      <small>{t(service.descriptionFa,service.descriptionEn)}</small>
     </button>)}
    </div>
   </fieldset>
   <fieldset className="order-intake-fieldset">
    <legend>{t('۲. از کجا شروع کنیم؟','2. What is your starting point?')}</legend>
    <div className="order-starting-choices">
     {startingPoints.map(point=><label key={point.id} className={draft.brief.route===point.id?'order-starting-choice is-active':'order-starting-choice'}>
      <input name="order-starting-point" type="radio" checked={draft.brief.route===point.id} onChange={()=>brief({route:point.id})}/>
      <span><strong>{t(point.fa,point.en)}</strong><small>{t(point.detailFa,point.detailEn)}</small></span>
     </label>)}
    </div>
   </fieldset>
   <section className="order-intake-details" aria-label={t('مشخصات سفارش','Request details')}>
    <h2>{t('۳. جزئیات سفارش','3. Describe your project')}</h2>
    <label>{t('عنوان درخواست','Request title')}<input required minLength={3} maxLength={160} value={draft.title} onChange={e=>update({title:e.target.value})} placeholder={t('مثلاً: مکانیسم اثر دارو بر سلول توموری','e.g. A drug mechanism in tumor cells')}/></label>
    <label>{t('توضیح علمی طرح','Scientific brief')}<textarea required minLength={20} rows={5} maxLength={12000} value={draft.brief.message} onChange={e=>brief({message:e.target.value})} placeholder={t(prompts[draft.kind][0],prompts[draft.kind][1])}/></label>
    <details className="order-optional-details">
     <summary>{t('اطلاعات تکمیلی (اختیاری)','Additional details (optional)')}</summary>
     <label>{t('سبک دلخواه یا ژورنال مقصد','Preferred style or target journal')}<input value={draft.brief.style} onChange={e=>brief({style:e.target.value})} placeholder={t('مثلاً: مینیمال، مشابه نمونه پیوست','e.g. Minimal, similar to attached reference')}/></label>
     <label>{t('الزامات ویژه','Special requirements')}<textarea rows={3} value={draft.brief.requirements} onChange={e=>brief({requirements:e.target.value})} placeholder={t('ابعاد، متن‌ها یا جزئیات ضروری','Dimensions, labels or must-have details')}/></label>
     <fieldset className="order-formats"><legend>{t('فرمت‌های درخواستی','Requested formats')}</legend><div className="order-format-choices">{formats.map(format=><label key={format}><input type="checkbox" checked={draft.brief.formats.includes(format)} onChange={e=>brief({formats:e.target.checked?[...draft.brief.formats,format]:draft.brief.formats.filter(item=>item!==format)})}/>{format}</label>)}</div></fieldset>
     <small>{t('فرمت‌های قابل تحویل در پیشنهاد نهایی مشخص می‌شوند.','Available deliverables will be confirmed in the final quote.')}</small>
    </details>
    <div className="order-date-field"><label>{t('زمان تحویل موردنظر (اختیاری)','Preferred delivery date (optional)')}</label>{fa?<JalaliDatePicker value={draft.requested_date||''} onChange={value=>update({requested_date:value})}/>:<input type="date" min={new Date().toISOString().slice(0,10)} value={draft.requested_date||''} onChange={e=>update({requested_date:e.target.value})}/>}</div>
    {allowAttachments?<div className="order-upload"><OrderFilePicker fa={fa} label={t('فایل مرجع یا طرح اولیه (اختیاری)','Reference files or an existing draft (optional)')} onChange={e=>{const selected=Array.from(e.target.files||[]);if(selected.length+files.length>8||selected.some(file=>!validateOrderFile(file))){setError(t('حداکثر ۸ فایل مجاز است؛ حجم هر فایل باید کمتر از ۲۰ مگابایت باشد.','Add up to 8 supported files, up to 20 MB each.'));e.currentTarget.value='';return;}setFiles(current=>[...current,...selected].slice(0,8));setError('');e.currentTarget.value='';}}/><small><bdi>PDF · PNG · JPG · WebP · SVG · PPTX · DOCX · ZIP</bdi> · {t('حداکثر ۸ فایل، هرکدام ۲۰ مگابایت','8 files maximum, 20 MB each')}</small>{files.map((file,i)=><div className="order-picked-file" key={file.name+'-'+i}><bdi>{file.name}</bdi><button type="button" onClick={()=>setFiles(current=>current.filter((_,index)=>index!==i))}>{t('حذف','Remove')}</button></div>)}</div>:<p className="order-guest-attachment-note">{t('می‌توانید فرم را بدون ورود تکمیل کنید. فایل‌های مرجع را پس از ورود به حساب اضافه خواهید کرد؛ متن فرم در همین مرورگر حفظ می‌شود.','You can complete this brief without signing in. Add reference files after signing in; your text is saved in this browser tab.')}</p>}
   </section>
   {error&&<p role="alert" className="order-alert">{error}</p>}
   <div className="order-intake-footer">
    <p>{t('ابتدا درخواست را بررسی می‌کنیم؛ طراحی فقط پس از توافق درباره هزینه، زمان و شرایط شروع می‌شود.','We review the request first. Work starts only after the price, timeline and terms are agreed.')}</p>
    <div className="order-actions"><button type="button" onClick={onCancel} disabled={busy}>{t('بازگشت','Back')}</button><button type="submit" className="order-primary" disabled={busy||preview}>{busy?t('در حال ثبت…','Submitting…'):allowAttachments?t('ارسال درخواست برای بررسی','Send request for review'):t('ادامه و ورود برای ثبت نهایی','Continue to sign in and submit')}</button></div>
   </div>
  </form>
  {!preview&&<div className="order-intake-faq"><StudioBlocks page="design" fa={fa}/></div>}
 </>;
}
