# Scientific design orders

BioPlot now has two complementary paths: self-service editing and a team design service.

- `/design`: public services page with scientific illustration, graphical abstract and poster options.
- `/orders`: authenticated customer workspace; `/orders?new=1` starts a brief.
- `/orders?id=<uuid>`: private brief, quote, shared attachments, discussion and history.
- `/admin/orders`: administrator queue and production workspace. Uses the existing `is_bioplot_admin()` authority.
- The home page, dashboard, admin library and editor provide entry points. “Request design help” in the editor stages an SVG snapshot in session storage; it is uploaded only when a signed-in user submits the request.

## Production activation

1. In the existing Supabase project's SQL Editor, run the **complete** migration `supabase/migrations/20260923150000_scientific_design_orders.sql` once, as the database owner. It requires the existing `public.is_bioplot_admin()` function and standard Supabase Auth/Storage schemas. The migration is transactional and creates all four tables, two workflow RPCs, RLS policies and the private `bioplot-order-files` bucket (20 MiB/file). It changes no existing project or library tables. The application uses the existing public client key; do not add a service-role secret to frontend environment variables.
2. Merge the feature PR and let the existing Cloudflare Pages production build deploy it. Retain SPA fallback for `/design`, `/orders` and `/admin/orders`, as for the existing `/dashboard` route.
3. Ensure Supabase Auth's redirect allowlist includes the deployed `/account` URL with order `next` query parameters (or the existing origin wildcard). Email confirmation then returns to the order flow. No external redirect is accepted by the app.
4. Verify with one ordinary account and one existing administrator account: submit a brief/reference, review it, quote price/scope/terms, accept as the customer, upload a preview, request a revision or approve it, upload final files, mark delivered, download as the customer and confirm completion. Check that another customer cannot read the URL or storage files. Existing storage policies must not grant unrestricted access to every bucket.

This repository change does **not** execute SQL against production. Until the migration is applied, the UI shows a service-unavailable error rather than reporting a locally saved order as submitted. No sample/demo orders are inserted into production.

## Operating the service

The first submission is a request for assessment, not a payment. Quotes include total price, explicit currency (IRT means **toman**, not rial), delivery days, included revision rounds and a required scope describing deliverables and payment arrangements. There are no hard-coded service prices or promises of free work. Customer approval records an immutable copy of these terms in history.

Workflow:

`submitted → reviewing → quoted → accepted → designing → review → approved → delivered → completed`

- Customers may cancel before accepting a quote, with a reason.
- The customer can request a revision from `review` or `delivered`, with a description. The team can continue design or issue a new quote for a changed scope. Additional work is never automatically charged. The included-round counter resets when a new quote is issued; prior events remain in history.
- A new preview uploaded after the latest design start is required before `review`. Customer preview approval is required before final delivery. A final file from the current design cycle is required before `delivered`.
- Both parties can add messages and references while the order is open. Administrators can add preview/final files. **Every uploaded file is shared with both parties immediately**, so use this area for customer-facing versions, not private team notes.
- Registered file versions are immutable and kept in the order history; there is no delete-order UI. Signed download links expire in 60 seconds. Uploaded SVG, PDF and document files are offered as downloads, never inserted into the page as executable markup.
- This release does not connect a payment gateway or send email/SMS notifications. Updates are visible in the account workspace and refresh on focus/every 30 seconds. Actual payment arrangements are agreed in the quote; the site does not claim a payment occurred.
- The queue displays the latest 200 orders, with search and status filtering. Older orders remain accessible by direct URL.
- Team work is handled by existing administrator accounts; dedicated designer assignment and private internal notes are not part of this release.

## Validation

`npm test` includes a PGlite PostgreSQL integration suite that runs the actual migration and checks role-based isolation, inaccessible private files, protected pricing, retry-safe creation, stale-update rejection, immutable file versions, required uploads and the quote/approval/revision/delivery flow.

For the local browser integration test:

```sh
npm install --no-save --package-lock=false @playwright/test@1.51.1
npx playwright install chromium
node scripts/check-design-orders.mjs
```

The browser script intercepts all Supabase requests, supplies synthetic Auth identities and forwards workflow/data requests to local PGlite with the real RLS policies. It simulates the Storage HTTP transport, so live Supabase configuration still needs the activation check above. It does not write to live accounts or send any messages to real people.

## Maintenance

Back up the database and private bucket together. Do not remove registered storage objects independently: the order workspace retains links and audit history. Any future retention/deletion or payment integration must be an explicit server-side workflow with appropriate authorization. To disable ordering during maintenance, hide the service entry points and restrict the RPCs; do not drop tables containing customer work.
