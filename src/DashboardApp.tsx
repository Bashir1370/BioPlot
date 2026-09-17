import {HomeHero} from './HomeHero';
import { useEffect, useMemo, useRef, useState } from 'react';
import { documentToSvg } from './export';
import { BioPlotDocument } from './model';
import { projects } from './persistence';
import { HomeTemplateId, createHomeTemplateDocument, homeTemplates } from './homeTemplates';
import './home.css';
import { StudioIcon } from './StudioIcon';

type Locale = 'en' | 'fa';
type IconName = 'home' | 'templates' | 'figure' | 'search' | 'plus' | 'arrow' | 'sparkle' | 'check' | 'close';

const copy = {
  en: {
    home: 'Home', templates: 'Templates', editor: 'Figure Studio',
    search: 'Search figure templates…',
    heroTitle: 'Your science.', heroAccent: 'Clearly illustrated.',
    heroText: 'Turn complex biology into clear, editable, publication-ready figures. One focused workspace for your next discovery.',
    createFigure: 'Create scientific figure', browseTemplates: 'Browse templates',
    vector: 'Native vector export', autosave: 'Structured autosave', bilingual: 'Persian + English',
    templatesTitle: 'Figure templates', templatesSub: 'Start with a strong scientific composition, then edit every object.',
    searchTemplates: 'Templates', noSearch: 'No matching templates.',
    created: 'New figure created',
    localWorkspace: 'Local workspace', focusTitle: 'Figure Studio focus', focusText: 'We are building one professional scientific figure workflow end-to-end before expanding BioPlot.',
    featureTitle: 'One focused workflow', featureText: 'Create → design → save → reopen → export',
    clearSearch: 'Clear search'
  },
  fa: {
    home: 'خانه', templates: 'قالب‌ها', editor: 'استودیو شکل علمی',
    search: 'جست‌وجوی قالب‌های شکل علمی…',
    heroTitle: 'علم شما؛', heroAccent: 'روشن و تماشایی.',
    heroText: 'ایده‌های پیچیده زیستی را به شکل‌هایی روشن، قابل‌ویرایش و آماده انتشار تبدیل کن؛ در یک فضای طراحی علمی.',
    createFigure: 'ساخت شکل علمی', browseTemplates: 'مشاهده قالب‌ها',
    vector: 'خروجی وکتور واقعی', autosave: 'ذخیره ساختاریافته', bilingual: 'فارسی + انگلیسی',
    templatesTitle: 'قالب‌های شکل علمی', templatesSub: 'با یک ترکیب‌بندی علمی قوی شروع کن و بعد همه اجزا را آزادانه تغییر بده.',
    searchTemplates: 'قالب‌ها', noSearch: 'قالبی با این عبارت پیدا نشد.',
    created: 'شکل علمی جدید ساخته شد',
    localWorkspace: 'فضای محلی', focusTitle: 'تمرکز روی Figure Studio', focusText: 'قبل از گسترش BioPlot، مسیر طراحی شکل علمی را از ابتدا تا انتها حرفه‌ای می‌کنیم.',
    featureTitle: 'یک مسیر متمرکز', featureText: 'ساخت ← طراحی ← ذخیره ← بازکردن ← خروجی',
    clearSearch: 'پاک کردن جست‌وجو'
  }
};

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return <StudioIcon name={name === 'check' ? 'done' : name} size={size}/>;
}

function svgDataUri(document: BioPlotDocument) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(documentToSvg(document))}`;
}

function TemplatePreview({ id, locale }: { id: HomeTemplateId; locale: Locale }) {
  const src = useMemo(() => svgDataUri(createHomeTemplateDocument(id, locale)), [id, locale]);
  return <img className="home-template-image" src={src} alt="" loading="lazy"/>;
}

export function DashboardApp() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const t = copy[locale];
  const fa = locale === 'fa';

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuery('');
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function notify(message: string) { setToast(message); }

  async function createFromTemplate(templateId: HomeTemplateId) {
    const document = createHomeTemplateDocument(templateId, locale);
    await projects.save(document);
    notify(t.created);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'fa' ? 'fa-IR' : 'en-US');
  const matchingTemplates = useMemo(() => {
    if (!normalizedQuery) return [];
    return homeTemplates.filter(template => `${template.title.en} ${template.title.fa} ${template.description.en} ${template.description.fa}`.toLocaleLowerCase().includes(normalizedQuery)).slice(0, 4);
  }, [normalizedQuery]);

  return <div className="home-shell">
    <aside className="home-sidebar">
      <div className="home-sidebar-top">
        <a className="home-brand" href="#home" aria-label="BioPlot home"><span className="home-brand-mark">B</span><span><b>BioPlot</b><small>Figure Studio</small></span></a>
        <nav className="home-nav" aria-label={t.home}>
          <a className="active" href="#home" aria-label={t.home}><Icon name="home"/><span>{t.home}</span></a>
          <a href="#templates" aria-label={t.templates}><Icon name="templates"/><span>{t.templates}</span></a>
          <a href="editor.html" aria-label={t.editor}><Icon name="figure"/><span>{t.editor}</span></a>
        </nav>
        <div className="home-top-actions"><button className="home-language" onClick={() => setLocale(fa ? 'en' : 'fa')}>{fa ? 'EN' : 'FA'}</button><span className="home-avatar" aria-label="BioPlot workspace">B</span></div>
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
            {matchingTemplates.length > 0 && <div className="search-group"><small>{t.searchTemplates}</small>{matchingTemplates.map(template => <button key={template.id} onClick={() => createFromTemplate(template.id)}><span className="search-result-thumb template-result"><Icon name="templates"/></span><span><b>{template.title[locale]}</b><em>{template.description[locale]}</em></span><Icon name="plus" size={15}/></button>)}</div>}
            {matchingTemplates.length === 0 && <div className="search-empty"><Icon name="search"/><span>{t.noSearch}</span></div>}
          </div>}
        </div>

      </header>

      <div className="home-content">

        <HomeHero locale={locale} title={t.heroTitle} highlight={t.heroAccent} description={t.heroText} primaryText={t.createFigure} secondaryText={t.browseTemplates} onCreate={()=>createFromTemplate('blank')} socialProof={`${t.vector} · ${t.autosave} · ${t.bilingual}`}/>

        <section className="home-section home-templates-section" id="templates" aria-labelledby="templates-title">
          <div className="home-section-heading"><div><span className="home-section-kicker">START WITH STRUCTURE</span><h2 id="templates-title">{t.templatesTitle}</h2><p>{t.templatesSub}</p></div></div>
          <div className="home-template-grid">{homeTemplates.filter(template => template.id !== 'blank').map((template, index) => <button key={template.id} className="home-template-card" onClick={() => createFromTemplate(template.id)}><div className="template-card-visual"><TemplatePreview id={template.id} locale={locale}/><span className="template-index">0{index + 1}</span></div><div className="template-card-copy"><span><small>{template.eyebrow[locale]}</small><b>{template.title[locale]}</b></span><p>{template.description[locale]}</p><em>{t.createFigure}<Icon name="arrow" size={14}/></em></div></button>)}</div>
        </section>
      </div>
    </main>

    {toast && <div className="home-toast" role="status"><span><Icon name="check" size={15}/></span>{toast}</div>}
  </div>;
}
