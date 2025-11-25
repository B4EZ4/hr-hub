-- Eliminar políticas RLS duplicadas y crear políticas simples para inventory_items
DROP POLICY IF EXISTS "Everyone can view inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "View inventory" ON public.inventory_items;
DROP POLICY IF EXISTS "Anyone can insert inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Anyone can update inventory items" ON public.inventory_items;
DROP POLICY IF EXISTS "Anyone can delete inventory items" ON public.inventory_items;

-- Crear políticas PERMISSIVE simples que permitan acceso completo
CREATE POLICY "Allow all SELECT on inventory_items"
  ON public.inventory_items
  FOR SELECT
  USING (true);

CREATE POLICY "Allow all INSERT on inventory_items"
  ON public.inventory_items
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all UPDATE on inventory_items"
  ON public.inventory_items
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all DELETE on inventory_items"
  ON public.inventory_items
  FOR DELETE
  USING (true);