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
    "position_id" uuid,
    CONSTRAINT "profiles_area_id_fkey" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id"),
    CONSTRAINT "profiles_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."profiles"("id"),
    CONSTRAINT "profiles_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "public"."positions"("id"),
    CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX profiles_user_id_key ON public.profiles USING btree (user_id);
CREATE UNIQUE INDEX profiles_biometric_id_key ON public.profiles USING btree (biometric_id);

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
    CONSTRAINT "inventory_assignments_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id"),
    CONSTRAINT "inventory_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL,
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
    PRIMARY KEY ("id")
);


-- Indices
CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);
CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_username ON public.users USING btree (username);
CREATE INDEX idx_users_status ON public.users USING btree (status);

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
    rp.title AS position_title
   FROM (((attendance_records ar
     LEFT JOIN profiles p ON ((ar.user_id = p.user_id)))
     LEFT JOIN areas a ON ((p.area_id = a.id)))
     LEFT JOIN recruitment_positions rp ON ((p.position_id = rp.id)));

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
CREATE UNIQUE INDEX vacation_balances_user_id_key ON public.vacation_balances USING btree (user_id);

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
    CONSTRAINT "fk_vacation_requests_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id"),
    CONSTRAINT "vacation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_vacation_requests_user_id ON public.vacation_requests USING btree (user_id);
CREATE INDEX idx_vacation_requests_status ON public.vacation_requests USING btree (status);

INSERT INTO "public"."areas" ("id", "name", "description", "parent_area_id", "responsible_id", "status", "created_at", "updated_at") VALUES
('38e040f2-d503-42e1-b8de-be0855aa6fbc', 'General', NULL, NULL, NULL, 'active', '2025-11-25 19:50:06.403307+00', '2025-11-25 19:50:06.403307+00'),
('397b2a1c-6bde-4ee4-a98a-4b0619656617', 'Limpieza', 'XYZ', NULL, NULL, 'activo', '2025-11-25 14:51:37.208935+00', '2025-11-25 19:53:44.882107+00'),
('49625dd9-c73d-4e8d-8d30-8b2789437b6e', 'Desarrollador', 'programar ', NULL, NULL, 'activo', '2025-11-25 06:16:45.371276+00', '2025-11-26 14:22:10.503807+00'),
('5840f5cc-6931-445a-9dab-09054ffd2657', 'finanzas', 'Operaciones', NULL, NULL, 'activo', '2025-11-26 04:58:33.006781+00', '2025-11-26 14:39:56.879341+00'),
('62c9f01b-658d-4365-acdc-7f0159f0e367', 'Marqutink', 'publicidad', NULL, NULL, 'inactivo', '2025-11-25 23:48:09.840033+00', '2025-11-25 23:48:09.840033+00'),
('86b8e7f5-9eae-4205-bb81-2c219e666ff6', 'Programador', 'Programador', NULL, NULL, 'activo', '2025-11-26 14:33:49.396735+00', '2025-11-26 14:40:19.635303+00'),
('bcc63fc7-d92d-4a1b-86a0-f3ce5cb9e465', 'Recursos para desarrollar', 'Minimo 6 meses de experiencia', NULL, NULL, 'activo', '2025-11-28 04:02:19.206564+00', '2025-11-28 04:02:19.206564+00'),
('d25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'Tecnología', NULL, NULL, NULL, 'active', '2025-11-27 02:23:05.983124+00', '2025-11-27 02:23:05.983124+00'),
('fbcfb05d-f7d5-421b-a344-d3bf20c1f235', 'Tecnologia', '', NULL, NULL, 'active', '2025-11-25 05:40:09.682933+00', '2025-11-25 19:53:50.784636+00');
INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at") VALUES
('00a1bab2-c46f-49a4-a654-3c4ecfb89d86', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'empleado', '2025-11-27 05:45:21.394355+00'),
('05399ee5-6ce7-4ea7-b427-5e58c4696dad', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'admin_rrhh', '2025-11-25 19:50:08.118546+00'),
('0fd5413e-196b-4b19-a41d-97dc57ee4007', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'superadmin', '2025-11-25 04:12:17.785215+00'),
('1b6b9c8f-90c8-4f52-bcd1-209a222a7096', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'admin_rrhh', '2025-11-28 06:49:12.830624+00'),
('1e173860-8c96-4587-bf25-85149972bcbf', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'empleado', '2025-11-27 05:39:53.331122+00'),
('1e8a9aba-d4e2-4623-8b74-3ae5af186d59', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'empleado', '2025-11-27 02:06:20.500419+00'),
('2405a1f1-24bd-4725-8024-e9adce4a3aba', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'empleado', '2025-11-27 14:54:31.275688+00'),
('2a3f23f8-e7bf-4abf-8236-4db2d289df7e', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'superadmin', '2025-11-27 04:47:10.936108+00'),
('2cd3f486-2ba2-4cc5-82dc-b1caf192ef1d', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'empleado', '2025-11-26 05:39:41.414378+00'),
('2cd527e7-6a3e-497b-b401-f06cf0c1db35', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'admin_rrhh', '2025-11-27 05:45:20.660529+00'),
('549ed0c5-df9a-44d9-962c-35fd55eea81d', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'empleado', '2025-11-27 05:50:41.526168+00'),
('5cf14f9f-33f5-4523-a853-7e527a61d1a5', '49b38508-cbe2-499e-a01b-04be88aa7528', 'empleado', '2025-11-28 06:35:11.63182+00'),
('64c6c7c2-1e33-4739-a65c-195930bdfa59', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'admin_rrhh', '2025-11-26 05:39:40.711941+00'),
('660d365c-d3b4-45e6-a6d8-b69f72fc9ce5', '4838c265-1c5e-4520-9590-23fd6d4161dc', 'superadmin', '2025-11-27 14:52:31.145017+00'),
('7385dd70-b2cc-4713-9e97-3a71150ca6c2', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'empleado', '2025-11-28 06:49:13.36424+00'),
('7bcca769-2d05-4275-9588-222f37bf852a', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'admin_rrhh', '2025-11-27 14:20:16.035575+00'),
('88ef1a15-7bff-4a6e-a7e5-83b7c9df1657', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'empleado', '2025-11-25 19:56:29.746427+00'),
('8d6f7446-6469-4163-a789-096dca59985e', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'empleado', '2025-11-27 14:21:21.915275+00'),
('9feaff2b-75c5-4d33-83d6-4a4e75f1fcf3', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'superadmin', '2025-11-27 14:12:07.271817+00'),
('b81558f2-6443-4981-9156-dd7e78592275', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'superadmin', '2025-11-27 14:51:18.727229+00'),
('b998ca58-bd78-4be3-a9ca-ba21079dbe58', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'admin_rrhh', '2025-11-27 05:39:52.748746+00'),
('b9bf866e-5103-4418-9201-b1ebf15245df', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'empleado', '2025-11-25 19:50:08.848418+00'),
('c6a73abf-b1d3-41e1-88d2-3c61be17b08d', 'a42350cf-587e-44d9-8590-a6da3511237b', 'superadmin', '2025-11-27 14:51:33.398556+00'),
('d7056bda-7fbc-4b96-8bfc-c21d23bc54ac', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'admin_rrhh', '2025-11-27 05:50:40.902281+00'),
('d81b8daa-7a9c-4d86-8fbd-f37cbbc420d4', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'admin_rrhh', '2025-11-26 14:33:29.08695+00'),
('dbff3ca4-a05f-46e0-a68b-dfed92a9593b', '49b38508-cbe2-499e-a01b-04be88aa7528', 'admin_rrhh', '2025-11-28 06:35:10.973755+00'),
('df8e72b4-70f9-47b3-95d7-774b172dcb25', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'admin_rrhh', '2025-11-25 19:56:29.108304+00'),
('f8c81c47-eb51-42cf-9d58-741506515afd', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'admin_rrhh', '2025-11-27 14:54:30.397075+00');
INSERT INTO "public"."user_sessions" ("id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "last_active_at") VALUES
('05f6ce23-fe30-4aea-8c22-39de314d092c', 'a402caa2-bbee-4681-b941-0a0e48237f09', '410d8615-464a-4d04-9bc6-0ce827cf6622', '2025-11-27 01:18:28.867+00', NULL, NULL, '2025-11-26 01:18:28.926686+00', '2025-11-26 01:18:28.926686+00'),
('076777b8-5dff-47c5-853d-8a758c6a7b3e', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7615c3bb-d1a7-4291-b576-da1e7446e236', '2025-11-27 05:57:40.556+00', NULL, NULL, '2025-11-26 05:57:40.609694+00', '2025-11-26 05:57:40.609694+00'),
('099d79d9-1123-4dea-93a6-b83203d6e4e8', 'a402caa2-bbee-4681-b941-0a0e48237f09', '3f1370f9-5c08-4d73-93a0-09f9974e0bff', '2025-11-28 14:32:40.726+00', NULL, NULL, '2025-11-27 14:32:40.782199+00', '2025-11-27 14:32:40.782199+00'),
('133e94c3-e1f8-40f1-8200-db11e665df2b', 'a402caa2-bbee-4681-b941-0a0e48237f09', '8adc8220-eb62-4615-8ae8-ecdb1897b049', '2025-11-28 13:50:50.95+00', NULL, NULL, '2025-11-27 13:50:50.999301+00', '2025-11-27 13:50:50.999301+00'),
('1966d473-c220-49e4-b6df-f9c06a92c3dd', 'a402caa2-bbee-4681-b941-0a0e48237f09', '350cf54d-ce7e-4d2f-b08d-c76ba2fbb6df', '2025-11-28 05:18:55.397+00', NULL, NULL, '2025-11-27 05:18:55.454457+00', '2025-11-27 05:18:55.454457+00'),
('1ac6e5ff-7b2a-4465-91fd-d5fd81863c0b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b92055bd-931a-483a-a3b9-16ea985fec5b', '2025-11-27 14:11:59.298+00', NULL, NULL, '2025-11-26 14:11:59.355298+00', '2025-11-26 14:11:59.355298+00'),
('27a6f084-5e61-44c0-aae5-d0377ffac925', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'd4569728-b445-48a4-a3eb-5c4ecdc7cc00', '2025-11-28 15:23:46.189+00', NULL, NULL, '2025-11-27 15:23:46.250428+00', '2025-11-27 15:23:46.250428+00'),
('2bcfa079-cd21-407e-8efb-363e0ac59172', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'fcd99708-e055-4d43-9f55-ea99ef824465', '2025-11-27 01:16:38.493+00', NULL, NULL, '2025-11-26 01:16:38.545932+00', '2025-11-26 01:16:38.545932+00'),
('304758d5-1c3d-431f-8385-a80f2b033e0a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f12316be-4dd4-4a5d-a1b4-61434c9134d6', '2025-11-29 14:58:50.867+00', NULL, NULL, '2025-11-28 14:58:50.93811+00', '2025-11-28 14:58:50.93811+00'),
('30a645c3-8eae-42b2-b942-fcbd7cbff609', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f5437086-fda3-47d6-8711-e0536549472d', '2025-11-27 15:58:54.444+00', NULL, NULL, '2025-11-26 15:58:54.498067+00', '2025-11-26 15:58:54.498067+00'),
('354804ae-eca7-4f6d-b89c-289d152b7447', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b6894a49-7004-4cb9-9eb5-a7863c200312', '2025-11-27 14:51:48.328+00', NULL, NULL, '2025-11-26 14:51:48.382042+00', '2025-11-26 14:51:48.382042+00'),
('36fffce5-4d06-44c9-b56b-3728c5a3792d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'fe5dcbc0-00db-44fb-8ef4-2846080bb2ec', '2025-11-28 13:59:23.488+00', NULL, NULL, '2025-11-27 13:59:23.56189+00', '2025-11-27 13:59:23.56189+00'),
('393f51cd-7314-4036-a8f2-625b85671763', 'a402caa2-bbee-4681-b941-0a0e48237f09', '097c8974-51d7-4042-8b09-4fd073b82acb', '2025-11-29 05:19:05.191+00', NULL, NULL, '2025-11-28 05:19:05.27627+00', '2025-11-28 05:19:05.27627+00'),
('3aa31c24-b941-42ce-a801-aeee9bbeabbc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e23a2fa5-692c-4485-937a-2959bbf1a70b', '2025-11-29 11:26:52.606+00', NULL, NULL, '2025-11-28 11:26:52.694753+00', '2025-11-28 11:26:52.694753+00'),
('44056999-ffcc-4501-8031-3cf4c472aa79', 'a402caa2-bbee-4681-b941-0a0e48237f09', '101b726e-abdd-41ca-a793-acfb2d95ffb6', '2025-11-28 06:33:19.205+00', NULL, NULL, '2025-11-27 06:33:19.276397+00', '2025-11-27 06:33:19.276397+00'),
('4618269a-e2b7-42d4-a14e-5e7f6ee21716', 'a402caa2-bbee-4681-b941-0a0e48237f09', '85adc694-d303-4c9b-a704-5cfe75a3ef31', '2025-11-26 14:58:31.583+00', NULL, NULL, '2025-11-25 14:58:31.604014+00', '2025-11-25 14:58:31.604014+00'),
('4b49a35c-4edf-4d58-9d16-56dfdfcf2b44', 'a402caa2-bbee-4681-b941-0a0e48237f09', '430091ff-0520-40db-8b17-b7327334d5f5', '2025-11-28 14:04:33.465+00', NULL, NULL, '2025-11-27 14:04:33.533165+00', '2025-11-27 14:04:33.533165+00'),
('4d2d0fa4-5cc0-4146-bf2a-3f3ec4ae856a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a2246ef0-e98d-4cae-987d-7dc155f20afb', '2025-11-28 14:15:21.759+00', NULL, NULL, '2025-11-27 14:15:21.821197+00', '2025-11-27 14:15:21.821197+00'),
('51108f6b-a1bb-4313-bcfd-5ad95bfe71ba', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b54bc893-30da-4222-9a28-06c9b18a4f99', '2025-11-27 14:56:20.413+00', NULL, NULL, '2025-11-26 14:56:20.475413+00', '2025-11-26 14:56:20.475413+00'),
('5312ecd0-1b67-4f91-996a-2458d82e7539', 'a402caa2-bbee-4681-b941-0a0e48237f09', '8ce74f6b-df60-4447-9813-7ba0650e64f5', '2025-11-27 03:55:06.476+00', NULL, NULL, '2025-11-26 03:55:06.530202+00', '2025-11-26 03:55:06.530202+00'),
('54fa6946-3cd1-45f8-916d-61cd438fa805', '3085a308-c2af-4c71-b39d-613c3134d0d6', '8dc27f7f-f2bf-4002-b85e-8e7febcc73a0', '2025-11-28 14:47:26.99+00', NULL, NULL, '2025-11-27 14:47:27.055194+00', '2025-11-27 14:47:27.055194+00'),
('55fb242c-8bfe-4ec1-ad37-acc45209f4d6', 'a402caa2-bbee-4681-b941-0a0e48237f09', '13e22783-38bf-43c4-86ca-638f53591d9a', '2025-11-26 14:51:28.418+00', NULL, NULL, '2025-11-25 14:51:28.468229+00', '2025-11-25 14:51:28.468229+00'),
('5a00a52f-aac4-438f-bdd1-d7358706bc5e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd4ff8267-3ca5-47f9-b5e5-8778a659e244', '2025-11-27 15:07:42.236+00', NULL, NULL, '2025-11-26 15:07:42.294402+00', '2025-11-26 15:07:42.294402+00'),
('5a2f2a13-23f1-448b-970c-05effc0449bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b47b23fa-acfb-4fe2-8871-470fabbb9434', '2025-11-27 14:31:42.432+00', NULL, NULL, '2025-11-26 14:31:42.484336+00', '2025-11-26 14:31:42.484336+00'),
('6074f142-43c2-4586-a7ce-4220a09e6d29', 'a402caa2-bbee-4681-b941-0a0e48237f09', '545a79d5-9073-4148-9eca-bdf39214637d', '2025-11-27 01:39:42.753+00', NULL, NULL, '2025-11-26 01:39:42.813038+00', '2025-11-26 01:39:42.813038+00'),
('62fb4872-646c-48d5-aa8b-3c446aae9750', 'a402caa2-bbee-4681-b941-0a0e48237f09', '6bda1f85-ad2e-4655-89fd-1904b00985ae', '2025-11-27 01:53:37.315+00', NULL, NULL, '2025-11-26 01:53:37.374124+00', '2025-11-26 01:53:37.374124+00'),
('6b8a0b41-3228-448a-b4e5-3298395c0655', 'a402caa2-bbee-4681-b941-0a0e48237f09', '1b2fc708-ff06-42ee-b4df-3a2349b8a5c6', '2025-11-28 13:53:03.221+00', NULL, NULL, '2025-11-27 13:53:03.285644+00', '2025-11-27 13:53:03.285644+00'),
('707b7bfb-1e01-49d6-8a68-31c7e17dc477', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'bb526ef4-a5c7-4e18-ac2c-dc96d14f94b1', '2025-12-01 16:39:20.042+00', NULL, NULL, '2025-11-30 16:39:20.126188+00', '2025-11-30 16:39:20.126188+00'),
('72169579-a092-4840-8241-e01ce86ee6fd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b783fdb1-64ff-4df2-9d89-8d6e0e07bb81', '2025-11-27 14:29:51.034+00', NULL, NULL, '2025-11-26 14:29:51.106882+00', '2025-11-26 14:29:51.106882+00'),
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
('bb68edeb-1898-4095-bf04-a2f013792b16', 'a402caa2-bbee-4681-b941-0a0e48237f09', '5d917ec9-82b9-408a-9999-28c206333f99', '2025-11-26 14:49:17.156+00', NULL, NULL, '2025-11-25 14:49:17.189549+00', '2025-11-25 14:49:17.189549+00'),
('c5cca38b-8346-4efc-b302-8709bf897b14', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7f851c07-1bbe-4d23-8017-70bde793aa44', '2025-11-26 19:30:10.75+00', NULL, NULL, '2025-11-25 19:30:10.829184+00', '2025-11-25 19:30:10.829184+00'),
('c65d1b6c-6088-46e2-8a01-da0f8a4273ff', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7e21b7a7-b35e-4e28-a3cd-dad93e35d8d8', '2025-11-27 15:05:03.654+00', NULL, NULL, '2025-11-26 15:05:03.698419+00', '2025-11-26 15:05:03.698419+00'),
('c7663888-f8fd-4771-b3a1-262aa5568ff7', 'a402caa2-bbee-4681-b941-0a0e48237f09', '346604d5-1a2b-4e47-81a7-efe1bd5ec719', '2025-11-26 19:23:59.552+00', NULL, NULL, '2025-11-25 19:23:59.605826+00', '2025-11-25 19:23:59.605826+00'),
('cac27267-7586-4e71-a7f3-5aa3397a2f17', 'a402caa2-bbee-4681-b941-0a0e48237f09', '42d6964a-6ced-46f1-a137-0a311cf5fabc', '2025-11-27 14:37:14.698+00', NULL, NULL, '2025-11-26 14:37:14.758088+00', '2025-11-26 14:37:14.758088+00'),
('cfdc53ef-a2e3-412d-9bd7-c9d601440276', 'a402caa2-bbee-4681-b941-0a0e48237f09', '0f1e67d6-8f86-4c56-8658-dec6a383a0f5', '2025-11-28 14:35:39.612+00', NULL, NULL, '2025-11-27 14:35:39.678205+00', '2025-11-27 14:35:39.678205+00'),
('d0354019-2f4e-4c2b-b712-dc0096df832a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e88b1058-ca6e-4f6f-8745-ec623d1ce6f4', '2025-11-27 14:48:34.827+00', NULL, NULL, '2025-11-26 14:48:34.884567+00', '2025-11-26 14:48:34.884567+00'),
('d178f77d-ba74-43b7-a756-e27babf32824', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd7b24aab-f2f8-4f8d-9354-32eec8352a5b', '2025-11-26 14:52:05.174+00', NULL, NULL, '2025-11-25 14:52:05.246784+00', '2025-11-25 14:52:05.246784+00'),
('d5249715-983c-485f-bedf-5506e887eaa7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a177ccf3-d5a9-4046-a46b-d50ea1a43e42', '2025-11-28 00:49:57.084+00', NULL, NULL, '2025-11-27 00:49:57.136105+00', '2025-11-27 00:49:57.136105+00'),
('d7d4a7d2-78eb-468a-a852-9f3eccefcce0', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', '0d9a1330-78d9-4db9-9daf-cc0671c8140f', '2025-11-28 14:51:50.064+00', NULL, NULL, '2025-11-27 14:51:50.132581+00', '2025-11-27 14:51:50.132581+00'),
('ded0b65b-5177-4ec8-b945-1cab4f2eaa31', 'a402caa2-bbee-4681-b941-0a0e48237f09', '4d11262a-f1a2-4d38-ad5a-194a67214564', '2025-11-26 14:50:51.562+00', NULL, NULL, '2025-11-25 14:50:51.584927+00', '2025-11-25 14:50:51.584927+00'),
('e1d7deea-cd09-4fcf-a06d-1abda2f8d8aa', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2deadecf-586b-45e0-89ff-bd4bf7306325', '2025-11-26 14:53:08.002+00', NULL, NULL, '2025-11-25 14:53:08.05661+00', '2025-11-25 14:53:08.05661+00'),
('ebc2fdf5-0600-4fd6-aeac-3ddd0d448a99', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b5b48e5c-c613-4bec-a43a-88d7cc088304', '2025-11-27 14:34:53.389+00', NULL, NULL, '2025-11-26 14:34:53.449222+00', '2025-11-26 14:34:53.449222+00'),
('f032d2be-dde8-4101-af0e-54b90c05ab4c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ca0dc5a8-b91c-4b07-89df-722241bbf241', '2025-11-28 14:24:49.433+00', NULL, NULL, '2025-11-27 14:24:49.494674+00', '2025-11-27 14:24:49.494674+00'),
('f1843f16-5c4e-41e2-a81c-24b4bb9127d0', 'a402caa2-bbee-4681-b941-0a0e48237f09', '1a9abfb8-8109-46a8-b9da-47dde7ce7f52', '2025-11-29 14:34:50.647+00', NULL, NULL, '2025-11-28 14:34:50.720285+00', '2025-11-28 14:34:50.720285+00'),
('f5760648-cc51-4fd2-8adf-a8fa12a517ed', 'a402caa2-bbee-4681-b941-0a0e48237f09', '9d6180dc-5d22-449d-b206-e4e2e366132f', '2025-11-28 14:31:06.388+00', NULL, NULL, '2025-11-27 14:31:06.411981+00', '2025-11-27 14:31:06.411981+00'),
('fd4f04bf-072b-4c06-a17f-1c3f8427389b', 'a402caa2-bbee-4681-b941-0a0e48237f09', '803f6d22-4136-4bf6-b600-45d5543b4969', '2025-11-29 06:25:01.149+00', NULL, NULL, '2025-11-28 06:25:01.268186+00', '2025-11-28 06:25:01.268186+00');
INSERT INTO "public"."attendance_records" ("id", "user_id", "attendance_date", "scheduled_start", "scheduled_end", "check_in", "check_out", "status", "minutes_late", "notes", "created_at", "updated_at") VALUES
('2eed7052-f097-45da-8ad6-3b8009703b77', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:59:31.348+00', NULL, 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:59:31.493131+00', '2025-11-27 14:59:31.493131+00'),
('4b7b8061-93ba-45d4-9621-62d98b20c29b', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-26', '09:00:00', '18:00:00', '2025-11-26 12:35:00+00', '2025-11-27 02:36:00+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 02:35:54.105325+00', '2025-11-27 04:24:00.099699+00'),
('b3f50503-c985-461b-a80c-d9a80cdab617', '70b537f6-db5e-48d3-86ee-7a280655aba5', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:55:55.01+00', '2025-11-27 14:56:15.259+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:55:55.159199+00', '2025-11-27 14:56:15.4245+00'),
('c9a06449-524a-454c-ae14-bd7dd5fb99e3', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-26', '09:00:00', '18:00:00', '2025-11-27 05:49:00+00', '2025-11-27 04:17:00+00', 'tarde', 889, 'Biometric: ESP32-001', '2025-11-27 02:49:07.744723+00', '2025-11-27 04:23:50.995446+00'),
('e30f17b5-2797-4305-badd-bf9fa71fb4e7', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:23:13.808+00', '2025-11-27 14:24:24.95+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:23:13.974361+00', '2025-11-27 14:24:25.099088+00'),
('fd17d1e9-d1d1-4ecf-a552-3c5418caa55f', '26edb037-5f42-40f3-9067-6da8aafa4acd', '2025-11-27', '09:00:00', '18:00:00', '2025-11-27 14:58:51.219+00', '2025-11-27 14:59:03.37+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 14:58:51.365773+00', '2025-11-27 14:59:03.508726+00');
INSERT INTO "public"."profiles" ("id", "user_id", "full_name", "email", "phone", "address", "birth_date", "hire_date", "department", "position", "manager_id", "status", "avatar_url", "emergency_contact_name", "emergency_contact_phone", "must_change_password", "biometric_id", "created_at", "updated_at", "area_id", "position_id") VALUES
('090a43b4-c8f3-46ed-bd7c-d7ecc51ab98f', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'Recluta', 'recluta@prueba.com', '7351238231', 'Morelos', NULL, '2025-11-27', 'Tecnología', 'Desarollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-27 05:45:21.177487+00', '2025-11-27 05:45:21.177487+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'd0287626-7d61-4a31-9b50-c18c237783cb'),
('3081c8a8-cb3e-48a9-ab3f-b543b60741e0', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'prueba', 'prueba@gmail.com', '3423432354', NULL, NULL, '2025-11-28', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-28 06:49:13.244488+00', '2025-11-28 06:49:13.244488+00', '38e040f2-d503-42e1-b8de-be0855aa6fbc', '2d56bf86-4046-4af3-8d53-efcb24c06e61'),
('38e741fe-22b2-43fe-adde-a2d0662bd275', '49b38508-cbe2-499e-a01b-04be88aa7528', 'Barco Hernandez Oscar Gael', 'oscar@gmail.com', '4324234232', 'México', NULL, '2025-11-28', 'Tecnología', 'Desarrollador junior', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-28 06:35:11.450824+00', '2025-11-28 06:35:11.450824+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', NULL),
('417b328c-2be2-49b7-8c69-32fad3af1e9a', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'Juan', 'pedro@gmail.com', '7352061792', 'Yautepec, Mor.', NULL, '2025-11-27', 'Tecnología', 'Desarrollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-25 19:56:29.559916+00', '2025-11-27 14:48:22.107646+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', '53e8644c-02cb-42a9-a4fa-00ba84d912a5'),
('728b3dde-c8e1-43f6-9018-42bf921e1662', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'Nombre Completo', 'usuario@ejemplo.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-11-25 04:12:17.785215+00', '2025-11-25 05:22:36.766268+00', NULL, NULL),
('7b9cbe27-1582-4aed-adcc-bf2f911385d1', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'Irvin Sahi Sedeño Trujillo', 'irvin@gmail.com', '34545653', NULL, NULL, '2025-11-27', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 8, '2025-11-26 14:36:26.451117+00', '2025-11-27 02:36:18.499251+00', '49625dd9-c73d-4e8d-8d30-8b2789437b6e', NULL),
('80b4d813-2b19-452f-a112-76b665db298b', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'Emmanuel Saliff Vallecillo Alvarado', 'emmanuel.esva@gmail.com', '743263742', 'Mexico', NULL, '2025-11-27', 'Tecnología', 'Desarrollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-27 05:39:53.211374+00', '2025-11-27 05:39:53.211374+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', '53e8644c-02cb-42a9-a4fa-00ba84d912a5'),
('9dd44ed0-6a95-4894-a119-02de50a26d13', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'Barco Hernandez', 'chito@talento.com', '8324893482', 'Mexico', NULL, '2025-11-25', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 1, '2025-11-25 19:50:08.703749+00', '2025-11-26 01:28:12.745545+00', NULL, NULL),
('a00dbd07-d165-45ce-aead-31f27a328758', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'Arizbeth Cabrera M', 'a@aa.com', '123456789', NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-11-27 14:51:19.523235+00', '2025-11-27 14:51:19.879+00', NULL, NULL),
('a91622a7-24b9-40f7-b9b0-d632254ac51b', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'Pedro Picapidra', 'pedro.picapidra@gmail.com', '234234', 'Ni idea', NULL, '2025-11-27', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-27 05:50:41.378448+00', '2025-11-27 05:50:41.378448+00', '38e040f2-d503-42e1-b8de-be0855aa6fbc', '2d56bf86-4046-4af3-8d53-efcb24c06e61'),
('c972c4ca-d719-4536-8b02-a331f2b1240d', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'Emmanuel Saliff Vallecillo Alvarado', 'emmanuel@gmail.com', '7362932712', 'México', NULL, '2025-11-27', 'Tecnología', 'Desarrollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-26 05:39:41.242551+00', '2025-11-27 03:06:11.90977+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', NULL),
('d3ed8271-a766-4dfc-9b28-5dc55093fe29', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'Uriel Francisco Lopez Rios', 'uriel.rios@gmail.com', '7352638193', 'México', NULL, '2025-11-27', 'Tecnología', 'Desarrollador junior', NULL, 'activo', NULL, NULL, NULL, 't', 9, '2025-11-27 14:21:21.586078+00', '2025-11-27 14:23:01.249915+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'd0287626-7d61-4a31-9b50-c18c237783cb'),
('f143cf4a-58c5-4834-af27-3dc3ac12dcce', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'Gerardo Guzman', 'gera.guzman@gmail.com', '3273929028', 'México', NULL, '2025-11-27', 'Tecnología', 'Desarollador Web', NULL, 'activo', NULL, NULL, NULL, 't', 10, '2025-11-27 14:54:31.015229+00', '2025-11-27 16:00:10.324674+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'd0287626-7d61-4a31-9b50-c18c237783cb');
INSERT INTO "public"."audit_logs" ("id", "user_id", "action", "table_name", "record_id", "old_values", "new_values", "ip_address", "user_agent", "created_at") VALUES
('05f05938-4d8d-430b-a21d-34e57630fc3f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a175e709-3c7f-40d4-8680-638c89713a4a', '{"deleted_at": "2025-11-27T03:45:40.660374+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 03:45:40.660374+00'),
('079b1b53-b859-42da-b15c-ba36fde301cc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'b861899c-8039-4812-9e29-66f7042924f5', '{"deleted_at": "2025-11-26T04:48:50.231947+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:48:50.231947+00'),
('14c57124-389e-4d58-962c-6bb60db5668c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '7cf169c3-3c04-4cde-b7fc-9723b04c3eb0', '{"deleted_at": "2025-11-26T04:40:01.201408+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:40:01.201408+00'),
('1feed483-ef1a-408b-ac91-be559fe6c71f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', '{"deleted_at": "2025-11-27T05:45:44.989659+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:45:44.989659+00'),
('40b07c50-f47c-4b09-bb17-f35413dd6176', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'c1b42160-1257-4d48-8223-ee1ae3363ae7', '{"deleted_at": "2025-11-25T14:44:33.616286+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-25 14:44:33.616286+00'),
('42d547a0-7183-472a-b376-29428081803f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'c5183644-6147-4e10-95c8-76e02ff41cad', '{"deleted_at": "2025-11-27T05:38:44.18656+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:38:44.18656+00'),
('42ef09c6-cee8-4ab7-b659-70ff228d3dbe', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '53779886-f93f-4b9d-b43b-52d938a6d846', '{"deleted_at": "2025-11-26T05:39:01.091543+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:39:01.091543+00'),
('468d8759-4517-43b8-8e2e-fa51bb951f20', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'd0c9faab-7fc4-45a6-973a-6a0e7443555e', '{"deleted_at": "2025-11-27T05:27:44.78636+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:27:44.78636+00'),
('53a6bff3-928d-4935-8184-ed53c49ec360', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '20429930-d675-478d-9f73-76b0bb9936ba', '{"deleted_at": "2025-11-26T05:36:08.744373+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:36:08.744373+00'),
('6c28d15b-4561-4d11-8f47-e08f89c9541a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '719b6637-db4a-4d3c-9fbf-1c291c4c9eef', '{"deleted_at": "2025-11-26T05:16:50.529833+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:16:50.529833+00'),
('71867398-fb5b-4d21-a5b1-41e9a6b79022', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '0d74d54e-9b17-412d-a2c7-4c0f8bb6b872', '{"deleted_at": "2025-11-26T14:30:20.416466+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 14:30:20.416466+00'),
('8588b8f5-1164-46d0-9702-7e54b31971ba', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'ef2bcefd-29d3-4675-9873-5964c5103f58', '{"deleted_at": "2025-11-27T05:47:18.83134+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 05:47:18.83134+00'),
('85d64b3d-9d7a-453c-aa88-97a0ad5bce3a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'ddc4194d-0862-47c5-b559-413c339dba4a', '{"deleted_at": "2025-11-26T05:33:04.689682+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:33:04.689682+00'),
('b2ec9d37-600f-4d09-a7e8-b86013ba16b2', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'bb372a87-1ea9-4652-9054-002c00c9066b', '{"deleted_at": "2025-11-26T05:13:24.263693+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:13:24.263693+00'),
('b8820a9a-de40-41f0-a08a-47057d53ff21', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a7cdf496-e1af-4e99-b3d6-4a9531f140ee', '{"deleted_at": "2025-11-26T05:10:02.181119+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:10:02.181119+00'),
('c06a2f92-86e6-4488-82e4-38cc1e43dff3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a7db4fd3-6eee-4b1c-aeb3-f18b64d35a6c', '{"deleted_at": "2025-11-26T04:47:10.955372+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:47:10.955372+00'),
('ca2ae1a0-c5c4-45da-8206-cd4962ce363d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '6bd3fda5-1fd6-442d-bb01-9b3826142ac9', '{"deleted_at": "2025-11-26T04:50:19.427564+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:50:19.427564+00'),
('dc72ed54-98da-4816-82d7-166c5828bd03', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '1b4e17c4-422b-43b5-bbfd-64bca06daad3', '{"deleted_at": "2025-11-26T04:55:00.787496+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:55:00.787496+00'),
('e3ef7780-dcb5-4034-88c2-3494fa741562', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '4acef76d-12e7-45fb-8150-f2c81606b3b5', '{"deleted_at": "2025-11-26T04:37:58.735088+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:37:58.735088+00'),
('f36320f3-a00a-4ac5-a2d9-6dc3e867d675', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'cfbd1d8e-3fea-4cfa-864a-ea9d65a2e65b', '{"deleted_at": "2025-11-26T04:29:58.883016+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:29:58.883016+00');
INSERT INTO "public"."contracts" ("id", "user_id", "contract_number", "type", "position", "department", "start_date", "end_date", "salary", "status", "file_path", "notes", "created_at", "updated_at", "area_id", "position_id", "file_url") VALUES
('2c1d4712-1920-44bf-afeb-430bf3b9b2d2', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-579580-7ww0', 'indefinido', 'Limpieza', 'General', '2025-11-26', NULL, NULL, 'activo', NULL, NULL, '2025-11-26 05:39:41.918256+00', '2025-11-26 05:39:42.856239+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-579580-7ww0.pdf'),
('4d5c51b1-dae9-453d-a921-95419537f106', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'CNT-637559-w8m2', 'indefinido', 'Limpieza', 'General', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:50:41.967459+00', '2025-11-27 05:50:43.092488+00', NULL, NULL, 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d/CNT-637559-w8m2.pdf'),
('52fbd814-79ed-44fc-8be7-7e5bb30883fd', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'CNT-989370-zfh6', 'indefinido', 'Desarrollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:39:53.755204+00', '2025-11-27 05:39:56.195911+00', NULL, NULL, '68baa34b-5143-4551-9aa8-3e9b8880fe81/CNT-989370-zfh6.pdf'),
('6e4c8014-53c9-44ae-83b5-d4bc36c6cb75', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'CNT-283939-1f11', 'indefinido', 'Desarollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 14:54:31.930451+00', '2025-11-27 14:54:33.306453+00', NULL, NULL, '70b537f6-db5e-48d3-86ee-7a280655aba5/CNT-283939-1f11.pdf'),
('760f3700-d151-4607-8af7-2ba33992bf4b', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'CNT-675193-4wm5', 'indefinido', 'Limpieza', 'General', '2025-11-25', NULL, NULL, 'activo', NULL, NULL, '2025-11-25 19:56:30.231991+00', '2025-11-25 19:56:30.231991+00', NULL, NULL, NULL),
('90d4c952-8d08-4089-bcf0-93a4b6e75468', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'CNT-176319-ws75', 'indefinido', 'Limpieza', 'General', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 02:06:20.885948+00', '2025-11-27 02:06:20.885948+00', NULL, NULL, NULL),
('966bee48-7c72-4e3e-b47a-cf90c095fbc3', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'CNT-660526-n6bf', 'indefinido', 'Desarrollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:17:44.979202+00', '2025-11-27 05:17:47.538293+00', NULL, NULL, '85981ed9-2f23-463f-bae7-8e41fe2a033b/CNT-660526-n6bf.pdf'),
('be1710d5-5b9a-4fa0-9249-da39bd72dc69', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-182777-wwtf', 'indefinido', 'Desarrollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 02:23:07.396615+00', '2025-11-27 02:23:07.396615+00', NULL, NULL, NULL),
('c837a4a0-3782-48fa-b37d-578a0fa5269a', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'CNT-407308-rziy', 'indefinido', 'Desarollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 05:45:22.112741+00', '2025-11-27 05:45:22.112741+00', NULL, NULL, NULL),
('dfcba5cc-be54-41a1-9f92-04187e0333a3', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'CNT-546718-sa3c', 'indefinido', 'Limpieza', 'General', '2025-11-28', NULL, NULL, 'activo', NULL, NULL, '2025-11-28 06:49:13.920878+00', '2025-11-28 06:49:15.125025+00', NULL, NULL, 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c/CNT-546718-sa3c.pdf'),
('e019c93a-c9c1-4c80-9ca8-db3b9661efad', '49b38508-cbe2-499e-a01b-04be88aa7528', 'CNT-705006-fykk', 'indefinido', 'Desarrollador junior', 'Tecnología', '2025-11-28', NULL, NULL, 'activo', NULL, NULL, '2025-11-28 06:35:12.246947+00', '2025-11-28 06:35:13.590509+00', NULL, NULL, '49b38508-cbe2-499e-a01b-04be88aa7528/CNT-705006-fykk.pdf'),
('f07d32cf-ea41-4eb5-bc53-e16151103a5e', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'CNT-294865-zczp', 'indefinido', 'Desarrollador junior', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 14:21:22.97153+00', '2025-11-27 14:21:24.256728+00', NULL, NULL, '26edb037-5f42-40f3-9067-6da8aafa4acd/CNT-294865-zczp.pdf');
INSERT INTO "public"."auth_audit" ("id", "user_id", "email", "action", "ip_address", "user_agent", "success", "metadata", "created_at") VALUES
('00260da1-8d6a-4a9d-a930-129270b6493a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:51:48.571203+00'),
('01814298-0064-4608-b8b3-c98ac3824c35', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:48:59.614068+00'),
('02e40eb1-3c29-446b-8a26-61e6ca79ed24', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:15:12.639663+00'),
('0309fcf9-81b5-4736-bb41-32af6c5a16f3', NULL, 'emmanuel.saliff@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:31:52.348112+00'),
('045469d8-6625-4bc9-b7e6-67ba8c1b8153', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:51:28.721351+00'),
('05405cca-3cb5-449d-805e-a0249b911e20', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:27:55.704219+00'),
('066acd4d-e2f7-422d-9b65-93c2f8b09ee3', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:52:45.289435+00'),
('07b6b8e0-4a10-4bf9-a2a2-b4982409cd08', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:47:16.597264+00'),
('08ae9828-423c-47d7-b00d-ba3305126994', '3085a308-c2af-4c71-b39d-613c3134d0d6', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:24:31.705512+00'),
('0d3a0a2f-9c02-4ac9-a5e2-936bfbba674e', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:51:20.882045+00'),
('0e814771-7457-40b4-963c-3fd548c584b4', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:07:15.668959+00'),
('12894326-d237-4692-8d6e-a9bea22fc1ae', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:52:05.458401+00'),
('1295d58a-e4ee-46c8-b9a4-1819352064b2', NULL, 'uri.23@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:20:56.048531+00'),
('12b03cb5-518b-483d-b454-fb236d2217d9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:50:51.660632+00'),
('14885489-b2d9-4699-846b-099efd44b11a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:07:42.49271+00'),
('1701a997-5305-4979-a92b-62fecde47b78', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 05:06:50.665423+00'),
('172883d7-6fa4-4154-a8f2-c2ca903c1c60', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:23:18.366722+00'),
('17b923aa-a9b4-4e09-85c2-d4eb430d5611', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:12:59.82299+00'),
('18dc8f01-391d-4f73-86a8-2fd3f2e34590', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 04:24:25.472819+00'),
('1905a66c-039f-40f7-9531-1a4b10ff7a1e', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:47:27.251433+00'),
('1a361f6e-5c1b-4cee-bc8a-843fe62fc72a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:59:23.813824+00'),
('1ab43b8f-df58-447a-9c33-331f585892a1', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 05:02:52.176374+00'),
('1d8f268a-6e11-4894-b642-62efb571751b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 13:22:48.894983+00'),
('1da78723-510c-4421-95ed-abfc3bea9ff2', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:12:07.376832+00'),
('1f60a1ce-6d0e-4ce6-8602-a8a7619e890c', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:14:22.478631+00'),
('209c9c43-5962-44fc-a19d-2e7ca912ebbc', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 05:02:46.030373+00'),
('2372da16-6735-4be4-b1a9-0624e76b0e39', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 13:22:33.067522+00'),
('240c287b-0159-4a89-8988-560a1eec8134', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:35:52.016463+00'),
('25d1fb11-cb00-41bc-8b33-0f146245483d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 14:58:51.186793+00'),
('2905c99b-be80-41bd-86d8-afac4a0cd286', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:05:03.799648+00'),
('2ad988ff-2404-4b25-a944-95d81212dabd', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'chito@talento.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 19:50:08.345902+00'),
('2f1e6cad-8247-48bd-95d5-30e05f083b3d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:54.700893+00'),
('303a66e4-f8b6-4edc-9eff-04ce6de1fbaa', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:10:50.332107+00'),
('303e86e3-59e9-481b-be94-461947520bcc', '6f69105d-8e5f-4892-a5b6-494726ee768a', 'recluta@prueba.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:45:20.692976+00'),
('305190ec-ba4e-4ec6-9ec0-9cb8070400ad', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:25.827315+00'),
('30880df1-56cc-4650-b382-2d8a2d26f428', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'emmanuel.esva@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:39:52.894704+00'),
('30cfb81d-9a6e-4ce6-bae9-f25222d7523e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-30 16:39:20.431617+00'),
('3128b317-e5e6-4baa-9fd7-d1d0b6ec5f66', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-28 02:02:21.929424+00'),
('3181818d-68d7-4a9d-9dbb-57cc46c8e953', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:14.43474+00'),
('32c7b5b6-2cf0-426d-bb8f-bf01571bd0bf', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 14:19:55.527961+00'),
('330497d9-32e6-4b22-b830-84b877eca2a7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-25 14:46:38.896523+00'),
('33a3cc76-89c0-4422-838c-b38d2c018ba7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:50:00.768195+00'),
('348952a5-356c-4ced-af2b-89260541eb3f', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-27 14:14:50.117536+00'),
('3620080b-6e4c-42d4-be13-3111bcebd8bf', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:51:50.339126+00'),
('36571150-6b7e-4fb0-a8a8-7b9b3bc72715', NULL, 'Baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:40.566928+00'),
('39883697-f23f-4838-8a75-4bca2245abb3', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:36:12.012745+00'),
('39ae8086-3359-4b8d-b20f-b5a58831f55a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:23:59.720674+00'),
('3a8fcc11-1d0a-4c56-8cbd-23d2dc879890', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-26 00:12:37.260287+00'),
('3af7721f-d4a7-4a30-a2a3-7e897ac32e5f', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:26:52.196594+00'),
('3b79639d-e3a5-4ff3-a8ce-59c97f388910', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'pedro.picapidra@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 05:50:41.002865+00'),
('3bc2fc48-ee41-4e38-ab38-6dd6ff9417cf', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:06:25.76248+00'),
('3e7a62a1-9731-46a9-be44-924bb3d4b79e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:25:59.877241+00'),
('3f7e67eb-e6ec-4877-ac1b-2da85dfc912a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:50:51.184809+00'),
('41c0506c-5acc-4829-9380-6c6f1b227e1f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:47:01.89929+00'),
('439d1f74-0366-4f13-8c27-3958ada8de0d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:18:29.132121+00'),
('44dc52d5-769e-4fdc-8166-0eaf93d4d847', '9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:51:18.827907+00'),
('45432dbf-80ef-431e-8cd5-81095814cda5', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:49:28.344334+00'),
('4586ec0e-c2cb-4577-a5a9-351101b15421', '49b38508-cbe2-499e-a01b-04be88aa7528', 'oscar@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-28 06:35:11.08377+00'),
('49528aab-bdf7-4e00-91e7-7917b111c2d4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:15:22.009225+00'),
('4c8c46ad-a37f-456d-860e-28072aaeb943', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 3}', '2025-11-27 14:39:59.329215+00'),
('4d040261-c16c-404c-8ee6-3299430c0811', NULL, 'usuario_ejemplo ', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:48:04.01368+00'),
('4ea73cf1-0d10-4b5a-8dda-e8be0838c22d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 00:49:57.271644+00'),
('4eb80e8c-ed16-44ec-944a-c22f85c5e2e0', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:39:40.813255+00'),
('4f0afa7f-02f9-414c-abfa-a96aaf117f62', '4838c265-1c5e-4520-9590-23fd6d4161dc', 'daniel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:52:31.193548+00'),
('500b2aab-cffe-4a25-b78e-1ff576337c32', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:08:46.949953+00'),
('53210da1-dd2d-4154-b811-bda6fec14299', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 15:02:15.367951+00'),
('54e19926-da4d-4e63-99d2-0909de8de41c', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-27 14:14:40.425453+00'),
('55054db0-cd6d-4a41-bc4f-fc7f336a466f', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:36:57.503524+00'),
('5719b1a2-ad67-4098-96e8-d0c1a0e6fb78', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 05:55:32.050886+00'),
('57bef152-a181-4b0a-9477-6223ff2dc6bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 04:18:32.308637+00'),
('59a8a1dd-f20f-4bd7-9e83-54b058d0604e', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'gera.guzman@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:54:30.489047+00'),
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
('6444ec7f-511f-4706-a503-018b75e75d81', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 11:26:53.0353+00'),
('68b9e9a1-89c1-417a-b99e-800c75f87704', NULL, 'david@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 21:37:25.328475+00'),
('68fdd089-40ab-4bfb-b211-c39fb7d1492f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:35:39.877461+00'),
('69bada82-391d-460b-a910-e0ddf18ba778', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 13:52:37.795008+00'),
('6ad2e94f-ae1c-47fc-9dad-4521d46d4513', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:36:29.213961+00'),
('6c37094d-8301-4a65-8fb3-b446f1db768d', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:58:19.754678+00'),
('6dd9af66-616d-4ff7-ae1b-07bfcea2999f', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-27 14:10:30.966228+00'),
('6df026b3-2ac7-46e5-9f54-2131c6b3e09a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:58:31.668621+00'),
('6e246031-ece8-4870-b171-61834cbee256', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 00:10:50.059187+00'),
('718de33c-2d03-4fa7-bb32-00f689f52b3d', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-27 05:18:48.385338+00'),
('7377064d-b1c0-45b6-ad3d-86d1d265a4e0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 04:39:41.06286+00'),
('771bdd0f-c080-46ea-b202-d01aba9f6e9f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:58:54.688245+00'),
('78dd1a18-282f-430e-80d3-c792b51f223f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:20:04.899927+00'),
('7aecc614-1647-4425-bf91-4a2de0bb892f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:49:17.289067+00'),
('7b457820-2db7-484f-81b8-74531440b661', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:24:49.701983+00'),
('7be45b1f-c68e-4abc-a35d-7c1fdc70b48d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:56:12.428343+00'),
('83d7306b-dd32-43b4-b972-cef016ea4205', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:32:40.964061+00'),
('84decb35-1553-4f50-b896-64bcd5f7afcc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 03:38:40.504146+00'),
('8587ac45-b2ee-40d6-8549-ab4803669ccc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:46:57.493168+00'),
('86a4a73b-1afc-4d8d-b5f3-b8be3970ee8f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:44:51.109256+00'),
('86ec3a55-b66a-4504-acd3-ed2b109ca508', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 05:55:14.661975+00'),
('87dfd1e2-e22e-432e-b4cd-967f9db58dbb', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, 'password_reset', NULL, NULL, 't', '{"reset_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', '2025-11-27 05:02:20.982552+00'),
('89d86b59-2615-4077-88d2-55113e95611a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:33:13.555192+00'),
('89f26f8f-dcfe-41b5-bef7-4125f16677c3', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:37:06.578309+00'),
('8de5aac2-7cea-473a-a5c6-ad4c86274c62', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 03:58:42.594033+00'),
('9044d624-d12b-48ae-ae8a-30842cc5c833', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:11:59.546031+00'),
('9261f3af-15c1-4065-88c0-60bef5580fc4', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:51:40.735266+00'),
('943d6438-d911-4274-bdef-1aedc822880b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:30:11.215468+00'),
('94b3a02e-07b0-4b2f-beeb-295760846df0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:31:06.502113+00'),
('986a05da-31af-4d34-8d64-10d7b4fa11f6', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:33:54.333215+00'),
('9a534336-e2a8-4bc1-981e-fbfc07015772', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:01:30.816815+00'),
('9b1f3ccb-2d82-43ec-8010-ee1c04989833', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:06:35.74822+00'),
('9c6a0424-4576-448e-8b16-362abbfb5698', NULL, 'rtx@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 02:57:08.812273+00'),
('9de4cbd0-2f2a-45dc-aa56-1ad8964baa77', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:43:35.898395+00'),
('a069ae8a-bed0-42cb-b4ca-d2b89ae3e4c9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 06:25:01.565412+00'),
('a1af026d-0cb7-4165-af58-7af6a8a94e91', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:44:31.418462+00'),
('a2628faf-6721-4190-ae99-4fb98fca8c9a', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:47:46.159905+00'),
('a357384b-4243-4db1-8b13-4e93b2b41beb', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:18:30.702518+00'),
('a6393688-8945-45d3-bea5-f4c8195c6e00', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:48:35.09262+00'),
('a917453d-30ec-4402-814a-d0f559aa048c', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:38:40.238367+00'),
('acd096ac-269a-4dfe-9aab-4c50294814b8', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:36:06.585102+00'),
('ae74a066-8b1c-4a15-8679-de972229b921', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'irvin@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 14:33:29.196135+00'),
('afa05509-188d-4602-b285-40cf022b3d27', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:34:53.650703+00'),
('b0b4d70c-d81a-4976-8b11-c105e97932c5', NULL, 'vertin@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 03:46:34.369071+00'),
('b0fd04b1-99c1-4566-8ef8-5001eaadf4fa', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:55.255945+00'),
('b65845b8-e342-4a15-a24c-f17790e98506', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 05:57:40.799923+00'),
('b7f3fd83-a329-41c8-865d-16d40701efa5', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 05:18:55.652594+00'),
('b8d7bc77-5ec6-46e8-8f34-6da1a8f7421d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 00:12:43.230841+00'),
('bab79a02-f080-40af-913d-319f433853a2', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:18:26.455656+00'),
('bc578b58-112f-4698-8bf9-f34530d45f2e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 01:56:23.388075+00'),
('bd0604e9-d626-45b9-9c07-ebab81a3b6d4', NULL, 'usuario_1', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:37:59.629367+00'),
('c092db66-564d-46d6-8520-93c8af902166', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:04:33.729008+00'),
('c0e147b9-62e1-480d-9322-c013644366a9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:24:46.57803+00'),
('c20d1103-d62a-40b5-b913-1781edcbad7a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:16:38.739128+00'),
('c26f25ad-aa95-45e5-8cce-aabc5304318f', '3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:13:09.835967+00'),
('c54c2c98-f43b-4847-a6da-64fc20ef2d6c', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'prueba@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-28 06:49:12.928621+00'),
('c67b77a2-f957-4292-8bfd-ca6e26b396bd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-27 14:39:52.373562+00'),
('c6d1eb76-784a-4653-8ddd-7cd64b4727a1', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-28 01:55:36.186259+00'),
('c7e82cbb-9332-48d4-8288-353cf430616b', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:50:30.457527+00'),
('c92ef5b0-7fe6-4b7b-9953-65a457d31f6b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 2}', '2025-11-27 14:39:54.183242+00'),
('c9e012ac-90f6-4277-9009-8b6c0e5eace7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 03:55:06.724614+00'),
('ca6e4cdd-4d2a-46ad-afec-b1ec41760fde', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:11:05.976609+00'),
('cb5d55b7-fff2-4385-b80e-8ee15691a404', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:44:49.816151+00'),
('cd11f5d7-e639-4231-a84a-efb27601de4e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:55:26.536629+00'),
('cd70fe9f-28ce-4928-ba71-58ccafcf2f54', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:54:40.20968+00'),
('cdf43740-5523-45e3-9dd3-a76414f312b2', NULL, 'Baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:48.318294+00'),
('d1ca65c4-e93a-44b6-b9b4-50448bb6c2d0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:31:42.56754+00'),
('d3a8cf9e-825d-4ce5-90b7-120b54974809', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:59:14.078504+00'),
('d519f9fa-12a8-4c96-95a5-454a0a8533f4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:39:43.00206+00'),
('d5d040fa-c669-426d-9a6e-43bc44090a99', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:54:28.756478+00'),
('d6d297d8-f515-4dd7-8955-ec2afe9fd9a4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 02:58:59.923759+00'),
('d8e900f8-13e1-4b2b-91e6-f6028de1f6bf', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:52:33.579313+00'),
('da523cab-3673-49c5-ad22-7c72894e0304', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 14:34:50.880584+00'),
('df80ad59-adbc-4a50-910e-3ce82a6790af', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'uriel.rios@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:20:16.135521+00'),
('df8f0400-408b-4055-b183-5a7177be821c', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-28 01:53:25.239348+00'),
('e16c90a9-48cb-4a90-bb04-781c9e5a6612', 'a42350cf-587e-44d9-8590-a6da3511237b', 'danielgc@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 14:51:33.434145+00'),
('e18695a5-8420-4e74-875e-608b475379b6', NULL, 'admin@sistema.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 05:19:14.956557+00'),
('e4ce4e3f-8ab1-42f1-b249-f117c0343b30', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:53:08.254024+00'),
('e61028d2-c870-4c55-a1dc-96a53cda3dbd', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 13:22:17.010714+00'),
('e7348386-30e3-493d-9fdc-c5b725754913', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-25 05:18:20.230979+00'),
('e7e102d5-23f1-41ba-99fe-7121305e0ae1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:46:58.680323+00'),
('e836f7d5-bfaf-4ee9-af82-197c499d0e3f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 05:19:05.587535+00'),
('ea69e7a9-27e3-4587-adae-ebd68d50a925', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:29:51.470648+00'),
('ecc616a6-f06e-46ae-ac33-fcddc5693b8d', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 15:04:52.698879+00'),
('ed102861-a4d3-488c-b731-fd075d471b57', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 14:40:37.483342+00'),
('edf4f6a1-4810-459c-891c-4926c91da4e8', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:41:19.012896+00'),
('ee0dafa5-c05c-410f-84bd-b15929b38bfb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-30 16:57:21.56513+00'),
('ee33b358-1700-4ec1-b57f-29c3ebf13900', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-28 11:38:47.05618+00'),
('ef3c6b2a-275a-471f-8140-57d4a8cee441', NULL, 'pedro@vacante.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 06:03:49.621225+00'),
('effb9897-1e02-4d24-8446-f17f7936ed99', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:53:37.571506+00'),
('f041ce1c-e468-471d-8d3d-7107b9c0ed9e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 06:33:19.472651+00'),
('f0ca8080-6902-4133-b77a-33c2115880eb', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:53:00.277537+00'),
('f6f2a4bb-f5bc-4403-bcc7-9bae7dec1242', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-29 22:17:48.072564+00'),
('f8eb99c8-5701-4d0a-87e7-1c145231b7d3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:56:20.605251+00'),
('f9590253-6b98-4bf3-9ef1-f2fa7b2a5d4d', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-26 00:10:45.086164+00'),
('feb8d3ba-92bd-46eb-99de-9d3f3e3e70fe', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:42:37.475772+00'),
('ff2b4f36-3f3a-421e-ad6a-669e01b11583', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-28 03:29:32.128528+00');



INSERT INTO "public"."despidos" ("id", "employee_id", "tipo_despido", "motivo", "fecha_despido", "estado", "indemnizacion", "liquidacion_final", "observaciones", "created_by", "created_at", "updated_at") VALUES
('2d809d4b-88df-41f5-9a2f-ec9dac9bbc6d', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'voluntario', 'NO SE BIEN', '2025-11-28', 'pendiente', 500000, 6700000, 'QWERTY', NULL, '2025-11-28 05:54:15.674923+00', '2025-11-28 05:54:15.674923+00'),
('7f9b4f38-ac60-492f-b634-5f3281c14f36', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'voluntario', 'faltas no justificadas ', '2025-11-27', 'en_proceso', 500000, 600000, 'por demasiadas faltas ', NULL, '2025-11-27 14:47:45.423259+00', '2025-11-27 14:47:45.423259+00'),
('983214ae-1583-44a8-86da-06d210e941cb', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'voluntario', 'dededededdsdsd', '2025-11-26', 'cancelado', NULL, NULL, NULL, NULL, '2025-11-26 10:04:41.277951+00', '2025-11-26 10:04:41.277951+00');
INSERT INTO "public"."incidents" ("id", "title", "description", "incident_type", "severity", "location", "status", "reported_by", "assigned_to", "resolution", "resolved_at", "file_paths", "created_at", "updated_at") VALUES
('06a5062c-58c2-4c09-8c9c-a8c298ed7127', 'oficina22', 'las PC no estan conectadas', 'falta_justificada', 'alta', 'morelia', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', NULL, NULL, NULL, '2025-11-27 14:41:50.355964+00', '2025-11-27 14:41:50.355964+00'),
('2c83f237-2308-4411-97cf-1f799e53a07f', 'oficina 55', 'energuai de luz no ay ', 'despido', 'media', 'Cuautla', 'en_progreso', 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, NULL, NULL, '2025-11-27 14:55:02.558651+00', '2025-11-27 14:55:02.558651+00'),
('3577c7a1-c088-4422-aed0-dbef2c2f7e61', 'Caída de escaleras', 'El empleado se accidento bajando las escaleras', 'accidente_laboral', 'alta', 'Escaleras', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, NULL, NULL, '2025-11-26 14:35:58.734173+00', '2025-11-26 14:35:58.734173+00'),
('63e79ae2-2580-4a0f-8733-6511f96b7b8f', 'Oficinas', 'Entrega de papeleos', 'permiso_laboral', 'media', 'Cuautla', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', NULL, NULL, NULL, '2025-11-26 15:00:30.878846+00', '2025-11-26 15:00:30.878846+00'),
('b404df5f-9563-4c76-8cd0-fa14730e8e83', 'Tardanza recurrente - Uriel Francisco', 'Empleado llegó tarde. Ver registro de asistencia del 27/11', 'falta_injustificada', 'media', 'Ciudad de México', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '26edb037-5f42-40f3-9067-6da8aafa4acd', NULL, NULL, NULL, '2025-11-28 05:44:21.45006+00', '2025-11-28 05:44:21.45006+00');
INSERT INTO "public"."inventory_items" ("id", "name", "category", "description", "stock_quantity", "min_stock", "unit_price", "location", "status", "created_at", "updated_at") VALUES
('39dcc8ea-3a5c-4237-a1a0-2bb9bfefb415', 'Palas ', 'herramientas', 'Palas asi como las de Minecraft que nadie usa ', 50, 10, 200, 'Almacén C - Estante 1 ', 'disponible', '2025-11-26 14:58:56.099818+00', '2025-11-26 14:58:56.099818+00'),
('414a099e-a383-4a31-8f74-e43760fb122c', 'Arnés', 'equipos', 'Arnés de Seguridad ', 20, 5, 500, 'Almacen B - Estante 1 ', 'disponible', '2025-11-26 14:51:38.033814+00', '2025-11-26 14:51:38.033814+00'),
('56224d0b-423c-4548-9ccb-31f62930378a', 'Pico ', 'herramientas', 'Picos asi como los de Minecraft ', 50, 10, 300, 'Almacén C - Estante 1 ', 'disponible', '2025-11-26 14:53:47.861228+00', '2025-11-26 14:53:47.861228+00'),
('8268f09f-8758-4846-95de-880b4db7dcb5', 'Arnés', 'equipos', 'Arnés de Seguridad', 30, 5, 500, 'Almacen B - Estante 1 ', 'disponible', '2025-11-26 14:54:45.423468+00', '2025-11-26 14:54:45.423468+00'),
('a91a21dc-df95-417b-962d-b6a0293995df', 'Pala', 'epp', 'sdfghj', 100, 10, 10, 'a', 'disponible', '2025-11-26 14:58:56.917529+00', '2025-11-26 14:58:56.917529+00'),
('bab603d1-e1ab-4fdf-b503-e590db97c264', 'Guantes nitrilo', 'insumos', 'XX', 99, 2, NULL, 'Alamcen estante A', 'disponible', '2025-11-26 14:34:33.538313+00', '2025-11-26 14:34:33.538313+00'),
('be0ac9e6-8957-4847-afb0-a52a67f96da9', 'Guantes nitrilo', 'insumos', 'X', 100, 40, 1, 'Almacen B - Estante 1', 'disponible', '2025-11-27 15:08:45.890613+00', '2025-11-27 15:08:45.890613+00'),
('f5eba3d2-49d7-46df-a949-92c1e7a78543', 'Arnés', 'equipos', 'Arnés de Seguridad', 30, 5, 500, 'Almacen B - Estante 1 ', 'disponible', '2025-11-26 14:55:10.574592+00', '2025-11-26 14:55:10.574592+00');
INSERT INTO "public"."documents" ("id", "title", "category", "description", "file_path", "file_size", "mime_type", "uploaded_by", "employee_id", "is_public", "estado", "motivo_rechazo", "tags", "version", "created_at", "updated_at") VALUES
('1147315c-8e41-4a0f-9df1-ba836b93f236', 'Contrato Laboral - CNT-283939-1f11', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '70b537f6-db5e-48d3-86ee-7a280655aba5/CNT-283939-1f11.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '70b537f6-db5e-48d3-86ee-7a280655aba5', 'f', 'validado', NULL, NULL, 1, '2025-11-27 14:54:33.398814+00', '2025-11-27 14:54:33.398814+00'),
('24a24da3-33b4-41f1-8514-0bf9ca910d5e', 'word - Arreglado', 'identificacion', 'word - Arreglado', 'general/u55ow816k7t.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 't', 'pendiente', NULL, '{rrhh,CVV,2025}', 2, '2025-11-27 14:23:19.629106+00', '2025-11-27 14:23:19.629106+00'),
('2a55c80e-62ab-4726-b9b3-fc1b2e994d8c', 'Crup', 'certificado', 'archivo pdf de curp del personal', 'general/5t5mccxmdpw.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 't', 'rechazado', 'No presento los documentos como se le solicitaron - formato erroneo', '{rrhh}', 1, '2025-11-26 15:07:13.389213+00', '2025-11-27 05:48:07.032+00'),
('36a7e601-b3f0-4f39-9f1b-4c5be49313ce', 'INE', 'identificacion', 'INE', 'general/5ub7nvosp5o.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 't', 'validado', NULL, '{rrhh,INE,2025}', 2, '2025-11-26 00:41:44.623424+00', '2025-11-26 00:43:25.339+00'),
('409be497-acd3-4b86-bde5-2513030e4f97', 'Contrato Laboral - CNT-637559-w8m2', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d/CNT-637559-w8m2.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'f', 'validado', NULL, NULL, 1, '2025-11-27 05:50:43.202964+00', '2025-11-27 05:50:43.202964+00'),
('5dea5584-d25c-4cd6-96c2-01fc1f19a871', 'prueba', 'otro', NULL, 'general/69n2mftexuq.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'f', 'validado', NULL, NULL, 1, '2025-11-26 05:41:31.437931+00', '2025-11-26 05:48:44.911+00'),
('5e6ee7ef-48cf-455a-ad6c-97a578c784f7', 'Vacaciones Aprobadas: Juan', 'Recursos Humanos', 'Solicitud del 01/12/2025 al 02/12/2025.', '/system/requests/e4ad138f-1404-4efd-96c0-df90f4f66019/approved', 0, 'application/link', 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'f', 'validado', NULL, NULL, 1, '2025-11-30 17:30:22.609668+00', '2025-11-30 17:30:22.609668+00'),
('729d31f7-5643-4fc7-802c-96e5b6d844d3', 'Contrato Laboral - CNT-989370-zfh6', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '68baa34b-5143-4551-9aa8-3e9b8880fe81/CNT-989370-zfh6.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 'f', 'validado', NULL, NULL, 1, '2025-11-27 05:39:56.297959+00', '2025-11-27 05:39:56.297959+00'),
('93ea0fa9-249a-4b30-9522-e92cd0b6fb31', 'Contrato Laboral - CNT-546718-sa3c', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c/CNT-546718-sa3c.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'f', 'validado', NULL, NULL, 1, '2025-11-28 06:49:15.231765+00', '2025-11-28 06:49:15.231765+00'),
('97d285cd-5aea-4bd2-ab3c-f6d972e2e22c', 'prueba', 'identificacion', 'prueba', 'general/mlz50dp03mb.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', 't', 'pendiente', NULL, '{rrhh,CVV,2025}', 2, '2025-11-27 14:18:10.47087+00', '2025-11-27 14:18:10.47087+00'),
('a431f564-27ba-444d-bb58-ac81934abd30', 'Contrato Laboral - CNT-294865-zczp', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '26edb037-5f42-40f3-9067-6da8aafa4acd/CNT-294865-zczp.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '26edb037-5f42-40f3-9067-6da8aafa4acd', 'f', 'validado', NULL, NULL, 1, '2025-11-27 14:21:24.348278+00', '2025-11-27 14:21:24.348278+00'),
('c56a7beb-41a5-4e5d-bdc0-7de7904112fa', 'Contrato Laboral - CNT-705006-fykk', 'contrato', 'Contrato individual de trabajo por tiempo indeterminado', '49b38508-cbe2-499e-a01b-04be88aa7528/CNT-705006-fykk.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '49b38508-cbe2-499e-a01b-04be88aa7528', 'f', 'validado', NULL, NULL, 1, '2025-11-28 06:35:13.688475+00', '2025-11-28 06:35:13.688475+00'),
('d4f6a142-808b-40ac-afff-9e871e0cd365', 'Vacaciones Aprobadas: Irvin Sahi Sedeño Trujillo', 'Recursos Humanos', 'Solicitud del: 2025-11-28 al 2025-11-30', 'system/vacations/4fd429a9-cbe8-4a83-9350-07564ec2c926/placeholder.pdf', 0, 'application/pdf', NULL, '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'f', 'rechazado', 'No se ve ', '{vacaciones,2025}', 1, '2025-11-27 08:35:04.40109+00', '2025-11-27 14:41:25.101+00');
INSERT INTO "public"."recruitment_positions" ("id", "title", "department", "location", "seniority", "description", "status", "hiring_manager", "work_start_time", "work_end_time", "created_by", "created_at", "updated_at") VALUES
('069e1491-fff0-41dd-be77-85fb3c434194', 'Desarrollador junior', 'Tecnología', 'Morelos', 'Junior', 'Desarrollador Junior', 'abierta', NULL, '08:00:00', '16:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 14:16:42.142615+00', '2025-11-27 14:16:42.142615+00'),
('12d9434d-0035-494f-927e-2e027860a15b', 'Limpieza', 'General', 'Acceso general', NULL, NULL, 'abierta', NULL, '05:00:00', '12:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 14:54:09.26973+00', '2025-11-25 14:54:09.26973+00'),
('5c852dec-6110-4650-9f8e-04f33820272e', 'Desarollador Web', 'Tecnología', 'Sede 2', 'Junior', NULL, 'en_proceso', NULL, '06:29:00', '07:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-26 14:40:19.379374+00', '2025-11-26 14:40:19.379374+00'),
('ad3748e5-b7a2-4b54-b60e-50ca3bf6090e', 'Gerente de Recursos Humanos', 'General', 'Ciudad de México', 'Senior', 'Urgente', 'abierta', NULL, '23:00:00', '19:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-28 04:37:26.153849+00', '2025-11-28 04:37:26.153849+00'),
('dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'Desarrollador Web', 'Tecnología', 'Sede 2', 'Junior', NULL, 'abierta', NULL, '06:29:00', '19:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-26 14:28:15.331785+00', '2025-11-26 14:28:15.331785+00');
INSERT INTO "public"."recruitment_applications" ("id", "candidate_id", "position_id", "status", "current_stage", "hiring_manager", "salary_expectation", "availability_date", "priority", "created_by", "created_at", "updated_at") VALUES
('1c028dbd-df46-487e-b46a-044dfaf13522', 'f132a8dc-114f-4620-bcea-ba0d2dd24aa8', '12d9434d-0035-494f-927e-2e027860a15b', 'en_revision', 'screening', NULL, NULL, NULL, 'media', NULL, '2025-11-26 04:53:29.195761+00', '2025-11-26 04:53:29.195761+00'),
('2a30107f-ea86-4b9b-bae3-dcf4801e70aa', '156ce631-6393-4bb2-9673-20322519f706', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 03:46:10.648591+00', '2025-11-27 03:46:10.648591+00'),
('2f6982d6-4d74-4cd7-8b16-06a71a5b9fd4', '47dd4e71-53fa-47f8-b65d-6ce02cec5e0c', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-25 19:55:21.542485+00', '2025-11-25 19:55:21.542485+00'),
('4e83d8fe-7825-4af9-bac8-2175ac1d2736', '96aaa2d9-37f5-4a07-8635-251d807cbce3', '5c852dec-6110-4650-9f8e-04f33820272e', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 05:44:17.955592+00', '2025-11-27 05:44:17.955592+00'),
('79dd16ee-2483-444f-86e0-f5123de6f89a', 'f186acc1-f613-44d4-96a7-2249f1009c95', 'ad3748e5-b7a2-4b54-b60e-50ca3bf6090e', 'en_revision', 'screening', NULL, NULL, NULL, 'media', NULL, '2025-11-28 04:45:28.417362+00', '2025-11-28 04:45:28.417362+00'),
('7ddceefb-2c5c-4153-a3aa-bcad242d16d4', 'f39b9a9c-1a7f-4067-a2ae-e4d73b7b7252', '069e1491-fff0-41dd-be77-85fb3c434194', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-28 03:02:29.669724+00', '2025-11-28 03:02:29.669724+00'),
('953fde0c-4fc7-4b3a-af1c-0f7890e1850c', 'be2ed6fa-aa04-4b76-9ffb-86e4512d6c45', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-28 06:48:51.471061+00', '2025-11-28 06:48:51.471061+00'),
('991d4c52-8fad-4f44-94c8-514c6c574900', 'f3f6dcf2-a257-435f-840e-2bdf0581d9dd', '069e1491-fff0-41dd-be77-85fb3c434194', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 14:19:22.201998+00', '2025-11-27 14:19:22.201998+00'),
('aeff9c9d-6343-4726-b9c0-595da7672086', '5ccce63d-7b31-48fc-aada-36c138c3832f', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-25 21:36:46.293727+00', '2025-11-25 21:36:46.293727+00'),
('bd3dd8e9-b85d-4f37-b05f-3c1770bbd1f4', '78af2f8d-cbd1-4ebb-8254-56c6307916a3', 'dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 05:39:39.453391+00', '2025-11-27 05:39:39.453391+00'),
('e1d96f14-0171-4068-95a3-2a1d0a48e995', 'fe0ff4e5-a61a-441a-adb9-bc697cf2300b', '5c852dec-6110-4650-9f8e-04f33820272e', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 14:54:10.51752+00', '2025-11-27 14:54:10.51752+00');

INSERT INTO "public"."recruitment_interviews" ("id", "application_id", "interview_type", "scheduled_at", "duration_minutes", "location", "meeting_url", "status", "decision", "feedback_summary", "next_steps", "created_by", "created_at", "updated_at") VALUES
('2de20268-34ae-4931-8199-23cff79f5e4e', '7ddceefb-2c5c-4153-a3aa-bcad242d16d4', 'screening', '2025-11-28 06:34:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-28 06:34:57.256999+00', '2025-11-28 06:34:57.256999+00'),
('44f070b9-da38-4e83-9ae1-72d97561af7a', 'e1d96f14-0171-4068-95a3-2a1d0a48e995', 'screening', '2025-11-27 14:54:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 14:54:16.151145+00', '2025-11-27 14:54:16.151145+00'),
('463d0253-f125-4ad6-8efb-e1171ded6cab', 'aeff9c9d-6343-4726-b9c0-595da7672086', 'screening', '2025-11-25 21:38:00+00', 30, 'Sala', 'https://mail.google.com/mail/u/0/?pli=1#inbox/FMfcgzQcqtkLBGdZRNwGpwrJhrVcbSfk', 'completada', 'aprobado', 'Aprobado', 'Prueba 2', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 21:37:09.180314+00', '2025-11-25 21:37:09.180314+00'),
('7864dbaf-ac8f-4fda-bea6-355deebd85dc', '2f6982d6-4d74-4cd7-8b16-06a71a5b9fd4', 'screening', '2025-11-25 19:57:00+00', 30, 'Sala', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'completada', 'aprobado', 'prueba', 'prueba', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 19:55:53.41903+00', '2025-11-25 19:55:53.41903+00'),
('87dd8247-c6f4-44e1-bae1-6f9b820fbeeb', 'bd3dd8e9-b85d-4f37-b05f-3c1770bbd1f4', 'screening', '2025-11-27 05:39:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 05:39:43.330361+00', '2025-11-27 05:39:43.330361+00'),
('b61cf067-28f1-4801-9960-c2372766c1ce', '991d4c52-8fad-4f44-94c8-514c6c574900', 'screening', '2025-11-27 14:19:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac', '2025-11-27 14:19:29.958021+00', '2025-11-27 14:19:29.958021+00'),
('caf4c144-ead5-42ca-93df-2e7cb67201b2', '2a30107f-ea86-4b9b-bae3-dcf4801e70aa', 'screening', '2025-11-27 03:46:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 03:46:18.194784+00', '2025-11-27 03:46:18.194784+00'),
('df5ceac3-adea-4977-ab48-e7bf02f2b580', '953fde0c-4fc7-4b3a-af1c-0f7890e1850c', 'screening', '2025-11-28 06:48:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-28 06:48:57.806947+00', '2025-11-28 06:48:57.806947+00'),
('efa94031-06c9-4e30-a00e-8462e304bad5', '4e83d8fe-7825-4af9-bac8-2175ac1d2736', 'screening', '2025-11-27 05:45:00+00', NULL, NULL, NULL, 'completada', 'aprobado', 'Prueba', 'Subir docuementos', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 05:44:29.64528+00', '2025-11-27 05:44:29.64528+00');
INSERT INTO "public"."inventory_assignments" ("id", "item_id", "user_id", "quantity", "assigned_date", "return_date", "status", "notes", "created_at", "updated_at") VALUES
('015c6328-779b-40fe-978d-4ce7a21121d4', 'bab603d1-e1ab-4fdf-b503-e590db97c264', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 1, '2025-11-26', '2025-11-26', 'asignado', 'XCD', '2025-11-26 14:36:07.631113+00', '2025-11-26 14:36:07.631113+00');

INSERT INTO "public"."sh_sectors" ("id", "name", "description", "risk_level", "responsible_id", "created_at", "updated_at") VALUES
('3c21f12e-eb9d-4361-8a1c-fbcd8a70699d', 'Planta de produccion', 'XXX', 'medio', 'ea6ab625-c61f-47f2-8ab1-890426eac147', '2025-11-26 14:39:48.882911+00', '2025-11-26 14:39:48.882911+00');
INSERT INTO "public"."recruitment_candidates" ("id", "full_name", "email", "phone", "current_location", "resume_url", "source", "seniority", "status", "assigned_recruiter", "notes", "created_at", "updated_at", "rfc", "curp", "nss", "address") VALUES
('156ce631-6393-4bb2-9673-20322519f706', 'Velazquez Perez Vertin', 'vertin@gmail.com', '3243252', 'México', NULL, 'linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 03:46:10.486641+00', '2025-11-27 03:46:10.486641+00', NULL, NULL, NULL, NULL),
('47dd4e71-53fa-47f8-b65d-6ce02cec5e0c', 'Pedro', 'pedro@gmail.com', '7356723546', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'prueba', '2025-11-25 19:55:21.339664+00', '2025-11-25 19:55:21.339664+00', NULL, NULL, NULL, NULL),
('5ccce63d-7b31-48fc-aada-36c138c3832f', 'David', 'david@gmail.com', '7356744533', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'Prueba', '2025-11-25 21:36:46.075409+00', '2025-11-25 21:36:46.075409+00', NULL, NULL, NULL, NULL),
('78af2f8d-cbd1-4ebb-8254-56c6307916a3', 'Emmanuel Saliff Vallecillo Alvarado', 'emmanuel.esva@gmail.com', '743263742', 'Mexico', NULL, 'Linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 05:39:39.316437+00', '2025-11-27 05:39:39.316437+00', NULL, NULL, NULL, NULL),
('96aaa2d9-37f5-4a07-8635-251d807cbce3', 'Recluta', 'recluta@prueba.com', '7351238231', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'Prueba inicial', '2025-11-27 05:44:17.780483+00', '2025-11-27 05:44:17.780483+00', NULL, NULL, NULL, NULL),
('be2ed6fa-aa04-4b76-9ffb-86e4512d6c45', 'prueba', 'prueba@gmail.com', '3423432354', NULL, NULL, 'facebook', 'Junior', 'contratado', NULL, NULL, '2025-11-28 06:48:51.304141+00', '2025-11-28 06:48:51.304141+00', NULL, NULL, NULL, NULL),
('f132a8dc-114f-4620-bcea-ba0d2dd24aa8', 'Hector', 'altaerikiara@gmail.com', '7328289932', 'Mexico', NULL, 'Facebook', 'Semi Senior', 'contratado', NULL, NULL, '2025-11-26 04:53:28.547233+00', '2025-11-26 04:53:28.547233+00', NULL, NULL, NULL, NULL),
('f186acc1-f613-44d4-96a7-2249f1009c95', 'María Gonzales', 'maria.gonzalez@gmail.com', '5551234567', 'Cuidad de Mexico', NULL, 'Facebook', 'Senior', 'contratado', NULL, 'Muy activa', '2025-11-28 04:45:27.897096+00', '2025-11-28 04:45:27.897096+00', NULL, NULL, NULL, NULL),
('f39b9a9c-1a7f-4067-a2ae-e4d73b7b7252', 'Barco Hernandez Oscar Gael', 'oscar@gmail.com', '4324234232', 'México', NULL, 'linkedin', 'Semi Senior', 'contratado', NULL, NULL, '2025-11-28 03:02:29.47212+00', '2025-11-28 03:02:29.47212+00', NULL, NULL, NULL, NULL),
('f3f6dcf2-a257-435f-840e-2bdf0581d9dd', 'Uriel Francisco Lopez Rios', 'uriel.rios@gmail.com', '7352638193', 'México', NULL, 'Linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 14:19:21.942585+00', '2025-11-27 14:19:21.942585+00', NULL, NULL, NULL, NULL),
('fe0ff4e5-a61a-441a-adb9-bc697cf2300b', 'Gerardo Guzman', 'gera.guzman@gmail.com', '3273929028', 'México', NULL, 'Linkedin', 'Lead', 'contratado', NULL, NULL, '2025-11-27 14:54:10.349929+00', '2025-11-27 14:54:10.349929+00', NULL, NULL, NULL, NULL);
INSERT INTO "public"."device_commands" ("id", "device_id", "command_type", "payload", "status", "created_at", "updated_at") VALUES
('061f9f14-10f7-4c54-a6b7-d126f5bcfab8', 'ESP32-001', 'ENROLL', '{"biometric_id": 2}', 'processing', '2025-11-26 01:31:40.284076+00', '2025-11-26 01:31:48.20477+00'),
('30314bb5-04ed-480d-912c-82e3d9e63ef5', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:25:42.516086+00', '2025-11-26 01:25:46.381172+00'),
('407f92a9-2a1d-48d2-9429-d4e4a1fd5e0e', 'ESP32-001', 'ENROLL', '{"biometric_id": 10}', 'pending', '2025-11-27 15:58:17.718607+00', '2025-11-27 15:58:17.718607+00'),
('49d0fcd1-9a69-47f6-b97d-0ad08de9ca4d', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:35:07.315074+00', '2025-11-26 14:35:51.709813+00'),
('4f48fa6e-b24b-4aba-86aa-66c1205440e3', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-25 06:12:49.156485+00', '2025-11-25 06:12:52.114725+00'),
('69f741f6-26f9-4cdd-bb57-e4089b0621c7', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:28:18.693913+00', '2025-11-26 01:28:23.751617+00'),
('8c1038ce-16b2-4104-b0c8-9b194dac245f', 'ESP32-001', 'ENROLL', '{"biometric_id": 9}', 'processing', '2025-11-27 14:22:34.50851+00', '2025-11-27 14:22:40.757129+00'),
('970e06f2-b7a0-44b6-8b79-19c919cfb674', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-27 02:34:05.081382+00', '2025-11-27 02:35:36.383319+00'),
('9a37e821-7151-4b6e-9c15-5f8197e11088', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:34:37.396529+00', '2025-11-26 14:35:06.567107+00'),
('9b12b7e7-3653-42ba-8e3f-b801e974715f', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:34:20.477258+00', '2025-11-26 14:34:25.697184+00'),
('a4f78410-ff00-424e-9a6d-681c79e0e844', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-27 02:33:20.948915+00', '2025-11-27 02:35:22.098289+00'),
('a9e2c6f2-0b08-42c3-af4e-77927d1d405b', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:29:49.621715+00', '2025-11-26 01:29:58.942189+00'),
('c4cb8fda-8909-4dc9-af8a-3c18e984dcf3', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-26 14:36:12.619102+00', '2025-11-26 14:37:56.354404+00'),
('d0b8f305-0dde-4375-a82a-c0cd47dbec8d', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-25 06:11:04.616171+00', '2025-11-25 06:11:07.187819+00'),
('d61fea78-590f-4889-a4c6-0267d9685ce1', 'ESP32-001', 'ENROLL', '{"biometric_id": 10}', 'processing', '2025-11-27 14:55:07.254502+00', '2025-11-27 14:55:13.818168+00'),
('ff93e6c3-d99b-4cca-98ca-5eb8d05e96f4', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:35:31.035171+00', '2025-11-26 14:36:27.658009+00');

INSERT INTO "public"."users" ("id", "email", "username", "full_name", "phone", "password_hash", "status", "department", "position", "last_login_at", "created_at", "updated_at", "is_verified", "is_locked", "failed_login_attempts", "password_reset_token", "password_reset_expires_at", "verification_token") VALUES
('03d65d92-28a9-4c56-b87a-16f75c4377c3', 'irvin@gmail.com', 'irvin@gmail.com', 'Irvin Sahi Sedeño Trujillo', '34545653', '0ddc5f1fd6caf4d6569efdcb196d38ff:5c491664ea53f9ab945e055e61a3a3305388bd5dd599fdf4952f8a71d9015148', 'activo', NULL, NULL, NULL, '2025-11-26 14:33:28.982248+00', '2025-11-27 02:36:18.37205+00', 't', 'f', 0, NULL, NULL, NULL),
('26edb037-5f42-40f3-9067-6da8aafa4acd', 'uriel.rios@gmail.com', 'uriel.rios@gmail.com', 'Uriel Francisco Lopez Rios', '7352638193', 'ced0aa6238c84d0283245b5a8109c8aa:adb4de9b4333bd8361e58b314787ad7ac5a4c27f81343487060b38bc32fa6edc', 'activo', NULL, NULL, NULL, '2025-11-27 14:20:15.935322+00', '2025-11-27 14:23:00.924378+00', 't', 'f', 0, NULL, NULL, NULL),
('3085a308-c2af-4c71-b39d-613c3134d0d6', 'baezaantoniocontac@gmail.com', 'baeza', 'Luis Antonio Baeza Turijan', '7351031090', '2c03d6a0385ab9703fb715bb59c6b5b6:7c40bc1ab1d6cb352658e9ef7aeeb9c2b8082f82bcacac1739aa8dec3548a8e2', 'activo', NULL, NULL, '2025-11-27 15:23:46.297+00', '2025-11-27 14:12:07.170557+00', '2025-11-27 15:23:46.359468+00', 't', 'f', 0, NULL, NULL, NULL),
('3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'emmanuel@gmail.com', 'Emmanuel', '342234', '0839227ae1be75fae0a4a706c2ecfda5:23ab598d2a3199c6a00381179b782871c61538bae25c876093b3934b1d2ab08e', 'activo', NULL, NULL, '2025-11-27 14:17:41.97+00', '2025-11-26 05:39:40.613765+00', '2025-11-27 14:17:42.030169+00', 't', 'f', 0, NULL, NULL, NULL),
('4838c265-1c5e-4520-9590-23fd6d4161dc', 'daniel@gmail.com', 'daniel', 'Daniel', '7351115766', '7291ea51291eaf25af9482489192af81:fe5fbb446d497a5d0c8fd6462b0aeba0ff2121d1b95c74b780c87c4c9ad1e1c6', 'activo', NULL, NULL, NULL, '2025-11-27 14:52:31.102098+00', '2025-11-27 14:52:31.102098+00', 't', 'f', 0, NULL, NULL, NULL),
('49b38508-cbe2-499e-a01b-04be88aa7528', 'oscar@gmail.com', 'oscar@gmail.com', 'Barco Hernandez Oscar Gael', '4324234232', '048da1c9e9e76ff1b5d3dafa74e7077b:eed11137da850febaa57de456b880eea7ebde80f1aa76ef755a8ae8e87c67c98', 'activo', NULL, NULL, NULL, '2025-11-28 06:35:10.867678+00', '2025-11-28 06:35:10.867678+00', 't', 'f', 0, NULL, NULL, NULL),
('68baa34b-5143-4551-9aa8-3e9b8880fe81', 'emmanuel.esva@gmail.com', 'emmanuel.esva@gmail.com', 'Emmanuel Saliff Vallecillo Alvarado', '743263742', '730b852b93e4c440aa25febb1337d923:e8093aa202c4adcb0deb9d1bc0eb2f971bdc33a28626cf7d87063ebb2045c92b', 'activo', NULL, NULL, NULL, '2025-11-27 05:39:52.650282+00', '2025-11-27 05:39:52.650282+00', 't', 'f', 0, NULL, NULL, NULL),
('6f69105d-8e5f-4892-a5b6-494726ee768a', 'recluta@prueba.com', 'recluta@prueba.com', 'Recluta', '7351238231', '6a524785ca34f2fdb4aff5f65e3f45c6:21868ec8bee06bfbfe07717d9127cdbc744fa2df5dcebc02cdc125b0d2976146', 'activo', NULL, NULL, NULL, '2025-11-27 05:45:20.628572+00', '2025-11-27 05:45:20.628572+00', 't', 'f', 0, NULL, NULL, NULL),
('70b537f6-db5e-48d3-86ee-7a280655aba5', 'gera.guzman@gmail.com', 'gera.guzman@gmail.com', 'Gerardo Guzman', '3273929028', 'e81833662f5a74ad7e154235b60d4857:f7629b541b6c7c96d923b27db6a62577a6ce8230453be654ca89222abbc97603', 'inactivo', NULL, NULL, NULL, '2025-11-27 14:54:30.305833+00', '2025-11-27 16:00:10.061868+00', 't', 'f', 0, NULL, NULL, NULL),
('85981ed9-2f23-463f-bae7-8e41fe2a033b', 'pedro@gmail.com', 'pedro@gmail.com', 'Pedro', '7356723546', '66ce15e8fcebbf891b49457bca67adcc:7a7597a227b5149de376386ee813ff05726dbedd2ab75d8f6ce1078ab3a24145', 'activo', NULL, NULL, NULL, '2025-11-25 19:56:29.011228+00', '2025-11-25 19:56:29.011228+00', 't', 'f', 0, NULL, NULL, NULL),
('9fdc7530-2ae7-4281-ad0e-9563fb0c60c5', 'a@aa.com', 'arizbeth', 'Arizbeth Cabrera M', '123456789', '161ae6aab4699c168af3678a4164e732:b750f6e025aaf08ba34f9545cc18decdae4decf0524a642d62c5646cb6dcece2', 'activo', NULL, NULL, '2025-11-27 14:51:50.173+00', '2025-11-27 14:51:18.629396+00', '2025-11-27 14:51:50.237506+00', 't', 'f', 0, NULL, NULL, NULL),
('a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'usuario_ejemplo', 'Nombre Completo', NULL, '917c19138cb462ece87665c881e0d018:0c27adb411dac546604df853d6ab6929253a45a528ada8c9a77ceb208bb6c58c', 'activo', NULL, NULL, '2025-11-30 16:57:21.407+00', '2025-11-25 04:12:17.785215+00', '2025-11-30 16:57:21.459567+00', 'f', 'f', 0, NULL, NULL, NULL),
('a42350cf-587e-44d9-8590-a6da3511237b', 'danielgc@gmail.com', 'danielgc', 'Daniel', '7351115766', '15cf90f86aa20f3f474cd300f69ac442:9254d8515622e67f7293c651ec765414df07fa87ea973e736b320722e9f223aa', 'activo', NULL, NULL, NULL, '2025-11-27 14:51:33.365297+00', '2025-11-27 14:51:33.365297+00', 't', 'f', 0, NULL, NULL, NULL),
('a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 'prueba@gmail.com', 'prueba@gmail.com', 'prueba', '3423432354', '91cd6e6ae39641a59a5f1d1cc3da909a:b7a3f91d255abc2ed49de6e21a362be062a8767a19760e52fa9ee8e33a328c8b', 'activo', NULL, NULL, NULL, '2025-11-28 06:49:12.732084+00', '2025-11-28 06:49:12.732084+00', 't', 'f', 0, NULL, NULL, NULL),
('b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 'pedro.picapidra@gmail.com', 'pedro.picapidra@gmail.com', 'Pedro Picapidra', '234234', 'ba87d9e881eb45ec789b2cc3dc96c33e:9f276e7b47db17437f387d082fdb3083a328e061ddd1a809ca6d6baaa0065da9', 'activo', NULL, NULL, NULL, '2025-11-27 05:50:40.795614+00', '2025-11-27 05:50:40.795614+00', 't', 'f', 0, NULL, NULL, NULL),
('ea6ab625-c61f-47f2-8ab1-890426eac147', 'chito@talento.com', 'chito@talento.com', 'Barco Hernandez', '8324893482', '2db39e473e3dedb06264c1842a69f0c3:132bcba3005f1ddab3f2afc18ca2f313a7881744faa970710e578e99b4744ed8', 'activo', NULL, NULL, NULL, '2025-11-25 19:50:08.011036+00', '2025-11-26 01:28:12.533803+00', 't', 'f', 0, NULL, NULL, NULL);

INSERT INTO "public"."positions" ("id", "title", "description", "area_id", "status", "created_at", "updated_at", "work_start_time", "work_end_time") VALUES
('2d56bf86-4046-4af3-8d53-efcb24c06e61', 'Limpieza', NULL, '38e040f2-d503-42e1-b8de-be0855aa6fbc', 'active', '2025-11-25 19:50:06.742577+00', '2025-11-25 19:50:06.742577+00', '09:00:00', '18:00:00'),
('53e8644c-02cb-42a9-a4fa-00ba84d912a5', 'Desarrollador Web', NULL, 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'active', '2025-11-27 02:23:06.287459+00', '2025-11-27 02:23:06.287459+00', '09:00:00', '18:00:00'),
('c95bff1b-2432-4e71-b507-11a5510bf6be', 'Desarrollador BackEnd', NULL, 'fbcfb05d-f7d5-421b-a344-d3bf20c1f235', 'active', '2025-11-25 05:46:53.733113+00', '2025-11-25 05:46:53.733113+00', '12:24:00', '17:24:00'),
('d0287626-7d61-4a31-9b50-c18c237783cb', 'Desarollador Web', NULL, 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'active', '2025-11-27 05:45:19.589495+00', '2025-11-27 05:45:19.589495+00', '09:00:00', '18:00:00');


INSERT INTO "public"."vacation_balances" ("id", "user_id", "total_days", "used_days", "available_days", "year", "created_at", "updated_at") VALUES
('30ea5957-baa6-480f-bbf5-34653a496db2', 'a47943d9-72fd-4f92-b3ad-a4d3d7ebe07c', 15, 0, 15, 2025, '2025-11-28 06:49:13.244488+00', '2025-11-28 06:49:13.244488+00'),
('3d2b2403-906c-49b0-8d49-2e0c00622527', '68baa34b-5143-4551-9aa8-3e9b8880fe81', 15, 6, 15, 2025, '2025-11-27 05:39:53.211374+00', '2025-11-27 05:39:53.211374+00'),
('5a8231df-7317-43b1-b6f6-4189cb4f58c5', '26edb037-5f42-40f3-9067-6da8aafa4acd', 15, 0, 15, 2025, '2025-11-27 14:21:21.586078+00', '2025-11-27 14:21:21.586078+00'),
('8480e113-a991-447a-bd3d-01f54a59106c', '70b537f6-db5e-48d3-86ee-7a280655aba5', 15, 0, 15, 2025, '2025-11-27 14:54:31.015229+00', '2025-11-27 14:54:31.015229+00'),
('93a8589c-7c56-4f6b-8b04-b149612e0e48', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 15, 8, 15, 2025, '2025-11-27 02:06:20.345054+00', '2025-11-27 02:06:20.345054+00'),
('af6a1060-0807-486c-bee9-7c6905f925c3', 'b7e26782-a6f6-4031-b43e-9a4be49b4c7d', 15, 0, 15, 2025, '2025-11-27 05:50:41.378448+00', '2025-11-27 05:50:41.378448+00'),
('c6cab906-1226-4d51-bc6a-ae9003d6ffdc', '49b38508-cbe2-499e-a01b-04be88aa7528', 15, 3, 15, 2025, '2025-11-28 06:35:11.450824+00', '2025-11-28 06:35:11.450824+00'),
('dac9608d-4220-419e-8779-5a29ef7d2294', '3b462775-0e25-47bd-a34a-e35ac8923cac', 15, 0, 15, 2025, '2025-11-27 02:23:06.72456+00', '2025-11-27 02:23:06.72456+00'),
('e940af87-b714-4747-addc-789d146f9e0f', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 15, 7, 15, 2025, '2025-11-27 03:06:11.90977+00', '2025-11-27 03:06:11.90977+00'),
('ef30f5fd-86c0-4670-a6cf-06e8b4e8ab2d', '6f69105d-8e5f-4892-a5b6-494726ee768a', 15, 0, 15, 2025, '2025-11-27 05:45:21.177487+00', '2025-11-27 05:45:21.177487+00');
INSERT INTO "public"."vacation_requests" ("id", "user_id", "start_date", "end_date", "days_requested", "status", "employee_note", "manager_note", "created_at", "updated_at") VALUES
('0b5d8c47-927c-468e-abcf-08501578747d', '49b38508-cbe2-499e-a01b-04be88aa7528', '2025-12-01', '2025-12-02', 2, 'rejected', '', NULL, '2025-11-30 23:53:24.422561+00', '2025-11-30 23:53:32.774637+00'),
('5de4233b-44ff-482d-8e9f-d2f5dc3f96cd', 'ea6ab625-c61f-47f2-8ab1-890426eac147', '2025-12-01', '2025-12-03', 3, 'rejected', '', NULL, '2025-11-30 23:47:46.399852+00', '2025-11-30 23:47:50.761202+00'),
('80076d9b-0621-488a-a318-4ed52109913a', '49b38508-cbe2-499e-a01b-04be88aa7528', '2025-12-01', '2025-12-03', 3, 'approved', '', NULL, '2025-11-30 23:29:28.904895+00', '2025-11-30 23:29:40.152645+00'),
('8499b329-f95a-4eac-8067-446220e2c95b', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-30', '2025-12-01', 2, 'approved', 'Salida a Cancún con mi familia.', NULL, '2025-11-29 23:50:03.723342+00', '2025-11-29 23:50:10.020138+00'),
('8f05a654-cfee-4cd7-b557-4fefb4a2997a', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-12-01', '2025-12-03', 3, 'rejected', 'Viaje a EEUU.', NULL, '2025-11-30 16:09:44.702617+00', '2025-11-30 16:09:50.219363+00'),
('a84acb2d-fcc4-42c1-a6cd-5d97f377196f', '85981ed9-2f23-463f-bae7-8e41fe2a033b', '2025-12-01', '2025-12-03', 3, 'rejected', '', NULL, '2025-11-30 17:29:23.290738+00', '2025-11-30 17:29:27.601086+00'),
('bc890d74-1883-40ce-acb1-73c2d1f08bba', '3b462775-0e25-47bd-a34a-e35ac8923cac', '2025-12-01', '2025-12-03', 3, 'rejected', 'Viaje a Japón.', NULL, '2025-11-30 16:04:23.822573+00', '2025-11-30 16:04:36.537095+00'),
('e4ad138f-1404-4efd-96c0-df90f4f66019', '85981ed9-2f23-463f-bae7-8e41fe2a033b', '2025-12-01', '2025-12-02', 2, 'approved', '', NULL, '2025-11-30 17:30:18.318697+00', '2025-11-30 17:30:22.295637+00'),
('ec7e11bb-be5d-4bf6-85a0-d00ec8f74955', '85981ed9-2f23-463f-bae7-8e41fe2a033b', '2025-12-01', '2025-12-03', 3, 'rejected', 'Incapacidad.', NULL, '2025-11-30 17:14:08.142516+00', '2025-11-30 17:14:14.306555+00'),
('ece7d92b-70bd-4138-8963-fcb9d58b9903', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-12-02', '2025-12-04', 3, 'rejected', 'Viaje a Brazil.', NULL, '2025-11-30 16:31:26.674262+00', '2025-11-30 17:00:58.846344+00');
