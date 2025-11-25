-- =====================================================
-- MIGRACIÓN: Sistema de autenticación completamente custom (PARTE 1)
-- Crear tabla users y migrar datos existentes
-- =====================================================

-- 1. Crear tabla de usuarios propia
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  department TEXT,
  position TEXT,
  status TEXT NOT NULL DEFAULT 'activo',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_locked BOOLEAN NOT NULL DEFAULT false,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  last_login_at TIMESTAMP WITH TIME ZONE,
  password_reset_token TEXT,
  password_reset_expires_at TIMESTAMP WITH TIME ZONE,
  verification_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Migrar usuarios existentes PRIMERO (antes de cambiar foreign keys)
INSERT INTO public.users (id, email, full_name, phone, department, position, status, is_verified, created_at, password_hash)
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.phone,
  p.department,
  p.position,
  COALESCE(p.status, 'activo'),
  true, 
  COALESCE(p.created_at, now()),
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36W3AEUD7U5aPgB.e7Lz1em' -- password: "temp123" - deben cambiar
FROM public.profiles p
ON CONFLICT (id) DO NOTHING;

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON public.users(verification_token) WHERE verification_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON public.users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- 4. Trigger para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. AHORA SÍ actualizar user_roles para referenciar nueva tabla
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles 
  ADD CONSTRAINT user_roles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

COMMENT ON TABLE public.users IS 'Tabla principal de usuarios - gestión completa en BD (no usa auth.users)';