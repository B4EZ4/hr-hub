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
CREATE TABLE "public"."profiles" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "user_id" uuid NOT NULL,
    "full_name" text NOT NULL,
    "email" text NOT NULL,
    "phone" text,
    "address" text,
    "birth_date" date,
    "hire_date" date,
    "department" text,
    "position" text,
    "manager_id" uuid,
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
    CONSTRAINT "fk_profiles_recruitment_positions" FOREIGN KEY ("recruitment_position_id") REFERENCES "public"."recruitment_positions"("id") ON DELETE SET NULL,
    CONSTRAINT "profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);
CREATE UNIQUE INDEX profiles_biometric_id_key ON public.profiles USING btree (biometric_id);
CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

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

INSERT INTO "public"."areas" ("id", "name", "description", "parent_area_id", "responsible_id", "status", "created_at", "updated_at") VALUES
('38e040f2-d503-42e1-b8de-be0855aa6fbc', 'General', NULL, NULL, NULL, 'active', '2025-11-25 19:50:06.403307+00', '2025-11-25 19:50:06.403307+00'),
('397b2a1c-6bde-4ee4-a98a-4b0619656617', 'Limpieza', 'XYZ', NULL, NULL, 'activo', '2025-11-25 14:51:37.208935+00', '2025-11-25 19:53:44.882107+00'),
('49625dd9-c73d-4e8d-8d30-8b2789437b6e', 'Desarrollador', 'programar ', NULL, NULL, 'activo', '2025-11-25 06:16:45.371276+00', '2025-11-26 14:22:10.503807+00'),
('5840f5cc-6931-445a-9dab-09054ffd2657', 'finanzas', 'Operaciones', NULL, NULL, 'activo', '2025-11-26 04:58:33.006781+00', '2025-11-26 14:39:56.879341+00'),
('5c7ca014-85be-412a-a001-d972b5d2b09f', 'Marketing', NULL, NULL, NULL, 'active', '2025-12-02 06:59:33.373215+00', '2025-12-02 06:59:33.373215+00'),
('62c9f01b-658d-4365-acdc-7f0159f0e367', 'Marqutink', 'publicidad', NULL, NULL, 'inactivo', '2025-11-25 23:48:09.840033+00', '2025-11-25 23:48:09.840033+00'),
('647cfc13-7f54-40af-82ca-cdb06ce510d9', 'Seguridad', NULL, NULL, NULL, 'active', '2025-12-02 07:01:31.58666+00', '2025-12-02 07:01:31.58666+00'),
('816b68df-86aa-413b-b434-54c09beaa099', 'Tecnología nivel 3', NULL, NULL, NULL, 'active', '2025-12-02 03:52:13.721539+00', '2025-12-02 03:52:13.721539+00'),
('86b8e7f5-9eae-4205-bb81-2c219e666ff6', 'Programador', 'Programador', NULL, NULL, 'activo', '2025-11-26 14:33:49.396735+00', '2025-11-26 14:40:19.635303+00'),
('bcc63fc7-d92d-4a1b-86a0-f3ce5cb9e465', 'Recursos para desarrollar', 'Minimo 6 meses de experiencia', NULL, NULL, 'activo', '2025-11-28 04:02:19.206564+00', '2025-11-28 04:02:19.206564+00'),
('c5e5e09e-982a-4cfd-b6d3-6d5033cd1158', 'Contrataciones', NULL, NULL, NULL, 'active', '2025-12-02 07:04:51.05626+00', '2025-12-02 07:04:51.05626+00'),
('d25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'Tecnología', NULL, NULL, NULL, 'active', '2025-11-27 02:23:05.983124+00', '2025-11-27 02:23:05.983124+00'),
('fbc32d84-d09b-4ea9-b3e5-492c680124ac', 'Vacaciones', NULL, NULL, NULL, 'active', '2025-12-02 07:16:35.750102+00', '2025-12-02 07:16:35.750102+00'),
('fbcfb05d-f7d5-421b-a344-d3bf20c1f235', 'Tecnologia', '', NULL, NULL, 'active', '2025-11-25 05:40:09.682933+00', '2025-11-25 19:53:50.784636+00');
INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at") VALUES
('00a1bab2-c46f-49a4-a654-3c4ecfb89d86', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'empleado', '2025-11-27 05:45:21.394355+00'),
('05399ee5-6ce7-4ea7-b427-5e58c4696dad', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'admin_rrhh', '2025-11-25 19:50:08.118546+00'),
('0fd5413e-196b-4b19-a41d-97dc57ee4007', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'superadmin', '2025-11-25 04:12:17.785215+00'),
('11a8ee9c-fef6-458d-bfc1-91b282b4f0bb', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'empleado', '2025-12-01 14:35:59.144309+00'),
('17fc05d0-fbb7-48d3-99d9-c4219a79aa4f', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'empleado', '2025-12-01 16:10:57.812871+00'),
('1b6b9c8f-90c8-4f52-bcd1-209a222a7096', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'admin_rrhh', '2025-11-28 06:49:12.830624+00'),
('1b9d3570-c266-4056-afc6-97f0a53a49e2', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'admin_rrhh', '2025-12-01 03:06:25.228717+00'),
('1e8a9aba-d4e2-4623-8b74-3ae5af186d59', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'empleado', '2025-11-27 02:06:20.500419+00'),
('2405a1f1-24bd-4725-8024-e9adce4a3aba', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'empleado', '2025-11-27 14:54:31.275688+00'),
('2a3f23f8-e7bf-4abf-8236-4db2d289df7e', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'superadmin', '2025-11-27 04:47:10.936108+00'),
('2cd3f486-2ba2-4cc5-82dc-b1caf192ef1d', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'empleado', '2025-11-26 05:39:41.414378+00'),
('2cd527e7-6a3e-497b-b401-f06cf0c1db35', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'admin_rrhh', '2025-11-27 05:45:20.660529+00'),
('370c4951-5d92-47c5-8a94-6a08ba8e70ff', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'superadmin', '2025-12-01 14:57:46.036728+00'),
('3870947b-24be-4753-9ecb-b51ba7f36ee8', '0b007de5-c244-4693-98d4-e9b3e7e33b4f', 'admin_rrhh', '2025-12-02 07:16:36.923177+00'),
('480c0db0-773a-46de-a129-ed0697b0cc91', 'df2c0217-fa38-43d0-83a2-3fe440db6678', 'admin_rrhh', '2025-12-02 03:52:15.789564+00'),
('52d4edc7-7345-4689-aad6-95ca71749c57', 'df2c0217-fa38-43d0-83a2-3fe440db6678', 'empleado', '2025-12-02 03:52:16.402472+00'),
('549ed0c5-df9a-44d9-962c-35fd55eea81d', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'empleado', '2025-11-27 05:50:41.526168+00'),
('64c6c7c2-1e33-4739-a65c-195930bdfa59', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'admin_rrhh', '2025-11-26 05:39:40.711941+00'),
('660d365c-d3b4-45e6-a6d8-b69f72fc9ce5', '4838c265-1c5e-4520-9590-23fd6d4161dc', 'superadmin', '2025-11-27 14:52:31.145017+00'),
('7138371e-3411-48af-9a82-487ea4d50b86', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'admin_rrhh', '2025-12-02 07:01:33.289005+00'),
('7223a3e7-7d52-4dd1-9a10-8c33e2006e5e', '2d556763-8c73-4af8-b48b-9de3dafca523', 'admin_rrhh', '2025-12-01 14:49:30.633106+00'),
('7385dd70-b2cc-4713-9e97-3a71150ca6c2', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'empleado', '2025-11-28 06:49:13.36424+00'),
('7bcca769-2d05-4275-9588-222f37bf852a', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'admin_rrhh', '2025-11-27 14:20:16.035575+00'),
('8640149f-fe6a-4d99-8344-da037271d5f9', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'empleado', '2025-12-02 07:01:34.028447+00'),
('88ef1a15-7bff-4a6e-a7e5-83b7c9df1657', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'empleado', '2025-11-25 19:56:29.746427+00'),
('8d6f7446-6469-4163-a789-096dca59985e', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'empleado', '2025-11-27 14:21:21.915275+00'),
('9feaff2b-75c5-4d33-83d6-4a4e75f1fcf3', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'superadmin', '2025-11-27 14:12:07.271817+00'),
('aac5bde1-d3ca-4fb5-b698-be5a03960def', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', 'admin_rrhh', '2025-12-02 06:59:34.802847+00'),
('b81558f2-6443-4981-9156-dd7e78592275', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'superadmin', '2025-11-27 14:51:18.727229+00'),
('b9bf866e-5103-4418-9201-b1ebf15245df', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'empleado', '2025-11-25 19:50:08.848418+00'),
('b9ff9501-e254-43e2-8e1f-a7f6a82e4164', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', 'admin_rrhh', '2025-12-01 14:26:11.534221+00'),
('c107bf79-a07a-4093-a4e9-11a08be833a9', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'admin_rrhh', '2025-12-01 16:10:56.758833+00'),
('c6a73abf-b1d3-41e1-88d2-3c61be17b08d', 'a42350cf-587e-44d9-8590-a6da3511237b', 'superadmin', '2025-11-27 14:51:33.398556+00'),
('cb4c336a-cc3d-4aed-986b-4b08c75b1ffd', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'admin_rrhh', '2025-12-01 14:32:15.144415+00'),
('cccf6768-2926-4989-b328-41ee3c8a3c76', 'f18f049d-a237-455d-a3db-6e16489ba32e', 'admin_rrhh', '2025-12-02 07:04:52.443978+00'),
('d7056bda-7fbc-4b96-8bfc-c21d23bc54ac', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'admin_rrhh', '2025-11-27 05:50:40.902281+00'),
('d81b8daa-7a9c-4d86-8fbd-f37cbbc420d4', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'admin_rrhh', '2025-11-26 14:33:29.08695+00'),
('df8e72b4-70f9-47b3-95d7-774b172dcb25', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'admin_rrhh', '2025-11-25 19:56:29.108304+00'),
('e4321ef8-e128-493b-b63a-c013d602658f', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'empleado', '2025-12-01 03:06:25.972068+00'),
('f609edea-a269-470e-937f-dc15953fa516', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', 'empleado', '2025-12-02 06:59:35.43998+00'),
('f8c81c47-eb51-42cf-9d58-741506515afd', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'admin_rrhh', '2025-11-27 14:54:30.397075+00');
INSERT INTO "public"."user_sessions" ("id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "last_active_at") VALUES
('012d26a2-5918-4326-9f4c-3a93d8f99bec', 'a402caa2-bbee-4681-b941-0a0e48237f09', '55f5e931-0626-409a-a719-08b9dda2abde', '2025-12-02 00:43:35.023+00', NULL, NULL, '2025-12-01 00:43:35.113769+00', '2025-12-01 00:43:35.113769+00'),
('01643a42-a56b-4a32-90d2-7cdf953405c4', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'ac3ad365-a427-4d6f-92b5-5ebffd3b0b59', '2025-12-02 15:10:54.188+00', NULL, NULL, '2025-12-01 15:10:54.245541+00', '2025-12-01 15:10:54.245541+00'),
('05f6ce23-fe30-4aea-8c22-39de314d092c', 'a402caa2-bbee-4681-b941-0a0e48237f09', '410d8615-464a-4d04-9bc6-0ce827cf6622', '2025-11-27 01:18:28.867+00', NULL, NULL, '2025-11-26 01:18:28.926686+00', '2025-11-26 01:18:28.926686+00'),
('069f46c8-2314-4d0c-b31f-19511f1f88eb', 'a402caa2-bbee-4681-b941-0a0e48237f09', '11fcbbb9-eafb-4fa4-8f2b-a011694c73c5', '2025-12-02 14:36:14.113+00', NULL, NULL, '2025-12-01 14:36:14.174511+00', '2025-12-01 14:36:14.174511+00'),
('076777b8-5dff-47c5-853d-8a758c6a7b3e', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7615c3bb-d1a7-4291-b576-da1e7446e236', '2025-11-27 05:57:40.556+00', NULL, NULL, '2025-11-26 05:57:40.609694+00', '2025-11-26 05:57:40.609694+00'),
('098d27d5-6e0a-4afe-b05a-c0e4d45b44bb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f9a469fa-14b8-4393-8013-dd972f5d57dc', '2025-12-02 03:28:25.99+00', NULL, NULL, '2025-12-01 03:28:26.229131+00', '2025-12-01 03:28:26.229131+00'),
('099d79d9-1123-4dea-93a6-b83203d6e4e8', 'a402caa2-bbee-4681-b941-0a0e48237f09', '3f1370f9-5c08-4d73-93a0-09f9974e0bff', '2025-11-28 14:32:40.726+00', NULL, NULL, '2025-11-27 14:32:40.782199+00', '2025-11-27 14:32:40.782199+00'),
('10f4390b-399e-4ac1-be0c-34b84d8e9196', 'a402caa2-bbee-4681-b941-0a0e48237f09', '152c01f9-a12e-4aad-abfb-68844227c889', '2025-12-03 06:19:17.949+00', NULL, NULL, '2025-12-02 06:19:18.042171+00', '2025-12-02 06:19:18.042171+00'),
('133e94c3-e1f8-40f1-8200-db11e665df2b', 'a402caa2-bbee-4681-b941-0a0e48237f09', '8adc8220-eb62-4615-8ae8-ecdb1897b049', '2025-11-28 13:50:50.95+00', NULL, NULL, '2025-11-27 13:50:50.999301+00', '2025-11-27 13:50:50.999301+00'),
('17fa18e0-27a8-4ad6-ad05-9c0ef779e230', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ebf1d718-6b26-4955-9c12-163677566715', '2025-12-03 00:54:21.934+00', NULL, NULL, '2025-12-02 00:54:22.026386+00', '2025-12-02 00:54:22.026386+00'),
('18024040-cf22-4856-931b-9459d19185ff', 'a402caa2-bbee-4681-b941-0a0e48237f09', '41444d82-5e0f-4ea1-a60a-fb7a6bbb698d', '2025-12-02 14:14:48.785+00', NULL, NULL, '2025-12-01 14:14:48.889365+00', '2025-12-01 14:14:48.889365+00'),
('1966d473-c220-49e4-b6df-f9c06a92c3dd', 'a402caa2-bbee-4681-b941-0a0e48237f09', '350cf54d-ce7e-4d2f-b08d-c76ba2fbb6df', '2025-11-28 05:18:55.397+00', NULL, NULL, '2025-11-27 05:18:55.454457+00', '2025-11-27 05:18:55.454457+00'),
('1ac6e5ff-7b2a-4465-91fd-d5fd81863c0b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b92055bd-931a-483a-a3b9-16ea985fec5b', '2025-11-27 14:11:59.298+00', NULL, NULL, '2025-11-26 14:11:59.355298+00', '2025-11-26 14:11:59.355298+00'),
('221366be-d10b-4a58-a548-997d95b1b6a5', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'c5b53b3f-2353-49c7-8ff1-9250062c46e0', '2025-12-02 15:16:45.58+00', NULL, NULL, '2025-12-01 15:16:45.634338+00', '2025-12-01 15:16:45.634338+00'),
('22fdb85b-4fe6-4b12-af92-711c2bcc0f81', 'a402caa2-bbee-4681-b941-0a0e48237f09', '6605ddf2-2093-4cc7-a279-eebce310d4fe', '2025-12-02 14:23:34.021+00', NULL, NULL, '2025-12-01 14:23:34.086008+00', '2025-12-01 14:23:34.086008+00'),
('24df5515-feda-422e-99b4-0ce81e60c174', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f2bc2558-4cc7-4422-90a0-1ad4cec3296d', '2025-12-02 14:42:19.536+00', NULL, NULL, '2025-12-01 14:42:19.60272+00', '2025-12-01 14:42:19.60272+00'),
('2649d090-e94d-467b-891d-0798e461a78c', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', '069fc0db-903e-4d08-9fc3-b99365ff7218', '2025-12-02 14:35:02.312+00', NULL, NULL, '2025-12-01 14:35:02.370798+00', '2025-12-01 14:35:02.370798+00'),
('27a6f084-5e61-44c0-aae5-d0377ffac925', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'd4569728-b445-48a4-a3eb-5c4ecdc7cc00', '2025-11-28 15:23:46.189+00', NULL, NULL, '2025-11-27 15:23:46.250428+00', '2025-11-27 15:23:46.250428+00'),
('27dbfb4c-46c5-4370-9dde-9f2da4123a55', 'a402caa2-bbee-4681-b941-0a0e48237f09', '31d8b7a2-a7e1-4115-8dde-601b70538117', '2025-12-02 14:25:01.713+00', NULL, NULL, '2025-12-01 14:25:01.768276+00', '2025-12-01 14:25:01.768276+00'),
('2bcfa079-cd21-407e-8efb-363e0ac59172', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'fcd99708-e055-4d43-9f55-ea99ef824465', '2025-11-27 01:16:38.493+00', NULL, NULL, '2025-11-26 01:16:38.545932+00', '2025-11-26 01:16:38.545932+00'),
('304758d5-1c3d-431f-8385-a80f2b033e0a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f12316be-4dd4-4a5d-a1b4-61434c9134d6', '2025-11-29 14:58:50.867+00', NULL, NULL, '2025-11-28 14:58:50.93811+00', '2025-11-28 14:58:50.93811+00'),
('30a645c3-8eae-42b2-b942-fcbd7cbff609', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f5437086-fda3-47d6-8711-e0536549472d', '2025-11-27 15:58:54.444+00', NULL, NULL, '2025-11-26 15:58:54.498067+00', '2025-11-26 15:58:54.498067+00'),
('354804ae-eca7-4f6d-b89c-289d152b7447', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b6894a49-7004-4cb9-9eb5-a7863c200312', '2025-11-27 14:51:48.328+00', NULL, NULL, '2025-11-26 14:51:48.382042+00', '2025-11-26 14:51:48.382042+00'),
('36fffce5-4d06-44c9-b56b-3728c5a3792d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'fe5dcbc0-00db-44fb-8ef4-2846080bb2ec', '2025-11-28 13:59:23.488+00', NULL, NULL, '2025-11-27 13:59:23.56189+00', '2025-11-27 13:59:23.56189+00'),
('37c70808-ecf5-4309-9e36-79329f5c4895', 'a402caa2-bbee-4681-b941-0a0e48237f09', '4a342958-db51-49a1-b89b-c4564980c876', '2025-12-02 02:43:35.239+00', NULL, NULL, '2025-12-01 02:43:35.311395+00', '2025-12-01 02:43:35.311395+00'),
('393f51cd-7314-4036-a8f2-625b85671763', 'a402caa2-bbee-4681-b941-0a0e48237f09', '097c8974-51d7-4042-8b09-4fd073b82acb', '2025-11-29 05:19:05.191+00', NULL, NULL, '2025-11-28 05:19:05.27627+00', '2025-11-28 05:19:05.27627+00'),
('3aa31c24-b941-42ce-a801-aeee9bbeabbc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e23a2fa5-692c-4485-937a-2959bbf1a70b', '2025-11-29 11:26:52.606+00', NULL, NULL, '2025-11-28 11:26:52.694753+00', '2025-11-28 11:26:52.694753+00'),
('3d01184f-c4fc-427c-af4b-b9c48fe7e620', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'f8f68bca-f6e3-4705-9997-7e3898e57738', '2025-12-02 14:16:44.428+00', NULL, NULL, '2025-12-01 14:16:44.483733+00', '2025-12-01 14:16:44.483733+00'),
('44056999-ffcc-4501-8031-3cf4c472aa79', 'a402caa2-bbee-4681-b941-0a0e48237f09', '101b726e-abdd-41ca-a793-acfb2d95ffb6', '2025-11-28 06:33:19.205+00', NULL, NULL, '2025-11-27 06:33:19.276397+00', '2025-11-27 06:33:19.276397+00'),
('4618269a-e2b7-42d4-a14e-5e7f6ee21716', 'a402caa2-bbee-4681-b941-0a0e48237f09', '85adc694-d303-4c9b-a704-5cfe75a3ef31', '2025-11-26 14:58:31.583+00', NULL, NULL, '2025-11-25 14:58:31.604014+00', '2025-11-25 14:58:31.604014+00'),
('4b49a35c-4edf-4d58-9d16-56dfdfcf2b44', 'a402caa2-bbee-4681-b941-0a0e48237f09', '430091ff-0520-40db-8b17-b7327334d5f5', '2025-11-28 14:04:33.465+00', NULL, NULL, '2025-11-27 14:04:33.533165+00', '2025-11-27 14:04:33.533165+00'),
('4d2d0fa4-5cc0-4146-bf2a-3f3ec4ae856a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a2246ef0-e98d-4cae-987d-7dc155f20afb', '2025-11-28 14:15:21.759+00', NULL, NULL, '2025-11-27 14:15:21.821197+00', '2025-11-27 14:15:21.821197+00'),
('51108f6b-a1bb-4313-bcfd-5ad95bfe71ba', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b54bc893-30da-4222-9a28-06c9b18a4f99', '2025-11-27 14:56:20.413+00', NULL, NULL, '2025-11-26 14:56:20.475413+00', '2025-11-26 14:56:20.475413+00'),
('5312ecd0-1b67-4f91-996a-2458d82e7539', 'a402caa2-bbee-4681-b941-0a0e48237f09', '8ce74f6b-df60-4447-9813-7ba0650e64f5', '2025-11-27 03:55:06.476+00', NULL, NULL, '2025-11-26 03:55:06.530202+00', '2025-11-26 03:55:06.530202+00'),
('54fa6946-3cd1-45f8-916d-61cd438fa805', '3085a308-c2af-4c71-b39d-613c3134d0d6', '8dc27f7f-f2bf-4002-b85e-8e7febcc73a0', '2025-11-28 14:47:26.99+00', NULL, NULL, '2025-11-27 14:47:27.055194+00', '2025-11-27 14:47:27.055194+00'),
('55fb242c-8bfe-4ec1-ad37-acc45209f4d6', 'a402caa2-bbee-4681-b941-0a0e48237f09', '13e22783-38bf-43c4-86ca-638f53591d9a', '2025-11-26 14:51:28.418+00', NULL, NULL, '2025-11-25 14:51:28.468229+00', '2025-11-25 14:51:28.468229+00'),
('5935992e-576b-4318-8b0b-84d2252cf46b', 'a402caa2-bbee-4681-b941-0a0e48237f09', '20c5d254-d6b7-4000-ae76-f751d89afb9a', '2025-12-02 14:41:37.213+00', NULL, NULL, '2025-12-01 14:41:37.238025+00', '2025-12-01 14:41:37.238025+00'),
('5a00a52f-aac4-438f-bdd1-d7358706bc5e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd4ff8267-3ca5-47f9-b5e5-8778a659e244', '2025-11-27 15:07:42.236+00', NULL, NULL, '2025-11-26 15:07:42.294402+00', '2025-11-26 15:07:42.294402+00'),
('5a2f2a13-23f1-448b-970c-05effc0449bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b47b23fa-acfb-4fe2-8871-470fabbb9434', '2025-11-27 14:31:42.432+00', NULL, NULL, '2025-11-26 14:31:42.484336+00', '2025-11-26 14:31:42.484336+00'),
('6074f142-43c2-4586-a7ce-4220a09e6d29', 'a402caa2-bbee-4681-b941-0a0e48237f09', '545a79d5-9073-4148-9eca-bdf39214637d', '2025-11-27 01:39:42.753+00', NULL, NULL, '2025-11-26 01:39:42.813038+00', '2025-11-26 01:39:42.813038+00'),
('62fb4872-646c-48d5-aa8b-3c446aae9750', 'a402caa2-bbee-4681-b941-0a0e48237f09', '6bda1f85-ad2e-4655-89fd-1904b00985ae', '2025-11-27 01:53:37.315+00', NULL, NULL, '2025-11-26 01:53:37.374124+00', '2025-11-26 01:53:37.374124+00'),
('679fd362-7d23-4e57-ac36-54953ffd0b72', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7b91e4c4-1215-4719-be89-3e91a8ab4b9e', '2025-12-03 03:37:20.619+00', NULL, NULL, '2025-12-02 03:37:20.682121+00', '2025-12-02 03:37:20.682121+00'),
('6a6b2e39-34bb-4f99-8fb7-c6c75b31b471', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e0f1a763-2deb-42ad-9da1-462f75209a1c', '2025-12-02 14:39:09.213+00', NULL, NULL, '2025-12-01 14:39:09.274277+00', '2025-12-01 14:39:09.274277+00'),
('6b8a0b41-3228-448a-b4e5-3298395c0655', 'a402caa2-bbee-4681-b941-0a0e48237f09', '1b2fc708-ff06-42ee-b4df-3a2349b8a5c6', '2025-11-28 13:53:03.221+00', NULL, NULL, '2025-11-27 13:53:03.285644+00', '2025-11-27 13:53:03.285644+00'),
('707b7bfb-1e01-49d6-8a68-31c7e17dc477', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'bb526ef4-a5c7-4e18-ac2c-dc96d14f94b1', '2025-12-01 16:39:20.042+00', NULL, NULL, '2025-11-30 16:39:20.126188+00', '2025-11-30 16:39:20.126188+00'),
('72169579-a092-4840-8241-e01ce86ee6fd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b783fdb1-64ff-4df2-9d89-8d6e0e07bb81', '2025-11-27 14:29:51.034+00', NULL, NULL, '2025-11-26 14:29:51.106882+00', '2025-11-26 14:29:51.106882+00'),
('7c9c37e1-ef95-4226-951d-646107b8b69d', 'a402caa2-bbee-4681-b941-0a0e48237f09', '564720b7-b26a-47d7-86d5-e54cd0a8248e', '2025-12-02 02:15:25.774+00', NULL, NULL, '2025-12-01 02:15:25.838822+00', '2025-12-01 02:15:25.838822+00'),
('7d7ef185-1082-4743-bbba-486e0c6a36bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '1da81755-fd35-4683-a119-ea22c973a795', '2025-11-29 03:38:40.199+00', NULL, NULL, '2025-11-28 03:38:40.277702+00', '2025-11-28 03:38:40.277702+00'),
('851c8e68-d3f2-45cc-b3ec-24e90bde1530', 'a402caa2-bbee-4681-b941-0a0e48237f09', '4e535644-6491-4923-9915-1a248de5ed5c', '2025-11-28 14:47:04.685+00', NULL, NULL, '2025-11-27 14:47:04.739781+00', '2025-11-27 14:47:04.739781+00'),
('85aac842-951a-4ea6-8070-9bad1fd42f33', 'a402caa2-bbee-4681-b941-0a0e48237f09', '56c6d3af-fb65-477e-89f3-3c1b804d5d68', '2025-11-28 14:08:46.662+00', NULL, NULL, '2025-11-27 14:08:46.725346+00', '2025-11-27 14:08:46.725346+00'),
('8677f19b-673d-405b-8d00-da4b68a7e5ae', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd098430c-ab44-48f3-b649-fb0e63819576', '2025-11-28 13:52:37.539+00', NULL, NULL, '2025-11-27 13:52:37.597+00', '2025-11-27 13:52:37.597+00'),
('8ae90b4a-8796-4854-b0b4-33d00e556251', 'a402caa2-bbee-4681-b941-0a0e48237f09', '01a34e69-af03-4586-891f-969aafba07f6', '2025-11-27 14:39:21.369+00', NULL, NULL, '2025-11-26 14:39:21.427504+00', '2025-11-26 14:39:21.427504+00'),
('95c5d73e-f40f-4b0a-af9c-798ce25168bd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b780c0b3-d9ff-4603-96c5-e15ca59eaed2', '2025-11-28 14:20:04.642+00', NULL, NULL, '2025-11-27 14:20:04.703364+00', '2025-11-27 14:20:04.703364+00'),
('9792fb80-852a-4e40-a901-3b576265ed68', 'a402caa2-bbee-4681-b941-0a0e48237f09', '07ce90bc-6050-4006-b488-501c4cae37ff', '2025-11-28 14:27:55.451+00', NULL, NULL, '2025-11-27 14:27:55.511624+00', '2025-11-27 14:27:55.511624+00'),
('9a89489d-39c4-48c1-8516-ff00d09423e1', 'a402caa2-bbee-4681-b941-0a0e48237f09', '90712039-a6ed-4a51-b27f-bd42292ea157', '2025-11-27 15:01:30.567+00', NULL, NULL, '2025-11-26 15:01:30.620587+00', '2025-11-26 15:01:30.620587+00'),
('a452e7df-60a8-4b9a-bfeb-57f5f5e9643a', 'a402caa2-bbee-4681-b941-0a0e48237f09', '884be2f6-cdaf-47b9-9e13-6b1da64c0ab1', '2025-11-27 14:50:00.658+00', NULL, NULL, '2025-11-26 14:50:00.7003+00', '2025-11-26 14:50:00.7003+00'),
('a585394f-522d-4b19-9231-cd9af0e37497', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e3344b9f-4058-4b47-b002-6a9225d4b30b', '2025-11-28 13:25:59.421+00', NULL, NULL, '2025-11-27 13:25:59.65113+00', '2025-11-27 13:25:59.65113+00'),
('a9a21ff0-66d0-4b99-8a33-3b18f8a1fdec', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd3caf75e-6135-45a0-9527-399908a435e8', '2025-11-30 22:17:47.648+00', NULL, NULL, '2025-11-29 22:17:47.758716+00', '2025-11-29 22:17:47.758716+00'),
('aa82888a-cdaa-4913-8252-305676d68dcb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ed8abb7b-aa88-4ba5-bc0b-060d8d8a09c7', '2025-11-27 04:24:25.203+00', NULL, NULL, '2025-11-26 04:24:25.265001+00', '2025-11-26 04:24:25.265001+00'),
('ab320210-5633-454a-9884-8a3747741f16', 'a402caa2-bbee-4681-b941-0a0e48237f09', '53837536-0ee9-4bba-988f-cccce7eee1d6', '2025-11-26 14:55:26.291+00', NULL, NULL, '2025-11-25 14:55:26.348526+00', '2025-11-25 14:55:26.348526+00'),
('abd402fd-b673-4973-9b44-950b92137c85', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ad4ad042-efa0-4623-86f2-4b93b7306e88', '2025-11-28 01:56:22.967+00', NULL, NULL, '2025-11-27 01:56:23.024622+00', '2025-11-27 01:56:23.024622+00'),
('ac662d18-ec58-49b5-ae67-c6c09578f3b8', 'a402caa2-bbee-4681-b941-0a0e48237f09', '6e133c94-9145-4b44-88eb-4ff9d03dc306', '2025-11-27 13:22:48.617+00', NULL, NULL, '2025-11-26 13:22:48.695104+00', '2025-11-26 13:22:48.695104+00'),
('aeef54f4-a7b4-4156-bce0-9c24c1683a1a', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2b376aef-650c-4c1a-a8a3-7e782ef4b190', '2025-11-29 11:38:46.734+00', NULL, NULL, '2025-11-28 11:38:46.806007+00', '2025-11-28 11:38:46.806007+00'),
('b25ef9e7-5674-4d9e-a0b2-e6f6218bf2ab', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f7511e02-8c12-4cc4-a916-9b1dc99c9a58', '2025-11-26 15:02:15.271+00', NULL, NULL, '2025-11-25 15:02:15.294881+00', '2025-11-25 15:02:15.294881+00'),
('b43ccac8-f1c9-4a22-8a0a-35e2a76b1dbf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '62f53c15-a779-4a23-b4fd-4059eaa52e44', '2025-11-27 00:12:48.231+00', NULL, NULL, '2025-11-26 00:12:48.257333+00', '2025-11-26 00:12:48.257333+00'),
('b7209c1a-c936-4f02-8458-a46e9d013c51', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7c545b1a-3b93-4404-baf2-7ddba9480f4f', '2025-11-27 01:59:13.837+00', NULL, NULL, '2025-11-26 01:59:13.891536+00', '2025-11-26 01:59:13.891536+00'),
('b9b46368-fc21-4685-89dd-e77994f65fdd', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2aeb39ab-8ba7-4c0f-b444-cc631d8abcdf', '2025-11-28 14:40:37.199+00', NULL, NULL, '2025-11-27 14:40:37.267835+00', '2025-11-27 14:40:37.267835+00'),
('b9de86a2-0f9d-428a-89a5-c19b07f0549f', 'a402caa2-bbee-4681-b941-0a0e48237f09', '0210fbce-3e0c-486b-a365-905bc3c43a00', '2025-12-01 16:57:21.29+00', NULL, NULL, '2025-11-30 16:57:21.349774+00', '2025-11-30 16:57:21.349774+00'),
('bb011bab-0fe0-4c22-8882-3c6a0e73dc46', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ca468b3f-48f0-4a15-891e-f3093f266d8b', '2025-12-02 15:14:24.034+00', NULL, NULL, '2025-12-01 15:14:24.092856+00', '2025-12-01 15:14:24.092856+00'),
('bb68edeb-1898-4095-bf04-a2f013792b16', 'a402caa2-bbee-4681-b941-0a0e48237f09', '5d917ec9-82b9-408a-9999-28c206333f99', '2025-11-26 14:49:17.156+00', NULL, NULL, '2025-11-25 14:49:17.189549+00', '2025-11-25 14:49:17.189549+00'),
('c5cca38b-8346-4efc-b302-8709bf897b14', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7f851c07-1bbe-4d23-8017-70bde793aa44', '2025-11-26 19:30:10.75+00', NULL, NULL, '2025-11-25 19:30:10.829184+00', '2025-11-25 19:30:10.829184+00'),
('c65d1b6c-6088-46e2-8a01-da0f8a4273ff', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7e21b7a7-b35e-4e28-a3cd-dad93e35d8d8', '2025-11-27 15:05:03.654+00', NULL, NULL, '2025-11-26 15:05:03.698419+00', '2025-11-26 15:05:03.698419+00'),
('c7663888-f8fd-4771-b3a1-262aa5568ff7', 'a402caa2-bbee-4681-b941-0a0e48237f09', '346604d5-1a2b-4e47-81a7-efe1bd5ec719', '2025-11-26 19:23:59.552+00', NULL, NULL, '2025-11-25 19:23:59.605826+00', '2025-11-25 19:23:59.605826+00'),
('c9a98833-75fb-44ca-ba86-81fb049f3abb', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', '06597c22-8874-4675-8eb6-1b46d6a79231', '2025-12-02 14:31:28.014+00', NULL, NULL, '2025-12-01 14:31:28.071152+00', '2025-12-01 14:31:28.071152+00'),
('cac27267-7586-4e71-a7f3-5aa3397a2f17', 'a402caa2-bbee-4681-b941-0a0e48237f09', '42d6964a-6ced-46f1-a137-0a311cf5fabc', '2025-11-27 14:37:14.698+00', NULL, NULL, '2025-11-26 14:37:14.758088+00', '2025-11-26 14:37:14.758088+00'),
('cc86d8c9-b8cf-46ec-b4f7-fae8509c5abc', 'a402caa2-bbee-4681-b941-0a0e48237f09', '54223f8c-1b7e-4043-a489-f13bb9a24283', '2025-12-02 14:46:47.67+00', NULL, NULL, '2025-12-01 14:46:47.689279+00', '2025-12-01 14:46:47.689279+00'),
('cf23f69f-9ffa-4187-a123-b97833041921', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7b5d143b-a7b1-4a0f-9313-1ddb24a1fbf9', '2025-12-02 14:44:21.339+00', NULL, NULL, '2025-12-01 14:44:21.410088+00', '2025-12-01 14:44:21.410088+00'),
('cfdc53ef-a2e3-412d-9bd7-c9d601440276', 'a402caa2-bbee-4681-b941-0a0e48237f09', '0f1e67d6-8f86-4c56-8658-dec6a383a0f5', '2025-11-28 14:35:39.612+00', NULL, NULL, '2025-11-27 14:35:39.678205+00', '2025-11-27 14:35:39.678205+00'),
('d0354019-2f4e-4c2b-b712-dc0096df832a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e88b1058-ca6e-4f6f-8745-ec623d1ce6f4', '2025-11-27 14:48:34.827+00', NULL, NULL, '2025-11-26 14:48:34.884567+00', '2025-11-26 14:48:34.884567+00'),
('d178f77d-ba74-43b7-a756-e27babf32824', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd7b24aab-f2f8-4f8d-9354-32eec8352a5b', '2025-11-26 14:52:05.174+00', NULL, NULL, '2025-11-25 14:52:05.246784+00', '2025-11-25 14:52:05.246784+00'),
('d5249715-983c-485f-bedf-5506e887eaa7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a177ccf3-d5a9-4046-a46b-d50ea1a43e42', '2025-11-28 00:49:57.084+00', NULL, NULL, '2025-11-27 00:49:57.136105+00', '2025-11-27 00:49:57.136105+00'),
('d547a707-ee20-4072-a02a-e2145431c67d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e988720a-a425-4063-bf15-cde90985333b', '2025-12-02 14:46:33.419+00', NULL, NULL, '2025-12-01 14:46:33.478899+00', '2025-12-01 14:46:33.478899+00'),
('d5ae9ddc-cfb2-44b4-aa02-d8ecd5eeb22c', 'a402caa2-bbee-4681-b941-0a0e48237f09', '5a21cf21-e0cc-4175-8a0f-e3117227086b', '2025-12-02 14:25:23.17+00', NULL, NULL, '2025-12-01 14:25:23.21905+00', '2025-12-01 14:25:23.21905+00'),
('d7d4a7d2-78eb-468a-a852-9f3eccefcce0', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', '0d9a1330-78d9-4db9-9daf-cc0671c8140f', '2025-11-28 14:51:50.064+00', NULL, NULL, '2025-11-27 14:51:50.132581+00', '2025-11-27 14:51:50.132581+00'),
('da28cdb3-ec74-4b33-84c3-c8ccc04ee481', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b84febc7-2e19-497e-b63c-407660896f8a', '2025-12-02 15:23:42.056+00', NULL, NULL, '2025-12-01 15:23:42.148411+00', '2025-12-01 15:23:42.148411+00'),
('dcb6329e-cd0d-4f66-8fc7-cd6e5cd46e4a', '2d556763-8c73-4af8-b48b-9de3dafca523', '7f22a52c-19a5-41ea-8c91-49608fdc565c', '2025-12-03 02:59:29.31+00', NULL, NULL, '2025-12-02 02:59:29.372373+00', '2025-12-02 02:59:29.372373+00'),
('ded0b65b-5177-4ec8-b945-1cab4f2eaa31', 'a402caa2-bbee-4681-b941-0a0e48237f09', '4d11262a-f1a2-4d38-ad5a-194a67214564', '2025-11-26 14:50:51.562+00', NULL, NULL, '2025-11-25 14:50:51.584927+00', '2025-11-25 14:50:51.584927+00'),
('e1b3023c-e190-4136-8922-c1f15fea7abd', 'a402caa2-bbee-4681-b941-0a0e48237f09', '5af535b8-8657-411d-8433-b68ccd526770', '2025-12-02 14:23:36.054+00', NULL, NULL, '2025-12-01 14:23:36.125506+00', '2025-12-01 14:23:36.125506+00'),
('e1d7deea-cd09-4fcf-a06d-1abda2f8d8aa', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2deadecf-586b-45e0-89ff-bd4bf7306325', '2025-11-26 14:53:08.002+00', NULL, NULL, '2025-11-25 14:53:08.05661+00', '2025-11-25 14:53:08.05661+00'),
('ebc2fdf5-0600-4fd6-aeac-3ddd0d448a99', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b5b48e5c-c613-4bec-a43a-88d7cc088304', '2025-11-27 14:34:53.389+00', NULL, NULL, '2025-11-26 14:34:53.449222+00', '2025-11-26 14:34:53.449222+00'),
('ee0f0857-19cb-4b83-a6ba-a5d038594b8c', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2b845538-497e-498e-961a-9046c5da8db3', '2025-12-02 14:54:20.469+00', NULL, NULL, '2025-12-01 14:54:20.530019+00', '2025-12-01 14:54:20.530019+00'),
('f032d2be-dde8-4101-af0e-54b90c05ab4c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ca0dc5a8-b91c-4b07-89df-722241bbf241', '2025-11-28 14:24:49.433+00', NULL, NULL, '2025-11-27 14:24:49.494674+00', '2025-11-27 14:24:49.494674+00'),
('f1843f16-5c4e-41e2-a81c-24b4bb9127d0', 'a402caa2-bbee-4681-b941-0a0e48237f09', '1a9abfb8-8109-46a8-b9da-47dde7ce7f52', '2025-11-29 14:34:50.647+00', NULL, NULL, '2025-11-28 14:34:50.720285+00', '2025-11-28 14:34:50.720285+00'),
('f223899c-a4a7-41dc-9582-78a8b7050453', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ebd868af-ff29-400e-bd1e-3513920e0f66', '2025-12-03 05:12:30.889+00', NULL, NULL, '2025-12-02 05:12:30.985236+00', '2025-12-02 05:12:30.985236+00'),
('f5760648-cc51-4fd2-8adf-a8fa12a517ed', 'a402caa2-bbee-4681-b941-0a0e48237f09', '9d6180dc-5d22-449d-b206-e4e2e366132f', '2025-11-28 14:31:06.388+00', NULL, NULL, '2025-11-27 14:31:06.411981+00', '2025-11-27 14:31:06.411981+00'),
('f7ac9802-1684-4c4c-b6a8-ec9446f9636c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e762343c-9433-47b4-afc8-db7506d64005', '2025-12-03 02:06:36.883+00', NULL, NULL, '2025-12-02 02:06:36.940205+00', '2025-12-02 02:06:36.940205+00'),
('f91caed2-1e3a-4da6-9adf-9fa44b8835ae', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b27a71e1-b791-4f6c-8792-699c8c61dbc5', '2025-12-02 15:08:54.417+00', NULL, NULL, '2025-12-01 15:08:54.473174+00', '2025-12-01 15:08:54.473174+00'),
('f934b4d9-5e99-4366-a55d-c9e753e5da0f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a356038e-780f-4254-9d47-a15936284ac9', '2025-12-03 06:47:44.094+00', NULL, NULL, '2025-12-02 06:47:44.19+00', '2025-12-02 06:47:44.19+00'),
('fd4f04bf-072b-4c06-a17f-1c3f8427389b', 'a402caa2-bbee-4681-b941-0a0e48237f09', '803f6d22-4136-4bf6-b600-45d5543b4969', '2025-11-29 06:25:01.149+00', NULL, NULL, '2025-11-28 06:25:01.268186+00', '2025-11-28 06:25:01.268186+00');
INSERT INTO "public"."attendance_records" ("id", "user_id", "attendance_date", "scheduled_start", "scheduled_end", "check_in", "check_out", "status", "minutes_late", "notes", "created_at", "updated_at") VALUES
('2eed7052-f097-45da-8ad6-3b8009703b77', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:59:31.348+00', NULL, 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:59:31.493131+00', '2025-11-27 14:59:31.493131+00'),
('4804da59-5609-490d-b07f-4007a511c569', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', '2025-11-30', '09:00:00', '18:00:00', '2025-12-01 03:10:00.616+00', '2025-12-01 03:10:08.125+00', 'tarde', 730, 'Biometric: ESP32-001', '2025-12-01 03:10:00.766749+00', '2025-12-01 03:10:08.290493+00'),
('4b7b8061-93ba-45d4-9621-62d98b20c29b', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-26', '09:00:00', '18:00:00', '2025-11-26 12:35:00+00', '2025-11-27 02:36:00+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 02:35:54.105325+00', '2025-11-27 04:24:00.099699+00'),
('661c0d06-c591-434f-bddc-0dfbbe6b6b5b', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-30', '09:00:00', '18:00:00', '2025-12-01 04:48:26.617+00', '2025-12-01 04:48:33.815+00', 'tarde', 828, 'Biometric: ESP32-001', '2025-12-01 04:48:26.785303+00', '2025-12-01 04:48:33.990573+00'),
('7874bfdd-325f-4251-bd43-56ba22025ef2', '70b537f6-db5e-48d3-86ee-7a280655aba5', '2025-11-30', '09:00:00', '18:00:00', '2025-12-01 03:09:17.328+00', '2025-12-01 03:09:24.665+00', 'tarde', 729, 'Biometric: ESP32-001', '2025-12-01 03:09:17.487629+00', '2025-12-01 03:09:24.827974+00'),
('b3f50503-c985-461b-a80c-d9a80cdab617', '70b537f6-db5e-48d3-86ee-7a280655aba5', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:55:55.01+00', '2025-11-27 14:56:15.259+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:55:55.159199+00', '2025-11-27 14:56:15.4245+00'),
('c9a06449-524a-454c-ae14-bd7dd5fb99e3', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-26', '09:00:00', '18:00:00', '2025-11-27 05:49:00+00', '2025-11-27 04:17:00+00', 'tarde', 889, 'Biometric: ESP32-001', '2025-11-27 02:49:07.744723+00', '2025-11-27 04:23:50.995446+00'),
('e30f17b5-2797-4305-badd-bf9fa71fb4e7', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:23:13.808+00', '2025-11-27 14:24:24.95+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:23:13.974361+00', '2025-11-27 14:24:25.099088+00'),
('fd17d1e9-d1d1-4ecf-a552-3c5418caa55f', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:58:51.219+00', '2025-11-27 14:59:03.37+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:58:51.365773+00', '2025-11-27 14:59:03.508726+00');
INSERT INTO "public"."profiles" ("id", "user_id", "full_name", "email", "phone", "address", "birth_date", "hire_date", "department", "position", "manager_id", "status", "avatar_url", "emergency_contact_name", "emergency_contact_phone", "must_change_password", "biometric_id", "created_at", "updated_at", "area_id", "rfc", "curp", "nss", "position_id") VALUES
('090a43b4-c8f3-46ed-bd7c-d7ecc51ab98f', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'Recluta', 'recluta@prueba.com', '7351238231', 'Morelos', NULL, '2025-11-27', 'Tecnología', 'Desarollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-27 05:45:21.177487+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('0a44d4a8-f048-4cfb-b18b-0b9de07c7810', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', 'Patricia Orozco', 'paty.oro@mail.net', '4779876543', 'Blvd. Campestre 101, León', NULL, '2025-12-02', 'Marketing', 'Diseñador Gráfico', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-12-02 06:59:35.303019+00', '2025-12-02 06:59:35.303019+00', '5c7ca014-85be-412a-a001-d972b5d2b09f', 'OOPP910606MK4', 'OOPP910606MGTSRA02', '88916543210', '7765701d-9080-4e60-82d6-fd35f9d1148c'),
('1da7c03c-842c-4ce8-a31d-34773a30e046', 'df2c0217-fa38-43d0-83a2-3fe440db6678', 'Fernando Ruiz', 'fer.ruiz@dev.io', '6141234567', 'Av. Universidad 300, CUU', NULL, '2025-12-02', 'Tecnología nivel 3', 'area Bf3', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-12-02 03:52:16.240015+00', '2025-12-02 06:28:49.652472+00', NULL, 'RUFF951115P09', 'RUFF951115HCHMRN06', '99953456789', NULL),
('247e983d-8019-4155-876c-8e50fb08b3a7', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'Luis Antonio Baeza Turijan', 'baezaantoniocontac@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-12-01 16:04:29.277708+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('3081c8a8-cb3e-48a9-ab3f-b543b60741e0', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'prueba', 'prueba@gmail.com', '3423432354', NULL, NULL, '2025-11-28', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-28 06:49:13.244488+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('417b328c-2be2-49b7-8c69-32fad3af1e9a', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'Juan', 'pedro@gmail.com', '7352061792', 'Yautepec, Mor.', NULL, '2025-11-27', 'Tecnología', 'Desarrollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-25 19:56:29.559916+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('45591412-701f-4b0b-b795-70b9b3bfa15f', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'Emmanuel Saliff', 'emmanuel.saliff@gmail.com', '7362891838', 'Cocoyoc, Mor. Yautepec.', NULL, '2025-12-01', 'Tecnología', 'Desarollador FullStack Python', NULL, 'activo', NULL, NULL, NULL, 't', 23, '2025-12-01 03:06:25.801364+00', '2025-12-02 06:28:49.652472+00', NULL, 'VECJ991130ABC', 'VECJ991130HDFRLS09', '23984983284', NULL),
('54f984b0-9bbf-4366-8563-cea39f2dac74', 'a42350cf-587e-44d9-8590-a6da3511237b', 'Daniel', 'danielgc@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-12-01 16:04:29.277708+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('5d51a3d7-7877-477e-86c6-c65dccc83855', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', 'Alejandro Solano Barrientos', '22680286@cuautla.tecnm.mx', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-12-01 16:04:29.277708+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('6aff26d5-a6cf-47b5-ab4d-e07aaf20260b', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'Cesar Navarrete Bustamante', 'cecar@gmail.com', '7351234567', 'México', NULL, '2025-12-01', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-12-01 14:35:58.295919+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('728b3dde-c8e1-43f6-9018-42bf921e1662', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'Admin general', 'usuario@ejemplo.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-11-25 04:12:17.785215+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('7b9cbe27-1582-4aed-adcc-bf2f911385d1', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'Irvin Sahi Sedeño Trujillo', 'irvin@gmail.com', '34545653', NULL, NULL, '2025-11-27', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 8, '2025-11-26 14:36:26.451117+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('82459c7e-998a-46c8-8d91-11e82c50ba67', '4838c265-1c5e-4520-9590-23fd6d4161dc', 'Daniel', 'daniel@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-12-01 16:04:29.277708+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('92df9d22-17aa-4694-9ad5-aac4a93774b7', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'Fernando Romano Rodriguez', 'fer.123@gmail.com', '7351009010', 'México', NULL, '2025-12-01', 'Tecnología', 'Desarollador FullStack Python', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-12-01 16:10:57.512916+00', '2025-12-02 06:28:49.652472+00', NULL, 'VECJ991130ABC', 'VECJ991130HDFRLS09', '83299239289', NULL),
('9dd44ed0-6a95-4894-a119-02de50a26d13', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'Barco Hernandez', 'chito@talento.com', '8324893482', 'Mexico', NULL, '2025-11-25', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 1, '2025-11-25 19:50:08.703749+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('a00dbd07-d165-45ce-aead-31f27a328758', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'Arizbeth Cabrera M', 'a@aa.com', '123456789', NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-11-27 14:51:19.523235+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('a57d71ea-346a-44d9-bf91-89055556e4ac', '2d556763-8c73-4af8-b48b-9de3dafca523', 'Jennifer Maciel Luna Escobar', 'luna24@gmail.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-12-01 16:04:29.277708+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('a91622a7-24b9-40f7-b9b0-d632254ac51b', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'Pedro Picapidra', 'pedro.picapidra@gmail.com', '234234', 'Ni idea', NULL, '2025-11-27', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-27 05:50:41.378448+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('c972c4ca-d719-4536-8b02-a331f2b1240d', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'Emmanuel', 'emmanuel@gmail.com', '2342342343', 'mexico', NULL, '2025-12-01', 'Tecnología', 'Desarollador FullStack', NULL, 'inactivo', NULL, NULL, NULL, 't', NULL, '2025-11-26 05:39:41.242551+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('cff530d2-c9cd-44c4-a101-d3e54e2ce28a', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'Roberto Salinas', 'rob.salinas@corp.com', '5544332211', 'Ciudad Satélite, Naucalpan', NULL, '2025-12-02', 'Seguridad', 'Ayudante de limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-12-02 07:01:33.799542+00', '2025-12-02 07:01:33.799542+00', '647cfc13-7f54-40af-82ca-cdb06ce510d9', 'SARR800228J81', 'SARR800228HMCXLS07', '77801234567', '4fe7b841-acc0-40ef-a3ff-f61cff35ef42'),
('d3ed8271-a766-4dfc-9b28-5dc55093fe29', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'Uriel Francisco Lopez Rios', 'uriel.rios@gmail.com', '7352638193', 'México', NULL, '2025-11-27', 'Tecnología', 'Desarrollador junior', NULL, 'activo', NULL, NULL, NULL, 't', 9, '2025-11-27 14:21:21.586078+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('f143cf4a-58c5-4834-af27-3dc3ac12dcce', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'Gerardo Guzman', 'gera.guzman@gmail.com', '3273929028', 'México', NULL, '2025-11-27', 'Tecnología', 'Desarollador Web', NULL, 'activo', NULL, NULL, NULL, 't', 10, '2025-11-27 14:54:31.015229+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL),
('fcde96d0-3ff9-401f-83aa-34f1bd4252cc', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'Arizbeth Cabrera Mz', 'correo.elquesea@gmail.com', '7352444348', NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-12-01 14:57:46.484257+00', '2025-12-02 06:28:49.652472+00', NULL, NULL, NULL, NULL, NULL);
INSERT INTO "public"."audit_logs" ("id", "user_id", "action", "table_name", "record_id", "old_values", "new_values", "ip_address", "user_agent", "created_at") VALUES
('05f05938-4d8d-430b-a21d-34e57630fc3f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a175e709-3c7f-40d4-8680-638c89713a4a', '{"deleted_at": "2025-11-27T03:45:40.660374+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 03:45:40.660374+00'),
('079b1b53-b859-42da-b15c-ba36fde301cc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'b861899c-8039-4812-9e29-66f7042924f5', '{"deleted_at": "2025-11-26T04:48:50.231947+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:48:50.231947+00'),
('14c57124-389e-4d58-962c-6bb60db5668c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '7cf169c3-3c04-4cde-b7fc-9723b04c3eb0', '{"deleted_at": "2025-11-26T04:40:01.201408+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:40:01.201408+00'),
('1feed483-ef1a-408b-ac91-be559fe6c71f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', '{"deleted_at": "2025-11-27T05:45:44.989659+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:45:44.989659+00'),
('40b07c50-f47c-4b09-bb17-f35413dd6176', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'c1b42160-1257-4d48-8223-ee1ae3363ae7', '{"deleted_at": "2025-11-25T14:44:33.616286+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-25 14:44:33.616286+00'),
('42d547a0-7183-472a-b376-29428081803f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'c5183644-6147-4e10-95c8-76e02ff41cad', '{"deleted_at": "2025-11-27T05:38:44.18656+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:38:44.18656+00'),
('42ef09c6-cee8-4ab7-b659-70ff228d3dbe', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '53779886-f93f-4b9d-b43b-52d938a6d846', '{"deleted_at": "2025-11-26T05:39:01.091543+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:39:01.091543+00'),
('468d8759-4517-43b8-8e2e-fa51bb951f20', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'd0c9faab-7fc4-45a6-973a-6a0e7443555e', '{"deleted_at": "2025-11-27T05:27:44.78636+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:27:44.78636+00'),
('4e5bd3a6-346e-4194-a640-f213c1b4fccd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '49b38508-cbe2-499e-a01b-04be88aa7528', '{"deleted_at": "2025-12-01T02:25:02.68989+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-12-01 02:25:02.68989+00'),
('53a6bff3-928d-4935-8184-ed53c49ec360', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '20429930-d675-478d-9f73-76b0bb9936ba', '{"deleted_at": "2025-11-26T05:36:08.744373+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:36:08.744373+00'),
('6c28d15b-4561-4d11-8f47-e08f89c9541a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '719b6637-db4a-4d3c-9fbf-1c291c4c9eef', '{"deleted_at": "2025-11-26T05:16:50.529833+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:16:50.529833+00'),
('71867398-fb5b-4d21-a5b1-41e9a6b79022', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '0d74d54e-9b17-412d-a2c7-4c0f8bb6b872', '{"deleted_at": "2025-11-26T14:30:20.416466+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 14:30:20.416466+00'),
('83d23d97-b21b-4b02-a89c-f6f44e6307ed', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'd445affb-c085-41c3-9de0-097ee8a94f42', '{"deleted_at": "2025-12-01T14:25:37.499641+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-12-01 14:25:37.499641+00'),
('8588b8f5-1164-46d0-9702-7e54b31971ba', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'ef2bcefd-29d3-4675-9873-5964c5103f58', '{"deleted_at": "2025-11-27T05:47:18.83134+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:47:18.83134+00'),
('85d64b3d-9d7a-453c-aa88-97a0ad5bce3a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'ddc4194d-0862-47c5-b559-413c339dba4a', '{"deleted_at": "2025-11-26T05:33:04.689682+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:33:04.689682+00'),
('b2ec9d37-600f-4d09-a7e8-b86013ba16b2', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'bb372a87-1ea9-4652-9054-002c00c9066b', '{"deleted_at": "2025-11-26T05:13:24.263693+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:13:24.263693+00'),
('b8820a9a-de40-41f0-a08a-47057d53ff21', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a7cdf496-e1af-4e99-b3d6-4a9531f140ee', '{"deleted_at": "2025-11-26T05:10:02.181119+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:10:02.181119+00'),
('bceb0a29-6dd2-48ea-803a-6b35050a03aa', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '68baa34b-5143-4551-9aa8-3e9b8880fe81', '{"deleted_at": "2025-12-01T02:35:56.074639+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-12-01 02:35:56.074639+00'),
('c06a2f92-86e6-4488-82e4-38cc1e43dff3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a7db4fd3-6eee-4b1c-aeb3-f18b64d35a6c', '{"deleted_at": "2025-11-26T04:47:10.955372+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:47:10.955372+00'),
('ca2ae1a0-c5c4-45da-8206-cd4962ce363d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '6bd3fda5-1fd6-442d-bb01-9b3826142ac9', '{"deleted_at": "2025-11-26T04:50:19.427564+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:50:19.427564+00'),
('dc72ed54-98da-4816-82d7-166c5828bd03', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '1b4e17c4-422b-43b5-bbfd-64bca06daad3', '{"deleted_at": "2025-11-26T04:55:00.787496+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:55:00.787496+00'),
('e3ef7780-dcb5-4034-88c2-3494fa741562', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '4acef76d-12e7-45fb-8150-f2c81606b3b5', '{"deleted_at": "2025-11-26T04:37:58.735088+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:37:58.735088+00'),
('f36320f3-a00a-4ac5-a2d9-6dc3e867d675', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'cfbd1d8e-3fea-4cfa-864a-ea9d65a2e65b', '{"deleted_at": "2025-11-26T04:29:58.883016+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:29:58.883016+00');
INSERT INTO "public"."contracts" ("id", "user_id", "contract_number", "type", "position", "department", "start_date", "end_date", "salary", "status", "file_path", "notes", "created_at", "updated_at", "area_id", "position_id", "file_url") VALUES
('0b1fea37-dd2c-456d-9785-187ceb2b7298', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'CNT-463501-8zva', 'indefinido', 'Desarollador FullStack Python', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 16:10:58.636691+00', '2025-12-01 16:10:59.880797+00', NULL, NULL, 'b3d780b6-3590-4615-a12c-918a2ebb9f2d/CNT-463501-8zva.pdf'),
('0e626d33-515c-4015-9204-8c406c03c004', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-542101-hzx4', 'indefinido', 'Desarollador FullStack', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 02:52:22.166853+00', '2025-12-01 02:52:23.590689+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-542101-hzx4.pdf'),
('1d995e4f-be45-4dc4-8a42-f34d1c8dee0a', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-291894-x1wf', 'indefinido', 'Desarollador FullStack', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 03:04:51.979213+00', '2025-12-01 03:04:53.514403+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-291894-x1wf.pdf'),
('2c1d4712-1920-44bf-afeb-430bf3b9b2d2', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-579580-7ww0', 'indefinido', 'Limpieza', 'General', '2025-11-26', NULL, NULL, 'activo', NULL, NULL, '2025-11-26 05:39:41.918256+00', '2025-11-26 05:39:42.856239+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-579580-7ww0.pdf'),
('40bc5b7f-61c8-4e90-bc87-c0eb17138685', 'df2c0217-fa38-43d0-83a2-3fe440db6678', 'CNT - 534004 - fpwr', 'indefinido', 'area Bf3', 'Tecnología nivel 3', '2025-12-02', NULL, NULL, 'activo', NULL, NULL, '2025-12-02 03:52:17.053087+00', '2025-12-02 03:52:17.053087+00', NULL, NULL, NULL),
('4d5c51b1-dae9-453d-a921-95419537f106', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'CNT-637559-w8m2', 'indefinido', 'Limpieza', 'General', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:50:41.967459+00', '2025-11-27 05:50:43.092488+00', NULL, NULL, 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d/CNT-637559-w8m2.pdf'),
('699aeee4-f68f-4d41-88e5-75859698b425', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-842422-yvgu', 'indefinido', 'Desarollador FullStack', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 02:57:22.512895+00', '2025-12-01 02:57:23.891368+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-842422-yvgu.pdf'),
('6dbcb4af-03c8-40a4-99ad-ced0cfcd2b52', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'CNT - 894714 - h4rl', 'indefinido', 'Ayudante de limpieza', 'Seguridad', '2025-12-02', NULL, NULL, 'activo', NULL, NULL, '2025-12-02 07:01:34.89739+00', '2025-12-02 07:01:36.406279+00', NULL, NULL, '32e62c94-dc74-4a34-9848-4e7dbbbb5d89/CNT - 894714 - h4rl.pdf'),
('6e4c8014-53c9-44ae-83b5-d4bc36c6cb75', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'CNT-283939-1f11', 'indefinido', 'Desarollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 14:54:31.930451+00', '2025-11-27 14:54:33.306453+00', NULL, NULL, '70b537f6-db5e-48d3-86ee-7a280655aba5/CNT-283939-1f11.pdf'),
('760f3700-d151-4607-8af7-2ba33992bf4b', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'CNT-675193-4wm5', 'indefinido', 'Limpieza', 'General', '2025-11-25', NULL, NULL, 'activo', NULL, NULL, '2025-11-25 19:56:30.231991+00', '2025-11-25 19:56:30.231991+00', NULL, NULL, NULL),
('90d4c952-8d08-4089-bcf0-93a4b6e75468', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'CNT-176319-ws75', 'indefinido', 'Limpieza', 'General', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 02:06:20.885948+00', '2025-11-27 02:06:20.885948+00', NULL, NULL, NULL),
('966bee48-7c72-4e3e-b47a-cf90c095fbc3', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'CNT-660526-n6bf', 'indefinido', 'Desarrollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:17:44.979202+00', '2025-11-27 05:17:47.538293+00', NULL, NULL, '85981ed9-2f23-463f-bae7-8e41fe2a033b/CNT-660526-n6bf.pdf'),
('a1676859-b7b1-4fd3-a5f0-201139911b94', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'CNT-987064-9ao0', 'indefinido', 'Desarollador FullStack Python', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 16:03:02.27932+00', '2025-12-01 16:03:03.858887+00', NULL, NULL, '284f5d3c-40aa-40f2-b3b4-e519e8550e4b/CNT-987064-9ao0.pdf'),
('b1a3d5c3-3d20-435d-986b-415fdf36b3f6', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-422658-zmil', 'indefinido', 'Desarollador FullStack', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 02:50:22.753259+00', '2025-12-01 02:50:25.884524+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-422658-zmil.pdf'),
('b347f8b0-64d3-4eda-9317-de0d1382d1a2', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'CNT-386409-8oav', 'indefinido', 'Desarollador FullStack', 'Tecnología', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 03:06:26.475093+00', '2025-12-01 03:06:27.572801+00', NULL, NULL, '284f5d3c-40aa-40f2-b3b4-e519e8550e4b/CNT-386409-8oav.pdf'),
('b972383f-8d87-4565-ae8d-0a0ac2f52ef6', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'CNT-849130-godm', 'indefinido', 'Limpieza', 'General', '2025-12-01', NULL, NULL, 'activo', NULL, NULL, '2025-12-01 14:36:00.188656+00', '2025-12-01 14:36:02.769496+00', NULL, NULL, 'c2cff6db-9b29-40d0-8b06-798d406d17a6/CNT-849130-godm.pdf'),
('be1710d5-5b9a-4fa0-9249-da39bd72dc69', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-182777-wwtf', 'indefinido', 'Desarrollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 02:23:07.396615+00', '2025-11-27 02:23:07.396615+00', NULL, NULL, NULL),
('c837a4a0-3782-48fa-b37d-578a0fa5269a', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'CNT-407308-rziy', 'indefinido', 'Desarollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:45:22.112741+00', '2025-11-27 05:45:22.112741+00', NULL, NULL, NULL),
('dfcba5cc-be54-41a1-9f92-04187e0333a3', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'CNT-546718-sa3c', 'indefinido', 'Limpieza', 'General', '2025-11-28', NULL, NULL, 'activo', NULL, NULL, '2025-11-28 06:49:13.920878+00', '2025-11-28 06:49:15.125025+00', NULL, NULL, 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c/CNT-546718-sa3c.pdf'),
('e7c1bc51-4adb-4d81-9567-0288ea133725', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', 'CNT - 775838 - qrqt', 'indefinido', 'Diseñador Gráfico', 'Marketing', '2025-12-02', NULL, NULL, 'activo', NULL, NULL, '2025-12-02 06:59:36.029014+00', '2025-12-02 06:59:36.029014+00', NULL, NULL, NULL),
('f07d32cf-ea41-4eb5-bc53-e16151103a5e', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'CNT-294865-zczp', 'indefinido', 'Desarrollador junior', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 14:21:22.97153+00', '2025-11-27 14:21:24.256728+00', NULL, NULL, '26edb037-5f42-40f3-9067-6da8aafa4acd/CNT-294865-zczp.pdf');
INSERT INTO "public"."auth_audit" ("id", "user_id", "email", "action", "ip_address", "user_agent", "success", "metadata", "created_at") VALUES
('00260da1-8d6a-4a9d-a930-129270b6493a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:51:48.571203+00'),
('01814298-0064-4608-b8b3-c98ac3824c35', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:48:59.614068+00'),
('02e40eb1-3c29-446b-8a26-61e6ca79ed24', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:15:12.639663+00'),
('0309fcf9-81b5-4736-bb41-32af6c5a16f3', NULL, 'emmanuel.saliff@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:31:52.348112+00'),
('044a612c-ee24-4ea6-a316-34373738ae4d', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-01 14:26:50.645643+00'),
('045469d8-6625-4bc9-b7e6-67ba8c1b8153', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:51:28.721351+00'),
('053c5f49-eba4-45c9-b223-3a62109b3e55', NULL, 'AlejandroSoBA', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 11:12:46.518635+00'),
('05405cca-3cb5-449d-805e-a0249b911e20', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:27:55.704219+00'),
('066acd4d-e2f7-422d-9b65-93c2f8b09ee3', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:52:45.289435+00'),
('06c7f948-33cf-429e-b90e-a2cbdf8eb3d6', NULL, 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:19:37.744364+00'),
('07b6b8e0-4a10-4bf9-a2a2-b4982409cd08', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:47:16.597264+00'),
('08ae9828-423c-47d7-b00d-ba3305126994', '3085a308-c2af-4c71-b39d-613c3134d0d6', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:24:31.705512+00'),
('0b5efdb3-d892-4945-a8af-6543abb57760', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 02:43:35.605128+00'),
('0c0ec53e-66b0-4857-a46f-b22def89a1d8', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', '22680286@cuautla.tecnm.mx', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:46:35.290314+00'),
('0d3a0a2f-9c02-4ac9-a5e2-936bfbba674e', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:51:20.882045+00'),
('0d744e1b-bc1b-442c-bf50-575f601f79fc', NULL, 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:19:35.590518+00'),
('0e814771-7457-40b4-963c-3fd548c584b4', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:07:15.668959+00'),
('12894326-d237-4692-8d6e-a9bea22fc1ae', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:52:05.458401+00'),
('1295d58a-e4ee-46c8-b9a4-1819352064b2', NULL, 'uri.23@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:20:56.048531+00'),
('12b03cb5-518b-483d-b454-fb236d2217d9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:50:51.660632+00'),
('13b6ec07-bd27-4f17-83d9-da86f5295752', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-12-01 02:15:00.900998+00'),
('14885489-b2d9-4699-846b-099efd44b11a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:07:42.49271+00'),
('151d289b-7ed1-4ef7-8ccc-7d88a4d11e1d', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:33:41.810686+00'),
('152e80f0-32de-4f93-bd8c-db854d681494', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:24:24.246458+00'),
('1701a997-5305-4979-a92b-62fecde47b78', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 05:06:50.665423+00'),
('172883d7-6fa4-4154-a8f2-c2ca903c1c60', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:23:18.366722+00'),
('175588df-dece-4c23-8b30-c8ca6ecba9a3', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'emmanuel.saliff@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-12-01 03:06:25.381559+00'),
('17b923aa-a9b4-4e09-85c2-d4eb430d5611', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:12:59.82299+00'),
('18dc8f01-391d-4f73-86a8-2fd3f2e34590', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 04:24:25.472819+00'),
('1905a66c-039f-40f7-9531-1a4b10ff7a1e', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:47:27.251433+00'),
('19483df8-b68d-4673-beac-1eae4c898e89', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:41:37.337585+00'),
('1a361f6e-5c1b-4cee-bc8a-843fe62fc72a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:59:23.813824+00'),
('1ab43b8f-df58-447a-9c33-331f585892a1', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 05:02:52.176374+00'),
('1d8f268a-6e11-4894-b642-62efb571751b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 13:22:48.894983+00'),
('1da78723-510c-4421-95ed-abfc3bea9ff2', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:12:07.376832+00'),
('1e9f869e-dbe5-4f61-973d-68d042207d89', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'fer.123@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-12-01 16:10:56.872289+00'),
('1f60a1ce-6d0e-4ce6-8602-a8a7619e890c', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:14:22.478631+00'),
('20772182-4245-4409-85ca-f018373adb0d', NULL, 'alejandroSB', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:24:13.524279+00'),
('209c9c43-5962-44fc-a19d-2e7ca912ebbc', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 05:02:46.030373+00'),
('20afbca0-da45-4cf9-bd9d-e965b7399982', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:48:38.449359+00'),
('21a97322-38d4-4d6b-b7b0-9f1232cba1b6', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:17:25.559466+00'),
('226b4c71-1437-47e0-9e46-70f1694bdc52', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:46:33.700133+00'),
('22fa2f6f-1a09-441f-821f-0f07290e6aa9', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 05:12:03.65623+00'),
('2372da16-6735-4be4-b1a9-0624e76b0e39', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 13:22:33.067522+00'),
('240c287b-0159-4a89-8988-560a1eec8134', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:35:52.016463+00'),
('25d1fb11-cb00-41bc-8b33-0f146245483d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 14:58:51.186793+00'),
('25d460af-15d9-4ede-83a4-f94a5005f181', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:16:44.686938+00'),
('277d0357-ce59-4e4b-aff9-a86989bc5445', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:58:34.827865+00'),
('27d65b4c-ab3b-4255-822b-35446d1c0b2d', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-01 11:12:24.452371+00'),
('2905c99b-be80-41bd-86d8-afac4a0cd286', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:05:03.799648+00'),
('2ad988ff-2404-4b25-a944-95d81212dabd', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'chito@talento.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 19:50:08.345902+00'),
('2f1e6cad-8247-48bd-95d5-30e05f083b3d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:54.700893+00'),
('303a66e4-f8b6-4edc-9eff-04ce6de1fbaa', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:10:50.332107+00'),
('303e86e3-59e9-481b-be94-461947520bcc', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'recluta@prueba.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:45:20.692976+00'),
('305190ec-ba4e-4ec6-9ec0-9cb8070400ad', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:25.827315+00'),
('30880df1-56cc-4650-b382-2d8a2d26f428', NULL, 'emmanuel.esva@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:39:52.894704+00'),
('30cfb81d-9a6e-4ce6-bae9-f25222d7523e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-30 16:39:20.431617+00'),
('30ed4d2b-5f42-45ee-bc6f-1afb895545e7', '2d556763-8c73-4af8-b48b-9de3dafca523', 'luna24@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-12-01 14:49:30.668557+00'),
('3128b317-e5e6-4baa-9fd7-d1d0b6ec5f66', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-28 02:02:21.929424+00'),
('3154fce0-7eab-453c-9666-7b1452b3ecc1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:16:04.200965+00'),
('3181818d-68d7-4a9d-9dbb-57cc46c8e953', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:14.43474+00'),
('326d52ca-21a5-4e1e-a816-04c36975c3d4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 15:08:54.676363+00'),
('32c7b5b6-2cf0-426d-bb8f-bf01571bd0bf', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:19:55.527961+00'),
('330497d9-32e6-4b22-b830-84b877eca2a7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-25 14:46:38.896523+00'),
('33a3cc76-89c0-4422-838c-b38d2c018ba7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:50:00.768195+00'),
('348952a5-356c-4ced-af2b-89260541eb3f', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-27 14:14:50.117536+00'),
('35c4357c-24f2-4318-a25f-0aaba84c9f69', '2d556763-8c73-4af8-b48b-9de3dafca523', 'luna24@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 02:59:29.480337+00'),
('3620080b-6e4c-42d4-be13-3111bcebd8bf', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:51:50.339126+00'),
('36571150-6b7e-4fb0-a8a8-7b9b3bc72715', NULL, 'Baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:40.566928+00'),
('36fb0373-52c3-4a00-8c34-f6607997dcf7', 'f18f049d-a237-455d-a3db-6e16489ba32e', 'elena.vega@design.com', 'signup', NULL, NULL, 't', NULL, '2025-12-02 07:04:52.543833+00'),
('380d4765-e531-4d0a-9bdb-f8a8cff7b02f', NULL, '22680286@cuautla.tecnm.mx', 'signup', NULL, NULL, 't', NULL, '2025-12-01 11:12:14.556338+00'),
('38715005-7039-4675-a9b9-73769bf700e5', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 04:24:42.465057+00'),
('39883697-f23f-4838-8a75-4bca2245abb3', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:36:12.012745+00'),
('39ae8086-3359-4b8d-b20f-b5a58831f55a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:23:59.720674+00'),
('3a8fcc11-1d0a-4c56-8cbd-23d2dc879890', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-26 00:12:37.260287+00'),
('3af7721f-d4a7-4a30-a2a3-7e897ac32e5f', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:26:52.196594+00'),
('3b79639d-e3a5-4ff3-a8ce-59c97f388910', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'pedro.picapidra@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:50:41.002865+00'),
('3bc2fc48-ee41-4e38-ab38-6dd6ff9417cf', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:06:25.76248+00'),
('3c585c82-c58c-40fe-87cd-fe24a6f919b8', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'correo.elquesea@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-12-01 14:57:46.141047+00'),
('3e7a62a1-9731-46a9-be44-924bb3d4b79e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:25:59.877241+00'),
('3f7e67eb-e6ec-4877-ac1b-2da85dfc912a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:50:51.184809+00'),
('41c0506c-5acc-4829-9380-6c6f1b227e1f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:47:01.89929+00'),
('4277b83a-08dd-44c3-99e3-b1d676b529c0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 15:23:42.436732+00'),
('4308233f-22dd-41fa-ad37-bc5dc4f159d1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 00:43:35.398531+00'),
('432de683-2f61-4582-befe-07148b0a5e5f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 03:28:26.621025+00'),
('439d1f74-0366-4f13-8c27-3958ada8de0d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:18:29.132121+00'),
('44283901-dfe7-45e7-8ad3-e578ec82e788', NULL, 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:20:25.201402+00'),
('44dc52d5-769e-4fdc-8166-0eaf93d4d847', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:51:18.827907+00'),
('45432dbf-80ef-431e-8cd5-81095814cda5', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:49:28.344334+00'),
('4586ec0e-c2cb-4577-a5a9-351101b15421', NULL, 'oscar@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-28 06:35:11.08377+00'),
('4669365d-2479-41f2-89e7-7655321ef94d', NULL, 'alejandroSB', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:23:31.960501+00'),
('48779726-66bf-4749-8621-909034a8fd4d', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-01 14:43:07.831904+00'),
('49528aab-bdf7-4e00-91e7-7917b111c2d4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:15:22.009225+00'),
('4c8c46ad-a37f-456d-860e-28072aaeb943', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 3}', '2025-11-27 14:39:59.329215+00'),
('4d040261-c16c-404c-8ee6-3299430c0811', NULL, 'usuario_ejemplo ', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:48:04.01368+00'),
('4ea73cf1-0d10-4b5a-8dda-e8be0838c22d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 00:49:57.271644+00'),
('4eb80e8c-ed16-44ec-944a-c22f85c5e2e0', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:39:40.813255+00'),
('4f0afa7f-02f9-414c-abfa-a96aaf117f62', '4838c265-1c5e-4520-9590-23fd6d4161dc', 'daniel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:52:31.193548+00'),
('4fa5614b-0c8b-4579-905e-dc8c1ac7213f', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:21:55.892388+00'),
('500b2aab-cffe-4a25-b78e-1ff576337c32', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:08:46.949953+00'),
('51530b88-2cbd-4ff1-82a7-c9b4aff20a59', NULL, 'empleado_ejercicio', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:33:05.29393+00'),
('51b4e006-72df-4e3d-83db-951c8aa978c8', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:39:09.493678+00'),
('53210da1-dd2d-4154-b811-bda6fec14299', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 15:02:15.367951+00'),
('54d02c9c-a65a-4c70-99f4-5cedc5086d5b', NULL, '22680286@cuautla.tecnm.mx', 'login', NULL, NULL, 't', NULL, '2025-12-01 11:13:28.196636+00'),
('54e19926-da4d-4e63-99d2-0909de8de41c', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-27 14:14:40.425453+00'),
('55054db0-cd6d-4a41-bc4f-fc7f336a466f', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:36:57.503524+00'),
('55ad3c3c-7d76-479b-97df-0963a997047e', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:17:46.713236+00'),
('55b73e5e-69c7-406f-9c4e-8e2b28c58b17', NULL, 'alejandroSB', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:23:25.574298+00'),
('5655e6a3-0896-439f-af96-f39fe106d7cd', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:44:49.098108+00'),
('5719b1a2-ad67-4098-96e8-d0c1a0e6fb78', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 05:55:32.050886+00'),
('57bef152-a181-4b0a-9477-6223ff2dc6bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 04:18:32.308637+00'),
('591ae1ef-ea6e-45d6-afdf-90a7b132ea91', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:45:03.352544+00'),
('596e59e6-41fe-460f-99e6-eb2443f5ccf6', NULL, 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:20:43.512759+00'),
('59a8a1dd-f20f-4bd7-9e83-54b058d0604e', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'gera.guzman@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:54:30.489047+00'),
('5b30b0a1-868a-4944-9485-75581ebc79ca', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:35:02.585623+00'),
('5b3687f9-45d8-4262-90d3-45b4442c3cc9', NULL, 'alej', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:23:47.582229+00'),
('5bc14c37-4c9f-4d74-80d4-72c6cbff69c7', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'correo.elquesea@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 15:10:54.450945+00'),
('5bfea6e2-38de-4c76-b382-179d4bc55798', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 03:58:32.796037+00'),
('5cb6dde9-a753-4bee-a747-9412ef16685f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:37:14.960019+00'),
('5d8a18e3-739e-41ed-842e-284b31843ea7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 00:12:48.338354+00'),
('5f75fc3b-19ce-4256-b2d5-fb59ee7070c1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:39:21.623144+00'),
('606ebd1d-299a-4b66-b265-1cb13c783425', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:53:03.481591+00'),
('60a3d958-81e0-4278-ad2a-0498b5fa61cc', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 15:23:46.449687+00'),
('60b6d159-a8cc-477a-bc72-3e46a1b0f2cd', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:31:40.037662+00'),
('62a97ab9-e4fa-4e21-8bb0-2fc98d823371', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'pedro@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 19:56:29.208007+00'),
('62e373d7-fa47-463b-9204-97016e5fd75c', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:17:42.131964+00'),
('638440b8-ec18-4939-806a-d920cf4450fd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:47:04.85003+00'),
('6400b199-f784-45d7-95b5-2f5444d86a04', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:52:42.911638+00'),
('6444ec7f-511f-4706-a503-018b75e75d81', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 11:26:53.0353+00'),
('68b9e9a1-89c1-417a-b99e-800c75f87704', NULL, 'david@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 21:37:25.328475+00'),
('68fdd089-40ab-4bfb-b211-c39fb7d1492f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:35:39.877461+00'),
('69bada82-391d-460b-a910-e0ddf18ba778', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:52:37.795008+00'),
('6aa670ca-5f2a-4c3c-b4eb-9a8229cdca63', NULL, 'AlejandroSoBA', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 11:12:40.90861+00'),
('6ad2e94f-ae1c-47fc-9dad-4521d46d4513', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:36:29.213961+00'),
('6c37094d-8301-4a65-8fb3-b446f1db768d', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:58:19.754678+00'),
('6c997d99-b96f-4f6a-ae96-a1c735bb1aeb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:43:11.019811+00'),
('6d60871d-d04f-4405-9bf7-3e6cf882403b', NULL, 'usuaio_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 02:15:12.336257+00'),
('6dd9af66-616d-4ff7-ae1b-07bfcea2999f', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-27 14:10:30.966228+00'),
('6df026b3-2ac7-46e5-9f54-2131c6b3e09a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:58:31.668621+00'),
('6e246031-ece8-4870-b171-61834cbee256', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 00:10:50.059187+00'),
('6ee8d9d2-54d3-4307-9785-1305269cbcdc', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:22:56.801419+00'),
('718de33c-2d03-4fa7-bb32-00f689f52b3d', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 05:18:48.385338+00'),
('71e21591-952c-4c96-b7c7-45a40bd2a480', NULL, 'usuaio_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 02:15:19.302097+00'),
('7377064d-b1c0-45b6-ad3d-86d1d265a4e0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 04:39:41.06286+00'),
('75c6ed07-e93e-4b90-ad82-d2c8cb481985', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:22:11.057514+00'),
('771bdd0f-c080-46ea-b202-d01aba9f6e9f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:58:54.688245+00'),
('77310eca-3816-4e10-a2cf-c6b95771efe5', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:16:51.855079+00'),
('78dd1a18-282f-430e-80d3-c792b51f223f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:20:04.899927+00'),
('7aafec46-7c90-4835-8f0f-249fef60942c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:42:19.829298+00'),
('7abba354-bc6c-4065-a137-01de80eb2146', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 15:16:45.824689+00'),
('7aecc614-1647-4425-bf91-4a2de0bb892f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:49:17.289067+00'),
('7b457820-2db7-484f-81b8-74531440b661', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:24:49.701983+00'),
('7be45b1f-c68e-4abc-a35d-7c1fdc70b48d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:56:12.428343+00'),
('7c1a1692-f06c-4d78-9fff-12e85324b283', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:33:44.313943+00'),
('7df761ae-9887-44c4-abee-08b2d1c58a67', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 05:12:31.288345+00'),
('83d7306b-dd32-43b4-b972-cef016ea4205', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:32:40.964061+00'),
('84decb35-1553-4f50-b896-64bcd5f7afcc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 03:38:40.504146+00'),
('8587ac45-b2ee-40d6-8549-ab4803669ccc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:46:57.493168+00'),
('86a4a73b-1afc-4d8d-b5f3-b8be3970ee8f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:44:51.109256+00'),
('86ec3a55-b66a-4504-acd3-ed2b109ca508', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 05:55:14.661975+00'),
('87dfd1e2-e22e-432e-b4cd-967f9db58dbb', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, 'password_reset', NULL, NULL, 't', '{"reset_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', '2025-11-27 05:02:20.982552+00'),
('886ddad6-7d3b-466e-85c4-72d26f2aea5d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 06:47:44.469168+00'),
('89d86b59-2615-4077-88d2-55113e95611a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:33:13.555192+00'),
('89f26f8f-dcfe-41b5-bef7-4125f16677c3', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:37:06.578309+00'),
('8a0da071-cfae-4466-98ee-6f63c5309057', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', '22680286@cuautla.tecnm.mx', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:27:02.176995+00'),
('8a94e83c-8d37-4972-b9ed-965a1ccc3b29', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 03:37:20.871767+00'),
('8b681857-30bd-4cb9-83a0-e8c2529a27d1', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', 'paty.oro@mail.net', 'signup', NULL, NULL, 't', NULL, '2025-12-02 06:59:34.906202+00'),
('8c016ae1-a3f8-4b2d-a6e4-c5a1565d708d', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'cecar@gmail.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 2}', '2025-12-01 14:53:40.424052+00'),
('8dbdcafc-5e0e-4fea-bbe2-a0561614ebf3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 04:37:06.882749+00'),
('8de5aac2-7cea-473a-a5c6-ad4c86274c62', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 03:58:42.594033+00'),
('9044d624-d12b-48ae-ae8a-30842cc5c833', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:11:59.546031+00'),
('90b66361-b209-4a68-99f3-ecce2fa3e798', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'rob.salinas@corp.com', 'signup', NULL, NULL, 't', NULL, '2025-12-02 07:01:33.418208+00'),
('915357e6-7f9b-40e7-b853-50fe8a1cb1e1', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:34:36.870281+00'),
('91d332b8-b187-448e-8e43-e7790323ec47', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 06:19:18.436591+00'),
('9261f3af-15c1-4065-88c0-60bef5580fc4', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:51:40.735266+00'),
('943d6438-d911-4274-bdef-1aedc822880b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:30:11.215468+00'),
('94b3a02e-07b0-4b2f-beeb-295760846df0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:31:06.502113+00'),
('95743d2c-284c-44a8-bd9a-e85065ed301a', NULL, 'usuario_ejemplo ', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:22:51.843948+00'),
('986a05da-31af-4d34-8d64-10d7b4fa11f6', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:33:54.333215+00'),
('9a534336-e2a8-4bc1-981e-fbfc07015772', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:01:30.816815+00'),
('9b1f3ccb-2d82-43ec-8010-ee1c04989833', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:06:35.74822+00'),
('9b4e4744-167c-4aa3-b9c9-48fee1bcb7a8', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:33:52.552636+00'),
('9c6a0424-4576-448e-8b16-362abbfb5698', NULL, 'rtx@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 02:57:08.812273+00'),
('9de4cbd0-2f2a-45dc-aa56-1ad8964baa77', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:43:35.898395+00'),
('a069ae8a-bed0-42cb-b4ca-d2b89ae3e4c9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 06:25:01.565412+00'),
('a1af026d-0cb7-4165-af58-7af6a8a94e91', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:44:31.418462+00'),
('a2628faf-6721-4190-ae99-4fb98fca8c9a', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:47:46.159905+00'),
('a357384b-4243-4db1-8b13-4e93b2b41beb', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:18:30.702518+00'),
('a5a38729-d6e6-409f-bdd2-83ed7961b946', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:31:28.348927+00'),
('a6393688-8945-45d3-bea5-f4c8195c6e00', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:48:35.09262+00'),
('a6bea86d-6506-4882-b495-2ed37cc007f3', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', '22680286@cuautla.tecnm.mx', 'signup', NULL, NULL, 't', NULL, '2025-12-01 14:26:11.646255+00'),
('a917453d-30ec-4402-814a-d0f559aa048c', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:38:40.238367+00'),
('aa2f5ce0-f299-47f8-be7d-3948f758ff83', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:23:34.338516+00'),
('aba8964c-9727-46da-9576-fc9b8a021ce1', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-02 04:33:32.819953+00'),
('acbf8067-27c9-46bb-a99e-77a8c1ea3831', NULL, 'Empleado_ejercisio', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:33:39.591799+00'),
('acd096ac-269a-4dfe-9aab-4c50294814b8', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:36:06.585102+00'),
('ae74a066-8b1c-4a15-8679-de972229b921', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'irvin@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 14:33:29.196135+00'),
('ae841e65-db84-4d7a-9f9f-00fb9d6f4bdb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 00:54:22.550582+00'),
('afa05509-188d-4602-b285-40cf022b3d27', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:34:53.650703+00'),
('b0b4d70c-d81a-4976-8b11-c105e97932c5', NULL, 'vertin@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 03:46:34.369071+00'),
('b0fd04b1-99c1-4566-8ef8-5001eaadf4fa', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:55.255945+00'),
('b5ccce91-3e3f-43e0-a4fb-7ba16d159201', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:16:49.746378+00'),
('b65845b8-e342-4a15-a24c-f17790e98506', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 05:57:40.799923+00'),
('b6d2ca0d-5130-452e-972d-383c35973f8c', NULL, 'Empleado_ejercicio', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:33:14.179067+00'),
('b7a050da-7e12-4c42-ae29-8e4925d12d7a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:36:14.40427+00'),
('b7f3fd83-a329-41c8-865d-16d40701efa5', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 05:18:55.652594+00'),
('b7f73907-b8ac-4bb8-8c00-c3ef563c7163', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:25:23.283212+00'),
('b8d7bc77-5ec6-46e8-8f34-6da1a8f7421d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 00:12:43.230841+00'),
('b9362bd0-f866-4c71-9270-65723f9352e7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:14:49.195609+00'),
('bab79a02-f080-40af-913d-319f433853a2', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:18:26.455656+00'),
('bbd2e192-20a4-40b2-bd81-09a5f0c4566e', '0b007de5-c244-4693-98d4-e9b3e7e33b4f', 'migue.castillo@web.com', 'signup', NULL, NULL, 't', NULL, '2025-12-02 07:16:37.028897+00'),
('bc578b58-112f-4698-8bf9-f34530d45f2e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 01:56:23.388075+00'),
('bc86cf5b-83c3-41d2-8d8a-28afb0273fa0', NULL, 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:21:35.43836+00'),
('bd0604e9-d626-45b9-9c07-ebab81a3b6d4', NULL, 'usuario_1', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:37:59.629367+00'),
('c092db66-564d-46d6-8520-93c8af902166', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:04:33.729008+00'),
('c09bc7cb-de07-44bd-b79e-6424768bcf23', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-01 14:51:18.54629+00'),
('c0e147b9-62e1-480d-9322-c013644366a9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:24:46.57803+00'),
('c20d1103-d62a-40b5-b913-1781edcbad7a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:16:38.739128+00'),
('c26f25ad-aa95-45e5-8cce-aabc5304318f', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:13:09.835967+00'),
('c54c2c98-f43b-4847-a6da-64fc20ef2d6c', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'prueba@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-28 06:49:12.928621+00'),
('c5ac2319-ff48-42b7-b067-64d36d59723a', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'cecar@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-12-01 14:32:15.20012+00'),
('c67b77a2-f957-4292-8bfd-ca6e26b396bd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:39:52.373562+00'),
('c6d1eb76-784a-4653-8ddd-7cd64b4727a1', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-28 01:55:36.186259+00'),
('c7e82cbb-9332-48d4-8288-353cf430616b', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:50:30.457527+00'),
('c846d0dc-53ad-44f5-9c80-b6be6f2a0d0e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 02:15:26.050793+00'),
('c92ef5b0-7fe6-4b7b-9953-65a457d31f6b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 2}', '2025-11-27 14:39:54.183242+00'),
('c9e012ac-90f6-4277-9009-8b6c0e5eace7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 03:55:06.724614+00'),
('ca6e4cdd-4d2a-46ad-afec-b1ec41760fde', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:11:05.976609+00'),
('caa22749-9744-462b-93a2-c4d4f7e847e1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 10:43:04.078757+00'),
('cb5d55b7-fff2-4385-b80e-8ee15691a404', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:44:49.816151+00'),
('cc59ffc8-8fa3-4649-b136-47d27a090af3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:25:01.971109+00'),
('cd11f5d7-e639-4231-a84a-efb27601de4e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:55:26.536629+00'),
('cd70fe9f-28ce-4928-ba71-58ccafcf2f54', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:54:40.20968+00'),
('cd749f3d-8718-49bb-b177-d1b93251c203', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-01 14:46:44.194263+00'),
('cdf43740-5523-45e3-9dd3-a76414f312b2', NULL, 'Baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:48.318294+00'),
('ce2c5f8c-9f53-404c-bfc0-bfc00d171d49', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-02 02:06:37.035222+00'),
('cfe2a6e7-6173-4b2a-b278-37715fff9182', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:46:47.772065+00'),
('d1ca65c4-e93a-44b6-b9b4-50448bb6c2d0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:31:42.56754+00'),
('d2cd4e8a-c88e-4cac-9fa5-9ee9bf3a0ebf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 15:14:24.491311+00'),
('d3a8cf9e-825d-4ce5-90b7-120b54974809', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:59:14.078504+00'),
('d519f9fa-12a8-4c96-95a5-454a0a8533f4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:39:43.00206+00'),
('d5d040fa-c669-426d-9a6e-43bc44090a99', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:54:28.756478+00'),
('d6d297d8-f515-4dd7-8955-ec2afe9fd9a4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 02:58:59.923759+00'),
('d8e900f8-13e1-4b2b-91e6-f6028de1f6bf', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:52:33.579313+00'),
('d8f2675a-7b71-4bd6-8209-b6a6be2b0545', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-01 14:46:24.11613+00'),
('d943208f-cde8-415c-905b-06142110275b', NULL, 'usuario_ejemplo', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-02 04:22:03.24654+00'),
('da523cab-3673-49c5-ad22-7c72894e0304', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 14:34:50.880584+00'),
('dcb85ee8-8d00-4700-ae24-baae43a401ce', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-12-02 02:06:33.547786+00'),
('df80ad59-adbc-4a50-910e-3ce82a6790af', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'uriel.rios@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:20:16.135521+00'),
('df8f0400-408b-4055-b183-5a7177be821c', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-28 01:53:25.239348+00'),
('dfec0975-fc8f-4643-b859-3643f1ce63dc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:44:21.671655+00'),
('e16c90a9-48cb-4a90-bb04-781c9e5a6612', 'a42350cf-587e-44d9-8590-a6da3511237b', 'danielgc@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:51:33.434145+00'),
('e18695a5-8420-4e74-875e-608b475379b6', NULL, 'admin@sistema.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 05:19:14.956557+00'),
('e1d3c0a7-0e38-4d0e-8036-6e35d8fddcce', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-12-02 04:43:36.109396+00'),
('e4ce4e3f-8ab1-42f1-b249-f117c0343b30', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:53:08.254024+00'),
('e6062937-f8f3-4e99-877c-fa027521b0f0', NULL, 'AlejandroSB', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:22:39.079395+00'),
('e61028d2-c870-4c55-a1dc-96a53cda3dbd', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 13:22:17.010714+00'),
('e632ca0f-36e7-4b82-8acc-84d8cc6d6691', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'cecar@gmail.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-12-01 14:53:27.778581+00'),
('e6bd447e-50d0-418a-85ed-51be04b8c088', NULL, 'Empleado_ejercicio', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:32:53.9001+00'),
('e7348386-30e3-493d-9fdc-c5b725754913', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-25 05:18:20.230979+00'),
('e7e102d5-23f1-41ba-99fe-7121305e0ae1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:46:58.680323+00'),
('e836f7d5-bfaf-4ee9-af82-197c499d0e3f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 05:19:05.587535+00'),
('ea5f54a6-6598-4c68-8a10-940d95dffe3d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:23:36.367785+00'),
('ea69e7a9-27e3-4587-adae-ebd68d50a925', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:29:51.470648+00'),
('ecc616a6-f06e-46ae-ac33-fcddc5693b8d', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 15:04:52.698879+00'),
('ed102861-a4d3-488c-b731-fd075d471b57', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:40:37.483342+00'),
('edf4f6a1-4810-459c-891c-4926c91da4e8', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:41:19.012896+00'),
('ee0dafa5-c05c-410f-84bd-b15929b38bfb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-30 16:57:21.56513+00'),
('ee33b358-1700-4ec1-b57f-29c3ebf13900', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 11:38:47.05618+00'),
('ee8e6217-51e9-45a5-8fa0-457baa69691c', NULL, 'usuario_ejemplo ', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:23:05.16604+00'),
('ef3c6b2a-275a-471f-8140-57d4a8cee441', NULL, 'pedro@vacante.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 06:03:49.621225+00'),
('effb9897-1e02-4d24-8446-f17f7936ed99', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:53:37.571506+00'),
('f041ce1c-e468-471d-8d3d-7107b9c0ed9e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 06:33:19.472651+00'),
('f0ca8080-6902-4133-b77a-33c2115880eb', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:53:00.277537+00'),
('f47ba0e6-9131-46a4-98b3-e52e1e65fa3c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-12-01 14:54:20.759512+00'),
('f6f2a4bb-f5bc-4403-bcc7-9bae7dec1242', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-29 22:17:48.072564+00'),
('f8eb99c8-5701-4d0a-87e7-1c145231b7d3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:56:20.605251+00'),
('f9590253-6b98-4bf3-9ef1-f2fa7b2a5d4d', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-26 00:10:45.086164+00'),
('f9de1d91-727d-4add-80c1-cbbaefcfbdb4', 'df2c0217-fa38-43d0-83a2-3fe440db6678', 'fer.ruiz@dev.io', 'signup', NULL, NULL, 't', NULL, '2025-12-02 03:52:15.894323+00'),
('fe577ada-5aa6-455e-82de-d07f7c7c4a58', NULL, 'Cesar', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-12-01 14:51:35.642162+00'),
('feb8d3ba-92bd-46eb-99de-9d3f3e3e70fe', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:42:37.475772+00'),
('ff2b4f36-3f3a-421e-ad6a-669e01b11583', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-28 03:29:32.128528+00');



INSERT INTO "public"."despidos" ("id", "employee_id", "tipo_despido", "motivo", "fecha_despido", "estado", "indemnizacion", "liquidacion_final", "observaciones", "created_by", "created_at", "updated_at") VALUES
('7f9b4f38-ac60-492f-b634-5f3281c14f36', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'voluntario', 'faltas no justificadas ', '2025-11-27', 'en_proceso', 500000, 600000, 'por demasiadas faltas ', NULL, '2025-11-27 14:47:45.423259+00', '2025-11-27 14:47:45.423259+00'),
('983214ae-1583-44a8-86da-06d210e941cb', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'voluntario', 'dededededdsdsd', '2025-11-26', 'cancelado', NULL, NULL, NULL, NULL, '2025-11-26 10:04:41.277951+00', '2025-11-26 10:04:41.277951+00'),
('e6cc371b-7602-4ae7-8ce1-10ba323a5bb9', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'mutuo_acuerdo', 'El empleado ha decidido buscar nuevas oportunidades.', '2025-11-30', 'completado', 90000, NULL, 'No volver a contratar jamas.', NULL, '2025-12-01 04:11:26.804747+00', '2025-12-01 04:11:26.804747+00');
INSERT INTO "public"."incidents" ("id", "title", "description", "incident_type", "severity", "location", "status", "reported_by", "assigned_to", "resolution", "resolved_at", "file_paths", "created_at", "updated_at") VALUES
('06a5062c-58c2-4c09-8c9c-a8c298ed7127', 'oficina22', 'las PC no estan conectadas', 'falta_justificada', 'alta', 'morelia', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', NULL, NULL, NULL, '2025-11-27 14:41:50.355964+00', '2025-11-27 14:41:50.355964+00'),
('63e79ae2-2580-4a0f-8733-6511f96b7b8f', 'Oficinas', 'Entrega de papeleos', 'permiso_laboral', 'media', 'Cuautla', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', NULL, NULL, NULL, '2025-11-26 15:00:30.878846+00', '2025-11-26 15:00:30.878846+00'),
('904f437f-93cd-4bb2-b995-4d69f682f4a6', 'incidencia de prueba', 'prueba incidencia 1', 'falta_injustificada', 'baja', '', 'abierto', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', NULL, NULL, '{incidencias/2b6bf737-380a-48e7-8f2c-5d6422d6e032/1764599904022-Discurso.pdf}', '2025-12-01 14:38:39.326962+00', '2025-12-01 14:38:39.326962+00'),
('b404df5f-9563-4c76-8cd0-fa14730e8e83', 'Tardanza recurrente - Uriel Francisco', 'Empleado llegó tarde. Ver registro de asistencia del 27/11', 'falta_injustificada', 'media', 'Ciudad de México', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '26edb037-5f42-40f3-9067-6da8aafa4acd', NULL, NULL, NULL, '2025-11-28 05:44:21.45006+00', '2025-11-28 05:44:21.45006+00'),
('e8b4bc75-7fb0-446e-8d23-c0a56ac10760', 'Justificacion de ausencia.', 'El empleado demostro que tuvo un percance durante su trayecto a su área de trabajo', 'falta_justificada', 'baja', '', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', NULL, NULL, NULL, '2025-12-01 04:06:04.376637+00', '2025-12-01 04:06:04.376637+00');
INSERT INTO "public"."documents" ("id", "title", "category", "description", "file_path", "file_size", "mime_type", "uploaded_by", "employee_id", "is_public", "estado", "motivo_rechazo", "tags", "version", "created_at", "updated_at") VALUES
('022d9ced-fe5b-4661-8977-7538f15b213b', 'Contrato Laboral - CNT-849130-godm', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', 'c2cff6db-9b29-40d0-8b06-798d406d17a6/CNT-849130-godm.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'f', 'validado', NULL, NULL, 1, '2025-12-01 14:36:02.877027+00', '2025-12-01 14:36:02.877027+00'),
('02794abd-bf69-4b82-a9e4-2d22ac038429', 'Contrato', 'contrato', 'Contrato laboral ', 'general/579okpsv0x.docx', NULL, NULL, '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 'f', 'pendiente', NULL, NULL, 1, '2025-12-01 15:18:26.215889+00', '2025-12-01 15:18:26.215889+00'),
('09971398-7344-486e-8f5c-7b5e15bd7fd7', 'Contrato Laboral - CNT-386409-8oav', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b/CNT-386409-8oav.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'f', 'validado', NULL, NULL, 1, '2025-12-01 03:06:27.67348+00', '2025-12-01 03:06:27.67348+00'),
('0ccbf346-b653-4016-ba92-7bcc416acfc1', 'Contrato', 'otro', 'Contrato de Cesar Navarrete', 'general/xmbkzhaugle.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', 't', 'validado', NULL, '{rrhh,contrato,01/12/2025}', 1, '2025-12-01 14:37:38.498044+00', '2025-12-01 14:42:14.659+00'),
('1147315c-8e41-4a0f-9df1-ba836b93f236', 'Contrato Laboral - CNT-283939-1f11', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '70b537f6-db5e-48d3-86ee-7a280655aba5/CNT-283939-1f11.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'f', 'validado', NULL, NULL, 1, '2025-11-27 14:54:33.398814+00', '2025-11-27 14:54:33.398814+00'),
('158df3a3-9636-410a-8f50-4756f82c4436', 'Contrato Laboral - CNT-463501-8zva', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d/CNT-463501-8zva.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'f', 'validado', NULL, NULL, 1, '2025-12-01 16:10:59.971521+00', '2025-12-01 16:10:59.971521+00'),
('1a18589b-7948-480e-b53f-fe393b23138b', 'Vacaciones Aprobadas: Emmanuel Saliff', 'Recursos Humanos', 'Solicitud del 18/12/2025 al 21/12/2025.', 'error/logs/052a3cfb-23f2-455d-9b62-539f8ddda03d', 0, 'application/pdf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'f', 'validado', NULL, NULL, 1, '2025-12-02 07:02:33.816313+00', '2025-12-02 07:02:33.816313+00'),
('24a24da3-33b4-41f1-8514-0bf9ca910d5e', 'word - Arreglado', 'identificacion', 'word - Arreglado', 'general/u55ow816k7t.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 't', 'pendiente', NULL, '{rrhh,CVV,2025}', 2, '2025-11-27 14:23:19.629106+00', '2025-11-27 14:23:19.629106+00'),
('2a55c80e-62ab-4726-b9b3-fc1b2e994d8c', 'Crup', 'certificado', 'archivo pdf de curp del personal', 'general/5t5mccxmdpw.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 't', 'rechazado', 'No presento los documentos como se le solicitaron - formato erroneo', '{rrhh}', 1, '2025-11-26 15:07:13.389213+00', '2025-11-27 05:48:07.032+00'),
('35e65055-00c3-4b17-bc38-fdd23b6b0671', 'Vacaciones Rechazadas: Barco Hernandez', 'Recursos Humanos', 'Solicitud del 23/12/2025 al 26/12/2025.', 'error/logs/65392d90-7dd3-4415-ae4c-843ae48e9d26', 0, 'application/pdf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'f', 'rechazado', NULL, NULL, 1, '2025-12-02 07:10:38.097038+00', '2025-12-02 07:10:38.097038+00'),
('36a7e601-b3f0-4f39-9f1b-4c5be49313ce', 'INE', 'identificacion', 'INE', 'general/5ub7nvosp5o.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 't', 'validado', NULL, '{rrhh,INE,2025}', 2, '2025-11-26 00:41:44.623424+00', '2025-11-26 00:43:25.339+00'),
('409be497-acd3-4b86-bde5-2513030e4f97', 'Contrato Laboral - CNT-637559-w8m2', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d/CNT-637559-w8m2.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'f', 'validado', NULL, NULL, 1, '2025-11-27 05:50:43.202964+00', '2025-11-27 05:50:43.202964+00'),
('93ea0fa9-249a-4b30-9522-e92cd0b6fb31', 'Contrato Laboral - CNT-546718-sa3c', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c/CNT-546718-sa3c.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'f', 'validado', NULL, NULL, 1, '2025-11-28 06:49:15.231765+00', '2025-11-28 06:49:15.231765+00'),
('a1ec5c60-fc08-4ec5-b7e8-90926fc4e286', 'Vacaciones Aprobadas: Usuario Desconocido', 'Recursos Humanos', 'Solicitud del 17/12/2025 al 18/12/2025.', 'error/logs/82338aa0-7547-4621-9bc2-bb3cc23c73c5', 0, 'application/pdf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'f', 'validado', NULL, NULL, 1, '2025-12-02 05:04:03.654134+00', '2025-12-02 05:04:03.654134+00'),
('a431f564-27ba-444d-bb58-ac81934abd30', 'Contrato Laboral - CNT-294865-zczp', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '26edb037-5f42-40f3-9067-6da8aafa4acd/CNT-294865-zczp.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'f', 'validado', NULL, NULL, 1, '2025-11-27 14:21:24.348278+00', '2025-11-27 14:21:24.348278+00'),
('ada5d167-92e2-4baa-9c50-5a9007db17b0', 'Vacaciones Aprobadas: Irvin Sahi Sedeño Trujillo', 'Recursos Humanos', 'Solicitud del 17/12/2025 al 19/12/2025.', 'error/logs/85d4a16d-2dd8-4484-8c71-7cbafc056efe', 0, 'application/pdf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'f', 'validado', NULL, NULL, 1, '2025-12-02 06:48:26.958085+00', '2025-12-02 06:48:26.958085+00'),
('c8a6aab6-f068-433a-8bc3-d0775a3460ab', 'Contrato Laboral - CNT - 894714 - h4rl', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89/CNT - 894714 - h4rl.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', 'validado', NULL, NULL, 1, '2025-12-02 07:01:36.512611+00', '2025-12-02 07:01:36.512611+00'),
('e4bcc609-f927-40e9-a83f-47dd7d664d03', 'Contrato Laboral - CNT-987064-9ao0', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b/CNT-987064-9ao0.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'f', 'validado', NULL, NULL, 1, '2025-12-01 16:03:03.964971+00', '2025-12-01 16:03:03.964971+00'),
('f30eff7b-3121-4161-a66d-cd5e555d4181', 'Vacaciones Aprobadas: Usuario Desconocido', 'Recursos Humanos', 'Solicitud del 20/12/2025 al 21/12/2025.', 'error/logs/212fcd8e-9e9b-4583-94d7-eff9cfd805a2', 0, 'application/pdf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'f', 'validado', NULL, NULL, 1, '2025-12-02 05:16:11.330247+00', '2025-12-02 05:16:11.330247+00'),
('fbe1c818-8cb4-408c-a098-3531af9a7ae8', 'Vacaciones Aprobadas: Arizbeth Cabrera Mz', 'Recursos Humanos', 'Solicitud del 23/12/2025 al 25/12/2025.', 'error/logs/91fb9c2d-1424-4bcb-b175-63520a48f13d', 0, 'application/pdf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'f', 'validado', NULL, NULL, 1, '2025-12-02 07:12:36.845475+00', '2025-12-02 07:12:36.845475+00');
INSERT INTO "public"."inventory_items" ("id", "name", "category", "description", "stock_quantity", "min_stock", "unit_price", "location", "status", "created_at", "updated_at") VALUES
('061e37da-835d-4c0d-b8d8-23e680256ca3', 'Martillo De Bola 16oz', 'herramientas', 'Martillo de bola profesional 16 onzas, mango de fibra de vidrio', 45, 10, 185.50, 'Almacén A - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('06957b7d-413c-4baa-84ae-23e9ad1cbd97', 'Grabadora De Voz', 'otros', 'Grabadora de voz digital, 8GB, 100 horas de grabación', 12, 3, 650.00, 'Almacén J - Estante 14', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('06e9a8ed-bf89-4b96-8b1a-6511a4801981', 'Protector Auditivo Copa', 'epp', 'Protectores auditivos tipo copa, atenuación 28dB', 120, 25, 210.00, 'Almacén D - Estante 7', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('09dff683-ddee-4c7a-89a8-af9f8eeed79e', 'Manta Ignífuga 1.8x1.8m', 'epp', 'Manta ignífuga para apagar incendios personas, 1.8x1.8m', 12, 3, 450.00, 'Almacén D - Estante 15', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('0a3bda02-44ee-453e-9da2-c7c163deffbc', 'Cincel Punta 3/4"', 'herramientas', 'Cincel de acero templado, punta de 3/4", mango de goma', 65, 15, 85.00, 'Almacén A - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('0d7c8fd7-ef16-4434-abc0-728bfe7351a5', 'Llave Ajustable 10"', 'herramientas', 'Llave ajustable cromada 10 pulgadas, capacidad hasta 1"', 35, 8, 220.00, 'Almacén A - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('0ddd0c5a-9dfd-41a0-afa8-40414970486e', 'Foco Led 20w', 'insumos', 'Foco LED equivalente a 150W, luz día, rosca E27', 200, 40, 85.00, 'Almacén H - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('0e16107e-637f-49f4-91bb-3fa3550821bb', 'Botas De Seguridad Punta Acero', 'epp', 'Botas de seguridad, punta de acero, suela antideslizante', 75, 15, 680.00, 'Almacén D - Estante 6', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('12d4b10c-6f6c-41c9-9b9b-1c3c39eaa3cd', 'Rotomartillo Sds Plus', 'herramientas', 'Rotomartillo 1500W, SDS Plus, función martillo y percutor', 4, 1, 4200.00, 'Almacén B - Estante 1', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('134dc2e5-ffe9-4feb-aedd-6d6deafdc485', 'Respirador N95', 'epp', 'Respirador desechable N95, con válvula de exhalación', 800, 200, 35.00, 'Almacén D - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('1685d3e3-0319-4706-af45-5ccda85e9f40', 'Gato Hidráulico 3 Ton', 'herramientas', 'Gato hidráulico de botella, capacidad 3 toneladas', 5, 2, 980.00, 'Almacén B - Estante 5', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('19859b4a-c63a-47c3-816e-e2e6456b6982', 'Tornillo Para Madera 2-1/2"', 'insumos', 'Tornillo para madera cabeza plana, 2-1/2", caja x100', 250, 50, 120.00, 'Almacén G - Estante 16', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('1a437204-82c4-4f1e-8037-66f99c77a7cd', 'Batería 9v Alcalina', 'insumos', 'Batería alcalina 9V, para detectores de humo y equipos', 300, 50, 35.00, 'Almacén H - Estante 7', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('1b54ba61-644a-4f43-926b-58c61a83d85b', 'Nivel Láser 360°', 'herramientas', 'Nivel láser autonivelante, alcance 30m, trípode incluido', 6, 2, 2750.00, 'Almacén B - Estante 3', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('1fa1a090-4070-49ff-8c14-40d1127be828', 'Tubo Fluorescente T8 4ft', 'insumos', 'Tubo fluorescente T8 4 pies, 32W, luz día', 90, 20, 45.00, 'Almacén H - Estante 6', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('20810b3a-1e08-4b38-b20b-99a0f3e8c890', 'Arena Silica M3', 'insumos', 'Arena silica lavada, grano medio, por metro cúbico', 25, 5, 450.00, 'Almacén G - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('20c0c16c-5e8e-44ba-862a-80dc301f698f', 'Juego De Dados 1/2"', 'herramientas', 'Juego de 32 dados de 1/2", de 8 a 24mm, estuche metálico', 22, 6, 1250.00, 'Almacén A - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('20efb434-938a-43b8-9624-ad2c92e4f0f1', 'Botas De Seguridad Talla 28', 'epp', 'Botas de seguridad punta acero, talla 28 (talla más solicitada)', 8, 50, 680.00, 'Almacén D - Estante 6', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('21665c93-3d1c-43e8-94c6-fca3a0c283d5', 'Cinta Métrica 8m', 'herramientas', 'Cinta métrica de 8 metros, cinta metálica, bloqueo automático', 85, 20, 95.00, 'Almacén A - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('21ac9ced-43cc-4235-9755-d6358407bb96', 'Kit De Primeros Auxilios Básico', 'epp', 'Kit básico de primeros auxilios, incluye vendas, gasas, antisépticos', 25, 5, 450.00, 'Almacén D - Estante 10', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('26441745-3339-42a4-b9f1-24cbd760e89e', 'Kit De Limpieza Industrial', 'otros', 'Kit con escobas, recogedores, cubeta y trapeador', 25, 5, 450.00, 'Almacén J - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('27e5702d-72ce-4995-bf4d-2fcec048e935', 'Grasa Multipropósito 400g', 'insumos', 'Grasa lubricante multipropósito, tubo 400g', 65, 15, 85.00, 'Almacén H - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('2830d349-38ff-4d73-b8f8-e4244da1cd78', 'Cartucho De Silicón 310ml', 'insumos', 'Cartucho de silicón neutro, 310ml, para pistola estándar', 180, 30, 45.00, 'Almacén G - Estante 13', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('2a3af6ff-b212-4c8b-9d11-fff76943b8bb', 'Señal De Advertencia', 'otros', 'Señal de advertencia piso mojado, base de goma', 50, 10, 85.00, 'Almacén J - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('2ad22db1-73da-4521-8e6d-737df63ecb51', 'Taladro Percutor 1/2"', 'herramientas', 'Taladro percutor de 750W, velocidad variable, maletín incluido', 12, 3, 1850.00, 'Almacén B - Estante 1', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('2fb85bb4-3e14-498b-b6c5-7aa278668a71', 'Manga De Protección Solar', 'uniformes', 'Manga para protección UV, tejido ligero, talla única', 85, 20, 45.00, 'Almacén I - Estante 9', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('32d6e26f-5df9-43e2-af16-06d28d999d4d', 'Andamio Tubular 2x1m', 'equipos', 'Andamio tubular de acero, marco 2x1m, incluye ruedas', 8, 2, 2850.00, 'Almacén E - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('33354de9-90a4-4570-bb3a-c947470f0b1f', 'Cable Thw Calibre 14', 'insumos', 'Cable THW calibre 14, color rojo, rollo 100m (últimos rollos)', 15, 80, 1250.00, 'Almacén H - Estante 1', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('33e09ba1-217a-4cb0-a707-ad3161705788', 'Chamarra Ignífuga Talla L', 'uniformes', 'Chamarra resistente al fuego, material aramida, talla grande', 25, 5, 1250.00, 'Almacén I - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('352adaa0-eed2-428c-b83b-bbd79129f26e', 'Camisa De Trabajo Talla L', 'uniformes', 'Camisa de mezclilla azul, mangas largas, talla grande (alta demanda)', 20, 100, 185.00, 'Almacén I - Estante 1', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('35864075-65be-4c76-a838-cfb0e0657796', 'Silla De Evacuación', 'epp', 'Silla de evacuación para escaleras, capacidad 150kg', 5, 1, 3200.00, 'Almacén D - Estante 14', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3815990d-9bd5-4e47-ad9e-93484e987be4', 'Solvente Mineral 1l', 'insumos', 'Solvente mineral para diluir pinturas y limpiar herramientas', 60, 12, 85.00, 'Almacén G - Estante 9', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('38f87b2a-bd2d-4580-b4d4-e90928575867', 'Chaleco Reflectante Clase 2', 'epp', 'Chaleco de seguridad reflectante, clase 2, tallas XL-XXL', 90, 20, 185.00, 'Almacén D - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3a6e586d-da87-42eb-8a9e-f98e6885367b', 'Cámara De Seguridad Ip', 'otros', 'Cámara de seguridad IP, visión nocturna, 1080p', 10, 2, 1250.00, 'Almacén J - Estante 13', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3af07fb0-2d08-4487-905f-1eaeaad24332', 'Cinta Canela 48mm X 50m', 'insumos', 'Cinta canela para empaque, 48mm x 50m, resistencia 60kg', 120, 25, 35.00, 'Almacén G - Estante 12', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3bba0547-a377-43dd-b49c-76fde4b7efdb', 'Extintor Co2 5kg', 'epp', 'Extintor de CO2 5kg, para fuegos clase B y C', 15, 3, 980.00, 'Almacén D - Estante 11', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3c17d05a-ae6f-439e-b354-16018ce62766', 'Cono De Seguridad 75cm', 'otros', 'Cono de seguridad naranja, 75cm de altura, base ponderada', 80, 15, 120.00, 'Almacén J - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3d2fd052-b990-461e-8e87-78a92e70261d', 'Escritorio Metálico 1.2m', 'otros', 'Escritorio metálico, 1.2x0.6m, altura ajustable', 8, 2, 1250.00, 'Almacén J - Estante 6', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3db2d63f-44db-4e85-ab74-d43e007184b5', 'Pistola De Silicona', 'herramientas', 'Pistola de silicona profesional, temperatura alta, gatillo suave', 28, 7, 150.00, 'Almacén A - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3ebda68e-88cc-4411-b913-ce7db5559c5b', 'Interruptor Sencillo', 'insumos', 'Interruptor sencillo de pared, color blanco, 15A 120V', 150, 30, 25.00, 'Almacén H - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('3ec109a5-b5e1-448f-9e5b-3d7e6cce6779', 'Pantalón De Trabajo Talla 32', 'uniformes', 'Pantalón de mezclilla, refuerzo en rodillas, talla 32', 60, 12, 220.00, 'Almacén I - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('40e4d52c-dfa8-4f10-b8e3-33845649ce28', 'Soldadora Inversora 200a', 'equipos', 'Soldadora inversora MIG/MAG 200A, alimentación 220V', 5, 1, 8900.00, 'Almacén E - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('41458d44-a8ef-4af6-8f9d-51d295a63857', 'Pantalón De Trabajo Talla 34', 'uniformes', 'Pantalón de trabajo color caqui, refuerzo en rodillas, talla 34', 15, 80, 220.00, 'Almacén I - Estante 2', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('418750ef-3725-4fc9-800c-4084d822e461', 'Guantes De Nitrilo Talla M', 'epp', 'Guantes desechables de nitrilo, talla mediana, caja x100', 500, 100, 120.00, 'Almacén D - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('4231bd01-d980-4608-8149-76868ab34f79', 'Cortadora De Azulejo', 'herramientas', 'Cortadora de azulejo manual, capacidad hasta 60cm', 15, 4, 670.00, 'Almacén A - Estante 6', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('43f6a78f-fe60-4096-bee5-0d580a0459fe', 'Martillo Demoledor 30kg', 'equipos', 'Martillo demoledor eléctrico, 30kg, 1500W, 220V', 4, 1, 12800.00, 'Almacén E - Estante 11', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('44867f2e-18e8-40a3-af69-9308eda5d975', 'Gorra De Seguridad', 'uniformes', 'Gorra de seguridad con protección UV, ajustable', 120, 25, 65.00, 'Almacén I - Estante 7', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('448df6fa-c844-40a0-8cd8-8c9d3c53814d', 'Impermeable Amarillo Talla L', 'uniformes', 'Impermeable de PVC, color amarillo, talla grande', 25, 5, 180.00, 'Almacén I - Estante 14', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('4548a8c7-18c6-4780-8aed-7e187493f377', 'Generador Eléctrico 5kw', 'equipos', 'Generador a gasolina 5kW, 120/240V, motor OHV', 4, 1, 12500.00, 'Almacén E - Estante 3', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('45c25d22-6ccf-49be-8c16-cd50fa82d3e2', 'Casco De Seguridad Clase E', 'epp', 'Casco de polietileno, clase E (eléctrico), ajustable', 175, 30, 185.00, 'Almacén D - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:45:52.081698+00'),
('4ad63ec4-0fae-4a7c-8d15-c3347c4a70c0', 'Zapato Dieléctrico', 'epp', 'Zapato de seguridad dieléctrico, puntera compuesta, 18kV', 28, 6, 890.00, 'Almacén D - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('4ce18b2d-a802-4e67-b98b-941b41050a6e', 'Pulidora De Concreto 15hp', 'equipos', 'Pulidora de concreto planetaria, 15HP, tres cabezales', 2, 1, 32000.00, 'Almacén E - Estante 10', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('4ef46504-6fd1-4a05-9d21-2e0ae491e98e', 'Pistola De Calor 2000w', 'herramientas', 'Pistola de calor profesional, temperatura ajustable 50-650°C', 10, 3, 1200.00, 'Almacén B - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('521ddec8-2faa-464e-84d6-7666d7858326', 'Fresadora Vertical', 'equipos', 'Fresadora vertical, mesa 9x42", motor 3HP, velocidad variable', 2, 1, 95000.00, 'Almacén F - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('5354c926-7a93-4308-b34d-5db5badf0eab', 'Polera De Algodón Talla Xl', 'uniformes', 'Polera de algodón 100%, color azul, talla extra grande', 90, 20, 85.00, 'Almacén I - Estante 12', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('5617bbad-2ee6-401d-a6b8-3f3d70ca0696', 'Compresor De Aire 25l', 'equipos', 'Compresor de aire 25 litros, 2HP, presión máxima 8 bar', 6, 2, 3800.00, 'Almacén E - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('56c5617b-02cd-41cd-80d8-3d59c74bf4d3', 'Botas De Hule Talla 28', 'uniformes', 'Botas de hule industriales, puntera de acero, talla 28', 35, 7, 320.00, 'Almacén I - Estante 6', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('5bca1206-7ba8-4b26-9ede-344b62271811', 'Vibrador Para Concreto 1.5"', 'equipos', 'Vibrador de concreto eléctrico, aguja de 1.5", 1.5HP', 7, 2, 4500.00, 'Almacén E - Estante 7', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('5c55c464-267d-42f2-a59d-ed51892f41b7', 'Bomba De Agua Sumergible 1hp', 'herramientas', 'Bomba sumergible para achique, 1HP, capacidad 200L/min', 3, 1, 3800.00, 'Almacén B - Estante 5', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('5cbe20d5-b191-459a-9342-57cba98bf23b', 'Delantal De Cuero Soldador', 'epp', 'Delantal de cuero para protección contra chispas y salpicaduras', 22, 6, 450.00, 'Almacén D - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('629acde5-51a7-41d8-a607-5f29d06a4c2a', 'Bomba Sumergible 5hp', 'equipos', 'Bomba sumergible para aguas residuales 5HP, diámetro 4"', 5, 1, 12500.00, 'Almacén E - Estante 17', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('63b33f1c-d53d-4616-ae30-d36c79318c0d', 'Sierra De Calar 800w', 'herramientas', 'Sierra de calar velocidad variable, sistema de cambio rápido de hojas', 7, 2, 1650.00, 'Almacén B - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('63cca3b6-3d0d-46e9-a2ca-18863d317752', 'Juego De Llaves Mixtas', 'herramientas', 'Juego de 12 llaves mixtas de 6 a 19mm, estuche plástico', 25, 5, 450.00, 'Almacén A - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('646c3749-dadf-4aba-856f-cb765f70cf20', 'Cinta De Señalización 50mm', 'epp', 'Cinta de peligro/peligro, 50mm x 45m, color amarillo/negro', 60, 12, 85.00, 'Almacén D - Estante 10', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('68193954-ac68-4d73-a8cf-2e666b8e9240', 'Tubería Galvanizada 1"', 'insumos', 'Tubería galvanizada pesada 1", 6 metros', 75, 15, 450.00, 'Almacén G - Estante 20', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('68e0a384-8385-4857-b1f2-af19bcaa8b90', 'Mascarilla Facial Completa', 'epp', 'Mascarilla facial para vapores orgánicos, cartucho incluido', 30, 8, 890.00, 'Almacén D - Estante 9', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('6b0ccab5-9ec6-4f0c-aff2-92790f964050', 'Torno Para Metal 1m', 'equipos', 'Torno paralelo para metal, distancia entre puntos 1m', 2, 1, 85000.00, 'Almacén F - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('6e09ce19-65e6-4b5b-a126-c9165090ed47', 'Grava 3/4" M3', 'insumos', 'Grava triturada 3/4", por metro cúbico', 20, 5, 520.00, 'Almacén G - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('6efee5f9-d2d3-4a22-9445-81fca129d9d6', 'Moto Conformadora 2.5hp', 'equipos', 'Moto conformadora de gasolina, ancho 10", profundidad 4"', 4, 1, 12500.00, 'Almacén E - Estante 15', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('6f7cf127-f4eb-491a-993b-3da3630ddffd', 'Lijadora Orbital 125mm', 'herramientas', 'Lijadora orbital, velocidad variable, sistema de extracción de polvo', 9, 3, 1350.00, 'Almacén B - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('70ae7814-4dd4-4885-a0f2-d83240853be0', 'Multímetro Digital', 'herramientas', 'Multímetro True RMS, medición de tensión, corriente y resistencia', 18, 4, 890.00, 'Almacén C - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('71109be6-293e-41b1-90d2-1121d88f3cb7', 'Overol De Mezclilla Talla M', 'uniformes', 'Overol de mezclilla, una pieza, varios bolsillos, talla M', 40, 8, 350.00, 'Almacén I - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('75722b91-064a-4ef9-b765-48abd20a931d', 'Cortadora De Piso 14"', 'equipos', 'Cortadora de piso de gasolina, disco de 14", motor 15HP', 3, 1, 18500.00, 'Almacén E - Estante 9', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('778d5334-0a15-417f-b544-1492741723d6', 'Foco Led 9w', 'insumos', 'Foco LED equivalente a 75W, luz cálida, rosca E27, paquete x10', 45, 200, 650.00, 'Almacén H - Estante 5', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('790822ec-aa78-4e98-b8bd-e034e5f884c6', 'Termómetro Infrarrojo', 'otros', 'Termómetro infrarrojo sin contacto, rango -50°C a 550°C', 15, 3, 850.00, 'Almacén J - Estante 11', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('7ad4b688-f366-4630-87b8-4cd38859d2ac', 'Chaleco De Seguridad Clase 3', 'uniformes', 'Chaleco de alta visibilidad clase 3, con bandas reflectantes', 45, 10, 280.00, 'Almacén I - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('7bf4ac7c-be1b-4799-85f0-7e5be5f2c4f6', 'Alicates De Corte Diagonal', 'herramientas', 'Alicates de corte diagonal 7", mango aislado 1000V', 40, 10, 180.00, 'Almacén A - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('7dfd43bc-7da7-4cd7-a9fc-287eb15e2874', 'Pantalón Cargo Talla 34', 'uniformes', 'Pantalón cargo tela drill, múltiples bolsillos, talla 34', 40, 8, 250.00, 'Almacén I - Estante 13', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('7e4f64c5-69e7-480f-8563-c58f0b770054', 'Escuadra Combinada', 'herramientas', 'Escuadra combinada de acero inoxidable, 300mm', 30, 8, 210.00, 'Almacén A - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('7f37f68c-fff3-4ded-a005-677deb75419c', 'Sierra Circular 7-1/4"', 'herramientas', 'Sierra circular con láser guía, potencia 1800W', 8, 2, 3200.00, 'Almacén B - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('81328b37-689c-4516-9ad8-0fd6a24f25e0', 'Guantes Dieléctricos Clase 00', 'epp', 'Guantes dieléctricos clase 00, prueba 500V AC', 12, 3, 1250.00, 'Almacén D - Estante 6', 'en_mantenimiento', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('8a1eeb13-649d-4ed5-bb1b-704d9a6e75b7', 'Manga Ignífuga', 'epp', 'Manga ignífuga para protección de brazos, material aramida', 35, 8, 380.00, 'Almacén D - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('8c44100b-94af-460e-acc2-47c9b694209f', 'Mascarilla Quirúrgica', 'epp', 'Mascarilla quirúrgica desechable, caja x50 unidades, triple capa', 80, 300, 120.00, 'Almacén D - Estante 4', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('8edfd7ff-9cf9-4ca1-9adf-fb02d37f0d1a', 'Silla De Oficina Ergonómica', 'otros', 'Silla ergonómica, respaldo alto, brazos ajustables', 12, 3, 1850.00, 'Almacén J - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('8f5f9f8e-f181-4154-bcff-3f7f404fd782', 'Varilla Corrugada 3/8"', 'insumos', 'Varilla corrugada 3/8", grado 42, 12 metros', 200, 40, 95.00, 'Almacén G - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('91f2aa42-233f-47e5-ba2c-7adc260bad9e', 'Válvula De Compuerta 3/4"', 'insumos', 'Válvula de compuerta bronce, 3/4", rosca NPT', 35, 8, 320.00, 'Almacén G - Estante 22', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('920320d0-ebe2-4324-8f33-3b0eb16a8f8e', 'Camisa De Trabajo Talla M', 'uniformes', 'Camisa de mezclilla, mangas largas, bolsillos, talla mediana', 75, 15, 185.00, 'Almacén I - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('924f4628-3ef5-4d3b-8c52-8b2e5e88fa8d', 'Higrómetro Digital', 'otros', 'Higrómetro digital para medición de humedad relativa', 18, 4, 450.00, 'Almacén J - Estante 12', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('92e9a89d-c41d-47d4-bca3-f4980266530b', 'Cortadora De Plasma 40a', 'equipos', 'Cortadora de plasma 40A, corte hasta 12mm, 220V', 3, 1, 15200.00, 'Almacén E - Estante 5', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('94dc3164-6524-423c-a72f-d14fdde11db5', 'Calculadora Científica', 'otros', 'Calculadora científica con funciones avanzadas, pantalla LCD', 25, 5, 320.00, 'Almacén J - Estante 10', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('96540de3-ddef-41df-867e-1960b589adc2', 'Arnés De Seguridad Tipo 3', 'epp', 'Arnés de cuerpo completo tipo 3, anillos D frontales y laterales', 45, 10, 1250.00, 'Almacén D - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('97bca2e2-375c-49cb-ade9-7f80b358af54', 'Pañuelo Para Cuello', 'uniformes', 'Pañuelo multifuncional para protección contra polvo y sol', 200, 40, 25.00, 'Almacén I - Estante 10', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('988e0813-2b30-443a-a3c8-bc2fe46fb9e9', 'Compactador De Placa 6.5hp', 'equipos', 'Compactador de placa, 6.5HP, fuerza de compactación 18kN', 3, 1, 18500.00, 'Almacén E - Estante 16', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('98bffc8b-54ff-4963-b785-e23d8078d9a9', 'Lija Para Metal #120', 'insumos', 'Lija para metal grano 120, paquete de 10 hojas 9x11"', 80, 15, 95.00, 'Almacén G - Estante 15', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('98fb26e5-4ef4-41f3-8c38-e77b380e483c', 'Archivador De 2 Cajones', 'otros', 'Archivador metálico, 2 cajones, llave incluida', 10, 2, 980.00, 'Almacén J - Estante 7', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('9e5a35a8-d203-4c0b-8324-4ae4878e09b3', 'Lija Para Madera #80', 'insumos', 'Lija para madera grano 80, paquete de 10 hojas 9x11"', 95, 20, 85.00, 'Almacén G - Estante 14', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('a1acbca2-c36e-4df8-a4d6-168b7f03d1ac', 'Brocha De Cerda 4"', 'insumos', 'Brocha de cerda natural, ancho 4 pulgadas, mango de madera', 75, 15, 45.00, 'Almacén G - Estante 10', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('a4e2e31c-23fc-4d4f-b862-0f057119cc07', 'Tornillo Para Madera 3"', 'insumos', 'Tornillo para madera cabeza Phillips, 3 pulgadas, caja x100', 40, 200, 150.00, 'Almacén G - Estante 16', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('aae7f5dd-7f48-4bf4-8a4f-36238b7b907d', 'Mazo De Goma 2kg', 'herramientas', 'Mazo de goma de 2kg, cabeza recubierta, mango de madera', 20, 5, 320.00, 'Almacén A - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('adacca32-c899-4d3e-b7f4-afecd8dabf60', 'Destornillador Phillips #2', 'herramientas', 'Destornillador Phillips de 6 pulgadas, punta magnetizada', 120, 30, 65.00, 'Almacén A - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('af6bceb5-4771-4735-a44f-1ffe2fcd3105', 'Clavo Para Concreto 2"', 'insumos', 'Clavo para concreto cabeza hongo, 2", caja 1kg', 150, 30, 85.00, 'Almacén G - Estante 19', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b19a121a-6115-439e-8eb8-91db94625524', 'Codo Pvc 90° 1/2"', 'insumos', 'Codo de PVC presión 90°, 1/2"', 200, 40, 8.50, 'Almacén G - Estante 21', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b2f0a0f2-05c8-42ce-a9a6-10b743e1c6a7', 'Pintura Vinílica 4l', 'insumos', 'Pintura vinílica blanca, acabado mate, cubeta 4 litros', 45, 10, 320.00, 'Almacén G - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b35b7a6b-e507-4590-a686-233d8bb4d2bf', 'Hidrolavadora 2000psi', 'equipos', 'Hidrolavadora eléctrica, 2000 PSI, 5.5L/min, 220V', 9, 2, 4200.00, 'Almacén E - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b3bb83bd-570f-43c1-b4c5-5936f335a357', 'Bote Para Basura 120l', 'otros', 'Bote para basura industrial 120 litros, con ruedas', 15, 3, 450.00, 'Almacén J - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b4106e7f-1a83-4e1c-bc9f-5f896cfdfb11', 'Gafas De Seguridad Antiempañante', 'epp', 'Gafas de protección, lentes antiempañantes, protección UV', 200, 40, 95.00, 'Almacén D - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b43e858d-eeda-4b9c-9c57-d7375274c30e', 'Equipo De Oxicorte Portátil', 'equipos', 'Equipo de oxicorte portátil, incluye reguladores y antorcha', 5, 1, 7800.00, 'Almacén E - Estante 12', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('b9cd8f82-c52a-4166-81bf-168ab43a36e0', 'Overol Desechable Tyvek', 'epp', 'Overol desechable Tyvek, talla L, protección química limitada', 150, 30, 95.00, 'Almacén D - Estante 7', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c200d94d-a8f0-4448-bbae-8c4ccb1adebf', 'Tornillo Autoperforante #12', 'insumos', 'Tornillo autoperforante para lámina, #12 x 1", caja x100', 180, 35, 150.00, 'Almacén G - Estante 17', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c3a26ff7-c5e1-43da-a1a8-6d7440c48b39', 'Cargador De Baterías Industrial', 'equipos', 'Cargador de baterías 12/24V, 50A, carga rápida', 8, 2, 3200.00, 'Almacén E - Estante 14', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c3e878f4-1646-4825-99e0-9dcf2512d52c', 'Botín De Hule Industrial', 'epp', 'Botín de hule impermeable, suela antiderrapante, talla 26-30', 40, 10, 220.00, 'Almacén D - Estante 9', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c416ea74-ad62-4ddd-907c-0842d36f438b', 'Bomba De Concreto Eléctrica', 'equipos', 'Bomba para concreto, capacidad 30m³/h, motor 15HP', 2, 1, 85000.00, 'Almacén E - Estante 6', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c5e8f87a-b6d1-498f-bdf4-bdb52c975305', 'Máquina De Soldar Tig 250a', 'equipos', 'Soldadora TIG 250A, corriente DC, pulso, 220V trifásica', 3, 1, 18500.00, 'Almacén E - Estante 13', 'agotado', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c70b58b3-eb9f-4f88-b754-dc4d80f66b67', 'Caja Octagonal 4"', 'insumos', 'Caja octagonal metálica 4", con tapa, para instalaciones eléctricas', 120, 25, 35.00, 'Almacén H - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c7ddabd7-e9e8-49f5-863f-58339a9d0ebc', 'Protector Solar Spf 50', 'epp', 'Protector solar industrial SPF 50, resistente al agua, 250ml', 85, 20, 85.00, 'Almacén D - Estante 13', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('c94704fa-65ed-4981-9d23-9152424e01b9', 'Cinturón Portaherramientas', 'uniformes', 'Cinturón para herramientas, 5 bolsillos, ajustable', 55, 12, 185.00, 'Almacén I - Estante 11', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('caa2d4b3-af41-4025-86e7-939769fe284c', 'Lentes De Soldadura Autooscurecientes', 'epp', 'Lentes autooscurecientes para soldadura, grado de sombra 9-13', 25, 6, 1750.00, 'Almacén D - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('ce572c6f-5f09-4fa4-b5cb-349c0ce12fd8', 'Tubo Conduit 3/4"', 'insumos', 'Tubo conduit rígido galvanizado 3/4", 3 metros', 80, 15, 125.00, 'Almacén H - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('d644bb9b-25f5-460d-aeeb-d3e00e8fbefb', 'Rodillo De Lana 9"', 'insumos', 'Rodillo de lana para pintura, mango de aluminio, 9 pulgadas', 65, 15, 65.00, 'Almacén G - Estante 11', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('d7715256-b34d-4cd4-a27f-df217db4b94e', 'Bomba De Inflado 12v', 'herramientas', 'Bomba de aire para inflado rápido, 12V DC, presión hasta 150PSI', 8, 2, 750.00, 'Almacén C - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('d9088638-bd32-461d-99be-2ae90080d01b', 'Alarma De Gas Portátil', 'epp', 'Detector portátil de gases combustibles, pantalla digital', 8, 2, 2250.00, 'Almacén D - Estante 12', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('d931a42a-d78c-47fd-8435-b58fee06c12e', 'Alambre Recocido #18', 'insumos', 'Alambre recocido para amarre, calibre 18, rollo 1kg', 85, 20, 65.00, 'Almacén G - Estante 6', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('dbff2aea-0a0e-44bc-b673-b73ef7175836', 'Organizador De Herramientas', 'otros', 'Organizador de herramientas de 5 cajones, con ruedas', 8, 2, 1850.00, 'Almacén J - Estante 15', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('de351cb8-2bf1-4d6f-931b-3dc49d127d24', 'Ancla Química 300ml', 'insumos', 'Ancla química epóxica, cartucho 300ml, resistencia 500kg', 45, 10, 250.00, 'Almacén G - Estante 18', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('df16beda-ed74-46a7-a816-615b14490998', 'Guantes De Látex Talla M', 'epp', 'Guantes desechables de látex, caja x100 unidades, talla mediana', 30, 150, 95.00, 'Almacén D - Estante 3', 'agotado', '2025-12-02 02:45:52.081698+00', '2025-12-02 02:45:52.081698+00'),
('e00f13c5-f3dc-49df-a38d-81a6bc41f8a4', 'Pegazulejo 20kg', 'insumos', 'Adhesivo cerámico para interiores, bolsa 20kg', 90, 15, 185.00, 'Almacén G - Estante 7', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('e5b49105-b714-438d-bc18-e5bb830039b3', 'Cemento Portland 50kg', 'insumos', 'Cemento Portland gris tipo I, bolsa de 50kg', 175, 25, 185.00, 'Almacén G - Estante 2', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:45:52.081698+00'),
('e7ad4595-aa47-4591-a2fc-59dffacfc870', 'Protector Facial Soldador', 'epp', 'Careta para soldador, visor fijo, material resistente a chispas', 18, 5, 320.00, 'Almacén D - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('ebee5905-3f3b-4af4-9200-0971938b408e', 'Prensa Hidráulica 20 Ton', 'equipos', 'Prensa hidráulica 20 toneladas, carrera 200mm', 3, 1, 28500.00, 'Almacén F - Estante 3', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('ed28b6e0-f852-4960-b3c2-2c9e36faf226', 'Soplete Para Soldar', 'herramientas', 'Soplete para soldar estaño, gas butano, temperatura ajustable', 14, 4, 450.00, 'Almacén B - Estante 4', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('f244fb00-87dc-40f6-ad01-355bc639a758', 'Tornillo De Banco 5"', 'herramientas', 'Tornillo de banco de hierro fundido, mordazas de 5 pulgadas', 11, 3, 890.00, 'Almacén B - Estante 6', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('f2f4e0a3-58f9-4f04-9ca8-2105508c30e0', 'Tubo Pvc 1/2" X 6m', 'insumos', 'Tubo de PVC presión 1/2", 6 metros, clase 10', 300, 50, 45.00, 'Almacén G - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('f2fdf7c4-c226-441f-8236-a3d20a5f3d71', 'Tablero De Corcho 1x1m', 'otros', 'Tablero de corcho para notas, marco de aluminio, 1x1m', 20, 4, 450.00, 'Almacén J - Estante 9', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('f993dd18-74ef-4b75-b208-b4f4e75d6694', 'Guantes De Algodón Talla M', 'uniformes', 'Guantes de algodón con puño, protección ligera, talla mediana', 150, 30, 45.00, 'Almacén I - Estante 5', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('fb7890c5-4f97-401d-9484-0d9843f1720c', 'Guantes De Carnaza Talla L', 'epp', 'Guantes de carnaza para soldadura, talla grande', 55, 12, 240.00, 'Almacén D - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('fe2610e6-af11-4394-9881-d68e8b6390ec', 'Cable Thw Calibre 12', 'insumos', 'Cable THW calibre 12, color negro, rollo 100m', 25, 5, 1850.00, 'Almacén H - Estante 1', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('fe6463ba-60b1-4868-a0f8-fe1dce2d677c', 'Cubre Calzado Desechable', 'uniformes', 'Cubre calzado desechable, paquete de 10 pares', 150, 30, 45.00, 'Almacén I - Estante 15', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00'),
('ff29a46b-8af4-4cc8-b35f-363ed7b7b1be', 'Mesa De Trabajo 2x1m', 'otros', 'Mesa de trabajo metálica, superficie de madera, 2x1m', 6, 1, 1850.00, 'Almacén J - Estante 8', 'disponible', '2025-12-02 02:42:54.305734+00', '2025-12-02 02:42:54.305734+00');
INSERT INTO "public"."recruitment_positions" ("id", "title", "department", "location", "seniority", "description", "status", "hiring_manager", "work_start_time", "work_end_time", "created_by", "created_at", "updated_at") VALUES
('069e1491-fff0-41dd-be77-85fb3c434194', 'Desarrollador junior', 'Tecnología', 'Morelos', 'Junior', 'Desarrollador Junior', 'abierta', NULL, '08:00:00', '16:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 14:16:42.142615+00', '2025-11-27 14:16:42.142615+00'),
('12d9434d-0035-494f-927e-2e027860a15b', 'Limpieza', 'General', 'Acceso general', NULL, NULL, 'abierta', NULL, '05:00:00', '12:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 14:54:09.26973+00', '2025-11-25 14:54:09.26973+00'),
('4388f041-51aa-48b4-88df-817a3565b1e7', 'Desarollador FullStack Python', 'Tecnología', 'Área de Tecnología', 'Senior', NULL, 'abierta', NULL, '06:00:00', '14:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 01:51:04.303755+00', '2025-12-01 01:51:04.303755+00'),
('4c237d39-0d63-4f0a-a0cc-1a55c615be33', 'Admin', 'Contrataciones', 'cuautla', 'Junior', 'X', 'abierta', NULL, '10:46:00', '11:46:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:46:31.317996+00', '2025-12-01 14:46:31.317996+00'),
('4fe7b841-acc0-40ef-a3ff-f61cff35ef42', 'Ayudante de limpieza', 'Seguridad', 'cuautla', 'Junior', 'xxx', 'abierta', NULL, '10:51:00', '00:48:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:48:30.207995+00', '2025-12-01 14:48:30.207995+00'),
('5a9f8f37-5056-4436-a99f-2ebfdfb30e9a', 'Gerente', 'Vacaciones', 'cuautla', 'Lead', 'Ejemplo', 'abierta', NULL, '10:00:00', '16:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:45:19.408459+00', '2025-12-01 14:45:19.408459+00'),
('5c852dec-6110-4650-9f8e-04f33820272e', 'Desarollador Web', 'Tecnología', 'Sede 2', 'Junior', NULL, 'En proceso', NULL, '06:29:00', '07:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-26 14:40:19.379374+00', '2025-11-26 14:40:19.379374+00'),
('6208174a-33be-4100-8e12-41663fe1462b', 'area Bf3', 'Tecnología nivel 3', NULL, 'Sin experiencia', 'creada por el profe Becerro', 'En proceso', NULL, '02:33:00', '22:39:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:34:30.734785+00', '2025-12-01 14:34:30.734785+00'),
('7765701d-9080-4e60-82d6-fd35f9d1148c', 'Diseñador Gráfico', 'Marketing', 'Morelos', 'Lead', 'Creación de materiales visuales para campañas digitales e impresas.', 'abierta', NULL, '10:50:00', '21:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:51:01.809332+00', '2025-12-01 14:51:01.809332+00'),
('8fa92360-e962-434a-b336-3dd8bcad6b4e', 'contabilidad', 'Tecnología', 'Morelos', 'Junior', 'manejo de números', 'En proceso', NULL, '10:26:00', '10:24:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:21:05.039209+00', '2025-12-01 14:21:05.039209+00'),
('aa5b3be9-0e9d-4ac6-a651-c030d7bef543', 'Analista de datos', 'Tecnologia', 'Ciudad de Mexico', 'Semi Senior', 'Responsable de análisis de información y generación de reportes para la toma de decisiones.', 'abierta', NULL, '09:49:00', '20:50:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:50:13.381782+00', '2025-12-01 14:50:13.381782+00'),
('ad3748e5-b7a2-4b54-b60e-50ca3bf6090e', 'Gerente de Recursos Humanos', 'General', 'Ciudad de México', 'Senior', 'Urgente', 'abierta', NULL, '23:00:00', '19:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-28 04:37:26.153849+00', '2025-11-28 04:37:26.153849+00'),
('dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'Desarrollador Web', 'Tecnología', 'Sede 2', 'Junior', NULL, 'abierta', NULL, '06:29:00', '19:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-26 14:28:15.331785+00', '2025-11-26 14:28:15.331785+00');
INSERT INTO "public"."recruitment_applications" ("id", "candidate_id", "position_id", "status", "current_stage", "hiring_manager", "salary_expectation", "availability_date", "priority", "created_by", "created_at", "updated_at") VALUES
('06cd3658-6db1-4b52-a04f-35e41edac7cd', '33973f66-fc43-4cb0-b704-d9f9e3c9f78e', '5a9f8f37-5056-4436-a99f-2ebfdfb30e9a', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:58:31.874606+00', '2025-12-02 01:58:31.874606+00'),
('1ab0b135-376a-41c9-9abe-a581854a8783', '7a929992-ca46-4c09-9779-1bd418ac156f', '6208174a-33be-4100-8e12-41663fe1462b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-12-02 02:13:47.09745+00', '2025-12-02 02:13:47.09745+00'),
('1c028dbd-df46-487e-b46a-044dfaf13522', 'f132a8dc-114f-4620-bcea-ba0d2dd24aa8', '12d9434d-0035-494f-927e-2e027860a15b', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-11-26 04:53:29.195761+00', '2025-11-26 04:53:29.195761+00'),
('2a30107f-ea86-4b9b-bae3-dcf4801e70aa', '156ce631-6393-4bb2-9673-20322519f706', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 03:46:10.648591+00', '2025-11-27 03:46:10.648591+00'),
('2f6982d6-4d74-4cd7-8b16-06a71a5b9fd4', '47dd4e71-53fa-47f8-b65d-6ce02cec5e0c', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-25 19:55:21.542485+00', '2025-11-25 19:55:21.542485+00'),
('30609586-e978-4f7a-bd4b-e584acba8fb9', 'c4a47b28-78e7-4b87-ac90-e55fc95f7b21', '4c237d39-0d63-4f0a-a0cc-1a55c615be33', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:59:39.269865+00', '2025-12-02 01:59:39.269865+00'),
('4e83d8fe-7825-4af9-bac8-2175ac1d2736', '96aaa2d9-37f5-4a07-8635-251d807cbce3', '5c852dec-6110-4650-9f8e-04f33820272e', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 05:44:17.955592+00', '2025-11-27 05:44:17.955592+00'),
('6de2d068-fad7-49a9-9e4c-10c5f5013511', 'c8dbe114-1a06-498c-afc6-e2fe34e22261', '069e1491-fff0-41dd-be77-85fb3c434194', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:49:26.340087+00', '2025-12-02 01:49:26.340087+00'),
('79dd16ee-2483-444f-86e0-f5123de6f89a', 'f186acc1-f613-44d4-96a7-2249f1009c95', 'ad3748e5-b7a2-4b54-b60e-50ca3bf6090e', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-11-28 04:45:28.417362+00', '2025-11-28 04:45:28.417362+00'),
('7c0ee03b-2a34-4ecb-8c1b-c0ae6130f66d', '669dc83e-a134-4efa-88ec-901c693d1178', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-12-01 14:28:51.227273+00', '2025-12-01 14:28:51.227273+00'),
('7ddceefb-2c5c-4153-a3aa-bcad242d16d4', 'f39b9a9c-1a7f-4067-a2ae-e4d73b7b7252', '069e1491-fff0-41dd-be77-85fb3c434194', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-28 03:02:29.669724+00', '2025-11-28 03:02:29.669724+00'),
('842af3eb-be69-453f-9fc9-6a217396298e', '4a5f7a64-06bc-41ca-80a4-0906f2477ab8', '4388f041-51aa-48b4-88df-817a3565b1e7', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-12-01 16:10:15.532968+00', '2025-12-01 16:10:15.532968+00'),
('84f2d1a6-e7ad-48db-9afc-2c9e3d584390', 'f4b254ee-3db9-4fb6-845d-a275208baeac', '7765701d-9080-4e60-82d6-fd35f9d1148c', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-12-02 02:09:25.38165+00', '2025-12-02 02:09:25.38165+00'),
('8cc51dff-cb0b-4142-86b3-33b19fa0460d', '871d719d-4055-4a76-8350-7a5ed48e02a9', '4fe7b841-acc0-40ef-a3ff-f61cff35ef42', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-12-02 02:05:28.942956+00', '2025-12-02 02:05:28.942956+00'),
('953fde0c-4fc7-4b3a-af1c-0f7890e1850c', 'be2ed6fa-aa04-4b76-9ffb-86e4512d6c45', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-28 06:48:51.471061+00', '2025-11-28 06:48:51.471061+00'),
('96630f8d-c618-4937-9b19-d7992ba9593e', '40d1341d-a9be-4318-8d51-2f7aafffda94', '4388f041-51aa-48b4-88df-817a3565b1e7', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:51:51.708566+00', '2025-12-02 01:51:51.708566+00'),
('991d4c52-8fad-4f44-94c8-514c6c574900', 'f3f6dcf2-a257-435f-840e-2bdf0581d9dd', '069e1491-fff0-41dd-be77-85fb3c434194', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 14:19:22.201998+00', '2025-11-27 14:19:22.201998+00'),
('aeff9c9d-6343-4726-b9c0-595da7672086', '5ccce63d-7b31-48fc-aada-36c138c3832f', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-25 21:36:46.293727+00', '2025-11-25 21:36:46.293727+00'),
('cc4fa6c1-cf72-4b17-b0bd-277dbb1905e6', '4f5d818f-906d-4001-a7ea-cc1683c29d11', '5c852dec-6110-4650-9f8e-04f33820272e', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:39:48.123002+00', '2025-12-02 01:39:48.123002+00'),
('e1d96f14-0171-4068-95a3-2a1d0a48e995', 'fe0ff4e5-a61a-441a-adb9-bc697cf2300b', '5c852dec-6110-4650-9f8e-04f33820272e', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 14:54:10.51752+00', '2025-11-27 14:54:10.51752+00'),
('ef0cce03-5efe-464a-a564-4b03a5a13490', 'd6e04eaf-d69c-471d-9257-f79aeb6293e5', 'ad3748e5-b7a2-4b54-b60e-50ca3bf6090e', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:50:30.444655+00', '2025-12-02 01:50:30.444655+00'),
('fe9e81dd-64d3-46f8-b890-42bd53f399f9', '13cd38ee-f46b-4fa5-88ef-351cf3d98147', 'dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'En revision', 'Evaluación inicial', NULL, NULL, NULL, 'media', NULL, '2025-12-02 01:43:35.867453+00', '2025-12-02 01:43:35.867453+00');

INSERT INTO "public"."recruitment_interviews" ("id", "application_id", "interview_type", "scheduled_at", "duration_minutes", "location", "meeting_url", "status", "decision", "feedback_summary", "next_steps", "created_by", "created_at", "updated_at") VALUES
('27653fab-a04b-4774-bfed-04d0a42b130a', '06cd3658-6db1-4b52-a04f-35e41edac7cd', 'screening', '2025-12-02 07:16:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-02 07:16:25.822328+00', '2025-12-02 07:16:25.822328+00'),
('2de20268-34ae-4931-8199-23cff79f5e4e', '7ddceefb-2c5c-4153-a3aa-bcad242d16d4', 'screening', '2025-11-28 06:34:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-28 06:34:57.256999+00', '2025-11-28 06:34:57.256999+00'),
('44f070b9-da38-4e83-9ae1-72d97561af7a', 'e1d96f14-0171-4068-95a3-2a1d0a48e995', 'screening', '2025-11-27 14:54:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 14:54:16.151145+00', '2025-11-27 14:54:16.151145+00'),
('463d0253-f125-4ad6-8efb-e1171ded6cab', 'aeff9c9d-6343-4726-b9c0-595da7672086', 'screening', '2025-11-25 21:38:00+00', 30, 'Sala', 'https://mail.google.com/mail/u/0/?pli=1#inbox/FMfcgzQcqtkLBGdZRNwGpwrJhrVcbSfk', 'completada', 'aprobado', 'Aprobado', 'Prueba 2', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 21:37:09.180314+00', '2025-11-25 21:37:09.180314+00'),
('52b3f24c-dcb4-4d4b-86db-9e8327dfde21', '842af3eb-be69-453f-9fc9-6a217396298e', 'screening', '2025-12-01 16:10:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 16:10:37.853876+00', '2025-12-01 16:10:37.853876+00'),
('7864dbaf-ac8f-4fda-bea6-355deebd85dc', '2f6982d6-4d74-4cd7-8b16-06a71a5b9fd4', 'screening', '2025-11-25 19:57:00+00', 30, 'Sala', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'completada', 'aprobado', 'prueba', 'prueba', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 19:55:53.41903+00', '2025-11-25 19:55:53.41903+00'),
('87339dab-85ad-457e-811b-4d3ade3444c3', '7c0ee03b-2a34-4ecb-8c1b-c0ae6130f66d', 'cultural', '2025-12-10 14:29:00+00', 20, 'Sala', 'http://www.cuautla.com.mx', 'completada', 'aprobado', 'Paso', 'rapida', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-01 14:31:19.883632+00', '2025-12-01 14:31:19.883632+00'),
('9a672e68-65c1-48d5-89f0-4692884d6103', '8cc51dff-cb0b-4142-86b3-33b19fa0460d', 'screening', '2025-12-02 07:01:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-02 07:01:21.945633+00', '2025-12-02 07:01:21.945633+00'),
('9d18c9e9-371b-41c4-82ca-cc0389bb109e', '30609586-e978-4f7a-bd4b-e584acba8fb9', 'tecnica', '2025-12-02 07:04:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-02 07:04:38.442792+00', '2025-12-02 07:04:38.442792+00'),
('b3fce4b2-bcef-492d-a7ed-9d2466ba907e', '84f2d1a6-e7ad-48db-9afc-2c9e3d584390', 'screening', '2025-12-02 06:50:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-02 06:50:44.214506+00', '2025-12-02 06:50:44.214506+00'),
('b61cf067-28f1-4801-9960-c2372766c1ce', '991d4c52-8fad-4f44-94c8-514c6c574900', 'screening', '2025-11-27 14:19:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac', '2025-11-27 14:19:29.958021+00', '2025-11-27 14:19:29.958021+00'),
('c9cb8ee9-0ab5-4c12-854a-994af9e7f2b0', '1ab0b135-376a-41c9-9abe-a581854a8783', 'screening', '2025-12-02 03:48:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-12-02 03:50:19.537744+00', '2025-12-02 03:50:19.537744+00'),
('caf4c144-ead5-42ca-93df-2e7cb67201b2', '2a30107f-ea86-4b9b-bae3-dcf4801e70aa', 'screening', '2025-11-27 03:46:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 03:46:18.194784+00', '2025-11-27 03:46:18.194784+00'),
('df5ceac3-adea-4977-ab48-e7bf02f2b580', '953fde0c-4fc7-4b3a-af1c-0f7890e1850c', 'screening', '2025-11-28 06:48:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-28 06:48:57.806947+00', '2025-11-28 06:48:57.806947+00'),
('efa94031-06c9-4e30-a00e-8462e304bad5', '4e83d8fe-7825-4af9-bac8-2175ac1d2736', 'screening', '2025-11-27 05:45:00+00', NULL, NULL, NULL, 'completada', 'aprobado', 'Prueba', 'Subir docuementos', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 05:44:29.64528+00', '2025-11-27 05:44:29.64528+00');
INSERT INTO "public"."notifications" ("id", "user_id", "title", "message", "type", "link", "is_read", "read_at", "created_at") VALUES
('049d4f82-5d37-46e3-95a3-d85c56b9e313', '3b462775-0e25-47bd-a34a-e35ac8923cac', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('1276909e-5a59-413e-847d-49ab18ca2da1', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('14acd7aa-c853-4360-a8d9-c7e7edc42439', 'c2cff6db-9b29-40d0-8b06-798d406d17a6', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('20311423-86f8-4ec4-abc6-0c3ba99d5b51', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('21013ee5-48b3-4ed8-af3b-f7a0023d0157', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('245878de-86bb-423f-ac05-37d89fd52d5b', '70b537f6-db5e-48d3-86ee-7a280655aba5', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('343858be-6294-4466-abcd-bae3aa1ca763', '26edb037-5f42-40f3-9067-6da8aafa4acd', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('3e04ff83-bb90-4351-ae2a-1937c4cb0799', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('57394db3-6061-4275-b4ef-5622d5762aea', '2b6bf737-380a-48e7-8f2c-5d6422d6e032', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('5ce15edc-dcc1-4e5a-9a11-4a5573b38d43', 'b3d780b6-3590-4615-a12c-918a2ebb9f2d', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('79946056-6c78-4ce5-a88d-20c5739cd77f', '6f69105d-8e5f-4892-a5b6-494726ee768a', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('8678f490-d85e-4bcd-a2e0-9683c36b929f', '2d556763-8c73-4af8-b48b-9de3dafca523', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('8b183f52-d617-43f6-b36b-b1d9c5d699f9', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('93d1aaca-6195-442c-a51f-67cf243c8e7a', 'ea6ab625-c61f-47f2-8ab1-890426eac147', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('98b2434f-6dfb-4a53-acd2-854eb1321c10', '85981ed9-2f23-463f-bae7-8e41fe2a033b', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('ac891f2a-ff81-428f-9134-4c306b2f661b', 'df2c0217-fa38-43d0-83a2-3fe440db6678', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00'),
('f82d7abc-d473-4a52-96cc-b13f3f616bae', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', '⚠️ Inducción de Seguridad Requerida', 'El nuevo ingreso Roberto Salinas(Seguridad) requiere inducción de seguridad inmediata.', 'security_alert', '/ employees / 32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'f', NULL, '2025-12-02 07:01:34.7439+00');
INSERT INTO "public"."sh_sectors" ("id", "name", "description", "risk_level", "responsible_id", "created_at", "updated_at") VALUES
('1d07107f-9093-414b-98e9-425e4f1a0d93', 'Almacén de Materias Primas', 'Sector de almacenamiento de materias primas e insumos para producción. Incluye racking, montacargas, y sistemas de manejo de materiales. Se almacenan productos químicos y materiales inflamables en áreas designadas.', 'medio', NULL, '2025-12-02 03:03:39.100581+00', '2025-12-02 03:03:39.100581+00'),
('6b34eff2-37a9-44a0-8a62-e29b94ff574e', 'Laboratorio de Control de Calidad', 'Área equipada para pruebas y análisis de productos. Incluye equipos de medición, reactivos químicos y dispositivos electrónicos de precisión. Se manejan sustancias químicas en pequeñas cantidades.', 'medio', NULL, '2025-12-02 03:03:39.100581+00', '2025-12-02 03:03:39.100581+00'),
('b8649f24-a6c6-4dd1-809d-ff386aa15929', 'Sala de Máquinas y Subestación Eléctrica', 'Sector que alberga equipos eléctricos de alta tensión, transformadores, tableros de distribución y sistemas de respaldo. Solo personal autorizado puede ingresar. Riesgo eléctrico elevado.', 'muy_alto', NULL, '2025-12-02 03:03:39.100581+00', '2025-12-02 03:03:39.100581+00'),
('c1be7266-f3eb-4735-b84e-c3f396b86025', 'Planta de Producción Principal', 'Área principal de manufactura donde se ensamblan productos. Incluye líneas de producción, máquinas de ensamblaje y equipos automatizados. Se manejan materiales pesados y maquinaria de alta potencia.', 'alto', NULL, '2025-12-02 03:03:39.100581+00', '2025-12-02 03:03:39.100581+00'),
('c25cf8b2-a0f8-428c-9442-13c94b751d22', 'Área de Pintura y Recubrimientos', 'Zona de aplicación de pinturas, barnices y recubrimientos especiales. Sistema de ventilación forzada, manejo de materiales inflamables y químicos volátiles. Requiere equipo de protección específico.', 'alto', NULL, '2025-12-02 03:03:39.100581+00', '2025-12-02 03:03:39.100581+00');
INSERT INTO "public"."recruitment_candidates" ("id", "full_name", "email", "phone", "current_location", "resume_url", "source", "seniority", "status", "assigned_recruiter", "notes", "created_at", "updated_at", "rfc", "curp", "nss", "address") VALUES
('13cd38ee-f46b-4fa5-88ef-351cf3d98147', 'Carlos Hernández', 'carlos.hdez@test.com', '8187654321', 'Monterrey', 'https://portfolio.com/carlos', 'Referido', 'Junior', 'nuevo', NULL, NULL, '2025-12-02 01:43:35.627548+00', '2025-12-02 01:43:35.627548+00', 'HECA880505IM4', 'HECA880505HNLRLA02', '34886543210', 'Calle Morelos 500, Monterrey'),
('156ce631-6393-4bb2-9673-20322519f706', 'Velazquez Perez Vertin', 'vertin@gmail.com', '3243252', 'México', NULL, 'linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 03:46:10.486641+00', '2025-11-27 03:46:10.486641+00', NULL, NULL, NULL, NULL),
('33973f66-fc43-4cb0-b704-d9f9e3c9f78e', 'Miguel Ángel Castillo', 'migue.castillo@web.com', '2223456789', 'Puebla', NULL, 'Feria de Empleo', 'Junior', 'nuevo', NULL, NULL, '2025-12-02 01:58:31.722435+00', '2025-12-02 01:58:31.722435+00', 'CAMM010101CL2', 'CAMM010101HPLXRN08', '22014567890', 'Recta a Cholula 12, PUE'),
('40d1341d-a9be-4318-8d51-2f7aafffda94', 'Sofía Ramírez', 'sofia.rami@tech.com', '9991234567', 'Mérida', 'https://github.com/sofia-r', 'LinkedIn', 'Senior', 'nuevo', NULL, NULL, '2025-12-02 01:51:51.584878+00', '2025-12-02 01:51:51.584878+00', 'RASO920720AB1', 'RASO920720MYNSRL04', '11927654321', 'Paseo de Montejo 45, MID'),
('47dd4e71-53fa-47f8-b65d-6ce02cec5e0c', 'Pedro', 'pedro@gmail.com', '7356723546', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'prueba', '2025-11-25 19:55:21.339664+00', '2025-11-25 19:55:21.339664+00', NULL, NULL, NULL, NULL),
('4a5f7a64-06bc-41ca-80a4-0906f2477ab8', 'Fernando Romano Rodriguez', 'fer.123@gmail.com', '7351009010', 'México', NULL, 'Twitter', 'Semi Senior', 'contratado', NULL, NULL, '2025-12-01 16:10:15.269987+00', '2025-12-01 16:10:15.269987+00', 'VECJ991130ABC', 'VECJ991130HDFRLS09', '83299239289', NULL),
('4f5d818f-906d-4001-a7ea-cc1683c29d11', 'Ana María García', 'ana.garcia@email.com', '5512345678', 'México', NULL, 'LinkedIn', 'Senior', 'nuevo', NULL, NULL, '2025-12-02 01:39:47.951583+00', '2025-12-02 01:39:47.951583+00', 'GAAA900101H23', 'GAAA900101MDFRRN05', '12985678901', 'Av. Reforma 222, CDMX'),
('5ccce63d-7b31-48fc-aada-36c138c3832f', 'David', 'david@gmail.com', '7356744533', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'Prueba', '2025-11-25 21:36:46.075409+00', '2025-11-25 21:36:46.075409+00', NULL, NULL, NULL, NULL),
('669dc83e-a134-4efa-88ec-901c693d1178', 'Cesar Navarrete Bustamante', 'cecar@gmail.com', '7351234567', 'México', NULL, 'Linkerdin', 'Sin experiencia', 'contratado', NULL, 'Bueno', '2025-12-01 14:28:50.926158+00', '2025-12-01 14:28:50.926158+00', NULL, NULL, NULL, NULL),
('7a929992-ca46-4c09-9779-1bd418ac156f', 'Fernando Ruiz', 'fer.ruiz@dev.io', '6141234567', 'Chihuahua', NULL, 'Twitter', 'Junior', 'contratado', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'Interesado en posición remota.', '2025-12-02 02:13:46.916047+00', '2025-12-02 02:13:46.916047+00', 'RUFF951115P09', 'RUFF951115HCHMRN06', '99953456789', 'Av. Universidad 300, CUU'),
('871d719d-4055-4a76-8350-7a5ed48e02a9', 'Roberto Salinas', 'rob.salinas@corp.com', '5544332211', 'Estado de México', NULL, 'Referido', 'Senior', 'contratado', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, '2025-12-02 02:05:28.729626+00', '2025-12-02 02:05:28.729626+00', 'SARR800228J81', 'SARR800228HMCXLS07', '77801234567', 'Ciudad Satélite, Naucalpan'),
('96aaa2d9-37f5-4a07-8635-251d807cbce3', 'Recluta', 'recluta@prueba.com', '7351238231', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'Prueba inicial', '2025-11-27 05:44:17.780483+00', '2025-11-27 05:44:17.780483+00', NULL, NULL, NULL, NULL),
('be2ed6fa-aa04-4b76-9ffb-86e4512d6c45', 'prueba', 'prueba@gmail.com', '3423432354', NULL, NULL, 'facebook', 'Junior', 'contratado', NULL, NULL, '2025-11-28 06:48:51.304141+00', '2025-11-28 06:48:51.304141+00', NULL, NULL, NULL, NULL),
('c4a47b28-78e7-4b87-ac90-e55fc95f7b21', 'Elena Vega', 'elena.vega@design.com', '6641230987', 'Tijuana', NULL, 'Facebook', 'Semi Senior', 'nuevo', NULL, NULL, '2025-12-02 01:59:39.104549+00', '2025-12-02 01:59:39.104549+00', 'VEGE940910H55', 'VEGE940910MBCDRR03', '44942345678', 'Zona Río 55, TIJ'),
('c8dbe114-1a06-498c-afc6-e2fe34e22261', 'Lucía Méndez', 'lucia.dev@code.com', '3311223344', 'Guadalajara', NULL, 'Sitio Web', 'Junior', 'nuevo', NULL, 'Recién egresada, buen portafolio.', '2025-12-02 01:49:26.183419+00', '2025-12-02 01:49:26.183419+00', 'MELL9912123T1', 'MELL991212MJCZRS09', '56991234567', 'Av. Vallarta 100, GDL'),
('d6e04eaf-d69c-471d-9257-f79aeb6293e5', 'Jorge Luis Torres', 'jorge.torres@mail.com', '5598765432', 'Querétaro', 'https://drive.google.com/cv/jorge', 'Referencia', NULL, 'nuevo', NULL, NULL, '2025-12-02 01:50:30.256698+00', '2025-12-02 01:50:30.256698+00', 'TOLJ850315KH9', 'TOLJ850315HQTXRY01', '90853456789', 'Bernardo Quintana 300, QRO'),
('f132a8dc-114f-4620-bcea-ba0d2dd24aa8', 'Hector', 'altaerikiara@gmail.com', '7328289932', 'Mexico', NULL, 'Facebook', 'Semi Senior', 'contratado', NULL, NULL, '2025-11-26 04:53:28.547233+00', '2025-11-26 04:53:28.547233+00', NULL, NULL, NULL, NULL),
('f186acc1-f613-44d4-96a7-2249f1009c95', 'María Gonzales', 'maria.gonzalez@gmail.com', '5551234567', 'Cuidad de Mexico', NULL, 'Facebook', 'Senior', 'contratado', NULL, 'Muy activa', '2025-11-28 04:45:27.897096+00', '2025-11-28 04:45:27.897096+00', NULL, NULL, NULL, NULL),
('f39b9a9c-1a7f-4067-a2ae-e4d73b7b7252', 'Barco Hernandez Oscar Gael', 'oscar@gmail.com', '4324234232', 'México', NULL, 'linkedin', 'Semi Senior', 'contratado', NULL, NULL, '2025-11-28 03:02:29.47212+00', '2025-11-28 03:02:29.47212+00', NULL, NULL, NULL, NULL),
('f3f6dcf2-a257-435f-840e-2bdf0581d9dd', 'Uriel Francisco Lopez Rios', 'uriel.rios@gmail.com', '7352638193', 'México', NULL, 'Linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 14:19:21.942585+00', '2025-11-27 14:19:21.942585+00', NULL, NULL, NULL, NULL),
('f4b254ee-3db9-4fb6-845d-a275208baeac', 'Patricia Orozco', 'paty.oro@mail.net', '4779876543', 'León', NULL, 'LinkedIn', 'Senior', 'contratado', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'Muy buena actitud, inglés avanzado.', '2025-12-02 02:09:25.172636+00', '2025-12-02 02:09:25.172636+00', 'OOPP910606MK4', 'OOPP910606MGTSRA02', '88916543210', 'Blvd. Campestre 101, León'),
('fe0ff4e5-a61a-441a-adb9-bc697cf2300b', 'Gerardo Guzman', 'gera.guzman@gmail.com', '3273929028', 'México', NULL, 'Linkedin', 'Lead', 'contratado', NULL, NULL, '2025-11-27 14:54:10.349929+00', '2025-11-27 14:54:10.349929+00', NULL, NULL, NULL, NULL);

INSERT INTO "public"."device_commands" ("id", "device_id", "command_type", "payload", "status", "created_at", "updated_at") VALUES
('061f9f14-10f7-4c54-a6b7-d126f5bcfab8', 'ESP32-001', 'ENROLL', '{"biometric_id": 2}', 'processing', '2025-11-26 01:31:40.284076+00', '2025-11-26 01:31:48.20477+00'),
('10248695-d735-4ae7-a543-19b5cf7a8e4a', 'ESP32-001', 'ENROLL', '{"biometric_id": 23}', 'processing', '2025-12-01 03:09:42.313237+00', '2025-12-01 03:09:45.303173+00'),
('29165243-ee88-4d29-94dc-b8429779ed71', 'ESP32-001', 'ENROLL', '{"biometric_id": 23}', 'processing', '2025-12-01 03:07:03.419643+00', '2025-12-01 03:08:28.300081+00'),
('30314bb5-04ed-480d-912c-82e3d9e63ef5', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:25:42.516086+00', '2025-11-26 01:25:46.381172+00'),
('407f92a9-2a1d-48d2-9429-d4e4a1fd5e0e', 'ESP32-001', 'ENROLL', '{"biometric_id": 10}', 'processing', '2025-11-27 15:58:17.718607+00', '2025-12-01 03:08:14.809201+00'),
('40db04c1-fec0-4846-8716-532915000ab4', 'ESP32-001', 'ENROLL', '{"biometric_id": 9}', 'processing', '2025-12-01 04:46:30.68868+00', '2025-12-01 04:46:37.418119+00'),
('49d0fcd1-9a69-47f6-b97d-0ad08de9ca4d', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:35:07.315074+00', '2025-11-26 14:35:51.709813+00'),
('4f48fa6e-b24b-4aba-86aa-66c1205440e3', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-25 06:12:49.156485+00', '2025-11-25 06:12:52.114725+00'),
('5b1a91ba-8a85-4374-86ea-1c8cf0e062df', 'ESP32-001', 'ENROLL', '{"biometric_id": 9}', 'processing', '2025-12-01 04:47:57.474308+00', '2025-12-01 04:48:06.649654+00'),
('69f741f6-26f9-4cdd-bb57-e4089b0621c7', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:28:18.693913+00', '2025-11-26 01:28:23.751617+00'),
('8c1038ce-16b2-4104-b0c8-9b194dac245f', 'ESP32-001', 'ENROLL', '{"biometric_id": 9}', 'processing', '2025-11-27 14:22:34.50851+00', '2025-11-27 14:22:40.757129+00'),
('970e06f2-b7a0-44b6-8b79-19c919cfb674', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-27 02:34:05.081382+00', '2025-11-27 02:35:36.383319+00'),
('9a37e821-7151-4b6e-9c15-5f8197e11088', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:34:37.396529+00', '2025-11-26 14:35:06.567107+00'),
('9b12b7e7-3653-42ba-8e3f-b801e974715f', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:34:20.477258+00', '2025-11-26 14:34:25.697184+00'),
('a4f78410-ff00-424e-9a6d-681c79e0e844', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-27 02:33:20.948915+00', '2025-11-27 02:35:22.098289+00'),
('a9e2c6f2-0b08-42c3-af4e-77927d1d405b', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:29:49.621715+00', '2025-11-26 01:29:58.942189+00'),
('c4cb8fda-8909-4dc9-af8a-3c18e984dcf3', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-26 14:36:12.619102+00', '2025-11-26 14:37:56.354404+00'),
('c84b631f-6114-475f-afdd-74a841ee89e6', 'ESP32-001', 'ENROLL', '{"biometric_id": 23}', 'processing', '2025-12-01 03:08:39.225573+00', '2025-12-01 03:09:02.141235+00'),
('d0b8f305-0dde-4375-a82a-c0cd47dbec8d', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-25 06:11:04.616171+00', '2025-11-25 06:11:07.187819+00'),
('d61fea78-590f-4889-a4c6-0267d9685ce1', 'ESP32-001', 'ENROLL', '{"biometric_id": 10}', 'processing', '2025-11-27 14:55:07.254502+00', '2025-11-27 14:55:13.818168+00'),
('ff93e6c3-d99b-4cca-98ca-5eb8d05e96f4', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:35:31.035171+00', '2025-11-26 14:36:27.658009+00');
INSERT INTO "public"."users" ("id", "email", "username", "full_name", "phone", "password_hash", "status", "department", "position", "last_login_at", "created_at", "updated_at", "is_verified", "is_locked", "failed_login_attempts", "password_reset_token", "password_reset_expires_at", "verification_token", "area_id", "position_id") VALUES
('03d65d92-28a9-4c56-b87a-16f75c4377c3', 'irvin@gmail.com', 'irvin@gmail.com', 'Irvin Sahi Sedeño Trujillo', '34545653', '0ddc5f1fd6caf4d6569efdcb196d38ff:5c491664ea53f9ab945e055e61a3a3305388bd5dd599fdf4952f8a71d9015148', 'activo', 'General', 'Limpieza', NULL, '2025-11-26 14:33:28.982248+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('0b007de5-c244-4693-98d4-e9b3e7e33b4f', 'migue.castillo@web.com', 'migue.castillo@web.com', 'Miguel Ángel Castillo', '2223456789', '1aa7416bb81f1893a1221e7390b2a2a6:43e12427db3a3ba0b45f2a8b503404ffdb255782c820346b0bd62734724ce086', 'activo', NULL, NULL, NULL, '2025-12-02 07:16:36.818255+00', '2025-12-02 07:16:36.818255+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('26edb037-5f42-40f3-9067-6da8aafa4acd', 'uriel.rios@gmail.com', 'uriel.rios@gmail.com', 'Uriel Francisco Lopez Rios', '7352638193', 'ced0aa6238c84d0283245b5a8109c8aa:adb4de9b4333bd8361e58b314787ad7ac5a4c27f81343487060b38bc32fa6edc', 'activo', 'Tecnología', 'Desarrollador junior', NULL, '2025-11-27 14:20:15.935322+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 'emmanuel.saliff@gmail.com', 'emmanuel.saliff@gmail.com', 'Vallecillo Alvarado Emmanuel Saliff', '7453245234', '8974e61d64293f4f364d562baa295e13:ce796dd9134c9e7fd4a2364ec701cfd4f96de379a0f5ec8aca58bcd51b545254', 'activo', NULL, NULL, NULL, '2025-12-01 03:06:25.123356+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('2b6bf737-380a-48e7-8f2c-5d6422d6e032', '22680286@cuautla.tecnm.mx', 'alejandrosb', 'Alejandro Solano Barrientos', '7353351756', '8e1f02c342831bde2970e60d98ab575e:b88d9f01bb26c20204cf44ca706ccbb63142b876c7d5e414b55e3a1c4c7dcf98', 'activo', NULL, NULL, '2025-12-01 14:46:35.238+00', '2025-12-01 14:26:11.423546+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('2d556763-8c73-4af8-b48b-9de3dafca523', 'luna24@gmail.com', 'lunita', 'Jennifer Maciel Luna Escobar', '7351234567', 'ca7add9db9e37ee539d5f4b7cb51e474:5feb27526b5b8cc2771aed346636db39fda68bf76bdd38c36427237682e0ad4a', 'activo', NULL, NULL, '2025-12-02 02:59:29.402+00', '2025-12-01 14:49:30.583524+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'baeza', 'Luis Antonio Baeza Turijan', '7351031090', '2c03d6a0385ab9703fb715bb59c6b5b6:7c40bc1ab1d6cb352658e9ef7aeeb9c2b8082f82bcacac1739aa8dec3548a8e2', 'activo', NULL, NULL, '2025-11-27 15:23:46.297+00', '2025-11-27 14:12:07.170557+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 1, NULL, NULL, NULL, NULL, NULL),
('32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 'rob.salinas@corp.com', 'rob.salinas@corp.com', 'Roberto Salinas', '5544332211', '3bf64127a1bd5ea565d141cddd3d2089:b38033f6a5ec1a855d8aae2cf26569876ec141ee8f5e213e162a29f8696c59e5', 'activo', NULL, NULL, NULL, '2025-12-02 07:01:33.158515+00', '2025-12-02 07:01:33.158515+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'emmanuel@gmail.com', 'Emmanuel', '342234', '0839227ae1be75fae0a4a706c2ecfda5:23ab598d2a3199c6a00381179b782871c61538bae25c876093b3934b1d2ab08e', 'activo', 'Tecnología', 'Desarollador FullStack', '2025-11-27 14:17:41.97+00', '2025-11-26 05:39:40.613765+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('4838c265-1c5e-4520-9590-23fd6d4161dc', 'daniel@gmail.com', 'daniel', 'Daniel', '7351115766', '7291ea51291eaf25af9482489192af81:fe5fbb446d497a5d0c8fd6462b0aeba0ff2121d1b95c74b780c87c4c9ad1e1c6', 'activo', NULL, NULL, NULL, '2025-11-27 14:52:31.102098+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('6f69105d-8e5f-4892-a5b6-494726ee768a', 'recluta@prueba.com', 'recluta@prueba.com', 'Recluta', '7351238231', '6a524785ca34f2fdb4aff5f65e3f45c6:21868ec8bee06bfbfe07717d9127cdbc744fa2df5dcebc02cdc125b0d2976146', 'activo', 'Tecnología', 'Desarollador Web', NULL, '2025-11-27 05:45:20.628572+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('70b537f6-db5e-48d3-86ee-7a280655aba5', 'gera.guzman@gmail.com', 'gera.guzman@gmail.com', 'Gerardo Guzman', '3273929028', 'e81833662f5a74ad7e154235b60d4857:f7629b541b6c7c96d923b27db6a62577a6ce8230453be654ca89222abbc97603', 'inactivo', 'Tecnología', 'Desarollador Web', NULL, '2025-11-27 14:54:30.305833+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('85981ed9-2f23-463f-bae7-8e41fe2a033b', 'pedro@gmail.com', 'pedro@gmail.com', 'Pedro', '7356723546', '66ce15e8fcebbf891b49457bca67adcc:7a7597a227b5149de376386ee813ff05726dbedd2ab75d8f6ce1078ab3a24145', 'activo', 'Tecnología', 'Desarrollador Web', NULL, '2025-11-25 19:56:29.011228+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 'correo.elquesea@gmail.com', 'arizzbeth', 'Arizbeth Cabrera Mz', '7352444348', 'def4b2df7b47d32234f06228b1bed061:9d3bb425d4b530324b1287d32e979c9915c0dfc23e4c89c74e32e0b86d1891da', 'activo', NULL, NULL, '2025-12-01 15:10:54.297+00', '2025-12-01 14:57:45.915326+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'arizbeth', 'Arizbeth Cabrera M', '123456789', '161ae6aab4699c168af3678a4164e732:b750f6e025aaf08ba34f9545cc18decdae4decf0524a642d62c5646cb6dcece2', 'activo', NULL, NULL, '2025-12-01 14:35:02.421+00', '2025-11-27 14:51:18.629396+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'usuario_ejemplo', 'usuario_ejemplo', NULL, '917c19138cb462ece87665c881e0d018:0c27adb411dac546604df853d6ab6929253a45a528ada8c9a77ceb208bb6c58c', 'activo', NULL, NULL, '2025-12-02 06:47:44.259+00', '2025-11-25 04:12:17.785215+00', '2025-12-02 06:47:44.336927+00', 'f', 'f', 0, NULL, NULL, NULL, '38e040f2-d503-42e1-b8de-be0855aa6fbc', '38e040f2-d503-42e1-b8de-be0855aa6fbc'),
('a42350cf-587e-44d9-8590-a6da3511237b', 'danielgc@gmail.com', 'danielgc', 'Daniel', '7351115766', '15cf90f86aa20f3f474cd300f69ac442:9254d8515622e67f7293c651ec765414df07fa87ea973e736b320722e9f223aa', 'activo', NULL, NULL, NULL, '2025-11-27 14:51:33.365297+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'prueba@gmail.com', 'prueba@gmail.com', 'prueba', '3423432354', '91cd6e6ae39641a59a5f1d1cc3da909a:b7a3f91d255abc2ed49de6e21a362be062a8767a19760e52fa9ee8e33a328c8b', 'activo', 'General', 'Limpieza', NULL, '2025-11-28 06:49:12.732084+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('b3d780b6-3590-4615-a12c-918a2ebb9f2d', 'fer.123@gmail.com', 'fer.123@gmail.com', 'Fernando Romano Rodriguez', '7351009010', '6a43e996f98451941149377c5280d023:7d4c92e17dedfacb11abbc10b9692327a09f829f9b8b93078e720ecc680353ab', 'activo', NULL, NULL, NULL, '2025-12-01 16:10:56.649823+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'pedro.picapidra@gmail.com', 'pedro.picapidra@gmail.com', 'Pedro Picapidra', '234234', 'ba87d9e881eb45ec789b2cc3dc96c33e:9f276e7b47db17437f387d082fdb3083a328e061ddd1a809ca6d6baaa0065da9', 'activo', 'General', 'Limpieza', NULL, '2025-11-27 05:50:40.795614+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('c2cff6db-9b29-40d0-8b06-798d406d17a6', 'cecar@gmail.com', 'cecar@gmail.com', 'Cesar Navarrete Bustamante', '7351234567', '06de5f01aee2dc4607cb314fc9fd79a7:215832edc8eddc526ecec3cc50cc27d42eaae2646797565be31a911586bf857f', 'activo', NULL, NULL, NULL, '2025-12-01 14:32:15.09827+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 2, NULL, NULL, NULL, NULL, NULL),
('df2c0217-fa38-43d0-83a2-3fe440db6678', 'fer.ruiz@dev.io', 'fer.ruiz@dev.io', 'Fernando Ruiz', '6141234567', 'fbcd16b370a4e13c851fde14414dff04:5880262ffd58b901748da3e643518dc14bc866e1211b2e20b9b7560f5559d989', 'activo', NULL, NULL, NULL, '2025-12-02 03:52:15.677249+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('ea6ab625-c61f-47f2-8ab1-890426eac147', 'chito@talento.com', 'chito@talento.com', 'Barco Hernandez', '8324893482', '2db39e473e3dedb06264c1842a69f0c3:132bcba3005f1ddab3f2afc18ca2f313a7881744faa970710e578e99b4744ed8', 'activo', 'General', 'Limpieza', NULL, '2025-11-25 19:50:08.011036+00', '2025-12-02 04:13:48.925218+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('f18f049d-a237-455d-a3db-6e16489ba32e', 'elena.vega@design.com', 'elena.vega@design.com', 'Elena Vega', '6641230987', '5fb027c0912827ec45eb716164f53281:d24d2a7ecc67f3649e7a948694f73815b0d02f0e7be79a2e782006338595144c', 'activo', NULL, NULL, NULL, '2025-12-02 07:04:52.346357+00', '2025-12-02 07:04:52.346357+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL),
('fe65ec20-ce23-403c-9de0-de262a40fa2e', 'paty.oro@mail.net', 'paty.oro@mail.net', 'Patricia Orozco', '4779876543', 'd8ca28197f427f68c57a0d1bafaf5e3a:7a27c39aa23546b3120acdd5cfd645ce6caa2cc4ddef0d22bbae78d25c2f7e6d', 'activo', NULL, NULL, NULL, '2025-12-02 06:59:34.690085+00', '2025-12-02 06:59:34.690085+00', 't', 'f', 0, NULL, NULL, NULL, NULL, NULL);


INSERT INTO "public"."positions" ("id", "title", "description", "area_id", "status", "created_at", "updated_at", "work_start_time", "work_end_time") VALUES
('069e1491-fff0-41dd-be77-85fb3c434194', 'Desarrollador junior', 'Desarrollador Junior', NULL, 'abierta', '2025-11-27 14:16:42.142615+00', '2025-11-27 14:16:42.142615+00', '08:00:00', '16:00:00'),
('12d9434d-0035-494f-927e-2e027860a15b', 'Limpieza', NULL, NULL, 'abierta', '2025-11-25 14:54:09.26973+00', '2025-11-25 14:54:09.26973+00', '05:00:00', '12:00:00'),
('2d56bf86-4046-4af3-8d53-efcb24c06e61', 'Limpieza', NULL, '38e040f2-d503-42e1-b8de-be0855aa6fbc', 'active', '2025-11-25 19:50:06.742577+00', '2025-11-25 19:50:06.742577+00', '09:00:00', '18:00:00'),
('4388f041-51aa-48b4-88df-817a3565b1e7', 'Desarollador FullStack Python', NULL, NULL, 'abierta', '2025-12-01 01:51:04.303755+00', '2025-12-01 01:51:04.303755+00', '06:00:00', '14:00:00'),
('4c237d39-0d63-4f0a-a0cc-1a55c615be33', 'Admin', 'X', NULL, 'abierta', '2025-12-01 14:46:31.317996+00', '2025-12-01 14:46:31.317996+00', '10:46:00', '11:46:00'),
('4fe7b841-acc0-40ef-a3ff-f61cff35ef42', 'Ayudante de limpieza', 'xxx', NULL, 'abierta', '2025-12-01 14:48:30.207995+00', '2025-12-01 14:48:30.207995+00', '10:51:00', '00:48:00'),
('53e8644c-02cb-42a9-a4fa-00ba84d912a5', 'Desarrollador Web', NULL, 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'active', '2025-11-27 02:23:06.287459+00', '2025-11-27 02:23:06.287459+00', '09:00:00', '18:00:00'),
('5a9f8f37-5056-4436-a99f-2ebfdfb30e9a', 'Gerente', 'Ejemplo', NULL, 'abierta', '2025-12-01 14:45:19.408459+00', '2025-12-01 14:45:19.408459+00', '10:00:00', '16:00:00'),
('5c852dec-6110-4650-9f8e-04f33820272e', 'Desarollador Web', NULL, NULL, 'En proceso', '2025-11-26 14:40:19.379374+00', '2025-11-26 14:40:19.379374+00', '06:29:00', '07:30:00'),
('6208174a-33be-4100-8e12-41663fe1462b', 'area Bf3', 'creada por el profe Becerro', NULL, 'En proceso', '2025-12-01 14:34:30.734785+00', '2025-12-01 14:34:30.734785+00', '02:33:00', '22:39:00'),
('7765701d-9080-4e60-82d6-fd35f9d1148c', 'Diseñador Gráfico', 'Creación de materiales visuales para campañas digitales e impresas.', NULL, 'abierta', '2025-12-01 14:51:01.809332+00', '2025-12-01 14:51:01.809332+00', '10:50:00', '21:00:00'),
('8fa92360-e962-434a-b336-3dd8bcad6b4e', 'contabilidad', 'manejo de números', NULL, 'En proceso', '2025-12-01 14:21:05.039209+00', '2025-12-01 14:21:05.039209+00', '10:26:00', '10:24:00'),
('aa5b3be9-0e9d-4ac6-a651-c030d7bef543', 'Analista de datos', 'Responsable de análisis de información y generación de reportes para la toma de decisiones.', NULL, 'abierta', '2025-12-01 14:50:13.381782+00', '2025-12-01 14:50:13.381782+00', '09:49:00', '20:50:00'),
('ad3748e5-b7a2-4b54-b60e-50ca3bf6090e', 'Gerente de Recursos Humanos', 'Urgente', NULL, 'abierta', '2025-11-28 04:37:26.153849+00', '2025-11-28 04:37:26.153849+00', '23:00:00', '19:30:00'),
('c95bff1b-2432-4e71-b507-11a5510bf6be', 'Desarrollador BackEnd', NULL, 'fbcfb05d-f7d5-421b-a344-d3bf20c1f235', 'active', '2025-11-25 05:46:53.733113+00', '2025-11-25 05:46:53.733113+00', '12:24:00', '17:24:00'),
('d0287626-7d61-4a31-9b50-c18c237783cb', 'Desarollador Web', NULL, 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'active', '2025-11-27 05:45:19.589495+00', '2025-11-27 05:45:19.589495+00', '09:00:00', '18:00:00'),
('dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'Desarrollador Web', NULL, NULL, 'abierta', '2025-11-26 14:28:15.331785+00', '2025-11-26 14:28:15.331785+00', '06:29:00', '19:30:00');


INSERT INTO "public"."vacation_balances" ("id", "user_id", "total_days", "used_days", "available_days", "year", "created_at", "updated_at") VALUES
('03e4e884-6b5a-4350-81ff-ac17958b523f', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', 12, 4, 8, 2025, '2025-12-02 07:02:32.530702+00', '2025-12-02 07:02:32.530702+00'),
('2cecb188-7604-422e-b4de-5af4f7efd0a8', '32e62c94-dc74-4a34-9848-4e7dbbbb5d89', 0, 0, 12, 2025, '2025-12-02 07:01:33.799542+00', '2025-12-02 07:01:33.799542+00'),
('64606ead-b827-434c-9d38-bef7df35b9a7', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', 12, 3, 9, 2025, '2025-12-02 07:12:36.018448+00', '2025-12-02 07:12:36.018448+00'),
('71e0938b-d88c-4ff2-9796-3a3163fb68ae', 'fe65ec20-ce23-403c-9de0-de262a40fa2e', 15, 0, 15, 2025, '2025-12-02 06:59:35.303019+00', '2025-12-02 06:59:35.303019+00'),
('b7dd2af4-5fb1-4380-b49f-1af58c9ba556', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 12, 3, 9, 2025, '2025-12-02 06:48:25.580985+00', '2025-12-02 06:48:25.580985+00');
INSERT INTO "public"."vacation_requests" ("id", "user_id", "start_date", "end_date", "days_requested", "status", "employee_note", "manager_note", "created_at", "updated_at") VALUES
('052a3cfb-23f2-455d-9b62-539f8ddda03d', '284f5d3c-40aa-40f2-b3b4-e519e8550e4b', '2025-12-18', '2025-12-21', 4, 'approved', '', NULL, '2025-12-02 07:02:28.385556+00', '2025-12-02 07:02:32.530702+00'),
('65392d90-7dd3-4415-ae4c-843ae48e9d26', 'ea6ab625-c61f-47f2-8ab1-890426eac147', '2025-12-23', '2025-12-26', 4, 'rejected', '', NULL, '2025-12-02 07:06:39.951766+00', '2025-12-02 07:10:36.869331+00'),
('85d4a16d-2dd8-4484-8c71-7cbafc056efe', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-12-17', '2025-12-19', 3, 'approved', '', NULL, '2025-12-02 06:48:20.837102+00', '2025-12-02 06:48:25.580985+00'),
('91fb9c2d-1424-4bcb-b175-63520a48f13d', '95cbc075-6b10-4016-aeec-2ed68cd7ef2c', '2025-12-23', '2025-12-25', 3, 'approved', '', NULL, '2025-12-02 07:12:30.144685+00', '2025-12-02 07:12:36.018448+00');
INSERT INTO "public"."sh_checklists" ("id", "name", "description", "category", "is_active", "items", "created_by", "created_at", "updated_at") VALUES
('03d4823c-d5b7-46e7-9b5b-a1e9500f284b', 'Auditoría Semanal de Almacén de Materias Primas', 'Revisión de seguridad en almacenamiento, manejo de materiales y operación de montacargas', 'auditoria', 't', '[{"type": "yes_no", "question": "¿Los pasillos principales están despejados (mínimo 1.2m de ancho)?", "required": true}, {"type": "yes_no", "question": "¿Los montacargas tienen señalización sonora y visual operativa?", "required": true}, {"type": "yes_no", "question": "¿Los rackings tienen carteles de capacidad de carga visibles?", "required": true}, {"type": "select", "options": ["Adecuado y señalizado", "Requiere mejoras", "Deficiente"], "question": "Estado de las áreas de almacenamiento de químicos inflamables:", "required": true}, {"type": "yes_no", "question": "¿Los operadores de montacargas tienen licencia vigente y EPP completo?", "required": true}, {"type": "numeric", "question": "Número de extintores verificados en el almacén:", "required": true}, {"type": "text", "question": "Observaciones sobre manejo seguro de materiales:", "required": true}, {"type": "text", "question": "Recomendaciones para mejorar seguridad en almacenamiento:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('26f98c2f-8693-410c-82df-090e8d73974c', 'Auditoría Trimestral de Sala de Máquinas y Subestación', 'Evaluación de seguridad eléctrica, protección contra arcos y accesos restringidos', 'auditoria', 't', '[{"type": "yes_no", "question": "¿La sala tiene señalización de peligro eléctrico visible en todas las entradas?", "required": true}, {"type": "yes_no", "question": "¿Solo personal autorizado tiene acceso (registro de ingresos verificado)?", "required": true}, {"type": "yes_no", "question": "¿Los equipos tienen protecciones contra arco eléctrico instaladas?", "required": true}, {"type": "select", "options": ["Óptimo", "Requiere mantenimiento", "Deficiente"], "question": "Estado de los pisos antiestáticos y aislantes:", "required": true}, {"type": "yes_no", "question": "¿Los tableros tienen diagramas unifilares actualizados?", "required": true}, {"type": "numeric", "question": "Temperatura medida en transformadores principales (°C):", "required": true}, {"type": "yes_no", "question": "¿Existen equipos de respuesta a emergencias eléctricas (ganchos aislantes)?", "required": true}, {"type": "text", "question": "Observaciones sobre condiciones de seguridad eléctrica:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('2b2db55b-555b-4e6c-8591-9233e302688a', 'Inspección Semanal de Área de Pintura y Recubrimientos', 'Verificación de ventilación, manejo de materiales inflamables y protección contra incendios', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿El sistema de ventilación forzada funciona continuamente durante operaciones?", "required": true}, {"type": "yes_no", "question": "¿Los detectores de gases inflamables están calibrados y funcionando?", "required": true}, {"type": "yes_no", "question": "¿Las pinturas y solventes se almacenan en gabinetes de seguridad?", "required": true}, {"type": "numeric", "question": "Nivel de concentración de vapores orgánicos medidos (ppm):", "required": false}, {"type": "yes_no", "question": "¿El personal usa EPP específico (respiradores con filtros adecuados)?", "required": true}, {"type": "yes_no", "question": "¿Existen extintores clase B (líquidos inflamables) disponibles y accesibles?", "required": true}, {"type": "text", "question": "Observaciones sobre condiciones de ventilación y atmósferas explosivas:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('359aa994-b2cb-443a-8904-b6e5bef18fdc', 'Evaluación de Capacitación en Emergencias Específicas por Sector', 'Verificación de conocimientos del personal sobre emergencias específicas de su sector', 'capacitacion', 't', '[{"type": "yes_no", "question": "¿Conoce los riesgos específicos de emergencia en su sector (eléctrico, químico, etc.)?", "required": true}, {"type": "yes_no", "question": "¿Sabe operar equipo contra incendios específico para riesgos de su sector?", "required": true}, {"type": "yes_no", "question": "¿Conoce rutas de evacuación específicas y puntos de reunión del sector?", "required": true}, {"type": "select", "options": ["Alta", "Media", "Baja", "Nula"], "question": "Nivel de participación en simulacros específicos del sector:", "required": true}, {"type": "yes_no", "question": "¿Sabe responder a derrames químicos específicos de su sector (si aplica)?", "required": false}, {"type": "numeric", "question": "Tiempo estimado para evacuar el sector completamente (minutos):", "required": false}, {"type": "text", "question": "Temas de capacitación adicional requeridos para emergencias del sector:", "required": false}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('4079b77b-c23d-403c-a17d-4cd1bf81106b', 'Inspección Diaria de Planta de Producción Principal', 'Verificación de condiciones de seguridad en líneas de producción, máquinas y equipos automatizados', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿Todas las máquinas tienen resguardos de seguridad instalados y en buen estado?", "required": true}, {"type": "yes_no", "question": "¿Las señales de advertencia de máquinas en operación son visibles?", "required": true}, {"type": "yes_no", "question": "¿Los sistemas de paro de emergencia son accesibles y funcionan correctamente?", "required": true}, {"type": "select", "options": ["Limpia y ordenada", "Algo desordenada", "Desordenada y con obstáculos"], "question": "Estado de las áreas de trabajo alrededor de las máquinas:", "required": true}, {"type": "yes_no", "question": "¿Existe acumulación de virutas o residuos en el piso que puedan causar resbalones?", "required": true}, {"type": "numeric", "question": "Nivel de ruido medido en el área (dB):", "required": false}, {"type": "text", "question": "Observaciones sobre condiciones específicas de seguridad:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('60d8798a-a35a-4fa1-8cfa-323d4ef5c3cf', 'Monitoreo de Ventilación y Calidad del Aire por Sector', 'Evaluación de sistemas de ventilación y calidad del aire según riesgos específicos de cada sector', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿Los sistemas de ventilación/extracción funcionan según requerimientos del sector?", "required": true}, {"type": "yes_no", "question": "¿Existen olores anormales específicos de las operaciones del sector?", "required": true}, {"type": "yes_no", "question": "¿Los filtros de aire son adecuados para los contaminantes del sector?", "required": false}, {"type": "select", "options": ["Dentro de límites", "Ligeramente superior", "Muy superior"], "question": "Nivel de concentración de contaminantes específicos del sector:", "required": true}, {"type": "numeric", "question": "Temperatura ambiente medida en el sector (°C):", "required": true}, {"type": "numeric", "question": "Humedad relativa medida en el sector (%):", "required": false}, {"type": "text", "question": "Observaciones sobre calidad del aire específica del sector:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('7354a544-7cdf-4724-99af-c748512763de', 'Inspección Diaria de Montacargas en Almacén de Materias Primas', 'Verificación de seguridad en operación de montacargas y manejo de materiales', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿El montacargas pasa revisión preoperacional diaria (frenos, dirección, luces)?", "required": true}, {"type": "yes_no", "question": "¿El operador tiene licencia vigente y EPP completo (casco, chaleco, botas)?", "required": true}, {"type": "yes_no", "question": "¿La carga está estabilizada y dentro de los límites de capacidad?", "required": true}, {"type": "numeric", "question": "Velocidad máxima operativa en pasillos (km/h):", "required": false}, {"type": "yes_no", "question": "¿Existen puntos ciegos señalizados en intersecciones de pasillos?", "required": true}, {"type": "numeric", "question": "Horas de operación del montacargas (para mantenimiento programado):", "required": false}, {"type": "text", "question": "Observaciones sobre operación segura de montacargas:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('86b1640f-e500-432a-9fdc-fb718b385e4b', 'Auditoría de Contratistas en Sectores Específicos', 'Evaluación de cumplimiento de seguridad por contratistas según sector de trabajo', 'auditoria', 't', '[{"type": "yes_no", "question": "¿Los contratistas tienen permiso específico para el sector donde trabajan?", "required": true}, {"type": "yes_no", "question": "¿Su EPP es adecuado para los riesgos específicos del sector?", "required": true}, {"type": "yes_no", "question": "¿Realizaron análisis de riesgos específico para la actividad en el sector?", "required": true}, {"type": "select", "options": ["Excelente", "Adecuado", "Deficiente"], "question": "Nivel de conocimiento sobre riesgos específicos del sector:", "required": true}, {"type": "yes_no", "question": "¿Tienen procedimientos escritos para trabajos de alto riesgo en el sector?", "required": true}, {"type": "numeric", "question": "Incidentes o near misses reportados en el sector:", "required": false}, {"type": "text", "question": "Observaciones sobre prácticas de seguridad específicas del sector:", "required": true}, {"type": "text", "question": "Recomendaciones específicas para el sector:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('8f9a6c97-752a-4f95-873f-c594ea171433', 'Evaluación de Riesgos Ergonómicos Específicos por Sector', 'Análisis de condiciones ergonómicas según actividades de cada sector', 'otro', 't', '[{"type": "yes_no", "question": "¿Las estaciones de trabajo están adaptadas a las actividades del sector?", "required": true}, {"type": "yes_no", "question": "¿Existe rotación de puestos para tareas repetitivas en el sector?", "required": false}, {"type": "numeric", "question": "Horas promedio en posición estática por trabajador del sector:", "required": true}, {"type": "select", "options": ["Bajo", "Moderado", "Alto", "Muy alto"], "question": "Nivel de reportes de molestias musculoesqueléticas en el sector:", "required": true}, {"type": "yes_no", "question": "¿Existen pausas activas específicas para las actividades del sector?", "required": true}, {"type": "numeric", "question": "Nivel de iluminación específico para actividades del sector (lux):", "required": false}, {"type": "text", "question": "Recomendaciones ergonómicas específicas para el sector:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('a495bc4f-4be1-423b-8db4-d56145cf9033', 'Inspección Semanal de Herramientas Eléctricas por Sector', 'Revisión de herramientas eléctricas según uso específico en cada sector', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿Las herramientas eléctricas tienen etiqueta de inspección vigente para el sector?", "required": true}, {"type": "yes_no", "question": "¿Los cables y conexiones son adecuados para el ambiente del sector?", "required": true}, {"type": "select", "options": ["Óptimo", "Requiere mantenimiento", "Defectuoso"], "question": "Estado de las herramientas según frecuencia de uso en el sector:", "required": true}, {"type": "yes_no", "question": "¿Existe programa de mantenimiento preventivo específico para herramientas del sector?", "required": true}, {"type": "yes_no", "question": "¿Los usuarios tienen capacitación específica para herramientas del sector?", "required": true}, {"type": "numeric", "question": "Cantidad de herramientas eléctricas inventariadas en el sector:", "required": true}, {"type": "text", "question": "Observaciones sobre condiciones específicas de herramientas en el sector:", "required": false}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('a7cc9617-49d4-41c8-8931-370c24f74e03', 'Inspección Mensual de Laboratorio de Control de Calidad', 'Verificación de seguridad en manejo de reactivos químicos y equipos de laboratorio', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿Todas las sustancias químicas están etiquetadas con nombre y riesgos?", "required": true}, {"type": "yes_no", "question": "¿Las hojas de datos de seguridad (HDS) están disponibles y actualizadas?", "required": true}, {"type": "yes_no", "question": "¿Las campanas de extracción funcionan correctamente (velocidad mínima 0.5m/s)?", "required": true}, {"type": "select", "options": ["Completo y disponible", "Incompleto", "Faltante"], "question": "Estado del equipo de protección personal específico para laboratorio:", "required": true}, {"type": "yes_no", "question": "¿Existe ducha lavaojos operativa a menos de 10 segundos de cualquier punto?", "required": true}, {"type": "numeric", "question": "Cantidad de reactivos químicos inventariados:", "required": false}, {"type": "text", "question": "Observaciones sobre condiciones de seguridad en laboratorio:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('ae0f74ca-79d1-4ee4-9d72-592f31f98c3d', 'Auditoría de Cumplimiento NOM por Sector Específico', 'Verificación de cumplimiento normativo según riesgos específicos de cada sector', 'auditoria', 't', '[{"type": "yes_no", "question": "¿El sector cuenta con análisis de riesgos específicos según NOM-030?", "required": true}, {"type": "yes_no", "question": "¿El personal del sector tiene capacitación específica según NOM-017 (EPP)?", "required": true}, {"type": "yes_no", "question": "¿Existen procedimientos específicos para el sector según NOM-026 (señalización)?", "required": true}, {"type": "select", "options": ["Total", "Parcial", "Deficiente"], "question": "Nivel de cumplimiento de NOM específicas para riesgos del sector:", "required": true}, {"type": "yes_no", "question": "¿Se realizan mediciones ambientales específicas para el sector (ruido, químicos)?", "required": false}, {"type": "numeric", "question": "Número de no conformidades encontradas en auditorías previas del sector:", "required": false}, {"type": "text", "question": "Observaciones sobre brechas normativas específicas del sector:", "required": true}, {"type": "text", "question": "Evidencias de cumplimiento específicas del sector:", "required": false}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('d89f2f6f-5c70-4ce0-ba6d-6f17a22e4aa9', 'Control de Sustancias Químicas en Laboratorio y Pintura', 'Verificación de almacenamiento y manejo seguro de productos químicos en áreas específicas', 'inspeccion', 't', '[{"type": "yes_no", "question": "¿Los productos incompatibles están separados según normativa NOM-018-STPS?", "required": true}, {"type": "yes_no", "question": "¿Los contenedores tienen etiquetas originales con pictogramas GHS?", "required": true}, {"type": "yes_no", "question": "¿Existe inventario actualizado de productos químicos con fechas de caducidad?", "required": true}, {"type": "select", "options": ["Óptimo", "Requiere mantenimiento", "Deficiente"], "question": "Estado de los gabinetes de seguridad para químicos:", "required": true}, {"type": "yes_no", "question": "¿Los derrames pequeños tienen kits de contención disponibles?", "required": true}, {"type": "numeric", "question": "Número de productos químicos con HDS disponible:", "required": true}, {"type": "text", "question": "Productos que requieren atención especial (caducados o sin HDS):", "required": false}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('e18e4bdf-95fb-4482-976d-3ae3cb26ddad', 'Revisión Mensual de Equipo Contra Incendio por Sector', 'Verificación de equipo contra incendios según riesgos específicos de cada sector', 'epp', 't', '[{"type": "yes_no", "question": "¿Los extintores son del tipo correcto para los riesgos del sector?", "required": true}, {"type": "yes_no", "question": "¿Las alarmas y detectores específicos del sector funcionan correctamente?", "required": true}, {"type": "text", "question": "Fecha de última prueba de sistemas automáticos del sector:", "required": false}, {"type": "select", "options": ["Libres y señalizadas", "Parcialmente obstruidas", "Obstruidas"], "question": "Estado de las rutas de evacuación específicas del sector:", "required": true}, {"type": "yes_no", "question": "¿El personal del sector sabe operar el equipo contra incendios específico?", "required": true}, {"type": "numeric", "question": "Cantidad de equipos verificados en el sector:", "required": true}, {"type": "text", "question": "Equipo que requiere mantenimiento específico para riesgos del sector:", "required": false}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00'),
('ffe3451b-835a-403d-b657-5d4606dd1250', 'Inspección de Almacenamiento Seguro por Sector', 'Evaluación de condiciones de almacenamiento según características específicas de cada sector', 'otro', 't', '[{"type": "yes_no", "question": "¿Los materiales están almacenados según riesgos específicos del sector?", "required": true}, {"type": "yes_no", "question": "¿Los pasillos mantienen el ancho mínimo requerido para actividades del sector?", "required": true}, {"type": "yes_no", "question": "¿Los productos químicos o especiales tienen áreas designadas según sector?", "required": true}, {"type": "select", "options": ["Excelente", "Aceptable", "Requiere mejora", "Deficiente"], "question": "Estado general de orden y limpieza específico del sector:", "required": true}, {"type": "yes_no", "question": "¿Existen materiales obsoletos o en desuso que obstruyan operaciones del sector?", "required": true}, {"type": "numeric", "question": "Porcentaje de cumplimiento 5S específico del sector:", "required": true}, {"type": "text", "question": "Áreas críticas de almacenamiento que requieren atención inmediata en el sector:", "required": true}]', NULL, '2025-12-02 03:12:43.041019+00', '2025-12-02 03:12:43.041019+00');






