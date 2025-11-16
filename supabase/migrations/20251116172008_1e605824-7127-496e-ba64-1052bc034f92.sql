-- Create vacation_requests table (if not exists)
CREATE TABLE IF NOT EXISTS public.vacation_requests (
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

DO $$ BEGIN
  ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view their own requests" ON public.vacation_requests;
CREATE POLICY "Users can view their own requests" ON public.vacation_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create requests" ON public.vacation_requests;
CREATE POLICY "Users can create requests" ON public.vacation_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can view team requests" ON public.vacation_requests;
CREATE POLICY "Managers can view team requests" ON public.vacation_requests FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin_rrhh') OR public.has_role(auth.uid(), 'superadmin'));

DROP POLICY IF EXISTS "Managers can update requests" ON public.vacation_requests;
CREATE POLICY "Managers can update requests" ON public.vacation_requests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin_rrhh') OR public.has_role(auth.uid(), 'superadmin'));

-- Create incidents table
CREATE TABLE IF NOT EXISTS public.incidents (
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

DO $$ BEGIN
  ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view incidents" ON public.incidents;
CREATE POLICY "Users can view incidents" ON public.incidents FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create incidents" ON public.incidents;
CREATE POLICY "Users can create incidents" ON public.incidents FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "SH officials can manage incidents" ON public.incidents;
CREATE POLICY "SH officials can manage incidents" ON public.incidents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- Create sh_sectors table
CREATE TABLE IF NOT EXISTS public.sh_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  risk_level text CHECK (risk_level IN ('bajo', 'medio', 'alto', 'muy_alto')),
  responsible_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.sh_sectors ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Everyone can view sectors" ON public.sh_sectors;
CREATE POLICY "Everyone can view sectors" ON public.sh_sectors FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "SH officials can manage sectors" ON public.sh_sectors;
CREATE POLICY "SH officials can manage sectors" ON public.sh_sectors FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- Create sh_inspections table
CREATE TABLE IF NOT EXISTS public.sh_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid REFERENCES public.sh_sectors(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES auth.users(id) NOT NULL,
  inspection_date date NOT NULL,
  status text DEFAULT 'programada' CHECK (status IN ('programada', 'en_progreso', 'completada', 'cancelada')),
  findings text,
  corrective_actions text,
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

DO $$ BEGIN
  ALTER TABLE public.sh_inspections ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Everyone can view inspections" ON public.sh_inspections;
CREATE POLICY "Everyone can view inspections" ON public.sh_inspections FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "SH officials can manage inspections" ON public.sh_inspections;
CREATE POLICY "SH officials can manage inspections" ON public.sh_inspections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('epp', 'herramienta', 'equipo', 'otro')),
  stock_quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  unit_price numeric,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Everyone can view inventory" ON public.inventory_items;
CREATE POLICY "Everyone can view inventory" ON public.inventory_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can manage inventory" ON public.inventory_items;
CREATE POLICY "Admins can manage inventory" ON public.inventory_items FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- Create inventory_assignments table
CREATE TABLE IF NOT EXISTS public.inventory_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL,
  assigned_date date NOT NULL DEFAULT CURRENT_DATE,
  return_date date,
  status text DEFAULT 'asignado' CHECK (status IN ('asignado', 'devuelto', 'dañado', 'perdido')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.inventory_assignments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view their assignments" ON public.inventory_assignments;
CREATE POLICY "Users can view their assignments" ON public.inventory_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all assignments" ON public.inventory_assignments;
CREATE POLICY "Admins can view all assignments" ON public.inventory_assignments FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

DROP POLICY IF EXISTS "Admins can manage assignments" ON public.inventory_assignments;
CREATE POLICY "Admins can manage assignments" ON public.inventory_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  version integer DEFAULT 1,
  parent_id uuid REFERENCES public.documents(id),
  uploaded_by uuid REFERENCES auth.users(id) NOT NULL,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Everyone can view public documents" ON public.documents;
CREATE POLICY "Everyone can view public documents" ON public.documents FOR SELECT TO authenticated USING (is_public = true);

DROP POLICY IF EXISTS "Users can view their documents" ON public.documents;
CREATE POLICY "Users can view their documents" ON public.documents FOR SELECT TO authenticated USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Admins can manage all documents" ON public.documents;
CREATE POLICY "Admins can manage all documents" ON public.documents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('info', 'warning', 'success', 'error')),
  link text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Users can view their notifications" ON public.notifications;
CREATE POLICY "Users can view their notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
CREATE POLICY "Users can update their notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP POLICY IF EXISTS "Auditors can view logs" ON public.audit_logs;
CREATE POLICY "Auditors can view logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'auditor') OR public.has_role(auth.uid(), 'superadmin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('contracts', 'contracts', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('incidents', 'incidents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('inspections', 'inspections', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can view their contracts" ON storage.objects;
CREATE POLICY "Users can view their contracts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contracts' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can view all contracts" ON storage.objects;
CREATE POLICY "Admins can view all contracts" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'contracts' AND (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh')));

DROP POLICY IF EXISTS "Admins can upload contracts" ON storage.objects;
CREATE POLICY "Admins can upload contracts" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'contracts' AND (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh')));

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "Admins can upload documents" ON storage.objects;
CREATE POLICY "Admins can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh')));

DROP POLICY IF EXISTS "Users can view incident files" ON storage.objects;
CREATE POLICY "Users can view incident files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'incidents');

DROP POLICY IF EXISTS "Users can upload incident files" ON storage.objects;
CREATE POLICY "Users can upload incident files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'incidents');

DROP POLICY IF EXISTS "SH officials can manage inspection files" ON storage.objects;
CREATE POLICY "SH officials can manage inspection files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'inspections' AND (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'oficial_sh')));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_id ON public.vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON public.vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON public.incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_sh_inspections_inspector_id ON public.sh_inspections(inspector_id);
CREATE INDEX IF NOT EXISTS idx_inventory_assignments_user_id ON public.inventory_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);