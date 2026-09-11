# BioPlot Figure Studio — Beta Acceptance

This document defines the minimum acceptance bar before Figure Studio is labeled beta-ready.

## Core workflow

A researcher must be able to complete this path without code or data loss:

`Create → Design → Save → Close → Reopen → Edit → Quality check → Export`

## Editing

- Single select, Shift multi-select and marquee select
- Drag, 8-handle resize and rotate
- Group / ungroup, lock / unlock, hide / show
- Copy / paste / duplicate / delete
- Align and distribute
- Layer ordering including drag reorder
- Keyboard nudging and undo / redo
- Stable IDs after save / reload

## Scientific objects

- Scientific SVG assets
- Text and scientific annotations
- Panel / tag / note labels
- Shapes and containers
- Arrows and attached connectors
- Raster images
- Data plots

## Scientific text

- Font family / size / weight
- Italic / underline
- Alignment, line height and letter spacing
- Superscript / subscript Unicode notation
- Greek and scientific symbol insertion
- Multiline text

## Connectors

- Straight, elbow and curved routes
- Solid / dashed / dotted lines
- End / both / inhibition arrow heads
- Optional labels
- Attach start/end to figure objects
- Automatic object-port selection and rerendering as targets move

## Assets

- Search in English and Persian
- Scientific categories
- Favorites and recent assets
- Reviewed metadata and secure custom SVG import
- Starter pack across cell biology, neuroscience, immunology, molecular biology, cancer, microbiology, organs, animals and lab equipment

## Persistence and recovery

- IndexedDB is the primary local workspace store
- Legacy localStorage projects migrate transparently
- Supabase adapter remains compatible
- Autosave indicator reflects project saves
- Crash recovery snapshots are written locally

## Export

- Native SVG (no `foreignObject`)
- PNG at 150 / 300 / 600 DPI
- Journal-width presets in millimeters
- Transparent background
- Export whole page or selection
- Attached connectors resolve in export

## Publication checker

- Object outside artboard
- Small text
- Low text contrast
- Excess font variation
- Stroke-weight inconsistency
- Low effective raster DPI
- Empty text objects
- Missing panel-label suggestion

## QA gates

Every pull request that changes Figure Studio must pass:

1. TypeScript typecheck
2. Unit/regression tests
3. Production Vite build
4. Migration test from previous schema
5. Native SVG export regression test

Manual pre-beta matrix:

- Chrome latest: Windows/macOS
- Edge latest: Windows
- Firefox latest: Windows/macOS
- Persian RTL and English LTR
- 100, 500 and 1000 object documents
- Refresh/reopen after edits
- SVG and 300/600 DPI PNG export

## Known beta boundaries

- PDF/TIFF export is intentionally deferred until the SVG/PNG pipeline is validated in real journal workflows.
- True multi-user conflict-free editing requires a CRDT layer; current collaboration is broadcast/presence foundation, not final concurrent merge semantics.
- Scientific asset count is editorial content and can grow independently without changing the editor architecture.
