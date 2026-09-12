import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { sanitizeSvg } from './assets';
import type { AssetStylePresetConfig } from './assetStyling';
import { claimAdmin, getAdminSessionState, signInAdmin, signOutAdmin, signUpAdmin } from './adminAuth';
import {
  CloudAsset,
  CloudAssetDraft,
  CloudCategory,
  createCloudCategory,
  deleteCloudAsset,
  deleteCloudCategory,
  loadAdminCloudAssets,
  loadCloudCategories,
  patchCloudAsset,
  saveCloudAsset,
  updateCloudCategory,
} from './cloudAssetLibrary';
import { StudioIcon } from './StudioIcon';
import './admin-library.css';
import './admin-access.css';

type Gate = 'loading' | 'signed-out' | 'claim' | 'admin';
type Draft = CloudAssetDraft & { tagsEn: string; tagsFa: string };

const originalPreset: AssetStylePresetConfig = { id: 'original', label: 'Original', labelFa: 'اصلی', kind: 'original' };
const freshDraft = (): Draft => ({
  name: '', nameFa: '', category: '', description: '', descriptionFa: '',
  synonyms: { en: [], fa: [] }, tagsEn: '', tagsFa: '', renderSvg: '', sourceType: 'svg',
  reviewStatus: 'draft', premium: false, active: true, featured: false,
  stylePresets: [{ ...originalPreset }],
});
const split = (value: string) => value.split(/[,،\n]/).map(item => item.trim()).filter(Boolean);

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
function imageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth || 800, height: image.naturalHeight || 600 });
    image.onerror = () => reject(new Error('Could not read image dimensions'));
    image.src = src;
  });
}
async function fileToRender(file: File): Promise<{ renderSvg: string; sourceType: Draft['sourceType'] }> {
  if (file.size > 2_500_000) throw new Error('حداکثر حجم فایل ۲.۵ مگابایت است.');
  if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
    return { renderSvg: sanitizeSvg(await file.text()), sourceType: 'svg' };
  }
  const mime = file.type.toLowerCase();
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('فقط SVG، PNG، JPG و WebP پشتیبانی می‌شوند.');
  const data = await readAsDataUrl(file);
  const { width, height } = await imageSize(data);
  const sourceType: Draft['sourceType'] = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpeg';
  return { sourceType, renderSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><image href="${data}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/></svg>` };
}
function assetToDraft(asset: CloudAsset): Draft {
  return {
    name: asset.name, nameFa: asset.nameFa ?? '', category: asset.category,
    description: asset.description ?? '', descriptionFa: asset.descriptionFa ?? '',
    synonyms: asset.synonyms, tagsEn: asset.synonyms.en.join(', '), tagsFa: asset.synonyms.fa.join('، '),
    renderSvg: asset.svg, sourceType: asset.sourceType ?? 'svg', reviewStatus: asset.reviewStatus,
    premium: asset.premium, active: asset.active !== false, featured: Boolean(asset.featured),
    stylePresets: asset.stylePresets ? structuredClone(asset.stylePresets) : undefined,
  };
}

function AuthCard({ gate, onReady }: { gate: Exclude<Gate, 'loading' | 'admin'>; onReady: () => Promise<void> }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const result = mode === 'login' ? await signInAdmin(email, password) : await signUpAdmin(email, password);
      if (result.error) throw result.error;
      if (mode === 'signup' && !result.data.session) setMessage('حساب ساخته شد. اگر تأیید ایمیل فعال باشد، ابتدا لینک ارسالی به ایمیل را باز کن و بعد وارد شو.');
      await onReady();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ورود انجام نشد.'); }
    finally { setBusy(false); }
  };
  const submitClaim = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('');
    try {
      const ok = await claimAdmin(token);
      if (!ok) throw new Error('کد فعال‌سازی معتبر نیست یا ادمین قبلاً ثبت شده است.');
      await onReady();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'فعال‌سازی انجام نشد.'); }
    finally { setBusy(false); }
  };

  return <div className="admin-auth-shell" dir="rtl"><section className="admin-auth-card">
    <div className="admin-auth-brand"><span>B</span><div><strong>BioPlot Admin</strong><small>دسترسی امن مدیریت کتابخانه</small></div></div>
    {gate === 'signed-out' ? <>
      <h1>ورود مدیر</h1><p>برای مدیریت دسته‌بندی‌ها و تصاویر علمی با حساب Supabase وارد شو.</p>
      <div className="admin-auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>ورود</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>ساخت حساب</button></div>
      <form className="admin-auth-form" onSubmit={submitAuth}><label>ایمیل<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label><label>رمز عبور<input type="password" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></label><button disabled={busy}>{busy ? 'در حال بررسی…' : mode === 'login' ? 'ورود به مدیریت' : 'ساخت حساب مدیر'}</button></form>
    </> : <>
      <h1>فعال‌سازی دسترسی مدیر</h1><p>حساب وارد شده هنوز Admin نیست. کد راه‌اندازی یک‌بارمصرف را وارد کن؛ بعد از موفقیت، این کد برای همیشه باطل می‌شود.</p>
      <form className="admin-auth-form" onSubmit={submitClaim}><label>کد راه‌اندازی<input value={token} onChange={e => setToken(e.target.value)} required /></label><button disabled={busy}>{busy ? 'در حال فعال‌سازی…' : 'ثبت این حساب به‌عنوان Admin'}</button></form>
    </>}
    {message && <div className={`admin-auth-message ${message.includes('نیست') || message.includes('نش') ? 'error' : ''}`}>{message}</div>}
    <div className="admin-auth-user"><a href="/editor">بازگشت به ویرایشگر</a>{gate === 'claim' && <button onClick={() => void signOutAdmin().then(() => location.reload())}>خروج از حساب</button>}</div>
  </section></div>;
}

export function AdminLibraryPage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [email, setEmail] = useState('');
  const [assets, setAssets] = useState<CloudAsset[]>([]);
  const [categories, setCategories] = useState<CloudCategory[]>([]);
  const [draft, setDraft] = useState<Draft>(() => freshDraft());
  const [file, setFile] = useState<File | null>(null);
  const [editing, setEditing] = useState<CloudAsset | null>(null);
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryFa, setNewCategoryFa] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const checkAccess = async () => {
    const state = await getAdminSessionState();
    setEmail(state.user?.email ?? '');
    setGate(!state.user ? 'signed-out' : state.isAdmin ? 'admin' : 'claim');
  };
  const refresh = async () => {
    const [nextAssets, nextCategories] = await Promise.all([loadAdminCloudAssets(), loadCloudCategories()]);
    setAssets(nextAssets); setCategories(nextCategories);
  };
  useEffect(() => { void checkAccess(); }, []);
  useEffect(() => { if (gate === 'admin') void refresh().catch(error => setMessage(error instanceof Error ? error.message : 'خطا در دریافت اطلاعات')); }, [gate]);

  const visible = useMemo(() => assets.filter(asset => {
    if (filterCategory && asset.category !== filterCategory) return false;
    if (!query.trim()) return true;
    const hay = [asset.name, asset.nameFa ?? '', asset.category, asset.description ?? '', asset.descriptionFa ?? '', ...asset.synonyms.en, ...asset.synonyms.fa].join(' ').toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  }), [assets, filterCategory, query]);

  if (gate === 'loading') return <div className="editor-cloud-loading"><span>B</span><strong>BioPlot Admin</strong><small>در حال بررسی دسترسی…</small></div>;
  if (gate !== 'admin') return <AuthCard gate={gate} onReady={checkAccess} />;

  const reset = () => { setEditing(null); setFile(null); setDraft(freshDraft()); setMessage(''); };
  const pickFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0]; if (!next) return;
    setBusy(true); setMessage('');
    try { const converted = await fileToRender(next); setFile(next); setDraft(current => ({ ...current, ...converted, name: current.name || next.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') })); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'خواندن فایل انجام نشد.'); }
    finally { setBusy(false); event.target.value = ''; }
  };
  const submitAsset = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.name.trim() || !draft.category || !draft.renderSvg) { setMessage('نام، دسته‌بندی و تصویر الزامی است.'); return; }
    setBusy(true); setMessage('');
    try {
      await saveCloudAsset({ ...draft, synonyms: { en: split(draft.tagsEn), fa: split(draft.tagsFa) } }, file, editing ?? undefined);
      await refresh(); reset(); setMessage(editing ? 'تغییرات روی Supabase ذخیره شد.' : 'المان منتشر شد و برای کاربران Library قابل دریافت است.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'ذخیره انجام نشد.'); }
    finally { setBusy(false); }
  };
  const editAsset = (asset: CloudAsset) => { setEditing(asset); setFile(null); setDraft(assetToDraft(asset)); setMessage(''); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const removeAsset = async (asset: CloudAsset) => { if (!confirm(`«${asset.name}» حذف شود؟`)) return; setBusy(true); try { await deleteCloudAsset(asset); await refresh(); if (editing?.id === asset.id) reset(); } finally { setBusy(false); } };
  const toggle = async (asset: CloudAsset, key: 'active' | 'featured' | 'premium') => { await patchCloudAsset(asset, { [key]: !asset[key] }); await refresh(); };
  const addCategory = async (event: FormEvent) => { event.preventDefault(); if (!newCategory.trim()) return; await createCloudCategory(newCategory, newCategoryFa); setNewCategory(''); setNewCategoryFa(''); await refresh(); };
  const renameCategory = async (category: CloudCategory) => { const en = prompt('نام انگلیسی دسته', category.nameEn); if (!en) return; const fa = prompt('نام فارسی دسته', category.nameFa ?? '') ?? ''; await updateCloudCategory(category.slug, en, fa); if (filterCategory === category.slug) setFilterCategory(en.trim()); await refresh(); };
  const removeCategory = async (category: CloudCategory) => { if (!confirm(`دسته «${category.nameEn}» حذف شود؟`)) return; await deleteCloudCategory(category.slug); if (filterCategory === category.slug) setFilterCategory(''); await refresh(); };
  const exportBackup = () => { const blob = new Blob([JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), categories, assets }, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `bioplot-cloud-library-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url); };
  const customizePresets = () => setDraft(current => ({ ...current, stylePresets: [{ ...originalPreset }] }));
  const toggleOriginalPreset = (enabled: boolean) => setDraft(current => {
    const presets = current.stylePresets ?? [];
    const withoutOriginal = presets.filter(item => item.kind !== 'original');
    return { ...current, stylePresets: enabled ? [{ ...originalPreset }, ...withoutOriginal] : withoutOriginal };
  });
  const addColorPreset = () => setDraft(current => {
    const presets = current.stylePresets ?? [];
    const count = presets.filter(item => item.kind === 'tint').length + 1;
    const preset: AssetStylePresetConfig = { id: `color-${Date.now()}-${count}`, label: `Color ${count}`, labelFa: `رنگ ${count}`, kind: 'tint', color: '#087f79' };
    return { ...current, stylePresets: [...presets, preset] };
  });
  const updatePreset = (index: number, changes: Partial<AssetStylePresetConfig>) => setDraft(current => ({ ...current, stylePresets: (current.stylePresets ?? []).map((item, itemIndex) => itemIndex === index ? { ...item, ...changes } : item) }));
  const removePreset = (index: number) => setDraft(current => ({ ...current, stylePresets: (current.stylePresets ?? []).filter((_, itemIndex) => itemIndex !== index) }));

  return <div className="admin-library" dir="rtl">
    <header className="admin-header"><div className="admin-brand"><span>B</span><div><strong>BioPlot Admin</strong><small>Supabase Library Manager</small></div></div><nav><div className="admin-header-user"><small>{email}</small><button onClick={() => void signOutAdmin().then(() => location.reload())}>خروج</button></div><a href="/">داشبورد</a><a className="primary" href="/editor">ویرایشگر</a></nav></header>
    <main className="admin-layout">
      <aside className="admin-sidebar"><div className="admin-sidebar-title"><div><strong>دسته‌بندی‌ها</strong><small>{categories.length} دسته ابری</small></div></div><button className={!filterCategory ? 'active' : ''} onClick={() => setFilterCategory('')}>همه المان‌ها <span>{assets.length}</span></button>{categories.map(category => <div className={`admin-category-row ${filterCategory === category.slug ? 'active' : ''}`} key={category.slug}><button onClick={() => setFilterCategory(category.slug)}>{category.nameFa || category.nameEn}<span>{assets.filter(a => a.category === category.slug).length}</span></button><details><summary>•••</summary><div className="category-menu"><button onClick={() => void renameCategory(category)}>تغییر نام</button>{category.slug !== 'Uncategorized' && <button className="danger" onClick={() => void removeCategory(category)}>حذف دسته</button>}</div></details></div>)}<form className="new-category" onSubmit={e => void addCategory(e)}><strong>دسته جدید</strong><input placeholder="نام انگلیسی" value={newCategory} onChange={e => setNewCategory(e.target.value)} /><input placeholder="نام فارسی" value={newCategoryFa} onChange={e => setNewCategoryFa(e.target.value)} /><button><StudioIcon name="plus" /> افزودن دسته</button></form></aside>
      <section className="admin-content">
        <div className="admin-page-title"><div><p>SUPABASE LIBRARY MANAGER</p><h1>مدیریت مرکزی المان‌های علمی</h1><span>هر چیزی که اینجا منتشر کنی، از Supabase برای کاربران BioPlot بارگذاری می‌شود.</span></div><div className="admin-stat"><strong>{assets.length}</strong><span>المان ابری</span></div><div className="admin-stat"><strong>{assets.filter(a => a.active).length}</strong><span>منتشرشده</span></div></div>
        <div className="admin-cloud-note"><StudioIcon name="check" /><div><strong>Supabase Database + Storage فعال است</strong><span>اطلاعات در Database و فایل اصلی در public-assets ذخیره می‌شود. RLS نوشتن و حذف را فقط برای حساب Admin مجاز می‌کند.</span></div></div>
        <section className="admin-editor-card"><div className="admin-editor-head"><div><strong>{editing ? 'ویرایش المان' : 'افزودن المان جدید'}</strong><span>{editing ? 'فایل جدید اختیاری است.' : 'SVG، PNG، JPG یا WebP تا ۲.۵MB'}</span></div>{editing && <button onClick={reset}>لغو ویرایش</button>}</div><form className="asset-editor-form" onSubmit={e => void submitAsset(e)}><label className={`asset-drop ${draft.renderSvg ? 'has-preview' : ''}`}><input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" onChange={e => void pickFile(e)} />{draft.renderSvg ? <span className="asset-upload-preview" dangerouslySetInnerHTML={{ __html: draft.renderSvg }} /> : <><StudioIcon name="upload" /><strong>{busy ? 'در حال پردازش…' : 'تصویر را انتخاب کن'}</strong><small>SVG / PNG / JPG / WebP</small></>}</label><div className="asset-fields"><div className="field-pair"><label>نام انگلیسی<input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></label><label>نام فارسی<input value={draft.nameFa ?? ''} onChange={e => setDraft({ ...draft, nameFa: e.target.value })} /></label></div><div className="field-pair"><label>دسته‌بندی<select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value })} required><option value="">انتخاب دسته</option>{categories.map(c => <option value={c.slug} key={c.slug}>{c.nameEn}{c.nameFa ? ` — ${c.nameFa}` : ''}</option>)}</select></label><label>وضعیت علمی<select value={draft.reviewStatus} onChange={e => setDraft({ ...draft, reviewStatus: e.target.value as Draft['reviewStatus'] })}><option value="draft">Draft</option><option value="reviewed">Reviewed</option></select></label></div><div className="field-pair"><label>کلیدواژه انگلیسی<input value={draft.tagsEn} onChange={e => setDraft({ ...draft, tagsEn: e.target.value })} /></label><label>کلیدواژه فارسی<input value={draft.tagsFa} onChange={e => setDraft({ ...draft, tagsFa: e.target.value })} /></label></div><div className="field-pair"><label>توضیح انگلیسی<textarea rows={2} value={draft.description ?? ''} onChange={e => setDraft({ ...draft, description: e.target.value })} /></label><label>توضیح فارسی<textarea rows={2} value={draft.descriptionFa ?? ''} onChange={e => setDraft({ ...draft, descriptionFa: e.target.value })} /></label></div>
        <section className="admin-preset-editor"><div className="admin-preset-head"><div><strong>رنگ‌های قابل انتخاب در Editor</strong><span>تعداد و رنگ گزینه‌هایی که کاربر برای این شکل می‌بیند را خودت تعیین کن.</span></div>{draft.stylePresets===undefined?<button type="button" onClick={customizePresets}>شخصی‌سازی رنگ‌ها</button>:<b>{draft.stylePresets.length} گزینه</b>}</div>{draft.stylePresets===undefined?<div className="admin-preset-legacy">این المان فعلاً از پالت پیش‌فرض قدیمی BioPlot استفاده می‌کند. برای کنترل دقیق، «شخصی‌سازی رنگ‌ها» را بزن.</div>:<><label className="admin-original-toggle"><input type="checkbox" checked={draft.stylePresets.some(item=>item.kind==='original')} onChange={e=>toggleOriginalPreset(e.target.checked)}/><span>نمایش رنگ اصلی تصویر (Original)</span></label><div className="admin-preset-list">{draft.stylePresets.map((preset,index)=>preset.kind==='tint'?<div className="admin-preset-row" key={preset.id}><input type="color" value={preset.color??'#087f79'} onChange={e=>updatePreset(index,{color:e.target.value})}/><label>نام انگلیسی<input value={preset.label} onChange={e=>updatePreset(index,{label:e.target.value})}/></label><label>نام فارسی<input value={preset.labelFa??''} onChange={e=>updatePreset(index,{labelFa:e.target.value})}/></label><button type="button" className="danger" onClick={()=>removePreset(index)}>حذف</button></div>:null)}</div><button type="button" className="add-preset" onClick={addColorPreset}><StudioIcon name="plus"/> افزودن رنگ</button><small className="admin-preset-tip">مثال: برای Mouse می‌توانی Original را خاموش کنی و فقط Black #000000 و White #FFFFFF بسازی.</small></>}</section>
        <div className="asset-switches"><label><input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} /><span>منتشر در Library</span></label><label><input type="checkbox" checked={draft.featured} onChange={e => setDraft({ ...draft, featured: e.target.checked })} /><span>Featured</span></label><label><input type="checkbox" checked={draft.premium} onChange={e => setDraft({ ...draft, premium: e.target.checked })} /><span>Premium</span></label></div><div className="asset-form-actions"><button type="submit" className="save" disabled={busy}>{editing ? 'ذخیره تغییرات' : 'انتشار در Library'}</button><button type="button" onClick={reset}>پاک کردن فرم</button>{message && <span>{message}</span>}</div></div></form></section>
        <section className="admin-assets-card"><div className="admin-assets-toolbar"><div><strong>المان‌های Supabase</strong><span>{visible.length} مورد</span></div><input placeholder="جستجو…" value={query} onChange={e => setQuery(e.target.value)} /><button onClick={exportBackup}>خروجی JSON</button></div><div className="admin-asset-grid">{visible.map(asset => <article className="admin-asset-card" key={asset.id}><div className="admin-asset-preview" dangerouslySetInnerHTML={{ __html: asset.svg }} /><div className="admin-asset-info"><strong>{asset.nameFa || asset.name}</strong><span>{asset.nameFa ? asset.name : asset.category}</span><small>{asset.category} · {asset.reviewStatus}</small></div><div className="admin-asset-flags"><button className={asset.active ? 'on' : ''} onClick={() => void toggle(asset, 'active')}>{asset.active ? 'منتشر' : 'مخفی'}</button><button className={asset.featured ? 'on' : ''} onClick={() => void toggle(asset, 'featured')}>Featured</button><button className={asset.premium ? 'on' : ''} onClick={() => void toggle(asset, 'premium')}>Premium</button></div><div className="admin-asset-actions"><button onClick={() => editAsset(asset)}>ویرایش</button><button className="danger" onClick={() => void removeAsset(asset)}>حذف</button></div></article>)}</div>{!visible.length && <p className="asset-empty">هنوز المانی در این بخش وجود ندارد.</p>}</section>
      </section>
    </main>
  </div>;
}
