-- ============================================
-- CORRECCIÓN DE SECURITY: Function Search Path
-- ============================================

-- Corregir función de attendance_records
CREATE OR REPLACE FUNCTION public.attendance_records_set_timestamp()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;