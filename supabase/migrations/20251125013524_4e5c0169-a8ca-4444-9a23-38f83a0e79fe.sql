-- Permitir a superadmin ver todos los usuarios del sistema
CREATE POLICY "Superadmin pueden ver todos los usuarios"
ON public.users
FOR SELECT
TO public
USING (
  public.has_role(get_current_user_id(), 'superadmin'::app_role)
);

-- Permitir a superadmin insertar usuarios (necesario para el signup desde la interfaz)
CREATE POLICY "Superadmin pueden crear usuarios"
ON public.users
FOR INSERT
TO public
WITH CHECK (
  public.has_role(get_current_user_id(), 'superadmin'::app_role)
);