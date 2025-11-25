
-- ========================================
-- ELIMINAR TODOS LOS CONSTRAINTS CHECK PROBLEMÁTICOS EN MÓDULO S&H
-- ========================================

-- inventory_alerts: Los constraints están OK, son usados por triggers automáticos
-- NO los eliminamos

-- inventory_assignments
ALTER TABLE public.inventory_assignments DROP CONSTRAINT IF EXISTS inventory_assignments_status_check;

-- inventory_maintenance  
ALTER TABLE public.inventory_maintenance DROP CONSTRAINT IF EXISTS inventory_maintenance_maintenance_type_check;
ALTER TABLE public.inventory_maintenance DROP CONSTRAINT IF EXISTS inventory_maintenance_status_check;

-- inventory_movements
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check;
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_condition_before_check;
ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_condition_after_check;

-- sh_sectors
ALTER TABLE public.sh_sectors DROP CONSTRAINT IF EXISTS sh_sectors_risk_level_check;

-- sh_inspections
ALTER TABLE public.sh_inspections DROP CONSTRAINT IF EXISTS sh_inspections_status_check;

-- sh_checklists
ALTER TABLE public.sh_checklists DROP CONSTRAINT IF EXISTS sh_checklists_category_check;

-- sh_area_evaluations: Los constraints de score (0-100) son válidos y útiles
-- NO los eliminamos

-- ========================================
-- ACTUALIZAR DOCUMENTACIÓN
-- ========================================
COMMENT ON COLUMN public.inventory_assignments.status IS 'Estado: asignado, devuelto, perdido, dañado';
COMMENT ON COLUMN public.inventory_maintenance.maintenance_type IS 'Tipo: preventivo, correctivo, calibracion, limpieza, otro';
COMMENT ON COLUMN public.inventory_maintenance.status IS 'Estado: pendiente, en_proceso, completado, cancelado';
COMMENT ON COLUMN public.inventory_movements.movement_type IS 'Tipo: entrada, salida, asignacion, devolucion, ajuste, baja';
COMMENT ON COLUMN public.inventory_movements.condition_before IS 'Condición antes: nuevo, bueno, aceptable, desgastado, danado';
COMMENT ON COLUMN public.inventory_movements.condition_after IS 'Condición después: nuevo, bueno, aceptable, desgastado, danado, perdido';
COMMENT ON COLUMN public.sh_sectors.risk_level IS 'Nivel de riesgo: bajo, medio, alto, muy_alto';
COMMENT ON COLUMN public.sh_inspections.status IS 'Estado: programada, en_progreso, completada, cancelada';
COMMENT ON COLUMN public.sh_checklists.category IS 'Categoría: inspeccion, auditoria, epp, capacitacion, otro';
