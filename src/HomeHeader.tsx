import { useEffect, useRef, useState } from 'react';
import { HomeAccountPortal } from './HomeAccountPortal';
import './home-header.css';

// The selected HyperUI header layout, adapted to BioPlot without a Tailwind runtime.
export function HomeHeader({ locale, onLocaleChange, currentPage = 'home' }: {
  locale: 'en' | 'fa';
  onLocaleChange: () => void;
  currentPage?: 'home' | 'design' | null;
}) {
  const fa = locale === 'fa';
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); }
    };
    const onOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 1100px)');
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onOutside);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [open]);

  return <header className="home-header" ref={header} dir={fa ? 'rtl' : 'ltr'}>
    <div className="home-header-inner">
      <a className="home-header-brand" dir="ltr" href="/" aria-label={fa ? 'خانه BioPlot' : 'BioPlot home'}>
        <span className="home-header-mark" aria-hidden="true">B</span>
        <span className="home-header-logo-tail" aria-hidden="true">ioplot</span>
      </a>
      <nav id="home-header-navigation" className={`home-header-nav${open ? ' is-open' : ''}`} aria-label={fa ? 'ناوبری اصلی' : 'Main navigation'} onClick={event => { if ((event.target as HTMLElement).closest('a')) setOpen(false); }}>
        <ul>
          <li><a href="/" aria-current={currentPage === 'home' ? 'page' : undefined}>{fa ? 'خانه' : 'Home'}</a></li>
          <li><a href="/dashboard">{fa ? 'داشبورد من' : 'My dashboard'}</a></li>
          <li className="home-header-mobile-order"><a href="/design" aria-current={currentPage === 'design' ? 'page' : undefined}>{fa ? 'سفارش طراحی' : 'Request a design'}</a></li>
          <li><span className="home-header-coming-soon" aria-disabled="true"><span>{fa ? 'استودیو شکل علمی' : 'Figure Studio'}</span><small>{fa ? 'به‌زودی' : 'Coming soon'}</small></span></li>
        </ul>
      </nav>
      <div className="home-header-actions">
        <a className="home-header-order" href="/design" aria-current={currentPage === 'design' ? 'page' : undefined}>{fa ? 'سفارش طراحی' : 'Request a design'}</a>
        <HomeAccountPortal locale={locale}/>
        <button type="button" className="home-header-language" onClick={() => { setOpen(false); onLocaleChange(); }} aria-label={fa ? 'Switch to English' : 'تغییر زبان به فارسی'} lang={fa ? 'en' : 'fa'}>{fa ? 'EN' : 'FA'}</button>
        <button type="button" className="home-header-toggle" ref={toggle} aria-controls="home-header-navigation" aria-expanded={open} aria-label={open ? (fa ? 'بستن منو' : 'Close menu') : (fa ? 'باز کردن منو' : 'Open menu')} onClick={() => setOpen(!open)}>
          {open ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg> : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16"/></svg>}
        </button>
      </div>
    </div>
  </header>;
}
