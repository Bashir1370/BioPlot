import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createHomeTemplateDocument, homeTemplates, type HomeTemplateId } from './homeTemplates';
import { projects } from './persistence';
import { homeTemplateCategoryMap } from './scientificVisualContentModel';
import {
  featuredScientificVisualCategories,
  scientificVisualCategories,
  type ScientificVisualCategory,
  type ScientificVisualCategoryId,
} from './scientificVisualTaxonomy';
import './scientific-visual-hub-home.css';

type Locale = 'en' | 'fa';
type PanelMode = 'templates' | 'guides';
type GuideTip = { en: string; fa: string };

const guidePrinciples: Record<ScientificVisualCategoryId, GuideTip[]> = {
  'molecular-mechanisms': [
    { en: 'Keep one causal direction from trigger to outcome.', fa: 'یک جهت علت‌ومعلولی روشن از محرک تا پیامد حفظ کن.' },
    { en: 'Separate compartments such as membrane, cytoplasm and nucleus.', fa: 'کمپارتمان‌هایی مثل غشا، سیتوپلاسم و هسته را از هم تفکیک کن.' },
    { en: 'Use color to encode meaning, not decoration.', fa: 'رنگ را برای انتقال معنا استفاده کن، نه صرفاً تزئین.' },
  ],
  'pathways-networks': [
    { en: 'Reduce crossings and keep the dominant path visually obvious.', fa: 'تقاطع خطوط را کم کن و مسیر اصلی را از نظر بصری واضح نگه دار.' },
    { en: 'Use consistent node and arrow semantics.', fa: 'معنای نودها و فلش‌ها را در کل شکل ثابت نگه دار.' },
    { en: 'Group branches into functional modules when the network grows.', fa: 'وقتی شبکه بزرگ می‌شود شاخه‌ها را در ماژول‌های عملکردی گروه‌بندی کن.' },
  ],
  'molecular-cellular-interactions': [
    { en: 'Show who sends, who receives and what mediates the interaction.', fa: 'فرستنده، گیرنده و واسطه‌ی تعامل را مشخص کن.' },
    { en: 'Keep contact points and receptors close to the relevant membrane.', fa: 'نقاط تماس و گیرنده‌ها را نزدیک غشای مربوط نمایش بده.' },
    { en: 'Avoid downstream detail unless it changes the message.', fa: 'جزئیات پایین‌دستی را فقط وقتی اضافه کن که پیام شکل را تغییر می‌دهد.' },
  ],
  'processes-workflows': [
    { en: 'Use a single reading direction and a predictable step rhythm.', fa: 'یک جهت خواندن ثابت و ریتم منظم برای مراحل داشته باش.' },
    { en: 'Keep each step focused on one action or decision.', fa: 'هر مرحله را روی یک عمل یا تصمیم متمرکز نگه دار.' },
    { en: 'Show inputs and outputs only where they clarify the protocol.', fa: 'ورودی و خروجی را فقط جایی نشان بده که پروتکل را واضح‌تر می‌کند.' },
  ],
  'biological-systems': [
    { en: 'Use spatial zones to prevent a complex system from becoming a network tangle.', fa: 'برای جلوگیری از شلوغی سیستم پیچیده، از نواحی فضایی مشخص استفاده کن.' },
    { en: 'Prioritize relationships that support the scientific claim.', fa: 'روابطی را برجسته کن که مستقیماً از ادعای علمی پشتیبانی می‌کنند.' },
    { en: 'Use scale changes deliberately when moving from organ to cell.', fa: 'در تغییر مقیاس از اندام به سلول، زوم را هدفمند و واضح انجام بده.' },
  ],
  'devices-bioengineering': [
    { en: 'Make layers, flow direction and sensing elements immediately recognizable.', fa: 'لایه‌ها، جهت جریان و عناصر سنجش را در نگاه اول قابل تشخیص کن.' },
    { en: 'Choose cross-section, exploded view or top view based on the message.', fa: 'نمای مقطع، انفجاری یا بالا را بر اساس پیام اصلی انتخاب کن.' },
    { en: 'Keep dimensions schematic unless exact geometry is scientifically important.', fa: 'ابعاد را شماتیک نگه دار مگر این‌که هندسه دقیق اهمیت علمی داشته باشد.' },
  ],
  'experimental-methods': [
    { en: 'Show the principle of the method before procedural detail.', fa: 'اصل روش را قبل از جزئیات اجرایی نشان بده.' },
    { en: 'Keep reagents, samples and instruments visually distinct.', fa: 'نمونه‌ها، مواد و ابزارها را از نظر بصری متمایز کن.' },
    { en: 'Use labels only where the illustration cannot explain itself.', fa: 'فقط جایی برچسب بگذار که تصویر به‌تنهایی کافی نیست.' },
  ],
  'disease-therapeutics': [
    { en: 'Separate disease trigger, pathology and consequence.', fa: 'محرک بیماری، پاتولوژی و پیامد را از هم تفکیک کن.' },
    { en: 'Place interventions exactly where they modify the disease process.', fa: 'مداخله درمانی را دقیقاً در محل اثرش روی روند بیماری نشان بده.' },
    { en: 'Use healthy versus disease comparison only when it adds causal clarity.', fa: 'مقایسه سالم و بیمار را فقط وقتی استفاده کن که رابطه علّی را روشن‌تر می‌کند.' },
  ],
  'anatomy-spatial-biology': [
    { en: 'Preserve orientation when zooming from organ to tissue or cell.', fa: 'هنگام زوم از اندام به بافت یا سلول، جهت فضایی را حفظ کن.' },
    { en: 'Use callouts to connect scales without visual ambiguity.', fa: 'برای اتصال مقیاس‌ها از کادرهای زوم و callout واضح استفاده کن.' },
    { en: 'Keep anatomical context visible even in detailed panels.', fa: 'حتی در پنل‌های جزئی، زمینه آناتومیک را قابل تشخیص نگه دار.' },
  ],
  'omics-systems-biology': [
    { en: 'Separate data generation, computation and biological interpretation.', fa: 'تولید داده، تحلیل محاسباتی و تفسیر زیستی را از هم جدا کن.' },
    { en: 'Use abstraction for high-dimensional data rather than tiny unreadable plots.', fa: 'برای داده‌های پُربعد از نمایش انتزاعی استفاده کن، نه نمودارهای ریز و ناخوانا.' },
    { en: 'End the pipeline with the biological question or candidate output.', fa: 'پایپ‌لاین را با سؤال زیستی یا خروجی کاندیداها تمام کن.' },
  ],
  'study-design': [
    { en: 'Make groups, timing and sampling points explicit.', fa: 'گروه‌ها، زمان‌بندی و نقاط نمونه‌گیری را صریح نشان بده.' },
    { en: 'Use branching only where allocation actually occurs.', fa: 'شاخه‌بندی را فقط جایی به‌کار ببر که تخصیص واقعی رخ می‌دهد.' },
    { en: 'Keep outcomes separate from interventions.', fa: 'پیامدها را از مداخلات جدا نمایش بده.' },
  ],
  'conceptual-models': [
    { en: 'Anchor the figure around one hypothesis or take-home message.', fa: 'شکل را حول یک فرضیه یا پیام نهایی واحد سازمان بده.' },
    { en: 'Distinguish evidence from proposed relationships.', fa: 'روابط اثبات‌شده را از روابط پیشنهادی متمایز کن.' },
    { en: 'Prefer a few strong visual relationships over exhaustive detail.', fa: 'چند رابطه بصری قوی را به جزئیات فرساینده ترجیح بده.' },
  ],
  'graphical-abstracts': [
    { en: 'Design one visual story, not a miniature full paper.', fa: 'یک داستان تصویری بساز، نه نسخه کوچک‌شده کل مقاله.' },
    { en: 'Use a clear entry point, mechanism and take-home outcome.', fa: 'نقطه شروع، مکانیسم و پیام نهایی را واضح مشخص کن.' },
    { en: 'Keep text subordinate to the visual narrative.', fa: 'متن را در خدمت روایت تصویری نگه دار، نه برعکس.' },
  ],
};

function CategoryPreview({ id }: { id: ScientificVisualCategoryId }) {
  const common = <>
    <defs>
      <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f8fcfb"/><stop offset="1" stopColor="#eef7f5"/></linearGradient>
      <filter id={`shadow-${id}`} x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="7" stdDeviation="8" floodOpacity=".10"/></filter>
    </defs>
    <rect width="560" height="260" rx="28" fill={`url(#bg-${id})`}/>
  </>;

  if (id === 'molecular-mechanisms') return <svg viewBox="0 0 560 260">{common}<rect x="40" y="101" width="480" height="12" rx="6" fill="#f3b7a6"/><circle cx="95" cy="68" r="27" fill="#f7c88f"/><path d="M95 94v34" stroke="#7f9ea5" strokeWidth="4"/><path d="M80 129h30l13 31H67z" fill="#77c6b5"/><path d="M125 145C180 145 180 190 235 190" fill="none" stroke="#6b94a8" strokeWidth="4"/><circle cx="250" cy="190" r="25" fill="#b7a3df"/><path d="M275 190h60" stroke="#6b94a8" strokeWidth="4"/><path d="M335 190l-12-8v16z" fill="#6b94a8"/><ellipse cx="430" cy="178" rx="72" ry="48" fill="#fff" stroke="#9ccbc2" strokeWidth="3" filter={`url(#shadow-${id})`}/><path d="M392 179c22-26 52-26 76 0-22 27-52 27-76 0z" fill="#d9efe9"/><circle cx="430" cy="179" r="17" fill="#61b49f"/></svg>;
  if (id === 'pathways-networks') return <svg viewBox="0 0 560 260">{common}<path d="M92 130h92m38 0h78m38 0h96M203 130l70-62m-70 62l70 63m48-63l70-57m-70 57l70 60" fill="none" stroke="#76949f" strokeWidth="4"/><circle cx="82" cy="130" r="28" fill="#70bfaa"/><circle cx="204" cy="130" r="30" fill="#efc37e"/><circle cx="292" cy="67" r="25" fill="#a8c4e1"/><circle cx="292" cy="194" r="25" fill="#d3b6e5"/><circle cx="320" cy="130" r="31" fill="#72b9c9"/><circle cx="412" cy="73" r="25" fill="#f0a8a0"/><circle cx="412" cy="190" r="25" fill="#93c783"/><rect x="444" y="105" width="72" height="50" rx="18" fill="#fff" stroke="#8ab6ad" strokeWidth="3"/></svg>;
  if (id === 'processes-workflows') return <svg viewBox="0 0 560 260">{common}<rect x="45" y="84" width="105" height="92" rx="24" fill="#fff" stroke="#86bfb5" strokeWidth="3"/><path d="M84 104h28v49H84z" fill="#c8e9e1"/><path d="M79 100h38" stroke="#64a696" strokeWidth="6" strokeLinecap="round"/><path d="M151 130h63" stroke="#7294a1" strokeWidth="4"/><path d="M214 130l-13-8v16z" fill="#7294a1"/><circle cx="265" cy="130" r="45" fill="#edf2fb" stroke="#9ab2ca" strokeWidth="3"/><circle cx="250" cy="120" r="13" fill="#789fca"/><circle cx="278" cy="143" r="14" fill="#a884cf"/><path d="M311 130h65" stroke="#7294a1" strokeWidth="4"/><path d="M376 130l-13-8v16z" fill="#7294a1"/><rect x="395" y="77" width="120" height="106" rx="20" fill="#fff4eb" stroke="#e1b78c" strokeWidth="3"/><path d="M420 153v-30m28 30V105m28 48V92" stroke="#cb8652" strokeWidth="12" strokeLinecap="round"/></svg>;
  if (id === 'devices-bioengineering') return <svg viewBox="0 0 560 260">{common}<rect x="48" y="112" width="430" height="52" rx="18" fill="#fff" stroke="#9db8b6" strokeWidth="3" filter={`url(#shadow-${id})`}/><rect x="66" y="120" width="90" height="36" rx="10" fill="#f3d29b"/><rect x="156" y="120" width="115" height="36" fill="#f8e9bd"/><rect x="271" y="120" width="117" height="36" fill="#e7f2ea"/><rect x="388" y="120" width="72" height="36" rx="8" fill="#dfe9ef"/><path d="M315 118v40m35-40v40" stroke="#d35f66" strokeWidth="7"/><path d="M80 92c0-18 28-33 28-33s28 15 28 33a28 28 0 01-56 0z" fill="#6db7cc"/><path d="M492 78c-35 0-48 28-48 28" fill="none" stroke="#75949d" strokeWidth="4"/><path d="M444 106l2-15 12 9z" fill="#75949d"/></svg>;
  if (id === 'disease-therapeutics') return <svg viewBox="0 0 560 260">{common}<circle cx="102" cy="130" r="48" fill="#f6b2aa"/><path d="M80 130c18-28 44-28 62 0-18 29-44 29-62 0z" fill="#cf686f"/><path d="M155 130h70" stroke="#758f9b" strokeWidth="4"/><path d="M225 130l-13-8v16z" fill="#758f9b"/><circle cx="285" cy="130" r="52" fill="#eadff5" stroke="#b49acb" strokeWidth="3"/><path d="M261 124l16 16 30-38" fill="none" stroke="#845fa7" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/><path d="M340 130h70" stroke="#758f9b" strokeWidth="4"/><path d="M410 130l-13-8v16z" fill="#758f9b"/><rect x="426" y="88" width="86" height="84" rx="25" fill="#dff1e8" stroke="#8abfa7" strokeWidth="3"/><path d="M469 105v50m-25-25h50" stroke="#55a184" strokeWidth="8" strokeLinecap="round"/></svg>;
  return <svg viewBox="0 0 560 260">{common}<path d="M76 70c40 22 40 98 0 120m46-120c-40 22-40 98 0 120M83 84h32m-38 28h45m-45 28h45m-39 28h32" fill="none" stroke="#6aa7b8" strokeWidth="4"/><path d="M157 130h62" stroke="#75949d" strokeWidth="4"/><path d="M219 130l-13-8v16z" fill="#75949d"/><rect x="236" y="70" width="104" height="120" rx="22" fill="#fff" stroke="#aac7c0" strokeWidth="3"/><circle cx="268" cy="105" r="12" fill="#e58d8d"/><circle cx="304" cy="126" r="10" fill="#77b9a7"/><circle cx="274" cy="155" r="9" fill="#9c8cc5"/><path d="M340 130h62" stroke="#75949d" strokeWidth="4"/><path d="M402 130l-13-8v16z" fill="#75949d"/><circle cx="455" cy="96" r="13" fill="#f0b56d"/><circle cx="490" cy="132" r="13" fill="#78b8c5"/><circle cx="447" cy="166" r="13" fill="#91c179"/><path d="M455 96l35 36-43 34m8-70l-8 70" stroke="#7e929a" strokeWidth="3"/></svg>;
}

function categoryTemplates(categoryId: ScientificVisualCategoryId) {
  return homeTemplates.filter(template => homeTemplateCategoryMap[template.id] === categoryId);
}

export function ScientificVisualHubHome() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const [activeCategoryId, setActiveCategoryId] = useState<ScientificVisualCategoryId | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>('templates');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const syncLocale = () => setLocale(localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
    const observer = new MutationObserver(syncLocale);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    return () => observer.disconnect();
  }, []);

  const categories = showAll ? scientificVisualCategories : featuredScientificVisualCategories;
  const activeCategory = useMemo(() => scientificVisualCategories.find(category => category.id === activeCategoryId) ?? null, [activeCategoryId]);
  const templates = activeCategory ? categoryTemplates(activeCategory.id) : [];
  const fa = locale === 'fa';

  async function startTemplate(templateId: HomeTemplateId) {
    const document = createHomeTemplateDocument(templateId, locale);
    if (activeCategory) document.metadata.tags = Array.from(new Set([...document.metadata.tags, `category:${activeCategory.id}`]));
    await projects.save(document);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  async function startBlank(category: ScientificVisualCategory) {
    const document = createHomeTemplateDocument('blank', locale);
    document.title = locale === 'fa' ? `${category.shortTitle.fa} جدید` : `New ${category.shortTitle.en}`;
    document.metadata.tags = Array.from(new Set([...document.metadata.tags, `category:${category.id}`]));
    await projects.save(document);
    window.location.href = `editor.html?id=${encodeURIComponent(document.id)}`;
  }

  function openPanel(category: ScientificVisualCategory, mode: PanelMode) {
    setActiveCategoryId(category.id);
    setPanelMode(mode);
    window.requestAnimationFrame(() => document.querySelector('.svh-detail-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  return <div className="svh-home" dir={fa ? 'rtl' : 'ltr'}>
    <div className="svh-heading">
      <div><span className="svh-kicker">SCIENTIFIC VISUAL HUB</span><h2>{fa ? 'قالب‌ها و راهنماهای تصویری علمی' : 'Scientific visual templates & guides'}</h2><p>{fa ? 'نوع شکل علمی را انتخاب کن؛ قالب آماده، اصول طراحی و مسیر ساخت حرفه‌ای را یکجا ببین.' : 'Choose what you want to illustrate, then explore ready structures, design principles and a clear path into Figure Studio.'}</p></div>
      <button className="svh-all-button" onClick={() => setShowAll(value => !value)}>{showAll ? (fa ? 'نمایش دسته‌های اصلی' : 'Show featured') : (fa ? 'مشاهده همه ۱۳ دسته' : 'Explore all 13 categories')}<span>→</span></button>
    </div>

    <div className="svh-grid">{categories.map(category => <article className="svh-card" key={category.id}>
      <div className="svh-preview"><CategoryPreview id={category.id}/><span className="svh-card-index">{String(scientificVisualCategories.findIndex(item => item.id === category.id) + 1).padStart(2, '0')}</span></div>
      <div className="svh-card-body"><div className="svh-card-copy"><span>{category.shortTitle[locale]}</span><h3>{category.title[locale]}</h3><p>{category.description[locale]}</p></div><div className="svh-tags">{category.archetypes.slice(0, 3).map(item => <span key={item.en}>{item[locale]}</span>)}</div><div className="svh-actions"><button className="svh-primary" onClick={() => openPanel(category, 'templates')}>{fa ? 'مشاهده قالب‌ها' : 'View templates'}<span>↗</span></button><button className="svh-secondary" onClick={() => openPanel(category, 'guides')}>{fa ? 'راهنمای طراحی' : 'Design guide'}<span>→</span></button></div></div>
    </article>)}</div>

    {activeCategory && <section className="svh-detail-panel" aria-live="polite"><button className="svh-close" onClick={() => setActiveCategoryId(null)}>×</button><div className="svh-detail-header"><span>{activeCategory.shortTitle[locale]}</span><h3>{activeCategory.title[locale]}</h3><p>{activeCategory.description[locale]}</p></div><div className="svh-tabs"><button className={panelMode === 'templates' ? 'active' : ''} onClick={() => setPanelMode('templates')}>{fa ? 'قالب‌ها' : 'Templates'}</button><button className={panelMode === 'guides' ? 'active' : ''} onClick={() => setPanelMode('guides')}>{fa ? 'اصول طراحی' : 'Design guide'}</button></div>{panelMode === 'templates' ? <div className="svh-template-panel">{templates.length > 0 ? <div className="svh-template-list">{templates.map(template => <button key={template.id} onClick={() => startTemplate(template.id)}><b>{template.title[locale]}</b><span>{template.description[locale]}</span><em>{fa ? 'باز کردن در Figure Studio' : 'Open in Figure Studio'} →</em></button>)}</div> : <div className="svh-empty-templates"><b>{fa ? 'قالب‌های تخصصی این دسته در مرحله بعد اضافه می‌شوند.' : 'Dedicated templates for this category are coming in the next phase.'}</b><p>{fa ? 'ساختار این دسته از همین حالا در Taxonomy BioPlot ثبت شده است.' : 'This category is already part of the BioPlot taxonomy.'}</p></div>}<button className="svh-start-blank" onClick={() => startBlank(activeCategory)}>{fa ? 'شروع شکل خالی در این دسته' : 'Start a blank figure in this category'}<span>→</span></button></div> : <div className="svh-guide-panel"><div className="svh-guide-intro"><span>01</span><div><b>{fa ? 'سه اصل برای شروع درست' : 'Three principles for a strong start'}</b><p>{fa ? 'این نکات هسته‌ی راهنمای کامل این دسته خواهند بود.' : 'These principles will become the foundation of the full guide for this category.'}</p></div></div><ol>{guidePrinciples[activeCategory.id].map((tip, index) => <li key={tip.en}><span>0{index + 1}</span><p>{tip[locale]}</p></li>)}</ol><div className="svh-guide-topics"><b>{fa ? 'راهنماهای برنامه‌ریزی‌شده' : 'Planned guide topics'}</b>{activeCategory.guideTopics.map(topic => <span key={topic.en}>{topic[locale]}</span>)}</div></div>}</section>}
  </div>;
}

export function ScientificVisualHubHomePortal() {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let currentSection: HTMLElement | null = null;
    let currentHost: HTMLElement | null = null;
    const mount = () => {
      const section = document.querySelector<HTMLElement>('#templates');
      if (!section || section === currentSection) return;
      currentSection?.classList.remove('scientific-hub-mounted');
      currentHost?.remove();
      currentSection = section;
      section.classList.add('scientific-hub-mounted');
      const node = document.createElement('div');
      node.id = 'scientific-visual-hub-root';
      section.appendChild(node);
      currentHost = node;
      setHost(node);
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { observer.disconnect(); currentSection?.classList.remove('scientific-hub-mounted'); currentHost?.remove(); };
  }, []);

  return host ? createPortal(<ScientificVisualHubHome/>, host) : null;
}
