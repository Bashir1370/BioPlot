import {Phone, TelegramLogo, ArrowUpRight} from '@phosphor-icons/react';
import './home-footer.css';

export function HomeFooter({locale}: {locale: 'fa' | 'en'}) {
  const fa = locale === 'fa';
  return <footer id="home-footer" className="home-footer">
    <div className="home-footer-inner">
      <div className="home-footer-top">
        <div className="home-footer-brand">
          <a className="home-footer-logo" href="/" aria-label={fa ? 'خانه BioPlot' : 'BioPlot home'} dir="ltr">
            <span>B</span><b>ioplot</b>
          </a>
          <p>{fa ? 'ایده‌های علمی شما، به زبان تصویر' : 'Your science, beautifully illustrated'}</p>
          <span className="home-footer-description">{fa ? 'طراحی شکل‌های علمی، چکیده تصویری و پوستر همایش برای پژوهش و ارائه‌های شما' : 'Scientific illustrations, graphical abstracts and conference posters for your research and presentations'}</span>
        </div>
        <nav className="home-footer-links" aria-label={fa ? 'دسترسی سریع' : 'Quick links'}>
          <h2>{fa ? 'دسترسی سریع' : 'Explore'}</h2>
          <a href="/design">{fa ? 'سفارش طراحی' : 'Request a design'}</a>
          <a href="/#portfolio">{fa ? 'نمونه‌کارهای ما' : 'Our work'}</a>
          <a href="/#home-order-services-title">{fa ? 'خدمات طراحی' : 'Design services'}</a>
          <a href={`/services/${locale}/scientific-illustration/`}>{fa ? 'طراحی شکل علمی' : 'Scientific illustration'}</a>
          <a href={`/services/${locale}/graphical-abstract/`}>{fa ? 'گرافیکال ابسترکت' : 'Graphical abstracts'}</a>
          <a href={`/services/${locale}/scientific-poster/`}>{fa ? 'طراحی پوستر علمی' : 'Scientific posters'}</a>
        </nav>
        <div className="home-footer-contact">
          <h2>{fa ? 'با ما در ارتباط باشید' : 'Get in touch'}</h2>
          <a href="tel:+989225401373" className="home-footer-contact-link">
            <span className="home-footer-icon"><Phone size={21} aria-hidden="true"/></span>
            <span><small>{fa ? 'تماس با بیوپلات' : 'Call BioPlot'}</small><b dir="ltr">09225401373</b></span>
          </a>
          <a href="https://t.me/Bioplot" target="_blank" rel="noopener noreferrer" className="home-footer-contact-link">
            <span className="home-footer-icon"><TelegramLogo size={21} aria-hidden="true"/></span>
            <span><small>{fa ? 'تلگرام' : 'Telegram'}</small><b dir="ltr">@Bioplot</b></span>
            <ArrowUpRight size={17} className="home-footer-external" aria-hidden="true"/>
          </a>
        </div>
      </div>
      <div className="home-footer-bottom">
        <small>© {new Date().getFullYear()} BioPlot · {fa ? 'تمام حقوق محفوظ است' : 'All rights reserved'}</small>
        <button type="button" className="home-footer-analytics-settings" data-bioplot-analytics-settings>
          {fa ? 'تنظیمات آمار' : 'Analytics settings'}
        </button>
        <a href="/design">{fa ? 'برای ایدهٔ بعدی‌تان آماده‌ایم' : 'Ready for your next idea'}<span aria-hidden="true">{fa ? '←' : '→'}</span></a>
      </div>
    </div>
  </footer>;
}
