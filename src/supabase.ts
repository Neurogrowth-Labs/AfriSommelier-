import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

const hasValidSupabaseConfig = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseUrl.includes('example.com') &&
  supabaseUrl.startsWith('https://')
);

if (!hasValidSupabaseConfig) {
  throw new Error(
    'Missing production Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to run AfriSommelier with live data.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export const loginWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

export const registerWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const notifyUser = (type: 'match' | 'event' | 'info', title: string, message: string) => {
  const event = new CustomEvent('enoviq_notification', {
    detail: { type, title, message }
  });
  window.dispatchEvent(event);
};
