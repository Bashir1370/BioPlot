# BioPlot

BioPlot is a bilingual Persian/English scientific visualization platform for creating scientific figures, plots, pathways, networks, and publication-ready visual assets.

## BioPlot Editor v2

The current prototype now includes a substantially more capable editor interaction engine:

- Scientific asset library with search and categories
- Figure templates and design tools
- Insertable prototype plots inside the same workspace
- Drag and multi-select with Shift
- Group / ungroup selections
- Real resize handles for single and multiple selections
- Rotation handle and numeric rotation control
- Smart snap guides against the artboard center and nearby objects
- Position, size, opacity, and appearance controls
- Layer selection and forward/backward reordering
- Copy / paste, duplicate, delete, keyboard movement
- Editable text by double click or Enter
- Sanitized SVG import as scalable canvas objects
- SVG export and high-resolution PNG export
- Grid, zoom, undo/redo, and bilingual Persian/English UI

## Product direction

BioPlot is designed as a broader scientific visualization workspace rather than only a figure illustrator.

Planned product areas:

- BioPlot Figures
- BioPlot Plots
- BioPlot Pathways
- BioPlot Networks
- BioPlot AI

## Current architecture

The v2 prototype is intentionally dependency-light:

- `index.html` — editor shell and workspace structure
- `styles.css` — visual system and interaction states
- `app.js` — selection, transform, history, import/export, layers, and editor interactions

This lets us validate the editor UX before migrating the product into a component-based React frontend.

## Run locally

Serve the repository with any static web server and open `index.html` in a modern browser. A local server is recommended because PNG/SVG export loads `styles.css` during export.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Next milestones

1. Deploy a stable preview (Cloudflare Pages)
2. Migrate editor state into a component-based frontend
3. Add Supabase authentication and project persistence
4. Build the scientific asset/admin pipeline
5. Add real data import and editable scientific plots
6. Add pathways, networks, collaboration, and AI features
