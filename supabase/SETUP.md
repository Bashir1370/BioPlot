# Supabase setup

Use a staging project first. The database schema is not deployed by Cloudflare Pages.
Back up an existing database before applying SQL changes.

For a new project, run the following SQL files in the Supabase SQL editor in order:

1. `migrations/20260910000000_platform_foundation.sql`
2. `schema.sql`
3. `home_hero_images.sql`
4. `template_hero_images.sql`
5. `portfolio_showcase.sql`
6. All remaining files in `migrations/` in filename order, starting with `20260918074518_expand_home_hero_grid.sql`.

The foundation supplies profiles, administrator membership, the asset library,
categories and the public asset storage bucket required by the UI. It preserves
an existing `is_bioplot_admin()` function. Existing installations should compare
their schemas and policies before applying it; it cannot infer custom policies.

On a fresh project, grant the first administrator from the SQL editor, using the
actual Auth user UUID:

```sql
insert into public.bioplot_admins(user_id) values ('AUTH_USER_UUID')
on conflict do nothing;
```

Administrator status must never come from editable user metadata. Existing
installations with a custom administrator function should use their own enrollment
process. The optional token-claim UI requires an independently configured
`claim_bioplot_admin` RPC; it is not required for SQL-based enrollment.

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` together for a custom project.
On Cloudflare Pages also set `SUPABASE_URL` to the same URL in runtime settings.
The public key is intended for browser use; enforce access with RLS and never put
a service-role key in a `VITE_` variable.

Collaboration uses same-browser tabs by default. After applying
`migrations/20261024000000_private_collaboration.sql`, set
`VITE_BIOPLOT_REMOTE_COLLABORATION=true` to enable private remote topics for a
signed-in document owner across devices. Cross-account sharing is not implemented.
Public broadcast topics are not a substitute for document authorization.
