import { useEffect, useState, type FormEvent } from 'react';
import { loadHomeContent, saveHomeContent, type HomeContent } from './homeContent';
import { HOME_BANNER_DEFAULTS, HOME_BANNER_FIELDS, normalizeHomeBanner } from './homeBannerContent';
import './admin-home-text.css';
const labels = { title: 'عنوان اصلی بنر', subtitle: 'متن زیر عنوان', primaryText: 'متن دکمه سفارش طراحی', secondaryText: 'متن دکمه نمونه‌کارها' };
export function AdminHomeBanner() {
  const [content, setContent] = useState<HomeContent | null>(null);
  const [locale, setLocale] = useState<'fa' | 'en'>('fa');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const load = () => {
    setMessage('');
    void loadHomeContent().then(next => setContent({...next, banner: normalizeHomeBanner(next.banner)}))
      .catch(() => setMessage('دریافت متن بنر انجام نشد؛ دوباره تلاش کنید.'));
  };
  useEffect(load, []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!content?.banner) return;
    setBusy(true); setMessage('');
    try {
      // Refresh the legacy text before saving, preserving edits in its archived panel.
      const latest = await loadHomeContent();
      await saveHomeContent({...latest, banner: content.banner});
      setMessage('نوشته‌های فارسی و انگلیسی بنر ذخیره شدند.');
    } catch { setMessage('ذخیره انجام نشد؛ تغییرات شما در فرم باقی مانده‌اند.'); }
    finally { setBusy(false); }
  };
  return <section className="admin-template-hero admin-home-text">
    <div className="admin-template-hero-head"><div><span>HOME BANNER</span><h2>نوشته‌های بنر اصلی</h2><p>عنوان، زیرعنوان و متن دو دکمه را برای هر زبان جداگانه ویرایش کنید.</p></div><a href="/" target="_blank" rel="noreferrer">مشاهده صفحه</a></div>
    {message && <p role="status">{message}</p>}
    {!content?.banner ? <button onClick={load}>دریافت متن بنر</button> : <form onSubmit={submit}>
      <div className="home-text-languages">{(['fa','en'] as const).map(lang => <button key={lang} type="button" aria-pressed={locale === lang} onClick={() => setLocale(lang)}>{lang === 'fa' ? 'فارسی' : 'English'}</button>)}</div>
      <fieldset disabled={busy}><div className="home-text-fields">{HOME_BANNER_FIELDS.map(key => <label key={key}><span>{labels[key]}</span><textarea rows={key === 'title' ? 3 : 2} maxLength={2000} dir={locale === 'fa' ? 'rtl' : 'ltr'} value={content.banner![locale][key]} onChange={event => {
        setMessage('');
        setContent({...content, banner: {...content.banner!, [locale]: {...content.banner![locale], [key]: event.target.value}}});
      }}/></label>)}</div>
      <div className="home-text-actions"><button type="submit">{busy ? 'در حال ذخیره…' : 'ذخیره نوشته‌های بنر'}</button><button type="button" onClick={() => {
        setContent({...content, banner: {...content.banner!, [locale]: {...HOME_BANNER_DEFAULTS[locale]}}});
        setMessage('متن پیشنهادی بازیابی شد؛ برای اعمال، ذخیره کنید.');
      }}>بازیابی متن پیشنهادی این زبان</button></div></fieldset>
    </form>}
  </section>;
}
