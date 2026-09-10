# BioPlot Product Roadmap

## Vision
BioPlot will become a bilingual Persian/English scientific visualization workspace that helps researchers move from raw data and scientific ideas to publication-ready figures, plots, pathways, networks, graphical abstracts, posters, and presentations in one environment.

## Core Product Promise
Data → Plot → Figure → Graphical Abstract → Poster/Presentation → Publication

Researchers should not need to jump between multiple general-purpose design and statistics tools for common scientific communication tasks.

## Primary Users
- MSc and PhD students
- Academic researchers and postdocs
- Laboratory teams
- Biomedical and life-science researchers
- Bioinformatics and systems-biology researchers
- Scientific illustrators and research communication teams
- Universities and research institutes

## Product Pillars

### 1. Scientific Figure Studio
- Drag-and-drop scientific illustration editor
- Scientific icon library
- Smart alignment and layout
- Multi-select, group, layers, resize, rotate
- Text, arrows, connectors, tables, labels
- Figure panels (A, B, C...)
- Scale bars and annotations
- High-resolution export
- Publication presets

### 2. Scientific Plot Studio
- CSV / Excel data import
- Bar, line, scatter, box, violin, histogram
- Heatmap, volcano plot, PCA, survival curves
- Error bars, confidence intervals, significance annotations
- Reusable plot themes
- Automatic style matching between figures and plots
- Later: statistical guidance and analyses

### 3. Pathway & Network Studio
- Signaling pathway builder
- Gene/protein interaction networks
- Biological node and edge types
- Automatic network layout
- Pathway templates
- Later integrations with public biological resources

### 4. Scientific Asset Library
- Curated scientific SVG library
- Search by English and Persian synonyms
- Hierarchical scientific taxonomy
- Favorites and recent assets
- Editable colors and styles
- Scientific review status
- Custom icon request pipeline

### 5. Templates
- Mechanism figures
- Graphical abstracts
- Experimental workflows
- Methods diagrams
- Posters
- Presentations
- Grant figures
- Journal-specific layouts

### 6. Publication Toolkit
- Journal figure size presets
- DPI and resolution checks
- RGB/CMYK-aware export guidance
- PDF, PNG, SVG, TIFF export roadmap
- Transparent background
- Panel labeling
- Font-size checks
- Color-blind accessibility checks
- Figure quality checklist
- Publication/license metadata

### 7. Collaboration & Project Management
- User accounts
- Cloud project storage
- Autosave
- Version history
- Share links
- Comments
- Team workspaces
- Role-based access
- Project folders and tags

### 8. BioPlot AI
- Scientific asset search assistance
- Figure draft generation
- Prompt-to-edit
- Diagram-to-editable-object conversion
- Figure quality suggestions
- Layout suggestions
- Scientific terminology assistance
- Later: paper/method text to editable figure draft

### 9. Research Communication Suite
- Graphical abstracts
- Scientific posters
- Presentation slides
- Conference visuals
- Social-media science cards
- Reformat one project into multiple outputs

### 10. Admin & Content Operations
- Admin dashboard
- Upload/manage SVG assets
- Category and synonym management
- Template builder
- Free/Premium flags
- Scientific review workflow
- Versioned asset updates
- Usage analytics

## Development Phases

### Phase 0 — Product Foundation (current)
Goal: validate product direction and editor UX.

Status:
- Cloudflare Pages deployment
- GitHub auto-deploy
- Dashboard prototype
- Editor v2
- Basic scientific library
- Multi-select / resize / rotate / group
- SVG import
- SVG/PNG export prototype

Exit criteria:
- Clear product architecture
- Stable design language
- Editor interaction model validated

### Phase 1 — Real SaaS Foundation
Goal: turn the prototype into a real application.

Build:
- React/Next-style component architecture
- Supabase authentication
- User profiles
- Project database
- Autosave
- Dashboard backed by real projects
- Project create/rename/delete/duplicate
- Persistent editor document model
- Asset storage
- Error monitoring

Exit criteria:
- User can register, create a project, edit it, close the browser, return, and continue.

### Phase 2 — Professional Figure Editor
Goal: make BioPlot competitive as a scientific figure editor.

Build:
- Robust canvas/document model
- Copy/paste and keyboard shortcuts
- Alignment/distribution
- Smart guides and snapping
- Lock/hide layers
- Frames/artboards/pages
- Tables
- Connectors
- Superscript/subscript
- Scientific labels
- Reusable styles
- Panel labels
- Export settings
- Undo/redo history persistence

Exit criteria:
- Researchers can create a publication-ready mechanism figure without external design software.

### Phase 3 — Scientific Library & Admin
Goal: make the content library a defensible asset.

Build:
- Admin panel
- SVG ingestion pipeline
- Scientific taxonomy
- Persian/English synonym search
- Review status
- Favorites
- Collections
- Custom icon requests
- 500–1,000 launch-quality assets
- 30–50 high-quality templates

Exit criteria:
- Library search feels useful for major life-science workflows.

### Phase 4 — Plot Studio
Goal: cover common research plotting workflows.

Build:
- CSV/XLSX import
- Data table
- Bar/line/scatter
- Box/violin
- Histogram
- Heatmap
- Volcano plot
- PCA
- Error bars
- Significance brackets
- Plot templates
- Shared design tokens with figure editor

Exit criteria:
- Typical biology researcher can generate common publication graphs without leaving BioPlot.

### Phase 5 — Publication Intelligence
Goal: become the safest path from visual to manuscript.

Build:
- Journal presets
- DPI/size validator
- Export presets
- TIFF/PDF support
- Accessibility checks
- Typography checks
- Panel consistency checker
- Publication-ready checklist

Exit criteria:
- BioPlot can warn users about common figure submission problems before export.

### Phase 6 — Pathways & Networks
Goal: serve molecular biology, bioinformatics, and systems biology workflows.

Build:
- Node/edge editor
- Automatic layouts
- Biological node types
- Pathway visual templates
- Network style rules
- Import common network tables

Exit criteria:
- Users can turn interaction/pathway data into an editable scientific network figure.

### Phase 7 — Collaboration
Goal: support labs and research teams.

Build:
- Shared workspaces
- Comments
- Version history
- Share links
- Permissions
- Team asset libraries
- Brand/institution presets

Exit criteria:
- A lab can collaboratively review and finish a figure inside BioPlot.

### Phase 8 — AI Scientific Visualization
Goal: reduce time from idea to first editable visual.

Build:
- Natural-language asset search
- Generate editable first draft
- Restyle/edit selected object
- Auto-layout
- Figure critique
- Manuscript paragraph → editable diagram draft

Exit criteria:
- AI accelerates the workflow while output remains editable and researcher-controlled.

### Phase 9 — Posters, Slides & Communication
Goal: expand BioPlot into a complete research communication suite.

Build:
- Poster builder
- Slide builder
- Graphical abstract workflows
- One-click resize/reformat
- Conference templates

Exit criteria:
- One scientific project can be reused across manuscript, poster, presentation, and web formats.

## Priority Rule
Every new feature must improve at least one of these:
1. Time to first usable scientific visual
2. Scientific accuracy
3. Publication readiness
4. Ease of editing
5. Reusability of research assets
6. Collaboration

## Initial Product KPIs
- Time to first completed figure
- Percentage of new users who create a project
- Percentage who export a figure
- 7-day and 30-day returning users
- Average projects per active researcher
- Search-to-asset insertion rate
- Export success rate
- Percentage of users who use templates
- Plot-to-figure combined workflow usage

## Near-term execution order
1. Stabilize current visual design
2. Migrate to a maintainable component architecture
3. Connect Supabase Auth and Projects
4. Build persistent document model
5. Upgrade Figure Editor
6. Build Admin + Scientific Library pipeline
7. Launch closed beta with Iranian researchers
8. Use beta feedback to prioritize Plot Studio

## Strategic Positioning
BioPlot should not position itself only as a BioRender clone. Its long-term differentiation should be:
- Figure design + scientific plots in one workspace
- Persian + English scientific UX
- Strong support for Iranian researchers
- Affordable local pricing
- Scientific publication checks
- Bioinformatics/pathway/network visualization
- A unified visual system across data plots and scientific illustrations
