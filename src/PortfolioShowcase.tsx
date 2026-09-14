import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { documentToSvg } from './export';
import { BioPlotDocument } from './model';
import { projects } from './persistence';
import { StudioIcon } from './StudioIcon';
import './portfolio-showcase.css';

type Locale = 'en' | 'fa';

type ShowcaseSlide = {
  id: string;
  title: string;
  updatedAt: string;
  objectCount: number;
  thumbnail: string;
};

const SHOWCASE_KEY = 'bioplot-showcase-projects-v1';
const MAX_SLIDES = 6;
const AUTOPLAY_MS = 5200;

const copy = {
  en: {
    kicker: 'SELECTED WORK',
    title: 'Scientific figures, built in BioPlot.',
    text: 'A live showcase of your BioPlot projects. Every slide stays editable in Figure Studio, so updating the project automatically updates the showcase artwork.',
    edit: 'Edit in Studio',
    next: 'Next project',
    previous: 'Previous project',
    empty: 'Create or edit a project with at least one object to populate this showcase.',
    objects: 'objects',
    live: 'Live from Figure Studio'
  },
  fa: {
    kicker: 'نمونه‌کارهای منتخب',
    title: 'شکل‌های علمی ساخته‌شده در BioPlot',
    text: 'این بخش مستقیماً از پروژه‌های BioPlot تغذیه می‌شود. هر اسلاید در Figure Studio قابل ویرایش است و با تغییر پروژه، تصویر نمونه‌کار نیز خودکار به‌روز می‌شود.',
    edit: 'ویرایش در Studio',
    next: 'نمونه بعدی',
    previous: 'نمونه قبلی',
    empty: 'برای نمایش نمونه‌کار، یک پروژه دارای حداقل یک آبجکت ایجاد یا ویرایش کن.',
    objects: 'آبجکت',
    live: 'متصل به Figure Studio'
  }
};

function localeFromDocument(): Locale {
  return document.documentElement.lang === 'fa' || localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en';
}

function svgDataUri(documentState: BioPlotDocument) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(documentToSvg(documentState))}`;
}

function configuredIds() {
  try {
    const value = JSON.parse(localStorage.getItem(SHOWCASE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function PortfolioShowcasePortal() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [locale, setLocale] = useState<Locale>(localeFromDocument);
  const [slides, setSlides] = useState<ShowcaseSlide[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);
  const t = copy[locale];

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
        const summaries = await projects.list();
        const preferred = configuredIds();
        const rank = new Map(preferred.map((id, index) => [id, index]));
        const ordered = [...summaries].sort((a, b) => {
          const ar = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER;
          const br = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER;
          if (ar !== br) return ar - br;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        const hydrated: ShowcaseSlide[] = [];
        for (const summary of ordered) {
          if (hydrated.length >= MAX_SLIDES) break;
          const documentState = await projects.load(summary.id);
          if (!documentState) continue;
          const objectCount = documentState.pages.reduce((sum, page) => sum + page.objects.length, 0);
          if (objectCount < 1) continue;
          hydrated.push({
            id: summary.id,
            title: summary.title,
            updatedAt: summary.updatedAt,
            objectCount,
            thumbnail: svgDataUri(documentState)
          });
        }

        if (!cancelled) {
          setSlides(hydrated);
          setActive(current => hydrated.length ? Math.min(current, hydrated.length - 1) : 0);
        }
      } catch {
        if (!cancelled) setSlides([]);
      }
    }

    void load();
    const refresh = () => void load();
    window.addEventListener('focus', refresh);
    return () => {
      cancelled = true;
      window.removeEventListener('focus', refresh);
    };
  }, []);

  useEffect(() => {
    if (paused || slides.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % slides.length), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused, slides.length]);

  const activeSlide = slides[active];
  const date = useMemo(() => activeSlide ? new Intl.DateTimeFormat(locale === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric' }).format(new Date(activeSlide.updatedAt)) : '', [activeSlide, locale]);

  if (!target) return null;

  const previous = () => slides.length && setActive(current => (current - 1 + slides.length) % slides.length);
  const next = () => slides.length && setActive(current => (current + 1) % slides.length);

  return createPortal(
    <section className="portfolio-showcase home-section" aria-labelledby="portfolio-showcase-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
      <div className="portfolio-showcase-heading">
        <div>
          <span className="home-section-kicker">{t.kicker}</span>
          <h2 id="portfolio-showcase-title">{t.title}</h2>
          <p>{t.text}</p>
        </div>
        {slides.length > 1 && <div className="portfolio-showcase-controls" aria-label="Portfolio carousel controls">
          <button type="button" onClick={previous} aria-label={t.previous}><StudioIcon name="arrow"/></button>
          <span>{String(active + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
          <button type="button" onClick={next} aria-label={t.next}><StudioIcon name="arrow"/></button>
        </div>}
      </div>

      {slides.length === 0 ? <div className="portfolio-showcase-empty"><StudioIcon name="figure" size={30} weight="duotone"/><span>{t.empty}</span></div> : <div className="portfolio-squeeze" role="region" aria-roledescription="carousel" onPointerDown={event => { pointerStart.current = event.clientX; }} onPointerUp={event => {
        if (pointerStart.current === null) return;
        const delta = event.clientX - pointerStart.current;
        pointerStart.current = null;
        if (Math.abs(delta) < 44) return;
        delta > 0 ? previous() : next();
      }}>
        {slides.map((slide, index) => {
          const isActive = index === active;
          return <article key={slide.id} className={`portfolio-slide ${isActive ? 'active' : ''}`} aria-hidden={!isActive && slides.length > 3} onClick={() => setActive(index)}>
            <img src={slide.thumbnail} alt={slide.title} loading={isActive ? 'eager' : 'lazy'}/>
            <div className="portfolio-slide-shade"/>
            <div className="portfolio-slide-index">{String(index + 1).padStart(2, '0')}</div>
            <div className="portfolio-slide-copy">
              <span className="portfolio-live"><i/>{t.live}</span>
              <h3>{slide.title}</h3>
              <p>{slide.objectCount} {t.objects}{isActive && date ? ` · ${date}` : ''}</p>
              {isActive && <a href={`editor.html?id=${encodeURIComponent(slide.id)}&from=showcase`} onClick={event => event.stopPropagation()}><StudioIcon name="edit" size={15}/>{t.edit}<StudioIcon name="arrow" size={14}/></a>}
            </div>
          </article>;
        })}
      </div>}
    </section>,
    target
  );
}
