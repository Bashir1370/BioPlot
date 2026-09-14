import { describe, expect, it } from 'vitest';
import { ScientificVisualHubHomePortal } from './ScientificVisualHubHome';
import { featuredScientificVisualCategories } from './scientificVisualTaxonomy';

describe('Scientific Visual Hub Home integration', () => {
  it('exports the Home portal component', () => {
    expect(typeof ScientificVisualHubHomePortal).toBe('function');
  });

  it('keeps exactly six featured categories on Home', () => {
    expect(featuredScientificVisualCategories).toHaveLength(6);
  });
});
