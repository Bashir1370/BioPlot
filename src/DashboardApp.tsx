import { FormEvent, MouseEvent, useEffect, useMemo, useRef, useState } from 'react';
import { documentToSvg } from './export';
import { BioPlotDocument, cloneDocument, makeId } from './model';
import { ProjectSummary, projects } from './persistence';
import { HomeTemplateId, createHomeTemplateDocument, homeTemplates, templateIdFromDocument } from './homeTemplates';
import './home.css';

type Locale = 'en' | 'fa';
type LoadState = 'loading' | 'ready' | 'error';
type IconName = 'home' | 'projects' | 'templates' | 'figure' | 'search' | 'plus' | 'arrow' | 'dots' | 'clock' | 'copy' | 'edit' | 'trash' | 'sparkle' | 'check' | 'folder' | 'close';

interface DashboardProject extends ProjectSummary {
  document?: BioPlotDocument;
  thumbnail?: string;
  templateId: HomeTemplateId;
}

interface ProjectDialogState {
  type: 'rename' | 'delete';
  project: DashboardProject;
}

const copy = {
  en: {
    home: 'Home', projects: 'Projects', templates: 'Templates', editor: 'Figure Studio',
    search: 'Search projects and figure templates…', heroEyebrow: 'BIOPLOT FIGURE STUDIO',
    heroTitle: 'Build scientific figures that are ready to communicate.',
    heroText: 'Turn mechanisms, experiments and biological ideas into clear, editable and publication-ready visuals—without leaving one scientific workspace.',
    createFigure: 'Create scientific figure', browseTemplates: 'Browse templates', continueWork: 'Continue last project',
    vector: 'Native vector export', autosave: 'Structured autosave', bilingual: 'Persian + English',
    quickStart: 'Quick start', quickStartSub: 'Choose how you want to begin your next scientific figure.',
    recent: 'Recent projects', recentSub: 'Pick up exactly where you left off.', viewAll: 'View all projects',
    noProjects: 'Your figure workspace is ready.', noProjectsText: 'Create your first scientific figure from a blank canvas or start with a structured template.',
    templatesTitle: 'Figure templates', templatesSub: 'Start with a strong scientific composition, then edit every object.',
    open: 'Open project', rename: 'Rename', duplicate: 'Duplicate', delete: 'Delete',
    updated: 'Updated', scientificFigure: 'Scientific figure', objects: 'objects',
    renameTitle: 'Rename project', renameText: 'Choose a clear project name so it is easy to find later.', cancel: 'Cancel', saveName: 'Save name',
    deleteTitle: 'Delete project?', deleteText: 'This removes the project from this workspace. This action cannot be undone.', deleteProject: 'Delete project',
    searchProjects: 'Projects', searchTemplates: 'Templates', noSearch: 'No matching projects or templates.',
    loadError: 'We could not load your projects. Your editor is still available.', retry: 'Retry',
    copied: 'Project duplicated', renamed: 'Project renamed', deleted: 'Project deleted', created: 'New figure created',
    localWorkspace: 'Local workspace', focusTitle: 'Figure Studio focus', focusText: 'We are building one professional scientific figure workflow end-to-end before expanding BioPlot.',
    featureTitle: 'One focused workflow', featureText: 'Create → design → save → reopen → export',
    allProjects: 'All projects', clearSearch: 'Clear search'
  },
  fa: {
    home: 'خانه', projects: 'پروژه‌ها', templates: 'قالب‌ها', editor: 'استودیو شکل علمی',
    search: 'جست‌وجوی پروژه‌ها و قالب‌های شکل علمی…', heroEyebrow: 'BIOPLOT FIGURE STUDIO',
    heroTitle: 'شکل‌های علمی حرفه‌ای بساز؛ آماده برای توضیح، ارائه و انتشار.',
    heroText: 'مکانیسم‌ها، آزمایش‌ها و ایده‌های زیستی را در یک فضای علمی واحد به تصویرهای شفاف، قابل ویرایش و آماده انتشار تبدیل کن.',
    createFigure: 'ساخت شکل علمی', browseTemplates: 'مشاهده قالب‌ها', continueWork: 'ادامه آخرین پروژه',
    vector: 'خروجی وکتور واقعی', autosave: 'ذخیره ساختاریافته', bilingual: 'فارسی + انگلیسی',
    quickStart: 'شروع سریع', quickStartSub: 'انتخاب کن شکل علمی بعدی را از کجا شروع می‌کنی.',
    recent: 'پروژه‌های اخیر', recentSub: 'دقیقاً از همان جایی که متوقف شدی ادامه بده.', viewAll: 'همه پروژه‌ها',
    noProjects: 'فضای طراحی شکل علمی آماده است.', noProjectsText: 'اولین شکل علمی را از صفحه خالی بساز یا با یک قالب ساختاریافته شروع کن.',
    templatesTitle: 'قالب‌های شکل علمی', templatesSub: 'با یک ترکیب‌بندی علمی قوی شروع کن و بعد همه اجزا را آزادانه تغییر بده.',
    open: 'باز کردن پروژه', rename: 'تغییر نام', duplicate: 'ساخت کپی', delete: 'حذف',
    updated: 'ویرایش', scientificFigure: 'شکل علمی', objects: 'المان',
    renameTitle: 'تغییر نام پروژه', renameText: 'یک نام واضح انتخاب کن تا بعداً پروژه را سریع پیدا کنی.', cancel: 'انصراف', saveName: 'ذخیره نام',
    deleteTitle: 'پروژه حذف شود؟', deleteText: 'این پروژه از فضای کاری حذف می‌شود و این عملیات قابل بازگشت نیست.', deleteProject: 'حذف پروژه',
    searchProjects: 'پروژه‌ها', searchTemplates: 'قالب‌ها', noSearch: 'پروژه یا قالبی با این عبارت پیدا نشد.',
    loadError: 'پروژه‌ها بارگذاری نشدند؛ اما ویرایشگر همچنان در دسترس است.', retry: 'تلاش دوباره',
    copied: 'کپی پروژه ساخته شد', renamed: 'نام پروژه تغییر کرد', deleted: 'پروژه حذف شد', created: 'شکل علمی جدید ساخته شد',
    localWorkspace: 'فضای محلی', focusTitle: 'تمرکز روی Figure Studio', focusText: 'قبل از گسترش BioPlot، مسیر طراحی شکل علمی را از ابتدا تا انتها حرفه‌ای می‌کنیم.',
    featureTitle: 'یک مسیر متمرکز', featureText: 'ساخت ← طراحی ← ذخیره ← بازکردن ← خروجی',
    allProjects: 'همه پروژه‌ها', clearSearch: 'پاک کردن جست‌وجو'
  }
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, JSX.Element> = {
    home: <><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9.5 21v-7h5v7"/></>,
    projects: <><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18"/><path d="M8 5V3h8v2"/></>,
    templates: <><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5"/><rect x="3" y="13" width="8" height="8" rx="1.5"/><rect x="13" y="13" width="8" height="8" rx="1.5"/></>,
    figure: <><circle cx="7" cy="12" r="3"/><circle cx="17" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="m9.8 10.8 4.7-2.5M9.8 13.2l4.7 2.5"/></>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>, plus: <path d="M12 5v14M5 12h14"/>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>, dots: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>, copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    edit: <><path d="M4 20h4l11-11-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></>, trash: <><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="m7 7 1 13h8l1-13"/></>,
    sparkle: <><path d="m12 3 1.4 4.2L18 9l-4.6 1.8L12 15l-1.4-4.2L6 9l4.6-1.8L12 3Z"/><path d="m18.5 15 .7 2.1 2.3.9-2.3.9-.7 2.1-.7-2.1-2.3-.9 2.3-.9.7-2.1Z"/></>,
    check: <path d="m5 12 4 4L19 6"/>, folder: <path d="M3 7h7l2 2h9v10H3V7Z"/>, close: <path d="m6 6 12 12M18 6 6 18"/>
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function svgDataUri(document: BioPlotDocument) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(documentToSvg(document))}`;
}

function relativeDate(iso: string, locale: Locale) {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.round((then - now) / 86_400_000);
  if (Math.abs(days) < 7) {
    const rtf = new Intl.RelativeTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { numeric: 'auto' });
    if (days !== 0) return rtf.format(days, 'day');
    const hours = Math.round((then - now) / 3_600_000);
    if (Math.abs(hours) >= 1) return rtf.format(hours, 'hour');
    const minutes = Math.round((then - now) / 60_000);
    return rtf.format(minutes || 0, 'minute');
  }
  return new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric', year: then < new Date(new Date().getFullYear(), 0, 1).getTime() ? 'numeric' : undefined }).format(new Date(iso));
}

function templateLabel(templateId: HomeTemplateId, locale: Locale) {
  return homeTemplates.find(template => template.id === templateId)?.title[locale] ?? copy[locale].scientificFigure;
}

function TemplatePreview({ id }: { id: HomeTemplateId }) {
  return <div className={`home-template-preview preview-${id}`} aria-hidden="true">
    {id === 'blank' && <><span className="preview-title"/><span className="preview-line a"/><span className="preview-line b"/><i className="preview-dot"/></>}
    {id === 'mechanism' && <><i className="preview-node n1"/><span className="preview-connector c1"/><i className="preview-node n2"/><span className="preview-connector c2"/><i className="preview-node n3"/></>}
    {id === 'graphical-abstract' && <><span className="preview-panel p1"/><span className="preview-panel p2"><i/></span><span className="preview-panel p3"/></>}
    {id === 'workflow' && <>{[0,1,2,3].map(index => <span key={index} className={`preview-step s${index + 1}`}>{index + 1}</span>)}</>}
  </div>;
}

function ProjectSkeleton() {
  return <div className="home-project-card skeleton-card" aria-hidden="true"><div className="skeleton-thumb shimmer"/><div className="skeleton-line wide shimmer"/><div className="skeleton-line shimmer"/></div>;
}

export function DashboardApp() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [projectList, setProjectList] = useState<DashboardProject[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<ProjectDialogState | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [toast, setToast] = useState('');
  const [showAllProjects, setShowAllProjects] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const t = copy[locale];
  const fa = locale === 'fa';

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);

  useEffect(() => { void loadProjects(); }, []);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (!(event.target as HTMLElement)?.closest?.('[data-project-menu]')) setMenuProjectId(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuProjectId(null); setDialog(null); setQuery(''); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('pointerdown', closeMenus);
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('pointerdown', closeMenus); window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function loadProjects() {
    setLoadState('loading');
    try {
      const summaries = await projects.list();
      const hydrated = await Promise.all(summaries.map(async summary => {
        try {
          const document = await projects.load(summary.id) ?? undefined;
          return {
            ...summary,
            document,
            thumbnail: document ? svgDataUri(document) : undefined,
            templateId: document ? templateIdFromDocument(document) : 'blank'
          } satisfies DashboardProject;
        } catch {
          return { ...summary, templateId: 'blank' as HomeTemplateId };
        }
      }));
      setProjectList(hydrated);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }

  function notify(message: string) { setToast(message); }

  async function createFromTemplate(templateId: HomeTemplateId) {
    const document = createHomeTemplateDocument(templateId, locale);
    await projects.save(document);
    notify(t.created);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  function openProject(project: DashboardProject) {
    window.location.href = `editor.html?id=${encodeURIComponent(project.id)}`;
  }

  async function duplicateProject(project: DashboardProject) {
    const source = project.document ?? await projects.load(project.id);
    if (!source) return;
    const next = cloneDocument(source);
    const now = new Date().toISOString();
    next.id = makeId('doc');
    next.title = fa ? `${source.title} - کپی` : `${source.title} copy`;
    next.createdAt = now;
    next.updatedAt = now;
    next.ownerId = undefined;
    await projects.save(next);
    setMenuProjectId(null);
    notify(t.copied);
    await loadProjects();
  }

  function askRename(project: DashboardProject) {
    setRenameValue(project.title);
    setDialog({ type: 'rename', project });
    setMenuProjectId(null);
  }

  async function submitRename(event: FormEvent) {
    event.preventDefault();
    if (!dialog || dialog.type !== 'rename' || !renameValue.trim()) return;
    const source = dialog.project.document ?? await projects.load(dialog.project.id);
    if (!source) return;
    const next = cloneDocument(source);
    next.title = renameValue.trim();
    next.updatedAt = new Date().toISOString();
    await projects.save(next);
    setDialog(null);
    notify(t.renamed);
    await loadProjects();
  }

  async function confirmDelete() {
    if (!dialog || dialog.type !== 'delete') return;
    await projects.remove(dialog.project.id);
    setDialog(null);
    notify(t.deleted);
    await loadProjects();
  }

  const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'fa' ? 'fa-IR' : 'en-US');
  const matchingProjects = useMemo(() => {
    if (!normalizedQuery) return [];
    return projectList.filter(project => {
      const template = templateLabel(project.templateId, locale);
      return `${project.title} ${template}`.toLocaleLowerCase(locale === 'fa' ? 'fa-IR' : 'en-US').includes(normalizedQuery);
    }).slice(0, 6);
  }, [normalizedQuery, projectList, locale]);
  const matchingTemplates = useMemo(() => {
    if (!normalizedQuery) return [];
    return homeTemplates.filter(template => `${template.title.en} ${template.title.fa} ${template.description.en} ${template.description.fa}`.toLocaleLowerCase().includes(normalizedQuery)).slice(0, 4);
  }, [normalizedQuery]);

  const visibleProjects = showAllProjects ? projectList : projectList.slice(0, 6);
  const lastProject = projectList[0];

  function preventCardOpen(event: MouseEvent) { event.preventDefault(); event.stopPropagation(); }

  return <div className="home-shell">
    <aside className="home-sidebar">
      <div className="home-sidebar-top">
        <a className="home-brand" href="#home" aria-label="BioPlot home"><span className="home-brand-mark">B</span><span><b>BioPlot</b><small>Figure Studio</small></span></a>
        <nav className="home-nav" aria-label={t.home}>
          <a className="active" href="#home"><Icon name="home"/><span>{t.home}</span></a>
          <a href="#projects"><Icon name="projects"/><span>{t.projects}</span>{projectList.length > 0 && <em>{projectList.length}</em>}</a>
          <a href="#templates"><Icon name="templates"/><span>{t.templates}</span></a>
          <a href="editor.html"><Icon name="figure"/><span>{t.editor}</span></a>
        </nav>
      </div>
      <div className="home-sidebar-bottom">
        <div className="home-focus-card"><span className="focus-icon"><Icon name="sparkle"/></span><small>STAGE 10</small><b>{t.focusTitle}</b><p>{t.focusText}</p><div className="focus-flow"><span>{t.featureTitle}</span><strong>{t.featureText}</strong></div></div>
        <div className="home-workspace-status"><span className="status-dot"/><span>{t.localWorkspace}</span><small>BioPlot v3</small></div>
      </div>
    </aside>

    <main className="home-main">
      <header className="home-topbar">
        <div className="home-search-wrap">
          <Icon name="search" size={17}/>
          <input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} placeholder={t.search} aria-label={t.search}/>
          {query ? <button className="search-clear" onClick={() => setQuery('')} aria-label={t.clearSearch}><Icon name="close" size={15}/></button> : <kbd>⌘ K</kbd>}
          {normalizedQuery && <div className="home-search-results">
            {matchingProjects.length > 0 && <div className="search-group"><small>{t.searchProjects}</small>{matchingProjects.map(project => <button key={project.id} onClick={() => openProject(project)}><span className="search-result-thumb">{project.thumbnail ? <img src={project.thumbnail} alt=""/> : <Icon name="figure"/>}</span><span><b>{project.title}</b><em>{templateLabel(project.templateId, locale)}</em></span><Icon name="arrow" size={15}/></button>)}</div>}
            {matchingTemplates.length > 0 && <div className="search-group"><small>{t.searchTemplates}</small>{matchingTemplates.map(template => <button key={template.id} onClick={() => createFromTemplate(template.id)}><span className="search-result-thumb template-result"><Icon name="templates"/></span><span><b>{template.title[locale]}</b><em>{template.description[locale]}</em></span><Icon name="plus" size={15}/></button>)}</div>}
            {matchingProjects.length === 0 && matchingTemplates.length === 0 && <div className="search-empty"><Icon name="search"/><span>{t.noSearch}</span></div>}
          </div>}
        </div>
        <div className="home-top-actions"><button className="home-language" onClick={() => setLocale(fa ? 'en' : 'fa')}>{fa ? 'EN' : 'FA'}</button><span className="home-avatar" aria-label="BioPlot workspace">B</span></div>
      </header>

      <div className="home-content">
        {loadState === 'error' && <div className="home-error-banner"><span><Icon name="folder"/><b>{t.loadError}</b></span><button onClick={loadProjects}>{t.retry}</button></div>}

        <section className="home-hero" id="home">
          <div className="home-hero-copy"><span className="home-eyebrow"><i/><span>{t.heroEyebrow}</span></span><h1>{t.heroTitle}</h1><p>{t.heroText}</p><div className="home-hero-actions"><button className="home-primary-cta" onClick={() => createFromTemplate('blank')}><Icon name="plus"/>{t.createFigure}</button><a className="home-secondary-cta" href="#templates"><Icon name="templates"/>{t.browseTemplates}</a>{lastProject && <button className="home-continue" onClick={() => openProject(lastProject)}><Icon name="clock"/>{t.continueWork}</button>}</div><div className="home-trust-row"><span><Icon name="check" size={14}/>{t.vector}</span><span><Icon name="check" size={14}/>{t.autosave}</span><span><Icon name="check" size={14}/>{t.bilingual}</span></div></div>
          <div className="home-hero-visual" aria-hidden="true"><div className="hero-canvas"><span className="hero-canvas-label">SCIENTIFIC FIGURE</span><div className="hero-node hero-node-a"><i/><b>Stimulus</b></div><span className="hero-link link-a"/><div className="hero-cell"><span/><i/><em/></div><span className="hero-link link-b"/><div className="hero-node hero-node-b"><i/><b>Outcome</b></div><div className="hero-mini-panel"><span/><span/><span/></div></div><div className="hero-floating-badge"><Icon name="check" size={15}/><span><b>Publication-ready</b><small>Editable vector objects</small></span></div></div>
        </section>

        <section className="home-section home-quick-section" aria-labelledby="quick-start-title">
          <div className="home-section-heading"><div><span className="home-section-kicker">FIGURE STUDIO</span><h2 id="quick-start-title">{t.quickStart}</h2><p>{t.quickStartSub}</p></div></div>
          <div className="home-quick-grid">{homeTemplates.map(template => <button key={template.id} className={`home-quick-card quick-${template.id}`} onClick={() => createFromTemplate(template.id)}><span className="quick-icon"><Icon name={template.id === 'blank' ? 'plus' : template.id === 'workflow' ? 'projects' : template.id === 'mechanism' ? 'figure' : 'templates'}/></span><span className="quick-copy"><small>{template.eyebrow[locale]}</small><b>{template.title[locale]}</b><em>{template.description[locale]}</em></span><span className="quick-arrow"><Icon name="arrow" size={16}/></span></button>)}</div>
        </section>

        <section className="home-section" id="projects" aria-labelledby="recent-projects-title">
          <div className="home-section-heading projects-heading"><div><span className="home-section-kicker">YOUR WORK</span><h2 id="recent-projects-title">{showAllProjects ? t.allProjects : t.recent}</h2><p>{t.recentSub}</p></div>{projectList.length > 6 && <button className="home-text-button" onClick={() => setShowAllProjects(value => !value)}>{showAllProjects ? t.recent : t.viewAll}<Icon name="arrow" size={15}/></button>}</div>

          {loadState === 'loading' && <div className="home-project-grid">{[0,1,2].map(item => <ProjectSkeleton key={item}/>)}</div>}

          {loadState === 'ready' && projectList.length === 0 && <div className="home-empty-state"><div className="empty-illustration"><div className="empty-page"><span/><span/><i/></div><span className="empty-plus"><Icon name="plus"/></span></div><div><span className="home-section-kicker">NEW WORKSPACE</span><h3>{t.noProjects}</h3><p>{t.noProjectsText}</p><div><button className="home-primary-cta compact" onClick={() => createFromTemplate('blank')}><Icon name="plus"/>{t.createFigure}</button><a href="#templates" className="home-secondary-cta compact"><Icon name="templates"/>{t.browseTemplates}</a></div></div></div>}

          {loadState === 'ready' && projectList.length > 0 && <div className="home-project-grid">{visibleProjects.map(project => {
            const objectCount = project.document?.pages.reduce((sum, page) => sum + page.objects.length, 0) ?? 0;
            return <article className="home-project-card" key={project.id} onClick={() => openProject(project)} tabIndex={0} onKeyDown={event => { if (event.key === 'Enter') openProject(project); }}>
              <div className="home-project-thumb">{project.thumbnail ? <img src={project.thumbnail} alt=""/> : <div className="project-thumb-fallback"><Icon name="figure" size={28}/></div>}<span className="project-type-pill">{templateLabel(project.templateId, locale)}</span><div className="project-card-menu" data-project-menu><button className="project-menu-trigger" aria-label={`${project.title} menu`} aria-expanded={menuProjectId === project.id} onClick={event => { preventCardOpen(event); setMenuProjectId(menuProjectId === project.id ? null : project.id); }}><Icon name="dots"/></button>{menuProjectId === project.id && <div className="project-menu-popover" onClick={preventCardOpen}><button onClick={() => openProject(project)}><Icon name="arrow"/>{t.open}</button><button onClick={() => askRename(project)}><Icon name="edit"/>{t.rename}</button><button onClick={() => duplicateProject(project)}><Icon name="copy"/>{t.duplicate}</button><hr/><button className="danger-item" onClick={() => { setDialog({ type: 'delete', project }); setMenuProjectId(null); }}><Icon name="trash"/>{t.delete}</button></div>}</div></div>
              <div className="home-project-info"><div className="project-title-row"><h3 title={project.title}>{project.title}</h3><span className="project-open-icon"><Icon name="arrow" size={15}/></span></div><div className="project-meta"><span><Icon name="clock" size={13}/>{t.updated} {relativeDate(project.updatedAt, locale)}</span>{objectCount > 0 && <span>· {objectCount} {t.objects}</span>}</div></div>
            </article>;
          })}<button className="home-new-project-card" onClick={() => createFromTemplate('blank')}><span className="new-project-icon"><Icon name="plus" size={22}/></span><b>{t.createFigure}</b><small>{homeTemplates[0].description[locale]}</small></button></div>}
        </section>

        <section className="home-section home-templates-section" id="templates" aria-labelledby="templates-title">
          <div className="home-section-heading"><div><span className="home-section-kicker">START WITH STRUCTURE</span><h2 id="templates-title">{t.templatesTitle}</h2><p>{t.templatesSub}</p></div></div>
          <div className="home-template-grid">{homeTemplates.filter(template => template.id !== 'blank').map((template, index) => <button key={template.id} className="home-template-card" onClick={() => createFromTemplate(template.id)}><div className="template-card-visual"><TemplatePreview id={template.id}/><span className="template-index">0{index + 1}</span></div><div className="template-card-copy"><span><small>{template.eyebrow[locale]}</small><b>{template.title[locale]}</b></span><p>{template.description[locale]}</p><em>{t.createFigure}<Icon name="arrow" size={14}/></em></div></button>)}</div>
        </section>
      </div>
    </main>

    {dialog && <div className="home-dialog-backdrop" role="presentation" onPointerDown={event => { if (event.target === event.currentTarget) setDialog(null); }}><div className="home-dialog" role="dialog" aria-modal="true" aria-labelledby="project-dialog-title"><button className="dialog-close" onClick={() => setDialog(null)} aria-label={t.cancel}><Icon name="close"/></button>{dialog.type === 'rename' ? <form onSubmit={submitRename}><span className="dialog-icon"><Icon name="edit"/></span><h2 id="project-dialog-title">{t.renameTitle}</h2><p>{t.renameText}</p><label><span>{t.rename}</span><input autoFocus value={renameValue} onChange={event => setRenameValue(event.target.value)} maxLength={120}/></label><div className="dialog-actions"><button type="button" className="dialog-secondary" onClick={() => setDialog(null)}>{t.cancel}</button><button type="submit" className="dialog-primary" disabled={!renameValue.trim()}>{t.saveName}</button></div></form> : <div><span className="dialog-icon danger-dialog-icon"><Icon name="trash"/></span><h2 id="project-dialog-title">{t.deleteTitle}</h2><p>{t.deleteText}</p><div className="dialog-project-name">{dialog.project.title}</div><div className="dialog-actions"><button className="dialog-secondary" onClick={() => setDialog(null)}>{t.cancel}</button><button className="dialog-danger" onClick={confirmDelete}>{t.deleteProject}</button></div></div>}</div></div>}

    {toast && <div className="home-toast" role="status"><span><Icon name="check" size={15}/></span>{toast}</div>}
  </div>;
}
