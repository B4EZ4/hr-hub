-- Migración simplificada: Empleados sin cuenta de usuario

-- PASO 1: Hacer columnas nullable
ALTER TABLE public.inventory_assignments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.inventory_movements ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.inventory_movements ALTER COLUMN authorized_by DROP NOT NULL;
ALTER TABLE public.inventory_maintenance ALTER COLUMN performed_by DROP NOT NULL;
ALTER TABLE public.inventory_alerts ALTER COLUMN resolved_by DROP NOT NULL;
ALTER TABLE public.documents ALTER COLUMN employee_id DROP NOT NULL;

-- PASO 2: Limpiar referencias temporalmente
UPDATE inventory_maintenance SET performed_by = NULL;
UPDATE inventory_movements SET authorized_by = NULL, user_id = NULL;
UPDATE inventory_assignments SET user_id = NULL;
UPDATE inventory_alerts SET resolved_by = NULL;
UPDATE documents SET employee_id = NULL;

-- PASO 3: Actualizar FK para referenciar profiles.id
ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS documents_employee_id_fkey;
ALTER TABLE public.documents ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_maintenance DROP CONSTRAINT IF EXISTS inventory_maintenance_performed_by_fkey;
ALTER TABLE public.inventory_maintenance ADD CONSTRAINT inventory_maintenance_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_authorized_by_fkey;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_authorized_by_fkey FOREIGN KEY (authorized_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_user_id_fkey;
ALTER TABLE public.inventory_movements ADD CONSTRAINT inventory_movements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.inventory_assignments DROP CONSTRAINT IF EXISTS inventory_assignments_user_id_fkey;
ALTER TABLE public.inventory_assignments ADD CONSTRAINT inventory_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.inventory_alerts DROP CONSTRAINT IF EXISTS inventory_alerts_resolved_by_fkey;
ALTER TABLE public.inventory_alerts ADD CONSTRAINT inventory_alerts_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- PASO 4: Modificar profiles
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_key CASCADE;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX profiles_user_id_unique_idx ON public.profiles(user_id) WHERE user_id IS NOT NULL;

-- PASO 5: Agregar employee_number
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS employee_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_employee_number() RETURNS TEXT AS $$
DECLARE next_num INTEGER; emp_num TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM public.profiles;
  emp_num := 'EMP-' || LPAD(next_num::TEXT, 5, '0');
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE employee_number = emp_num) LOOP
    next_num := next_num + 1; emp_num := 'EMP-' || LPAD(next_num::TEXT, 5, '0');
  END LOOP;
  RETURN emp_num;
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_employee_number() RETURNS TRIGGER AS $$
BEGIN IF NEW.employee_number IS NULL THEN NEW.employee_number := generate_employee_number(); END IF; RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_employee_number_trigger ON public.profiles;
CREATE TRIGGER set_employee_number_trigger BEFORE INSERT ON public.profiles FOR EACH ROW EXECUTE FUNCTION set_employee_number();

WITH numbered AS (SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn FROM public.profiles WHERE employee_number IS NULL)
UPDATE public.profiles p SET employee_number = 'EMP-' || LPAD(np.rn::TEXT, 5, '0') FROM numbered np WHERE p.id = np.id;

-- PASO 6: Políticas RLS
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "System users can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can delete profiles" ON public.profiles;

CREATE POLICY "Auth view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update profiles" ON public.profiles FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Auth delete profiles" ON public.profiles FOR DELETE TO authenticated USING (true);

-- PASO 7: Actualizar contracts - eliminar datos huérfanos primero
DELETE FROM public.contracts WHERE user_id NOT IN (SELECT id FROM public.profiles);

ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_user_id_fkey;
ALTER TABLE public.contracts RENAME COLUMN user_id TO profile_id;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- PASO 8: Políticas contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can view contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can insert contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can update contracts" ON public.contracts;
DROP POLICY IF EXISTS "Authenticated users can delete contracts" ON public.contracts;

CREATE POLICY "Auth view contracts" ON public.contracts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth insert contracts" ON public.contracts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update contracts" ON public.contracts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Auth delete contracts" ON public.contracts FOR DELETE TO authenticated USING (true);

-- PASO 9: Función hire_candidate
CREATE OR REPLACE FUNCTION hire_candidate(candidate_id UUID, contract_data JSONB) RETURNS JSONB AS $$
DECLARE candidate_record RECORD; new_profile_id UUID; new_contract_id UUID;
BEGIN
  SELECT * INTO candidate_record FROM public.recruitment_candidates WHERE id = candidate_id;
  IF candidate_record IS NULL THEN RAISE EXCEPTION 'Candidato no encontrado'; END IF;
  
  INSERT INTO public.profiles (full_name, email, phone, position, department, status, hire_date)
  VALUES (candidate_record.full_name, candidate_record.email, candidate_record.phone, contract_data->>'position', contract_data->>'department', 'activo', CURRENT_DATE)
  RETURNING id INTO new_profile_id;
  
  INSERT INTO public.contracts (profile_id, contract_number, type, position, start_date, salary, status, department)
  VALUES (new_profile_id, contract_data->>'contract_number', contract_data->>'type', contract_data->>'position', (contract_data->>'start_date')::DATE, (contract_data->>'salary')::NUMERIC, 'activo', contract_data->>'department')
  RETURNING id INTO new_contract_id;
  
  UPDATE public.recruitment_candidates SET status = 'contratado', updated_at = NOW() WHERE id = candidate_id;
  
  RETURN jsonb_build_object('profile_id', new_profile_id, 'contract_id', new_contract_id, 'employee_number', (SELECT employee_number FROM public.profiles WHERE id = new_profile_id), 'success', true);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;