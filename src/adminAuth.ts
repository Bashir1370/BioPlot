import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type AdminSessionState = {
  user: User | null;
  isAdmin: boolean;
};

export async function getAdminSessionState(): Promise<AdminSessionState> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user ?? null;
  if (!user) return { user: null, isAdmin: false };
  const { data, error } = await supabase.rpc('is_bioplot_admin');
  if (error) return { user, isAdmin: false };
  return { user, isAdmin: Boolean(data) };
}

export async function signInAdmin(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpAdmin(email: string, password: string) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { emailRedirectTo: `${window.location.origin}/admin/library` },
  });
}

export async function claimAdmin(token: string) {
  const { data, error } = await supabase.rpc('claim_bioplot_admin', { p_token: token.trim() });
  if (error) throw error;
  return Boolean(data);
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}

export function subscribeAdminState(callback: (state: AdminSessionState) => void) {
  let active = true;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const { data } = supabase.auth.onAuthStateChange(() => {
    // Supabase holds its auth lock while notifying subscribers. Query only
    // after that callback has returned, and coalesce simultaneous events.
    const request = ++generation;
    clearTimeout(timer);
    timer = setTimeout(() => {
      void getAdminSessionState().then(state => {
        if (active && request === generation) callback(state);
      }).catch(() => {});
    }, 0);
  });
  return () => {
    active = false;
    ++generation;
    clearTimeout(timer);
    data.subscription.unsubscribe();
  };
}
