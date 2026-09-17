import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { StudioIcon } from './StudioIcon';
import {
  HOME_HERO_DEFAULTS,
  loadHomeHeroImages,
  removeHomeHeroImage,
  setHomeHeroImage,
  homeHeroPublicUrl,
  type HomeHeroImage,
} from './homeHero';
import './admin-template-hero.css';


export function AdminHomeHero() {
  const [images, setImages] = useState<HomeHeroImage[]>([]);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const refresh = async () => setImages(await loadHomeHeroImages());

  useEffect(() => { void refresh().catch(error=>setMessage(error instanceof Error?error.message:'خطا در دریافت تصاویر')); }, []);

  const slots = useMemo(() => ([1, 2, 3] as const).map(slot => ({ slot, image: images.find(item => item.slot === slot) })), [images]);

  const upload = (slot: 1 | 2 | 3, current: HomeHeroImage | undefined, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusySlot(slot); setMessage('');
    void setHomeHeroImage(slot, file, current)
      .then(refresh)
      .then(() => setMessage(`تصویر ${slot} Hero به‌روزرسانی شد.`))
      .catch(error => setMessage(error instanceof Error ? error.message : 'آپلود انجام نشد.'))
      .finally(() => setBusySlot(null));
  };

  const remove = (image: HomeHeroImage) => {
    if (!confirm(`تصویر ${image.slot} حذف شود و تصویر پیش‌فرض نمایش داده شود؟`)) return;
    setBusySlot(image.slot); setMessage('');
    void removeHomeHeroImage(image)
      .then(refresh)
      .then(() => setMessage(`تصویر ${image.slot} حذف شد.`))
      .catch(error => setMessage(error instanceof Error ? error.message : 'حذف انجام نشد.'))
      .finally(() => setBusySlot(null));
  };


  return <section className="admin-template-hero">
    <div className="admin-template-hero-head">
      <div><span>HOME HERO</span><h2>مدیریت تصاویر بالای صفحه Home</h2><p>سه تصویر بخش بالای Home را از همین‌جا عوض کن. تغییرات بعد از آپلود مستقیماً در صفحه Home دیده می‌شوند.</p></div>
      <a href="/" target="_blank" rel="noreferrer">مشاهده صفحه <StudioIcon name="arrow" size={15}/></a>
    </div>

    {message && <div role="status" className="admin-template-hero-message">{message}</div>}

    <div className="admin-template-hero-grid">{slots.map(({ slot, image }) => <article key={slot} className="admin-template-hero-card">
      <div className="admin-template-hero-preview">
        <img src={image ? homeHeroPublicUrl(image.storagePath) : HOME_HERO_DEFAULTS[slot-1]} alt=""/>
        <span>0{slot}</span>
        {!image && <em>پیش‌فرض</em>}
      </div>
      <div className="admin-template-hero-card-body">
        <div><strong>تصویر {slot}</strong><small>{slot === 1 ? 'قاب چپ' : slot === 2 ? 'قاب وسط' : 'قاب راست'}</small></div>
        <label className={busySlot === slot ? 'busy' : ''}><input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" disabled={busySlot !== null} onChange={event => upload(slot, image, event)}/><StudioIcon name="upload" size={16}/>{image ? 'جایگزینی' : 'آپلود تصویر'}</label>
        {image && <button disabled={busySlot !== null} onClick={() => remove(image)}>بازگشت به پیش‌فرض</button>}
      </div>
    </article>)}</div>
    <div className="admin-template-hero-tip"><StudioIcon name="image" size={18}/><span><b>پیشنهاد:</b> برای نتیجه بهتر از تصاویر عمودی یا مربعی با کیفیت بالا و بدون متن ریز استفاده کن. WebP یا JPG سبک، سرعت صفحه را بهتر نگه می‌دارد.</span></div>
  </section>;
}
