export const DOCUMENT_SCHEMA_VERSION = 5 as const;

export type ObjectId = string;
export type BioPlotObjectType = 'text' | 'label' | 'shape' | 'arrow' | 'connector' | 'asset' | 'image' | 'plot' | 'container';
export type LineStyle = 'solid' | 'dashed' | 'dotted';
export type ConnectorPort = 'auto' | 'top' | 'right' | 'bottom' | 'left' | 'center';

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
  parentId?: string;
  locked?: boolean;
  hidden?: boolean;
}

export interface TextObject extends BaseObject {
  type: 'text';
  text: string;
  color: string;
  fontSize: number;
  fontWeight: number;
  fontStyle?: 'normal' | 'italic';
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textDecoration?: 'none' | 'underline';
  align: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
}

export interface LabelObject extends BaseObject {
  type: 'label';
  text: string;
  variant: 'panel' | 'tag' | 'note';
  color: string;
  background: string;
  borderColor: string;
  fontSize: number;
  fontWeight: number;
  fontFamily?: string;
  align: 'left' | 'center' | 'right';
}

export interface ShapeObject extends BaseObject {
  type: 'shape';
  shape: 'rect' | 'ellipse';
  fill: string;
  stroke: string;
  strokeWidth: number;
  lineStyle?: LineStyle;
  radius: number;
}

export interface ArrowObject extends BaseObject {
  type: 'arrow';
  stroke: string;
  strokeWidth: number;
  lineStyle?: LineStyle;
  arrowHead: 'end' | 'both' | 'none';
}

export interface ConnectorObject extends BaseObject {
  type: 'connector';
  stroke: string;
  strokeWidth: number;
  lineStyle: LineStyle;
  route: 'straight' | 'elbow' | 'curved';
  arrowHead: 'end' | 'both' | 'none' | 'inhibition';
  fromObjectId?: string;
  toObjectId?: string;
  fromPort?: ConnectorPort;
  toPort?: ConnectorPort;
  autoRoute?: boolean;
  label?: string;
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

export interface ImageObject extends BaseObject {
  type: 'image';
  src: string;
  alt?: string;
  fit: 'contain' | 'cover';
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface ContainerObject extends BaseObject {
  type: 'container';
  fill: string;
  stroke: string;
  strokeWidth: number;
  radius: number;
  padding: number;
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

export type BioPlotObject = TextObject | LabelObject | ShapeObject | ArrowObject | ConnectorObject | AssetObject | ImageObject | PlotObject | ContainerObject;

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
    lastExportDpi?: number;
    lastExportWidthMm?: number;
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
            fontStyle: 'normal',
            fontFamily: 'Inter',
            lineHeight: 1.2,
            letterSpacing: 0,
            textDecoration: 'none',
            align: 'left',
            verticalAlign: 'middle'
          }
        ]
      }
    ],
    metadata: { locale: 'en', tags: [], lastExportDpi: 300, lastExportWidthMm: 160 }
  };
}

export function cloneDocument(document: BioPlotDocument): BioPlotDocument {
  return structuredClone(document);
}

export function activePage(document: BioPlotDocument): BioPlotPage {
  return document.pages.find(page => page.id === document.activePageId) ?? document.pages[0];
}

function migrateObject(input: Record<string, unknown>): BioPlotObject | null {
  if (typeof input.id !== 'string' || typeof input.type !== 'string') return null;
  const base = {
    ...input,
    rotation: typeof input.rotation === 'number' ? input.rotation : 0,
    opacity: typeof input.opacity === 'number' ? input.opacity : 1,
    name: typeof input.name === 'string' ? input.name : input.type
  } as Record<string, unknown>;
  if (input.type === 'text') return {
    ...base,
    fontStyle: input.fontStyle === 'italic' ? 'italic' : 'normal',
    fontFamily: typeof input.fontFamily === 'string' ? input.fontFamily : 'Inter',
    lineHeight: typeof input.lineHeight === 'number' ? input.lineHeight : 1.2,
    letterSpacing: typeof input.letterSpacing === 'number' ? input.letterSpacing : 0,
    textDecoration: input.textDecoration === 'underline' ? 'underline' : 'none',
    verticalAlign: input.verticalAlign === 'top' || input.verticalAlign === 'bottom' ? input.verticalAlign : 'middle'
  } as unknown as TextObject;
  if (input.type === 'label') return {
    ...base,
    fontFamily: typeof input.fontFamily === 'string' ? input.fontFamily : 'Inter'
  } as unknown as LabelObject;
  if (input.type === 'shape') return { ...base, lineStyle: input.lineStyle ?? 'solid' } as unknown as ShapeObject;
  if (input.type === 'arrow') return { ...base, lineStyle: input.lineStyle ?? 'solid' } as unknown as ArrowObject;
  if (input.type === 'connector') return {
    ...base,
    fromPort: typeof input.fromPort === 'string' ? input.fromPort : 'auto',
    toPort: typeof input.toPort === 'string' ? input.toPort : 'auto',
    autoRoute: input.autoRoute !== false
  } as unknown as ConnectorObject;
  if (['asset','image','plot','container'].includes(input.type)) return base as unknown as BioPlotObject;
  return null;
}

export function migrateDocument(input: unknown): BioPlotDocument {
  if (!input || typeof input !== 'object') return createBlankDocument();
  const candidate = input as Record<string, unknown>;
  const pages = Array.isArray(candidate.pages) ? candidate.pages : null;
  if (!pages) return createBlankDocument(typeof candidate.title === 'string' ? candidate.title : undefined);

  if (candidate.schemaVersion === DOCUMENT_SCHEMA_VERSION) return candidate as unknown as BioPlotDocument;

  const migratedPages: BioPlotPage[] = pages.map((page, index) => {
    const source = page && typeof page === 'object' ? page as Record<string, unknown> : {};
    const objects = Array.isArray(source.objects)
      ? source.objects.map(item => item && typeof item === 'object' ? migrateObject(item as Record<string, unknown>) : null).filter((item): item is BioPlotObject => Boolean(item))
      : [];
    return {
      id: typeof source.id === 'string' ? source.id : makeId('page'),
      name: typeof source.name === 'string' ? source.name : `Figure ${index + 1}`,
      width: typeof source.width === 'number' ? source.width : 960,
      height: typeof source.height === 'number' ? source.height : 620,
      background: typeof source.background === 'string' ? source.background : '#ffffff',
      objects
    };
  });
  const now = new Date().toISOString();
  const firstPage = migratedPages[0] ?? createBlankDocument().pages[0];
  const metadata = candidate.metadata && typeof candidate.metadata === 'object' ? candidate.metadata as Record<string, unknown> : {};
  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    id: typeof candidate.id === 'string' ? candidate.id : makeId('doc'),
    title: typeof candidate.title === 'string' ? candidate.title : 'Untitled scientific figure',
    createdAt: typeof candidate.createdAt === 'string' ? candidate.createdAt : now,
    updatedAt: typeof candidate.updatedAt === 'string' ? candidate.updatedAt : now,
    ownerId: typeof candidate.ownerId === 'string' ? candidate.ownerId : undefined,
    activePageId: typeof candidate.activePageId === 'string' && migratedPages.some(page => page.id === candidate.activePageId) ? candidate.activePageId : firstPage.id,
    pages: migratedPages.length ? migratedPages : [firstPage],
    metadata: {
      locale: metadata.locale === 'fa' ? 'fa' : 'en',
      journalPreset: typeof metadata.journalPreset === 'string' ? metadata.journalPreset : undefined,
      tags: Array.isArray(metadata.tags) ? metadata.tags.filter((tag): tag is string => typeof tag === 'string') : [],
      lastExportDpi: typeof metadata.lastExportDpi === 'number' ? metadata.lastExportDpi : 300,
      lastExportWidthMm: typeof metadata.lastExportWidthMm === 'number' ? metadata.lastExportWidthMm : 160
    }
  };
}