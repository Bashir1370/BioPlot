import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { StudioIcon } from './StudioIcon';
import { loadTemplateHeroImages, templateHeroPublicUrl, type TemplateHeroImage } from './templateHero';
import './template-hero.css';

type Locale = 'en' | 'fa';
const FALLBACK = '/images/scientific-cell-hero.webp';
const CACHE_KEY = 'bioplot-template-hero-images-v1';

function readCachedImages(): TemplateHeroImage[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(item => item && [1, 2, 3].includes(Number(item.slot)) && typeof item.storagePath === 'string');
  } catch {
    return [];
  }
}

function cacheImages(images: TemplateHeroImage[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(images));
  } catch {
    // Local storage can be unavailable in private or restricted browsing contexts.
  }
}

function preloadImage(src: string) {
  return new Promise<void>(resolve => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (typeof image.decode === 'function') {
        void image.decode().catch(() => undefined).finally(() => resolve());
      } else {
        resolve();
      }
    };
    image.onerror = () => resolve();
    image.src = src;
    if (image.complete && image.naturalWidth > 0) resolve();
  });
}

export function TemplateHeroEnhancer() {
  const cachedAtStartup = useMemo(() => readCachedImages(), []);
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [locale, setLocale] = useState<Locale>(() => document.documentElement.lang === 'fa' ? 'fa' : 'en');
  const [images, setImages] = useState<TemplateHeroImage[]>(cachedAtStartup);
  const [sourceResolved, setSourceResolved] = useState(cachedAtStartup.length > 0);
  const [collageReady, setCollageReady] = useState(false);
  const fa = locale === 'fa';

  useEffect(() => {
    const mount = () => {
      const hero = document.querySelector<HTMLElement>('.tkh-hero');
      if (!hero || hero.querySelector('[data-template-hero-root]')) return;
      hero.classList.add('tkh-hero-enhanced');
      const node = document.createElement('div');
      node.dataset.templateHeroRoot = 'true';
      hero.appendChild(node);
      setHost(node);
    };
    mount();
    const observer = new MutationObserver(mount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = () => setLocale(document.documentElement.lang === 'fa' ? 'fa' : 'en');
    const observer = new MutationObserver(sync);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadTemplateHeroImages()
      .then(freshImages => {
        if (cancelled) return;
        cacheImages(freshImages);
        setImages(freshImages);
        setSourceResolved(true);
      })
      .catch(() => {
        if (!cancelled) setSourceResolved(true);
      });
    return () => { cancelled = true; };
  }, []);

  const slots = useMemo(() => {
    if (!sourceResolved) return [];
    return ([1, 2, 3] as const).map(slot => {
      const item = images.find(image => image.slot === slot);
      return {
        slot,
        src: item ? templateHeroPublicUrl(item.storagePath) : FALLBACK,
        alt: item ? (fa ? item.altFa : item.altEn) : (fa ? 'نمونه تصویر علمی BioPlot' : 'BioPlot scientific figure inspiration'),
      };
    });
  }, [images, fa, sourceResolved]);

  const slotKey = slots.map(item => item.src).join('|');

  useEffect(() => {
    if (slots.length !== 3) {
      setCollageReady(false);
      return;
    }
    let cancelled = false;
    setCollageReady(false);
    void Promise.all(slots.map(item => preloadImage(item.src))).then(() => {
      if (!cancelled) setCollageReady(true);
    });
    return () => { cancelled = true; };
  }, [slotKey]);

  if (!host) return null;

  return createPortal(
    <div className="tkh-hero-v2">
      <div className="tkh-hero-v2-copy">
        <span className="tkh-eyebrow"><i/>BIOPLOT DESIGN LIBRARY</span>
        <h1>{fa ? <>شکل علمی‌ات را <em>مثل یک داستان</em> طراحی کن.</> : <>Design your science <em>like a visual story.</em></>}</h1>
        <p>{fa
          ? 'از میان ۱۳ خانواده‌ی اصلی شکل علمی، ساختار مناسب را انتخاب کن؛ اصول طراحی برای داوری بهتر را یاد بگیر و همان ایده را مستقیم در Figure Studio بساز.'
          : 'Choose from 13 core scientific figure families, learn the design decisions that improve reviewer clarity, then turn the same idea into an editable figure in Figure Studio.'}</p>

        <div className="tkh-hero-v2-actions">
          <a className="primary" href="#library"><StudioIcon name="templates" size={18}/>{fa ? 'مشاهده ۱۳ راهنما' : 'Explore 13 guides'}</a>
          <a className="secondary" href="editor.html"><StudioIcon name="figure" size={18}/>{fa ? 'شروع در Figure Studio' : 'Open Figure Studio'}</a>
        </div>

        <div className="tkh-hero-v2-stats" aria-label={fa ? 'ویژگی‌های کتابخانه' : 'Library highlights'}>
          <div><span><StudioIcon name="templates" size={18}/></span><strong>13</strong><small>{fa ? 'خانواده شکل علمی' : 'visual families'}</small></div>
          <div><span><StudioIcon name="check" size={18}/></span><strong>5</strong><small>{fa ? 'کنترل قبل از انتشار' : 'readiness checks'}</small></div>
          <div><span><StudioIcon name="figure" size={18}/></span><strong>1</strong><small>{fa ? 'مسیر مستقیم تا طراحی' : 'studio workflow'}</small></div>
        </div>
      </div>

      <div
        className={`tkh-hero-collage${collageReady ? ' is-ready' : ' is-loading'}`}
        aria-label={fa ? 'نمونه تصاویر علمی' : 'Scientific visual examples'}
        aria-busy={!collageReady}
      >
        <span className="hero-collage-glow glow-a" aria-hidden="true"/>
        <span className="hero-collage-glow glow-b" aria-hidden="true"/>
        <span className="hero-collage-orbit" aria-hidden="true"/>
        <span className="hero-collage-dot dot-a" aria-hidden="true"/>
        <span className="hero-collage-dot dot-b" aria-hidden="true"/>
        {slots.map(({ slot, src, alt }) => <figure className={`hero-photo hero-photo-${slot}`} style={{ height: 'auto' }} key={`${slot}-${src}`}>
          <div className="hero-photo-frame" style={{ height: 'auto', aspectRatio: 'var(--hero-image-ratio, 4 / 3)' }}>
            <img
              src={src}
              alt={alt}
              decoding="async"
              fetchPriority={slot === 1 ? 'high' : 'auto'}
              style={{ objectFit: 'contain' }}
              onLoad={event => {
                const image = event.currentTarget;
                const rawRatio = image.naturalWidth / Math.max(1, image.naturalHeight);
                const safeRatio = Math.min(1.6, Math.max(.78, rawRatio));
                image.parentElement?.style.setProperty('--hero-image-ratio', String(safeRatio));
              }}
            />
          </div>
        </figure>)}
      </div>
    </div>,
    host,
  );
}
