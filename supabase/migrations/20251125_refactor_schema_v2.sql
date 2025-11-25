-- Migration: Refactor Schema to unify Areas and Positions
-- Description: Creates public.positions, adds FKs to profiles/contracts, and migrates data.

-- 0. Ensure areas table exists and has RLS
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'areas' AND policyname = 'Everyone can view areas') THEN
        CREATE POLICY "Everyone can view areas" ON public.areas FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'areas' AND policyname = 'Admins can manage areas') THEN
        CREATE POLICY "Admins can manage areas" ON public.areas FOR ALL USING (
          EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin_rrhh'))
        );
    END IF;
END $$;

-- 1. Create positions table
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    area_id UUID REFERENCES public.areas(id),
    status TEXT NOT NULL DEFAULT 'activo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for positions
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'positions' AND policyname = 'Everyone can view positions') THEN
        CREATE POLICY "Everyone can view positions" ON public.positions FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'positions' AND policyname = 'Admins can manage positions') THEN
        CREATE POLICY "Admins can manage positions" ON public.positions FOR ALL USING (
          EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin_rrhh'))
        );
    END IF;
END $$;

-- 2. Populate Areas from existing profiles.department
INSERT INTO public.areas (name)
SELECT DISTINCT department 
FROM public.profiles 
WHERE department IS NOT NULL 
  AND department NOT IN (SELECT name FROM public.areas)
  AND department != '';

-- 3. Populate Positions from existing profiles.position
-- We try to link to an area if possible, but for now we just insert the titles
INSERT INTO public.positions (title)
SELECT DISTINCT position 
FROM public.profiles 
WHERE position IS NOT NULL 
  AND position NOT IN (SELECT title FROM public.positions)
  AND position != '';

-- 4. Add Foreign Keys to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id);

-- 5. Migrate data for profiles
DO $$
DECLARE
    r RECORD;
    a_id UUID;
    p_id UUID;
BEGIN
    FOR r IN SELECT id, department, position FROM public.profiles WHERE area_id IS NULL OR position_id IS NULL LOOP
        -- Find Area ID
        SELECT id INTO a_id FROM public.areas WHERE name = r.department LIMIT 1;
        -- Find Position ID
        SELECT id INTO p_id FROM public.positions WHERE title = r.position LIMIT 1;
        
        -- Update Profile
        UPDATE public.profiles 
        SET area_id = a_id, position_id = p_id 
        WHERE id = r.id;
    END LOOP;
END $$;

-- 6. Add Foreign Keys to contracts
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.areas(id);
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES public.positions(id);

-- 7. Migrate data for contracts
DO $$
DECLARE
    r RECORD;
    a_id UUID;
    p_id UUID;
BEGIN
    FOR r IN SELECT id, department, position FROM public.contracts WHERE area_id IS NULL OR position_id IS NULL LOOP
        -- Find Area ID
        SELECT id INTO a_id FROM public.areas WHERE name = r.department LIMIT 1;
        -- Find Position ID
        SELECT id INTO p_id FROM public.positions WHERE title = r.position LIMIT 1;
        
        -- Update Contract
        UPDATE public.contracts 
        SET area_id = a_id, position_id = p_id 
        WHERE id = r.id;
    END LOOP;
END $$;

-- 8. Make columns nullable for now to avoid breaking existing code immediately, 
-- but eventually they should be NOT NULL if strictly required.
-- We leave them nullable as per standard migration safety practices.

-- 9. Fix RLS for recruitment_positions (missing in original schema)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_positions' AND policyname = 'Everyone can view recruitment positions') THEN
        CREATE POLICY "Everyone can view recruitment positions" ON public.recruitment_positions FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_positions' AND policyname = 'Admins can manage recruitment positions') THEN
        CREATE POLICY "Admins can manage recruitment positions" ON public.recruitment_positions FOR ALL USING (
          EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin_rrhh'))
        );
    END IF;
END $$;

-- 10. Fix RLS for other recruitment tables
DO $$ 
BEGIN
    -- Candidates
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_candidates' AND policyname = 'Admins can manage candidates') THEN
        CREATE POLICY "Admins can manage candidates" ON public.recruitment_candidates FOR ALL USING (
          EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin_rrhh'))
        );
    END IF;

    -- Applications
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_applications' AND policyname = 'Admins can manage applications') THEN
        CREATE POLICY "Admins can manage applications" ON public.recruitment_applications FOR ALL USING (
          EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin_rrhh'))
        );
    END IF;

    -- Interviews
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recruitment_interviews' AND policyname = 'Admins can manage interviews') THEN
        CREATE POLICY "Admins can manage interviews" ON public.recruitment_interviews FOR ALL USING (
          EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('superadmin', 'admin_rrhh'))
        );
    END IF;
END $$;
