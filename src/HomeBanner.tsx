import { useEffect, useState } from 'react';
import { loadHomeContent } from './homeContent';
import { HOME_BANNER_DEFAULTS, type HomeBannerContent } from './homeBannerContent';
import './home-banner.css';

/** Active photographic Home hero. HomeHero/ShuffleHero remain archived in source. */
export function HomeBanner({ locale }: { locale: 'fa' | 'en' }) {
  const [content, setContent] = useState<HomeBannerContent>(HOME_BANNER_DEFAULTS);
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void loadHomeContent().then(next => {
        if (alive) setContent(next.banner ?? HOME_BANNER_DEFAULTS);
      }).catch(() => { /* Keep the complete, bundled banner during a CMS outage. */ });
    };
    refresh();
    window.addEventListener('focus', refresh);
    return () => { alive = false; window.removeEventListener('focus', refresh); };
  }, []);
  const copy = content[locale];
  return <section id="home" className="home-banner" dir={locale === 'fa' ? 'rtl' : 'ltr'} aria-label={locale === 'fa' ? 'طراحی شکل‌های علمی و آکادمیک' : 'Scientific and academic figure design'}>
    <img className="home-banner-image" src="/images/scientific-design-banner-1920.webp" srcSet="/images/scientific-design-banner-1280.webp 1280w, /images/scientific-design-banner-1920.webp 1920w" sizes="100vw" width="1920" height="1072" alt="" fetchPriority="high" decoding="async"/>
    <div className="home-banner-fade" aria-hidden="true"/>
    <div className="home-banner-copy">
      {copy.title && <h1>{copy.title}</h1>}
      {copy.subtitle && <p><span className="home-banner-promise">
        <span className="home-banner-promise-text">{copy.subtitle}</span>
        {(['top-left','top-right','bottom-left','bottom-right'] as const).map(corner => <span key={corner} className={`home-banner-promise-corner ${corner}`} aria-hidden="true"/>)}
      </span></p>}
      {(copy.primaryText || copy.secondaryText) && <div className="home-banner-actions">
        {copy.primaryText && <a className="home-banner-primary" href="/design">{copy.primaryText}</a>}
        {copy.secondaryText && <a className="home-banner-secondary" href="#portfolio">{copy.secondaryText}</a>}
      </div>}
    </div>
  </section>;
}
