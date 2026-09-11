import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://bovvqelbnqocllsxssus.supabase.co';
const fallbackPublishableKey = 'sb_publishable_4OzaaxZ9YWuSDcoQNdUkIw_mqbrwEXr';

const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) || fallbackUrl;
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) || fallbackPublishableKey;

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
