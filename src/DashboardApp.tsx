import {HomeHero} from './HomeHero';
import {HomeOrderServices} from './HomeOrderServices';
import { useEffect, useState } from 'react';
import './precision-studio.css';
import './home.css';
// Keep the horizontal navigation overrides after the legacy Home styles in
// the same lazy-loaded route chunk, rather than the earlier global bundle.
import './home-top-nav.css';
import { HomeHeader } from './HomeHeader';

type Locale = 'en' | 'fa';
export function DashboardApp() {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('bioplot-lang') === 'fa' ? 'fa' : 'en');
  const fa = locale === 'fa';

  useEffect(() => {
    document.documentElement.dir = fa ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
    localStorage.setItem('bioplot-lang', locale);
  }, [locale, fa]);


  return <div className="home-shell" dir={fa ? 'rtl' : 'ltr'} lang={locale}>
    <HomeHeader locale={locale} onLocaleChange={() => setLocale(fa ? 'en' : 'fa')}/>

    <main className="home-main">
      <div className="home-content">

        <HomeHero locale={locale}/>
        <HomeOrderServices locale={locale}/>


      </div>
    </main>

  </div>;
}
