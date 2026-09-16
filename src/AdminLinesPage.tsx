import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { sanitizeSvg } from './assets';
import { getAdminSessionState } from './adminAuth';
import { CloudAsset, createCloudCategory, deleteCloudAsset, loadAdminCloudAssets, loadCloudCategories, patchCloudAsset, saveCloudAsset } from './cloudAssetLibrary';
import './admin-lines.css';

export const LINE_CATEGORY = 'Lines & Arrows';

export function AdminLinesPage() {
  const [access, setAccess] = useState<'loading' | 'denied' | 'admin'>('loading');
  const [items, setItems] = useState<CloudAsset[]>([]);
  const [name, setName] = useState('');
  const [nameFa, setNameFa] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [svg, setSvg] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = async () => {
    const assets = await loadAdminCloudAssets();
    setItems(assets.filter(item => item.category === LINE_CATEGORY));
  };

  useEffect(() => {
    let live = true;
    void getAdminSessionState().then(async session => {
      if (!live) return;
      if (!session.isAdmin) { setAccess('denied'); return; }
      setAccess('admin');
      try { const assets = await loadAdminCloudAssets(); if (live) setItems(assets.filter(item => item.category === LINE_CATEGORY)); }
      catch (error) { if (live) setNotice(error instanceof Error ? error.message : 'دریافت خطوط انجام نشد.'); }
    }).catch(() => { if (live) setAccess('denied'); });
    return () => { live = false; };
  }, []);

  const choose = async (event: ChangeEvent<HTMLInputElement>) => {
    const candidate = event.target.files?.[0];
    event.target.value = '';
    if (!candidate) return;
    setNotice('');
    try {
      if (!candidate.name.toLowerCase().endsWith('.svg') || candidate.size > 2_500_000) throw new Error('فقط SVG با حجم حداکثر ۲.۵ مگابایت مجاز است.');
      const safe = sanitizeSvg(await candidate.text());
      setFile(candidate);
      setSvg(safe);
      setName(current => current || candidate.name.replace(/\.svg$/i, '').replace(/[-_]+/g, ' '));
    } catch (error) { setNotice(error instanceof Error ? error.message : 'فایل نامعتبر است.'); }
  };

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!file || !svg || !name.trim()) return;
    setBusy(true); setNotice('');
    try {
      const categories = await loadCloudCategories();
      if (!categories.some(category => category.slug === LINE_CATEGORY)) await createCloudCategory(LINE_CATEGORY, 'خطوط و فلش‌ها');
      await saveCloudAsset({ name: name.trim(), nameFa: nameFa.trim(), category: LINE_CATEGORY, renderSvg: svg, sourceType: 'svg', synonyms: { en: [], fa: [] }, reviewStatus: 'draft', premium: false, active: true, featured: false }, file);
      setName(''); setNameFa(''); setSvg(''); setFile(null);
      await refresh();
      setNotice('خط در کتابخانه ابری منتشر شد؛ پس از همگام‌سازی در پنل Lines دیده می‌شود.');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'انتشار خط انجام نشد.'); }
    finally { setBusy(false); }
  };

  const toggle = async (item: CloudAsset) => {
    setBusy(true); setNotice('');
    try { await patchCloudAsset(item, { active: item.active === false }); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تغییر وضعیت انجام نشد.'); }
    finally { setBusy(false); }
  };

  const remove = async (item: CloudAsset) => {
    if (!window.confirm(`خط «${item.nameFa || item.name}» حذف شود؟`)) return;
    setBusy(true); setNotice('');
    try { await deleteCloudAsset(item); await refresh(); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'حذف انجام نشد.'); }
    finally { setBusy(false); }
  };

  if (access !== 'admin') return <main className="admin-lines-page" dir="rtl"><h1>مدیریت خطوط BioPlot</h1><p>{access === 'loading' ? 'در حال بررسی دسترسی مدیر…' : 'این صفحه فقط برای مدیر فعال است.'}</p><a href="/admin/library">ورود / بازگشت به مدیریت</a></main>;

  return <main className="admin-lines-page" dir="rtl">
    <header className="admin-lines-header"><div><small>BIOPLOT ADMIN / VECTOR ASSETS</small><h1>مدیریت خطوط و فلش‌ها</h1><p>خطوط دلخواه را با فرمت SVG اضافه و منتشر کن. تصاویر دیگر کتابخانه تغییر نمی‌کنند.</p></div><nav><a href="/admin/library">مدیریت کتابخانه</a><a href="/editor">مشاهده در ادیتور</a></nav></header>
    <div className="admin-lines-body">
      <form className="admin-lines-upload" onSubmit={event => void publish(event)}><h2>افزودن نمونه جدید</h2><p>فایل برداری مستقل و سبک با نمای قابل تشخیص در کارت انتخاب کنید.</p><label className="admin-lines-file">{svg ? <span dangerouslySetInnerHTML={{ __html: svg }} /> : <span>+ انتخاب فایل SVG</span>}<input type="file" accept=".svg,image/svg+xml" onChange={event => void choose(event)} /></label><label>نام انگلیسی<input required maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="e.g. Molecular inhibition" /></label><label>نام فارسی<input maxLength={100} value={nameFa} onChange={event => setNameFa(event.target.value)} placeholder="مثلاً فلش مهاری" /></label><button className="admin-lines-primary" disabled={busy || !file || !name.trim()} type="submit">{busy ? 'در حال ذخیره…' : 'انتشار در Lines'}</button><p className="admin-lines-note">برای تغییر اطلاعات و تصویر نمونه‌های منتشرشده، از «مدیریت کتابخانه» استفاده کن؛ دستهٔ Lines & Arrows را انتخاب کن.</p></form>
      <section className="admin-lines-library"><div className="admin-lines-library-head"><h2>خطوط منتشرشده</h2><span>{items.length} مورد</span></div>{items.length ? <div className="admin-lines-grid">{items.map(item => <article key={item.id} className="admin-lines-item"><div className="admin-lines-preview" dangerouslySetInnerHTML={{ __html: item.svg }} /><strong>{item.nameFa || item.name}</strong><small>{item.name}</small><div><button type="button" disabled={busy} onClick={() => void toggle(item)}>{item.active === false ? 'انتشار' : 'غیرفعال‌کردن'}</button><button type="button" disabled={busy} className="danger" onClick={() => void remove(item)}>حذف</button></div></article>)}</div> : <p className="admin-lines-empty">هنوز خط سفارشی ثبت نشده است.</p>}</section>
    </div>{notice && <p className="admin-lines-message" role="status">{notice}</p>}
  </main>;
}
