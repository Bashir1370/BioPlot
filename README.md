# BioPlot

BioPlot is a bilingual Persian/English scientific visualization platform for creating scientific figures, data-bound plots, pathways, networks and publication-ready visual assets.

## BioPlot v3

The v3 foundation migrates BioPlot from a DOM-driven prototype to a structured scientific editor architecture:

- React + TypeScript + Vite multi-page application
- Versioned `BioPlotDocument` model with typed scientific objects
- Editor engine separated from the UI
- Rotation-aware geometry, multi-select, group resize and group rotation
- Command-based undo/redo instead of full DOM snapshots
- Smart snapping with cached drag targets
- Local persistence plus optional Supabase cloud synchronization
- Scientific SVG catalog with English/Persian synonyms and secure SVG ingestion
- Editable data-bound bar/scatter plots with CSV input
- Native SVG export without `foreignObject`
- Physical-width/DPI-aware high-resolution PNG export
- Collaboration abstraction with browser realtime fallback and Supabase Realtime support
- AI provider abstraction with a functional local editable-draft engine and optional remote endpoint
- GitHub Actions typecheck, unit tests and production build

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the implementation map.

## Deployment

Production: `https://bioplot.pages.dev`

Cloudflare Pages is connected to `main`. The existing `build.sh` automatically uses the Vite production build when `package.json` is present and outputs to `dist/`.

## Run locally

```bash
npm install
npm run dev
```

Open the dashboard at the Vite URL and use `editor.html` for the editor route.

Validation:

```bash
npm run typecheck
npm test
npm run build
```

## Optional services

Copy `.env.example` to `.env.local` when connecting cloud services:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BIOPLOT_AI_ENDPOINT=
```

Without these values BioPlot remains functional with local project persistence, browser-tab collaboration and the local editable AI drafting provider.

For Supabase, apply `supabase/schema.sql` to create the project and scientific asset tables with Row Level Security.

## Product direction

BioPlot is intended to be broader than a BioRender clone:

**Data → Plot → Figure → Graphical Abstract → Poster/Presentation → Publication**

Product areas:

- BioPlot Figures
- BioPlot Plots
- BioPlot Pathways
- BioPlot Networks
- BioPlot AI
- Publication Toolkit
- Collaboration and lab workspaces

## Migration note

The legacy `app.js`, `styles.css`, `dashboard.js`, `dashboard.css` and `project-storage.js` remain in the repository temporarily as v2 reference files. The v3 HTML entry points no longer load them. They can be removed after the v3 deployment is validated.
