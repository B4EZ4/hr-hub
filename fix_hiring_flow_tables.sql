-- ==============================================================================
-- ==============================================================================
-- CORRECCIÓN DE TABLAS PARA FLUJO DE CONTRATACIÓN
-- Tablas: profiles, user_roles, vacation_balances
-- Objetivo: Corregir FKs hacia public.users y actualizar RLS para custom auth
-- ==============================================================================

-- 1. TABLA: profiles
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Corregir FK
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Nuevas Políticas
-- 1. Ver perfiles: Usuarios ven el suyo, Admins ven todos
CREATE POLICY "Users view own profile_custom"
ON public.profiles FOR SELECT
USING (
    user_id = get_current_user_id() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);

-- 2. Actualizar perfiles: Usuarios el suyo, Admins todos
CREATE POLICY "Users update own profile_custom"
ON public.profiles FOR UPDATE
USING (
    user_id = get_current_user_id() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);

-- 3. Insertar perfiles: Admins pueden crear perfiles (para contratación)
CREATE POLICY "Admins insert profiles_custom"
ON public.profiles FOR INSERT
WITH CHECK (
    -- Permitir si es el mismo usuario (registro) o si es admin
    user_id = get_current_user_id() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);


-- 2. TABLA: user_roles
-- ==============================================================================
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Corregir FK
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;
ALTER TABLE public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Nuevas Políticas
-- 1. Ver roles: Usuario ve el suyo, Admins ven todos
CREATE POLICY "Read roles_custom"
ON public.user_roles FOR SELECT
USING (
    user_id = get_current_user_id() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);

-- 2. Gestionar roles: Solo Admins
CREATE POLICY "Admins manage roles_custom"
ON public.user_roles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);


-- 3. TABLA: vacation_balances (La del error)
-- ==============================================================================
ALTER TABLE public.vacation_balances ENABLE ROW LEVEL SECURITY;

-- Corregir FK
ALTER TABLE public.vacation_balances DROP CONSTRAINT IF EXISTS vacation_balances_user_id_fkey;
ALTER TABLE public.vacation_balances
    ADD CONSTRAINT vacation_balances_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE;

-- Eliminar políticas viejas
DROP POLICY IF EXISTS "Actualizar Vacaciones Publico" ON public.vacation_balances;
DROP POLICY IF EXISTS "Insertar Vacaciones Publico" ON public.vacation_balances;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados en vacaciones" ON public.vacation_balances;
DROP POLICY IF EXISTS "Ver Vacaciones Publico" ON public.vacation_balances;

-- Nuevas Políticas
-- 1. Ver balances: Usuario ve el suyo, Admins ven todos
CREATE POLICY "Read vacation balances_custom"
ON public.vacation_balances FOR SELECT
USING (
    user_id = get_current_user_id() OR
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);

-- 2. Gestionar balances: Solo Admins (para inicializar o corregir)
CREATE POLICY "Admins manage vacation balances_custom"
ON public.vacation_balances FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = get_current_user_id()
          AND role IN ('superadmin', 'admin_rrhh')
    )
);
