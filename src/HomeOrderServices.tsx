import type { ServiceKind } from './orders/orderModel';
import './home-order-services.css';
import ThreeDCardDemo from './components/3d-card-demo';

type Locale = 'fa' | 'en';
type Service = {
  kind: ServiceKind;
  slug: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

const SERVICES: Service[] = [
  {
    kind: 'figure',
    slug: 'scientific-illustration',
    title: { fa: 'طراحی تصویر علمی', en: 'Scientific illustration' },
    description: {
      fa: 'مسیرهای زیستی، شماتیک آزمایش و مکانیسم‌های مولکولی',
      en: 'Biological pathways, experimental schematics and molecular mechanisms',
    },
  },
  {
    kind: 'graphical_abstract',
    slug: 'graphical-abstract',
    title: { fa: 'طراحی چکیده تصویری', en: 'Graphical abstract design' },
    description: {
      fa: 'تبدیل پیام اصلی مقاله به یک Graphical Abstract',
      en: 'Turn your paper’s core message into a graphical abstract',
    },
  },
  {
    kind: 'poster',
    slug: 'scientific-poster',
    title: { fa: 'طراحی پوستر علمی', en: 'Scientific poster design' },
    description: {
      fa: 'پوستر کنفرانس، کنگره و ارائه دانشگاهی',
      en: 'Posters for conferences, congresses and academic presentations',
    },
  },
];

/** Supplied scientific artwork and lightweight service illustrations. */
function ServiceIllustration({ kind, locale }: { kind: ServiceKind; locale: Locale }) {
  if (kind === 'figure') return (
    <img className="service-scientific-image" src="/images/services/scientific-signaling-original.jpg" srcSet="/images/services/scientific-signaling-480.webp 480w, /images/services/scientific-signaling-800.webp 800w, /images/services/scientific-signaling-1200.webp 1200w" sizes="(max-width: 640px) 92vw, (max-width: 1100px) 48vw, 588px"
      width="2048" height="1529" loading="lazy" decoding="async"
      alt={locale === 'fa' ? 'نمونه طراحی مسیر سیگنال‌دهی سلولی و اتوفاژی' : 'Scientific illustration of cellular signaling and autophagy'}/>
  );

  if (kind === 'graphical_abstract') return (
    <img className="service-scientific-image" src="/images/services/graphical-abstract-original.jpg" srcSet="/images/services/graphical-abstract-480.webp 480w, /images/services/graphical-abstract-800.webp 800w, /images/services/graphical-abstract-1200.webp 1200w" sizes="(max-width: 640px) 92vw, (max-width: 1100px) 48vw, 588px"
      width="2048" height="1529" loading="lazy" decoding="async"
      alt={locale === 'fa' ? 'نمونه گرافیکال ابسترکت با نمایش اپی‌تلیوم روده و رگ خونی' : 'Graphical abstract showing intestinal epithelium and a blood vessel'}/>
  );

  return (
    <img className="service-scientific-image" src="/images/services/conference-poster-original.jpg" srcSet="/images/services/conference-poster-480.webp 480w, /images/services/conference-poster-800.webp 800w, /images/services/conference-poster-1200.webp 1200w" sizes="(max-width: 640px) 92vw, (max-width: 1100px) 48vw, 588px"
      width="2048" height="1529" loading="lazy" decoding="async"
      alt={locale === 'fa' ? 'نمونه پوستر علمی همایش با نمودارها و نتایج پژوهش' : 'Scientific conference poster with research charts and results'}/>
  );
}

export function HomeOrderServices({ locale }: { locale: Locale }) {
  const fa = locale === 'fa';

  return (
    <section className="home-order-services home-section" aria-labelledby="home-order-services-title">
      <div className="home-order-services-heading">
        <div>
          <h2 id="home-order-services-title">{fa ? 'چه نوع طراحی علمی نیاز دارید؟' : 'What would you like us to design?'}</h2>
          <p>{fa ? 'خدمت موردنظرتان را انتخاب کنید و درخواستتان را برای بررسی تیم طراحی بفرستید.' : 'Choose your service and send your brief to our design team for a quote.'}</p>
        </div>
      </div>

      <div className="home-order-services-grid">
        {SERVICES.map(service => (
          <ThreeDCardDemo key={service.kind}
            title={service.title[locale]} description={service.description[locale]}
            visual={<ServiceIllustration kind={service.kind} locale={locale}/>}
            href={`/design?kind=${service.kind}`} learnMoreHref={`/services/${locale}/${service.slug}/`} learnMoreLabel={fa ? "آشنایی با خدمت" : "Learn more"} cta={fa ? 'شروع سفارش' : 'Start an order'} rtl={fa}/>
        ))}
      </div>
    </section>
  );
}
