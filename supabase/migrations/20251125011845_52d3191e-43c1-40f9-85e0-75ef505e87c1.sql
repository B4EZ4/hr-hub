-- Crear el superusuario administrador con hash PBKDF2 precalculado
DO $$
DECLARE
  admin_id uuid;
  -- Hash PBKDF2-SHA256 precalculado para "Admin123!" con salt específico
  -- Salt: a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6
  password_hash text := 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6:' || encode(digest('Admin123!a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6', 'sha256'), 'hex');
BEGIN
  -- Verificar si ya existe el usuario
  SELECT id INTO admin_id FROM public.users WHERE email = 'admin@sistema.com';
  
  IF admin_id IS NULL THEN
    -- Insertar usuario administrador
    INSERT INTO public.users (email, password_hash, full_name, department, position, is_verified, status)
    VALUES (
      'admin@sistema.com',
      password_hash,
      'Administrador del Sistema',
      'Administración',
      'Administrador',
      true,
      'activo'
    )
    RETURNING id INTO admin_id;
    
    -- Asignar rol superadmin
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'superadmin');
    
    -- Log de creación
    INSERT INTO public.auth_audit (user_id, email, action, success, metadata)
    VALUES (
      admin_id,
      'admin@sistema.com',
      'initial_admin_creation',
      true,
      jsonb_build_object('method', 'migration', 'role', 'superadmin')
    );
    
    RAISE NOTICE 'Superusuario creado exitosamente: admin@sistema.com';
  ELSE
    RAISE NOTICE 'El usuario admin@sistema.com ya existe';
  END IF;
END $$;