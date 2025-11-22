-- ============================================
-- MÓDULO DE RECLUTAMIENTO - CORREGIDO
-- Usa auth.users(id) para consistencia
-- ============================================

-- Tabla de posiciones de reclutamiento
CREATE TABLE IF NOT EXISTS public.recruitment_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  department text,
  location text,
  seniority text,
  description text,
  status text NOT NULL DEFAULT 'abierta' CHECK (status IN ('abierta','en_proceso','pausada','cerrada')),
  hiring_manager uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  work_start_time time,
  work_end_time time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_recruitment_positions_updated_at
  BEFORE UPDATE ON public.recruitment_positions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de candidatos
CREATE TABLE IF NOT EXISTS public.recruitment_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  source text,
  seniority text,
  status text NOT NULL DEFAULT 'nuevo' CHECK (status IN ('nuevo','en_proceso','oferta','rechazado','contratado','archivado')),
  assigned_recruiter uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resume_url text,
  current_location text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (email)
);

CREATE TRIGGER trg_recruitment_candidates_updated_at
  BEFORE UPDATE ON public.recruitment_candidates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de aplicaciones
CREATE TABLE IF NOT EXISTS public.recruitment_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE NOT NULL,
  position_id uuid REFERENCES public.recruitment_positions(id) ON DELETE SET NULL,
  hiring_manager uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  salary_expectation numeric(12,2),
  availability_date date,
  status text NOT NULL DEFAULT 'en_revision' CHECK (status IN ('en_revision','entrevista','oferta','rechazado','contratado','archivado')),
  current_stage text DEFAULT 'screening',
  priority text DEFAULT 'media' CHECK (priority IN ('alta','media','baja')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_recruitment_applications_updated_at
  BEFORE UPDATE ON public.recruitment_applications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de entrevistas
CREATE TABLE IF NOT EXISTS public.recruitment_interviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.recruitment_applications(id) ON DELETE CASCADE NOT NULL,
  interview_type text NOT NULL CHECK (interview_type IN ('screening','tecnica','cultural','oferta')),
  status text NOT NULL DEFAULT 'programada' CHECK (status IN ('programada','en_progreso','completada','cancelada')),
  decision text NOT NULL DEFAULT 'pendiente' CHECK (decision IN ('pendiente','aprobado','rechazado','otra')),
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer,
  location text,
  meeting_url text,
  feedback_summary text,
  next_steps text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_recruitment_interviews_updated_at
  BEFORE UPDATE ON public.recruitment_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla de participantes en entrevistas
CREATE TABLE IF NOT EXISTS public.recruitment_interview_participants (
  interview_id uuid REFERENCES public.recruitment_interviews(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_role text NOT NULL CHECK (participant_role IN ('reclutador','hiring_manager','entrevistador_tecnico')),
  response_status text DEFAULT 'pendiente' CHECK (response_status IN ('pendiente','confirmado','rechazado')),
  PRIMARY KEY (interview_id, participant_id)
);

-- Tabla de notas
CREATE TABLE IF NOT EXISTS public.recruitment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES public.recruitment_applications(id) ON DELETE CASCADE,
  interview_id uuid REFERENCES public.recruitment_interviews(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  visibility text DEFAULT 'rrhh' CHECK (visibility IN ('rrhh','panel')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabla de archivos
CREATE TABLE IF NOT EXISTS public.recruitment_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES public.recruitment_candidates(id) ON DELETE CASCADE NOT NULL,
  file_path text NOT NULL,
  file_type text DEFAULT 'otro' CHECK (file_type IN ('cv','portafolio','otro')),
  mime_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- RLS POLICIES - SIMPLIFICADAS
-- ============================================

ALTER TABLE public.recruitment_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_interview_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment_files ENABLE ROW LEVEL SECURITY;

-- Policies para recruitment_positions
CREATE POLICY "RRHH full access positions" ON public.recruitment_positions
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

CREATE POLICY "Managers view their positions" ON public.recruitment_positions
FOR SELECT USING (
  public.has_role(auth.uid(), 'manager') AND 
  hiring_manager = auth.uid()
);

-- Policies para recruitment_candidates
CREATE POLICY "RRHH full access candidates" ON public.recruitment_candidates
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

-- Policies para recruitment_applications
CREATE POLICY "RRHH full access applications" ON public.recruitment_applications
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

CREATE POLICY "Managers view assigned applications" ON public.recruitment_applications
FOR SELECT USING (
  public.has_role(auth.uid(), 'manager') AND 
  hiring_manager = auth.uid()
);

-- Policies para recruitment_interviews
CREATE POLICY "RRHH full access interviews" ON public.recruitment_interviews
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

CREATE POLICY "Interview participants can view" ON public.recruitment_interviews
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.recruitment_interview_participants rip
    WHERE rip.interview_id = recruitment_interviews.id
    AND rip.participant_id = auth.uid()
  )
);

-- Policies para recruitment_interview_participants
CREATE POLICY "RRHH manage participants" ON public.recruitment_interview_participants
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

CREATE POLICY "Participants view their rows" ON public.recruitment_interview_participants
FOR SELECT USING (participant_id = auth.uid());

-- Policies para recruitment_notes
CREATE POLICY "RRHH access notes" ON public.recruitment_notes
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);

-- Policies para recruitment_files
CREATE POLICY "RRHH access files" ON public.recruitment_files
FOR ALL USING (
  public.has_role(auth.uid(), 'superadmin') OR 
  public.has_role(auth.uid(), 'admin_rrhh')
);