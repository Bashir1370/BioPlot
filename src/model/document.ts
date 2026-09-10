export const BIOPLOT_SCHEMA_VERSION = 1 as const

export type BioPlotSchemaVersion =
  typeof BIOPLOT_SCHEMA_VERSION

export type ObjectId = string
export type PageId = string

export type BioPlotLocale = 'en' | 'fa'
export type BioPlotUnit = 'px'

export interface Point {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Transform extends Point, Size {
  rotation: number
  flipX: boolean
  flipY: boolean
}

export interface StrokeStyle {
  color: string
  width: number
  dash: number[]
  lineCap: 'butt' | 'round' | 'square'
  lineJoin: 'miter' | 'round' | 'bevel'
}

export interface BaseObject {
  id: ObjectId

  pageId: PageId

  /**
   * null means the object is directly on the page.
   * Otherwise it belongs to a group.
   */
  parentId: ObjectId | null

  name: string

  transform: Transform

  opacity: number

  visible: boolean
  locked: boolean
}

/*
|--------------------------------------------------------------------------
| Scientific assets
|--------------------------------------------------------------------------
*/

export interface LibraryAssetSource {
  kind: 'library'

  /**
   * Stable ID from the BioPlot scientific
   * asset library.
   */
  assetId: string

  /**
   * The exact asset version used in the figure.
   */
  version: number
}

export interface EmbeddedSvgSource {
  kind: 'embedded-svg'

  /**
   * Used temporarily for user-imported SVG files.
   *
   * Later this will be sanitized and moved into
   * the BioPlot asset/storage pipeline.
   */
  svg: string

  originalFileName?: string
}

export type ScientificAssetSource =
  | LibraryAssetSource
  | EmbeddedSvgSource

export interface ScientificAssetObject
  extends BaseObject {
  type: 'scientific-asset'

  source: ScientificAssetSource

  preserveAspectRatio: boolean

  /**
   * Semantic asset colors.
   *
   * Example:
   * {
   *   membrane: "#...",
   *   nucleus: "#...",
   *   outline: "#..."
   * }
   */
  palette: Record<string, string>
}

/*
|--------------------------------------------------------------------------
| Text
|--------------------------------------------------------------------------
*/

export interface TextObject extends BaseObject {
  type: 'text'

  text: string

  style: {
    fontFamily: string
    fontSize: number
    fontWeight: number

    fontStyle: 'normal' | 'italic'

    textAlign:
      | 'left'
      | 'center'
      | 'right'

    verticalAlign:
      | 'top'
      | 'middle'
      | 'bottom'

    color: string

    lineHeight: number
    letterSpacing: number
  }
}

/*
|--------------------------------------------------------------------------
| Shapes
|--------------------------------------------------------------------------
*/

export interface ShapeObject extends BaseObject {
  type: 'shape'

  shape:
    | 'rectangle'
    | 'rounded-rectangle'
    | 'ellipse'

  fill: string

  stroke: StrokeStyle

  cornerRadius: number
}

/*
|--------------------------------------------------------------------------
| Connectors
|--------------------------------------------------------------------------
*/

export type ConnectorAnchor =
  | 'center'
  | 'top'
  | 'right'
  | 'bottom'
  | 'left'
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left'

export type ConnectorEndpoint =
  | {
      kind: 'point'
      point: Point
    }
  | {
      kind: 'object'
      objectId: ObjectId
      anchor: ConnectorAnchor
    }

export interface ConnectorObject
  extends BaseObject {
  type: 'connector'

  start: ConnectorEndpoint
  end: ConnectorEndpoint

  routing:
    | 'straight'
    | 'elbow'
    | 'curved'

  stroke: StrokeStyle

  startMarker:
    | 'none'
    | 'arrow'
    | 'circle'
    | 'bar'

  endMarker:
    | 'none'
    | 'arrow'
    | 'circle'
    | 'bar'
}

/*
|--------------------------------------------------------------------------
| Images
|--------------------------------------------------------------------------
*/

export interface ImageObject extends BaseObject {
  type: 'image'

  source: {
    kind: 'storage' | 'external'
    value: string
  }

  alt: string

  preserveAspectRatio: boolean
}

/*
|--------------------------------------------------------------------------
| Groups
|--------------------------------------------------------------------------
*/

export interface GroupObject extends BaseObject {
  type: 'group'

  childIds: ObjectId[]
}

/*
|--------------------------------------------------------------------------
| Scientific plots
|--------------------------------------------------------------------------
*/

export interface PlotObject extends BaseObject {
  type: 'plot'

  plotType:
    | 'bar'
    | 'scatter'
    | 'volcano'
    | 'pca'
    | 'custom'

  /**
   * Later this will point to a BioPlot dataset.
   */
  dataSourceId: string | null

  /**
   * Plot-specific configuration.
   *
   * We keep it generic for schema v1 so the
   * figure engine does not depend on a specific
   * chart library.
   */
  config: Record<string, unknown>
}

/*
|--------------------------------------------------------------------------
| Complete scene object union
|--------------------------------------------------------------------------
*/

export type SceneObject =
  | ScientificAssetObject
  | TextObject
  | ShapeObject
  | ConnectorObject
  | ImageObject
  | GroupObject
  | PlotObject

/*
|--------------------------------------------------------------------------
| Page
|--------------------------------------------------------------------------
*/

export interface BioPlotPage {
  id: PageId

  name: string

  unit: BioPlotUnit

  width: number
  height: number

  background: string

  /**
   * Root objects in visual stacking order.
   *
   * First item = back
   * Last item = front
   */
  rootObjectIds: ObjectId[]
}

/*
|--------------------------------------------------------------------------
| BioPlot Document
|--------------------------------------------------------------------------
*/

export interface BioPlotDocument {
  schemaVersion: BioPlotSchemaVersion

  id: string

  title: string

  locale: BioPlotLocale

  createdAt: string
  updatedAt: string

  pages: BioPlotPage[]

  /**
   * Canonical object database.
   *
   * DOM elements must never become the
   * source of truth again.
   */
  objects: Record<ObjectId, SceneObject>

  metadata: {
    description: string
    tags: string[]
  }
}

/*
|--------------------------------------------------------------------------
| Document factory
|--------------------------------------------------------------------------
*/

export function createEmptyBioPlotDocument(
  params: {
    id: string
    title?: string
    locale?: BioPlotLocale
  },
): BioPlotDocument {
  const now = new Date().toISOString()

  const pageId = 'page-1'

  return {
    schemaVersion: BIOPLOT_SCHEMA_VERSION,

    id: params.id,

    title:
      params.title?.trim() ||
      'Untitled scientific figure',

    locale: params.locale ?? 'en',

    createdAt: now,
    updatedAt: now,

    pages: [
      {
        id: pageId,

        name: 'Page 1',

        unit: 'px',

        width: 960,
        height: 620,

        background: '#ffffff',

        rootObjectIds: [],
      },
    ],

    objects: {},

    metadata: {
      description: '',
      tags: [],
    },
  }
}

/*
|--------------------------------------------------------------------------
| Minimal runtime validation
|--------------------------------------------------------------------------
|
| This is intentionally small for now.
|
| Later we will replace this with proper versioned
| schema validation and document migrations.
|--------------------------------------------------------------------------
*/

export function isBioPlotDocument(
  value: unknown,
): value is BioPlotDocument {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate =
    value as Partial<BioPlotDocument>

  return (
    candidate.schemaVersion ===
      BIOPLOT_SCHEMA_VERSION &&
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    Array.isArray(candidate.pages) &&
    !!candidate.objects &&
    typeof candidate.objects === 'object'
  )
}
