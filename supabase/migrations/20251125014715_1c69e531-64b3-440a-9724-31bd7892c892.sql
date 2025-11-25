-- Desactivar RLS en users y user_roles para permitir consultas directas
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas
DROP POLICY IF EXISTS "Superadmin pueden ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Superadmin pueden crear usuarios" ON public.users;
DROP POLICY IF EXISTS "Superadmin pueden actualizar usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Superadmin pueden ver todos los roles" ON public.user_roles;
DROP POLICY IF EXISTS "Usuarios pueden ver su propio rol" ON public.user_roles;