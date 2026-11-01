import {useEffect,useState,type FormEvent} from 'react';
import {HOME_TEXT_FIELDS,HOME_TEXT_DEFAULTS,HOME_FONT_OPTIONS,HOME_FONT_STACKS,loadHomeContent,saveHomeContent,type HomeContent,type HomeFontFamily} from './homeContent';
import './admin-home-text.css';
const labels={eyebrow:'نوشتهٔ بالای عنوان',title:'عنوان اصلی',highlight:'عنوان رنگی',description:'توضیحات',primaryText:'متن دکمهٔ ساخت شکل',secondaryText:'متن دکمهٔ ثبت سفارش طراحی',socialProof:'متن زیر دکمه‌ها'};
export function AdminHomeText(){
 const [content,setContent]=useState<HomeContent|null>(null);
 const [locale,setLocale]=useState<'fa'|'en'>('fa');
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const load=()=>{setMessage('');void loadHomeContent().then(setContent).catch(()=>setMessage('دریافت متن‌ها انجام نشد؛ دوباره تلاش کنید.'));};
 useEffect(load,[]);
 const submit=async(event:FormEvent)=>{event.preventDefault();if(!content)return;setBusy(true);setMessage('');try{await saveHomeContent(content);setMessage('متن‌ها و تنظیم فونت ذخیره شدند.');}catch{setMessage('ذخیره انجام نشد؛ تغییرات شما در فرم باقی مانده‌اند.');}finally{setBusy(false);}};
 return <section className="admin-template-hero admin-home-text">
  <div className="admin-template-hero-head"><div><span>HOME TEXT</span><h2>متن‌های صفحهٔ اصلی</h2></div><a href="/" target="_blank" rel="noreferrer">مشاهده صفحه</a></div>
  {message && <p role="status">{message}</p>}
  {!content ? <button onClick={load}>دریافت متن‌ها</button> : <form onSubmit={submit}>
   <div className="home-text-languages">{(['fa','en'] as const).map(lang=><button key={lang} type="button" aria-pressed={locale===lang} onClick={()=>setLocale(lang)}>{lang==='fa'?'فارسی':'English'}</button>)}</div>
   <fieldset disabled={busy}><div className="home-text-fields">{HOME_TEXT_FIELDS.map(key=><label key={key}><span>{labels[key]}</span><textarea rows={key==='description'?4:2} maxLength={2000} dir={locale==='fa'?'rtl':'ltr'} value={content[locale][key]} onChange={event=>{setMessage('');setContent({...content,[locale]:{...content[locale],[key]:event.target.value}});}}/></label>)}<label className="home-font-setting"><span>فونت نوشته‌های صفحهٔ اصلی ({locale==='fa'?'فارسی':'انگلیسی'})</span><select value={content[locale].fontFamily} onChange={event=>{setMessage('');setContent({...content,[locale]:{...content[locale],fontFamily:event.target.value as HomeFontFamily}});}}>{HOME_FONT_OPTIONS.filter(option=>locale==='fa'?option.value!=='inter':option.value!=='estedad'&&option.value!=='bnazanin').map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select><small className="home-font-preview" style={{fontFamily:HOME_FONT_STACKS[content[locale].fontFamily]}}>{locale==='fa'?'نمونهٔ فونت: علم شما؛ سریع، دقیق و باکیفیت.':'Font preview: Clear scientific figures.'}</small></label></div>
   <div className="home-text-actions"><button type="submit">{busy?'در حال ذخیره…':'ذخیره متن‌ها'}</button><button type="button" onClick={()=>{setContent({...content,[locale]:{...HOME_TEXT_DEFAULTS[locale],fontFamily:content[locale].fontFamily}});setMessage('متن‌های این زبان پاک شدند؛ برای اعمال، ذخیره کنید.');}}>پاک‌کردن متن‌های این زبان</button></div></fieldset>
  </form>}
 </section>;
}
