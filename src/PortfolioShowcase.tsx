import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StudioIcon } from './StudioIcon';
import { loadPublishedShowcaseItems, ShowcaseItem, showcasePublicUrl } from './showcasePortfolio';
import './portfolio-showcase.css';

type Locale = 'en' | 'fa';
const AUTOPLAY_MS = 5200;

function localeFromDocument(): Locale {
  return document.documentElement.lang === 'fa' || localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en';
}

export function PortfolioShowcasePortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [locale, setLocale] = useState<Locale>(localeFromDocument);
  const [slides, setSlides] = useState<ShowcaseItem[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);

  useEffect(() => {
    const attach = () => {
      const content = document.querySelector<HTMLElement>('.home-content');
      if (content) setTarget(content);
      else requestAnimationFrame(attach);
    };
    attach();
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => setLocale(localeFromDocument()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await loadPublishedShowcaseItems();
        if (!cancelled) {
          setSlides(next);
          setActive(current => next.length ? Math.min(current, next.length - 1) : 0);
        }
      } catch {
        if (!cancelled) setSlides([]);
      }
    }
    void load();
    const refresh = () => void load();
    window.addEventListener('focus', refresh);
    return () => { cancelled = true; window.removeEventListener('focus', refresh); };
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % slides.length), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  if (!target || slides.length === 0) return null;
  const previous = () => setActive(current => (current - 1 + slides.length) % slides.length);
  const next = () => setActive(current => (current + 1) % slides.length);
  const title = locale === 'fa' ? 'تصاویر اختصاصی' : 'Exclusive scientific visuals';
  const previousLabel = locale === 'fa' ? 'تصویر قبلی' : 'Previous image';
  const nextLabel = locale === 'fa' ? 'تصویر بعدی' : 'Next image';

  return createPortal(
    <section className="portfolio-showcase home-section" aria-labelledby="portfolio-showcase-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="portfolio-showcase-heading">
        <h2 id="portfolio-showcase-title">{title}</h2>
        {slides.length > 1 && <div className="portfolio-showcase-controls" aria-label="Portfolio carousel controls">
          <button type="button" onClick={previous} aria-label={previousLabel}><StudioIcon name="arrow"/></button>
          <span>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <button type="button" onClick={next} aria-label={nextLabel}><StudioIcon name="arrow"/></button>
        </div>}
      </div>

      <div className="portfolio-squeeze" role="region" aria-roledescription="carousel" onPointerDown={event => { pointerStart.current = event.clientX; }} onPointerUp={event => {
        if (pointerStart.current === null) return;
        const delta = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(delta) < 44) return;
        delta > 0 ? previous() : next();
      }}>
        {slides.map((slide, index) => {
          const isActive = index === active;
          return <button type="button" key={slide.id} className={`portfolio-slide ${isActive ? 'active' : ''}`} aria-label={`${title} ${index + 1}`} aria-current={isActive ? 'true' : undefined} onClick={() => setActive(index)}>
            <img src={showcasePublicUrl(slide.storagePath)} alt="" loading={isActive ? 'eager' : 'lazy'}/>
          </button>;
        })}
      </div>
    </section>,
    target,
  );
}
