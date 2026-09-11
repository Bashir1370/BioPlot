# Stage 10B–D — Figure Studio Core Acceptance

## B — Professional Figure Studio Shell
- Stable top bar, compact tool rail, resizable/collapsible library and inspector regions.
- Canvas remains the visual focus and supports fit/zoom controls.
- Context toolbar changes with selection state.
- Inspector and Layers are separate tabs on the right.
- Desktop-first layout remains usable on smaller laptop widths.

## C — Core Editing Engine
- Single, Shift multi-select and drag-marquee selection.
- Move with cached snapping guides.
- Multi-object resize and common-pivot rotation.
- Group/ungroup, duplicate, delete, copy/paste.
- Lock/unlock and hide/show.
- Keyboard nudge; Shift+nudge moves in larger increments.
- Align left/center/right/top/middle/bottom.
- Horizontal and vertical distribution.
- Bring forward/backward and front/back ordering.
- Right-click context menu.
- Undo/redo for semantic editor mutations.
- Layer panel selection and reordering controls.

## D — Scientific Object System
The v4 document schema supports typed objects for:
- scientific asset (SVG)
- text
- label / panel label
- shape
- arrow
- connector
- image
- plot
- container

Every visual object shares stable transform, opacity, lock, visibility, naming, grouping, and optional parent/container metadata. Legacy v3 documents migrate into v4 without discarding their objects.

## Quality gates
- TypeScript passes.
- Unit tests cover geometry, alignment/distribution, z-order, migration and object factories.
- Production Vite build passes.
