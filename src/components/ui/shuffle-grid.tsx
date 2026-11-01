import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { StudioIcon } from '../../StudioIcon';
import './shuffle-grid.css';

export type ShuffleImage = { id: number; src: string; alt: string; fallbackSrc?: string };
export type ShuffleHeroProps = {
  loading?: boolean;
  copyLoading?: boolean;
  copyFailed?: boolean;
  loadFailed?: boolean;
  onRetry?: () => void;
  title?: string;
  highlight?: string;
  description?: string;
  eyebrow?: string;
  images?: ShuffleImage[];
  primaryText?: string;
  secondaryText?: string;
  secondaryHref?: string;
  fontStack?: string;
  socialProof?: string;
  onCreate?: () => void;
  locale?: 'en' | 'fa';
};

export function shuffleOrder(order: number[], random = Math.random): number[] {
  const next = [...order];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  // Every tick moves at least one tile, even if the shuffle drew the same order.
  if (next.length > 1 && next.every((id, i) => id === order[i])) next.push(next.shift()!);
  return next;
}

function decodeImage(src: string): Promise<boolean> {
  return new Promise(resolve => {
    const image = new Image();
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), 12_000);
    image.onerror = () => finish(false);
    const loaded = () => {
      if (typeof image.decode === 'function') void image.decode().then(() => finish(true)).catch(() => finish(image.naturalWidth > 0));
      else finish(image.naturalWidth > 0);
    };
    image.onload = loaded;
    image.src = src;
    if (image.complete) {
      if (image.naturalWidth > 0) loaded();
      else finish(false);
    }
  });
}

export function ShuffleHero({
  loading = false, copyLoading = false, copyFailed = false, loadFailed = false, onRetry,
  title = 'Your science.', highlight = 'Clearly illustrated.',
  description = 'Turn complex biology into clear, editable, publication-ready figures.',
  eyebrow = 'BIOPLOT FIGURE STUDIO',
  images = [],
  primaryText = 'Create scientific figure', secondaryText = 'My dashboard',
  secondaryHref = '/dashboard',
  fontStack,
  socialProof, onCreate, locale = 'en',
}: ShuffleHeroProps) {
  const [order, setOrder] = useState(() => Array.from({ length: 16 }, (_, i) => i));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [readyKey, setReadyKey] = useState('');
  const [displayImages, setDisplayImages] = useState<ShuffleImage[]>([]);
  const grid = useRef<HTMLDivElement>(null);
  const fa = locale === 'fa';
  const sourceKey = images.slice(0, 16).map(image => `${image.id}:${image.src}:${image.fallbackSrc ?? ''}`).join('|');
  const imagesLoading = loading || readyKey !== sourceKey;

  useEffect(() => {
    let cancelled = false;
    setReadyKey('');
    if (loading) return () => { cancelled = true; };
    void Promise.all(images.slice(0, 16).map(async image => {
      if (!image.src) return { ...image, src: '' };
      if (await decodeImage(image.src)) return image;
      if (image.fallbackSrc && image.fallbackSrc !== image.src && await decodeImage(image.fallbackSrc)) {
        return { ...image, src: image.fallbackSrc };
      }
      return { ...image, src: '' };
    })).then(resolved => {
      if (cancelled) return;
      setDisplayImages(resolved);
      setReadyKey(sourceKey);
    });
    return () => { cancelled = true; };
  }, [loading, sourceKey]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || imagesLoading) return;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (grid.current) observer.observe(grid.current);
    const timer = window.setInterval(() => {
      if (visible && document.visibilityState === 'visible') setOrder(previous => shuffleOrder(previous));
    }, 4000);
    return () => { window.clearInterval(timer); observer.disconnect(); };
  }, [paused, reducedMotion, imagesLoading]);

  return <section className="shuffle-hero" id="home" aria-labelledby="shuffle-hero-title" style={fontStack ? {fontFamily:fontStack} : undefined}>
    <div className="shuffle-hero-copy" aria-busy={copyLoading}>
      {copyLoading ? <div className="shuffle-copy-skeleton" aria-hidden="true"><i className="skeleton-eyebrow"/><i className="skeleton-title"/><i className="skeleton-highlight"/><i className="skeleton-description"/><i className="skeleton-description short"/><div className="skeleton-actions"><i/><i/></div></div> : copyFailed ? <div className="shuffle-copy-error" role="alert"><p>{fa?'دریافت نوشته‌های صفحه انجام نشد.':'Home page text could not be loaded.'}</p><button type="button" className="shuffle-cta secondary" onClick={onRetry}>{fa?'تلاش دوباره':'Try again'}</button></div> : <>
      <span className="shuffle-hero-eyebrow">{eyebrow}</span>
      <h1 id="shuffle-hero-title">{title}<br/><span>{highlight}</span></h1>
      <p>{description}</p>
      <div className="shuffle-hero-actions">
        {onCreate ? <button className="shuffle-cta" onClick={onCreate}>{primaryText}</button> : <a className="shuffle-cta" href="/editor">{primaryText}</a>}
        <a className="shuffle-cta secondary" href={secondaryHref}>{secondaryText}</a>
      </div>
      {socialProof && <small>{socialProof}</small>}
      </>}
    </div>
    <div className="shuffle-hero-visual">
      <div ref={grid} className="shuffle-grid" aria-busy={imagesLoading && !loadFailed} dir="ltr" aria-label={fa ? 'گالری تصاویر BioPlot' : 'BioPlot image gallery'}>
        {imagesLoading && Array.from({length:16},(_,i)=><div key={i} className="shuffle-tile shuffle-placeholder" aria-hidden="true" style={{'--column':i%4,'--row':Math.floor(i/4)} as CSSProperties}/>)}
        {!imagesLoading && displayImages.map((image, i) => {
          const position = order.indexOf(i);
          return <div key={image.id} className="shuffle-tile" data-image-slot={image.id} style={{ '--column': position % 4, '--row': Math.floor(position / 4) } as CSSProperties}>
            {image.src && <img src={image.src} alt={image.alt} decoding="async" onError={event=>{event.currentTarget.remove();}}/>}
          </div>;
        })}
      </div>
      {loadFailed && <button className="shuffle-motion" onClick={onRetry}>{fa?'تلاش دوباره برای دریافت تصاویر':'Retry loading images'}</button>}
      {!imagesLoading && !reducedMotion && <button className="shuffle-motion" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
        <StudioIcon name={paused ? 'play' : 'pause'} size={14}/>
        {fa ? (paused ? 'ادامه حرکت تصاویر' : 'توقف حرکت تصاویر') : (paused ? 'Play animation' : 'Pause animation')}
      </button>}
    </div>
  </section>;
}
