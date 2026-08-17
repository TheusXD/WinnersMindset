import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Keep the session only for the lifetime of the browser tab/window.
    // sessionStorage (unlike the default localStorage) is cleared when the
    // browser closes, so every new browser session requires logging in
    // again instead of staying signed in indefinitely.
    ...(typeof window !== 'undefined' ? { storage: window.sessionStorage } : {}),
  },
});
