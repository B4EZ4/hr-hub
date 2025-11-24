-- Add estado, motivo_rechazo and employee reference to documents table
-- Add estado enum type
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pendiente', 'validado', 'rechazado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS estado document_status NOT NULL DEFAULT 'pendiente',
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES profiles(user_id) ON DELETE RESTRICT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_documents_estado ON documents(estado);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(created_at);

-- Update RLS policies to consider estado
DROP POLICY IF EXISTS "Admins can manage all documents" ON documents;
DROP POLICY IF EXISTS "Everyone can view public documents" ON documents;
DROP POLICY IF EXISTS "Users can view their documents" ON documents;

-- Admins can manage all documents
CREATE POLICY "Admins manage all documents"
ON documents FOR ALL
USING (has_role(auth.uid(), 'superadmin'::app_role) OR has_role(auth.uid(), 'admin_rrhh'::app_role));

-- Users can view their own documents (any estado)
CREATE POLICY "Users view own documents"
ON documents FOR SELECT
USING (auth.uid() = uploaded_by OR auth.uid() = employee_id);

-- Users can view validated public documents
CREATE POLICY "View validated public documents"
ON documents FOR SELECT
USING (is_public = true AND estado = 'validado');

-- Users can insert their own documents (estado = pendiente by default)
CREATE POLICY "Users insert own documents"
ON documents FOR INSERT
WITH CHECK (auth.uid() = uploaded_by AND estado = 'pendiente');

COMMENT ON COLUMN documents.estado IS 'Estado del documento: pendiente, validado, rechazado';
COMMENT ON COLUMN documents.motivo_rechazo IS 'Motivo de rechazo si estado es rechazado';
COMMENT ON COLUMN documents.employee_id IS 'ID del empleado al que pertenece el documento';