/* BioPlot GA4: consent-first measurement without customer/order identifiers.
 * Staging displays the consent UI but does not send data to production GA4.
 */
(function () {
  'use strict';

  var GA_ID = 'G-9W5D9P3J5P';
  var CONSENT_KEY = 'bioplot.analytics.consent.v1';
  var production = location.hostname === 'bioplot.ir' || location.hostname === 'www.bioplot.ir';
  var staging = location.hostname === 'staging.bioplot.ir';
  if (!production && !staging) return;

  var pathname = location.pathname.replace(/\/+$/, '') || '/';
  var isService = /^\/services\/(fa|en)\/(scientific-illustration|graphical-abstract|scientific-poster)$/.test(pathname);
  var isOrderPage = pathname === '/design' || pathname === '/orders';
  if (pathname !== '/' && !isService && !isOrderPage) return;

  function language() {
    try {
      var stored = localStorage.getItem('bioplot-lang');
      if (stored === 'fa' || stored === 'en') return stored;
    } catch (_) {}
    return document.documentElement.lang === 'fa' ? 'fa' : 'en';
  }
  var fa = language() === 'fa';
  var words = fa ? {
    title: 'آمار بازدید BioPlot',
    body: 'با موافقت شما، از Google Analytics و کوکی‌های آماری برای شناخت بازدید صفحات و بهبود خدمات استفاده می‌کنیم. اطلاعات سفارش، پیام‌ها و مشخصات شخصی را ارسال نمی‌کنیم.',
    accept: 'موافقم', reject: 'موافق نیستم', settings: 'تنظیمات آمار',
    privacy: 'اطلاعات حریم خصوصی',
    preview: 'این نسخه آزمایشی است و داده‌ای به Google Analytics ارسال نمی‌شود.'
  } : {
    title: 'BioPlot visitor analytics',
    body: 'With your permission, Google Analytics uses analytics cookies to help us understand page visits and improve our services. We do not send order details, messages or personal information.',
    accept: 'Accept', reject: 'Decline', settings: 'Analytics settings',
    privacy: 'Privacy information',
    preview: 'This is a staging preview. No data is sent to Google Analytics.'
  };

  function getConsent() {
    try {
      var value = localStorage.getItem(CONSENT_KEY);
      return value === 'accepted' || value === 'declined' ? value : null;
    } catch (_) { return null; }
  }
  var consent = getConsent();
  var loaded = false;

  function safeLocation() {
    return location.origin + pathname + (pathname === '/' ? '' : '/');
  }
  function safeReferrer() {
    try { return document.referrer ? new URL(document.referrer).origin + '/' : undefined; }
    catch (_) { return undefined; }
  }
  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }
  function send(name, params) {
    if (!production || !loaded || consent !== 'accepted') return;
    var payload = Object.assign({
      send_to: GA_ID,
      page_location: safeLocation(),
      page_referrer: safeReferrer()
    }, params || {});
    gtag('event', name, payload);
  }

  function enable() {
    if (!production || consent !== 'accepted' || loaded) return;
    loaded = true;
    window['ga-disable-' + GA_ID] = false;
    gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    });
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    // Disable automatic pageviews; page URLs and referrers are sanitized below.
    gtag('config', GA_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: safeLocation(),
      page_referrer: safeReferrer()
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_ID);
    document.head.appendChild(script);
    send('page_view', { page_title: isService ? document.title : 'BioPlot' });
  }

  function forgetGaCookies() {
    document.cookie.split(';').forEach(function (item) {
      var name = item.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      var opts = '; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
      document.cookie = name + '=' + opts;
      document.cookie = name + '=' + opts + '; domain=.bioplot.ir';
    });
  }
  function decide(answer) {
    consent = answer;
    try { localStorage.setItem(CONSENT_KEY, answer); } catch (_) {}
    var banner = document.getElementById('bioplot-analytics-consent');
    if (banner) banner.remove();
    if (answer === 'accepted') {
      enable();
    } else if (loaded) {
      // Stop any loaded GA tag after withdrawal; a reload unloads it completely.
      window['ga-disable-' + GA_ID] = true;
      gtag('consent', 'update', { analytics_storage: 'denied' });
      forgetGaCookies();
      location.reload();
    }
  }
  function createNode(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }
  function showChoices() {
    if (document.getElementById('bioplot-analytics-consent')) return;
    var panel = createNode('section', 'bioplot-analytics-consent');
    panel.id = 'bioplot-analytics-consent';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-label', words.title);
    panel.setAttribute('dir', fa ? 'rtl' : 'ltr');
    panel.appendChild(createNode('strong', '', words.title));
    panel.appendChild(createNode('p', '', words.body));
    if (staging) panel.appendChild(createNode('p', 'bioplot-analytics-preview', words.preview));
    var help = createNode('a', '', words.privacy);
    help.href = 'https://policies.google.com/privacy';
    help.target = '_blank';
    help.rel = 'noopener noreferrer';
    panel.appendChild(help);
    var row = createNode('div', 'bioplot-analytics-actions');
    var accept = createNode('button', 'bioplot-analytics-accept', words.accept);
    var reject = createNode('button', '', words.reject);
    accept.type = reject.type = 'button';
    accept.addEventListener('click', function () { decide('accepted'); });
    reject.addEventListener('click', function () { decide('declined'); });
    row.appendChild(accept);
    row.appendChild(reject);
    panel.appendChild(row);
    document.body.appendChild(panel);
  }
  function addControls() {
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/bioplot-analytics.css';
    document.head.appendChild(css);
    // The Footer is rendered asynchronously by React on Home and service pages.
    // Reveal its built-in preference link without inserting a floating button.
    // Event delegation survives replacement of the static service-page fallback.
    document.documentElement.classList.add('bioplot-analytics-enabled');
    if (!consent) showChoices();
  }
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    if (!target.closest('[data-bioplot-analytics-settings]')) return;
    event.preventDefault();
    showChoices();
  });

  // Only event names and controlled service types can be submitted: no IDs, emails,
  // free-form text, filenames, billing data or account/profile properties.
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var link = target.closest('a[href]');
    if (!link) return;
    var next;
    try { next = new URL(link.href, location.href); }
    catch (_) { return; }
    if (next.origin !== location.origin) return;
    if (next.pathname !== '/design' && !(next.pathname === '/orders' && next.searchParams.get('new') === '1')) return;
    var kind = next.searchParams.get('kind');
    if (kind !== 'figure' && kind !== 'graphical_abstract' && kind !== 'poster') kind = 'unspecified';
    send('order_cta_click', { service_type: kind });
  });
  window.addEventListener('bioplot:order-created', function () {
    send('generate_lead', { lead_source: 'design_request' });
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addControls, { once: true });
  } else {
    addControls();
  }
  if (consent === 'accepted') enable();
})();
