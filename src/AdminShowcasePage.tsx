import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { documentToSvg } from './export';
import { getAdminSessionState, signOutAdmin } from './adminAuth';
import { ProjectSummary, projects } from './persistence';
import {
  ShowcaseItem,
  addShowcaseItem,
  deleteShowcaseItem,
  loadAdminShowcaseItems,
  moveShowcaseItem,
  replaceShowcaseItem,
  setShowcaseItemActive,
  showcaseLimit,
  showcasePublicUrl,
} from './showcasePortfolio';
import { StudioIcon } from './StudioIcon';
import './admin-showcase.css';
import './admin-access.css';

type Gate = 'loading' | 'denied' | 'admin';

function projectFile(title: string, svg: string) {
  const safe = title.trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '') || 'bioplot-project';
  return new File([svg], `${safe}.svg`, { type: 'image/svg+xml' });
}

export function AdminShowcasePage() {
  const [gate, setGate] = useState<Gate>('loading');
  const [email, setEmail] = useState('');
  const [items, setItems] = useState<ShowcaseItem[]>([]);
  const [projectList, setProjectList] = useState<ProjectSummary[]>([]);
  const [projectId, setProjectId] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const projectNames = useMemo(() => new Map(projectList.map(project => [project.id, project.title])), [projectList]);

  const refresh = async () => {
    const [nextItems, nextProjects] = await Promise.all([loadAdminShowcaseItems(), projects.list()]);
    setItems(nextItems);
    setProjectList(nextProjects);
    if (!projectId && nextProjects[0]) setProjectId(nextProjects[0].id);
  };

  useEffect(() => {
    void (async () => {
      const state = await getAdminSessionState();
      setEmail(state.user?.email ?? '');
      if (!state.user || !state.isAdmin) { setGate('denied'); return; }
      setGate('admin');
      try { await refresh(); }
      catch (error) { setMessage(error instanceof Error ? error.message : 'خطا در دریافت تصاویر Showcase'); }
    })();
  }, []);

  const run = async (action: () => Promise<void>, success?: string) => {
    setBusy(true); setMessage('');
    try {
      await action();
      await refresh();
      if (success) setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'عملیات انجام نشد.');
    } finally { setBusy(false); }
  };

  const addFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void run(() => addShowcaseItem(file), 'تصویر به Showcase اضافه شد.');
  };

  const addFromProject = () => {
    if (!projectId) return;
    void run(async () => {
      const documentState = await projects.load(projectId);
      if (!documentState) throw new Error('پروژه پیدا نشد.');
      await addShowcaseItem(projectFile(documentState.title, documentToSvg(documentState)), projectId);
    }, 'پیش‌نمایش پروژه به Showcase اضافه شد.');
  };

  const replaceFile = (item: ShowcaseItem, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void run(() => replaceShowcaseItem(item, file, ''), 'تصویر جایگزین شد.');
  };

  const refreshFromProject = (item: ShowcaseItem) => {
    if (!item.sourceProjectId) return;
    void run(async () => {
      const documentState = await projects.load(item.sourceProjectId!);
      if (!documentState) throw new Error('پروژه مرتبط پیدا نشد.');
      await replaceShowcaseItem(item, projectFile(documentState.title, documentToSvg(documentState)), item.sourceProjectId);
    }, 'تصویر از آخرین نسخه پروژه به‌روزرسانی شد.');
  };

  if (gate === 'loading') return <div className="editor-cloud-loading"><span>B</span><strong>BioPlot Admin</strong><small>در حال بررسی دسترسی…</small></div>;
  if (gate === 'denied') return <div className="admin-auth-shell" dir="rtl"><section className="admin-auth-card"><div className="admin-auth-brand"><span>B</span><div><strong>BioPlot Admin</strong><small>Showcase Manager</small></div></div><h1>دسترسی مدیر لازم است</h1><p>ابتدا از صفحه مدیریت کتابخانه وارد حساب Admin شو و سپس به این بخش برگرد.</p><a className="admin-showcase-login" href="/admin/library">ورود به Admin</a><div className="admin-auth-user"><a href="/">بازگشت به سایت</a></div></section></div>;

  return <div className="admin-showcase" dir="rtl">
    <header className="admin-showcase-header">
      <a className="admin-showcase-brand" href="/"><span>B</span><div><strong>BioPlot Admin</strong><small>Portfolio Showcase</small></div></a>
      <nav><a href="/">سایت</a><a href="/admin/library">کتابخانه</a><a href="/editor">ویرایشگر</a><div><small>{email}</small><button onClick={() => void signOutAdmin().then(() => location.href = '/admin/library')}>خروج</button></div></nav>
    </header>

    <main className="admin-showcase-main">
      <section className="admin-showcase-title">
        <div><span>PORTFOLIO SHOWCASE</span><h1>مدیریت تصاویر اختصاصی</h1><p>تصاویر این صفحه مستقیماً در بخش «تصاویر اختصاصی» سایت نمایش داده می‌شوند. متن روی اسلایدها نمایش داده نمی‌شود.</p></div>
        <div className="admin-showcase-count"><strong>{items.length}</strong><small>از {showcaseLimit} تصویر</small></div>
      </section>

      <section className="admin-showcase-actions">
        <label className={`admin-showcase-upload ${items.length >= showcaseLimit ? 'disabled' : ''}`}><input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" disabled={busy || items.length >= showcaseLimit} onChange={addFile}/><StudioIcon name="upload"/><span><strong>آپلود تصویر</strong><small>SVG / PNG / JPG / WebP — حداکثر ۸MB</small></span></label>
        <div className={`admin-showcase-project-add ${items.length >= showcaseLimit ? 'disabled' : ''}`}><StudioIcon name="figure"/><div><strong>افزودن از پروژه BioPlot</strong><small>از آخرین نسخه پروژه یک Snapshot وکتور بساز.</small></div><select value={projectId} disabled={busy || !projectList.length || items.length >= showcaseLimit} onChange={event => setProjectId(event.target.value)}>{projectList.length ? projectList.map(project => <option key={project.id} value={project.id}>{project.title}</option>) : <option value="">پروژه‌ای موجود نیست</option>}</select><button disabled={busy || !projectId || items.length >= showcaseLimit} onClick={addFromProject}>افزودن</button></div>
      </section>

      {message && <div className="admin-showcase-message">{message}</div>}

      <section className="admin-showcase-list">
        <div className="admin-showcase-list-head"><div><strong>ترتیب نمایش در سایت</strong><small>با فلش‌ها ترتیب را تغییر بده؛ تغییرات بلافاصله از Supabase خوانده می‌شوند.</small></div><a href="/#portfolio-showcase-title" target="_blank" rel="noreferrer">مشاهده در سایت <StudioIcon name="arrow" size={15}/></a></div>
        {!items.length && <div className="admin-showcase-empty"><StudioIcon name="figure" size={34} weight="duotone"/><strong>هنوز تصویری انتخاب نشده</strong><span>یک تصویر آپلود کن یا یکی از پروژه‌های BioPlot را به Showcase اضافه کن.</span></div>}
        <div className="admin-showcase-grid">{items.map((item, index) => <article className={`admin-showcase-card ${item.active ? '' : 'inactive'}`} key={item.id}>
          <div className="admin-showcase-preview"><img src={showcasePublicUrl(item.storagePath)} alt=""/><span>{String(index + 1).padStart(2, '0')}</span>{!item.active && <em>مخفی</em>}</div>
          <div className="admin-showcase-card-body"><div><strong>{item.sourceProjectId ? projectNames.get(item.sourceProjectId) || 'پروژه BioPlot' : 'تصویر آپلودی'}</strong><small>{item.sourceProjectId ? 'متصل به Figure Studio' : 'فایل مستقل'}</small></div><div className="admin-showcase-order"><button disabled={busy || index === 0} title="انتقال به قبل" onClick={() => void run(() => moveShowcaseItem(items, item, -1))}>↑</button><button disabled={busy || index === items.length - 1} title="انتقال به بعد" onClick={() => void run(() => moveShowcaseItem(items, item, 1))}>↓</button></div></div>
          <div className="admin-showcase-card-actions">
            <button className={item.active ? 'active' : ''} disabled={busy} onClick={() => void run(() => setShowcaseItemActive(item, !item.active))}>{item.active ? 'نمایش در سایت' : 'نمایش بده'}</button>
            <label><input type="file" accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg" disabled={busy} onChange={event => replaceFile(item, event)}/>جایگزینی تصویر</label>
            {item.sourceProjectId && <><a href={`/editor?id=${encodeURIComponent(item.sourceProjectId)}`}>ویرایش پروژه</a><button disabled={busy} onClick={() => refreshFromProject(item)}>به‌روزرسانی از پروژه</button></>}
            <button className="danger" disabled={busy} onClick={() => { if (confirm('این تصویر از Showcase حذف شود؟')) void run(() => deleteShowcaseItem(item), 'تصویر حذف شد.'); }}>حذف</button>
          </div>
        </article>)}</div>
      </section>
    </main>
  </div>;
}
