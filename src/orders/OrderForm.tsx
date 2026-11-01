import {OrderFilePicker} from './OrderFilePicker';
import {readOrderSource} from './orderSource';
import {useState,type FormEvent} from 'react';
import {serviceLabels,validBrief,validateOrderFile,type OrderBrief,type ServiceKind} from './orderModel';
export function OrderForm({fa,userId,onSubmit,busy,onCancel,preview=false}:{fa:boolean;userId:string;preview?:boolean;onSubmit:(input:{id:string;title:string;kind:ServiceKind;brief:OrderBrief;requested_date:string|null},files:File[])=>Promise<void>;busy:boolean;onCancel:()=>void}){
 const t=(faText:string,enText:string)=>fa?faText:enText;
 const key='bioplot-order-draft:'+userId;
 const [source]=useState(()=>preview?null:readOrderSource());
 const [draft,setDraft]=useState(()=>{try{const saved=JSON.parse((preview?null:sessionStorage.getItem(key))||'null');if(saved?.brief&&typeof saved.id==='string'&&typeof saved.title==='string'&&saved.kind in serviceLabels&&typeof saved.brief.message==='string')return saved as {id:string;title:string;kind:ServiceKind;brief:OrderBrief;requested_date:string};}catch{/* Invalid local draft is discarded. */}const kind=new URLSearchParams(location.search).get('kind');return {id:crypto.randomUUID(),title:source?.title==='Untitled scientific figure'?'':source?.title||'',kind:(kind&&kind in serviceLabels?kind:'figure') as ServiceKind,brief:{route:source?'polish':'idea',sourceProject:source?.projectId,message:'',audience:'',requirements:'',style:'',formats:['PNG','SVG']} as OrderBrief,requested_date:''};});
 const [files,setFiles]=useState<File[]>(()=>source?[new File([source.svg],'bioplot-draft.svg',{type:'image/svg+xml'})]:[]);
 const [error,setError]=useState('');
 const update=(patch:Partial<typeof draft>)=>{setDraft(current=>{const next={...current,...patch};try{if(!preview)sessionStorage.setItem(key,JSON.stringify(next));}catch{/* Draft storage is optional. */}return next;});};
 const brief=(patch:Partial<OrderBrief>)=>update({brief:{...draft.brief,...patch}});
 const submit=(event:FormEvent)=>{event.preventDefault();if(preview)return;if(!validBrief(draft.title,draft.brief)){setError(t('عنوان و توضیح درخواست را کامل کنید. توضیح باید حداقل ۲۰ نویسه باشد.','Enter a title and a description of at least 20 characters.'));return;}void onSubmit({...draft,requested_date:draft.requested_date||null},files);};
 return <form className="order-form order-form-compact order-card" onSubmit={submit}>
  <h1>{t('درخواست طراحی','Design request')}</h1>
  <label>{t('نوع طراحی','Design type')}<select value={draft.kind} onChange={e=>update({kind:e.target.value as ServiceKind})}>{Object.entries(serviceLabels).map(([id,label])=><option value={id} key={id}>{t(label[0],label[1])}</option>)}</select></label>
  <label>{t('عنوان درخواست','Request title')}<input required minLength={3} maxLength={160} value={draft.title} onChange={e=>update({title:e.target.value})} placeholder={t('مثلاً: مکانیسم اثر دارو بر سلول توموری','e.g. Mechanism of a drug in tumor cells')}/></label>
  <label>{t('توضیح طرح','Describe the design')}<textarea required minLength={20} rows={6} maxLength={12000} value={draft.brief.message} onChange={e=>brief({message:e.target.value})} placeholder={t('موضوع و پیام علمی تصویر را توضیح دهید. اگر بخش‌ها، برچسب‌ها یا سبک مشخصی مدنظر دارید، همین‌جا بنویسید.','Describe the topic and scientific message. Include any required panels, labels or visual style.')}/></label>
  <label className="order-date-field">{t('زمان تحویل موردنظر (اختیاری)','Preferred delivery date (optional)')}<input type="date" min={new Date().toISOString().slice(0,10)} value={draft.requested_date||''} onChange={e=>update({requested_date:e.target.value})}/></label>
  <div className="order-upload"><OrderFilePicker fa={fa} label={t('فایل مرجع یا طرح اولیه (اختیاری)','Reference files or an existing draft (optional)')} onChange={e=>{const selected=Array.from(e.target.files||[]);if(selected.length+files.length>8||selected.some(file=>!validateOrderFile(file))){setError(t('حداکثر ۸ فایل مجاز است؛ حجم هر فایل باید کمتر از ۲۰ مگابایت باشد.','Add up to 8 supported files, up to 20 MB each.'));e.currentTarget.value='';return;}setFiles(current=>[...current,...selected].slice(0,8));setError('');e.currentTarget.value='';}}/><small><bdi>PDF · PNG · JPG · WebP · SVG · PPTX · DOCX · ZIP</bdi></small>{files.map((file,i)=><div className="order-picked-file" key={file.name+'-'+i}><bdi>{file.name}</bdi><button type="button" onClick={()=>setFiles(current=>current.filter((_,index)=>index!==i))}>{t('حذف','Remove')}</button></div>)}</div>
  {error&&<p role="alert" className="order-alert">{error}</p>}
  <div className="order-actions"><button type="button" onClick={onCancel} disabled={busy}>{t('بازگشت','Back')}</button><button type="submit" className="order-primary" disabled={busy||preview}>{busy?t('در حال ثبت…','Submitting…'):t('ارسال درخواست برای بررسی','Send request for review')}</button></div>
 </form>;
}
