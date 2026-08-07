import { createClient } from '@supabase/supabase-js';
import { isConfiguredAdminEmail } from './config';

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
