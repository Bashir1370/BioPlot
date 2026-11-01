# Scientific library image delivery

The October 2026 library contained 67 published originals totalling 64,887,075
bytes. The UI used these originals, commonly 1254–2254 pixels wide, inside small
library cards. Native lazy loading, the catalog cache and on-demand artwork
loading did not reduce the cost of the first image download.

The checked-in WebP derivatives total 582,472 bytes (99.10% less source data),
with neither dimension exceeding 192 pixels. The largest is 17,950 bytes.
Transparency and aspect ratio are retained. This compares file sizes across the
complete library; it is not a measured page-load time or network benchmark.

## Runtime

- A lightweight catalog entry first uses the static preview when ID, version
  and source path match `src/generated/asset-previews.json`.
- New admin uploads create a separate small preview and store its path in
  `metadata.thumbnail_path`; the catalog selects that scalar, not the full
  metadata object. Metadata-only edits retain the existing preview.
- Unmatched/older uploads keep using the original until their preview is
  available. A failed derivative request falls back to the original once.
- Insertion, native-line parsing, document storage and exports continue to
  use the original sanitized editable SVG, never the small preview.
- Static preview filenames include a hash of the asset ID, version and source
  path and are served with immutable caching. Public image requests bypass the
  Supabase Pages function. Uploaded derivatives use unique storage paths.
- Thumbnail generation/upload failures do not prevent saving the source.
  Database write failures clean up both newly uploaded objects; replacement and
  deletion remove the associated uploaded derivative as well.

## Refreshing the existing static set

Run `npm ci` then `npm run assets:previews`. This command only reads the
published catalog and source storage objects. It writes static derivatives and
the manifest locally; it does not update Supabase or publish the site.

The command uses four workers, bounded requests, a pixel limit and a local
ignored source cache. Existing matching derivatives are reused. Standard external
SVG DTD declarations are stripped before rasterization; entity declarations are
rejected. Review/commit the changed manifest and images, then deploy normally.

The normal application build needs no database or storage credentials/network
access. New upload previews work immediately without regenerating the static
set. The maintenance command accepts the existing `VITE_SUPABASE_*` public
configuration and otherwise uses the app's public project configuration.
