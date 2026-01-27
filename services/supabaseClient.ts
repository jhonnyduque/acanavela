import { createClient } from '@supabase/supabase-js';

// Intentamos obtener las variables de entorno de múltiples fuentes posibles en este entorno
const env = (typeof process !== 'undefined' && process.env) ? process.env : (import.meta as any).env || {};

// Buscamos con y sin el prefijo VITE_ para mayor compatibilidad
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || '';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ ERROR DE CONFIGURACIÓN:\n' +
    'No se han encontrado las credenciales de Supabase.\n' +
    'Por favor, asegúrate de configurar las variables de entorno:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY'
  );
}

// Inicializamos el cliente. 
// Si no hay URL, se usa una cadena vacía para evitar que intente resolver "placeholder.supabase.co"
export const supabase = createClient(
  supabaseUrl || 'https://missing-url.supabase.co', 
  supabaseAnonKey || 'missing-key'
);