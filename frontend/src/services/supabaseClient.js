import { createClient } from '@supabase/supabase-js';
import { setCachedToken, clearCachedToken } from './tokenCache';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Lightweight client setup. Graceful if env vars are missing during early dev.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('Supabase client not initialized. Check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

// Keep token cache in sync with auth state
if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.access_token && session?.expires_at) {
      setCachedToken(session.access_token, session.expires_at);
    } else {
      clearCachedToken();
    }
  });
}
