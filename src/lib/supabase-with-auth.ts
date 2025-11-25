// Wrapper del cliente de Supabase que incluye automáticamente el header x-session-token
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { getSessionToken } from './auth';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Crear cliente personalizado que siempre incluye el token de sesión
export const supabase: SupabaseClient<Database> = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'x-session-token': getSessionToken() || '',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      headers: {
        'x-session-token': getSessionToken() || '',
      },
    },
  }
);

// Función helper para actualizar el token en requests
export const getSupabaseWithAuth = () => {
  const token = getSessionToken();
  if (token) {
    (supabase as any).rest.headers['x-session-token'] = token;
  }
  return supabase;
};
