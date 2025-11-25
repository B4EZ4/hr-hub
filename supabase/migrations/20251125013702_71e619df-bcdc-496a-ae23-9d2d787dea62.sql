-- Permitir a superadmin ver los roles de todos los usuarios
CREATE POLICY "Superadmin pueden ver roles de usuarios"
ON public.user_roles
FOR SELECT
TO public
USING (
  public.has_role(get_current_user_id(), 'superadmin'::app_role)
);