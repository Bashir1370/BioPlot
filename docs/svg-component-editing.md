# SVG component editing

Select any SVG asset on the Canvas, including assets published through the admin library or inserted from search. Choose **Edit SVG components / ویرایش اجزای SVG** in the floating selection toolbar.

The **Shapes & groups / شکل‌ها و گروه‌ها** panel shows numbered, translated shape names and color swatches instead of raw SVG tags or generated IDs. Nested groups can collapse; selecting a child on the canvas reveals its group in the list. Rename a selected item using the name field. This writes an accessible label while preserving the source ID and its references; names survive Apply, saving and reopening. Text content controls appear only for a selected text element.

The dedicated canvas lets you select individual components (including children of nested groups), Shift-select several, drag them, change fill/stroke, reorder or delete them, and insert rectangles, ellipses, text, or another SVG. The component list provides access to overlapping components. Use Select group, Group, and Ungroup for grouping; groups with shared opacity, masks or filters stay intact to avoid changing their composite appearance. Their children remain individually selectable.

Choose **Edit nodes** for a rectangle, polygon, polyline, line, circle, ellipse, or path. Drag the visible vertices or curve handles. Select a vertex and choose Delete node (or press Delete in the editing canvas) to remove it. A rectangle with one vertex deleted becomes a triangle. Closed paths retain at least three vertices; open paths retain two. Add node splits the next line or quadratic/cubic Bézier segment without altering the outline.

Undo/Redo inside this window operate on the draft. Apply writes one undoable change to the project; Cancel discards the draft. The published library template is unchanged. Edited SVGs use the existing document storage, migration, SVG export and PNG export paths, without a schema or database migration.

## Format boundaries

- Embedded raster images remain images; their pictured contents cannot become vector nodes.
- Text remains text and can be replaced in the text field; glyph outlines require converting text to paths in the source tool.
- Ellipses/circles convert to the standard four cubic approximation in node mode. Rounded rectangle arcs are retained.
- Arc endpoints can move, but radius/angle controls and inserting a node into an arc are not provided.
- Percentage/unit-based primitive geometry needs resolving to SVG coordinates before node conversion.
- The existing import sanitizer still rejects scripts, animations, external resources and stylesheets. Local fragment paint/clip references are now retained; external URL references remain removed. Import plain SVG with inline presentation attributes for predictable results.
- Editing component colors clears an existing whole-asset tint when Apply is used. Other appearance settings and the placement of the asset remain unchanged.

## Validation

`npm test` and `npm run build` validate the application. The node tests cover command normalization, shorthand curves, compact arc flags, node movement/deletion/insertion, compound paths, project history, serialized document recovery and SVG export.

A real-browser integration check is available:

```sh
npm install --no-save --package-lock=false @playwright/test@1.51.1
npx playwright install chromium
node scripts/check-svg-editor.mjs
```

The script starts Vite on 127.0.0.1:5173, tests nested transforms with real pointer movement, deletion, insertion, grouping, safe SVG references, and the actual Canvas upload/editor/apply/undo/cancel flow. This optional test package is not a production dependency.
