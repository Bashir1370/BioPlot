import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const source = readFileSync('public/bioplot-analytics.js', 'utf8');
const pathSet = [
  'index.html',
  'public/services/fa/scientific-illustration/index.html',
  'public/services/en/scientific-illustration/index.html',
  'public/services/fa/graphical-abstract/index.html',
  'public/services/en/graphical-abstract/index.html',
  'public/services/fa/scientific-poster/index.html',
  'public/services/en/scientific-poster/index.html',
];

function init(url: string, preference: string | null = null) {
  const dom = new JSDOM('<!doctype html><html lang="fa"><head><title>BioPlot</title></head><body></body></html>', {
    url, runScripts: 'outside-only',
  });
  if (preference) dom.window.localStorage.setItem('bioplot.analytics.consent.v1', preference);
  dom.window.eval(source);
  dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
  return dom;
}

function events(dom: JSDOM) {
  const data = (dom.window as unknown as { dataLayer?: IArguments[] }).dataLayer ?? [];
  return data.map(args => Array.from(args));
}

describe('BioPlot consent-first GA4 integration', () => {
  it('includes the same locally hosted consent script on all 7 public entries', () => {
    for (const path of pathSet) {
      const html = readFileSync(path, 'utf8');
      expect(html).toContain('<script defer src="/bioplot-analytics.js"></script>');
    }
    expect(readFileSync('src/orders/OrdersPage.tsx', 'utf8')).toContain(
      "window.dispatchEvent(new Event('bioplot:order-created'))",
    );
  });

  it('does not load or send analytics without consent, even on production', () => {
    const dom = init('https://bioplot.ir/services/fa/scientific-illustration/');
    try {
      expect(dom.window.document.getElementById('bioplot-analytics-consent')).not.toBeNull();
      expect(dom.window.document.querySelector('script[src*="googletagmanager"]')).toBeNull();
      expect(events(dom)).toHaveLength(0);
      dom.window.document.querySelector<HTMLButtonElement>('.bioplot-analytics-actions button:last-child')?.click();
      expect(dom.window.document.querySelector('script[src*="googletagmanager"]')).toBeNull();
      expect(events(dom)).toHaveLength(0);
      expect(dom.window.localStorage.getItem('bioplot.analytics.consent.v1')).toBe('declined');
    } finally { dom.window.close(); }
  });

  it('loads GA4 once and records sanitized page and order events after consent', () => {
    const dom = init('https://bioplot.ir/design?kind=figure&email=private@example.com');
    try {
      dom.window.document.querySelector<HTMLButtonElement>('.bioplot-analytics-accept')?.click();
      expect(dom.window.document.querySelectorAll('script[src*="googletagmanager"]')).toHaveLength(1);
      dom.window.dispatchEvent(new dom.window.Event('bioplot:order-created'));
      const all = events(dom);
      expect(all.filter(item => item[0] === 'event' && item[1] === 'page_view')).toHaveLength(1);
      const lead = all.find(item => item[0] === 'event' && item[1] === 'generate_lead');
      expect(lead?.[2]).toMatchObject({
        lead_source: 'design_request',
        page_location: 'https://bioplot.ir/design/',
      });
      expect(JSON.stringify(all)).not.toContain('private@example.com');
    } finally { dom.window.close(); }
  });

  it('does not pollute production analytics from staging', () => {
    const dom = init('https://staging.bioplot.ir/services/en/scientific-poster/', 'accepted');
    try {
      expect(dom.window.document.querySelector('script[src*="googletagmanager"]')).toBeNull();
      expect(events(dom)).toHaveLength(0);
    } finally { dom.window.close(); }
  });


  it('shows a footer settings link rather than a floating button on every public service page', () => {
    const sharedFooter = readFileSync('src/HomeFooter.tsx', 'utf8');
    expect(sharedFooter).toContain('data-bioplot-analytics-settings');
    expect(sharedFooter).toContain('تنظیمات آمار');
    expect(sharedFooter).toContain('Analytics settings');
    const css = readFileSync('src/home-footer.css', 'utf8');
    expect(css).toContain('.bioplot-analytics-enabled .home-footer-analytics-settings');
    expect(readFileSync('public/bioplot-analytics.css', 'utf8')).not.toContain('.bioplot-analytics-settings{position:fixed');
    for (const path of pathSet.slice(1)) {
      const html = readFileSync(path, 'utf8');
      expect(html).toContain('data-bioplot-analytics-settings');
      expect(html).toContain('home-footer-analytics-settings');
    }
    const dom = init('https://staging.bioplot.ir/services/fa/scientific-illustration/', 'declined');
    try {
      expect(dom.window.document.querySelector('.bioplot-analytics-settings')).toBeNull();
      expect(dom.window.document.documentElement.classList.contains('bioplot-analytics-enabled')).toBe(true);
      expect(dom.window.document.getElementById('bioplot-analytics-consent')).toBeNull();
      const footer = dom.window.document.createElement('footer');
      footer.innerHTML = '<button type="button" data-bioplot-analytics-settings>تنظیمات آمار</button>';
      dom.window.document.body.appendChild(footer);
      footer.querySelector('button')?.click();
      expect(dom.window.document.getElementById('bioplot-analytics-consent')).not.toBeNull();
      footer.innerHTML = '<button type="button" data-bioplot-analytics-settings>تنظیمات آمار</button>';
      dom.window.document.getElementById('bioplot-analytics-consent')?.remove();
      footer.querySelector('button')?.click();
      expect(dom.window.document.getElementById('bioplot-analytics-consent')).not.toBeNull();
      expect(dom.window.document.querySelector('script[src*="googletagmanager"]')).toBeNull();
    } finally { dom.window.close(); }
  });

  it('does not load a tag on private account and admin routes', () => {
    const dom = init('https://bioplot.ir/account?next=orders', 'accepted');
    try {
      expect(dom.window.document.querySelector('script[src*="googletagmanager"]')).toBeNull();
      expect(events(dom)).toHaveLength(0);
    } finally { dom.window.close(); }
  });
});
