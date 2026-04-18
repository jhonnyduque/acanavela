import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase no está configurado correctamente');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);