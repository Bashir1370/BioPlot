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
    <img className="home-banner-image" src="/images/scientific-design-banner-1920.webp" srcSet="/images/scientific-design-banner-1280.webp 1280w, /images/scientific-design-banner-1920.webp 1920w" sizes="(max-width: 1440px) 100vw, 1440px" width="1920" height="1072" alt="" fetchPriority="high" decoding="async"/>
    <div className="home-banner-fade" aria-hidden="true"/>
    <div className="home-banner-copy">
      {copy.title && <h1>{copy.title}</h1>}
      {copy.subtitle && <p>{copy.subtitle}</p>}
    </div>
  </section>;
}
