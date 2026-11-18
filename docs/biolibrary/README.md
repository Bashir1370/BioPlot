# BioPlot / BioLibrary Production Standards

This directory is the **canonical editable-scientific-vector production reference** for the BioPlot library and future figure studio. The root-level Word document `BioLibrary_Asset_Prompt_Style_Guide_v1.docx` remains unchanged; differences must be reviewed before claiming alignment.

## Read before making any new vector

1. [VISUAL_STYLE_GUIDE.md](./VISUAL_STYLE_GUIDE.md) — full BioPlot Scientific Soft-Volume (BSSV) v1.0 standard (camera, light, material, strokes, palette, editable SVG and production workflow).
2. [style-tokens.json](./style-tokens.json) — canonical machine-readable design values for generators. **Reference data only; not automatically loaded by the app.**
3. [QA_AND_PILOT.md](./QA_AND_PILOT.md) — acceptance checklist, Falcon 50 mL pilot, existing editor compatibility and future requirements.
4. [ASSET_SPEC_TEMPLATE.json](./ASSET_SPEC_TEMPLATE.json) — proposed per-asset production manifest template. **Not yet the live database schema.**

**Source of truth rule:** when asked to produce any new scientific SVG for BioPlot, consult the above files and follow BSSV. Publish only after scientific, visual and editor-round-trip QA. The style will be calibrated using the first accepted pilot assets.

**No runtime code changed by these documentation files.**
