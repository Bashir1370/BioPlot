# Home Product Pass — Stage 10A

This stage intentionally narrows BioPlot to one product path: **Home → Scientific Figure Studio**.

## Product goals

- Make Scientific Figure the primary action on Home.
- Give new users a clear first-run path without exposing unfinished product areas.
- Make existing work easy to find, resume and manage.
- Keep Home connected to the structured v3 document architecture rather than mock cards.
- Preserve Persian/English parity and responsive behavior.

## Implemented experience

### Hero and navigation

- Figure Studio-first positioning and primary CTA.
- Secondary template CTA and continue-last-project action.
- Compact product trust indicators for vector export, structured save and bilingual support.
- Focused sidebar navigation and Stage 10 product-focus status.

### Quick start

Four real document starters are available:

1. Blank scientific figure
2. Biological mechanism
3. Graphical abstract
4. Experimental workflow

Each starter creates a valid versioned `BioPlotDocument` and opens directly in the editor.

### Real project cards

- Cards use SVG thumbnails rendered from the actual project document.
- Relative edited time and object count are shown.
- Template/project type is surfaced.
- Open, rename, duplicate and delete actions are available from a project menu.
- A dedicated empty state is shown for a new workspace.

### Search

The global search finds both project titles and figure templates. `Ctrl/Cmd + K` focuses search.

### States

- Loading skeletons
- Project-load error recovery
- Empty workspace state
- Search no-results state
- Rename and delete dialogs
- Success toasts

### Responsive and bilingual behavior

The Home layout has explicit desktop, compact-desktop, tablet and mobile breakpoints. RTL layout uses the same component tree and flips directional affordances without duplicating the UI.

## Quality gate

Stage 10A is accepted only when GitHub Actions passes:

- TypeScript typecheck
- Unit tests, including structured quick-start document tests
- Production Vite build

## Next stage

**Stage 10B — Professional Figure Studio Shell**

The next work should focus on the editor shell and interaction hierarchy before expanding the editing engine: tool rail, asset library, canvas workspace, contextual toolbar, inspector, layers, zoom/navigation and panel behavior.
