import { describe, expect, it } from 'vitest';
import { categoryIdForHomeTemplate, homeTemplateCategoryMap } from './scientificVisualContentModel';
import { featuredScientificVisualCategories, scientificVisualCategories } from './scientificVisualTaxonomy';

describe('scientific visual hub taxonomy', () => {
  it('keeps category ids and slugs unique', () => {
    expect(scientificVisualCategories).toHaveLength(13);
    expect(new Set(scientificVisualCategories.map(category => category.id)).size).toBe(scientificVisualCategories.length);
    expect(new Set(scientificVisualCategories.map(category => category.slug)).size).toBe(scientificVisualCategories.length);
  });

  it('defines six featured category families for the Home experience', () => {
    expect(featuredScientificVisualCategories.map(category => category.id)).toEqual([
      'molecular-mechanisms',
      'pathways-networks',
      'processes-workflows',
      'devices-bioengineering',
      'disease-therapeutics',
      'omics-systems-biology',
    ]);
  });

  it('maps every non-blank starter template to the shared taxonomy', () => {
    expect(homeTemplateCategoryMap.blank).toBeNull();
    Object.entries(homeTemplateCategoryMap)
      .filter(([templateId]) => templateId !== 'blank')
      .forEach(([templateId, categoryId]) => {
        expect(categoryId, templateId).toBeTruthy();
        expect(scientificVisualCategories.some(category => category.id === categoryId)).toBe(true);
      });
    expect(categoryIdForHomeTemplate('drug-mechanism')).toBe('molecular-mechanisms');
    expect(categoryIdForHomeTemplate('workflow')).toBe('processes-workflows');
  });
});
