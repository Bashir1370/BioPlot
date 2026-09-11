import { describe, expect, it } from 'vitest';
import { containsPersianScript, fontStackForText, SCIENTIFIC_FONTS } from './typography';

describe('Persian scientific typography', () => {
  it('detects Persian script and prefers B Nazanin over default Latin fonts', () => {
    expect(containsPersianScript('عنوان شکل علمی')).toBe(true);
    expect(fontStackForText('عنوان شکل علمی', 'Inter')).toContain('B Nazanin');
  });

  it('keeps Latin scientific text on the requested Latin font', () => {
    expect(containsPersianScript('TRPV1 activation')).toBe(false);
    expect(fontStackForText('TRPV1 activation', 'Inter')).toMatch(/^Inter/);
  });

  it('exposes B Nazanin in the scientific font picker', () => {
    expect(SCIENTIFIC_FONTS).toContain('B Nazanin');
  });
});
