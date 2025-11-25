-- =====================================================
-- MIGRACIÓN: Sistema de autenticación custom (PARTE 2)
-- RLS policies, sesiones y auditoría
-- =====================================================

-- 1. Habilitar RLS en tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Crear tabla de sesiones
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS public.auth_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  email TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_user_id ON public.auth_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_audit_action ON public.auth_audit(action);
CREATE INDEX IF NOT EXISTS idx_auth_audit_created_at ON public.auth_audit(created_at);

ALTER TABLE public.auth_audit ENABLE ROW LEVEL SECURITY;

-- 4. Función para obtener user_id desde token en header
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  session_token TEXT;
  user_id_result UUID;
BEGIN
  -- Intentar obtener token del header personalizado
  session_token := current_setting('request.headers', true)::json->>'x-session-token';
  
  IF session_token IS NULL OR session_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Buscar sesión válida y actualizar last_active
  UPDATE public.user_sessions
  SET last_active_at = now()
  WHERE token = session_token
    AND expires_at > now()
  RETURNING user_id INTO user_id_result;
    
  RETURN user_id_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

-- 5. RLS Policies para tabla users
-- Usuarios pueden ver su propio perfil
CREATE POLICY "Users view own profile"
  ON public.users
  FOR SELECT
  USING (id = public.get_current_user_id());

-- Usuarios pueden actualizar su perfil (campos no sensibles)
CREATE POLICY "Users update own profile"
  ON public.users
  FOR UPDATE
  USING (id = public.get_current_user_id())
  WITH CHECK (
    id = public.get_current_user_id() AND
    email = (SELECT email FROM public.users WHERE id = public.get_current_user_id())
  );

-- Admins ven todos los usuarios
CREATE POLICY "Admins view all users"
  ON public.users
  FOR SELECT
  USING (
    public.has_role(public.get_current_user_id(), 'superadmin') OR
    public.has_role(public.get_current_user_id(), 'admin_rrhh')
  );

-- Admins crean usuarios
CREATE POLICY "Admins create users"
  ON public.users
  FOR INSERT
  WITH CHECK (
    public.has_role(public.get_current_user_id(), 'superadmin') OR
    public.has_role(public.get_current_user_id(), 'admin_rrhh')
  );

-- Admins actualizan usuarios
CREATE POLICY "Admins update users"
  ON public.users
  FOR UPDATE
  USING (
    public.has_role(public.get_current_user_id(), 'superadmin') OR
    public.has_role(public.get_current_user_id(), 'admin_rrhh')
  );

-- Superadmins eliminan usuarios
CREATE POLICY "Superadmins delete users"
  ON public.users
  FOR DELETE
  USING (public.has_role(public.get_current_user_id(), 'superadmin'));

-- 6. RLS Policies para sesiones
CREATE POLICY "Users view own sessions"
  ON public.user_sessions
  FOR SELECT
  USING (user_id = public.get_current_user_id());

CREATE POLICY "Service manages sessions"
  ON public.user_sessions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 7. RLS Policies para auditoría
CREATE POLICY "Users view own audit"
  ON public.auth_audit
  FOR SELECT
  USING (user_id = public.get_current_user_id());

CREATE POLICY "Admins view all audit"
  ON public.auth_audit
  FOR SELECT
  USING (
    public.has_role(public.get_current_user_id(), 'superadmin') OR
    public.has_role(public.get_current_user_id(), 'auditor')
  );

CREATE POLICY "Service inserts audit"
  ON public.auth_audit
  FOR INSERT
  WITH CHECK (true);

-- 8. Función de limpieza de sesiones
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.get_current_user_id() IS 'Obtiene user_id desde token en header x-session-token';
COMMENT ON FUNCTION public.cleanup_expired_sessions() IS 'Limpia sesiones expiradas (retorna cantidad eliminada)';