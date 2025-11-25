-- Combined safe migration script
-- This script can be run multiple times without errors

-- 1. Fix recruitment FK constraints
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'recruitment_applications_candidate_id_fkey') THEN
        ALTER TABLE public.recruitment_applications DROP CONSTRAINT recruitment_applications_candidate_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'recruitment_interviews_application_id_fkey') THEN
        ALTER TABLE public.recruitment_interviews DROP CONSTRAINT recruitment_interviews_application_id_fkey;
    END IF;
    
    -- Add constraints with CASCADE
    ALTER TABLE public.recruitment_applications
    ADD CONSTRAINT recruitment_applications_candidate_id_fkey
    FOREIGN KEY (candidate_id) REFERENCES public.recruitment_candidates(id)
    ON DELETE CASCADE;
    
    ALTER TABLE public.recruitment_interviews
    ADD CONSTRAINT recruitment_interviews_application_id_fkey
    FOREIGN KEY (application_id) REFERENCES public.recruitment_applications(id)
    ON DELETE CASCADE;
END $$;

-- 2. Add biometric_id to profiles if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'biometric_id') THEN
        ALTER TABLE public.profiles ADD COLUMN biometric_id INTEGER UNIQUE;
    END IF;
END $$;

-- 3. Create biometric_templates table if not exists
CREATE TABLE IF NOT EXISTS public.biometric_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    biometric_id INTEGER NOT NULL,
    template_data TEXT NOT NULL,
    finger_position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, finger_position)
);

-- 4. Create device_commands table if not exists
CREATE TABLE IF NOT EXISTS public.device_commands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id TEXT NOT NULL,
    command_type TEXT NOT NULL,
    payload JSONB,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Enable RLS on new tables
ALTER TABLE public.biometric_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_commands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (to avoid duplicates)
DROP POLICY IF EXISTS "allow_authenticated_read_attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "allow_service_role_insert_attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "allow_service_role_update_attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "allow_user_insert_own_attendance" ON public.attendance_records;
DROP POLICY IF EXISTS "allow_user_update_own_attendance" ON public.attendance_records;

-- 7. Create RLS policies for attendance_records
CREATE POLICY "allow_authenticated_read_attendance" 
ON public.attendance_records
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_service_role_insert_attendance" 
ON public.attendance_records
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "allow_service_role_update_attendance" 
ON public.attendance_records
FOR UPDATE
TO service_role
USING (true);

CREATE POLICY "allow_user_insert_own_attendance" 
ON public.attendance_records
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_user_update_own_attendance" 
ON public.attendance_records
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- 8. Create index for device_commands polling
CREATE INDEX IF NOT EXISTS idx_device_commands_polling 
ON public.device_commands(device_id, status, created_at);

-- 9. Add FK for attendance_records if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_records_user_id_fkey'
    ) THEN
        ALTER TABLE public.attendance_records
        ADD CONSTRAINT attendance_records_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES public.users(id)
        ON DELETE CASCADE;
    END IF;
END $$;
