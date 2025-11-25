-- 1. Función para calcular retardos con Zona Horaria de México
CREATE OR REPLACE FUNCTION public.calcular_retardo_mx()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  hora_mexico TIMESTAMP;
  fecha_mexico DATE;
  inicio_turno TIMESTAMP;
  diferencia_minutos INTEGER;
BEGIN
  -- Si no hay check_in, no podemos calcular retardo
  IF NEW.check_in IS NULL THEN
    RETURN NEW;
  END IF;

  -- Convertir el check_in (que está en UTC) a Hora México
  hora_mexico := NEW.check_in AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City';
  fecha_mexico := hora_mexico::date;

  -- Construir la fecha/hora exacta en que DEBIÓ entrar el empleado
  -- Combina la fecha actual de México con la hora de entrada programada
  inicio_turno := (fecha_mexico || ' ' || NEW.scheduled_start)::timestamp;

  -- Calcular la diferencia en minutos
  diferencia_minutos := EXTRACT(EPOCH FROM (hora_mexico - inicio_turno)) / 60;

  -- Si llegó tarde (diferencia positiva), guardar los minutos
  -- Si llegó temprano (diferencia negativa), poner 0
  IF diferencia_minutos > 0 THEN
    NEW.minutes_late := diferencia_minutos;
  ELSE
    NEW.minutes_late := 0;
  END IF;
  
  -- Si llegó MUY tarde (más de 10 horas, prob. error de fecha), poner 0 para no romper estadísticas
  IF diferencia_minutos > 600 THEN 
     NEW.minutes_late := 0; 
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Crear el Trigger (Disparador)
-- Esto hace que la función se ejecute solita CADA VEZ que se inserta o actualiza una asistencia
DROP TRIGGER IF EXISTS trigger_calcular_retardo ON public.attendance_records;

CREATE TRIGGER trigger_calcular_retardo
BEFORE INSERT OR UPDATE ON public.attendance_records
FOR EACH ROW
EXECUTE FUNCTION public.calcular_retardo_mx();

-- 3. Actualizar registros existentes de hoy para corregirlos
DO $$
DECLARE
  r RECORD;
  hora_mexico TIMESTAMP;
  fecha_mexico DATE;
  inicio_turno TIMESTAMP;
  diferencia_minutos INTEGER;
BEGIN
  -- Iterar sobre registros que tienen check_in
  FOR r IN SELECT * FROM public.attendance_records WHERE check_in IS NOT NULL LOOP
      hora_mexico := r.check_in AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City';
      fecha_mexico := hora_mexico::date;
      inicio_turno := (fecha_mexico || ' ' || r.scheduled_start)::timestamp;
      diferencia_minutos := EXTRACT(EPOCH FROM (hora_mexico - inicio_turno)) / 60;
      
      IF diferencia_minutos > 0 AND diferencia_minutos <= 600 THEN
         UPDATE public.attendance_records SET minutes_late = diferencia_minutos WHERE id = r.id;
      ELSE
         UPDATE public.attendance_records SET minutes_late = 0 WHERE id = r.id;
      END IF;
  END LOOP;
END;
$$;
