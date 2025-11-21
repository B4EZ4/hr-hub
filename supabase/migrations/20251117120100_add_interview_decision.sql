ALTER TABLE public.recruitment_interviews
ADD COLUMN IF NOT EXISTS decision text NOT NULL DEFAULT 'pendiente'
  CHECK (decision IN ('pendiente','aprobado','rechazado','otra'));
