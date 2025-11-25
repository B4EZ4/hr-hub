-- Drop políticas incorrectas que usan auth.uid()
DROP POLICY IF EXISTS "Superadmin pueden ver todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Superadmin pueden crear usuarios" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Superadmin pueden ver roles de usuarios" ON public.user_roles;

-- Políticas para public.users usando get_current_user_id()
CREATE POLICY "Superadmin pueden ver todos los usuarios"
ON public.users
FOR SELECT
USING (public.has_role(get_current_user_id(), 'superadmin'));

CREATE POLICY "Superadmin pueden crear usuarios"
ON public.users
FOR INSERT
WITH CHECK (public.has_role(get_current_user_id(), 'superadmin'));

CREATE POLICY "Superadmin pueden actualizar usuarios"
ON public.users
FOR UPDATE
USING (public.has_role(get_current_user_id(), 'superadmin'));

CREATE POLICY "Usuarios pueden ver su propio perfil"
ON public.users
FOR SELECT
USING (id = get_current_user_id());

-- Políticas para public.user_roles usando get_current_user_id()
CREATE POLICY "Superadmin pueden ver todos los roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(get_current_user_id(), 'superadmin'));

CREATE POLICY "Usuarios pueden ver su propio rol"
ON public.user_roles
FOR SELECT
USING (user_id = get_current_user_id());