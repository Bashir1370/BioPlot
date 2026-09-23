import './orders/orders.css';
import {HomeHero} from './HomeHero';
import { useEffect, useState } from 'react';
import {createBlankDocument} from './model';
import {openFigureDraft} from './figureDraft';
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

export function DashboardApp() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [toast, setToast] = useState('');
  const t = copy[locale];
  const fa = locale === 'fa';

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function notify(message: string) { setToast(message); }

  async function createFigure() {
    const document = createBlankDocument();
    document.metadata.locale=locale;
    openFigureDraft(document);
    notify(t.created);

  }

  return <div className="home-shell">
    <aside className="home-sidebar">
      <div className="home-sidebar-top">
        <a className="home-brand" href="#home" aria-label="BioPlot home"><span className="home-brand-mark">B</span><span><b>BioPlot</b><small>Figure Studio</small></span></a>
        <nav className="home-nav" aria-label={t.home}>
          <a className="active" href="#home" aria-label={t.home}><Icon name="home"/><span>{t.home}</span></a>
          <a href="/dashboard"><Icon name="templates"/><span>{fa ? 'داشبورد من' : 'My dashboard'}</span></a>
          <a href="editor.html" aria-label={t.editor}><Icon name="figure"/><span>{t.editor}</span></a>
        </nav>
        <div className="home-top-actions"><a href="/design">{fa?'سفارش طراحی':'Design services'}</a><button className="home-language" onClick={() => setLocale(fa ? 'en' : 'fa')}>{fa ? 'EN' : 'FA'}</button><span className="home-avatar" aria-label="BioPlot workspace">B</span></div>
      </div>
      <div className="home-sidebar-bottom">
        <div className="home-focus-card"><span className="focus-icon"><Icon name="sparkle"/></span><small>STAGE 10</small><b>{t.focusTitle}</b><p>{t.focusText}</p><div className="focus-flow"><span>{t.featureTitle}</span><strong>{t.featureText}</strong></div></div>
        <div className="home-workspace-status"><span className="status-dot"/><span>{t.localWorkspace}</span><small>BioPlot v3</small></div>
      </div>
    </aside>

    <main className="home-main">
      <div className="home-content">

        <HomeHero locale={locale} title={t.heroTitle} highlight={t.heroAccent} description={t.heroText} primaryText={t.createFigure} secondaryText={fa?'داشبورد من':'My dashboard'} onCreate={()=>void createFigure().catch(()=>notify(fa?'ذخیره انجام نشد؛ دوباره تلاش کنید.':'Could not save. Please retry.'))} socialProof={`${t.vector} · ${t.autosave} · ${t.bilingual}`}/>
        <section className="design-teaser"><div><h2>{fa?'خودتان بسازید؛ یا طراحی را به ما بسپارید.':'Create it yourself, or work with our design team.'}</h2><p>{fa?'از یک ایده یا طرح اولیه تا تصویر علمی، چکیده تصویری و پوستر؛ با برآورد هزینه و پیگیری سفارش.':'From a brief or sketch to scientific illustrations, graphical abstracts and posters, with a tailored quote and order tracking.'}</p></div><a href="/design">{fa?'آشنایی با خدمات طراحی':'Explore design services'}</a></section>


      </div>
    </main>

    {toast && <div className="home-toast" role="status"><span><Icon name="check" size={15}/></span>{toast}</div>}
  </div>;
}
