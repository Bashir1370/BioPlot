# BioPlot Scientific Vector QA and Falcon Pilot

**Baseline:** BSSV 1.0.0 — see [Visual Standard](./VISUAL_STYLE_GUIDE.md) and [design tokens](./style-tokens.json).  
**Purpose:** repeatable production gate for sellable SVG assets and eventual BioPlot Studio integration.

## A. Production checklist (copy for each new asset)

### 1 — Scientific specification
- [ ] Official scientific/common name and bilingual searchable terms recorded.
- [ ] Instrument/biological reference used for correct geometry (including critical dimensions where relevant).
- [ ] No invented anatomy, graduations, molecule connectivity or unsupported labels.
- [ ] Illustrative simplifications explicitly documented.

### 2 — Visual identity
- [ ] Soft-volume 2.5D; no flat-icon or photorealistic drift.
- [ ] Camera / perspective appropriate and consistent with neighboring assets.
- [ ] Diffuse upper-left light; right-lower form shade; highlights restrained.
- [ ] Stroke scale appropriate for 512 viewBox; contour muted and not pure black.
- [ ] Balanced color saturation; material treatment appropriate.
- [ ] Transparent canvas, optical centering and >= 8% safety margin where feasible.
- [ ] Recognizable at 128 px; no essential information in microtext.

### 3 — True SVG and editable structure
- [ ] All sellable artwork consists of native SVG shapes/paths/gradients, not raster pasted inside SVG.
- [ ] Semantic region IDs are stable and unique.
- [ ] Cap/liquid/label or asset-specific editable parts independently grouped.
- [ ] Highlights and shadows separately named, not inadvertently recolored.
- [ ] No external assets, scripts, stylesheet tags, animations, foreignObject or remote fonts.
- [ ] Local gradients/clips/refs remain intact after sanitization.
- [ ] No unrelated material shares a customer-facing slot's literal hex color.
- [ ] Filename, category, version and source/preview metadata present.

### 4 — BioPlot studio compatibility
- [ ] Upload the app-ready SVG into an admin draft (do not publish by accident).
- [ ] SVG displays correctly in library, editor and component-editing canvas.
- [ ] Change an editable component color; verify no unintended colors elsewhere change.
- [ ] Select groups and child paths, apply/cancel, undo/redo.
- [ ] Save the project and reopen it; check retained edits and labels.
- [ ] Export SVG and PNG and compare to master (no clipping, missing shapes, shifted shadows).
- [ ] White and gray background tests at 64/128/256/512 px.
- [ ] Review final file size and any sanitizer removal.
- [ ] Keep an untouched source master for recovery.

**Important:** Today, color slots are literal-hex based and not multi-stop material-aware. A design which needs coordinated gradient editing must be flagged `requires-region-recolor-v2` and is **not** represented as fully supported in customer-facing copy.

## B. Pilot production: 50 mL conical centrifuge tube

1. Create one generically shaped reference tube: cap closed, empty, upright, near-orthographic 3/4.
2. Confirm silhouette: tube opening / collar / straight wall / taper / conical tip, cap ridges, plausible relative proportions.
3. Design 512 viewBox; soft translucent body; blue cap; gentle left highlight; subdued contour.
4. Build independent `bp-body`, `bp-cap`, `bp-liquid`, `bp-label`, `bp-graduations`, `bp-highlights`, `bp-shadows`, `bp-outline` groups (omit visually nonexistent components only if documented).
5. Produce source and sanitized-compatible SVG. Validate Inkscape and BioPlot editor import.
6. Test basic cap recolor using current literal color slot; then identify whether gradient steps need next-generation region recoloring.
7. Review with a second reference asset for visual consistency before approving new variants.
8. Only after the master passes, make empty / half-filled / filled and cap-open states.
9. Archive source, app-ready SVG, PNG preview, QA record and versioned metadata. Do not advertise features that failed the round-trip test.

## C. Approval record (fill in per asset)

| Field | Value |
|---|---|
| Asset ID | |
| Style guide version | 1.0.0 |
| Source reference / scientific reviewer | |
| Designer / visual reviewer | |
| SVG / editor QA reviewer | |
| Recolor controls tested | |
| Known limitations / deviations | |
| Approved variants | |
| Approval decision | Draft / Needs changes / Approved |
| Date and release version | |

## D. Next engineering enhancements (NOT shipped by this guide)

- Group/ID-aware material recoloring that preserves coordinated gradient stops.
- Scene graph permissions for locked vs customer-editable groups.
- Dedicated fill-level, visibility and open/closed asset controls.
- Import-time schema validation for semantic regions and production manifest.
- Automated preview comparison and SVG sanitizer round-trip smoke tests.

These are product backlog proposals. A documentation commit does not implement them.
