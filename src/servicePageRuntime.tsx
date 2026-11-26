import { createRoot } from 'react-dom/client';
import { loadHomeContent } from './homeContent';
import {
  SERVICE_SLUGS, mergeServicePageContent, servicePageKey,
  type ServiceLocale, type ServiceSlug, type ServicePageFields,
} from './servicePageContent';

// Load the same global and Home styles in the same cascade order as DashboardApp.
import './tailwind.css';
import './styles-v3.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/vazirmatn';
import './persian-typography.css';
// Keep Home chrome styles in the runtime entry stylesheet so static fallbacks are styled too.
import './home-footer.css';
import './precision-studio.css';
import './home.css';
import './home-top-nav.css';
import './home-account.css';
import './home-header.css';
import { HomeHeader } from './HomeHeader';
import { HomeFooter } from './HomeFooter';
import './home-mobile.css';

const match = location.pathname.match(/^\/services\/(fa|en)\/([a-z-]+)\/?$/);
const locale = match?.[1] as ServiceLocale | undefined;
const slug = match?.[2] as ServiceSlug | undefined;

if (locale && slug && SERVICE_SLUGS.includes(slug)) {
  const head = document.getElementById('service-header-root');
  const foot = document.getElementById('service-footer-root');
  if (head) createRoot(head).render(
    <HomeHeader locale={locale} currentPage={null}
      onLocaleChange={() => location.assign(`/services/${locale === 'fa' ? 'en' : 'fa'}/${slug}/`)} />
  );
  if (foot) createRoot(foot).render(<HomeFooter locale={locale}/>);

  // For Persian pages, display Persian digits in editable body copy.
  const localize = (value: string) => locale === 'fa'
    ? value.replace(/[0-9]/g, digit => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)])
    : value;
  const setText = (selector: string, value: string) => {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) el.textContent = localize(value);
  };
  const setMeta = (selector: string, text: string) => {
    const el = document.querySelector<HTMLMetaElement>(selector);
    if (el) el.content = text;
  };

  const update = (data: ServicePageFields) => {
    document.title = data.metaTitle;
    setMeta('meta[name="description"]', data.metaDescription);
    setMeta('meta[property="og:title"]', data.metaTitle);
    setMeta('meta[property="og:description"]', data.metaDescription);
    setText('.hero .eyebrow', data.eyebrow);
    setText('main .hero h1', data.title);
    setText('.breadcrumb span:last-child', data.title);
    setText('.hero .lead', data.lead);
    setText('.hero-actions .primary', data.primaryCta);
    setText('.hero-actions .secondary', data.secondaryCta);
    setText('.example figcaption', data.imageCaption);
    const image = document.querySelector<HTMLImageElement>('.example img');
    if (image) image.alt = localize(data.imageAlt);
    setText('#details-title', data.detailsTitle);
    setText('.section-heading p', data.detailsBody);
    for(let i=1;i<=3;i++) {
      setText(`.feature-list li:nth-child(${i})`, data[`feature${i}` as keyof ServicePageFields]);
      setText(`.steps li:nth-child(${i})`, data[`step${i}` as keyof ServicePageFields]);
    }
    setText('#steps-title', data.stepsTitle);
    setText('#audience-title', data.audienceTitle);
    setText('#audience-body', data.audienceBody);
    setText('#specs-title', data.specsTitle);
    setText('#specs-body', data.specsBody);
    setText('#faq-title', data.faqTitle);
    setText('#faq1-question', data.faq1Question);
    setText('#faq1-answer', data.faq1Answer);
    setText('#faq2-question', data.faq2Question);
    setText('#faq2-answer', data.faq2Answer);
    setText('#more-title', data.relatedTitle);
    const structured = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (structured) {
      try {
        const schema = JSON.parse(structured.textContent || '{}') as Record<string, unknown>;
        schema.name = data.title;
        schema.description = data.lead;
        structured.textContent = JSON.stringify(schema).replace(/</g, '\\u003c');
      } catch { /* Keep the crawlable static schema. */ }
    }
  };

  let refreshInProgress = false;
  const refresh = async () => {
    if (refreshInProgress) return;
    refreshInProgress = true;
    try {
      const home = await loadHomeContent();
      update(mergeServicePageContent(servicePageKey(slug,locale), home.servicePages?.[servicePageKey(slug,locale)]));
      for (const link of document.querySelectorAll<HTMLAnchorElement>('.more .other-links a')) {
        const relatedSlug = link.pathname.split('/').filter(Boolean).at(-1);
        if (!relatedSlug || !SERVICE_SLUGS.includes(relatedSlug as ServiceSlug)) continue;
        const relatedKey = servicePageKey(relatedSlug as ServiceSlug,locale);
        link.textContent = localize(mergeServicePageContent(relatedKey,home.servicePages?.[relatedKey]).title);
      }
    } catch {
      // Fail open: static HTML continues to display its complete original copy.
    } finally {
      refreshInProgress = false;
    }
  };
  void refresh();
  window.addEventListener('focus', () => {void refresh();});
}
