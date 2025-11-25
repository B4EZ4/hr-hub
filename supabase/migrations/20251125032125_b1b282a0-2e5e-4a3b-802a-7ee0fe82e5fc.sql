-- Asegurar que todas las relaciones en Seguridad e Higiene sean opcionales donde corresponda
-- Esto evita errores de constraints cuando no hay usuario asignado

-- 1. Hacer campos de usuario nullable en inventory_movements si aún no lo son
ALTER TABLE public.inventory_movements 
ALTER COLUMN user_id DROP NOT NULL,
ALTER COLUMN authorized_by DROP NOT NULL;

-- 2. Hacer performed_by nullable en inventory_maintenance si aún no lo es  
ALTER TABLE public.inventory_maintenance
ALTER COLUMN performed_by DROP NOT NULL;

-- 3. Verificar que inventory_items no tiene restricciones problemáticas
-- (Esta tabla no tiene foreign keys a usuarios, así que debería estar bien)

-- 4. Crear índice compuesto para mejorar queries de asignaciones
CREATE INDEX IF NOT EXISTS idx_inventory_assignments_user_item 
ON public.inventory_assignments(user_id, item_id);

-- 5. Crear índice para búsquedas de mantenimiento por estado y fecha
CREATE INDEX IF NOT EXISTS idx_inventory_maintenance_status_date 
ON public.inventory_maintenance(status, scheduled_date);

-- 6. Comentarios en las tablas para documentación
COMMENT ON TABLE public.inventory_items IS 'Artículos de inventario (EPP, herramientas, equipos, suministros de limpieza)';
COMMENT ON TABLE public.inventory_assignments IS 'Asignaciones de artículos de inventario a empleados (user_id referencia profiles.user_id)';
COMMENT ON TABLE public.inventory_movements IS 'Historial de movimientos de inventario (entradas, salidas, ajustes)';
COMMENT ON TABLE public.inventory_maintenance IS 'Registros de mantenimiento de equipos e ítems';