# BioPlot v3 Architecture

BioPlot v3 replaces the prototype's DOM-as-document architecture with a versioned scientific document model. The browser DOM is now a rendering surface; project data lives in structured state that can be saved, synchronized, versioned and exported independently.

## 1. Document model

`src/model.ts` defines `BioPlotDocument`, pages and typed objects (`text`, `shape`, `arrow`, `asset`, `plot`). Every project carries `schemaVersion` so future migrations can preserve old projects.

## 2. Editor engine

`src/engine.ts` owns geometry, rotation-aware selection bounds, snapping, multi-object resize/rotation and commands. The engine does not depend on React or DOM snapshots.

## 3. React + TypeScript UI

`src/EditorApp.tsx` and `src/DashboardApp.tsx` provide component-driven UI while preserving the current dashboard/editor URLs. Vite builds both `index.html` and `editor.html`.

## 4. Command history

Undo/redo records semantic commands and object state deltas instead of serializing the entire artboard HTML. This is the base for persistent history and future collaborative operations.

## 5. Persistence

`src/persistence.ts` provides:

- local browser persistence for zero-configuration use;
- a Supabase project repository;
- a resilient local/cloud strategy so temporary cloud/auth failures do not lose local work.

`supabase/schema.sql` contains the project and scientific-asset tables with RLS policies.

Environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## 6. Native export

`src/export.ts` converts the structured document directly to SVG elements (`text`, `rect`, `ellipse`, `line`, inline scientific SVG, and native plot SVG). Export no longer relies on SVG `foreignObject` wrapping HTML.

PNG export derives pixel dimensions from physical width and DPI. The current UI exposes a 160 mm / 300 DPI preset and the export function supports other values.

## 7. Scientific asset pipeline

`src/assets.ts` contains a scientific catalog with English/Persian synonyms, taxonomy, review status, premium flags, versions and editable color-slot metadata. Custom SVG ingestion strips scripts, embedded HTML, external references, event handlers and URL-based resources before storage.

## 8. Plot engine

`src/plots.ts` stores plots as data + visual specification rather than screenshots. CSV can be converted into editable bar/scatter specs and plots render to native SVG, allowing plot-to-figure workflows in the same document.

## 9. Collaboration and AI

`src/collaboration.ts` defines a collaboration interface with browser `BroadcastChannel` support and a Supabase Realtime adapter for broadcast/presence.

`src/ai.ts` defines an AI provider contract. BioPlot includes a deterministic local draft provider so the workflow remains functional without an external AI service; setting `VITE_BIOPLOT_AI_ENDPOINT` switches drafting to a remote provider that returns editable BioPlot objects.

```bash
VITE_BIOPLOT_AI_ENDPOINT=
```

## Quality gates

`.github/workflows/ci.yml` runs TypeScript checking, unit tests and a production Vite build on feature branches and pull requests. `src/engine.test.ts` covers group rotation and command-based history.

## Migration principle

The legacy `app.js`, `styles.css`, `dashboard.js` and `dashboard.css` are retained temporarily as reference during the v3 migration but are no longer loaded by the v3 HTML entry points. They can be removed after the v3 branch is validated in production.
