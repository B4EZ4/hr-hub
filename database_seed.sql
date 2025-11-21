-- Sistema RRHH - Script de creación de esquema y datos de muestra
-- Ejecutar este archivo en una base de datos PostgreSQL vacía.

BEGIN;

-- Extensiones y esquema auxiliar -------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE SCHEMA IF NOT EXISTS auth;



-- Tipos y funciones compartidas --------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM (
    'superadmin',
    'admin_rrhh',
    'manager',
    'empleado',
    'oficial_sh',
    'auditor'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tablas principales -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

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
  status text DEFAULT 'activo' CHECK (status IN ('activo','inactivo','suspendido')),
  must_change_password boolean DEFAULT false,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  contract_number text UNIQUE,
  contract_type text NOT NULL CHECK (contract_type IN ('indefinido','temporal','obra','practicas','formacion')),
  start_date date NOT NULL,
  end_date date,
  position text NOT NULL,
  department text,
  salary numeric(12,2),
  status text DEFAULT 'activo' CHECK (status IN ('activo','por_vencer','vencido','renovado','terminado')),
  file_path text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_contracts_updated_at BEFORE UPDATE ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.vacation_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year integer NOT NULL,
  total_days numeric(5,2) DEFAULT 0,
  used_days numeric(5,2) DEFAULT 0,
  available_days numeric(5,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, year)
);
CREATE TRIGGER trg_vac_balances_updated_at BEFORE UPDATE ON public.vacation_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.vacation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_requested numeric NOT NULL,
  reason text,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente','aprobado','rechazado','cancelado')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_vac_requests_updated_at BEFORE UPDATE ON public.vacation_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('epp','herramienta','equipo','otro')),
  stock_quantity integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  unit_price numeric(12,2),
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inventory_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  quantity integer NOT NULL,
  assigned_date date NOT NULL DEFAULT current_date,
  return_date date,
  status text DEFAULT 'asignado' CHECK (status IN ('asignado','devuelto','danado','perdido')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_inventory_assignments_updated_at BEFORE UPDATE ON public.inventory_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  assignment_id uuid REFERENCES public.inventory_assignments(id),
  movement_type text NOT NULL CHECK (movement_type IN ('entrada','salida','asignacion','devolucion','ajuste','baja')),
  quantity integer NOT NULL,
  user_id uuid,
  condition_before text CHECK (condition_before IN ('nuevo','bueno','aceptable','desgastado','danado')),
  condition_after text CHECK (condition_after IN ('nuevo','bueno','aceptable','desgastado','danado','perdido')),
  damage_description text,
  observations text,
  file_paths text[],
  authorized_by uuid,
  movement_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.inventory_maintenance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES public.inventory_items(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL CHECK (maintenance_type IN ('preventivo','correctivo','calibracion','limpieza','otro')),
  scheduled_date date,
  completed_date date,
  performed_by uuid,
  status text DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_proceso','completado','cancelado')),
  description text,
  observations text,
  cost numeric(12,2),
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER trg_inventory_maintenance_updated_at BEFORE UPDATE ON public.inventory_maintenance
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.sh_sectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  risk_level text CHECK (risk_level IN ('bajo','medio','alto','muy_alto')),
  responsible_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sh_checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL CHECK (category IN ('inspeccion','auditoria','epp','capacitacion','otro')),
  is_active boolean DEFAULT true,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sh_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid REFERENCES public.sh_sectors(id) ON DELETE CASCADE,
  inspector_id uuid REFERENCES auth.users(id) NOT NULL,
  inspection_date date NOT NULL,
  status text DEFAULT 'programada' CHECK (status IN ('programada','en_progreso','completada','cancelada')),
  findings text,
  corrective_actions text,
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.sh_area_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sector_id uuid REFERENCES public.sh_sectors(id) ON DELETE CASCADE NOT NULL,
  evaluated_by uuid NOT NULL,
  evaluation_date date NOT NULL,
  cleanliness_score integer,
  order_score integer,
  ventilation_score integer,
  lighting_score integer,
  ergonomics_score integer,
  risk_control_score integer,
  furniture_condition_score integer,
  tools_condition_score integer,
  hazmat_control_score integer,
  signage_score integer,
  compliance_score integer,
  total_score integer,
  average_score integer,
  observations text,
  recommendations text,
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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
  tags text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  incident_type text NOT NULL CHECK (incident_type IN ('accidente','incidente','casi_accidente','condicion_insegura')),
  severity text NOT NULL CHECK (severity IN ('baja','media','alta','critica')),
  location text,
  reported_by uuid REFERENCES auth.users(id) NOT NULL,
  assigned_to uuid REFERENCES auth.users(id),
  status text DEFAULT 'abierto' CHECK (status IN ('abierto','en_progreso','resuelto','cerrado')),
  resolution text,
  file_paths text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Datos de usuarios y perfiles ---------------------------------------------------
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  --('59b47140-d8fa-4717-877a-44629a6bc4a9', 'admin@sistema-rrhh.com', '{"full_name":"Antonio Ramírez"}'),
  ('f76c8d54-0fba-4480-ac76-108a4356b629', 'admin@gmail.com', '{"full_name":"María González"}'),
  ('11111111-1111-1111-1111-111111111111', 'manager@demo.local', '{"full_name":"Carlos Fernández"}'),
  ('22222222-2222-2222-2222-222222222222', 'empleado@demo.local', '{"full_name":"Laura Méndez"}'),
  ('33333333-3333-3333-3333-333333333333', 'oficial.sh@demo.local', '{"full_name":"Roberto Silva"}'),
  ('44444444-4444-4444-4444-444444444444', 'auditor@demo.local', '{"full_name":"Patricia Ruiz"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (user_id, full_name, email, department, position, hire_date, status, must_change_password)
VALUES
  ('59b47140-d8fa-4717-877a-44629a6bc4a9', 'Antonio Ramírez', 'admin@sistema-rrhh.com', 'Dirección', 'Superadministrador', '2020-01-10', 'activo', false),
  ('f76c8d54-0fba-4480-ac76-108a4356b629', 'María González', 'admin@gmail.com', 'Recursos Humanos', 'Administradora RRHH', '2021-03-18', 'activo', false),
  ('11111111-1111-1111-1111-111111111111', 'Carlos Fernández', 'manager@demo.local', 'Operaciones', 'Manager de Planta', '2022-06-01', 'activo', true),
  ('22222222-2222-2222-2222-222222222222', 'Laura Méndez', 'empleado@demo.local', 'Operaciones', 'Operaria', '2023-02-10', 'activo', true),
  ('33333333-3333-3333-3333-333333333333', 'Roberto Silva', 'oficial.sh@demo.local', 'Seguridad e Higiene', 'Oficial SH', '2019-09-05', 'activo', true),
  ('44444444-4444-4444-4444-444444444444', 'Patricia Ruiz', 'auditor@demo.local', 'Auditoría', 'Auditor Interno', '2018-11-12', 'activo', true)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_roles (user_id, role) VALUES
  ('59b47140-d8fa-4717-877a-44629a6bc4a9', 'superadmin'),
  ('f76c8d54-0fba-4480-ac76-108a4356b629', 'admin_rrhh'),
  ('11111111-1111-1111-1111-111111111111', 'manager'),
  ('22222222-2222-2222-2222-222222222222', 'empleado'),
  ('33333333-3333-3333-3333-333333333333', 'oficial_sh'),
  ('44444444-4444-4444-4444-444444444444', 'auditor')
ON CONFLICT (user_id, role) DO NOTHING;

-- Contratos ----------------------------------------------------------------------
INSERT INTO public.contracts (id, user_id, contract_number, contract_type, start_date, end_date, position, department, salary, status, file_path)
VALUES
  ('60000000-0000-0000-0000-000000000001', 'f76c8d54-0fba-4480-ac76-108a4356b629', 'CONT-2022-001', 'indefinido', '2022-01-01', NULL, 'Administrador RRHH', 'Recursos Humanos', 125000, 'activo', 'contracts/maria-gonzalez/cont-2022-001.pdf'),
  ('60000000-0000-0000-0000-000000000002', '59b47140-d8fa-4717-877a-44629a6bc4a9', 'CONT-2021-005', 'indefinido', '2021-05-10', NULL, 'Superadministrador', 'Dirección', 180000, 'activo', 'contracts/antonio-ramirez/cont-2021-005.pdf')
ON CONFLICT (id) DO NOTHING;

-- Vacaciones ---------------------------------------------------------------------
INSERT INTO public.vacation_balances (user_id, year, total_days, used_days, available_days)
VALUES
  ('f76c8d54-0fba-4480-ac76-108a4356b629', 2025, 14, 10, 4),
  ('59b47140-d8fa-4717-877a-44629a6bc4a9', 2025, 21, 0, 21)
ON CONFLICT (user_id, year) DO NOTHING;

INSERT INTO public.vacation_requests (id, user_id, start_date, end_date, days_requested, reason, status, approved_by, approved_at)
VALUES
  ('70000000-0000-0000-0000-000000000001', 'f76c8d54-0fba-4480-ac76-108a4356b629', '2025-12-20', '2026-01-05', 10, 'Vacaciones familiares', 'aprobado', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-11-01'),
  ('70000000-0000-0000-0000-000000000002', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-11-25', '2025-11-29', 5, 'Descanso post auditoría', 'pendiente', NULL, NULL),
  ('70000000-0000-0000-0000-000000000003', 'f76c8d54-0fba-4480-ac76-108a4356b629', '2025-10-10', '2025-10-15', 4, 'Viaje personal', 'rechazado', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-09-25')
ON CONFLICT (id) DO NOTHING;

-- Seguridad e Higiene ------------------------------------------------------------
INSERT INTO public.sh_sectors (id, name, description, risk_level, responsible_id)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Planta de Producción', 'Área principal de fabricación', 'alto', '59b47140-d8fa-4717-877a-44629a6bc4a9'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Depósito General', 'Almacén de insumos y herramientas', 'medio', 'f76c8d54-0fba-4480-ac76-108a4356b629'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Oficinas Administrativas', 'Piso administrativo y salas de reunión', 'bajo', 'f76c8d54-0fba-4480-ac76-108a4356b629'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Laboratorio', 'Zona de pruebas y control de calidad', 'medio', '59b47140-d8fa-4717-877a-44629a6bc4a9')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sh_checklists (id, name, description, category, items)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Inspección General de Seguridad', 'Checklist base para recorridos mensuales', 'inspeccion',
    '[{"item":"Revisar extintores","type":"boolean"},{"item":"Orden y limpieza","type":"boolean"},{"item":"Salidas de emergencia despejadas","type":"boolean"},{"item":"Señalética vigente","type":"boolean"},{"item":"Uso correcto de EPP","type":"boolean"}]'::jsonb),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Checklist EPP - Dotación Personal', 'Control de entrega de EPP críticos', 'epp',
    '[{"item":"Casco de seguridad","type":"boolean"},{"item":"Guantes","type":"boolean"},{"item":"Calzado","type":"boolean"},{"item":"Arnés","type":"boolean"}]'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sh_inspections (id, sector_id, inspector_id, inspection_date, status, findings, corrective_actions)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-11-01', 'completada', 'Pequeñas fugas detectadas', 'Reemplazar mangueras antes del 15/11'),
  ('20000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'f76c8d54-0fba-4480-ac76-108a4356b629', '2025-11-15', 'en_progreso', 'Revisión de ventilación pendiente', NULL),
  ('20000000-0000-0000-0000-000000000003', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-11-20', 'programada', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sh_area_evaluations (id, sector_id, evaluated_by, evaluation_date,
  cleanliness_score, order_score, ventilation_score, lighting_score, ergonomics_score,
  risk_control_score, furniture_condition_score, tools_condition_score, hazmat_control_score,
  signage_score, compliance_score, total_score, average_score, observations, recommendations)
VALUES
  ('30000000-0000-0000-0000-000000000001', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-10-15',
    75, 70, 85, 80, 78, 82, 76, 74, 79, 81, 84, 898, 82, 'Áreas de soldadura con residuos.', 'Refuerzo de limpieza semanal.'),
  ('30000000-0000-0000-0000-000000000002', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'f76c8d54-0fba-4480-ac76-108a4356b629', '2025-11-10',
    92, 90, 95, 94, 96, 93, 91, 89, 88, 94, 95, 1017, 92, 'Condiciones óptimas.', 'Mantener rutinas actuales.')
ON CONFLICT (id) DO NOTHING;

-- Inventario ---------------------------------------------------------------------
INSERT INTO public.inventory_items (id, name, description, category, stock_quantity, min_stock, unit_price, location)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'Casco de Seguridad Blanco', 'Casco dieléctrico estándar', 'epp', 23, 10, 45.00, 'Depósito General'),
  ('10000000-0000-0000-0000-000000000002', 'Guantes de Nitrilo (Caja x100)', 'Caja de guantes descartables', 'epp', 6, 5, 32.50, 'Depósito General'),
  ('10000000-0000-0000-0000-000000000003', 'Extintor PQS 10kg', 'Extintor polvo químico seco', 'equipo', 12, 8, 180.00, 'Planta de Producción'),
  ('10000000-0000-0000-0000-000000000004', 'Botiquín Primeros Auxilios', 'Botiquín completo para brigada', 'otro', 6, 3, 95.00, 'Oficinas'),
  ('10000000-0000-0000-0000-000000000005', 'Silla Ergonómica Oficina', 'Silla con soporte lumbar', 'equipo', 3, 2, 210.00, 'Oficinas'),
  ('10000000-0000-0000-0000-000000000006', 'Detector de Humo', 'Detector fotoeléctrico', 'equipo', 15, 5, 65.00, 'Planta de Producción'),
  ('10000000-0000-0000-0000-000000000007', 'Calzado de Seguridad Talle 42', 'Calzado dieléctrico', 'epp', 4, 8, 120.00, 'Depósito General'),
  ('10000000-0000-0000-0000-000000000008', 'Destornillador Set x12', 'Set profesional punta imantada', 'herramienta', 15, 5, 85.00, 'Depósito General'),
  ('10000000-0000-0000-0000-000000000009', 'Taladro Percutor Eléctrico', 'Taladro 750W industrial', 'herramienta', 3, 2, 320.00, 'Depósito General')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_assignments (id, item_id, user_id, quantity, assigned_date, return_date, status, notes)
VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'f76c8d54-0fba-4480-ac76-108a4356b629', 2, '2025-11-10', NULL, 'asignado', 'Entrega para equipo de visitas'),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', '59b47140-d8fa-4717-877a-44629a6bc4a9', 1, '2025-10-15', '2025-11-05', 'devuelto', 'Uso en mantenimiento urgente')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_movements (id, item_id, assignment_id, movement_type, quantity, user_id, condition_before, condition_after, observations, authorized_by, movement_date)
VALUES
  ('a0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'asignacion', 2, 'f76c8d54-0fba-4480-ac76-108a4356b629', 'nuevo', 'bueno', 'Asignación inicial a RRHH', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-11-10'),
  ('a0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', NULL, 'entrada', 10, NULL, NULL, 'nuevo', 'Reposición de stock', '59b47140-d8fa-4717-877a-44629a6bc4a9', '2025-11-05'),
  ('a0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000002', 'asignacion', 1, '59b47140-d8fa-4717-877a-44629a6bc4a9', 'bueno', 'bueno', 'Uso en mantenimiento', 'f76c8d54-0fba-4480-ac76-108a4356b629', '2025-10-15'),
  ('a0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000002', 'devolucion', 1, '59b47140-d8fa-4717-877a-44629a6bc4a9', 'bueno', 'bueno', 'Sin novedades', 'f76c8d54-0fba-4480-ac76-108a4356b629', '2025-11-05'),
  ('a0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000007', NULL, 'salida', 2, NULL, 'nuevo', 'bueno', 'Entrega a Operaciones', '33333333-3333-3333-3333-333333333333', '2025-11-08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.inventory_maintenance (id, item_id, maintenance_type, scheduled_date, completed_date, performed_by, status, description, observations, cost)
VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'preventivo', '2025-12-01', NULL, '33333333-3333-3333-3333-333333333333', 'pendiente', 'Recarga anual de extintores', NULL, 2500),
  ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'preventivo', '2025-11-25', NULL, '33333333-3333-3333-3333-333333333333', 'en_proceso', 'Limpieza de detectores', 'Se reemplazan baterías', 450),
  ('40000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000009', 'correctivo', '2025-10-20', '2025-10-22', '59b47140-d8fa-4717-877a-44629a6bc4a9', 'completado', 'Cambio de carbones', 'Herramienta operativa nuevamente', 8500)
ON CONFLICT (id) DO NOTHING;

-- Documentos --------------------------------------------------------------------
INSERT INTO public.documents (id, title, description, category, file_path, file_size, mime_type, version, uploaded_by, is_public, tags)
VALUES
  ('90000000-0000-0000-0000-000000000001', 'Política de Seguridad e Higiene 2025', 'Documento oficial de políticas vigentes', 'politica', 'documents/public/politica-seguridad-2025.pdf', 102400, 'application/pdf', 1, '59b47140-d8fa-4717-877a-44629a6bc4a9', true, ARRAY['seguridad','higiene','politica']),
  ('90000000-0000-0000-0000-000000000002', 'Contrato Laboral - María González', 'Contrato firmado indefinido', 'contrato', 'documents/private/cont-maria-gonzalez.pdf', 204800, 'application/pdf', 1, '59b47140-d8fa-4717-877a-44629a6bc4a9', false, ARRAY['contrato','rrhh','confidencial']),
  ('90000000-0000-0000-0000-000000000003', 'Manual de Uso de EPP', 'Material de capacitación', 'capacitacion', 'documents/public/manual-epp-v2.pdf', 153600, 'application/pdf', 2, '33333333-3333-3333-3333-333333333333', true, ARRAY['epp','capacitacion','seguridad'])
ON CONFLICT (id) DO NOTHING;

-- Incidentes --------------------------------------------------------------------
INSERT INTO public.incidents (id, title, description, incident_type, severity, location, reported_by, assigned_to, status, resolution)
VALUES
  ('80000000-0000-0000-0000-000000000001', 'Derrame de líquido en pasillo', 'Derrame moderado cercano a línea de producción', 'incidente', 'media', 'Planta de Producción', 'f76c8d54-0fba-4480-ac76-108a4356b629', '33333333-3333-3333-3333-333333333333', 'resuelto', 'Limpieza inmediata y señalización'),
  ('80000000-0000-0000-0000-000000000002', 'Falla sistema ventilación', 'Caudal insuficiente detectado', 'condicion_insegura', 'alta', 'Depósito General', '59b47140-d8fa-4717-877a-44629a6bc4a9', '33333333-3333-3333-3333-333333333333', 'en_progreso', NULL),
  ('80000000-0000-0000-0000-000000000003', 'Extintor descargado', 'Extintor sin presión', 'incidente', 'media', 'Oficinas Administrativas', 'f76c8d54-0fba-4480-ac76-108a4356b629', '33333333-3333-3333-3333-333333333333', 'abierto', NULL),
  ('80000000-0000-0000-0000-000000000004', 'Caída de trabajador', 'Resbalón en zona de carga', 'accidente', 'alta', 'Depósito - Zona carga', '59b47140-d8fa-4717-877a-44629a6bc4a9', '33333333-3333-3333-3333-333333333333', 'cerrado', 'Investigación concluida, capacitación adicional')
ON CONFLICT (id) DO NOTHING;

-- Reclutamiento ----------------------------------------------------------------
INSERT INTO public.recruitment_positions (id, title, department, location, seniority, description, status, hiring_manager, created_by)
VALUES
  ('91000000-0000-0000-0000-000000000001', 'Especialista en Seguridad Industrial', 'Seguridad e Higiene', 'Planta de Producción', 'Senior', 'Liderar iniciativas de prevención y programas de seguridad industrial.', 'en_proceso', '33333333-3333-3333-3333-333333333333', '59b47140-d8fa-4717-877a-44629a6bc4a9'),
  ('91000000-0000-0000-0000-000000000002', 'Analista de RRHH Jr', 'Recursos Humanos', 'Oficinas Administrativas', 'Semi Senior', 'Soporte a procesos de onboarding y gestión documental.', 'abierta', 'f76c8d54-0fba-4480-ac76-108a4356b629', '59b47140-d8fa-4717-877a-44629a6bc4a9')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recruitment_candidates (id, full_name, email, phone, source, seniority, status, assigned_recruiter, resume_url, current_location, notes)
VALUES
  ('92000000-0000-0000-0000-000000000001', 'Gabriela Torres', 'gabriela.torres@talento.com', '+52 55 1234 5678', 'LinkedIn', 'Senior', 'en_proceso', 'f76c8d54-0fba-4480-ac76-108a4356b629', 'recruitment/cv-gabriela-torres.pdf', 'Ciudad de México', 'Experta en normas OSHA e ISO 45001.'),
  ('92000000-0000-0000-0000-000000000002', 'Julián Pérez', 'julian.perez@talento.com', '+54 11 9876 5432', 'Referencia interna', 'Junior', 'nuevo', 'f76c8d54-0fba-4480-ac76-108a4356b629', 'recruitment/cv-julian-perez.pdf', 'Buenos Aires', 'Interés en desarrollo de carrera en RRHH.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recruitment_applications (id, candidate_id, position_id, hiring_manager, salary_expectation, availability_date, status, current_stage, priority, created_by)
VALUES
  ('93000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 28000, '2026-01-15', 'entrevista', 'entrevista técnica', 'alta', 'f76c8d54-0fba-4480-ac76-108a4356b629'),
  ('93000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000002', 'f76c8d54-0fba-4480-ac76-108a4356b629', 15000, '2025-12-01', 'en_revision', 'screening', 'media', 'f76c8d54-0fba-4480-ac76-108a4356b629')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recruitment_interviews (id, application_id, interview_type, status, scheduled_at, duration_minutes, location, meeting_url, created_by)
VALUES
  ('94000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001', 'tecnica', 'programada', '2025-12-05 15:00:00+00', 60, 'Sala 3 - Planta', 'https://meet.hr-hub.com/seguridad', 'f76c8d54-0fba-4480-ac76-108a4356b629')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recruitment_interview_participants (interview_id, participant_id, participant_role, response_status)
VALUES
  ('94000000-0000-0000-0000-000000000001', 'f76c8d54-0fba-4480-ac76-108a4356b629', 'reclutador', 'confirmado'),
  ('94000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'hiring_manager', 'pendiente')
ON CONFLICT (interview_id, participant_id) DO NOTHING;

INSERT INTO public.recruitment_notes (id, application_id, interview_id, author_id, visibility, content)
VALUES
  ('95000000-0000-0000-0000-000000000001', '93000000-0000-0000-0000-000000000001', NULL, 'f76c8d54-0fba-4480-ac76-108a4356b629', 'rrhh', 'Candidata con experiencia liderando auditorías y manejo de brigadas.'),
  ('95000000-0000-0000-0000-000000000002', '93000000-0000-0000-0000-000000000001', '94000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'panel', 'Se propone enfocarse en planes de respuesta ante emergencias durante la entrevista técnica.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.recruitment_files (id, candidate_id, file_path, file_type, mime_type, file_size, uploaded_by)
VALUES
  ('96000000-0000-0000-0000-000000000001', '92000000-0000-0000-0000-000000000001', 'recruitment/cv-gabriela-torres.pdf', 'cv', 'application/pdf', 204800, 'f76c8d54-0fba-4480-ac76-108a4356b629'),
  ('96000000-0000-0000-0000-000000000002', '92000000-0000-0000-0000-000000000002', 'recruitment/cv-julian-perez.pdf', 'cv', 'application/pdf', 153600, 'f76c8d54-0fba-4480-ac76-108a4356b629')
ON CONFLICT (id) DO NOTHING;

COMMIT;
