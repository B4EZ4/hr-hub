-- Módulo de Gestión de Vacaciones - Corrección de orden

-- Crear tablas faltantes
CREATE TABLE IF NOT EXISTS public.holiday_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holiday_date DATE NOT NULL UNIQUE,
  holiday_name TEXT NOT NULL,
  is_official BOOLEAN DEFAULT true,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vacation_blackout_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  created_by UUID REFERENCES public.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT valid_period CHECK (end_date >= start_date)
);

-- Agregar columnas a vacation_requests
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='request_number') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN request_number TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='return_date') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN return_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='work_schedule') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN work_schedule TEXT DEFAULT 'lunes_viernes';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='vacation_bonus_percentage') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN vacation_bonus_percentage DECIMAL(5,2) DEFAULT 25.00;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='vacation_bonus_amount') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN vacation_bonus_amount DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='daily_salary') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN daily_salary DECIMAL(10,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='created_by') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN created_by UUID REFERENCES public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='rejection_reason') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN rejection_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='sent_to_documentation_at') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN sent_to_documentation_at TIMESTAMP WITH TIME ZONE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='notes') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN notes TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='attendance_percentage') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN attendance_percentage DECIMAL(5,2);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='vacation_requests' AND column_name='has_attendance_alert') THEN
    ALTER TABLE public.vacation_requests ADD COLUMN has_attendance_alert BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Funciones
CREATE OR REPLACE FUNCTION calculate_vacation_days(years_of_service INTEGER)
RETURNS DECIMAL(5,2) LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  IF years_of_service = 1 THEN RETURN 12;
  ELSIF years_of_service >= 2 AND years_of_service <= 5 THEN
    RETURN 12 + ((years_of_service - 1) * 2);
  ELSE
    RETURN 20 + (FLOOR((years_of_service - 5) / 5.0) * 2);
  END IF;
END; $$;

CREATE OR REPLACE FUNCTION calculate_years_of_service(hire_date DATE)
RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE AS $$
BEGIN
  RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, hire_date))::INTEGER;
END; $$;

CREATE OR REPLACE FUNCTION generate_vacation_request_number()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE next_num INTEGER; request_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.vacation_requests;
  request_num := 'VAC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
  WHILE EXISTS (SELECT 1 FROM public.vacation_requests WHERE request_number = request_num) LOOP
    next_num := next_num + 1;
    request_num := 'VAC-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(next_num::TEXT, 6, '0');
  END LOOP;
  RETURN request_num;
END; $$;

CREATE OR REPLACE FUNCTION set_vacation_request_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.request_number IS NULL THEN
    NEW.request_number := generate_vacation_request_number();
  END IF;
  RETURN NEW;
END; $$;

-- Trigger
DROP TRIGGER IF EXISTS before_insert_vacation_request ON public.vacation_requests;
CREATE TRIGGER before_insert_vacation_request
BEFORE INSERT ON public.vacation_requests
FOR EACH ROW EXECUTE FUNCTION set_vacation_request_number();

-- RLS
ALTER TABLE public.holiday_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_blackout_periods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view holiday_calendar" ON public.holiday_calendar;
CREATE POLICY "Everyone can view holiday_calendar" ON public.holiday_calendar FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin and RH manage holiday_calendar" ON public.holiday_calendar;
CREATE POLICY "Admin and RH manage holiday_calendar" ON public.holiday_calendar FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = get_current_user_id() AND role IN ('superadmin', 'admin_rrhh'))
);

DROP POLICY IF EXISTS "View blackout periods" ON public.vacation_blackout_periods;
CREATE POLICY "View blackout periods" ON public.vacation_blackout_periods FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admin manage blackout" ON public.vacation_blackout_periods;
CREATE POLICY "Admin manage blackout" ON public.vacation_blackout_periods FOR ALL USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = get_current_user_id() AND role IN ('superadmin', 'admin_rrhh'))
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_holiday_date ON public.holiday_calendar(holiday_date);
CREATE INDEX IF NOT EXISTS idx_blackout_dates ON public.vacation_blackout_periods(start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_request_number ON public.vacation_requests(request_number);

-- Festivos México 2025
INSERT INTO public.holiday_calendar (holiday_date, holiday_name, is_official, year) VALUES
('2025-01-01', 'Año Nuevo', true, 2025),
('2025-02-03', 'Día de la Constitución', true, 2025),
('2025-03-17', 'Natalicio de Benito Juárez', true, 2025),
('2025-05-01', 'Día del Trabajo', true, 2025),
('2025-09-16', 'Día de la Independencia', true, 2025),
('2025-11-17', 'Día de la Revolución Mexicana', true, 2025),
('2025-12-25', 'Navidad', true, 2025)
ON CONFLICT (holiday_date) DO NOTHING;