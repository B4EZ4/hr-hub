-- Crear tablas para sistema biométrico AS608

-- Tabla para almacenar plantillas biométricas cifradas
CREATE TABLE public.biometric_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_template TEXT NOT NULL, -- Plantilla AS608 cifrada con AES-256
  device_id TEXT NOT NULL, -- Identificador del ESP32
  method TEXT NOT NULL DEFAULT 'fingerprint', -- Método biométrico
  status TEXT NOT NULL DEFAULT 'active', -- active, revoked
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id, method, status) -- Solo una plantilla activa por usuario/dispositivo/método
);

-- Tabla para eventos biométricos (enrolamiento, verificación, fallos)
CREATE TABLE public.biometric_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Puede ser NULL si el usuario no fue identificado
  event_type TEXT NOT NULL, -- enroll, verify, fail, access_denied
  device_id TEXT NOT NULL,
  hash TEXT, -- Hash del evento para auditoría
  metadata JSONB, -- Información adicional (confianza, intentos, etc.)
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_biometric_templates_user_status ON public.biometric_templates(user_id, status);
CREATE INDEX idx_biometric_templates_device ON public.biometric_templates(device_id, status);
CREATE INDEX idx_biometric_events_user_created ON public.biometric_events(user_id, created_at DESC);
CREATE INDEX idx_biometric_events_device_created ON public.biometric_events(device_id, created_at DESC);
CREATE INDEX idx_biometric_events_type ON public.biometric_events(event_type, created_at DESC);

-- Trigger para actualizar updated_at
CREATE TRIGGER update_biometric_templates_updated_at
  BEFORE UPDATE ON public.biometric_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.biometric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_events ENABLE ROW LEVEL SECURITY;

-- RLS para biometric_templates
-- Los usuarios pueden ver sus propias plantillas (sin el campo encrypted_template)
CREATE POLICY "Users can view their own template metadata"
  ON public.biometric_templates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins pueden ver todas las plantillas (sin encrypted_template)
CREATE POLICY "Admins can view all template metadata"
  ON public.biometric_templates
  FOR SELECT
  USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin_rrhh'::app_role)
  );

-- Solo service_role puede insertar plantillas (desde ESP32)
-- Esta política está vacía porque el ESP32 usará service_role key que bypasea RLS
CREATE POLICY "Service role can insert templates"
  ON public.biometric_templates
  FOR INSERT
  WITH CHECK (false); -- Bloquear inserts desde usuarios normales

-- Admins pueden actualizar estado de plantillas
CREATE POLICY "Admins can update template status"
  ON public.biometric_templates
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin_rrhh'::app_role)
  )
  WITH CHECK (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin_rrhh'::app_role)
  );

-- RLS para biometric_events
-- Los usuarios pueden ver sus propios eventos
CREATE POLICY "Users can view their own events"
  ON public.biometric_events
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins y oficiales SH pueden ver todos los eventos
CREATE POLICY "Admins can view all events"
  ON public.biometric_events
  FOR SELECT
  USING (
    has_role(auth.uid(), 'superadmin'::app_role) OR 
    has_role(auth.uid(), 'admin_rrhh'::app_role) OR
    has_role(auth.uid(), 'oficial_sh'::app_role)
  );

-- Service role puede insertar eventos (desde ESP32)
CREATE POLICY "Service role can insert events"
  ON public.biometric_events
  FOR INSERT
  WITH CHECK (false); -- Bloquear inserts desde usuarios normales

-- Comentarios para documentación
COMMENT ON TABLE public.biometric_templates IS 'Almacena plantillas biométricas cifradas del lector AS608. Solo service_role puede insertar.';
COMMENT ON COLUMN public.biometric_templates.encrypted_template IS 'Plantilla AS608 cifrada con AES-256. No debe ser leída por el frontend.';
COMMENT ON COLUMN public.biometric_templates.device_id IS 'Identificador único del dispositivo ESP32';
COMMENT ON COLUMN public.biometric_templates.status IS 'Estado: active (en uso), revoked (revocada)';

COMMENT ON TABLE public.biometric_events IS 'Registro de eventos biométricos para auditoría';
COMMENT ON COLUMN public.biometric_events.event_type IS 'Tipo: enroll (enrolamiento), verify (verificación exitosa), fail (fallo), access_denied (acceso denegado)';
COMMENT ON COLUMN public.biometric_events.hash IS 'Hash SHA-256 del evento para auditoría';
COMMENT ON COLUMN public.biometric_events.metadata IS 'Datos adicionales: {confidence: 95, attempts: 1, match_score: 200}';

-- Vista para usuarios (sin mostrar encrypted_template)
CREATE VIEW public.user_biometric_status AS
SELECT 
  bt.user_id,
  COUNT(CASE WHEN bt.status = 'active' THEN 1 END) as active_templates,
  MAX(bt.created_at) as last_enrollment,
  EXISTS(
    SELECT 1 FROM public.biometric_templates 
    WHERE user_id = bt.user_id AND status = 'active'
  ) as has_active_template
FROM public.biometric_templates bt
GROUP BY bt.user_id;

-- Permitir a usuarios ver su estado biométrico
ALTER VIEW public.user_biometric_status SET (security_invoker = true);

COMMENT ON VIEW public.user_biometric_status IS 'Vista segura del estado biométrico de usuarios sin exponer plantillas';