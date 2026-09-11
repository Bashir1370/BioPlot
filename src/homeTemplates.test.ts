import { describe, expect, it } from 'vitest';
import { activePage } from './model';
import { createHomeTemplateDocument, homeTemplates, templateIdFromDocument } from './homeTemplates';

describe('Home scientific figure templates', () => {
  it('creates a valid structured document for every quick start', () => {
    homeTemplates.forEach(template => {
      const document = createHomeTemplateDocument(template.id, 'en');
      expect(document.schemaVersion).toBe(3);
      expect(document.metadata.locale).toBe('en');
      expect(document.metadata.tags).toContain(`template:${template.id}`);
      expect(activePage(document).objects.length).toBeGreaterThan(0);
      expect(templateIdFromDocument(document)).toBe(template.id);
    });
  });

  it('creates Persian-localized starter documents', () => {
    const document = createHomeTemplateDocument('mechanism', 'fa');
    expect(document.metadata.locale).toBe('fa');
    expect(document.title).toContain('مکانیسم');
    expect(activePage(document).objects.some(object => object.type === 'text' && /[\u0600-\u06FF]/.test(object.text))).toBe(true);
  });

  it('uses unique object ids inside every starter document', () => {
    homeTemplates.forEach(template => {
      const document = createHomeTemplateDocument(template.id, 'en');
      const ids = activePage(document).objects.map(object => object.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
