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

export function ShuffleHero({
  loading = false, copyLoading = false, copyFailed = false, loadFailed = false, onRetry,
  title = '', highlight = '', description = '', eyebrow = '',
  images = [],
  primaryText = '', secondaryText = '',
  secondaryHref = '/dashboard',
  fontStack,
  socialProof, onCreate, locale = 'en',
}: ShuffleHeroProps) {
  const [order, setOrder] = useState(() => Array.from({ length: 16 }, (_, i) => i));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const fa = locale === 'fa';
  const imagesLoading = loading;
  const hasHeading = Boolean(title || highlight);

  // Browser-native image loading paints each thumbnail as it arrives. Never block
  // the entire sixteen-tile gallery on one failed or slow Supabase image.

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

  return <section className="shuffle-hero" id="home" aria-labelledby={!copyLoading&&!copyFailed&&hasHeading?'shuffle-hero-title':undefined} aria-label={copyLoading?(fa?'در حال دریافت نوشته‌های صفحهٔ اصلی':'Loading Home page text'):undefined} style={fontStack ? {fontFamily:fontStack} : undefined}>
    <div className="shuffle-hero-copy" aria-busy={copyLoading}>
      {copyLoading ? <div className="shuffle-copy-skeleton" role="status" aria-label={fa?'در حال دریافت نوشته‌های صفحهٔ اصلی':'Loading Home page text'}><i className="skeleton-eyebrow"/><i className="skeleton-title"/><i className="skeleton-highlight"/><i className="skeleton-description"/><i className="skeleton-description short"/><div className="skeleton-actions"><i/><i/></div></div> : copyFailed ? <div className="shuffle-copy-error" role="alert"><p>{fa?'دریافت نوشته‌های صفحه انجام نشد.':'Home page text could not be loaded.'}</p><button type="button" className="shuffle-cta secondary" onClick={onRetry}>{fa?'تلاش دوباره':'Try again'}</button></div> : <>
      {eyebrow && <span className="shuffle-hero-eyebrow">{eyebrow}</span>}
      {hasHeading && <h1 id="shuffle-hero-title">{title}{title && highlight && <br/>}{highlight && <span>{highlight}</span>}</h1>}
      {description && <p>{description}</p>}
      {(primaryText || secondaryText) && <div className="shuffle-hero-actions">
        {primaryText && (onCreate ? <button className="shuffle-cta" onClick={onCreate}>{primaryText}</button> : <a className="shuffle-cta" href="/editor">{primaryText}</a>)}
        {secondaryText && <a className="shuffle-cta secondary" href={secondaryHref}>{secondaryText}</a>}
      </div>}
      {socialProof && <small>{socialProof}</small>}
      </>}
    </div>
    <div className="shuffle-hero-visual">
      <div ref={grid} className="shuffle-grid" aria-busy={imagesLoading && !loadFailed} dir="ltr" aria-label={fa ? 'گالری تصاویر BioPlot' : 'BioPlot image gallery'}>
        {Array.from({length:16},(_,i)=>{
          const image=imagesLoading ? undefined : images[i];
          const position=order.indexOf(i);
          return <div key={i} className={image?.src ? 'shuffle-tile' : 'shuffle-tile shuffle-placeholder'}
            data-image-slot={image?.id}
            style={{'--column':position%4,'--row':Math.floor(position/4)} as CSSProperties}>
            {image?.src && <img src={image.src} alt={image.alt} loading={i<4?'eager':'lazy'} decoding="async"
              onError={event=>{
                const element=event.currentTarget;
                // Use the original only if the optimized WebP thumbnail is unavailable.
                if(image.fallbackSrc && element.getAttribute('src')!==image.fallbackSrc) element.src=image.fallbackSrc;
                else element.remove();
              }}/>}
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
