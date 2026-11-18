# BioPlot Scientific Vector Library — Visual & Editable Asset Standard

**Document ID:** BP-LIB-STYLE-001  
**Version:** 1.0.0 · **Date:** 2026-11-18  
**Status:** Production baseline, subject to validation on the Falcon 50 mL pilot  
**Applies to:** Laboratory equipment, cellular and molecular biology, anatomy, workflows, biomedical and scientific diagrams.  
**Single source of truth:** This document + `style-tokens.json`. Changes to core style require a version bump and a before/after comparison across reference assets.

> اصل BioPlot: هر دارایی باید از نظر علمی درست، از نظر بصری یکدست و از نظر فنی واقعاً وکتوری و قابل‌ویرایش باشد. خروجی PNG یا یک تصویر قرارداده‌شده داخل SVG، دارایی وکتوری قابل‌ویرایش محسوب نمی‌شود.

## 1. Visual identity / هویت بصری

**Official style name: BioPlot Scientific Soft-Volume (BSSV).**

- **Genre:** polished, semi-realistic, softly shaded 2.5D scientific illustration; clean editorial/scientific artwork rather than flat iconography or photorealistic 3D render.
- **Reference mood:** approachable, credible, modern biomedical illustration in the general category of scientific figure libraries. Do not trace, copy, or reproduce another product's specific icon shapes, palette, or compositions. Establish BioPlot's own consistent geometry and material language.
- **Four principles:** scientific credibility; soft dimensionality; compositional clarity; selective editability.
- **Priorities:** scientific correctness > recognizability at figure scale > editable component boundaries > visual polish > decoration.
- **Avoid:** cartoon outlines, fully flat silhouettes, neon gradients, excessively saturated highlights, heavy black borders, glossy product-ad renders, photographic textures, dramatic camera perspective, random icon styles.

### 1.1 Projection and camera

| Subject | Default view | Exceptions |
|---|---|---|
| Lab equipment | near-orthographic, front three-quarter view; slight top visibility; controlled lateral rotation around 10–20° when informative | precise front view for graduated vessels, measurement or orientation-critical equipment |
| Cells / organelles | soft volumetric 3/4 illustration; optional cutaway revealing relevant substructures | 2D cross-section if needed for scientific interpretation |
| Proteins / macromolecules | scientifically valid structural silhouette or annotated molecular depiction; soft-volume shading | rotate to expose functionally important regions; never fake molecular geometry |
| Anatomy / tissue | anatomically intelligible 3/4, section or schematic as appropriate | use the viewpoint that best serves scientific truth |
| Workflow components | standardized individual asset views and consistent relative scale | clarity takes precedence over forced shared perspective |

Use a weak perspective / near-orthographic feeling. Avoid strong vanishing points and conspicuous isometric grid aesthetics. All assets in a set must share apparent camera height, vanishing behavior, material treatment and direction of light. An organelle is not required to have the exact camera yaw of a pipette.

### 1.2 Light and volume

- **Primary light:** diffuse from upper-left (approximately 10:30 o'clock), not a spotlight. Maintain the same direction across the catalog.
- **Highlights:** one broad, subdued highlight on the lit side; an optional narrow rim highlight only for glossy glass/plastic. Usually 1–2 major highlight regions, not repetitive reflections.
- **Shadows:** soft lower-right form shading and restrained contact/occlusion. Prefer separate vector shapes or simple gradients to large SVG filter stacks.
- **Materials:** a mild 3–5-stop gradient for curved main surfaces; sharper yet restrained transitions for plastic edges and metallic components. A gradient must represent shape/material, not decoration.
- **Contrast:** medium; object remains legible against white and a light-gray figure background. Preserve visible midtones.
- **Opacity/shading:** highlights generally 0.10–0.25 opacity; cast/contact shadow normally 0.08–0.16; do not exceed 0.22 without scientific/material justification.
- **Blur:** avoid blur filters in the shipping SVG where possible. Vector gradient shadows are preferred. If a filter is essential, keep it bounded and verify sanitizer/browser compatibility.

### 1.3 Linework / خطوط

For a canonical `viewBox="0 0 512 512"`:
- outer contour: **1.4 px** nominal, allowed **1.0–1.8 px**, dark muted blue-gray, never pure black;
- interior separation: **0.8–1.2 px**;
- scientific details / graduations: **0.7–1.1 px**, readable at final use size;
- avoid outlines on every highlight and shadow patch; highlights should mostly be stroke-free;
- joins and caps: round where physically appropriate, crisp where instrument geometry requires.
These are `viewBox` units, not a fixed physical print thickness. Scale proportionally if a non-512 viewBox is necessary.

### 1.4 Detail density / شدت جزئیات

Use **moderate-high, purposeful detail**: enough ribbing, cap threads, measurements, membrane shape or molecular structure to identify an object and its functional parts, but not micro-details that become visual noise. Distinguish:
- **Essential:** critical structure and scientific features — required;
- **Functional:** graduations, label area, specific connector — optional variant;
- **Decorative:** reflections, gentle rim illumination, depth cues — restrained;
- **Misleading:** invented dimensions, inaccurate labels, false structural relationships — prohibited.
At 128 px, the object must remain identifiable even when tiny labels are not readable.

## 2. Color system / نظام رنگ

The accompanying `style-tokens.json` defines approved *starting* colors. Palette is **semantic, not monochromatic**: real-world equipment and cell structures may have appropriate distinct colors, while light, material behavior, saturation and linework remain visually coherent.

| Role | Base | Usage |
|---|---|---|
| Ink / contour | `#486171` | restrained outlines and separation |
| Deep contour | `#354C5D` | shaded structural edges |
| Neutral plastic | `#E9F0F3` | light translucent labware body |
| Plastic midtone | `#C5D3DB` | body-side volumes |
| Plastic shade | `#91A7B5` | low-light rims |
| Glass highlight | `#FFFFFF` | translucent highlight overlay only |
| Cap blue | `#457FC4` | standard blue lab cap family |
| Cap dark | `#2C5D99` | cap form shadow |
| Teal accent | `#45A9A3` | interface-like scientific accent |
| Liquid cyan | `#6BC6D1` | neutral demonstration liquid |
| Organelle coral | `#E8A28C` | biological warm family |
| Nucleus lavender | `#A999D7` | biological cool family |
| Membrane sage | `#9CC6B1` | biological soft-green family |

Use **quiet, science-first color**. Do not force an inaccurate biological color into a realistic specimen. Reserve saturated colors for one or two focal areas; natural samples, stains and labeled experiments may need asset-specific palettes. Palette values are foundations, not claims about real material chemistry or microscopy color.

### 2.1 Color and gradients as editable material recipes

- Every meaningful material (cap, tube body, liquid, membrane) is an independent *semantic region*.
- Each material can use its own base/shade/highlight colors; do not reuse the same literal hexadecimal value across unrelated editable regions.
- Name gradients after a region and role, e.g. `bp-grad-cap-base`, `bp-grad-body-shell`, `bp-grad-liquid-fill`.
- The current BioPlot quick color-slot editor replaces matching literal hex colors; it **does not yet automatically regenerate every gradient stop of a material**. See §5 for current-versus-future editing contract.
- Do not bake a whole object's shading into a single image. Keep vector fills, paths, gradients and meaningful groups separate.

## 3. Material recipes / رفتار متریال‌ها

**Translucent polypropylene (Falcon tubes, microtubes):** subtle blue-gray plastic body, gently bright left edge, darker right edge, slightly transparent center, mouth/collar distinctly modeled; liquid must remain visibly behind the wall.

**Ribbed caps:** shape layers for top, sidewall and rib pattern; slightly richer color on low-light edge; repeating ridges follow physical form instead of flat decorative stripes.

**Clear glass:** restrained edge reflections, white-to-blue-gray transparent areas, subtle double-edge construction. Avoid thick opaque white center.

**Metal:** cooler, tighter tonal transitions with small but meaningful highlights; no chrome-mirror artifacts.

**Liquids:** independent fill silhouette clipped inside vessel where required; an editable level (when supported in a variant); an elliptical meniscus only if geometrically appropriate; liquid should not cross glass/tube boundaries.

**Cell membranes / organelles:** soft-volume surfaces, distinguish outer membrane and inner features; use precise shapes, not random glossy blobs. Indicate cutaway with clean edge treatment.

**Protein / nucleic acid illustrations:** source biological structure must be plausible; shading may aid depth but not invent bonds, base pairs, oligomerization or topology.

## 4. Artboard, composition and previews

- Canonical master design: **512 × 512 SVG viewBox**, transparent background, vector-only. Use a different aspect ratio for elongated objects when scientifically useful; retain the same apparent scale and style.
- Default artwork footprint: **70–84%** of the canonical artboard's bounding dimension, with at least **8% clear-space** to avoid cropping. Tall instruments can use a fuller height while retaining legibility.
- Optical center rather than forced mathematical center. Bottom contact shadow stays within the artboard.
- No mandatory background rectangle, no watermark, no text title in the SVG artwork. Scientific labels can be separate elements/variants.
- Preview PNG at 1024×1024 (transparent); a store thumbnail can be 256×256 or generated by the existing preview pipeline. Actual library thumbnail pipeline may use WebP and up to 192 px as documented in `docs/asset-preview-performance.md`.
- Test appearance at 64, 128, 256 and 512 px on white and light-gray surfaces; test 2× export at print and SVG native scale.

## 5. Editable SVG technical contract

### 5.1 Permanent stable semantic IDs

Use stable, human-readable IDs for meaningful groups:

| ID | Purpose | Initial studio permission |
|---|---|---|
| `bp-body` | main outer vessel / structural shell | locked or limited tint |
| `bp-cap` | cap including ribs and cap shading | editable base color |
| `bp-liquid` | liquid silhouette and meniscus | editable color, variant-level visibility |
| `bp-graduations` | measurement marks and numbers | visible/hidden (future control) |
| `bp-label` | label base / optional text | editable label color/text |
| `bp-highlights` | volume and surface highlights | locked |
| `bp-shadows` | material and contact shadows | locked |
| `bp-outline` | contour and boundary lines | locked |

A different scientific asset may have `bp-membrane`, `bp-nucleus`, `bp-helix`, etc. Use IDs for stable selection and `aria-label` for human-readable names. Do not alter existing IDs after publication without a migration/version plan.

### 5.2 Editable vs locked

- **Customer level 1:** semantic palette adjustments, label text, opacity.
- **Customer level 2 (planned):** alternative state (open/closed, empty/full), visibility flags and predefined physical variants.
- **Internal creator:** full path editing, regrouping, geometry corrections, adding scientific variants.
- The asset must survive selective recoloring without losing its depth cues. For gradients, **a future region-aware recoloring engine is required** to update coordinated shade/highlight stops. The guide is a contract, not a claim that all those editing controls already exist.

### 5.3 Current BioPlot implementation boundaries (verified 2026-11-18)

- Current code has SVG component/group editing with path-node controls: `docs/svg-component-editing.md`.
- `ScientificAsset.colorSlots` currently stores `{key,label,defaultValue}` and the existing slot recoloring in `src/assetStyling.ts` performs literal hex-string replacement. This is **not yet ID/group-aware recoloring**.
- The upload sanitizer in `src/assets.ts` strips `script`, `style`, `foreignObject`, animations, event handlers and external references. It retains allowed local fragment references such as `url(#bp-grad-cap-base)`.
- Supply **plain standalone SVG** with SVG namespace; explicit `viewBox`; inline presentation attributes; local `defs` references; no external font, CSS, network resource, foreignObject or script.
- Raster wrapped in `<image>` may upload, but its pictured contents are **not vector-editable**; it must fail the premium vector acceptance gate.
- Existing admin SVG uploads have a 2.5 MB file-size ceiling in `src/AdminLibraryPage.tsx`. Target <= 250 KB for ordinary assets; pilot complexity can justify up to 500 KB, but anything bigger must be reviewed.
- The `metadata` JSON template below is a **production-side proposed manifest** and is not an automatically imported studio/database schema. Do not claim custom per-region controls work until implementation and tests prove it.

### 5.4 Minimal structural sketch (illustrative only)

    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
      <defs>
        <linearGradient id="bp-grad-cap-base">
          <stop offset="0" stop-color="#71A1D7"/>
          <stop offset="0.55" stop-color="#457FC4"/>
          <stop offset="1" stop-color="#2C5D99"/>
        </linearGradient>
      </defs>
      <g id="bp-body" aria-label="Tube body"> ... vector paths ... </g>
      <g id="bp-liquid" aria-label="Liquid"> ... vector paths ... </g>
      <g id="bp-cap" aria-label="Screw cap">
        <path fill="url(#bp-grad-cap-base)" d="..."/>
      </g>
      <g id="bp-graduations" aria-label="Graduation marks"> ... </g>
      <g id="bp-highlights" aria-label="Highlights"> ... </g>
    </svg>

This sketch is **not a render-ready asset**; genuine assets must contain valid paths, no `...` placeholders.

## 6. Asset taxonomy and naming

Suggested top-level families: `lab-equipment`, `cell-biology`, `molecular-biology`, `microbiology`, `anatomy`, `workflows`, `clinical`, `materials`.

Folder path: `biolibrary/assets/{category}/{asset-slug}/` (planned production layout).  
Machine ID: `lab-equipment.falcon-50ml`; display names: `50 mL Conical Centrifuge Tube` / `لوله سانتریفیوژ مخروطی ۵۰ میلی‌لیتری`.  
Source master: `{slug}_master.svg`; app-ready: `{slug}_web.svg`; preview: `{slug}_preview.png`; companion manifest: `asset.json`.

Retain object ID across minor versions, increment asset version for each public change. Avoid branded trade dress when generic instruments can describe the science just as well. Group variant files only when there is a meaningful physical or functional distinction.

## 7. Repeatable production workflow

1. **Brief:** name, science/function, category, reference measurements and required features, target use, states and editable regions.
2. **Scientific check:** verify silhouette, scale relationships and component positions against trustworthy technical/biological references; document uncertain or illustrative simplifications.
3. **BSSV design spec:** camera, lighting, material recipe, palette, contrast and size. Choose representative catalog references to compare.
4. **Vector construction:** generate real SVG groups/paths and gradients programmatically or in Inkscape/Illustrator. AI may assist drafting; no unverified generated details enter the final master.
5. **Semantic organization:** establish stable IDs and logical group layers; split customer-editable regions from locked shading; name gradients.
6. **Manual art direction:** clean curves, remove unnecessary nodes, tune perspective and appearance under the shared style.
7. **Variants:** create only supported scientific states, e.g. empty/half/full, open/closed, labeled/unlabeled. Do not create physically contradictory combinations.
8. **Compatibility review:** sanitize through BioPlot, inspect what remains, insert into studio, edit groups/colors, save/reopen, export SVG+PNG, compare to source.
9. **QA:** evaluate at four sizes, both backgrounds, alongside at least two approved neighboring assets. Review scientific and visual quality separately.
10. **Publish:** source + app-ready SVG + preview + metadata + changelog after scientific/design/editor approvals. Preview image is not the purchased editable master.

## 8. Mandatory acceptance criteria

An asset is **rejected** if it fails any of these:
- scientifically incorrect or misleading anatomy/geometry;
- obvious style mismatch against reference catalog;
- raster-only artwork disguised as SVG;
- missing semantic regions or unstable IDs;
- broken editor round-trip, clipped canvas, missing gradients or lost elements;
- unintended recoloring of unrelated materials;
- unsafe/external references or scripts;
- unreadable essential silhouette at 128 px;
- improper science-related labels, units or inaccurate graduations.

Aesthetic preferences such as cap blue saturation may iterate during the pilot. Structural and editability rules are release blockers.

## 9. Falcon 50 mL pilot — reference asset

**Object:** generic 50 mL conical centrifuge tube, capped, semi-transparent polypropylene.  
**Orientation:** upright, near-orthographic slight 3/4 rotation; reveal cap ribbing and taper.  
**Base state:** capped, empty, optional measurement markings.  
**Materials:** blue threaded plastic cap, pale blue-gray translucent body, readable conical base, understated left highlight and right shade.  
**Essential editable regions:** cap, liquid, label.  
**Future-state controls:** liquid level, graduations visible/hidden, cap open/closed.  
**Variants:** empty / half-filled / filled / cap-separated (only where geometry remains physically credible).  
**QA reference:** ensure 15 mL and 50 mL models will share the same material, outlines, angle and light source despite differing silhouettes.

Start with a single master. Only after a passed studio round-trip and manual approval should we generate production variants or a batch of equipment.

## 10. Canonical AI / collaborator instruction

When generating any new BioPlot scientific vector:
1. Read this file and `style-tokens.json` **before creating artwork**.
2. Follow **BioPlot Scientific Soft-Volume (BSSV)**: scientific semi-realism, near-orthographic mild 3/4 volume, diffuse top-left light, soft controlled gradients, muted blue-gray contours, disciplined materials and subtle highlights.
3. Make every essential shape a true SVG path/primitive, grouped by semantic stable IDs. Never bake the object into an embedded bitmap.
4. Match perspective, stroke scale, apparent detail density, illumination and material recipes of approved catalog references.
5. Produce an editable SVG source + app-safe copy + preview + asset manifest, then pass the documented acceptance checklist.
6. If a visual effect cannot survive current BioPlot SVG sanitization/editor round-trip, simplify it without destroying the scientific meaning.
7. Never assume a future editing feature is already implemented. Clearly mark proposed future functionality in the manifest.

## 11. Governance and change control

- **Owner:** BioPlot scientific/art direction.
- **Baseline:** v1.0.0 (Falcon pilot pending approval). We do not silently change it across different commissions.
- **Version policy:** patch = clarifications; minor = new compatible recipes/tokens; major = breaking visual system change.
- **Approval:** scientific QA + visual consistency + editability/technical QA; record deviations in the asset manifest.
- **Review cadence:** after the first three pilot assets (50 mL tube, micropipette, cell organelle), compare them side-by-side and lock the approved golden references.
- The pre-existing repository-root `BioLibrary_Asset_Prompt_Style_Guide_v1.docx` remains untouched. This Markdown standard provides the explicit production and current-editor compatibility contract; reconcile any differences before claiming both are identical.
