import './orders/orders.css';
import {HomeHero} from './HomeHero';
import { useEffect, useState } from 'react';
import {createBlankDocument} from './model';
import {openFigureDraft} from './figureDraft';
import './home.css';
// Keep the horizontal navigation overrides after the legacy Home styles in
// the same lazy-loaded route chunk, rather than the earlier global bundle.
import './home-top-nav.css';
import { StudioIcon } from './StudioIcon';

type Locale = 'en' | 'fa';
type IconName = 'home' | 'templates' | 'figure' | 'search' | 'plus' | 'arrow' | 'sparkle' | 'check' | 'close';

const copy = {
  en: {
    home: 'Home', templates: 'Templates', editor: 'Figure Studio',
    eyebrow: 'SCIENTIFIC FIGURE DESIGN',
    search: 'Search figure templates…',
    heroTitle: 'Turn your research idea', heroAccent: 'into a clear scientific figure.',
    heroText: 'Design it yourself in the BioPlot Studio, or submit a design request for support from a specialist. Follow your work and order updates through your account.',
    createFigure: 'Design in the Studio', browseTemplates: 'Request a design',
    vector: 'Editable vector tools', autosave: 'Custom design service', bilingual: 'Order tracking',
    templatesTitle: 'Figure templates', templatesSub: 'Start with a strong scientific composition, then edit every object.',
    searchTemplates: 'Templates', noSearch: 'No matching templates.',
    created: 'New figure created',
    localWorkspace: 'Local workspace', focusTitle: 'Figure Studio focus', focusText: 'We are building one professional scientific figure workflow end-to-end before expanding BioPlot.',
    featureTitle: 'One focused workflow', featureText: 'Create → design → save → reopen → export',
    clearSearch: 'Clear search'
  },
  fa: {
    home: 'خانه', templates: 'قالب‌ها', editor: 'استودیو شکل علمی',
    eyebrow: 'خدمات طراحی شکل علمی',
    search: 'جست‌وجوی قالب‌های شکل علمی…',
    heroTitle: 'ایدهٔ پژوهشی‌ات را', heroAccent: 'به شکل علمی تبدیل کن',
    heroText: 'خودت در استودیوی BioPlot طراحی کن، یا درخواست طراحی ثبت کن تا طراح متخصص در کنارت باشد. روند کار و به‌روزرسانی سفارش را از حساب کاربری‌ات دنبال کن.',
    createFigure: 'شروع طراحی در استودیو', browseTemplates: 'ثبت درخواست طراحی',
    vector: 'ابزارهای وکتور قابل‌ویرایش', autosave: 'طراحی سفارشی', bilingual: 'پیگیری سفارش',
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

        <HomeHero locale={locale} eyebrow={t.eyebrow} title={t.heroTitle} highlight={t.heroAccent} description={t.heroText} primaryText={t.createFigure} secondaryText={t.browseTemplates} onCreate={()=>void createFigure().catch(()=>notify(fa?'ذخیره انجام نشد؛ دوباره تلاش کنید.':'Could not save. Please retry.'))} socialProof={`${t.vector} · ${t.autosave} · ${t.bilingual}`}/>
        <section className="design-teaser"><div><h2>{fa?'دو مسیر برای ساخت شکل علمی':'Two ways to create your scientific figure'}</h2><p>{fa?'اگر می‌خواهی کنترل طراحی دست خودت باشد، از استودیو استفاده کن. اگر همراهی متخصص می‌خواهی، درخواست طراحی ثبت کن و روند سفارش را در حساب کاربری‌ات دنبال کن.':'Keep the design in your hands with the Studio, or request help from a specialist and follow the order through your account.'}</p></div><a href="/design">{fa?'مشاهده خدمات و ثبت درخواست':'Explore services & request a design'}</a></section>


      </div>
    </main>

    {toast && <div className="home-toast" role="status"><span><Icon name="check" size={15}/></span>{toast}</div>}
  </div>;
}
