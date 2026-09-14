import { CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StudioIcon } from './StudioIcon';
import { loadPublishedShowcaseItems, ShowcaseItem, showcasePublicUrl } from './showcasePortfolio';
import './portfolio-showcase.css';

type Locale = 'en' | 'fa';
const AUTOPLAY_MS = 5200;
const MIN_RATIO = 0.62;
const MAX_RATIO = 2.6;

function localeFromDocument(): Locale {
  return document.documentElement.lang === 'fa' || localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en';
}

function safeImageRatio(image: HTMLImageElement) {
  if (!image.naturalWidth || !image.naturalHeight) return 1.65;
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, image.naturalWidth / image.naturalHeight));
}

export function PortfolioShowcasePortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [locale, setLocale] = useState<Locale>(localeFromDocument);
  const [slides, setSlides] = useState<ShowcaseItem[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ratios, setRatios] = useState<Record<string, number>>({});
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
  const title = locale === 'fa' ? 'تصاویر سفارشی' : 'Custom client visuals';
  const previousLabel = locale === 'fa' ? 'تصویر قبلی' : 'Previous image';
  const nextLabel = locale === 'fa' ? 'تصویر بعدی' : 'Next image';

  return createPortal(
    <section className="portfolio-showcase home-section" aria-labelledby="portfolio-showcase-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="portfolio-showcase-heading">
        <h2 id="portfolio-showcase-title">{title}</h2>
        {slides.length > 1 && <div className="portfolio-showcase-controls" aria-label={locale === 'fa' ? 'کنترل تصاویر سفارشی' : 'Custom visuals carousel controls'}>
          <button type="button" onClick={previous} aria-label={previousLabel}><StudioIcon name="arrow"/></button>
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
          const style = { '--slide-ratio': String(ratios[slide.id] ?? 1.65) } as CSSProperties;
          return <button type="button" key={slide.id} style={style} className={`portfolio-slide ${isActive ? 'active' : ''}`} aria-label={locale === 'fa' ? 'تصویر سفارشی' : 'Custom visual'} aria-current={isActive ? 'true' : undefined} onClick={() => setActive(index)}>
            <img src={showcasePublicUrl(slide.storagePath)} alt="" loading={isActive ? 'eager' : 'lazy'} onLoad={event => {
              const ratio = safeImageRatio(event.currentTarget);
              setRatios(current => current[slide.id] === ratio ? current : { ...current, [slide.id]: ratio });
            }}/>
          </button>;
        })}
      </div>
    </section>,
    target,
  );
}
