import { createClient } from '@supabase/supabase-js';

const supabase_url = import.meta.env.VITE_SUPABASE_URL;
const supabase_anon_key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export function is_supabase_configured() {
  return Boolean(supabase_url && supabase_anon_key);
}

export const supabase = is_supabase_configured()
  ? createClient(supabase_url, supabase_anon_key)
  : null;
