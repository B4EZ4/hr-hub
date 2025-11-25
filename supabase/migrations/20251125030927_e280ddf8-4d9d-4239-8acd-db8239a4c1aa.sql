-- Función para generar alertas de stock bajo
CREATE OR REPLACE FUNCTION public.check_low_stock_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Si el stock está por debajo del mínimo, crear o actualizar alerta
  IF NEW.stock_quantity <= NEW.min_stock THEN
    INSERT INTO public.inventory_alerts (
      item_id,
      alert_type,
      severity,
      title,
      description,
      is_resolved
    )
    VALUES (
      NEW.id,
      'stock_bajo',
      CASE
        WHEN NEW.stock_quantity = 0 THEN 'critica'
        WHEN NEW.stock_quantity <= NEW.min_stock * 0.5 THEN 'alta'
        ELSE 'media'
      END,
      'Stock bajo: ' || NEW.name,
      'El stock actual (' || NEW.stock_quantity || ') está por debajo del mínimo requerido (' || NEW.min_stock || ')',
      false
    )
    ON CONFLICT (item_id, alert_type) 
    WHERE is_resolved = false
    DO UPDATE SET
      severity = CASE
        WHEN NEW.stock_quantity = 0 THEN 'critica'
        WHEN NEW.stock_quantity <= NEW.min_stock * 0.5 THEN 'alta'
        ELSE 'media'
      END,
      description = 'El stock actual (' || NEW.stock_quantity || ') está por debajo del mínimo requerido (' || NEW.min_stock || ')',
      created_at = now();
  ELSE
    -- Si el stock está OK, resolver cualquier alerta activa
    UPDATE public.inventory_alerts
    SET is_resolved = true, resolved_at = now()
    WHERE item_id = NEW.id 
      AND alert_type = 'stock_bajo' 
      AND is_resolved = false;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para stock bajo en inventory_items
DROP TRIGGER IF EXISTS trigger_check_low_stock ON public.inventory_items;
CREATE TRIGGER trigger_check_low_stock
AFTER INSERT OR UPDATE OF stock_quantity, min_stock
ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.check_low_stock_alerts();

-- Función para generar alertas de mantenimientos vencidos
CREATE OR REPLACE FUNCTION public.check_overdue_maintenance_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar alertas para mantenimientos vencidos
  INSERT INTO public.inventory_alerts (
    item_id,
    alert_type,
    severity,
    title,
    description,
    is_resolved
  )
  SELECT DISTINCT
    im.item_id,
    'mantenimiento_pendiente',
    CASE
      WHEN im.scheduled_date < CURRENT_DATE - INTERVAL '30 days' THEN 'critica'
      WHEN im.scheduled_date < CURRENT_DATE - INTERVAL '7 days' THEN 'alta'
      ELSE 'media'
    END,
    'Mantenimiento vencido',
    'Mantenimiento programado para ' || im.scheduled_date || ' está pendiente',
    false
  FROM public.inventory_maintenance im
  INNER JOIN public.inventory_items ii ON ii.id = im.item_id
  WHERE im.status = 'pendiente'
    AND im.scheduled_date < CURRENT_DATE
    AND NOT EXISTS (
      SELECT 1 FROM public.inventory_alerts ia
      WHERE ia.item_id = im.item_id
        AND ia.alert_type = 'mantenimiento_pendiente'
        AND ia.is_resolved = false
    );
END;
$$;

-- Función para generar alertas de inspecciones vencidas
CREATE OR REPLACE FUNCTION public.check_overdue_inspection_alerts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insertar alertas para inspecciones vencidas (no vinculadas a items, solo informativas)
  -- Estas alertas necesitarían una columna adicional o tabla separada
  -- Por ahora, las dejamos como consulta manual desde el dashboard
  NULL;
END;
$$;

-- Agregar índice único para evitar duplicados de alertas activas del mismo tipo
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_alerts_unique_active
ON public.inventory_alerts (item_id, alert_type)
WHERE is_resolved = false;