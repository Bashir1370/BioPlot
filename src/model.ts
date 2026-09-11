export const DOCUMENT_SCHEMA_VERSION = 3 as const;

export type ObjectId = string;
export type BioPlotObjectType = 'text' | 'shape' | 'arrow' | 'asset' | 'plot';

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
}

export interface BaseObject extends Transform {
  id: ObjectId;
  type: BioPlotObjectType;
  name: string;
  groupId?: string;
  locked?: boolean;
  hidden?: boolean;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  color: string;
  fontSize: number;
  fontWeight: number;
  align: 'left' | 'center' | 'right';
}

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shape: 'rect' | 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
}

export interface ArrowObject extends BaseObject {
  type: 'arrow';
  stroke: string;
  strokeWidth: number;
  arrowHead: 'end' | 'both' | 'none';
}

export interface AssetColorSlot {
  key: string;
  label: string;
  value: string;
}

export interface AssetObject extends BaseObject {
  type: 'asset';
  assetId: string;
  svg: string;
  colors: AssetColorSlot[];
}

export type PlotKind = 'bar' | 'scatter';

export interface PlotSeries {
  id: string;
  name: string;
  color: string;
  values: Array<{ x: number; y: number; label?: string }>;
}

export interface PlotSpec {
  kind: PlotKind;
  title: string;
  xLabel: string;
  yLabel: string;
  series: PlotSeries[];
  showLegend: boolean;
  showGrid: boolean;
}

export interface PlotObject extends BaseObject {
  type: 'plot';
  spec: PlotSpec;
}

export type BioPlotObject = TextObject | ShapeObject | ArrowObject | AssetObject | PlotObject;

export interface BioPlotPage {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  objects: BioPlotObject[];
}

export interface BioPlotDocument {
  schemaVersion: typeof DOCUMENT_SCHEMA_VERSION;
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  activePageId: string;
  pages: BioPlotPage[];
  metadata: {
    locale: 'en' | 'fa';
    journalPreset?: string;
    tags: string[];
  };
}

export const makeId = (prefix = 'obj') =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const defaultPlotSpec = (): PlotSpec => ({
  kind: 'bar',
  title: 'Experimental result',
  xLabel: 'Condition',
  yLabel: 'Value',
  showLegend: false,
  showGrid: true,
  series: [
    {
      id: makeId('series'),
      name: 'Series 1',
      color: '#0b7a75',
      values: [
        { x: 0, y: 35, label: 'Control' },
        { x: 1, y: 68, label: 'Treatment' },
        { x: 2, y: 51, label: 'Recovery' }
      ]
    }
  ]
});

export function createBlankDocument(title = 'Untitled scientific figure'): BioPlotDocument {
  const now = new Date().toISOString();
  const pageId = makeId('page');
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    id: makeId('doc'),
    title,
    createdAt: now,
    updatedAt: now,
    activePageId: pageId,
    pages: [
      {
        id: pageId,
        name: 'Figure 1',
        width: 960,
        height: 620,
        background: '#ffffff',
        objects: [
          {
            id: makeId(),
            type: 'text',
            name: 'Figure title',
            x: 56,
            y: 42,
            width: 700,
            height: 42,
            rotation: 0,
            opacity: 1,
            text: 'Mechanism of oxaliplatin-induced peripheral neuropathy',
            color: '#17303f',
            fontSize: 24,
            fontWeight: 700,
            align: 'left'
          }
        ]
      }
    ],
    metadata: { locale: 'en', tags: [] }
  };
}

export function cloneDocument(document: BioPlotDocument): BioPlotDocument {
  return structuredClone(document);
}

export function activePage(document: BioPlotDocument): BioPlotPage {
  return document.pages.find(page => page.id === document.activePageId) ?? document.pages[0];
}

export function migrateDocument(input: unknown): BioPlotDocument {
  if (!input || typeof input !== 'object') return createBlankDocument();
  const candidate = input as Partial<BioPlotDocument>;
  if (candidate.schemaVersion === DOCUMENT_SCHEMA_VERSION && Array.isArray(candidate.pages)) {
    return candidate as BioPlotDocument;
  }
  const fresh = createBlankDocument(typeof candidate.title === 'string' ? candidate.title : undefined);
  return fresh;
}
