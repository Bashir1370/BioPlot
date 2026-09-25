import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://bovvqelbnqocllsxssus.supabase.co';
const fallbackPublishableKey = 'sb_publishable_4OzaaxZ9YWuSDcoQNdUkIw_mqbrwEXr';

// Browser requests go through our Pages origin so authentication and uploaded
// images remain reachable when a browser cannot connect to *.supabase.co.
// Vite proxies the same path during local development.
const url = typeof window === 'undefined'
  ? (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fallbackUrl
  : `${window.location.origin}/api/supabase`;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || fallbackPublishableKey;

export const supabase = createClient(url, key, {
  auth: {
    // Preserve sessions created before the same-origin proxy was introduced.
    storageKey: 'sb-bovvqelbnqocllsxssus-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
