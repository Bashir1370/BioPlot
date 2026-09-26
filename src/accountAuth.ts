import type { User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import {orderReturnPath} from './orders/orderModel';

export type UserProfile = {
  id: string;
  display_name: string | null;
  preferred_language: 'en' | 'fa';
  plan: string;
  created_at: string;
  updated_at: string;
};

export type AccountState = {
  user: User | null;
  profile: UserProfile | null;
  isAdmin: boolean;
};

export async function getAccountState(): Promise<AccountState> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user ?? null;
  if (!user) return { user: null, profile: null, isAdmin: false };

  const [profileResult, adminResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id,display_name,preferred_language,plan,created_at,updated_at')
      .eq('id', user.id)
      .maybeSingle(),
    supabase.rpc('is_bioplot_admin'),
  ]);

  return {
    user,
    profile: (profileResult.data as UserProfile | null) ?? null,
    isAdmin: !adminResult.error && Boolean(adminResult.data),
  };
}

export async function signInUser(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

export async function signUpUser(email: string, password: string, displayName: string, next?: string | null) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/account${orderReturnPath(next??null)?`?next=${encodeURIComponent(next!)}`:''}`,
      data: { display_name: displayName.trim() || email.split('@')[0] },
    },
  });
}

export async function updateUserProfile(input: { displayName: string; preferredLanguage: 'en' | 'fa' }) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('Not signed in');

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: input.displayName.trim() || user.email?.split('@')[0] || 'BioPlot user',
      preferred_language: input.preferredLanguage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) throw error;
  localStorage.setItem('bioplot-lang', input.preferredLanguage);
}

export async function signOutUser() {
  const {error}=await supabase.auth.signOut();
  if(error)throw error;
}

export function subscribeAccountState(callback: (state: AccountState) => void) {
  let active = true;
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const { data } = supabase.auth.onAuthStateChange(() => {
    // Supabase holds its auth lock while notifying subscribers. Query only
    // after that callback has returned, and coalesce simultaneous events.
    const request = ++generation;
    clearTimeout(timer);
    timer = setTimeout(() => {
      void getAccountState().then(state => {
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

export function accountDisplayName(state: AccountState) {
  return state.profile?.display_name?.trim() || state.user?.user_metadata?.display_name || state.user?.email?.split('@')[0] || 'BioPlot user';
}

export function accountInitial(state: AccountState) {
  const name = accountDisplayName(state).trim();
  return name ? name[0].toLocaleUpperCase() : 'B';
}
