# BioPlot Google Analytics 4 installation

**Production Measurement ID:** `G-9W5D9P3J5P`

**Scope:** The public home, six static service pages, and the design/order request routes. It does not load on account, dashboard, admin or other restricted routes. The same consent interface appears on staging, **without any GA4 requests**.

## Data collection and consent

- An explicit bilingual analytics consent control appears to visitors. The Google tag does **not load** until the visitor selects **Accept / موافقم**. Declining sends no GA4 traffic.
- The choice is stored locally for that browser. A persistent "Analytics settings / تنظیمات آمار" control lets users change their choice. Withdrawal disables the GA tag, expires first-party `_ga` cookies and reloads the page.
- Page events use sanitized origin + pathname. No URL query string (including order IDs), email, brief, title, message, file name or other user-generated value is sent in **our custom events**.
- Google privacy information is linked from the banner. Keep BioPlot's own privacy notice updated to disclose Google Analytics, consent, cookie purposes, retention and contact options. Privacy/legal review is advised before the production release.

## GA4 Admin setting required before Production

**Important:** Google documents that Enhanced Measurement's `page_view` events based on browser history changes may fire even when the tag is configured with `send_page_view: false`. BioPlot's order workspace changes the URL using `history.replaceState`, and some URLs contain unique order identifiers.

In Analytics, open **Admin → Data streams → BioPlot Website → Enhanced measurement → gear/settings for Page views → Show advanced settings**, then **turn OFF "Page changes based on browser history events"**. Keep initial page measurement / other useful enhanced measurement options as appropriate. BioPlot sends its own sanitized `page_view` events after consent. Confirm that DebugView shows only the intended page views with no order-id query strings.

Reference: https://developers.google.com/analytics/devguides/collection/ga4/views

## Events and meanings

| Event | Trigger | Notes |
|---|---|---|
| `page_view` | Public home/service/design/order page loaded **after consent** | Sanitized `page_location`, one manually emitted event per full page load |
| `order_cta_click` | User clicks a link to open the design/order form | Only whitelisted service type (`figure`, `graphical_abstract`, `poster` or `unspecified`) |
| `generate_lead` | Order creation succeeds in the database | No order ID or user details; mark as a key event in GA4 if desired |

The count of `generate_lead` measures newly created design requests, **not paid purchases**.

## Release and verification

1. Confirm tests and staging build for the pull request. Verify consent UI in Persian and English on staging. Staging intentionally never sends data to GA4.
2. Before deploying production, turn off history-based Enhanced Measurement page views in GA4 as explained above.
3. Manually run Production workflow after approving staging.
4. On `https://bioplot.ir/`, open an incognito window. Before consent, verify Network contains no `gtag/js` and no `collect` requests. Click **Decline** and confirm nothing is sent.
5. In another fresh session, click **Accept**; verify one sanitized `page_view` in DebugView / Realtime. Check both language service pages.
6. Do not create a real order merely to test conversion tracking; use a safe test environment if available. Once regular requests arrive, `generate_lead` should appear without identifying properties.
7. Revoke consent through the settings control, verify cookie cleanup and no GA requests on the next page load.
8. Review Reports → Realtime, Acquisition and Engagement → Pages; some normal reports may lag.

This tag begins measuring only after a user consents, so Analytics does not provide a complete historical count of visits before installation.

Google reference: https://support.google.com/analytics/answer/14009635
