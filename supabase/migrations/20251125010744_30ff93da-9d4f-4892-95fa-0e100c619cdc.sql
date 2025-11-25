-- Agregar default gen_random_uuid() a la columna id de users
ALTER TABLE public.users 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Guardar roles existentes temporalmente
CREATE TEMP TABLE temp_user_roles AS
SELECT user_id, role::text as role_text
FROM public.user_roles
WHERE role::text IN ('superadmin', 'admin_rrhh');

-- Eliminar la tabla user_roles
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- Eliminar y recrear el enum
DROP TYPE IF EXISTS public.app_role CASCADE;
CREATE TYPE public.app_role AS ENUM ('superadmin', 'admin_rrhh');

-- Recrear tabla user_roles
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para user_roles
CREATE POLICY "Superadmin full access on user_roles"
ON public.user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = get_current_user_id()
    AND ur.role = 'superadmin'
  )
);

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = get_current_user_id());

-- Restaurar roles válidos
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, role_text::app_role
FROM temp_user_roles;

-- Recrear función has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Crear usuario administrador inicial
INSERT INTO public.users (
  email,
  password_hash,
  full_name,
  status,
  is_verified,
  is_locked
) VALUES (
  'admin@sistema.com',
  '$2a$10$YQZ3qKJ9XvPZKJ.8fMF3uOXxQ5vGKZH5J7yQF9mKLnPZxQ5vGKZH5',
  'Administrador del Sistema',
  'activo',
  true,
  false
) ON CONFLICT (email) DO NOTHING;

-- Asignar rol superadmin al usuario inicial
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'superadmin'::app_role
FROM public.users
WHERE email = 'admin@sistema.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Función auxiliar para verificar si un usuario es del sistema
CREATE OR REPLACE FUNCTION public.is_system_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('superadmin', 'admin_rrhh')
  )
$$;