-- ============================================
-- MÓDULO: ÁREAS Y ASIGNACIONES
-- ============================================

-- Tabla de áreas/departamentos organizacionales
CREATE TABLE public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  parent_area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
  responsible_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT areas_status_check CHECK (status IN ('activo', 'inactivo'))
);

-- Tabla de vacantes (complementa recruitment_positions)
CREATE TABLE public.job_vacancies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id UUID NOT NULL REFERENCES public.areas(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  salary_range_min NUMERIC,
  salary_range_max NUMERIC,
  status TEXT NOT NULL DEFAULT 'abierta',
  priority TEXT DEFAULT 'normal',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  CONSTRAINT job_vacancies_status_check CHECK (status IN ('abierta', 'en_proceso', 'cerrada', 'cancelada')),
  CONSTRAINT job_vacancies_priority_check CHECK (priority IN ('baja', 'normal', 'alta', 'critica'))
);

-- Tabla de postulaciones a vacantes
CREATE TABLE public.vacancy_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id UUID NOT NULL REFERENCES public.job_vacancies(id) ON DELETE CASCADE,
  applicant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vacancy_applications_status_check CHECK (status IN ('pendiente', 'en_revision', 'entrevista', 'aprobado', 'rechazado'))
);

-- Tabla de promociones/ascensos
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_position TEXT NOT NULL,
  target_position TEXT NOT NULL,
  current_area_id UUID REFERENCES public.areas(id),
  target_area_id UUID REFERENCES public.areas(id),
  justification TEXT,
  proposed_date DATE,
  approved_date DATE,
  status TEXT NOT NULL DEFAULT 'propuesta',
  approved_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT promotions_status_check CHECK (status IN ('propuesta', 'en_revision', 'aprobada', 'rechazada', 'completada'))
);

-- Tabla de cursos/capacitaciones
CREATE TABLE public.training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT,
  duration_hours INTEGER,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'activo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT training_courses_status_check CHECK (status IN ('activo', 'inactivo', 'completado'))
);

-- Tabla de asignación de capacitaciones a empleados
CREATE TABLE public.employee_training (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.training_courses(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'asignado',
  responsible_id UUID REFERENCES auth.users(id),
  notes TEXT,
  completion_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_training_status_check CHECK (status IN ('asignado', 'en_progreso', 'completado', 'cancelado')),
  CONSTRAINT employee_training_progress_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Tabla de evaluaciones de desempeño
CREATE TABLE public.performance_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluator_id UUID NOT NULL REFERENCES auth.users(id),
  evaluation_period_start DATE NOT NULL,
  evaluation_period_end DATE NOT NULL,
  overall_score NUMERIC CHECK (overall_score >= 0 AND overall_score <= 10),
  technical_skills_score NUMERIC,
  soft_skills_score NUMERIC,
  productivity_score NUMERIC,
  comments TEXT,
  strengths TEXT,
  areas_for_improvement TEXT,
  goals TEXT,
  status TEXT NOT NULL DEFAULT 'borrador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT performance_evaluations_status_check CHECK (status IN ('borrador', 'completada', 'aprobada'))
);

-- Tabla de actividades asignadas a empleados
CREATE TABLE public.employee_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_by UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pendiente',
  priority TEXT DEFAULT 'normal',
  due_date DATE,
  start_date DATE,
  completion_date DATE,
  progress_percentage INTEGER DEFAULT 0,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_activities_status_check CHECK (status IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  CONSTRAINT employee_activities_priority_check CHECK (priority IN ('baja', 'normal', 'alta')),
  CONSTRAINT employee_activities_progress_check CHECK (progress_percentage >= 0 AND progress_percentage <= 100)
);

-- Triggers para updated_at
CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_vacancies_updated_at
  BEFORE UPDATE ON public.job_vacancies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vacancy_applications_updated_at
  BEFORE UPDATE ON public.vacancy_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at
  BEFORE UPDATE ON public.promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_courses_updated_at
  BEFORE UPDATE ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_training_updated_at
  BEFORE UPDATE ON public.employee_training
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_performance_evaluations_updated_at
  BEFORE UPDATE ON public.performance_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_employee_activities_updated_at
  BEFORE UPDATE ON public.employee_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_vacancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacancy_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_training ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_activities ENABLE ROW LEVEL SECURITY;

-- Políticas para areas
CREATE POLICY "Todos pueden ver áreas activas"
  ON public.areas FOR SELECT
  USING (status = 'activo' OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "RRHH puede gestionar áreas"
  ON public.areas FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

-- Políticas para job_vacancies
CREATE POLICY "Todos pueden ver vacantes abiertas"
  ON public.job_vacancies FOR SELECT
  USING (status = 'abierta' OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "RRHH puede gestionar vacantes"
  ON public.job_vacancies FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

-- Políticas para vacancy_applications
CREATE POLICY "Usuarios pueden postular"
  ON public.vacancy_applications FOR INSERT
  WITH CHECK (auth.uid() = applicant_id OR auth.uid() IS NOT NULL);

CREATE POLICY "RRHH puede gestionar postulaciones"
  ON public.vacancy_applications FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "Usuarios pueden ver sus postulaciones"
  ON public.vacancy_applications FOR SELECT
  USING (auth.uid() = applicant_id OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

-- Políticas para promotions
CREATE POLICY "RRHH puede gestionar promociones"
  ON public.promotions FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Empleados pueden ver sus promociones"
  ON public.promotions FOR SELECT
  USING (auth.uid() = employee_id OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh') OR has_role(auth.uid(), 'manager'));

-- Políticas para training_courses
CREATE POLICY "Todos pueden ver cursos activos"
  ON public.training_courses FOR SELECT
  USING (status = 'activo' OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "RRHH puede gestionar cursos"
  ON public.training_courses FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

-- Políticas para employee_training
CREATE POLICY "RRHH puede gestionar capacitaciones"
  ON public.employee_training FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

CREATE POLICY "Empleados pueden ver sus capacitaciones"
  ON public.employee_training FOR SELECT
  USING (auth.uid() = employee_id OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh'));

-- Políticas para performance_evaluations
CREATE POLICY "RRHH puede gestionar evaluaciones"
  ON public.performance_evaluations FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Empleados pueden ver sus evaluaciones aprobadas"
  ON public.performance_evaluations FOR SELECT
  USING (auth.uid() = employee_id AND status = 'aprobada' OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh') OR has_role(auth.uid(), 'manager'));

-- Políticas para employee_activities
CREATE POLICY "RRHH puede gestionar actividades"
  ON public.employee_activities FOR ALL
  USING (has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Empleados pueden ver y actualizar sus actividades"
  ON public.employee_activities FOR SELECT
  USING (auth.uid() = employee_id OR has_role(auth.uid(), 'superadmin') OR has_role(auth.uid(), 'admin_rrhh') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Empleados pueden actualizar progreso de sus actividades"
  ON public.employee_activities FOR UPDATE
  USING (auth.uid() = employee_id)
  WITH CHECK (auth.uid() = employee_id);