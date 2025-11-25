-- Migration to add ON DELETE CASCADE to recruitment foreign keys
-- This allows deleting a candidate to automatically delete their applications and interviews

-- 1. Update recruitment_applications to cascade delete when candidate is deleted
ALTER TABLE public.recruitment_applications
DROP CONSTRAINT IF EXISTS recruitment_applications_candidate_id_fkey;

ALTER TABLE public.recruitment_applications
ADD CONSTRAINT recruitment_applications_candidate_id_fkey
FOREIGN KEY (candidate_id) REFERENCES public.recruitment_candidates(id)
ON DELETE CASCADE;

-- 2. Update recruitment_interviews to cascade delete when application is deleted
ALTER TABLE public.recruitment_interviews
DROP CONSTRAINT IF EXISTS recruitment_interviews_application_id_fkey;

ALTER TABLE public.recruitment_interviews
ADD CONSTRAINT recruitment_interviews_application_id_fkey
FOREIGN KEY (application_id) REFERENCES public.recruitment_applications(id)
ON DELETE CASCADE;

-- 3. Update recruitment_interview_participants to cascade delete when interview is deleted
ALTER TABLE public.recruitment_interview_participants
DROP CONSTRAINT IF EXISTS recruitment_interview_participants_interview_id_fkey;

ALTER TABLE public.recruitment_interview_participants
ADD CONSTRAINT recruitment_interview_participants_interview_id_fkey
FOREIGN KEY (interview_id) REFERENCES public.recruitment_interviews(id)
ON DELETE CASCADE;

-- 4. Update recruitment_notes to cascade delete when interview is deleted
ALTER TABLE public.recruitment_notes
DROP CONSTRAINT IF EXISTS recruitment_notes_interview_id_fkey;

ALTER TABLE public.recruitment_notes
ADD CONSTRAINT recruitment_notes_interview_id_fkey
FOREIGN KEY (interview_id) REFERENCES public.recruitment_interviews(id)
ON DELETE CASCADE;
