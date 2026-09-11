import { useEffect, useState } from 'react';
import { createBlankDocument } from './model';
import { localProjects, ProjectSummary } from './persistence';

export function DashboardApp() {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [locale, setLocale] = useState<'en' | 'fa'>(() => (localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en'));

  useEffect(() => { localProjects.list().then(setProjects); }, []);
  useEffect(() => {
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale]);

  async function createProject() {
    const document = createBlankDocument(locale === 'fa' ? 'شکل علمی بدون عنوان' : 'Untitled scientific figure');
    document.metadata.locale = locale;
    await localProjects.save(document);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  return <div className="dashboard-shell-v3">
    <aside className="dashboard-sidebar">
      <a className="brand-v3" href="index.html"><span className="brand-mark-v3">B</span><b>BioPlot</b></a>
      <nav>
        <a className="active" href="#home">⌂ <span>{locale === 'fa' ? 'خانه' : 'Home'}</span></a>
        <a href="#projects">▣ <span>{locale === 'fa' ? 'پروژه‌ها' : 'Projects'}</span></a>
        <a href="#templates">▦ <span>{locale === 'fa' ? 'قالب‌ها' : 'Templates'}</span></a>
        <a href="editor.html">✦ <span>{locale === 'fa' ? 'ویرایشگر' : 'Editor'}</span></a>
      </nav>
      <div className="dashboard-note"><small>BIOPLOT V3</small><b>{locale === 'fa' ? 'از داده تا شکل علمی قابل انتشار' : 'From data to publication-ready visuals'}</b><p>{locale === 'fa' ? 'مدل سند واقعی، خروجی برداری، نمودار، همکاری و پایه هوش مصنوعی.' : 'Structured documents, native vector export, plots, collaboration and AI foundations.'}</p></div>
    </aside>
    <main className="dashboard-main">
      <header className="dashboard-header"><div className="search-shell">⌕ <input placeholder={locale === 'fa' ? 'جست‌وجوی پروژه و دارایی علمی…' : 'Search projects and scientific assets…'} /></div><button className="ghost" onClick={() => setLocale(locale === 'en' ? 'fa' : 'en')}>{locale === 'en' ? 'FA' : 'EN'}</button></header>
      <section className="hero-v3" id="home"><div><span className="eyebrow">SCIENTIFIC VISUALIZATION WORKSPACE</span><h1>{locale === 'fa' ? 'امروز چه چیزی می‌سازی؟' : 'What will you create today?'}</h1><p>{locale === 'fa' ? 'ایده زیستی، داده و مکانیسم را در یک فضای علمی واحد به شکل قابل انتشار تبدیل کن.' : 'Turn biological ideas, data and mechanisms into publication-ready visuals in one scientific workspace.'}</p></div><button className="primary" onClick={createProject}>＋ {locale === 'fa' ? 'پروژه جدید' : 'New project'}</button></section>
      <section className="create-grid-v3">
        <button onClick={createProject}><span>◉</span><div><small>AVAILABLE</small><b>{locale === 'fa' ? 'شکل علمی' : 'Scientific Figure'}</b><p>{locale === 'fa' ? 'مکانیسم، فرایند و تصویر زیستی' : 'Mechanisms, workflows and biological illustrations'}</p></div></button>
        <button onClick={createProject}><span>⌁</span><div><small>V3</small><b>{locale === 'fa' ? 'نمودار و داده' : 'Plot & Data'}</b><p>{locale === 'fa' ? 'داده CSV و نمودار قابل ویرایش' : 'Editable data-bound plots with CSV import'}</p></div></button>
        <button onClick={createProject}><span>✦</span><div><small>V3</small><b>{locale === 'fa' ? 'پیش‌نویس هوشمند' : 'AI Draft'}</b><p>{locale === 'fa' ? 'از توضیح علمی تا پیش‌نویس قابل ویرایش' : 'From scientific prompt to editable first draft'}</p></div></button>
        <button onClick={createProject}><span>⇄</span><div><small>FOUNDATION</small><b>{locale === 'fa' ? 'همکاری' : 'Collaboration'}</b><p>{locale === 'fa' ? 'همگام‌سازی هم‌زمان و معماری آماده تیم' : 'Realtime sync and team-ready architecture'}</p></div></button>
      </section>
      <section className="projects-section" id="projects"><div className="section-heading"><div><span className="eyebrow">YOUR WORK</span><h2>{locale === 'fa' ? 'پروژه‌های اخیر' : 'Recent projects'}</h2></div></div><div className="project-grid-v3">
        {projects.map(project => <a key={project.id} className="project-card-v3" href={`editor.html?id=${encodeURIComponent(project.id)}`}><div className="project-thumb"><span>BioPlot</span><i></i><i></i><i></i></div><b>{project.title}</b><small>{new Date(project.updatedAt).toLocaleString(locale === 'fa' ? 'fa-IR' : 'en-US')}</small></a>)}
        <button className="new-card-v3" onClick={createProject}>＋<b>{locale === 'fa' ? 'ساخت پروژه جدید' : 'Create new project'}</b><small>{locale === 'fa' ? 'از سند ساختاریافته خالی شروع کن' : 'Start from a structured blank document'}</small></button>
      </div></section>
    </main>
  </div>;
}
