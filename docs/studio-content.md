# Design studio content management

The admin editor is at `/admin/studio`, linked from the library admin, user dashboard (admins only), and orders navigation. It controls `/design`, the new-order form, and customer/order workspace copy.

## Activation

1. Apply `supabase/migrations/20260923200000_design_studio_content.sql` once in the existing Supabase project. It requires the existing `is_bioplot_admin()` function. This creates one public content record, an admin-only publishing RPC, and the public `bioplot-studio-media` image bucket.
2. Deploy this branch after the migration. Sign in as an existing admin, open `/admin/studio`, edit, preview and publish.
3. If `/orders` says the ordering service is unavailable, apply the earlier `20260923150000_scientific_design_orders.sql` migration first (only if it has not already been applied). The content migration does not create the private ordering tables. A public read of the live REST schema during development returned PGRST205 for `design_orders`; no live database changes were made.
4. Confirm the Supabase Auth redirect allowlist permits `/account?next=admin_studio` on your site, as for the other account routes.

## Editing

- Text sections: services, request form, orders panel and order workspace. Search individual fields and edit Persian/English separately. Brand names and data supplied by customers are not changed by this editor.
- Images: hero, three service cards, request guide, and custom image blocks. PNG, JPEG and WebP, maximum 5 MB. Images retain their proportions. Empty image slots use the original vector illustration/icons or omit optional images.
- Blocks: add questions/answers, text, or image blocks; edit both languages (a missing block translation falls back to the other language); choose services or request-form placement; move up/down; delete. Maximum 60 blocks. Blocks render at the end of the chosen page/form, in their configured order.
- Preview shows unpublished changes. Previewing a form never submits an order or alters a customer draft. Publish applies the whole content record atomically. Reload a public page to see the published version.
- Leaving with unsaved changes prompts the browser warning. Drafts stay in the open editor until published; they are not a separate saved server draft. Uploaded images get unique URLs immediately, but page content does not change until publication.
- Removing an image from a page does not delete the original storage object, so other content referencing it remains intact. No storage cleanup is performed automatically.

## Safety and validation

Public content is plain text rendered by React; no HTML injection. Only HTTPS image URLs are rendered. Marketing media is public; customer references and deliveries remain in the separate private orders bucket. RLS exposes read-only public content, and the RPC checks administrator status and compares the loaded version under a row lock. A stale editor cannot overwrite another admin's publication. The UI reports loading/upload/publish failures without pretending to save locally.

The isolated PostgreSQL tests cover non-admin rejection, public reads, image upload policies, direct-write denial, and concurrent-edit protection. `scripts/check-studio-content.mjs` covers admin preview/upload/FAQ reorder/publish/reload and mobile layout using local PostgreSQL and mocked Supabase transport. `scripts/check-design-orders.mjs` retains the full request-to-delivery regression flow. No test writes to production.
