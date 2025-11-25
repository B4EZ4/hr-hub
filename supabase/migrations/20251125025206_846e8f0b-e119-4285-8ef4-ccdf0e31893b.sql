-- ================================================================================
-- CORRECCIÓN DE POLÍTICAS RLS PARA SISTEMA DE AUTENTICACIÓN PERSONALIZADO
-- ================================================================================
-- El sistema usa autenticación personalizada con tokens de sesión,
-- no Supabase Auth. Las políticas deben ser permisivas y la autorización
-- se maneja en la capa de aplicación.

-- ================================================================================
-- TABLA: sh_sectors - Permitir todas las operaciones
-- ================================================================================

-- Eliminar políticas existentes que dependen de authenticated
DROP POLICY IF EXISTS "Authenticated users can insert sectors" ON public.sh_sectors;
DROP POLICY IF EXISTS "Authenticated users can update sectors" ON public.sh_sectors;
DROP POLICY IF EXISTS "Authenticated users can delete sectors" ON public.sh_sectors;

-- Crear nuevas políticas permisivas
CREATE POLICY "Anyone can insert sectors"
ON public.sh_sectors FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update sectors"
ON public.sh_sectors FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete sectors"
ON public.sh_sectors FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: sh_inspections - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert inspections" ON public.sh_inspections;
DROP POLICY IF EXISTS "Authenticated users can update inspections" ON public.sh_inspections;
DROP POLICY IF EXISTS "Authenticated users can delete inspections" ON public.sh_inspections;

CREATE POLICY "Anyone can insert inspections"
ON public.sh_inspections FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update inspections"
ON public.sh_inspections FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete inspections"
ON public.sh_inspections FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: sh_checklists - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert checklists" ON public.sh_checklists;
DROP POLICY IF EXISTS "Authenticated users can update checklists" ON public.sh_checklists;
DROP POLICY IF EXISTS "Authenticated users can delete checklists" ON public.sh_checklists;

CREATE POLICY "Anyone can insert checklists"
ON public.sh_checklists FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update checklists"
ON public.sh_checklists FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete checklists"
ON public.sh_checklists FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: sh_area_evaluations - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert area evaluations" ON public.sh_area_evaluations;
DROP POLICY IF EXISTS "Authenticated users can update area evaluations" ON public.sh_area_evaluations;
DROP POLICY IF EXISTS "Authenticated users can delete area evaluations" ON public.sh_area_evaluations;

CREATE POLICY "Anyone can insert area evaluations"
ON public.sh_area_evaluations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update area evaluations"
ON public.sh_area_evaluations FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete area evaluations"
ON public.sh_area_evaluations FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: inventory_items - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can update inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Authenticated users can delete inventory items" ON public.inventory_items;

CREATE POLICY "Anyone can insert inventory items"
ON public.inventory_items FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update inventory items"
ON public.inventory_items FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete inventory items"
ON public.inventory_items FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: inventory_maintenance - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert maintenance" ON public.inventory_maintenance;
DROP POLICY IF EXISTS "Authenticated users can update maintenance" ON public.inventory_maintenance;
DROP POLICY IF EXISTS "Authenticated users can delete maintenance" ON public.inventory_maintenance;

CREATE POLICY "Anyone can insert maintenance"
ON public.inventory_maintenance FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update maintenance"
ON public.inventory_maintenance FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete maintenance"
ON public.inventory_maintenance FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: inventory_movements - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Authenticated users can update movements" ON public.inventory_movements;
DROP POLICY IF EXISTS "Authenticated users can delete movements" ON public.inventory_movements;

CREATE POLICY "Anyone can insert movements"
ON public.inventory_movements FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update movements"
ON public.inventory_movements FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete movements"
ON public.inventory_movements FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: inventory_alerts - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can update alerts" ON public.inventory_alerts;
DROP POLICY IF EXISTS "Authenticated users can delete alerts" ON public.inventory_alerts;

CREATE POLICY "Anyone can update alerts"
ON public.inventory_alerts FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete alerts"
ON public.inventory_alerts FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: inventory_assignments - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert assignments" ON public.inventory_assignments;
DROP POLICY IF EXISTS "Authenticated users can update assignments" ON public.inventory_assignments;
DROP POLICY IF EXISTS "Authenticated users can delete assignments" ON public.inventory_assignments;

CREATE POLICY "Anyone can insert assignments"
ON public.inventory_assignments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update assignments"
ON public.inventory_assignments FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete assignments"
ON public.inventory_assignments FOR DELETE
USING (true);

-- ================================================================================
-- TABLA: inventory_item_states - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can insert item states" ON public.inventory_item_states;
DROP POLICY IF EXISTS "Authenticated users can update item states" ON public.inventory_item_states;

CREATE POLICY "Anyone can insert item states"
ON public.inventory_item_states FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update item states"
ON public.inventory_item_states FOR UPDATE
USING (true);

-- ================================================================================
-- TABLA: inspection_progress - Permitir todas las operaciones
-- ================================================================================

DROP POLICY IF EXISTS "Authenticated users can update inspection progress" ON public.inspection_progress;

CREATE POLICY "Anyone can update inspection progress"
ON public.inspection_progress FOR UPDATE
USING (true);