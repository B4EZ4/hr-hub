-- Función para eliminar usuario con validaciones de seguridad
CREATE OR REPLACE FUNCTION public.delete_user_safe(
  session_token TEXT,
  user_id_to_delete UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  target_user_role TEXT;
  superadmin_count INTEGER;
  result JSON;
BEGIN
  -- Validar sesión y obtener usuario actual
  SELECT user_id INTO current_user_id
  FROM public.user_sessions
  WHERE token = session_token
    AND expires_at > now();
  
  IF current_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Sesión inválida o expirada'
    );
  END IF;
  
  -- Verificar que el usuario actual es superadmin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = current_user_id AND role = 'superadmin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No autorizado: solo superadmin puede eliminar usuarios'
    );
  END IF;
  
  -- Verificar que no se está eliminando a sí mismo
  IF current_user_id = user_id_to_delete THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No puedes eliminarte a ti mismo'
    );
  END IF;
  
  -- Obtener el rol del usuario a eliminar
  SELECT role::TEXT INTO target_user_role
  FROM public.user_roles
  WHERE user_id = user_id_to_delete
  LIMIT 1;
  
  -- Si es superadmin, verificar que quede al menos otro
  IF target_user_role = 'superadmin' THEN
    SELECT COUNT(*) INTO superadmin_count
    FROM public.user_roles
    WHERE role = 'superadmin';
    
    IF superadmin_count <= 1 THEN
      RETURN json_build_object(
        'success', false,
        'error', 'No se puede eliminar el último superadmin del sistema'
      );
    END IF;
  END IF;
  
  -- Eliminar el usuario (CASCADE eliminará roles y sesiones)
  DELETE FROM public.users WHERE id = user_id_to_delete;
  
  -- Registrar en auditoría
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    old_values
  ) VALUES (
    current_user_id,
    'DELETE',
    'users',
    user_id_to_delete,
    json_build_object('deleted_by', current_user_id, 'deleted_at', now())
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuario eliminado exitosamente'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;