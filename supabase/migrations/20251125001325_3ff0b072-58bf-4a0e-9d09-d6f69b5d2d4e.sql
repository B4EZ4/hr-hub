-- Crear tabla de despidos
CREATE TABLE IF NOT EXISTS public.despidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES auth.users(id),
  fecha_despido DATE NOT NULL,
  tipo_despido TEXT NOT NULL CHECK (tipo_despido IN ('voluntario', 'involuntario', 'mutuo_acuerdo', 'termino_contrato')),
  motivo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  indemnizacion NUMERIC,
  liquidacion_final NUMERIC,
  observaciones TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de documentos asociados a despidos
CREATE TABLE IF NOT EXISTS public.despido_documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  despido_id UUID NOT NULL REFERENCES public.despidos(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nombre_archivo TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de auditoría para despidos
CREATE TABLE IF NOT EXISTS public.despido_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  despido_id UUID NOT NULL REFERENCES public.despidos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de notificaciones para despidos (opcional)
CREATE TABLE IF NOT EXISTS public.despido_notificaciones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  despido_id UUID NOT NULL REFERENCES public.despidos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  tipo_notificacion TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_despidos_employee ON public.despidos(employee_id);
CREATE INDEX IF NOT EXISTS idx_despidos_estado ON public.despidos(estado);
CREATE INDEX IF NOT EXISTS idx_despidos_fecha ON public.despidos(fecha_despido);
CREATE INDEX IF NOT EXISTS idx_despido_documentos_despido ON public.despido_documentos(despido_id);
CREATE INDEX IF NOT EXISTS idx_despido_audit_despido ON public.despido_audit(despido_id);
CREATE INDEX IF NOT EXISTS idx_despido_notificaciones_user ON public.despido_notificaciones(user_id, leida);

-- Trigger para updated_at en despidos
CREATE OR REPLACE FUNCTION public.update_despidos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_despidos_timestamp
  BEFORE UPDATE ON public.despidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_despidos_updated_at();

-- RLS Policies para despidos
ALTER TABLE public.despidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despido_documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despido_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.despido_notificaciones ENABLE ROW LEVEL SECURITY;

-- Admins pueden gestionar todos los despidos
CREATE POLICY "Admins gestionar despidos" ON public.despidos
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role));

-- Empleados pueden ver sus propios despidos
CREATE POLICY "Empleados ver propio despido" ON public.despidos
  FOR SELECT
  USING (auth.uid() = employee_id);

-- Admins pueden gestionar documentos de despidos
CREATE POLICY "Admins gestionar documentos despidos" ON public.despido_documentos
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role));

-- Empleados pueden ver documentos de su despido
CREATE POLICY "Empleados ver documentos propio despido" ON public.despido_documentos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.despidos 
      WHERE despidos.id = despido_documentos.despido_id 
      AND despidos.employee_id = auth.uid()
    )
  );

-- Auditors y admins pueden ver auditoría
CREATE POLICY "Auditors ver despido audit" ON public.despido_audit
  FOR SELECT
  USING (has_role(auth.uid(), 'auditor'::app_role) OR has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role));

-- Sistema puede insertar en auditoría
CREATE POLICY "Sistema insertar despido audit" ON public.despido_audit
  FOR INSERT
  WITH CHECK (true);

-- Usuarios pueden ver y actualizar sus propias notificaciones
CREATE POLICY "Ver propias notificaciones despidos" ON public.despido_notificaciones
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Actualizar propias notificaciones despidos" ON public.despido_notificaciones
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins pueden crear notificaciones
CREATE POLICY "Admins crear notificaciones despidos" ON public.despido_notificaciones
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role));

-- Crear bucket de storage para despidos si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('despidos', 'despidos', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para despidos
CREATE POLICY "Admins pueden subir documentos despidos" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'despidos' AND
    (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role))
  );

CREATE POLICY "Admins pueden ver documentos despidos" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'despidos' AND
    (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role))
  );

CREATE POLICY "Empleados pueden ver sus documentos despidos" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'despidos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins pueden eliminar documentos despidos" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'despidos' AND
    (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role))
  );