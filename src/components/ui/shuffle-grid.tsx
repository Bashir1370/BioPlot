import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { StudioIcon } from '../../StudioIcon';
import { HOME_HERO_DEFAULTS } from '../../homeHeroDefaults';
import './shuffle-grid.css';

export type ShuffleImage = { id: number; src: string; alt: string };
export type ShuffleHeroProps = {
  loading?: boolean;
  loadFailed?: boolean;
  onRetry?: () => void;
  title?: string;
  highlight?: string;
  description?: string;
  eyebrow?: string;
  images?: ShuffleImage[];
  primaryText?: string;
  secondaryText?: string;
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
  loading = false, loadFailed = false, onRetry,
  title = 'Your science.', highlight = 'Clearly illustrated.',
  description = 'Turn complex biology into clear, editable, publication-ready figures.',
  eyebrow = 'BIOPLOT FIGURE STUDIO',
  images = HOME_HERO_DEFAULTS.map((src, i) => ({ id: i + 1, src, alt: 'Scientific inspiration' })),
  primaryText = 'Create scientific figure', secondaryText = 'Browse templates',
  socialProof, onCreate, locale = 'en',
}: ShuffleHeroProps) {
  const [order, setOrder] = useState(() => Array.from({ length: 16 }, (_, i) => i));
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const grid = useRef<HTMLDivElement>(null);
  const fa = locale === 'fa';

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(preference.matches);
    sync();
    preference.addEventListener('change', sync);
    return () => preference.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion || loading) return;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (grid.current) observer.observe(grid.current);
    const timer = window.setInterval(() => {
      if (visible && document.visibilityState === 'visible') setOrder(previous => shuffleOrder(previous));
    }, 4000);
    return () => { window.clearInterval(timer); observer.disconnect(); };
  }, [paused, reducedMotion, loading]);

  return <section className="shuffle-hero" id="home" aria-labelledby="shuffle-hero-title">
    <div className="shuffle-hero-copy">
      <span className="shuffle-hero-eyebrow">{eyebrow}</span>
      <h1 id="shuffle-hero-title">{title}<br/><span>{highlight}</span></h1>
      <p>{description}</p>
      <div className="shuffle-hero-actions">
        {onCreate ? <button className="shuffle-cta" onClick={onCreate}>{primaryText}</button> : <a className="shuffle-cta" href="/editor">{primaryText}</a>}
        <a className="shuffle-cta secondary" href="/templates">{secondaryText}</a>
      </div>
      {socialProof && <small>{socialProof}</small>}
    </div>
    <div className="shuffle-hero-visual">
      <div ref={grid} className="shuffle-grid" aria-busy={loading && !loadFailed} dir="ltr" aria-label={fa ? 'گالری تصاویر BioPlot' : 'BioPlot image gallery'}>
        {loading && Array.from({length:16},(_,i)=><div key={i} className="shuffle-tile shuffle-placeholder" aria-hidden="true" style={{'--column':i%4,'--row':Math.floor(i/4)} as CSSProperties}/>)}
        {!loading && images.slice(0, 16).map((image, i) => {
          const position = order.indexOf(i);
          return <div key={image.id} className="shuffle-tile" data-image-slot={image.id} style={{ '--column': position % 4, '--row': Math.floor(position / 4) } as CSSProperties}>
            <img src={image.src} alt={image.alt} decoding="async"/>
          </div>;
        })}
      </div>
      {loadFailed && <button className="shuffle-motion" onClick={onRetry}>{fa?'تلاش دوباره برای دریافت تصاویر':'Retry loading images'}</button>}
      {!loading && !reducedMotion && <button className="shuffle-motion" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
        <StudioIcon name={paused ? 'play' : 'pause'} size={14}/>
        {fa ? (paused ? 'ادامه حرکت تصاویر' : 'توقف حرکت تصاویر') : (paused ? 'Play animation' : 'Pause animation')}
      </button>}
    </div>
  </section>;
}
