// Wrapper del cliente de Supabase que incluye automáticamente el header x-session-token
import { supabase as originalSupabase } from '@/integrations/supabase/client';
import { getSessionToken } from './auth';

// Crear un Proxy que intercepte todas las llamadas y añada el header
export const supabase = new Proxy(originalSupabase, {
  get(target, prop) {
    const value = (target as any)[prop];
    
    // Si es una función (método), la envolvemos para añadir el token
    if (typeof value === 'function') {
      return function(...args: any[]) {
        // Para métodos que crean queries (.from(), .rpc(), etc)
        const result = value.apply(target, args);
        
        // Si el resultado tiene métodos de query, lo envolvemos recursivamente
        if (result && typeof result === 'object') {
          return addAuthHeaders(result);
        }
        
        return result;
      };
    }
    
    return value;
  }
});

// Función recursiva para añadir headers a las queries
function addAuthHeaders(query: any): any {
  return new Proxy(query, {
    get(target, prop) {
      const value = target[prop];
      
      if (typeof value === 'function') {
        return function(...args: any[]) {
          const result = value.apply(target, args);
          
          // Cuando se ejecuta la query (then, catch, etc), añadimos el header
          if (prop === 'then' || prop === 'catch' || prop === 'finally') {
            const token = getSessionToken();
            if (token && target.headers) {
              target.headers['x-session-token'] = token;
            }
          }
          
          // Seguir envolviendo si es necesario
          if (result && typeof result === 'object' && result !== target) {
            return addAuthHeaders(result);
          }
          
          return result;
        };
      }
      
      return value;
    }
  });
}

// Export original para casos especiales donde se necesite sin auth
export { originalSupabase };
