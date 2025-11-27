-- =============================================
-- HR-HUB - Esquema Inicial Unificado
-- =============================================

-- 1. TIPOS ENUM
CREATE TYPE public.app_role AS ENUM (
  'superadmin',
  'admin_rrhh',
  'manager',
  'empleado',
  'oficial_sh',
  'auditor'
);

-- 2. TABLAS PRINCIPALES
-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  department text,
  position text,
  manager_id uuid REFERENCES public.profiles(id),
  hire_date date,
  birth_date date,
  address text,
  emergency_contact_name text,
  emergency_contact_phone text,
  status text DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'suspendido')),
  must_change_password boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- contracts
CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_number text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('indefinido', 'temporal', 'por_obra', 'practicas')),
  start_date date NOT NULL,
  end_date date,
  salary numeric(10,2),
  position text NOT NULL,
  department text,
  status text DEFAULT 'activo' CHECK (status IN ('activo', 'por_vencer', 'vencido', 'renovado', 'terminado')),
  file_path text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- vacation_balances
CREATE TABLE IF NOT EXISTS public.vacation_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_days numeric(5,2) DEFAULT 0,
  used_days numeric(5,2) DEFAULT 0,
  available_days numeric(5,2) DEFAULT 0,
  year integer NOT NULL DEFAULT EXTRACT(YEAR FROM now()),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- vacation_requests
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

-- incidents
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

-- sh_sectors
CREATE TABLE IF NOT EXISTS public.sh_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  risk_level text CHECK (risk_level IN ('bajo', 'medio', 'alto', 'muy_alto')),
  responsible_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- sh_inspections
CREATE TABLE IF NOT EXISTS public.sh_inspections (
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

-- inventory_items
CREATE TABLE IF NOT EXISTS public.inventory_items (
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

-- inventory_assignments
CREATE TABLE IF NOT EXISTS public.inventory_assignments (
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

-- documents
CREATE TABLE IF NOT EXISTS public.documents (
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

-- notifications
CREATE TABLE IF NOT EXISTS public.notifications (
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

-- audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- 3. FUNCIONES
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), new.email);
  RETURN new;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. ENABLE RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sh_sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sh_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS RLS (simplificadas y unificadas)
-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL
  TO authenticated USING (public.has_role(auth.uid(), 'superadmin'));

-- profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT 
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;
CREATE POLICY "Admins can manage profiles" ON public.profiles FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
CREATE POLICY "Users can view own contracts" ON public.contracts FOR SELECT 
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage contracts" ON public.contracts;
CREATE POLICY "Admins can manage contracts" ON public.contracts FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'superadmin') OR public.has_role(auth.uid(), 'admin_rrhh'));

-- vacation_requests
DROP POLICY IF EXISTS "Users can manage own requests" ON public.vacation_requests;
CREATE POLICY "Users can manage own requests" ON public.vacation_requests FOR ALL 
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Managers can manage requests" ON public.vacation_requests;
CREATE POLICY "Managers can manage requests" ON public.vacation_requests FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'manager') OR public.has_role(auth.uid(), 'admin_rrhh') OR public.has_role(auth.uid(), 'superadmin'));

-- incidents
DROP POLICY IF EXISTS "Everyone can view incidents" ON public.incidents;
CREATE POLICY "Everyone can view incidents" ON public.incidents FOR SELECT 
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Users can create incidents" ON public.incidents;
CREATE POLICY "Users can create incidents" ON public.incidents FOR INSERT 
  TO authenticated WITH CHECK (auth.uid() = reported_by);

DROP POLICY IF EXISTS "SH officials can manage incidents" ON public.incidents;
CREATE POLICY "SH officials can manage incidents" ON public.incidents FOR ALL 
  TO authenticated USING (public.has_role(auth.uid(), 'oficial_sh') OR public.has_role(auth.uid(), 'superadmin'));

-- 6. TRIGGERS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update triggers para cada tabla
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vacation_balances_updated_at BEFORE UPDATE ON public.vacation_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_vacation_requests_updated_at BEFORE UPDATE ON public.vacation_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON public.incidents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sh_sectors_updated_at BEFORE UPDATE ON public.sh_sectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sh_inspections_updated_at BEFORE UPDATE ON public.sh_inspections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_assignments_updated_at BEFORE UPDATE ON public.inventory_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. ÍNDICES
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON public.contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_user_id ON public.vacation_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_vacation_requests_status ON public.vacation_requests(status);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON public.incidents(reported_by);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned_to ON public.incidents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_inventory_assignments_user_id ON public.inventory_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 8. STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('contracts', 'contracts', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
  ('incidents', 'incidents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('inspections', 'inspections', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;