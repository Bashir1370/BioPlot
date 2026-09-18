# Home Shuffle Grid verification — 2026-09-18

- Source visual truth: `/workspace/scratch/69be2ccc5bb8/upload/96968499-6dc9-4d5a-a984-355d23171cf0.png` (1911 × 972).
- Browser implementation: `/workspace/scratch/bioplot-shuffle-en.jpg`, `/workspace/scratch/bioplot-shuffle-fa.jpg` (1363 × 936, CSS viewport 1363 × 936, 1×).
- Paired comparison: `/workspace/scratch/bioplot-shuffle-comparison.jpg`. Source hero content crop (1420 × 563) and implementation hero crop (1305 × 580) normalized into a 1420px-wide comparison, excluding browser chrome. The original screenshot viewport cannot be set through the available browser API; this is a proportional component comparison, not a pixel-identical clone.
- State: Home hero, loaded gallery, English/Persian; animation paused for composition review.

## Findings

No actionable P0/P1/P2 findings in the inspected desktop states. The source's two balanced columns, vertically centered headline/copy/actions, 4×4 image mosaic, narrow gutters, rounded image corners and landscape tile proportions are retained. BioPlot's established teal, Inter/Vazirmatn typography, scientific copy, secondary CTA and existing three defaults are intentional product adaptations. Remaining defaults are scientific/medical photographs and the existing cell illustration. All 16 image requests loaded without the error fallback in the inspected browser.

Typography: bold sans headline and smaller muted body, no clipping; Persian glyphs and RTL flow render correctly. Spacing: image and copy columns have clear separation; grid retains 16 distinct tiles with consistent gutters. Colors: existing brand foreground/background and teal actions preserved. Assets: real image assets, object-fit cover, no drawn substitutes. Focus controls and pause/resume labels are available.

## Interaction evidence

- Pause changes to Play with aria-pressed=true; resume changes it back. Subsequent DOM positions show a changed permutation of the same 16 identities.
- Persian language switch mirrors the layout and translates actions.
- Browse templates opens `/templates` and renders the template library.
- Create figure opens `editor.html?id=doc_mu6npqwz_vuccik` with a saved, blank figure in the local preview.
- Browser console checked: no application errors; browser-extension metadata errors only.
- Build and TypeScript validation passed. Ten targeted tests passed, including all 16 admin controls, sparse/default mapping, slot-16 upload, out-of-range rejection, shuffle identity preservation, replacement cleanup and failed save handling.
- Live database constraint confirmed as 1–16 with RLS enabled and existing admin-write/public-read policies preserved.

## Comparison history

First paired visual review: no substantive layout fixes required. Two invalid stock image URLs found during network validation were replaced before the browser capture; every final gallery image loaded successfully.

## Remaining coverage / follow-up polish

- Authenticated admin file upload was tested through mocked persistence tests, not a live administrator browser session (preview is signed out).
- Mobile breakpoints and reduced-motion behavior are implemented but were not exercised in the available fixed-size browser viewport.
- A full pixel-matched comparison at the original viewport is not claimed; focused crops were unnecessary because all hero controls and tiles were legible in the combined component comparison.
- Existing Supabase advisor warnings concern admin helper functions and leaked-password protection; this migration changes only the slot constraint. References: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection.

final result: passed
