import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { HOME_TEXT_DEFAULTS, normalizeHomeContent } from './homeContent';
import { SERVICE_DEFAULT_CONTENT, SERVICE_FIELD_KEYS, SERVICE_SLUGS, mergeServicePageContent, servicePageKey } from './servicePageContent';

describe('localized service-page CMS', () => {
  it('has a complete default text for each editable section on all six pages', () => {
    expect(Object.keys(SERVICE_DEFAULT_CONTENT)).toHaveLength(6);
    for(const slug of SERVICE_SLUGS)for(const locale of ['fa','en'] as const) {
      const key=servicePageKey(slug,locale);
      const fields=mergeServicePageContent(key,null);
      for(const field of SERVICE_FIELD_KEYS) expect(typeof fields[field]).toBe('string');
      expect(fields.title.length).toBeGreaterThan(10);
      expect(fields.metaDescription.length).toBeGreaterThan(25);
    }
  });

  it('preserves changes in service pages when other Home content is saved', () => {
    const old=structuredClone(HOME_TEXT_DEFAULTS);
    const key=servicePageKey('scientific-illustration','fa');
    const edited={...SERVICE_DEFAULT_CONTENT[key],lead:'توضیح اصلاح‌شده'};
    const result=normalizeHomeContent({...old,servicePages:{[key]:edited}});
    expect(result.servicePages?.[key].lead).toBe('توضیح اصلاح‌شده');
    expect(normalizeHomeContent(result).servicePages?.[key]).toEqual(edited);
  });

  it('ignores unknown or malformed service data instead of crashing', () => {
    const key=servicePageKey('graphical-abstract','en');
    const value=mergeServicePageContent(key,{title:'Custom title',lead:42});
    expect(value.title).toBe('Custom title');
    expect(value.lead).toBe(SERVICE_DEFAULT_CONTENT[key].lead);
    expect(() => mergeServicePageContent('unknown:fa',{})).toThrow();
  });

  it('keeps raw HTML crawlable and adds shared header/footer runtime mounts', () => {
    for(const slug of SERVICE_SLUGS)for(const locale of ['fa','en'] as const) {
      const html=readFileSync(resolve(process.cwd(), 'public', 'services', locale, slug,'index.html'),'utf8');
      expect(html).toContain('<h1>');
      expect(html).toContain('<div id="service-header-root">');
      expect(html).toContain('<div id="service-footer-root">');
      expect(html).toContain('<!-- BIOPLOT_SERVICE_RUNTIME -->');
      expect(html).toContain('hreflang="');
    }
    const css=readFileSync(resolve(process.cwd(), 'public','seo-services.css'),'utf8');
    expect(css).toContain('content:"۰۱"');
    expect(css).toContain('content:"۰۲"');
    expect(css).toContain('content:"۰۳"');
  });
});
