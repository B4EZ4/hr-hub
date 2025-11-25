-- Función para generar alertas de stock bajo automáticamente
CREATE OR REPLACE FUNCTION public.generate_low_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  alert_severity text;
BEGIN
  -- Si el stock está por debajo del mínimo, crear o actualizar alerta
  IF NEW.stock_quantity <= NEW.min_stock THEN
    -- Determinar severidad
    IF NEW.stock_quantity = 0 THEN
      alert_severity := 'critica';
    ELSIF NEW.stock_quantity <= NEW.min_stock * 0.5 THEN
      alert_severity := 'alta';
    ELSE
      alert_severity := 'media';
    END IF;

    -- Primero resolver cualquier alerta existente
    UPDATE public.inventory_alerts
    SET is_resolved = true, resolved_at = now()
    WHERE item_id = NEW.id 
      AND alert_type = 'stock_bajo' 
      AND is_resolved = false;

    -- Luego crear nueva alerta
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
      alert_severity,
      'Stock bajo: ' || NEW.name,
      'El stock actual (' || NEW.stock_quantity || ') está por debajo del mínimo requerido (' || NEW.min_stock || ')',
      false
    );
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger para generar alertas automáticamente cuando cambia el stock
DROP TRIGGER IF EXISTS generate_alerts_on_stock_change ON public.inventory_items;
CREATE TRIGGER generate_alerts_on_stock_change
  AFTER INSERT OR UPDATE OF stock_quantity, min_stock
  ON public.inventory_items
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_low_stock_alerts();

-- Crear índice único parcial para evitar duplicados de alertas activas del mismo tipo
DROP INDEX IF EXISTS inventory_alerts_active_unique_idx;
CREATE UNIQUE INDEX inventory_alerts_active_unique_idx 
  ON public.inventory_alerts (item_id, alert_type) 
  WHERE is_resolved = false;

COMMENT ON TRIGGER generate_alerts_on_stock_change ON public.inventory_items IS 
'Genera automáticamente alertas cuando el stock cae por debajo del mínimo o las resuelve cuando se reabastece';

COMMENT ON FUNCTION public.generate_low_stock_alerts() IS 
'Función que crea o actualiza alertas de stock bajo basándose en los niveles de inventario';