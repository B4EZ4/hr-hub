-- Crear función RPC para obtener usuarios (valida token y devuelve usuarios)
CREATE OR REPLACE FUNCTION public.get_all_users(session_token TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  full_name TEXT,
  phone TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  -- Validar token y obtener user_id
  SELECT user_id INTO current_user_id
  FROM public.user_sessions
  WHERE token = session_token
    AND expires_at > now();
  
  -- Si no hay sesión válida, error
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session token';
  END IF;
  
  -- Verificar que el usuario es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id AND role = 'superadmin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: only superadmin can view users';
  END IF;
  
  -- Devolver usuarios con sus roles
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.username,
    u.full_name,
    u.phone,
    u.status,
    u.created_at,
    u.updated_at,
    u.last_login_at,
    COALESCE(ur.role::TEXT, 'admin_rrhh') as role
  FROM public.users u
  LEFT JOIN public.user_roles ur ON ur.user_id = u.id
  ORDER BY u.created_at DESC;
END;
$$;