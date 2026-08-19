import { createClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const signInWithEmail = async (email, password) => {
  if (!isSupabaseConfigured) return { data: null, error: null };
  return await supabase.auth.signInWithPassword({ email, password });
};

export const signUpWithEmail = async (email, password, options = {}) => {
  if (!isSupabaseConfigured) return { data: null, error: null };
  return await supabase.auth.signUp({
    email,
    password,
    options: {
      data: options
    }
  });
};

export const signOutUser = async () => {
  if (!isSupabaseConfigured) return { error: null };
  return await supabase.auth.signOut();
};
