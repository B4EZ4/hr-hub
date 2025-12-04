-- Table Definition
CREATE TABLE "public"."areas" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "parent_area_id" uuid,
    "responsible_id" uuid,
    "status" text NOT NULL DEFAULT 'activo'::text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "areas_parent_area_id_fkey" FOREIGN KEY ("parent_area_id") REFERENCES "public"."areas"("id"),
    PRIMARY KEY ("id")
);

DROP TYPE IF EXISTS "public"."app_role";
CREATE TYPE "public"."app_role" AS ENUM ('superadmin', 'admin_rrhh', 'empleado');

-- Table Definition
CREATE TABLE "public"."user_roles" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "role" "public"."app_role" NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX user_roles_user_id_role_key ON public.user_roles USING btree (user_id, role);
CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);

-- Table Definition
CREATE TABLE "public"."user_sessions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "token" text NOT NULL,
    "expires_at" timestamptz NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "last_active_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX user_sessions_token_key ON public.user_sessions USING btree (token);
CREATE INDEX idx_user_sessions_token ON public.user_sessions USING btree (token);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);
CREATE INDEX idx_user_sessions_expires_at ON public.user_sessions USING btree (expires_at);

-- Table Definition
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "full_name" text NOT NULL,Mhi5Z3ATrB4QPTuA
    "email" text NOT NULL,
    "phone" text,
    "address" text,
    "birth_date" date,
    "hire_date" date,
    "department" text,
    "position" text,
    "status" text DEFAULT 'activo'::text,
    "avatar_url" text,
    "emergency_contact_name" text,
    "emergency_contact_phone" text,
    "must_change_password" bool DEFAULT false,
    "biometric_id" int4,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "area_id" uuid,
    "rfc" varchar(13),
    "curp" varchar(18),
    "nss" varchar(11),
    "position_id" uuid,
    CONSTRAINT "profiles_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id"),
    CONSTRAINT "profiles_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id"),
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);
CREATE UNIQUE INDEX profiles_biometric_id_key ON public.profiles USING btree (biometric_id);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

-- Table Definition
CREATE TABLE "public"."attendance_records" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "attendance_date" date NOT NULL,
    "scheduled_start" time NOT NULL,
    "scheduled_end" time NOT NULL,
    "check_in" timestamptz,
    "check_out" timestamptz,
    "status" text NOT NULL DEFAULT 'pendiente'::text,
    "minutes_late" int4 NOT NULL DEFAULT 0,
    "notes" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "attendance_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."audit_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "action" text NOT NULL,
    "table_name" text NOT NULL,
    "record_id" uuid,
    "old_values" jsonb,
    "new_values" jsonb,
    "ip_address" text,
    "user_agent" text,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."auth_audit" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "email" text,
    "action" text NOT NULL,
    "ip_address" text,
    "user_agent" text,
    "success" bool NOT NULL DEFAULT true,
    "metadata" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "auth_audit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."biometric_events" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid,
    "event_type" text NOT NULL,
    "device_id" text NOT NULL,
    "hash" text,
    "metadata" jsonb,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "biometric_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."contracts" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "contract_number" text NOT NULL,
    "type" text NOT NULL,
    "position" text NOT NULL,
    "department" text,
    "start_date" date NOT NULL,
    "end_date" date,
    "salary" numeric,
    "status" text DEFAULT 'activo'::text,
    "file_path" text,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "area_id" uuid,
    "position_id" uuid,
    "file_url" text,
    CONSTRAINT "contracts_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id"),
    CONSTRAINT "contracts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id"),
    CONSTRAINT "contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."biometric_templates" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "device_id" text NOT NULL,
    "encrypted_template" text NOT NULL,
    "method" text NOT NULL DEFAULT 'fingerprint'::text,
    "status" text NOT NULL DEFAULT 'active'::text,
    "finger_id" int4,
    "template_data" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "biometric_templates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX biometric_templates_user_id_device_id_method_status_key ON public.biometric_templates USING btree (user_id, device_id, method, status);

-- Table Definition
CREATE TABLE "public"."despido_documentos" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "despido_id" uuid NOT NULL,
    "nombre_archivo" text NOT NULL,
    "tipo_documento" text NOT NULL,
    "file_path" text NOT NULL,
    "file_size" int8,
    "mime_type" text,
    "uploaded_by" uuid,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "despido_documentos_despido_id_fkey" FOREIGN KEY ("despido_id") REFERENCES "public"."despidos"("id") ON DELETE CASCADE,
    CONSTRAINT "despido_documentos_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."despidos" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" uuid NOT NULL,
    "tipo_despido" text NOT NULL,
    "motivo" text NOT NULL,
    "fecha_despido" date NOT NULL,
    "estado" text NOT NULL DEFAULT 'pendiente'::text,
    "indemnizacion" numeric,
    "liquidacion_final" numeric,
    "observaciones" text,
    "created_by" uuid,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "despidos_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id"),
    CONSTRAINT "despidos_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."profiles"("user_id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."incidents" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text NOT NULL,
    "incident_type" text NOT NULL,
    "severity" text NOT NULL,
    "location" text,
    "status" text DEFAULT 'abierto'::text,
    "reported_by" uuid NOT NULL,
    "assigned_to" uuid NOT NULL,
    "resolution" text,
    "resolved_at" timestamptz,
    "file_paths" _text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "incidents_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."profiles"("user_id"),
    CONSTRAINT "incidents_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id"),
    PRIMARY KEY ("id")
);

DROP TYPE IF EXISTS "public"."document_status";
CREATE TYPE "public"."document_status" AS ENUM ('pendiente', 'validado', 'rechazado');

-- Table Definition
CREATE TABLE "public"."documents" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "category" text NOT NULL,
    "description" text,
    "file_path" text NOT NULL,
    "file_size" int4,
    "mime_type" text,
    "uploaded_by" uuid,
    "employee_id" uuid,
    "is_public" bool DEFAULT false,
    "estado" "public"."document_status" NOT NULL DEFAULT 'pendiente'::document_status,
    "motivo_rechazo" text,
    "tags" _text,
    "version" int4 DEFAULT 1,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "documents_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."inventory_items" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "category" text NOT NULL,
    "description" text,
    "stock_quantity" int4 DEFAULT 0,
    "min_stock" int4 DEFAULT 0,
    "unit_price" numeric,
    "location" text,
    "status" text DEFAULT 'disponible'::text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_inventory_items_normalized_name ON public.inventory_items USING btree (normalize_item_name(name));

-- Table Definition
CREATE TABLE "public"."recruitment_positions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "department" text,
    "location" text,
    "seniority" text,
    "description" text,
    "status" text NOT NULL DEFAULT 'abierta'::text,
    "hiring_manager" uuid,
    "work_start_time" time,
    "work_end_time" time,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."recruitment_applications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "candidate_id" uuid NOT NULL,
    "position_id" uuid,
    "status" text NOT NULL DEFAULT 'en_revision'::text,
    "current_stage" text DEFAULT 'screening'::text,
    "hiring_manager" uuid,
    "salary_expectation" numeric,
    "availability_date" date,
    "priority" text DEFAULT 'media'::text,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "recruitment_applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "public"."recruitment_candidates"("id") ON DELETE CASCADE,
    CONSTRAINT "recruitment_applications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id"),
    CONSTRAINT "recruitment_applications_hiring_manager_fkey" FOREIGN KEY ("hiring_manager") REFERENCES "public"."users"("id"),
    CONSTRAINT "recruitment_applications_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."recruitment_positions"("id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."recruitment_interview_participants" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "interview_id" uuid NOT NULL,
    "participant_id" uuid NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "recruitment_interview_participants_interview_id_fkey" FOREIGN KEY ("interview_id") REFERENCES "public"."recruitment_interviews"("id") ON DELETE CASCADE,
    CONSTRAINT "recruitment_interview_participants_participant_id_fkey" FOREIGN KEY ("participant_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."recruitment_interviews" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "application_id" uuid NOT NULL,
    "interview_type" text NOT NULL,
    "scheduled_at" timestamptz NOT NULL,
    "duration_minutes" int4,
    "location" text,
    "meeting_url" text,
    "status" text NOT NULL DEFAULT 'programada'::text,
    "decision" text NOT NULL DEFAULT 'pendiente'::text,
    "feedback_summary" text,
    "next_steps" text,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "recruitment_interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "public"."recruitment_applications"("id") ON DELETE CASCADE,
    CONSTRAINT "recruitment_interviews_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."notifications" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "title" text NOT NULL,
    "message" text NOT NULL,
    "type" text NOT NULL,
    "link" text,
    "is_read" bool DEFAULT false,
    "read_at" timestamptz,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."sh_sectors" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "risk_level" text,
    "responsible_id" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."recruitment_candidates" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "full_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "current_location" text,
    "resume_url" text,
    "source" text,
    "seniority" text,
    "status" text NOT NULL DEFAULT 'nuevo'::text,
    "assigned_recruiter" uuid,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "rfc" text,
    "curp" text,
    "nss" text,
    "address" text,
    CONSTRAINT "recruitment_candidates_assigned_recruiter_fkey" FOREIGN KEY ("assigned_recruiter") REFERENCES "public"."profiles"("user_id") ON DELETE SET NULL,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."inventory_assignments" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "item_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "quantity" int4 NOT NULL,
    "assigned_date" date NOT NULL DEFAULT CURRENT_DATE,
    "return_date" date,
    "status" text DEFAULT 'asignado'::text,
    "notes" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "inventory_assignments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE,
    CONSTRAINT "inventory_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."device_commands" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "device_id" text NOT NULL,
    "command_type" text NOT NULL,
    "payload" jsonb,
    "status" text DEFAULT 'pending'::text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_device_commands_device_status ON public.device_commands USING btree (device_id, status);
CREATE INDEX idx_device_commands_polling ON public.device_commands USING btree (device_id, status, created_at);

-- Table Definition
CREATE TABLE "public"."users" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "email" text NOT NULL,
    "username" text,
    "full_name" text NOT NULL,
    "phone" text,
    "password_hash" text NOT NULL,
    "status" text NOT NULL DEFAULT 'activo'::text,
    "department" text,
    "position" text,
    "last_login_at" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "is_verified" bool NOT NULL DEFAULT false,
    "is_locked" bool NOT NULL DEFAULT false,
    "failed_login_attempts" int4 NOT NULL DEFAULT 0,
    "password_reset_token" text,
    "password_reset_expires_at" timestamptz,
    "verification_token" text,
    "area_id" uuid,
    "position_id" uuid,
    CONSTRAINT "users_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id"),
    CONSTRAINT "users_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."areas"("id"),
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_username ON public.users USING btree (username);
CREATE INDEX idx_users_status ON public.users USING btree (status);

-- Table Definition
CREATE TABLE "public"."sh_inspections" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sector_id" uuid NOT NULL,
    "inspector_id" uuid NOT NULL,
    "scheduled_date" date NOT NULL,
    "completed_date" date,
    "status" text DEFAULT 'programada'::text,
    "findings" text,
    "recommendations" text,
    "file_paths" _text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "sh_inspections_inspector_id_fkey" FOREIGN KEY ("inspector_id") REFERENCES "public"."users"("id"),
    CONSTRAINT "sh_inspections_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sh_sectors"("id"),
    PRIMARY KEY ("id")
);

-- Table Definition
CREATE TABLE "public"."positions" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "title" text NOT NULL,
    "description" text,
    "area_id" uuid,
    "status" text NOT NULL DEFAULT 'activo'::text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    "work_start_time" time DEFAULT '09:00:00'::time without time zone,
    "work_end_time" time DEFAULT '18:00:00'::time without time zone,
    CONSTRAINT "positions_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id"),
    PRIMARY KEY ("id")
);

 SELECT p.user_id,
    p.full_name,
    p.avatar_url,
    p.hire_date,
    p.status AS employee_status,
    a.name AS department_name,
    EXTRACT(year FROM age((CURRENT_DATE)::timestamp with time zone, (p.hire_date)::timestamp with time zone)) AS years_of_service,
    COALESCE(vb.total_days, calculate_entitled_days(p.hire_date)) AS total_days,
    COALESCE(vb.used_days, 0) AS used_days,
    (COALESCE(vb.total_days, calculate_entitled_days(p.hire_date)) - COALESCE(vb.used_days, 0)) AS remaining_days
   FROM ((profiles p
     LEFT JOIN areas a ON ((p.area_id = a.id)))
     LEFT JOIN vacation_balances vb ON ((p.user_id = vb.user_id)))
  WHERE (p.status = 'activo'::text);

DROP TYPE IF EXISTS "public"."request_status";
CREATE TYPE "public"."request_status" AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Table Definition
CREATE TABLE "public"."vacation_requests" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "start_date" date NOT NULL,
    "end_date" date NOT NULL,
    "days_requested" int4 NOT NULL,
    "status" "public"."request_status" NOT NULL DEFAULT 'pending'::request_status,
    "employee_note" text,
    "manager_note" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT "fk_vacation_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id"),
    CONSTRAINT "fk_vacation_requests_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id"),
    CONSTRAINT "vacation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_vacation_requests_user_id ON public.vacation_requests USING btree (user_id);
CREATE INDEX idx_vacation_requests_status ON public.vacation_requests USING btree (status);

DROP TYPE IF EXISTS "public"."checklist_category";
CREATE TYPE "public"."checklist_category" AS ENUM ('inspeccion', 'auditoria', 'epp', 'capacitacion', 'otro');

-- Table Definition
CREATE TABLE "public"."sh_checklists" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "name" text NOT NULL,
    "description" text,
    "category" "public"."checklist_category" NOT NULL DEFAULT 'inspeccion'::checklist_category,
    "is_active" bool DEFAULT true,
    "items" jsonb NOT NULL DEFAULT '[]'::jsonb,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "sh_checklists_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id"),
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_sh_checklists_category ON public.sh_checklists USING btree (category);
CREATE INDEX idx_sh_checklists_is_active ON public.sh_checklists USING btree (is_active);
CREATE INDEX idx_sh_checklists_created_by ON public.sh_checklists USING btree (created_by);
CREATE INDEX idx_sh_checklists_created_at ON public.sh_checklists USING btree (created_at DESC);
CREATE INDEX idx_sh_checklists_items ON public.sh_checklists USING gin (items);

 SELECT c.id,
    c.name,
    c.description,
    c.category,
    c.is_active,
    jsonb_array_length(c.items) AS item_count,
    u.full_name AS created_by_name,
    c.created_by,
    c.created_at,
    c.updated_at
   FROM (sh_checklists c
     LEFT JOIN users u ON ((c.created_by = u.id)));

 SELECT ae.id,
    ae.sector_id,
    ae.evaluation_date,
    ae.cleanliness_score,
    ae.order_score,
    ae.ventilation_score,
    ae.lighting_score,
    ae.ergonomics_score,
    ae.risk_control_score,
    ae.furniture_condition_score,
    ae.tools_condition_score,
    ae.hazmat_control_score,
    ae.signage_score,
    ae.compliance_score,
    ae.observations,
    ae.recommendations,
    ae.evaluated_by,
    ae.file_paths,
    ae.average_score,
    ae.evaluation_result,
    ss.name AS sector_name,
    ss.risk_level AS sector_risk_level,
    u.full_name AS evaluator_name,
    u.email AS evaluator_email,
    ae.created_at,
    ae.updated_at
   FROM ((sh_area_evaluations ae
     LEFT JOIN sh_sectors ss ON ((ae.sector_id = ss.id)))
     LEFT JOIN users u ON ((ae.evaluated_by = u.id)));

-- Table Definition
CREATE TABLE "public"."sh_area_evaluations" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "sector_id" uuid NOT NULL,
    "evaluation_date" date NOT NULL,
    "cleanliness_score" int4 NOT NULL,
    "order_score" int4 NOT NULL,
    "ventilation_score" int4 NOT NULL,
    "lighting_score" int4 NOT NULL,
    "ergonomics_score" int4 NOT NULL,
    "risk_control_score" int4 NOT NULL,
    "furniture_condition_score" int4 NOT NULL,
    "tools_condition_score" int4 NOT NULL,
    "hazmat_control_score" int4 NOT NULL,
    "signage_score" int4 NOT NULL,
    "compliance_score" int4 NOT NULL,
    "observations" text,
    "recommendations" text,
    "evaluated_by" uuid NOT NULL,
    "file_paths" _text,
    "average_score" numeric,
    "evaluation_result" text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    CONSTRAINT "sh_area_evaluations_evaluated_by_fkey" FOREIGN KEY ("evaluated_by") REFERENCES "public"."users"("id") ON DELETE SET NULL,
    CONSTRAINT "sh_area_evaluations_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "public"."sh_sectors"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_sh_area_evaluations_sector_id ON public.sh_area_evaluations USING btree (sector_id);
CREATE INDEX idx_sh_area_evaluations_evaluated_by ON public.sh_area_evaluations USING btree (evaluated_by);
CREATE INDEX idx_sh_area_evaluations_evaluation_date ON public.sh_area_evaluations USING btree (evaluation_date DESC);
CREATE INDEX idx_sh_area_evaluations_total_score ON public.sh_area_evaluations USING btree (average_score DESC);

-- Table Definition
CREATE TABLE "public"."vacation_balances" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "total_days" int4 DEFAULT 12,
    "used_days" int4 DEFAULT 0,
    "available_days" int4 DEFAULT 12,
    "year" int4 NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    "updated_at" timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT "vacation_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX idx_vacation_balances_user_year ON public.vacation_balances USING btree (user_id, year);

 SELECT ar.id,
    ar.user_id,
    ar.attendance_date,
    ar.scheduled_start,
    ar.scheduled_end,
    ar.check_in,
    ar.check_out,
    ar.status,
    ar.minutes_late,
    ar.notes,
    ar.created_at,
    ar.updated_at,
    p.full_name,
    p.avatar_url,
    a.name AS area_name,
    pos.title AS position_title
   FROM (((attendance_records ar
     LEFT JOIN profiles p ON ((ar.user_id = p.user_id)))
     LEFT JOIN areas a ON ((p.area_id = a.id)))
     LEFT JOIN positions pos ON ((p.position_id = pos.id)));

-- Table Definition
CREATE TABLE "public"."inventory_movements" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "item_id" uuid NOT NULL,
    "movement_type" text NOT NULL,
    "quantity" numeric(10,2) NOT NULL,
    "observations" text,
    "reference_type" text,
    "reference_id" uuid,
    "created_by" uuid,
    "created_at" timestamptz DEFAULT now(),
    CONSTRAINT "inventory_movements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("user_id"),
    CONSTRAINT "inventory_movements_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_inventory_movements_item_id ON public.inventory_movements USING btree (item_id);
CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements USING btree (reference_type, reference_id);
CREATE INDEX idx_inventory_movements_created_by ON public.inventory_movements USING btree (created_by);

-- Table Definition
CREATE TABLE "public"."inventory_maintenance" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "item_id" uuid NOT NULL,
    "maintenance_type" text NOT NULL,
    "scheduled_date" date,
    "description" text NOT NULL,
    "observations" text,
    "cost" numeric(10,2),
    "performed_by" uuid,
    "status" text NOT NULL DEFAULT 'pendiente'::text,
    "created_at" timestamptz DEFAULT now(),
    "updated_at" timestamptz DEFAULT now(),
    "start_date" timestamptz,
    "end_date" timestamptz,
    "estimated_duration" int4,
    "actual_duration" int4,
    "completion_notes" text,
    "cancellation_reason" text,
    CONSTRAINT "inventory_maintenance_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE CASCADE,
    CONSTRAINT "inventory_maintenance_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "public"."profiles"("user_id"),
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_inventory_maintenance_item_id ON public.inventory_maintenance USING btree (item_id);
CREATE INDEX idx_inventory_maintenance_status ON public.inventory_maintenance USING btree (status);
CREATE INDEX idx_inventory_maintenance_scheduled_date ON public.inventory_maintenance USING btree (scheduled_date);
CREATE INDEX idx_inventory_maintenance_performed_by ON public.inventory_maintenance USING btree (performed_by);

 SELECT im.id,
    im.item_id,
    ii.name AS item_name,
    ii.category AS item_category,
    ii.location AS item_location,
    im.maintenance_type,
    im.scheduled_date,
    im.start_date,
    im.end_date,
    im.estimated_duration,
    im.actual_duration,
    im.description,
    im.observations,
    im.cost,
    im.performed_by,
    p.full_name AS performed_by_name,
    im.status,
    im.completion_notes,
    im.cancellation_reason,
    im.created_at,
    im.updated_at,
        CASE
            WHEN ((im.start_date IS NOT NULL) AND (im.end_date IS NOT NULL)) THEN date_part('day'::text, (im.end_date - im.start_date))
            ELSE NULL::double precision
        END AS days_taken,
        CASE
            WHEN ((im.status = 'pendiente'::text) AND (im.scheduled_date < CURRENT_DATE)) THEN 'atrasado'::text
            WHEN ((im.status = 'en_proceso'::text) AND (im.estimated_duration > 0) AND ((im.start_date + ((im.estimated_duration || ' days'::text))::interval) < CURRENT_DATE)) THEN 'excedido'::text
            ELSE 'en_tiempo'::text
        END AS time_status,
        CASE
            WHEN ((im.status = ANY (ARRAY['pendiente'::text, 'en_proceso'::text])) AND (im.start_date IS NOT NULL) AND (im.estimated_duration > 0)) THEN ((im.start_date + ((im.estimated_duration || ' days'::text))::interval))::date
            WHEN ((im.status = ANY (ARRAY['pendiente'::text, 'en_proceso'::text])) AND (im.scheduled_date IS NOT NULL) AND (im.estimated_duration > 0)) THEN ((im.scheduled_date + ((im.estimated_duration || ' days'::text))::interval))::date
            ELSE NULL::date
        END AS estimated_end_date
   FROM ((inventory_maintenance im
     LEFT JOIN inventory_items ii ON ((im.item_id = ii.id)))
     LEFT JOIN profiles p ON ((im.performed_by = p.user_id)))
  ORDER BY im.created_at DESC;

 SELECT ar.id,
    ar.user_id,
    ar.attendance_date,
    ar.scheduled_start,
    ar.scheduled_end,
    ar.check_in,
    ar.check_out,
    ar.status,
    ar.minutes_late,
    ar.notes,
    ar.created_at,
    ar.updated_at,
    p.full_name,
    p.avatar_url,
    a.name AS area_name,
    pos.title AS position_title
   FROM (((attendance_records ar
     LEFT JOIN profiles p ON ((ar.user_id = p.user_id)))
     LEFT JOIN areas a ON ((p.area_id = a.id)))
     LEFT JOIN positions pos ON ((p.position_id = pos.id)));

-- Table Definition
CREATE TABLE "public"."employee_activities" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "employee_id" uuid NOT NULL,
    "title" text NOT NULL,
    "description" text,
    "assigned_by" uuid,
    "status" text NOT NULL DEFAULT 'pendiente'::text,
    "priority" text DEFAULT 'normal'::text,
    "due_date" date,
    "start_date" date,
    "completion_date" date,
    "progress_percentage" int4 DEFAULT 0,
    "comments" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "updated_at" timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_employee_activities_employee_id ON public.employee_activities USING btree (employee_id);
CREATE INDEX idx_employee_activities_status ON public.employee_activities USING btree (status);
CREATE INDEX idx_employee_activities_due_date ON public.employee_activities USING btree (due_date);

