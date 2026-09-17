# Home Hero10 adaptation — verification

- Source: user-supplied Hero10 example and screenshot `4d4263ec-50de-4eec-9df3-e7490c005e30.png`. The referenced local attachment path is unavailable; the screenshot is visible in the conversation. The upstream registry returns authentication_required, so this is an independently implemented compatible component, not the original source.
- Implementation: live Home preview captured in the cloud browser at 1348 × 926, English and Persian. Screenshots were emitted in the conversation during verification.
- State: public visitor, default three images, desktop.

## Findings

Browser inspection confirms a centered serif English heading, BioPlot teal highlight, two pill CTAs, truthful feature text, three overlapping image frames with rounded white borders, and Persian RTL typography. Quick start is absent. No actionable defect was found in these inspected desktop states.

Typography: Georgia for English display, Vazirmatn for Persian; readable body and controls.
Spacing: centered heading/copy/actions above an overlapping three-card image fan. The Home navigation and search remain intact.
Colors: existing teal, ink and pale background intentionally retained instead of the sample's black CTA.
Images: the three supplied CDN images loaded successfully; admin images replace individual slots. Missing image URLs fall back to the existing local scientific illustration.
Copy: BioPlot's bilingual title, description and features retained; no invented customer counts.

## Interactions and validation

- Browse templates navigated to the Templates page.
- FA switched the full hero to Persian with RTL layout.
- Create scientific figure opened a new editor document.
- Browser console: no application errors observed in the Home inspection; one browser-extension metadata error was unrelated to app code.
- Production build and six automated tests passed. Tests cover fixed image slots, upload replacement, failed-save cleanup, authentication, file-type rejection and removal.
- Live Supabase verification: RLS enabled; public SELECT allowed; anonymous INSERT and authenticated TRUNCATE denied. Admin write policies use the existing admin function.
- Authenticated admin upload in-browser and mobile viewport testing were not performed.

## Comparison limits

No normalized side-by-side comparison artifact could be produced because the source screenshot file is absent. Desktop rendering and navigation were inspected, but exact source fidelity is not certified. No source/prototype pixel-density equivalence is claimed.

final result: blocked

Blocker: source attachment unavailable for the formal paired-image fidelity check. The implementation and functional checks are complete; this report does not claim a full visual QA pass.
