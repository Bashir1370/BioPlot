import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const readPublic = (relativePath: string) => readFileSync(resolve(process.cwd(), 'public', relativePath), 'utf8');
const slugs = ['scientific-illustration', 'graphical-abstract', 'scientific-poster'] as const;
const images = ['scientific-signaling', 'graphical-abstract', 'conference-poster'] as const;

describe('BioPlot SEO service pages', () => {
  it('publishes distinct, static English and Persian pages with reciprocal language alternates', () => {
    for (const slug of slugs) {
      for (const lang of ['en', 'fa'] as const) {
        const path = `services/${lang}/${slug}/index.html`;
        const html = readPublic(path);
        const canonical = `https://bioplot.ir/services/${lang}/${slug}/`;
        const other = lang === 'fa' ? 'en' : 'fa';
        expect(html).toContain(`<html lang="${lang}" dir="${lang === 'fa' ? 'rtl' : 'ltr'}">`);
        expect(html).toContain(`<link rel="canonical" href="${canonical}">`);
        expect(html).toContain(`hreflang="${other}" href="https://bioplot.ir/services/${other}/${slug}/"`);
        expect(html).toContain('name="description"');
        expect(html).toContain('<h1>');
        expect(html).toContain('<script type="application/ld+json">');
        expect(html).toContain('alt="');
        expect(html).toContain('srcset="');
        expect(html).toContain('<a class="primary" href="/design?kind=');
        expect(html).not.toContain('noindex');
      }
    }
  });

  it('references real, optimized illustration assets', () => {
    for (const file of images) {
      for (const width of [480, 800, 1200]) {
        expect(existsSync(resolve(process.cwd(), 'public', 'images', 'services', `${file}-${width}.webp`))).toBe(true);
      }
    }
  });

  it('includes only the public home and service pages in the sitemap', () => {
    const xml = readPublic('sitemap.xml');
    expect(xml).toContain('<loc>https://bioplot.ir/</loc>');
    for (const slug of slugs) for (const lang of ['fa', 'en'] as const) {
      expect(xml).toContain(`<loc>https://bioplot.ir/services/${lang}/${slug}/</loc>`);
    }
    expect((xml.match(/<loc>/g) ?? []).length).toBe(7);
    expect(xml).not.toContain('/dashboard');
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/orders');
  });

  it('keeps the homepage canonical and the early SPA private-path noindex guard', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html).toContain('<link rel="canonical" href="https://bioplot.ir/"');
    expect(html).toContain("robots.content = 'noindex, nofollow'");
    expect(html).toContain("path !== '/'");
    expect(readFileSync(resolve(process.cwd(), 'templates.html'), 'utf8')).toContain('name="robots" content="noindex, nofollow"');
  });
});
