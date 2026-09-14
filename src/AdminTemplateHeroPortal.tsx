import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { StudioIcon } from './StudioIcon';
import {
  loadTemplateHeroImages,
  removeTemplateHeroImage,
  setTemplateHeroImage,
  templateHeroPublicUrl,
  type TemplateHeroImage,
} from './templateHero';
import './admin-template-hero.css';

const FALLBACK = '/images/scientific-cell-hero.webp';

export function AdminTemplateHeroPortal() {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [images, setImages] = useState<TemplateHeroImage[]>([]);
  const [busySlot, setBusySlot] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const refresh = async () => setImages(await loadTemplateHeroImages());

  useEffect(() => {
    const mount = () => {
      const anchor = document.querySelector<HTMLElement>('.admin-showcase-actions');
      if (!anchor || document.querySelector('[data-admin-template-hero-root]')) return;
      const node = document.createElement('div');
      node.dataset.adminTemplateHeroRoot = 'true';
      anchor.insertAdjacentElement('afterend', node);
      setHost(node);
      void refresh().catch(error => setMessage(error instanceof Error ? error.message : 'خطا در دریافت تصاویر Hero'));
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const slots = useMemo(() => ([1, 2, 3] as const).map(slot => ({ slot, image: images.find(item => item.slot === slot) })), [images]);

  const upload = (slot: 1 | 2 | 3, current: TemplateHeroImage | undefined, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusySlot(slot); setMessage('');
    void setTemplateHeroImage(slot, file, current)
      .then(refresh)
      .then(() => setMessage(`تصویر ${slot} Hero به‌روزرسانی شد.`))
      .catch(error => setMessage(error instanceof Error ? error.message : 'آپلود انجام نشد.'))
      .finally(() => setBusySlot(null));
  };

  const remove = (image: TemplateHeroImage) => {
    if (!confirm(`تصویر ${image.slot} حذف شود و تصویر پیش‌فرض نمایش داده شود؟`)) return;
    setBusySlot(image.slot); setMessage('');
    void removeTemplateHeroImage(image)
      .then(refresh)
      .then(() => setMessage(`تصویر ${image.slot} حذف شد.`))
      .catch(error => setMessage(error instanceof Error ? error.message : 'حذف انجام نشد.'))
      .finally(() => setBusySlot(null));
  };

  if (!host) return null;

  return createPortal(<section className="admin-template-hero">
    <div className="admin-template-hero-head">
      <div><span>TEMPLATES HERO</span><h2>مدیریت تصاویر بالای صفحه Templates</h2><p>سه تصویر کلاژ Hero را از همین‌جا عوض کن. تغییرات بعد از آپلود مستقیماً در صفحه Templates دیده می‌شوند.</p></div>
      <a href="/templates" target="_blank" rel="noreferrer">مشاهده صفحه <StudioIcon name="arrow" size={15}/></a>
    </div>

    {message && <div className="admin-template-hero-message">{message}</div>}

    <div className="admin-template-hero-grid">{slots.map(({ slot, image }) => <article key={slot} className="admin-template-hero-card">
      <div className="admin-template-hero-preview">
        <img src={image ? templateHeroPublicUrl(image.storagePath) : FALLBACK} alt=""/>
        <span>0{slot}</span>
        {!image && <em>پیش‌فرض</em>}
      </div>
      <div className="admin-template-hero-card-body">
        <div><strong>تصویر {slot}</strong><small>{slot === 1 ? 'کارت اصلی بالا' : slot === 2 ? 'کارت عمودی سمت راست' : 'کارت پایین کلاژ'}</small></div>
        <label className={busySlot === slot ? 'busy' : ''}><input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" disabled={busySlot !== null} onChange={event => upload(slot, image, event)}/><StudioIcon name="upload" size={16}/>{image ? 'جایگزینی' : 'آپلود تصویر'}</label>
        {image && <button disabled={busySlot !== null} onClick={() => remove(image)}>بازگشت به پیش‌فرض</button>}
      </div>
    </article>)}</div>
    <div className="admin-template-hero-tip"><StudioIcon name="image" size={18}/><span><b>پیشنهاد:</b> برای نتیجه بهتر از تصاویر عمودی یا مربعی با کیفیت بالا و بدون متن ریز استفاده کن. WebP یا JPG سبک، سرعت صفحه را بهتر نگه می‌دارد.</span></div>
  </section>, host);
}
