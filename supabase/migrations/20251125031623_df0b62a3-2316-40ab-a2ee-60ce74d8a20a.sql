-- Corregir todas las relaciones en el módulo de Seguridad e Higiene

-- 1. Agregar foreign keys faltantes en inventory_maintenance
ALTER TABLE public.inventory_maintenance
DROP CONSTRAINT IF EXISTS inventory_maintenance_performed_by_fkey;

ALTER TABLE public.inventory_maintenance
ADD CONSTRAINT inventory_maintenance_performed_by_fkey
FOREIGN KEY (performed_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 2. Agregar índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_performed_by ON public.inventory_maintenance(performed_by);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_item_id ON public.inventory_maintenance(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_status ON public.inventory_maintenance(status);

CREATE INDEX IF NOT EXISTS idx_inventory_assignments_user_id ON public.inventory_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_assignments_item_id ON public.inventory_assignments(item_id);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_item_id ON public.inventory_movements(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_id ON public.inventory_movements(user_id);

CREATE INDEX IF NOT EXISTS idx_sh_area_evaluations_sector_id ON public.sh_area_evaluations(sector_id);
CREATE INDEX IF NOT EXISTS idx_sh_area_evaluations_evaluated_by ON public.sh_area_evaluations(evaluated_by);

CREATE INDEX IF NOT EXISTS idx_sh_inspections_sector_id ON public.sh_inspections(sector_id);
CREATE INDEX IF NOT EXISTS idx_sh_inspections_inspector_id ON public.sh_inspections(inspector_id);

-- 3. Corregir la foreign key en inventory_movements para authorized_by
ALTER TABLE public.inventory_movements
DROP CONSTRAINT IF EXISTS inventory_movements_authorized_by_fkey;

ALTER TABLE public.inventory_movements
ADD CONSTRAINT inventory_movements_authorized_by_fkey
FOREIGN KEY (authorized_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

ALTER TABLE public.inventory_movements
DROP CONSTRAINT IF EXISTS inventory_movements_user_id_fkey;

ALTER TABLE public.inventory_movements
ADD CONSTRAINT inventory_movements_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE SET NULL;

-- 4. Corregir inventory_assignments
ALTER TABLE public.inventory_assignments
DROP CONSTRAINT IF EXISTS inventory_assignments_user_id_fkey;

ALTER TABLE public.inventory_assignments
ADD CONSTRAINT inventory_assignments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- 5. Agregar foreign key para inventory_alerts resolved_by
ALTER TABLE public.inventory_alerts
DROP CONSTRAINT IF EXISTS inventory_alerts_resolved_by_fkey;

ALTER TABLE public.inventory_alerts
ADD CONSTRAINT inventory_alerts_resolved_by_fkey
FOREIGN KEY (resolved_by) REFERENCES public.profiles(user_id) ON DELETE SET NULL;