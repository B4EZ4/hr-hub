-- Tabla para checklists reutilizables de S&H
CREATE TABLE IF NOT EXISTS public.sh_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('inspeccion', 'auditoria', 'epp', 'capacitacion', 'otro')),
  is_active BOOLEAN DEFAULT true,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para checklists
ALTER TABLE public.sh_checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos pueden ver checklists activos"
  ON public.sh_checklists
  FOR SELECT
  USING (is_active = true OR has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'oficial_sh'::app_role));

CREATE POLICY "Oficiales SH pueden gestionar checklists"
  ON public.sh_checklists
  FOR ALL
  USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'oficial_sh'::app_role));

-- Índice para búsquedas
CREATE INDEX idx_sh_checklists_category ON public.sh_checklists(category);
CREATE INDEX idx_sh_checklists_active ON public.sh_checklists(is_active);