import type { HomeTemplateId } from './homeTemplates';
import type { LocalizedText, ScientificVisualCategoryId } from './scientificVisualTaxonomy';

export type ScientificHubContentKind = 'template' | 'guide' | 'showcase';

export interface ScientificHubTaxonomyLink {
  categoryId: ScientificVisualCategoryId;
  tags: string[];
}

export interface ScientificGuideDefinition extends ScientificHubTaxonomyLink {
  kind: 'guide';
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  relatedTemplateIds: HomeTemplateId[];
  featuredOnHome: boolean;
}

export interface ScientificShowcaseTaxonomyLink extends ScientificHubTaxonomyLink {
  kind: 'showcase';
  showcaseId: string;
  relatedGuideSlugs: string[];
}

export const homeTemplateCategoryMap: Record<HomeTemplateId, ScientificVisualCategoryId | null> = {
  blank: null,
  mechanism: 'molecular-mechanisms',
  'graphical-abstract': 'graphical-abstracts',
  workflow: 'processes-workflows',
  'drug-mechanism': 'molecular-mechanisms',
  'cell-interaction': 'molecular-cellular-interactions',
  'disease-mechanism': 'disease-therapeutics',
};

export function categoryIdForHomeTemplate(templateId: HomeTemplateId) {
  return homeTemplateCategoryMap[templateId];
}
