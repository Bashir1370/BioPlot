# BioPlot SEO phase 2 — staging and production checklist

This change adds six **real static HTML** service pages, rather than six routes that all return the same React shell.

## Before merge

- Confirm that existing request links still go to `/design?kind=...` and orders and dashboard are unaffected.
- Run `npm test` and `npm run build`. Verify `dist/services/en/scientific-illustration/index.html` and the other five static files exist.
- Inspect page copy for scientific accuracy and brand language. No prices, testimonials or guarantees have been invented.

## Staging (after merging, via the usual automatic deployment)

Check each service page in both languages:

```bash
for url in \
  /services/en/scientific-illustration/ \
  /services/fa/scientific-illustration/ \
  /services/en/graphical-abstract/ \
  /services/fa/graphical-abstract/ \
  /services/en/scientific-poster/ \
  /services/fa/scientific-poster/; do
  curl -fsSL "https://staging.bioplot.ir$url" | grep -E '<h1>|rel="canonical"|hreflang="fa"'
done
curl -sSI https://staging.bioplot.ir/services/en/graphical-abstract/ | grep -Ei 'HTTP/|X-Robots-Tag'
```

Staging should return status 200 and **X-Robots-Tag: noindex, nofollow** for the service pages, as already configured in its hosting .htaccess.

Verify that raw page HTML contains the exact service H1 and canonical and is NOT the generic React app. Ensure images render and order buttons navigate correctly.

## Production

Only after the staging tests and copy review, run the **manual** Build and Deploy workflow to production. Check:

```bash
curl -sSI https://bioplot.ir/services/fa/graphical-abstract/
curl -fsSL https://bioplot.ir/services/en/scientific-illustration/ | grep -E '<title>|rel="canonical"|hreflang'
curl -fsSL https://bioplot.ir/sitemap.xml | grep '<loc>'
curl -sSI https://bioplot.ir/ | grep -Ei 'HTTP/|X-Robots-Tag'
```

**Production must not carry the staging noindex header.**

## Private routes: stronger server-side protection

The early inline script in `index.html` marks all SPA fallback routes other than `/` as noindex and removes the homepage canonical on those routes. This is an SEO guard, **not an access control**.

For a stronger HTTP-level signal, add the following to the **production** domain's existing `.htaccess` in DirectAdmin (after review; do not replace the existing Supabase rewrite and SPA rules):

```apache
<IfModule mod_headers.c>
    SetEnvIfNoCase Request_URI "^/(account|dashboard|orders|design|admin|templates|editor)(/|\\.|$)" BIOPLOT_PRIVATE=1
    Header always set X-Robots-Tag "noindex, nofollow" env=BIOPLOT_PRIVATE
</IfModule>
```

Confirm the result with `curl -sSI https://bioplot.ir/dashboard` and `curl -sSI https://bioplot.ir/`. If this web server does not support the directives, keep the existing .htaccess and ask hosting support for the appropriate LiteSpeed/Apache syntax.

Do **not** disallow private routes in `robots.txt` in place of `noindex`: blocked URLs may not be crawled and their noindex directive may not be seen. Actual privacy is enforced by authentication and database RLS, not by SEO signals.

## Search Console

After production publish, resubmit `https://bioplot.ir/sitemap.xml`. Inspect service URLs and request indexing as needed. New pages can take time to appear; no ranking or indexing result is guaranteed.

## Image SEO follow-up

Service page examples use real WebP images with meaningful alternate text and captions. The dynamic homepage portfolio uses files uploaded via Supabase and has no per-image editorial captions in its current data model. Add an admin-editable Persian/English title and alt-text field before promising complete portfolio image SEO coverage.
