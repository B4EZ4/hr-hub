-- Agregar campo username a la tabla users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Crear índice para búsquedas rápidas por username
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- Actualizar el usuario admin existente con un username
UPDATE public.users 
SET username = 'admin' 
WHERE email = 'admin@sistema.com' AND username IS NULL;