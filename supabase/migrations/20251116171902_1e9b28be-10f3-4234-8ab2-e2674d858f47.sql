-- Create remaining tables

-- vacation_requests
CREATE TABLE public.vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested numeric NOT NULL,
  reason text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado', 'cancelado')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own requests" ON public.vacation_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create requests" ON public.vacation_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Managers can view requests" ON public.vacation_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin_rrhh') OR public.has_role(auth.uid(), 'superadmin'));
CREATE POLICY "Managers can update requests" ON public.vacation_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin_rrhh') OR public.has_role(auth.uid(), 'superadmin'));

-- incidents
CREATE TABLE public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('accidente', 'incidente', 'casi_accidente', 'condicion_insegura')),
  severity text NOT NULL CHECK (severity IN ('baja', 'media', 'alta', 'critica')),
  location text,
  reported_by uuid REFERENCES auth.users(id) NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  status text DEFAULT 'abierto' CHECK (status IN ('abierto', 'en_progreso', 'resuelto', 'cerrado')),
  resolution text,
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incidents" ON public.incidents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "SH officials can manage" ON public.incidents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- sh_sectors
CREATE TABLE public.sh_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  risk_level text CHECK (risk_level IN ('bajo', 'medio', 'alto', 'muy_alto')),
  responsible_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sh_sectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View sectors" ON public.sh_sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Manage sectors" ON public.sh_sectors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- sh_inspections
CREATE TABLE public.sh_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid REFERENCES public.sh_sectors(id) ON DELETE CASCADE NOT NULL,
  inspector_id uuid REFERENCES auth.users(id) NOT NULL,
  scheduled_date date NOT NULL,
  completed_date date,
  status text DEFAULT 'programada' CHECK (status IN ('programada', 'en_curso', 'completada', 'cancelada')),
  findings text,
  recommendations text,
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sh_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View inspections" ON public.sh_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "SH manage inspections" ON public.sh_inspections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- inventory_items
CREATE TABLE public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('epp', 'herramienta', 'equipo', 'material')),
  stock_quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  unit_price numeric,
  location text,
  status text DEFAULT 'disponible' CHECK (status IN ('disponible', 'agotado', 'descontinuado')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View inventory" ON public.inventory_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- inventory_assignments
CREATE TABLE public.inventory_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  return_date date,
  status text DEFAULT 'asignado' CHECK (status IN ('asignado', 'devuelto', 'perdido', 'dañado')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.inventory_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own assignments" ON public.inventory_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all assignments" ON public.inventory_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));
CREATE POLICY "Admins manage assignments" ON public.inventory_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- documents
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  version integer DEFAULT 1,
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  is_public boolean DEFAULT false,
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View public documents" ON public.documents FOR SELECT TO authenticated USING (is_public = true);
CREATE POLICY "Admins view all documents" ON public.documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));
CREATE POLICY "Admins manage documents" ON public.documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
  link text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- audit_logs
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auditors view logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'auditor') OR public.has_role(auth.uid(), 'superadmin'));