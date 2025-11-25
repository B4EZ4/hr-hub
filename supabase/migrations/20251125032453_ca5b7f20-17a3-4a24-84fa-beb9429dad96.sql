
-- ========================================
-- CORRECCIÓN COMPLETA DE CONSTRAINTS EN MÓDULO SEGURIDAD E HIGIENE
-- ========================================

-- 1. ELIMINAR CONSTRAINTS INCORRECTOS EN inventory_items
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;
ALTER TABLE public.inventory_items DROP CONSTRAINT IF EXISTS inventory_items_status_check;

-- 2. VERIFICAR Y CORREGIR TABLAS RELACIONADAS
-- Asegurar que todas las tablas de S&H tienen las relaciones correctas

-- 3. AGREGAR COMENTARIOS A LAS TABLAS PARA DOCUMENTACIÓN
COMMENT ON TABLE public.inventory_items IS 'Inventario de artículos de Seguridad e Higiene (EPP, herramientas, equipos, limpieza, etc.)';
COMMENT ON COLUMN public.inventory_items.category IS 'Categoría: epp, herramienta, equipo, limpieza, otro';
COMMENT ON COLUMN public.inventory_items.status IS 'Estado: disponible, asignado, mantenimiento, baja';

COMMENT ON TABLE public.inventory_maintenance IS 'Registro de mantenimientos programados y completados';
COMMENT ON TABLE public.inventory_assignments IS 'Asignaciones de inventario a usuarios/empleados';
COMMENT ON TABLE public.inventory_movements IS 'Historial completo de movimientos de inventario';
COMMENT ON TABLE public.inventory_alerts IS 'Alertas automáticas de stock bajo, mantenimientos vencidos, etc.';

COMMENT ON TABLE public.sh_sectors IS 'Sectores de la planta/empresa para S&H';
COMMENT ON TABLE public.sh_inspections IS 'Inspecciones de seguridad programadas y completadas';
COMMENT ON TABLE public.sh_checklists IS 'Plantillas reutilizables de checklists para inspecciones';
COMMENT ON TABLE public.sh_area_evaluations IS 'Evaluaciones de áreas con puntajes de cumplimiento';

-- 4. VERIFICAR ÍNDICES CRÍTICOS EXISTEN
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON public.inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_status ON public.inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_inventory_items_stock ON public.inventory_items(stock_quantity, min_stock);

CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_status ON public.inventory_maintenance(status);
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_dates ON public.inventory_maintenance(scheduled_date, completed_date);

CREATE INDEX IF NOT EXISTS idx_inventory_assignments_status ON public.inventory_assignments(status);
CREATE INDEX IF NOT EXISTS idx_inventory_assignments_dates ON public.inventory_assignments(assigned_date, return_date);

CREATE INDEX IF NOT EXISTS idx_sh_inspections_status ON public.sh_inspections(status);
CREATE INDEX IF NOT EXISTS idx_sh_inspections_dates ON public.sh_inspections(scheduled_date, completed_date);

-- 5. ASEGURAR QUE inventory_alerts TIENE CONSTRAINT ÚNICO CORRECTO
-- Ya existe del migration anterior pero lo verificamos
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_alerts_active_unique 
ON public.inventory_alerts (item_id, alert_type)
WHERE is_resolved = false;
