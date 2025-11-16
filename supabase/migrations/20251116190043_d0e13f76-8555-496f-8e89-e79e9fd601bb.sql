-- Tabla para evaluaciones de áreas
CREATE TABLE IF NOT EXISTS public.sh_area_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id UUID REFERENCES public.sh_sectors(id) ON DELETE CASCADE NOT NULL,
  evaluated_by UUID NOT NULL,
  evaluation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Criterios de evaluación (escala 0-100)
  cleanliness_score INTEGER CHECK (cleanliness_score >= 0 AND cleanliness_score <= 100),
  order_score INTEGER CHECK (order_score >= 0 AND order_score <= 100),
  ventilation_score INTEGER CHECK (ventilation_score >= 0 AND ventilation_score <= 100),
  lighting_score INTEGER CHECK (lighting_score >= 0 AND lighting_score <= 100),
  ergonomics_score INTEGER CHECK (ergonomics_score >= 0 AND ergonomics_score <= 100),
  risk_control_score INTEGER CHECK (risk_control_score >= 0 AND risk_control_score <= 100),
  furniture_condition_score INTEGER CHECK (furniture_condition_score >= 0 AND furniture_condition_score <= 100),
  tools_condition_score INTEGER CHECK (tools_condition_score >= 0 AND tools_condition_score <= 100),
  hazmat_control_score INTEGER CHECK (hazmat_control_score >= 0 AND hazmat_control_score <= 100),
  signage_score INTEGER CHECK (signage_score >= 0 AND signage_score <= 100),
  compliance_score INTEGER CHECK (compliance_score >= 0 AND compliance_score <= 100),
  
  total_score INTEGER GENERATED ALWAYS AS (
    COALESCE(cleanliness_score, 0) + 
    COALESCE(order_score, 0) + 
    COALESCE(ventilation_score, 0) + 
    COALESCE(lighting_score, 0) + 
    COALESCE(ergonomics_score, 0) + 
    COALESCE(risk_control_score, 0) + 
    COALESCE(furniture_condition_score, 0) + 
    COALESCE(tools_condition_score, 0) + 
    COALESCE(hazmat_control_score, 0) + 
    COALESCE(signage_score, 0) + 
    COALESCE(compliance_score, 0)
  ) STORED,
  
  average_score INTEGER GENERATED ALWAYS AS (
    (COALESCE(cleanliness_score, 0) + 
    COALESCE(order_score, 0) + 
    COALESCE(ventilation_score, 0) + 
    COALESCE(lighting_score, 0) + 
    COALESCE(ergonomics_score, 0) + 
    COALESCE(risk_control_score, 0) + 
    COALESCE(furniture_condition_score, 0) + 
    COALESCE(tools_condition_score, 0) + 
    COALESCE(hazmat_control_score, 0) + 
    COALESCE(signage_score, 0) + 
    COALESCE(compliance_score, 0)) / 11
  ) STORED,
  
  observations TEXT,
  recommendations TEXT,
  file_paths TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para estados de ítems de inventario
CREATE TABLE IF NOT EXISTS public.inventory_item_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('nuevo', 'bueno', 'aceptable', 'desgastado', 'danado', 'en_reparacion', 'dado_de_baja')),
  previous_state TEXT,
  changed_by UUID NOT NULL,
  change_reason TEXT,
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para mantenimientos de inventario
CREATE TABLE IF NOT EXISTS public.inventory_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT NOT NULL CHECK (maintenance_type IN ('preventivo', 'correctivo', 'calibracion', 'limpieza', 'otro')),
  scheduled_date DATE,
  completed_date DATE,
  performed_by UUID,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  description TEXT,
  observations TEXT,
  cost NUMERIC(10, 2),
  file_paths TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para registro detallado de entregas/devoluciones
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  assignment_id UUID REFERENCES public.inventory_assignments(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'asignacion', 'devolucion', 'ajuste', 'baja')),
  quantity INTEGER NOT NULL,
  user_id UUID,
  
  condition_before TEXT CHECK (condition_before IN ('nuevo', 'bueno', 'aceptable', 'desgastado', 'danado')),
  condition_after TEXT CHECK (condition_after IN ('nuevo', 'bueno', 'aceptable', 'desgastado', 'danado', 'perdido')),
  
  damage_description TEXT,
  observations TEXT,
  file_paths TEXT[],
  
  authorized_by UUID,
  movement_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para alertas de inventario
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('stock_bajo', 'caducidad_proxima', 'mantenimiento_pendiente', 'revision_requerida')),
  severity TEXT NOT NULL CHECK (severity IN ('baja', 'media', 'alta', 'critica')),
  title TEXT NOT NULL,
  description TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabla para progreso de inspecciones
CREATE TABLE IF NOT EXISTS public.inspection_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.sh_inspections(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  approved_items INTEGER DEFAULT 0,
  rejected_items INTEGER DEFAULT 0,
  pending_items INTEGER DEFAULT 0,
  completion_percentage INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN total_items > 0 THEN (completed_items * 100) / total_items
      ELSE 0
    END
  ) STORED,
  approval_percentage INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN completed_items > 0 THEN (approved_items * 100) / completed_items
      ELSE 0
    END
  ) STORED,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_area_evaluations_sector ON public.sh_area_evaluations(sector_id);
CREATE INDEX IF NOT EXISTS idx_area_evaluations_date ON public.sh_area_evaluations(evaluation_date);
CREATE INDEX IF NOT EXISTS idx_item_states_item ON public.inventory_item_states(item_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_item ON public.inventory_maintenance(item_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.inventory_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_movements_item ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_movements_type ON public.inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_alerts_item ON public.inventory_alerts(item_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.inventory_alerts(is_resolved);

-- Triggers para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sh_area_evaluations_updated_at BEFORE UPDATE ON public.sh_area_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_maintenance_updated_at BEFORE UPDATE ON public.inventory_maintenance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspection_progress_updated_at BEFORE UPDATE ON public.inspection_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.sh_area_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_item_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_progress ENABLE ROW LEVEL SECURITY;

-- Políticas para evaluaciones de áreas
CREATE POLICY "SH officials can manage area evaluations" ON public.sh_area_evaluations
  FOR ALL USING (has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Everyone can view area evaluations" ON public.sh_area_evaluations
  FOR SELECT USING (true);

-- Políticas para estados de inventario
CREATE POLICY "SH officials can manage item states" ON public.inventory_item_states
  FOR ALL USING (has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "Everyone can view item states" ON public.inventory_item_states
  FOR SELECT USING (true);

-- Políticas para mantenimientos
CREATE POLICY "SH officials can manage maintenance" ON public.inventory_maintenance
  FOR ALL USING (has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "Everyone can view maintenance" ON public.inventory_maintenance
  FOR SELECT USING (true);

-- Políticas para movimientos
CREATE POLICY "Admins can manage movements" ON public.inventory_movements
  FOR ALL USING (has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "Users can view their own movements" ON public.inventory_movements
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

-- Políticas para alertas
CREATE POLICY "Admins can manage alerts" ON public.inventory_alerts
  FOR ALL USING (has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "Everyone can view alerts" ON public.inventory_alerts
  FOR SELECT USING (true);

-- Políticas para progreso de inspecciones
CREATE POLICY "SH officials can manage progress" ON public.inspection_progress
  FOR ALL USING (has_role(auth.uid(), 'oficial_sh') OR has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Everyone can view progress" ON public.inspection_progress
  FOR SELECT USING (true);