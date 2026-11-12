import type { ServiceKind } from './orders/orderModel';
import './home-order-services.css';

type Locale = 'fa' | 'en';
type Service = {
  kind: ServiceKind;
  number: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
};

const SERVICES: Service[] = [
  {
    kind: 'figure',
    number: '01',
    title: { fa: 'طراحی تصویر علمی', en: 'Scientific illustration' },
    description: {
      fa: 'مسیرهای زیستی، شماتیک آزمایش و مکانیسم‌های مولکولی',
      en: 'Biological pathways, experimental schematics and molecular mechanisms',
    },
  },
  {
    kind: 'graphical_abstract',
    number: '02',
    title: { fa: 'طراحی چکیده تصویری', en: 'Graphical abstract design' },
    description: {
      fa: 'تبدیل پیام اصلی مقاله به یک Graphical Abstract',
      en: 'Turn your paper’s core message into a graphical abstract',
    },
  },
  {
    kind: 'poster',
    number: '03',
    title: { fa: 'طراحی پوستر علمی', en: 'Scientific poster design' },
    description: {
      fa: 'پوستر کنفرانس، کنگره و ارائه دانشگاهی',
      en: 'Posters for conferences, congresses and academic presentations',
    },
  },
];

/** Original, lightweight vector artwork — no third-party image dependencies. */
function ServiceIllustration({ kind }: { kind: ServiceKind }) {
  if (kind === 'figure') return (
    <svg viewBox="0 0 360 190" fill="none" aria-hidden="true" focusable="false">
      <circle cx="171" cy="96" r="69" fill="#E7F5F1" stroke="#65AFA4" strokeWidth="2" />
      <circle cx="171" cy="96" r="29" fill="#FCFFFF" stroke="#2E968D" strokeWidth="2.5" />
      <path d="M155 89c9-19 25 23 35 4M153 103c15 20 25-22 36-3" stroke="#468BA4" strokeWidth="3" strokeLinecap="round" />
      <path d="M150 91l6-2m32 3 6 1m-41 10-6 2m40-6 6-2" stroke="#86BBC1" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="135" cy="65" rx="13" ry="7" transform="rotate(-36 135 65)" fill="#B9DDD7" stroke="#2E968D" strokeWidth="1.5" />
      <ellipse cx="209" cy="69" rx="16" ry="8" transform="rotate(42 209 69)" fill="#B9DDD7" stroke="#2E968D" strokeWidth="1.5" />
      <ellipse cx="139" cy="134" rx="15" ry="8" transform="rotate(38 139 134)" fill="#B9DDD7" stroke="#2E968D" strokeWidth="1.5" />
      <ellipse cx="212" cy="126" rx="13" ry="7" transform="rotate(-30 212 126)" fill="#B9DDD7" stroke="#2E968D" strokeWidth="1.5" />
      <circle cx="209" cy="106" r="4" fill="#7CB5CB" /><circle cx="119" cy="103" r="4" fill="#7CB5CB" /><circle cx="188" cy="142" r="3.5" fill="#7CB5CB" />
      <path d="M234 63h40l16-18h34M231 134h54l17 15h22M109 95H76l-15-18H35" stroke="#71A7AF" strokeWidth="2" strokeLinecap="round" />
      <circle cx="324" cy="45" r="7" fill="#81C7BC"/><circle cx="324" cy="149" r="7" fill="#76A6C9"/><circle cx="35" cy="77" r="7" fill="#81C7BC"/>
      <path d="M261 52h14m-7-7v14M269 146h11" stroke="#9EBFC7" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  if (kind === 'graphical_abstract') return (
    <svg viewBox="0 0 360 190" fill="none" aria-hidden="true" focusable="false">
      <rect x="27" y="43" width="90" height="106" rx="15" fill="#FFFFFF" stroke="#B4D7D2" strokeWidth="2"/>
      <rect x="135" y="43" width="90" height="106" rx="15" fill="#FFFFFF" stroke="#B4D7D2" strokeWidth="2"/>
      <rect x="243" y="43" width="90" height="106" rx="15" fill="#FFFFFF" stroke="#B4D7D2" strokeWidth="2"/>
      <circle cx="72" cy="84" r="19" fill="#E4F4F1" stroke="#6AADA5" strokeWidth="2"/>
      <path d="M63 78c2-9 15-10 18-1 3 8-6 12-9 15v4" stroke="#328E86" strokeWidth="3" strokeLinecap="round" />
      <circle cx="72" cy="102" r="2" fill="#328E86" />
      <path d="M52 120h40M61 128h22" stroke="#A9C5C5" strokeWidth="3" strokeLinecap="round" />
      <path d="M153 99l12-19 13 10 13-22 15 15" stroke="#438BA7" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="153" cy="99" r="4" fill="#8BB9CD"/><circle cx="165" cy="80" r="4" fill="#8BB9CD"/><circle cx="178" cy="90" r="4" fill="#8BB9CD"/><circle cx="191" cy="68" r="4" fill="#8BB9CD"/>
      <path d="M153 122h53M163 131h33" stroke="#A9C5C5" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="288" cy="86" r="23" fill="#E9F6EF" stroke="#75B6A0" strokeWidth="2"/>
      <path d="M278 86l8 8 16-17" stroke="#258B72" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M267 122h42M275 131h26" stroke="#A9C5C5" strokeWidth="3" strokeLinecap="round"/>
      <path d="M119 96h13m-5-5 5 5-5 5M227 96h13m-5-5 5 5-5 5" stroke="#499D98" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <svg viewBox="0 0 360 190" fill="none" aria-hidden="true" focusable="false">
      <rect x="101" y="15" width="158" height="163" rx="8" fill="#D5E9E7" opacity=".8"/>
      <rect x="95" y="10" width="158" height="163" rx="8" fill="#FFFFFF" stroke="#99C5BF" strokeWidth="2"/>
      <rect x="107" y="23" width="134" height="24" rx="3" fill="#3B9690"/>
      <rect x="118" y="31" width="72" height="3" rx="1.5" fill="#FFFFFF" opacity=".94"/>
      <rect x="118" y="39" width="101" height="2" rx="1" fill="#D8F1EB"/>
      <rect x="107" y="56" width="63" height="51" rx="3" fill="#EDF6F5"/>
      <path d="M115 90l12-14 10 8 12-20 12 15" stroke="#4499A5" strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx="127" cy="76" r="3" fill="#77B5C8"/><circle cx="149" cy="64" r="3" fill="#77B5C8"/>
      <rect x="178" y="56" width="63" height="51" rx="3" fill="#EEF7F1"/>
      <circle cx="209" cy="81" r="17" fill="#BFDCD3" stroke="#5AA69B" strokeWidth="1.5"/>
      <circle cx="209" cy="81" r="7" fill="#FFFFFF" stroke="#5AA69B" strokeWidth="1.5"/>
      <path d="M189 114h52M189 122h39M107 114h63M107 122h55" stroke="#B8CED2" strokeWidth="2.3" strokeLinecap="round"/>
      <rect x="107" y="135" width="134" height="25" rx="3" fill="#F2F7F7"/>
      <path d="M116 143h115M116 149h115M116 155h87" stroke="#C3D6D6" strokeWidth="2" strokeLinecap="round"/>
      <path d="M77 42h-19m11-7v14M278 131h24m-7-7v14" stroke="#93C3B6" strokeWidth="2" strokeLinecap="round" opacity=".9"/>
    </svg>
  );
}

export function HomeOrderServices({ locale }: { locale: Locale }) {
  const fa = locale === 'fa';

  return (
    <section className="home-order-services home-section" aria-labelledby="home-order-services-title">
      <div className="home-order-services-heading">
        <div>
          <span className="home-order-services-eyebrow">BIOPLOT DESIGN SERVICES</span>
          <h2 id="home-order-services-title">{fa ? 'چه نوع طراحی علمی نیاز دارید؟' : 'What would you like us to design?'}</h2>
          <p>{fa ? 'خدمت موردنظرتان را انتخاب کنید و درخواستتان را برای بررسی تیم طراحی بفرستید.' : 'Choose your service and send your brief to our design team for a quote.'}</p>
        </div>
      </div>

      <div className="home-order-services-grid">
        {SERVICES.map(service => (
          <article className={`home-order-service-card home-order-service-${service.kind}`} key={service.kind}>
            <div className="home-order-service-visual">
              <ServiceIllustration kind={service.kind} />
            </div>
            <div className="home-order-service-content">
              <span className="home-order-service-number">{service.number} / 03</span>
              <h3>{service.title[locale]}</h3>
              <p>{service.description[locale]}</p>
              <a className="home-order-service-cta" href={`/design?kind=${service.kind}`}>
                {fa ? 'شروع سفارش' : 'Start an order'}
                <span className="home-order-service-arrow" aria-hidden="true">{fa ? '←' : '→'}</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
