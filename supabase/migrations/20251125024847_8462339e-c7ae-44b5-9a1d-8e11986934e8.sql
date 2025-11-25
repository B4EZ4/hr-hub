-- ================================================================================
-- POLÍTICAS RLS PARA MÓDULO SEGURIDAD E HIGIENE
-- ================================================================================
-- Permitir operaciones CRUD completas para tablas de S&H basadas en roles

-- ================================================================================
-- TABLA: sh_sectors
-- ================================================================================

-- Permitir INSERT a usuarios autenticados (validación de rol en app)
CREATE POLICY "Authenticated users can insert sectors"
ON public.sh_sectors FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE a usuarios autenticados
CREATE POLICY "Authenticated users can update sectors"
ON public.sh_sectors FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE a usuarios autenticados
CREATE POLICY "Authenticated users can delete sectors"
ON public.sh_sectors FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: sh_inspections
-- ================================================================================

-- Permitir INSERT para inspecciones
CREATE POLICY "Authenticated users can insert inspections"
ON public.sh_inspections FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para inspecciones
CREATE POLICY "Authenticated users can update inspections"
ON public.sh_inspections FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para inspecciones
CREATE POLICY "Authenticated users can delete inspections"
ON public.sh_inspections FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: sh_checklists
-- ================================================================================

-- Permitir SELECT (ya existe implícito)
CREATE POLICY "Everyone can view checklists"
ON public.sh_checklists FOR SELECT
USING (true);

-- Permitir INSERT para checklists
CREATE POLICY "Authenticated users can insert checklists"
ON public.sh_checklists FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para checklists
CREATE POLICY "Authenticated users can update checklists"
ON public.sh_checklists FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para checklists
CREATE POLICY "Authenticated users can delete checklists"
ON public.sh_checklists FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: sh_area_evaluations
-- ================================================================================

-- Permitir INSERT para evaluaciones
CREATE POLICY "Authenticated users can insert area evaluations"
ON public.sh_area_evaluations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para evaluaciones
CREATE POLICY "Authenticated users can update area evaluations"
ON public.sh_area_evaluations FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para evaluaciones
CREATE POLICY "Authenticated users can delete area evaluations"
ON public.sh_area_evaluations FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inventory_items
-- ================================================================================

-- Permitir INSERT para items de inventario
CREATE POLICY "Authenticated users can insert inventory items"
ON public.inventory_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para items de inventario
CREATE POLICY "Authenticated users can update inventory items"
ON public.inventory_items FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para items de inventario
CREATE POLICY "Authenticated users can delete inventory items"
ON public.inventory_items FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inventory_maintenance
-- ================================================================================

-- Permitir SELECT
CREATE POLICY "Everyone can view maintenance records"
ON public.inventory_maintenance FOR SELECT
USING (true);

-- Permitir INSERT para mantenimientos
CREATE POLICY "Authenticated users can insert maintenance"
ON public.inventory_maintenance FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para mantenimientos
CREATE POLICY "Authenticated users can update maintenance"
ON public.inventory_maintenance FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para mantenimientos
CREATE POLICY "Authenticated users can delete maintenance"
ON public.inventory_maintenance FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inventory_movements
-- ================================================================================

-- Permitir SELECT
CREATE POLICY "Everyone can view inventory movements"
ON public.inventory_movements FOR SELECT
USING (true);

-- Permitir INSERT para movimientos
CREATE POLICY "Authenticated users can insert movements"
ON public.inventory_movements FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para movimientos
CREATE POLICY "Authenticated users can update movements"
ON public.inventory_movements FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para movimientos
CREATE POLICY "Authenticated users can delete movements"
ON public.inventory_movements FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inventory_alerts
-- ================================================================================

-- Permitir INSERT para alertas
CREATE POLICY "System can insert alerts"
ON public.inventory_alerts FOR INSERT
WITH CHECK (true);

-- Permitir UPDATE para alertas (marcar como resueltas)
CREATE POLICY "Authenticated users can update alerts"
ON public.inventory_alerts FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para alertas
CREATE POLICY "Authenticated users can delete alerts"
ON public.inventory_alerts FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inventory_assignments
-- ================================================================================

-- Permitir INSERT para asignaciones
CREATE POLICY "Authenticated users can insert assignments"
ON public.inventory_assignments FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para asignaciones
CREATE POLICY "Authenticated users can update assignments"
ON public.inventory_assignments FOR UPDATE
TO authenticated
USING (true);

-- Permitir DELETE para asignaciones
CREATE POLICY "Authenticated users can delete assignments"
ON public.inventory_assignments FOR DELETE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inventory_item_states
-- ================================================================================

-- Permitir INSERT para cambios de estado
CREATE POLICY "Authenticated users can insert item states"
ON public.inventory_item_states FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir UPDATE para estados
CREATE POLICY "Authenticated users can update item states"
ON public.inventory_item_states FOR UPDATE
TO authenticated
USING (true);

-- ================================================================================
-- TABLA: inspection_progress
-- ================================================================================

-- Permitir INSERT para progreso de inspecciones
CREATE POLICY "System can insert inspection progress"
ON public.inspection_progress FOR INSERT
WITH CHECK (true);

-- Permitir UPDATE para progreso
CREATE POLICY "Authenticated users can update inspection progress"
ON public.inspection_progress FOR UPDATE
TO authenticated
USING (true);
