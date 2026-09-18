import {useEffect,useState,type FormEvent} from 'react';
import {HOME_TEXT_FIELDS,HOME_TEXT_DEFAULTS,loadHomeContent,saveHomeContent,type HomeContent} from './homeContent';
import './admin-home-text.css';
const labels={eyebrow:'نوشتهٔ بالای عنوان',title:'عنوان اصلی',highlight:'عنوان رنگی',description:'توضیحات',primaryText:'متن دکمهٔ ساخت شکل',secondaryText:'متن دکمهٔ داشبورد',socialProof:'متن زیر دکمه‌ها'};
export function AdminHomeText(){
 const [content,setContent]=useState<HomeContent|null>(null);
 const [locale,setLocale]=useState<'fa'|'en'>('fa');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const load=()=>{setMessage('');void loadHomeContent().then(setContent).catch(()=>setMessage('دریافت متن‌ها انجام نشد؛ دوباره تلاش کنید.'));};
 useEffect(load,[]);
 const submit=async(event:FormEvent)=>{event.preventDefault();if(!content)return;setBusy(true);setMessage('');try{await saveHomeContent(content);setMessage('متن‌های هر دو زبان ذخیره شدند.');}catch{setMessage('ذخیره انجام نشد؛ تغییرات شما در فرم باقی مانده‌اند.');}finally{setBusy(false);}};
 return <section className="admin-template-hero admin-home-text">
  <div className="admin-template-hero-head"><div><span>HOME TEXT</span><h2>متن‌های صفحهٔ اصلی</h2></div><a href="/" target="_blank" rel="noreferrer">مشاهده صفحه</a></div>
  {message && <p role="status">{message}</p>}
  {!content ? <button onClick={load}>دریافت متن‌ها</button> : <form onSubmit={submit}>
   <div className="home-text-languages">{(['fa','en'] as const).map(lang=><button key={lang} type="button" aria-pressed={locale===lang} onClick={()=>setLocale(lang)}>{lang==='fa'?'فارسی':'English'}</button>)}</div>
   <fieldset disabled={busy}><div className="home-text-fields">{HOME_TEXT_FIELDS.map(key=><label key={key}><span>{labels[key]}</span><textarea rows={key==='description'?4:2} maxLength={2000} dir={locale==='fa'?'rtl':'ltr'} value={content[locale][key]} onChange={event=>{setMessage('');setContent({...content,[locale]:{...content[locale],[key]:event.target.value}});}}/></label>)}</div>
   <div className="home-text-actions"><button type="submit">{busy?'در حال ذخیره…':'ذخیره متن‌ها'}</button><button type="button" onClick={()=>{setContent({...content,[locale]:{...HOME_TEXT_DEFAULTS[locale]}});setMessage('متن پیش‌فرض در فرم قرار گرفت؛ برای اعمال، ذخیره کنید.');}}>متن پیش‌فرض این زبان</button></div></fieldset>
  </form>}
 </section>;
}
