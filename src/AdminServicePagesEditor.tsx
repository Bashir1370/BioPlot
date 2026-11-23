import { useEffect, useState, type FormEvent } from 'react';
import { loadHomeContent, saveHomeContent } from './homeContent';
import {
  SERVICE_DEFAULT_CONTENT, SERVICE_FIELD_KEYS, SERVICE_SLUGS,
  mergeServicePageContent, servicePageKey,
  type ServiceField, type ServiceLocale, type ServicePageFields, type ServiceSlug,
} from './servicePageContent';
import './admin-service-pages.css';

const names: Record<ServiceSlug, string> = {
  'scientific-illustration': 'طراحی شکل علمی',
  'graphical-abstract': 'گرافیکال ابسترکت',
  'scientific-poster': 'پوستر علمی',
};
const labels: Record<ServiceField,string> = {
  metaTitle: 'عنوان سئو (Title در گوگل)',
  metaDescription: 'توضیح متا (Description در گوگل)',
  eyebrow: 'نوشته کوتاه بالای تیتر',
  title: 'عنوان اصلی صفحه (H1 و مسیر راهنما)',
  lead: 'توضیح اصلی زیر عنوان',
  primaryCta: 'متن دکمه ثبت سفارش',
  secondaryCta: 'متن دکمه اطلاعات بیشتر',
  imageAlt: 'متن جایگزین تصویر (Alt برای Google Images)',
  imageCaption: 'توضیح زیر تصویر نمونه',
  detailsTitle: 'عنوان بخش معرفی خدمات',
  detailsBody: 'توضیح بخش معرفی خدمات',
  feature1: 'ویژگی / موضوع شماره ۱',
  feature2: 'ویژگی / موضوع شماره ۲',
  feature3: 'ویژگی / موضوع شماره ۳',
  stepsTitle: 'عنوان بخش مراحل سفارش',
  step1: 'مرحله ۱',
  step2: 'مرحله ۲',
  step3: 'مرحله ۳',
  relatedTitle: 'عنوان بخش خدمات مرتبط',
};
const groups: {title:string; keys:ServiceField[]}[] = [
  {title:'متادیتا و نتایج جستجو',keys:['metaTitle','metaDescription']},
  {title:'عنوان و معرفی خدمت',keys:['eyebrow','title','lead','primaryCta','secondaryCta']},
  {title:'تصویر و توضیحات آن',keys:['imageAlt','imageCaption']},
  {title:'شرح و ویژگی‌های خدمت',keys:['detailsTitle','detailsBody','feature1','feature2','feature3']},
  {title:'مراحل و خدمات مرتبط',keys:['stepsTitle','step1','step2','step3','relatedTitle']},
];
const multiline = new Set<ServiceField>([
  'lead','metaDescription','detailsBody','imageCaption','feature1','feature2','feature3','step1','step2','step3',
]);

export function AdminServicePagesEditor() {
  const [slug, setSlug] = useState<ServiceSlug>('scientific-illustration');
  const [locale, setLocale] = useState<ServiceLocale>('fa');
  const [pages, setPages] = useState<Record<string,ServicePageFields> | null>(null);
  const [loading,setLoading] = useState(true);
  const [saving,setSaving] = useState(false);
  const [message,setMessage] = useState('');
  const key = servicePageKey(slug, locale);
  const current = pages?.[key];

  const refresh = async () => {
    setLoading(true);setMessage('');
    try {
      const home = await loadHomeContent();
      const next:Record<string,ServicePageFields> = {};
      for(const s of SERVICE_SLUGS)for(const l of ['fa','en'] as const) {
        const k = servicePageKey(s,l);
        next[k] = mergeServicePageContent(k,home.servicePages?.[k]);
      }
      setPages(next);
    } catch(error) {
      setMessage(error instanceof Error ? error.message : 'دریافت متن صفحات ناموفق بود.');
    } finally {setLoading(false);}
  };
  useEffect(() => {void refresh();},[]);

  const change = (field:ServiceField,value:string) => {
    setMessage('');
    setPages(previous => previous ? {...previous,[key]:{...previous[key],[field]:value}} : previous);
  };
  const save = async (event:FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if(!current) return;
    setSaving(true);setMessage('');
    try {
      // Always re-read latest Home CMS data to preserve concurrent edits in the hero editor.
      const latest = await loadHomeContent();
      const clean = Object.fromEntries(SERVICE_FIELD_KEYS.map(field => [field,current[field]])) as ServicePageFields;
      await saveHomeContent({
        ...latest,servicePages:{...(latest.servicePages ?? {}),[key]:clean},
      });
      setMessage('متن صفحه ذخیره شد. صفحه باز را تازه‌سازی کنید تا تغییرات نمایش داده شوند.');
    } catch(error) {
      setMessage(error instanceof Error ? error.message : 'ذخیره ناموفق بود. متن‌ها در فرم حفظ شدند.');
    } finally {setSaving(false);}
  };

  return <section className="service-cms" id="admin-service-page-content" dir="rtl">
    <div className="service-cms-heading">
      <div>
        <span>SEO / SERVICE CONTENT</span>
        <h2>ویرایش محتوای صفحات خدمات</h2>
        <p>هر خدمت و هر زبان متن مستقل دارد؛ عنوان‌ها، جملات، تصویر، متن دکمه‌ها و متادیتای گوگل را همین‌جا ویرایش کنید.</p>
      </div>
      <a href={`/services/${locale}/${slug}/`} target="_blank" rel="noopener noreferrer">مشاهده صفحه</a>
    </div>
    <div className="service-cms-tabs" aria-label="انتخاب خدمت">
      {SERVICE_SLUGS.map(item => <button type="button" key={item} aria-pressed={slug === item} onClick={() => {setSlug(item);setMessage('');}}>{names[item]}</button>)}
    </div>
    <div className="service-cms-tabs" aria-label="انتخاب زبان">
      {(['fa','en'] as const).map(lang => <button type="button" key={lang} aria-pressed={locale === lang} onClick={() => {setLocale(lang);setMessage('');}}>{lang === 'fa' ? 'فارسی' : 'English'}</button>)}
    </div>
    <p className="service-cms-note">ویرایش این صفحه از بخش سفارش و اطلاعات حساب مستقل است. برای بهتر دیده‌شدن متن جدید در گوگل، بعد از ویرایش‌های مهم یک انتشار مجدد هم توصیه می‌شود.</p>
    {message && <p className="service-cms-message" role="status">{message}</p>}
    {loading && !pages ? <p>در حال دریافت محتوای خدمات…</p> : !current ?
      <button type="button" onClick={() => void refresh()}>تلاش مجدد برای دریافت محتوا</button> :
      <form onSubmit={save}>
        <fieldset disabled={saving || loading}>
          {groups.map(group => <section className="service-cms-group" key={group.title} aria-label={group.title}>
            <h3>{group.title}</h3>
            <div className="service-cms-fields">{group.keys.map(field => <label key={field}>
              <span>{labels[field]}</span>
              {multiline.has(field) ?
                <textarea maxLength={4000} rows={field==='lead'||field==='detailsBody'?4:2} dir={locale === 'fa' ? 'rtl' : 'ltr'} value={current[field]} onChange={event => change(field,event.target.value)}/> :
                <input type="text" maxLength={4000} dir={locale === 'fa' ? 'rtl' : 'ltr'} value={current[field]} onChange={event => change(field,event.target.value)}/>}
            </label>)}</div>
          </section>)}
          <div className="service-cms-actions">
            <button type="submit">{saving?'در حال ذخیره…':'ذخیره تغییرات همین صفحه'}</button>
            <button type="button" className="secondary" onClick={() => {
              if(!confirm('متن‌های پیشنهادی این زبان در فرم جایگزین شوند؟ تا زمان ذخیره در سایت اعمال نخواهند شد.'))return;
              setPages(old => old ? {...old,[key]:{...SERVICE_DEFAULT_CONTENT[key]}} : old);
              setMessage('متن‌های پیش‌فرض در فرم قرار گرفتند؛ برای اعمال، ذخیره کنید.');
            }}>بازیابی متن‌های اولیه</button>
          </div>
        </fieldset>
      </form>}
  </section>;
}
