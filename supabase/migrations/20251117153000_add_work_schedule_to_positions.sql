ALTER TABLE public.recruitment_positions
ADD COLUMN IF NOT EXISTS work_start_time time,
ADD COLUMN IF NOT EXISTS work_end_time time;
