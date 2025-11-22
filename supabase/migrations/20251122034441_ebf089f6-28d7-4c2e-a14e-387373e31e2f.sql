-- ============================================
-- MÓDULO DE ASISTENCIA
-- ============================================

CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  scheduled_start time NOT NULL,
  scheduled_end time NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  status text NOT NULL DEFAULT 'pendiente',
  minutes_late integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS attendance_records_attendance_date_idx ON public.attendance_records(attendance_date);
CREATE INDEX IF NOT EXISTS attendance_records_user_id_idx ON public.attendance_records(user_id);

ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Policies para attendance_records
CREATE POLICY "Attendance admin full access" ON public.attendance_records
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

CREATE POLICY "Users view own attendance" ON public.attendance_records
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own attendance" ON public.attendance_records
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users insert own attendance" ON public.attendance_records
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.attendance_records_set_timestamp()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_records_set_timestamp
BEFORE UPDATE ON public.attendance_records
FOR EACH ROW EXECUTE FUNCTION public.attendance_records_set_timestamp();