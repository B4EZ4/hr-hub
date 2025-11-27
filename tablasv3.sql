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
    CONSTRAINT "inventory_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id"),
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
    CONSTRAINT "vacation_balances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id"),
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
    CONSTRAINT "vacation_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE,
    PRIMARY KEY ("id")
);


-- Indices
CREATE INDEX idx_vacation_requests_user_id ON public.vacation_requests USING btree (user_id);
CREATE INDEX idx_vacation_requests_status ON public.vacation_requests USING btree (status);

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

INSERT INTO "public"."areas" ("id", "name", "description", "parent_area_id", "responsible_id", "status", "created_at", "updated_at") VALUES
('38e040f2-d503-42e1-b8de-be0855aa6fbc', 'General', NULL, NULL, NULL, 'active', '2025-11-25 19:50:06.403307+00', '2025-11-25 19:50:06.403307+00'),
('397b2a1c-6bde-4ee4-a98a-4b0619656617', 'Limpieza', 'XYZ', NULL, NULL, 'activo', '2025-11-25 14:51:37.208935+00', '2025-11-25 19:53:44.882107+00'),
('49625dd9-c73d-4e8d-8d30-8b2789437b6e', 'Desarrollador', 'programar ', NULL, NULL, 'activo', '2025-11-25 06:16:45.371276+00', '2025-11-26 14:22:10.503807+00'),
('5840f5cc-6931-445a-9dab-09054ffd2657', 'finanzas', 'Operaciones', NULL, NULL, 'activo', '2025-11-26 04:58:33.006781+00', '2025-11-26 14:39:56.879341+00'),
('62c9f01b-658d-4365-acdc-7f0159f0e367', 'Marqutink', 'publicidad', NULL, NULL, 'inactivo', '2025-11-25 23:48:09.840033+00', '2025-11-25 23:48:09.840033+00'),
('86b8e7f5-9eae-4205-bb81-2c219e666ff6', 'Programador', 'Programador', NULL, NULL, 'activo', '2025-11-26 14:33:49.396735+00', '2025-11-26 14:40:19.635303+00'),
('d25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'Tecnología', NULL, NULL, NULL, 'active', '2025-11-27 02:23:05.983124+00', '2025-11-27 02:23:05.983124+00'),
('fbcfb05d-f7d5-421b-a344-d3bf20c1f235', 'Tecnologia', '', NULL, NULL, 'active', '2025-11-25 05:40:09.682933+00', '2025-11-25 19:53:50.784636+00');
INSERT INTO "public"."user_roles" ("id", "user_id", "role", "created_at") VALUES
('003b2cd4-bba2-401d-94f5-01cc86ea04f1', 'ef2bcefd-29d3-4675-9873-5964c5103f58', 'empleado', '2025-11-27 03:46:34.84307+00'),
('05399ee5-6ce7-4ea7-b427-5e58c4696dad', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'admin_rrhh', '2025-11-25 19:50:08.118546+00'),
('0fd5413e-196b-4b19-a41d-97dc57ee4007', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'superadmin', '2025-11-25 04:12:17.785215+00'),
('1e8a9aba-d4e2-4623-8b74-3ae5af186d59', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'empleado', '2025-11-27 02:06:20.500419+00'),
('2a3f23f8-e7bf-4abf-8236-4db2d289df7e', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'superadmin', '2025-11-27 04:47:10.936108+00'),
('2cd3f486-2ba2-4cc5-82dc-b1caf192ef1d', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'empleado', '2025-11-26 05:39:41.414378+00'),
('64c6c7c2-1e33-4739-a65c-195930bdfa59', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'admin_rrhh', '2025-11-26 05:39:40.711941+00'),
('76262a66-f66a-4bcb-8fe1-8583035fc183', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'admin_rrhh', '2025-11-25 21:37:25.222007+00'),
('88ef1a15-7bff-4a6e-a7e5-83b7c9df1657', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'empleado', '2025-11-25 19:56:29.746427+00'),
('a03e4314-c269-44d3-ad3e-a511332e0c50', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'empleado', '2025-11-25 21:37:25.968568+00'),
('b9bf866e-5103-4418-9201-b1ebf15245df', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'empleado', '2025-11-25 19:50:08.848418+00'),
('c9890819-7352-4a89-802b-05ca6973358d', 'ef2bcefd-29d3-4675-9873-5964c5103f58', 'admin_rrhh', '2025-11-27 03:46:34.266148+00'),
('d81b8daa-7a9c-4d86-8fbd-f37cbbc420d4', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'admin_rrhh', '2025-11-26 14:33:29.08695+00'),
('df8e72b4-70f9-47b3-95d7-774b172dcb25', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'admin_rrhh', '2025-11-25 19:56:29.108304+00');
INSERT INTO "public"."user_sessions" ("id", "user_id", "token", "expires_at", "ip_address", "user_agent", "created_at", "last_active_at") VALUES
('05f6ce23-fe30-4aea-8c22-39de314d092c', 'a402caa2-bbee-4681-b941-0a0e48237f09', '410d8615-464a-4d04-9bc6-0ce827cf6622', '2025-11-27 01:18:28.867+00', NULL, NULL, '2025-11-26 01:18:28.926686+00', '2025-11-26 01:18:28.926686+00'),
('076777b8-5dff-47c5-853d-8a758c6a7b3e', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7615c3bb-d1a7-4291-b576-da1e7446e236', '2025-11-27 05:57:40.556+00', NULL, NULL, '2025-11-26 05:57:40.609694+00', '2025-11-26 05:57:40.609694+00'),
('1ac6e5ff-7b2a-4465-91fd-d5fd81863c0b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b92055bd-931a-483a-a3b9-16ea985fec5b', '2025-11-27 14:11:59.298+00', NULL, NULL, '2025-11-26 14:11:59.355298+00', '2025-11-26 14:11:59.355298+00'),
('2bcfa079-cd21-407e-8efb-363e0ac59172', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'fcd99708-e055-4d43-9f55-ea99ef824465', '2025-11-27 01:16:38.493+00', NULL, NULL, '2025-11-26 01:16:38.545932+00', '2025-11-26 01:16:38.545932+00'),
('30a645c3-8eae-42b2-b942-fcbd7cbff609', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f5437086-fda3-47d6-8711-e0536549472d', '2025-11-27 15:58:54.444+00', NULL, NULL, '2025-11-26 15:58:54.498067+00', '2025-11-26 15:58:54.498067+00'),
('354804ae-eca7-4f6d-b89c-289d152b7447', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b6894a49-7004-4cb9-9eb5-a7863c200312', '2025-11-27 14:51:48.328+00', NULL, NULL, '2025-11-26 14:51:48.382042+00', '2025-11-26 14:51:48.382042+00'),
('4618269a-e2b7-42d4-a14e-5e7f6ee21716', 'a402caa2-bbee-4681-b941-0a0e48237f09', '85adc694-d303-4c9b-a704-5cfe75a3ef31', '2025-11-26 14:58:31.583+00', NULL, NULL, '2025-11-25 14:58:31.604014+00', '2025-11-25 14:58:31.604014+00'),
('51108f6b-a1bb-4313-bcfd-5ad95bfe71ba', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b54bc893-30da-4222-9a28-06c9b18a4f99', '2025-11-27 14:56:20.413+00', NULL, NULL, '2025-11-26 14:56:20.475413+00', '2025-11-26 14:56:20.475413+00'),
('5312ecd0-1b67-4f91-996a-2458d82e7539', 'a402caa2-bbee-4681-b941-0a0e48237f09', '8ce74f6b-df60-4447-9813-7ba0650e64f5', '2025-11-27 03:55:06.476+00', NULL, NULL, '2025-11-26 03:55:06.530202+00', '2025-11-26 03:55:06.530202+00'),
('55fb242c-8bfe-4ec1-ad37-acc45209f4d6', 'a402caa2-bbee-4681-b941-0a0e48237f09', '13e22783-38bf-43c4-86ca-638f53591d9a', '2025-11-26 14:51:28.418+00', NULL, NULL, '2025-11-25 14:51:28.468229+00', '2025-11-25 14:51:28.468229+00'),
('5a00a52f-aac4-438f-bdd1-d7358706bc5e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd4ff8267-3ca5-47f9-b5e5-8778a659e244', '2025-11-27 15:07:42.236+00', NULL, NULL, '2025-11-26 15:07:42.294402+00', '2025-11-26 15:07:42.294402+00'),
('5a2f2a13-23f1-448b-970c-05effc0449bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b47b23fa-acfb-4fe2-8871-470fabbb9434', '2025-11-27 14:31:42.432+00', NULL, NULL, '2025-11-26 14:31:42.484336+00', '2025-11-26 14:31:42.484336+00'),
('6074f142-43c2-4586-a7ce-4220a09e6d29', 'a402caa2-bbee-4681-b941-0a0e48237f09', '545a79d5-9073-4148-9eca-bdf39214637d', '2025-11-27 01:39:42.753+00', NULL, NULL, '2025-11-26 01:39:42.813038+00', '2025-11-26 01:39:42.813038+00'),
('62fb4872-646c-48d5-aa8b-3c446aae9750', 'a402caa2-bbee-4681-b941-0a0e48237f09', '6bda1f85-ad2e-4655-89fd-1904b00985ae', '2025-11-27 01:53:37.315+00', NULL, NULL, '2025-11-26 01:53:37.374124+00', '2025-11-26 01:53:37.374124+00'),
('72169579-a092-4840-8241-e01ce86ee6fd', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b783fdb1-64ff-4df2-9d89-8d6e0e07bb81', '2025-11-27 14:29:51.034+00', NULL, NULL, '2025-11-26 14:29:51.106882+00', '2025-11-26 14:29:51.106882+00'),
('8ae90b4a-8796-4854-b0b4-33d00e556251', 'a402caa2-bbee-4681-b941-0a0e48237f09', '01a34e69-af03-4586-891f-969aafba07f6', '2025-11-27 14:39:21.369+00', NULL, NULL, '2025-11-26 14:39:21.427504+00', '2025-11-26 14:39:21.427504+00'),
('95c3a166-1df9-4407-b307-36c62520cbe8', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7626a7fc-0de1-4b7d-8439-bd69e16daf32', '2025-11-28 04:39:40.819+00', NULL, NULL, '2025-11-27 04:39:40.87596+00', '2025-11-27 04:39:40.87596+00'),
('9a89489d-39c4-48c1-8516-ff00d09423e1', 'a402caa2-bbee-4681-b941-0a0e48237f09', '90712039-a6ed-4a51-b27f-bd42292ea157', '2025-11-27 15:01:30.567+00', NULL, NULL, '2025-11-26 15:01:30.620587+00', '2025-11-26 15:01:30.620587+00'),
('a452e7df-60a8-4b9a-bfeb-57f5f5e9643a', 'a402caa2-bbee-4681-b941-0a0e48237f09', '884be2f6-cdaf-47b9-9e13-6b1da64c0ab1', '2025-11-27 14:50:00.658+00', NULL, NULL, '2025-11-26 14:50:00.7003+00', '2025-11-26 14:50:00.7003+00'),
('aa82888a-cdaa-4913-8252-305676d68dcb', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ed8abb7b-aa88-4ba5-bc0b-060d8d8a09c7', '2025-11-27 04:24:25.203+00', NULL, NULL, '2025-11-26 04:24:25.265001+00', '2025-11-26 04:24:25.265001+00'),
('ab320210-5633-454a-9884-8a3747741f16', 'a402caa2-bbee-4681-b941-0a0e48237f09', '53837536-0ee9-4bba-988f-cccce7eee1d6', '2025-11-26 14:55:26.291+00', NULL, NULL, '2025-11-25 14:55:26.348526+00', '2025-11-25 14:55:26.348526+00'),
('abd402fd-b673-4973-9b44-950b92137c85', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'ad4ad042-efa0-4623-86f2-4b93b7306e88', '2025-11-28 01:56:22.967+00', NULL, NULL, '2025-11-27 01:56:23.024622+00', '2025-11-27 01:56:23.024622+00'),
('ac662d18-ec58-49b5-ae67-c6c09578f3b8', 'a402caa2-bbee-4681-b941-0a0e48237f09', '6e133c94-9145-4b44-88eb-4ff9d03dc306', '2025-11-27 13:22:48.617+00', NULL, NULL, '2025-11-26 13:22:48.695104+00', '2025-11-26 13:22:48.695104+00'),
('b25ef9e7-5674-4d9e-a0b2-e6f6218bf2ab', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'f7511e02-8c12-4cc4-a916-9b1dc99c9a58', '2025-11-26 15:02:15.271+00', NULL, NULL, '2025-11-25 15:02:15.294881+00', '2025-11-25 15:02:15.294881+00'),
('b43ccac8-f1c9-4a22-8a0a-35e2a76b1dbf', 'a402caa2-bbee-4681-b941-0a0e48237f09', '62f53c15-a779-4a23-b4fd-4059eaa52e44', '2025-11-27 00:12:48.231+00', NULL, NULL, '2025-11-26 00:12:48.257333+00', '2025-11-26 00:12:48.257333+00'),
('b7209c1a-c936-4f02-8458-a46e9d013c51', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7c545b1a-3b93-4404-baf2-7ddba9480f4f', '2025-11-27 01:59:13.837+00', NULL, NULL, '2025-11-26 01:59:13.891536+00', '2025-11-26 01:59:13.891536+00'),
('bb68edeb-1898-4095-bf04-a2f013792b16', 'a402caa2-bbee-4681-b941-0a0e48237f09', '5d917ec9-82b9-408a-9999-28c206333f99', '2025-11-26 14:49:17.156+00', NULL, NULL, '2025-11-25 14:49:17.189549+00', '2025-11-25 14:49:17.189549+00'),
('c5cca38b-8346-4efc-b302-8709bf897b14', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7f851c07-1bbe-4d23-8017-70bde793aa44', '2025-11-26 19:30:10.75+00', NULL, NULL, '2025-11-25 19:30:10.829184+00', '2025-11-25 19:30:10.829184+00'),
('c65d1b6c-6088-46e2-8a01-da0f8a4273ff', 'a402caa2-bbee-4681-b941-0a0e48237f09', '7e21b7a7-b35e-4e28-a3cd-dad93e35d8d8', '2025-11-27 15:05:03.654+00', NULL, NULL, '2025-11-26 15:05:03.698419+00', '2025-11-26 15:05:03.698419+00'),
('c7663888-f8fd-4771-b3a1-262aa5568ff7', 'a402caa2-bbee-4681-b941-0a0e48237f09', '346604d5-1a2b-4e47-81a7-efe1bd5ec719', '2025-11-26 19:23:59.552+00', NULL, NULL, '2025-11-25 19:23:59.605826+00', '2025-11-25 19:23:59.605826+00'),
('cac27267-7586-4e71-a7f3-5aa3397a2f17', 'a402caa2-bbee-4681-b941-0a0e48237f09', '42d6964a-6ced-46f1-a137-0a311cf5fabc', '2025-11-27 14:37:14.698+00', NULL, NULL, '2025-11-26 14:37:14.758088+00', '2025-11-26 14:37:14.758088+00'),
('d0354019-2f4e-4c2b-b712-dc0096df832a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'e88b1058-ca6e-4f6f-8745-ec623d1ce6f4', '2025-11-27 14:48:34.827+00', NULL, NULL, '2025-11-26 14:48:34.884567+00', '2025-11-26 14:48:34.884567+00'),
('d178f77d-ba74-43b7-a756-e27babf32824', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'd7b24aab-f2f8-4f8d-9354-32eec8352a5b', '2025-11-26 14:52:05.174+00', NULL, NULL, '2025-11-25 14:52:05.246784+00', '2025-11-25 14:52:05.246784+00'),
('d5249715-983c-485f-bedf-5506e887eaa7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'a177ccf3-d5a9-4046-a46b-d50ea1a43e42', '2025-11-28 00:49:57.084+00', NULL, NULL, '2025-11-27 00:49:57.136105+00', '2025-11-27 00:49:57.136105+00'),
('ded0b65b-5177-4ec8-b945-1cab4f2eaa31', 'a402caa2-bbee-4681-b941-0a0e48237f09', '4d11262a-f1a2-4d38-ad5a-194a67214564', '2025-11-26 14:50:51.562+00', NULL, NULL, '2025-11-25 14:50:51.584927+00', '2025-11-25 14:50:51.584927+00'),
('e1d7deea-cd09-4fcf-a06d-1abda2f8d8aa', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2deadecf-586b-45e0-89ff-bd4bf7306325', '2025-11-26 14:53:08.002+00', NULL, NULL, '2025-11-25 14:53:08.05661+00', '2025-11-25 14:53:08.05661+00'),
('ebc2fdf5-0600-4fd6-aeac-3ddd0d448a99', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'b5b48e5c-c613-4bec-a43a-88d7cc088304', '2025-11-27 14:34:53.389+00', NULL, NULL, '2025-11-26 14:34:53.449222+00', '2025-11-26 14:34:53.449222+00');
INSERT INTO "public"."attendance_records" ("id", "user_id", "attendance_date", "scheduled_start", "scheduled_end", "check_in", "check_out", "status", "minutes_late", "notes", "created_at", "updated_at") VALUES
('4b7b8061-93ba-45d4-9621-62d98b20c29b', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-26', '09:00:00', '18:00:00', '2025-11-26 12:35:00+00', '2025-11-27 02:36:00+00', 'puntual', 0, 'Biometric: ESP32-001', '2025-11-27 02:35:54.105325+00', '2025-11-27 04:24:00.099699+00'),
('b1fb3551-3d58-4c1f-a34d-820e7e51bae8', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', '2025-11-25', '09:00:00', '18:00:00', '2025-11-26 05:50:02.408+00', NULL, 'tarde', 890, 'Biometric: ESP32-001', '2025-11-26 05:50:02.569718+00', '2025-11-26 05:50:02.569718+00'),
('c9a06449-524a-454c-ae14-bd7dd5fb99e3', '03d65d92-28a9-4c56-b87a-16f75c4377c3', '2025-11-26', '09:00:00', '18:00:00', '2025-11-27 05:49:00+00', '2025-11-27 04:17:00+00', 'tarde', 889, 'Biometric: ESP32-001', '2025-11-27 02:49:07.744723+00', '2025-11-27 04:23:50.995446+00'),
('d9de36e0-d00b-4a9a-882e-6542eabb289f', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', '2025-11-25', '09:00:00', '18:00:00', '2025-11-25 21:14:00+00', '2025-11-26 04:14:00+00', 'tarde', 374, 'Biometric: ESP32-001', '2025-11-26 03:14:19.24231+00', '2025-11-26 03:15:13.286361+00');
INSERT INTO "public"."profiles" ("id", "user_id", "full_name", "email", "phone", "address", "birth_date", "hire_date", "department", "position", "manager_id", "status", "avatar_url", "emergency_contact_name", "emergency_contact_phone", "must_change_password", "biometric_id", "created_at", "updated_at", "area_id", "position_id") VALUES
('00e5d836-ece5-4ca8-bd62-d493303fed0e', 'ef2bcefd-29d3-4675-9873-5964c5103f58', 'Velazquez Perez Vertin', 'vertin@gmail.com', '3243252', 'México', NULL, '2025-11-27', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-27 03:46:34.70517+00', '2025-11-27 03:52:01.861692+00', '49625dd9-c73d-4e8d-8d30-8b2789437b6e', 'c95bff1b-2432-4e71-b507-11a5510bf6be'),
('417b328c-2be2-49b7-8c69-32fad3af1e9a', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'Pedro', 'pedro@gmail.com', '7356723546', 'Morelos', NULL, '2025-11-25', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-25 19:56:29.559916+00', '2025-11-27 03:06:11.90977+00', '38e040f2-d503-42e1-b8de-be0855aa6fbc', NULL),
('728b3dde-c8e1-43f6-9018-42bf921e1662', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'Nombre Completo', 'usuario@ejemplo.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'activo', NULL, NULL, NULL, 'f', NULL, '2025-11-25 04:12:17.785215+00', '2025-11-25 05:22:36.766268+00', NULL, NULL),
('7b9cbe27-1582-4aed-adcc-bf2f911385d1', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'Irvin Sahi Sedeño Trujillo', 'irvin@gmail.com', '34545653', NULL, NULL, '2025-11-27', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 8, '2025-11-26 14:36:26.451117+00', '2025-11-27 02:36:18.499251+00', '49625dd9-c73d-4e8d-8d30-8b2789437b6e', NULL),
('9dd44ed0-6a95-4894-a119-02de50a26d13', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'Barco Hernandez', 'chito@talento.com', '8324893482', 'Mexico', NULL, '2025-11-25', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 1, '2025-11-25 19:50:08.703749+00', '2025-11-26 01:28:12.745545+00', NULL, NULL),
('b2b68577-df6b-4912-b1f9-c4f36eb579bf', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'David', 'david@gmail.com', '7356744533', 'Morelos', NULL, '2025-11-25', 'General', 'Limpieza', NULL, 'activo', NULL, NULL, NULL, 't', 2, '2025-11-25 21:37:25.777172+00', '2025-11-26 03:17:57.288825+00', '397b2a1c-6bde-4ee4-a98a-4b0619656617', NULL),
('c972c4ca-d719-4536-8b02-a331f2b1240d', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'Emmanuel Saliff Vallecillo Alvarado', 'emmanuel@gmail.com', '7362932712', 'México', NULL, '2025-11-27', 'Tecnología', 'Desarrollador Web', NULL, 'activo', NULL, NULL, NULL, 't', NULL, '2025-11-26 05:39:41.242551+00', '2025-11-27 03:06:11.90977+00', 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', NULL);
INSERT INTO "public"."audit_logs" ("id", "user_id", "action", "table_name", "record_id", "old_values", "new_values", "ip_address", "user_agent", "created_at") VALUES
('05f05938-4d8d-430b-a21d-34e57630fc3f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a175e709-3c7f-40d4-8680-638c89713a4a', '{"deleted_at": "2025-11-27T03:45:40.660374+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-27 03:45:40.660374+00'),
('079b1b53-b859-42da-b15c-ba36fde301cc', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'b861899c-8039-4812-9e29-66f7042924f5', '{"deleted_at": "2025-11-26T04:48:50.231947+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:48:50.231947+00'),
('14c57124-389e-4d58-962c-6bb60db5668c', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '7cf169c3-3c04-4cde-b7fc-9723b04c3eb0', '{"deleted_at": "2025-11-26T04:40:01.201408+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:40:01.201408+00'),
('40b07c50-f47c-4b09-bb17-f35413dd6176', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'c1b42160-1257-4d48-8223-ee1ae3363ae7', '{"deleted_at": "2025-11-25T14:44:33.616286+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-25 14:44:33.616286+00'),
('42ef09c6-cee8-4ab7-b659-70ff228d3dbe', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '53779886-f93f-4b9d-b43b-52d938a6d846', '{"deleted_at": "2025-11-26T05:39:01.091543+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:39:01.091543+00'),
('53a6bff3-928d-4935-8184-ed53c49ec360', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '20429930-d675-478d-9f73-76b0bb9936ba', '{"deleted_at": "2025-11-26T05:36:08.744373+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:36:08.744373+00'),
('6c28d15b-4561-4d11-8f47-e08f89c9541a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '719b6637-db4a-4d3c-9fbf-1c291c4c9eef', '{"deleted_at": "2025-11-26T05:16:50.529833+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:16:50.529833+00'),
('71867398-fb5b-4d21-a5b1-41e9a6b79022', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '0d74d54e-9b17-412d-a2c7-4c0f8bb6b872', '{"deleted_at": "2025-11-26T14:30:20.416466+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 14:30:20.416466+00'),
('85d64b3d-9d7a-453c-aa88-97a0ad5bce3a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'ddc4194d-0862-47c5-b559-413c339dba4a', '{"deleted_at": "2025-11-26T05:33:04.689682+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:33:04.689682+00'),
('b2ec9d37-600f-4d09-a7e8-b86013ba16b2', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'bb372a87-1ea9-4652-9054-002c00c9066b', '{"deleted_at": "2025-11-26T05:13:24.263693+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:13:24.263693+00'),
('b8820a9a-de40-41f0-a08a-47057d53ff21', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a7cdf496-e1af-4e99-b3d6-4a9531f140ee', '{"deleted_at": "2025-11-26T05:10:02.181119+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 05:10:02.181119+00'),
('c06a2f92-86e6-4488-82e4-38cc1e43dff3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'a7db4fd3-6eee-4b1c-aeb3-f18b64d35a6c', '{"deleted_at": "2025-11-26T04:47:10.955372+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:47:10.955372+00'),
('ca2ae1a0-c5c4-45da-8206-cd4962ce363d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '6bd3fda5-1fd6-442d-bb01-9b3826142ac9', '{"deleted_at": "2025-11-26T04:50:19.427564+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:50:19.427564+00'),
('dc72ed54-98da-4816-82d7-166c5828bd03', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '1b4e17c4-422b-43b5-bbfd-64bca06daad3', '{"deleted_at": "2025-11-26T04:55:00.787496+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:55:00.787496+00'),
('e3ef7780-dcb5-4034-88c2-3494fa741562', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', '4acef76d-12e7-45fb-8150-f2c81606b3b5', '{"deleted_at": "2025-11-26T04:37:58.735088+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:37:58.735088+00'),
('f36320f3-a00a-4ac5-a2d9-6dc3e867d675', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'DELETE', 'users', 'cfbd1d8e-3fea-4cfa-864a-ea9d65a2e65b', '{"deleted_at": "2025-11-26T04:29:58.883016+00:00", "deleted_by": "a402caa2-bbee-4681-b941-0a0e48237f09"}', NULL, NULL, NULL, '2025-11-26 04:29:58.883016+00');
INSERT INTO "public"."contracts" ("id", "user_id", "contract_number", "type", "position", "department", "start_date", "end_date", "salary", "status", "file_path", "notes", "created_at", "updated_at", "area_id", "position_id", "file_url") VALUES
('10ab9939-1c58-4a29-a6d0-d545a7ff914d', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'CNT-731293-cqro', 'indefinido', 'Limpieza', 'General', '2025-11-25', NULL, NULL, 'activo', NULL, NULL, '2025-11-25 21:37:26.499038+00', '2025-11-25 21:37:26.499038+00', NULL, NULL, NULL),
('2c1d4712-1920-44bf-afeb-430bf3b9b2d2', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-579580-7ww0', 'indefinido', 'Limpieza', 'General', '2025-11-26', NULL, NULL, 'activo', NULL, NULL, '2025-11-26 05:39:41.918256+00', '2025-11-26 05:39:42.856239+00', NULL, NULL, '3b462775-0e25-47bd-a34a-e35ac8923cac/CNT-579580-7ww0.pdf'),
('4bedb0fb-e9e6-4e02-91d8-efd8b798db0a', 'ef2bcefd-29d3-4675-9873-5964c5103f58', 'CNT-190798-e686', 'indefinido', 'Limpieza', 'General', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 03:46:35.295493+00', '2025-11-27 03:46:35.295493+00', NULL, NULL, NULL),
('760f3700-d151-4607-8af7-2ba33992bf4b', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'CNT-675193-4wm5', 'indefinido', 'Limpieza', 'General', '2025-11-25', NULL, NULL, 'activo', NULL, NULL, '2025-11-25 19:56:30.231991+00', '2025-11-25 19:56:30.231991+00', NULL, NULL, NULL),
('90d4c952-8d08-4089-bcf0-93a4b6e75468', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'CNT-176319-ws75', 'indefinido', 'Limpieza', 'General', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 02:06:20.885948+00', '2025-11-27 02:06:20.885948+00', NULL, NULL, NULL),
('be1710d5-5b9a-4fa0-9249-da39bd72dc69', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'CNT-182777-wwtf', 'indefinido', 'Desarrollador Web', 'Tecnología', '2025-11-27', NULL, NULL, 'activo', NULL, NULL, '2025-11-27 02:23:07.396615+00', '2025-11-27 02:23:07.396615+00', NULL, NULL, NULL);
INSERT INTO "public"."auth_audit" ("id", "user_id", "email", "action", "ip_address", "user_agent", "success", "metadata", "created_at") VALUES
('00260da1-8d6a-4a9d-a930-129270b6493a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:51:48.571203+00'),
('01814298-0064-4608-b8b3-c98ac3824c35', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:48:59.614068+00'),
('045469d8-6625-4bc9-b7e6-67ba8c1b8153', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:51:28.721351+00'),
('066acd4d-e2f7-422d-9b65-93c2f8b09ee3', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:52:45.289435+00'),
('0d3a0a2f-9c02-4ac9-a5e2-936bfbba674e', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:51:20.882045+00'),
('0e814771-7457-40b4-963c-3fd548c584b4', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:07:15.668959+00'),
('12894326-d237-4692-8d6e-a9bea22fc1ae', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:52:05.458401+00'),
('12b03cb5-518b-483d-b454-fb236d2217d9', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:50:51.660632+00'),
('14885489-b2d9-4699-846b-099efd44b11a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:07:42.49271+00'),
('1701a997-5305-4979-a92b-62fecde47b78', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 05:06:50.665423+00'),
('18dc8f01-391d-4f73-86a8-2fd3f2e34590', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 04:24:25.472819+00'),
('1d8f268a-6e11-4894-b642-62efb571751b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 13:22:48.894983+00'),
('1f60a1ce-6d0e-4ce6-8602-a8a7619e890c', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:14:22.478631+00'),
('2372da16-6735-4be4-b1a9-0624e76b0e39', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 13:22:33.067522+00'),
('240c287b-0159-4a89-8988-560a1eec8134', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:35:52.016463+00'),
('2905c99b-be80-41bd-86d8-afac4a0cd286', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:05:03.799648+00'),
('2ad988ff-2404-4b25-a944-95d81212dabd', 'ea6ab625-c61f-47f2-8ab1-890426eac147', 'chito@talento.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 19:50:08.345902+00'),
('2f1e6cad-8247-48bd-95d5-30e05f083b3d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:54.700893+00'),
('303a66e4-f8b6-4edc-9eff-04ce6de1fbaa', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:10:50.332107+00'),
('305190ec-ba4e-4ec6-9ec0-9cb8070400ad', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:25.827315+00'),
('3181818d-68d7-4a9d-9dbb-57cc46c8e953', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:14.43474+00'),
('330497d9-32e6-4b22-b830-84b877eca2a7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'failed_login', NULL, NULL, 'f', '{"locked": false, "failed_attempts": 1}', '2025-11-25 14:46:38.896523+00'),
('33a3cc76-89c0-4422-838c-b38d2c018ba7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:50:00.768195+00'),
('36571150-6b7e-4fb0-a8a8-7b9b3bc72715', NULL, 'Baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:40.566928+00'),
('39883697-f23f-4838-8a75-4bca2245abb3', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:36:12.012745+00'),
('39ae8086-3359-4b8d-b20f-b5a58831f55a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:23:59.720674+00'),
('3a8fcc11-1d0a-4c56-8cbd-23d2dc879890', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-26 00:12:37.260287+00'),
('3af7721f-d4a7-4a30-a2a3-7e897ac32e5f', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:26:52.196594+00'),
('3bc2fc48-ee41-4e38-ab38-6dd6ff9417cf', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:06:25.76248+00'),
('41c0506c-5acc-4829-9380-6c6f1b227e1f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:47:01.89929+00'),
('439d1f74-0366-4f13-8c27-3958ada8de0d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:18:29.132121+00'),
('45432dbf-80ef-431e-8cd5-81095814cda5', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:49:28.344334+00'),
('4d040261-c16c-404c-8ee6-3299430c0811', NULL, 'usuario_ejemplo ', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:48:04.01368+00'),
('4ea73cf1-0d10-4b5a-8dda-e8be0838c22d', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 00:49:57.271644+00'),
('4eb80e8c-ed16-44ec-944a-c22f85c5e2e0', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:39:40.813255+00'),
('53210da1-dd2d-4154-b811-bda6fec14299', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 15:02:15.367951+00'),
('55054db0-cd6d-4a41-bc4f-fc7f336a466f', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:36:57.503524+00'),
('5719b1a2-ad67-4098-96e8-d0c1a0e6fb78', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 05:55:32.050886+00'),
('57bef152-a181-4b0a-9477-6223ff2dc6bf', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 04:18:32.308637+00'),
('5bfea6e2-38de-4c76-b382-179d4bc55798', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 03:58:32.796037+00'),
('5cb6dde9-a753-4bee-a747-9412ef16685f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:37:14.960019+00'),
('5d8a18e3-739e-41ed-842e-284b31843ea7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 00:12:48.338354+00'),
('5f75fc3b-19ce-4256-b2d5-fb59ee7070c1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:39:21.623144+00'),
('60b6d159-a8cc-477a-bc72-3e46a1b0f2cd', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:31:40.037662+00'),
('62a97ab9-e4fa-4e21-8bb0-2fc98d823371', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'pedro@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 19:56:29.208007+00'),
('68b9e9a1-89c1-417a-b99e-800c75f87704', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'david@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 21:37:25.328475+00'),
('6ad2e94f-ae1c-47fc-9dad-4521d46d4513', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:36:29.213961+00'),
('6c37094d-8301-4a65-8fb3-b446f1db768d', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:58:19.754678+00'),
('6df026b3-2ac7-46e5-9f54-2131c6b3e09a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:58:31.668621+00'),
('6e246031-ece8-4870-b171-61834cbee256', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 00:10:50.059187+00'),
('7377064d-b1c0-45b6-ad3d-86d1d265a4e0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 04:39:41.06286+00'),
('771bdd0f-c080-46ea-b202-d01aba9f6e9f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:58:54.688245+00'),
('7aecc614-1647-4425-bf91-4a2de0bb892f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:49:17.289067+00'),
('7be45b1f-c68e-4abc-a35d-7c1fdc70b48d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:56:12.428343+00'),
('86a4a73b-1afc-4d8d-b5f3-b8be3970ee8f', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:44:51.109256+00'),
('86ec3a55-b66a-4504-acd3-ed2b109ca508', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 05:55:14.661975+00'),
('89d86b59-2615-4077-88d2-55113e95611a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:33:13.555192+00'),
('89f26f8f-dcfe-41b5-bef7-4125f16677c3', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:37:06.578309+00'),
('8de5aac2-7cea-473a-a5c6-ad4c86274c62', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 03:58:42.594033+00'),
('9044d624-d12b-48ae-ae8a-30842cc5c833', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:11:59.546031+00'),
('9261f3af-15c1-4065-88c0-60bef5580fc4', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:51:40.735266+00'),
('943d6438-d911-4274-bdef-1aedc822880b', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 19:30:11.215468+00'),
('986a05da-31af-4d34-8d64-10d7b4fa11f6', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:33:54.333215+00'),
('9a534336-e2a8-4bc1-981e-fbfc07015772', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 15:01:30.816815+00'),
('9b1f3ccb-2d82-43ec-8010-ee1c04989833', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:06:35.74822+00'),
('9c6a0424-4576-448e-8b16-362abbfb5698', NULL, 'rtx@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 02:57:08.812273+00'),
('9de4cbd0-2f2a-45dc-aa56-1ad8964baa77', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:43:35.898395+00'),
('a1af026d-0cb7-4165-af58-7af6a8a94e91', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:44:31.418462+00'),
('a2628faf-6721-4190-ae99-4fb98fca8c9a', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:47:46.159905+00'),
('a357384b-4243-4db1-8b13-4e93b2b41beb', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 05:18:30.702518+00'),
('a6393688-8945-45d3-bea5-f4c8195c6e00', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:48:35.09262+00'),
('a917453d-30ec-4402-814a-d0f559aa048c', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:38:40.238367+00'),
('acd096ac-269a-4dfe-9aab-4c50294814b8', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:36:06.585102+00'),
('ae74a066-8b1c-4a15-8679-de972229b921', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 'irvin@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 14:33:29.196135+00'),
('afa05509-188d-4602-b285-40cf022b3d27', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:34:53.650703+00'),
('b0b4d70c-d81a-4976-8b11-c105e97932c5', 'ef2bcefd-29d3-4675-9873-5964c5103f58', 'vertin@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-27 03:46:34.369071+00'),
('b0fd04b1-99c1-4566-8ef8-5001eaadf4fa', NULL, 'usuario_prueba', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:38:55.255945+00'),
('b65845b8-e342-4a15-a24c-f17790e98506', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 05:57:40.799923+00'),
('b8d7bc77-5ec6-46e8-8f34-6da1a8f7421d', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 00:12:43.230841+00'),
('bab79a02-f080-40af-913d-319f433853a2', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 05:18:26.455656+00'),
('bc578b58-112f-4698-8bf9-f34530d45f2e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-27 01:56:23.388075+00'),
('bd0604e9-d626-45b9-9c07-ebab81a3b6d4', NULL, 'usuario_1', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:37:59.629367+00'),
('c20d1103-d62a-40b5-b913-1781edcbad7a', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:16:38.739128+00'),
('c7e82cbb-9332-48d4-8288-353cf430616b', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-25 14:50:30.457527+00'),
('c9e012ac-90f6-4277-9009-8b6c0e5eace7', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 03:55:06.724614+00'),
('cb5d55b7-fff2-4385-b80e-8ee15691a404', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:44:49.816151+00'),
('cd11f5d7-e639-4231-a84a-efb27601de4e', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:55:26.536629+00'),
('cd70fe9f-28ce-4928-ba71-58ccafcf2f54', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:54:40.20968+00'),
('cdf43740-5523-45e3-9dd3-a76414f312b2', NULL, 'Baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:50:48.318294+00'),
('d1ca65c4-e93a-44b6-b9b4-50448bb6c2d0', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:31:42.56754+00'),
('d3a8cf9e-825d-4ce5-90b7-120b54974809', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:59:14.078504+00'),
('d519f9fa-12a8-4c96-95a5-454a0a8533f4', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:39:43.00206+00'),
('d5d040fa-c669-426d-9a6e-43bc44090a99', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:54:28.756478+00'),
('d8e900f8-13e1-4b2b-91e6-f6028de1f6bf', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:52:33.579313+00'),
('e18695a5-8420-4e74-875e-608b475379b6', NULL, 'admin@sistema.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 05:19:14.956557+00'),
('e4ce4e3f-8ab1-42f1-b249-f117c0343b30', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:53:08.254024+00'),
('e61028d2-c870-4c55-a1dc-96a53cda3dbd', NULL, 'ejemplo_usuario', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 13:22:17.010714+00'),
('e7348386-30e3-493d-9fdc-c5b725754913', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-25 05:18:20.230979+00'),
('e7e102d5-23f1-41ba-99fe-7121305e0ae1', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:46:58.680323+00'),
('ea69e7a9-27e3-4587-adae-ebd68d50a925', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:29:51.470648+00'),
('ecc616a6-f06e-46ae-ac33-fcddc5693b8d', NULL, 'admin@sistema-rrhh.com', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 15:04:52.698879+00'),
('edf4f6a1-4810-459c-891c-4926c91da4e8', NULL, 'emmanuel@gmail.com', 'signup', NULL, NULL, 't', NULL, '2025-11-26 04:41:19.012896+00'),
('ef3c6b2a-275a-471f-8140-57d4a8cee441', NULL, 'pedro@vacante.com', 'signup', NULL, NULL, 't', NULL, '2025-11-25 06:03:49.621225+00'),
('effb9897-1e02-4d24-8446-f17f7936ed99', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 01:53:37.571506+00'),
('f0ca8080-6902-4133-b77a-33c2115880eb', NULL, 'baeza', 'failed_login', NULL, NULL, 'f', '{"reason": "user_not_found"}', '2025-11-26 14:53:00.277537+00'),
('f8eb99c8-5701-4d0a-87e7-1c145231b7d3', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-26 14:56:20.605251+00'),
('f9590253-6b98-4bf3-9ef1-f2fa7b2a5d4d', 'a402caa2-bbee-4681-b941-0a0e48237f09', NULL, 'logout', NULL, NULL, 't', NULL, '2025-11-26 00:10:45.086164+00'),
('feb8d3ba-92bd-46eb-99de-9d3f3e3e70fe', 'a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'login', NULL, NULL, 't', NULL, '2025-11-25 14:42:37.475772+00');



INSERT INTO "public"."despidos" ("id", "employee_id", "tipo_despido", "motivo", "fecha_despido", "estado", "indemnizacion", "liquidacion_final", "observaciones", "created_by", "created_at", "updated_at") VALUES
('983214ae-1583-44a8-86da-06d210e941cb', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 'voluntario', 'dededededdsdsd', '2025-11-26', 'cancelado', NULL, NULL, NULL, NULL, '2025-11-26 10:04:41.277951+00', '2025-11-26 10:04:41.277951+00');
INSERT INTO "public"."incidents" ("id", "title", "description", "incident_type", "severity", "location", "status", "reported_by", "assigned_to", "resolution", "resolved_at", "file_paths", "created_at", "updated_at") VALUES
('3577c7a1-c088-4422-aed0-dbef2c2f7e61', 'Caída de escaleras', 'El empleado se accidento bajando las escaleras', 'accidente_laboral', 'alta', 'Escaleras', 'abierto', 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', NULL, NULL, NULL, '2025-11-26 14:35:58.734173+00', '2025-11-26 14:35:58.734173+00'),
('63e79ae2-2580-4a0f-8733-6511f96b7b8f', 'Oficinas', 'Entrega de papeleos', 'permiso_laboral', 'media', 'Cuautla', 'en_progreso', 'a402caa2-bbee-4681-b941-0a0e48237f09', '03d65d92-28a9-4c56-b87a-16f75c4377c3', NULL, NULL, NULL, '2025-11-26 15:00:30.878846+00', '2025-11-26 15:00:30.878846+00');
INSERT INTO "public"."inventory_items" ("id", "name", "category", "description", "stock_quantity", "min_stock", "unit_price", "location", "status", "created_at", "updated_at") VALUES
('39dcc8ea-3a5c-4237-a1a0-2bb9bfefb415', 'Palas ', 'herramientas', 'Palas asi como las de Minecraft que nadie usa ', 50, 10, 200, 'Almacén C - Estante 1 ', 'disponible', '2025-11-26 14:58:56.099818+00', '2025-11-26 14:58:56.099818+00'),
('414a099e-a383-4a31-8f74-e43760fb122c', 'Arnés', 'equipos', 'Arnés de Seguridad ', 20, 5, 500, 'Almacen B - Estante 1 ', 'disponible', '2025-11-26 14:51:38.033814+00', '2025-11-26 14:51:38.033814+00'),
('56224d0b-423c-4548-9ccb-31f62930378a', 'Pico ', 'herramientas', 'Picos asi como los de Minecraft ', 50, 10, 300, 'Almacén C - Estante 1 ', 'disponible', '2025-11-26 14:53:47.861228+00', '2025-11-26 14:53:47.861228+00'),
('8268f09f-8758-4846-95de-880b4db7dcb5', 'Arnés', 'equipos', 'Arnés de Seguridad', 30, 5, 500, 'Almacen B - Estante 1 ', 'disponible', '2025-11-26 14:54:45.423468+00', '2025-11-26 14:54:45.423468+00'),
('a91a21dc-df95-417b-962d-b6a0293995df', 'Pala', 'epp', 'sdfghj', 100, 10, 10, 'a', 'disponible', '2025-11-26 14:58:56.917529+00', '2025-11-26 14:58:56.917529+00'),
('bab603d1-e1ab-4fdf-b503-e590db97c264', 'Guantes nitrilo', 'insumos', 'XX', 99, 2, NULL, 'Alamcen estante A', 'disponible', '2025-11-26 14:34:33.538313+00', '2025-11-26 14:34:33.538313+00'),
('f5eba3d2-49d7-46df-a949-92c1e7a78543', 'Arnés', 'equipos', 'Arnés de Seguridad', 30, 5, 500, 'Almacen B - Estante 1 ', 'disponible', '2025-11-26 14:55:10.574592+00', '2025-11-26 14:55:10.574592+00');
INSERT INTO "public"."documents" ("id", "title", "category", "description", "file_path", "file_size", "mime_type", "uploaded_by", "employee_id", "is_public", "estado", "motivo_rechazo", "tags", "version", "created_at", "updated_at") VALUES
('2a55c80e-62ab-4726-b9b3-fc1b2e994d8c', 'Crup', 'certificado', 'archivo pdf de curp del personal', 'general/5t5mccxmdpw.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 't', 'pendiente', NULL, '{rrhh}', 1, '2025-11-26 15:07:13.389213+00', '2025-11-26 15:07:13.389213+00'),
('36a7e601-b3f0-4f39-9f1b-4c5be49313ce', 'INE', 'identificacion', 'INE', 'general/5ub7nvosp5o.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 't', 'validado', NULL, '{rrhh,INE,2025}', 2, '2025-11-26 00:41:44.623424+00', '2025-11-26 00:43:25.339+00'),
('37c09c3b-e576-4de8-9694-ccda22784deb', 'Presentacion', 'contrato', 'Prueba presentacion', 'general/gjqfqdg4fql.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 't', 'validado', NULL, '{rrhh,CVV,2025}', 1, '2025-11-26 15:07:31.846589+00', '2025-11-26 16:01:16.69+00'),
('4a8e93cc-900a-401e-ba35-d41f603abf74', 'CV', 'otro', NULL, 'general/d94n50ye4i7.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'f', 'rechazado', 'malo', NULL, 1, '2025-11-27 04:25:28.11707+00', '2025-11-27 04:25:31.406+00'),
('5dea5584-d25c-4cd6-96c2-01fc1f19a871', 'prueba', 'otro', NULL, 'general/69n2mftexuq.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '3b462775-0e25-47bd-a34a-e35ac8923cac', 'f', 'validado', NULL, NULL, 1, '2025-11-26 05:41:31.437931+00', '2025-11-26 05:48:44.911+00'),
('81eb9a82-2dcf-4c8a-9fc6-86ffa4306b51', 'Prueba ', 'identificacion', 'prueba de duplicidad de mismo empleado', 'general/s93aa3lammc.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'f', 'rechazado', 'No me gusto :D', '{rrhh}', 1, '2025-11-26 15:08:55.937773+00', '2025-11-26 16:01:05.93+00'),
('b241f624-84e2-4b44-9086-3f56b6f48974', 'CVV', 'otro', 'CVV', 'general/a6en8s64skq.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 't', 'rechazado', 'No cumple con los requisitos - El formato de entrega del documento oficial no es el solicitado.', '{CVV,2025}', 2, '2025-11-26 01:18:21.571149+00', '2025-11-26 01:55:30.133+00'),
('d379bd48-cd4c-487e-93de-0a14c468cf53', 'RFC', 'identificacion', 'RFC del empleado', 'general/ga7otsq4p6.pdf', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 't', 'validado', NULL, '{rrhh,RFC,2025}', 1, '2025-11-26 16:05:43.079876+00', '2025-11-27 02:25:43.492+00');
INSERT INTO "public"."recruitment_positions" ("id", "title", "department", "location", "seniority", "description", "status", "hiring_manager", "work_start_time", "work_end_time", "created_by", "created_at", "updated_at") VALUES
('12d9434d-0035-494f-927e-2e027860a15b', 'Limpieza', 'General', 'Acceso general', NULL, NULL, 'abierta', NULL, '05:00:00', '12:00:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 14:54:09.26973+00', '2025-11-25 14:54:09.26973+00'),
('5c852dec-6110-4650-9f8e-04f33820272e', 'Desarollador Web', 'Tecnología', 'Sede 2', 'Junior', NULL, 'en_proceso', NULL, '06:29:00', '07:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-26 14:40:19.379374+00', '2025-11-26 14:40:19.379374+00'),
('dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'Desarrollador Web', 'Tecnología', 'Sede 2', 'Junior', NULL, 'abierta', NULL, '06:29:00', '19:30:00', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-26 14:28:15.331785+00', '2025-11-26 14:28:15.331785+00');
INSERT INTO "public"."recruitment_applications" ("id", "candidate_id", "position_id", "status", "current_stage", "hiring_manager", "salary_expectation", "availability_date", "priority", "created_by", "created_at", "updated_at") VALUES
('1c028dbd-df46-487e-b46a-044dfaf13522', 'f132a8dc-114f-4620-bcea-ba0d2dd24aa8', '12d9434d-0035-494f-927e-2e027860a15b', 'en_revision', 'screening', NULL, NULL, NULL, 'media', NULL, '2025-11-26 04:53:29.195761+00', '2025-11-26 04:53:29.195761+00'),
('2a30107f-ea86-4b9b-bae3-dcf4801e70aa', '156ce631-6393-4bb2-9673-20322519f706', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 03:46:10.648591+00', '2025-11-27 03:46:10.648591+00'),
('2a30470e-1fc5-4ca4-be39-40e801aa0b9b', '256521ce-41f2-4ab8-8980-d54f745d7486', 'dec356d7-294c-43fc-8efa-7e11ebeb9eba', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-27 02:22:50.79705+00', '2025-11-27 02:22:50.79705+00'),
('2f6982d6-4d74-4cd7-8b16-06a71a5b9fd4', '47dd4e71-53fa-47f8-b65d-6ce02cec5e0c', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-25 19:55:21.542485+00', '2025-11-25 19:55:21.542485+00'),
('aeff9c9d-6343-4726-b9c0-595da7672086', '5ccce63d-7b31-48fc-aada-36c138c3832f', '12d9434d-0035-494f-927e-2e027860a15b', 'contratado', 'contratado', NULL, NULL, NULL, 'media', NULL, '2025-11-25 21:36:46.293727+00', '2025-11-25 21:36:46.293727+00');

INSERT INTO "public"."recruitment_interviews" ("id", "application_id", "interview_type", "scheduled_at", "duration_minutes", "location", "meeting_url", "status", "decision", "feedback_summary", "next_steps", "created_by", "created_at", "updated_at") VALUES
('463d0253-f125-4ad6-8efb-e1171ded6cab', 'aeff9c9d-6343-4726-b9c0-595da7672086', 'screening', '2025-11-25 21:38:00+00', 30, 'Sala', 'https://mail.google.com/mail/u/0/?pli=1#inbox/FMfcgzQcqtkLBGdZRNwGpwrJhrVcbSfk', 'completada', 'aprobado', 'Aprobado', 'Prueba 2', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 21:37:09.180314+00', '2025-11-25 21:37:09.180314+00'),
('7864dbaf-ac8f-4fda-bea6-355deebd85dc', '2f6982d6-4d74-4cd7-8b16-06a71a5b9fd4', 'screening', '2025-11-25 19:57:00+00', 30, 'Sala', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'completada', 'aprobado', 'prueba', 'prueba', 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-25 19:55:53.41903+00', '2025-11-25 19:55:53.41903+00'),
('caf4c144-ead5-42ca-93df-2e7cb67201b2', '2a30107f-ea86-4b9b-bae3-dcf4801e70aa', 'screening', '2025-11-27 03:46:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 03:46:18.194784+00', '2025-11-27 03:46:18.194784+00'),
('ed9b67a6-2146-4b68-be72-ac89caa3e548', '2a30470e-1fc5-4ca4-be39-40e801aa0b9b', 'tecnica', '2025-11-27 02:22:00+00', NULL, NULL, NULL, 'completada', 'aprobado', NULL, NULL, 'a402caa2-bbee-4681-b941-0a0e48237f09', '2025-11-27 02:22:57.147648+00', '2025-11-27 02:22:57.147648+00');
INSERT INTO "public"."inventory_assignments" ("id", "item_id", "user_id", "quantity", "assigned_date", "return_date", "status", "notes", "created_at", "updated_at") VALUES
('015c6328-779b-40fe-978d-4ce7a21121d4', 'bab603d1-e1ab-4fdf-b503-e590db97c264', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 1, '2025-11-26', '2025-11-26', 'asignado', 'XCD', '2025-11-26 14:36:07.631113+00', '2025-11-26 14:36:07.631113+00');

INSERT INTO "public"."sh_sectors" ("id", "name", "description", "risk_level", "responsible_id", "created_at", "updated_at") VALUES
('3c21f12e-eb9d-4361-8a1c-fbcd8a70699d', 'Planta de produccion', 'XXX', 'medio', 'ea6ab625-c61f-47f2-8ab1-890426eac147', '2025-11-26 14:39:48.882911+00', '2025-11-26 14:39:48.882911+00');
INSERT INTO "public"."recruitment_candidates" ("id", "full_name", "email", "phone", "current_location", "resume_url", "source", "seniority", "status", "assigned_recruiter", "notes", "created_at", "updated_at", "rfc", "curp", "nss", "address") VALUES
('156ce631-6393-4bb2-9673-20322519f706', 'Velazquez Perez Vertin', 'vertin@gmail.com', '3243252', 'México', NULL, 'linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 03:46:10.486641+00', '2025-11-27 03:46:10.486641+00', NULL, NULL, NULL, NULL),
('256521ce-41f2-4ab8-8980-d54f745d7486', 'Emmanuel Saliff Vallecillo Alvarado', 'emmanuel@gmail.com', '7362932712', 'México', NULL, 'Linkedin', 'Junior', 'contratado', NULL, NULL, '2025-11-27 02:22:50.645492+00', '2025-11-27 02:22:50.645492+00', NULL, NULL, NULL, NULL),
('47dd4e71-53fa-47f8-b65d-6ce02cec5e0c', 'Pedro', 'pedro@gmail.com', '7356723546', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'prueba', '2025-11-25 19:55:21.339664+00', '2025-11-25 19:55:21.339664+00', NULL, NULL, NULL, NULL),
('5ccce63d-7b31-48fc-aada-36c138c3832f', 'David', 'david@gmail.com', '7356744533', 'Morelos', 'https://classroom.google.com/u/0/c/Nzg1OTA3MTEyNzQy', 'Bolsa de trabajo', 'Junior', 'contratado', NULL, 'Prueba', '2025-11-25 21:36:46.075409+00', '2025-11-25 21:36:46.075409+00', NULL, NULL, NULL, NULL),
('f132a8dc-114f-4620-bcea-ba0d2dd24aa8', 'Hector', 'altaerikiara@gmail.com', '7328289932', 'Mexico', NULL, 'Facebook', 'Semi Senior', 'contratado', NULL, NULL, '2025-11-26 04:53:28.547233+00', '2025-11-26 04:53:28.547233+00', NULL, NULL, NULL, NULL);
INSERT INTO "public"."device_commands" ("id", "device_id", "command_type", "payload", "status", "created_at", "updated_at") VALUES
('061f9f14-10f7-4c54-a6b7-d126f5bcfab8', 'ESP32-001', 'ENROLL', '{"biometric_id": 2}', 'processing', '2025-11-26 01:31:40.284076+00', '2025-11-26 01:31:48.20477+00'),
('30314bb5-04ed-480d-912c-82e3d9e63ef5', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:25:42.516086+00', '2025-11-26 01:25:46.381172+00'),
('49d0fcd1-9a69-47f6-b97d-0ad08de9ca4d', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:35:07.315074+00', '2025-11-26 14:35:51.709813+00'),
('4f48fa6e-b24b-4aba-86aa-66c1205440e3', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-25 06:12:49.156485+00', '2025-11-25 06:12:52.114725+00'),
('69f741f6-26f9-4cdd-bb57-e4089b0621c7', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:28:18.693913+00', '2025-11-26 01:28:23.751617+00'),
('970e06f2-b7a0-44b6-8b79-19c919cfb674', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-27 02:34:05.081382+00', '2025-11-27 02:35:36.383319+00'),
('9a37e821-7151-4b6e-9c15-5f8197e11088', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:34:37.396529+00', '2025-11-26 14:35:06.567107+00'),
('9b12b7e7-3653-42ba-8e3f-b801e974715f', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:34:20.477258+00', '2025-11-26 14:34:25.697184+00'),
('a4f78410-ff00-424e-9a6d-681c79e0e844', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-27 02:33:20.948915+00', '2025-11-27 02:35:22.098289+00'),
('a9e2c6f2-0b08-42c3-af4e-77927d1d405b', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 01:29:49.621715+00', '2025-11-26 01:29:58.942189+00'),
('c4cb8fda-8909-4dc9-af8a-3c18e984dcf3', 'ESP32-001', 'ENROLL', '{"biometric_id": 8}', 'processing', '2025-11-26 14:36:12.619102+00', '2025-11-26 14:37:56.354404+00'),
('d0b8f305-0dde-4375-a82a-c0cd47dbec8d', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-25 06:11:04.616171+00', '2025-11-25 06:11:07.187819+00'),
('ff93e6c3-d99b-4cca-98ca-5eb8d05e96f4', 'ESP32-001', 'ENROLL', '{"biometric_id": 1}', 'processing', '2025-11-26 14:35:31.035171+00', '2025-11-26 14:36:27.658009+00');

INSERT INTO "public"."users" ("id", "email", "username", "full_name", "phone", "password_hash", "status", "department", "position", "last_login_at", "created_at", "updated_at", "is_verified", "is_locked", "failed_login_attempts", "password_reset_token", "password_reset_expires_at", "verification_token") VALUES
('03d65d92-28a9-4c56-b87a-16f75c4377c3', 'irvin@gmail.com', 'irvin@gmail.com', 'Irvin Sahi Sedeño Trujillo', '34545653', '0ddc5f1fd6caf4d6569efdcb196d38ff:5c491664ea53f9ab945e055e61a3a3305388bd5dd599fdf4952f8a71d9015148', 'activo', NULL, NULL, NULL, '2025-11-26 14:33:28.982248+00', '2025-11-27 02:36:18.37205+00', 't', 'f', 0, NULL, NULL, NULL),
('3b462775-0e25-47bd-a34a-e35ac8923cac', 'emmanuel@gmail.com', 'emmanuel@gmail.com', 'Emmanuel', '342234', 'fc1f4f965cd1a35229fb6705dfa31e44:18976139081e84cb7e1ff1a5d9dc5deeea09b018a9259761d9c5e5d2eefd104b', 'activo', NULL, NULL, NULL, '2025-11-26 05:39:40.613765+00', '2025-11-26 05:39:40.613765+00', 't', 'f', 0, NULL, NULL, NULL),
('85981ed9-2f23-463f-bae7-8e41fe2a033b', 'pedro@gmail.com', 'pedro@gmail.com', 'Pedro', '7356723546', '66ce15e8fcebbf891b49457bca67adcc:7a7597a227b5149de376386ee813ff05726dbedd2ab75d8f6ce1078ab3a24145', 'activo', NULL, NULL, NULL, '2025-11-25 19:56:29.011228+00', '2025-11-25 19:56:29.011228+00', 't', 'f', 0, NULL, NULL, NULL),
('8c44e889-44df-45b1-a8bd-c969c4d3f7c6', 'david@gmail.com', 'david@gmail.com', 'David', '7356744533', 'b1e784d32d4b711888ae7ef648fd76cf:16e6888560a04483a612a12b56d84b5353b40cb8c8802970a246028712aaddfa', 'activo', NULL, NULL, NULL, '2025-11-25 21:37:25.113887+00', '2025-11-26 03:17:57.119832+00', 't', 'f', 0, NULL, NULL, NULL),
('a402caa2-bbee-4681-b941-0a0e48237f09', 'usuario@ejemplo.com', 'usuario_ejemplo', 'Nombre Completo', NULL, '917c19138cb462ece87665c881e0d018:0c27adb411dac546604df853d6ab6929253a45a528ada8c9a77ceb208bb6c58c', 'activo', NULL, NULL, '2025-11-27 04:39:40.92+00', '2025-11-25 04:12:17.785215+00', '2025-11-27 04:39:40.97243+00', 'f', 'f', 0, NULL, NULL, NULL),
('ea6ab625-c61f-47f2-8ab1-890426eac147', 'chito@talento.com', 'chito@talento.com', 'Barco Hernandez', '8324893482', '2db39e473e3dedb06264c1842a69f0c3:132bcba3005f1ddab3f2afc18ca2f313a7881744faa970710e578e99b4744ed8', 'activo', NULL, NULL, NULL, '2025-11-25 19:50:08.011036+00', '2025-11-26 01:28:12.533803+00', 't', 'f', 0, NULL, NULL, NULL),
('ef2bcefd-29d3-4675-9873-5964c5103f58', 'vertin@gmail.com', 'vertin@gmail.com', 'Velazquez Perez Vertin', '3243252', '8d8fd1aead494e1c17bb49a66c10e992:6526eb6f9a04243da0e3f66d0aa5d40dcd71bcfdd0dd8f1e76ecd119d16c854c', 'activo', NULL, NULL, NULL, '2025-11-27 03:46:34.164132+00', '2025-11-27 03:52:01.698075+00', 't', 'f', 0, NULL, NULL, NULL);

INSERT INTO "public"."positions" ("id", "title", "description", "area_id", "status", "created_at", "updated_at", "work_start_time", "work_end_time") VALUES
('2d56bf86-4046-4af3-8d53-efcb24c06e61', 'Limpieza', NULL, '38e040f2-d503-42e1-b8de-be0855aa6fbc', 'active', '2025-11-25 19:50:06.742577+00', '2025-11-25 19:50:06.742577+00', '09:00:00', '18:00:00'),
('53e8644c-02cb-42a9-a4fa-00ba84d912a5', 'Desarrollador Web', NULL, 'd25f6bd0-6a75-4b0c-b19c-bce8bfac2c16', 'active', '2025-11-27 02:23:06.287459+00', '2025-11-27 02:23:06.287459+00', '09:00:00', '18:00:00'),
('c95bff1b-2432-4e71-b507-11a5510bf6be', 'Desarrollador BackEnd', NULL, 'fbcfb05d-f7d5-421b-a344-d3bf20c1f235', 'active', '2025-11-25 05:46:53.733113+00', '2025-11-25 05:46:53.733113+00', '12:24:00', '17:24:00');
INSERT INTO "public"."vacation_balances" ("id", "user_id", "total_days", "used_days", "available_days", "year", "created_at", "updated_at") VALUES
('6004590f-deb1-465e-9626-723b6ba44c2b', 'ef2bcefd-29d3-4675-9873-5964c5103f58', 15, 0, 15, 2025, '2025-11-27 03:46:34.70517+00', '2025-11-27 03:46:34.70517+00'),
('93a8589c-7c56-4f6b-8b04-b149612e0e48', '03d65d92-28a9-4c56-b87a-16f75c4377c3', 15, 0, 15, 2025, '2025-11-27 02:06:20.345054+00', '2025-11-27 02:06:20.345054+00'),
('dac9608d-4220-419e-8779-5a29ef7d2294', '3b462775-0e25-47bd-a34a-e35ac8923cac', 15, 0, 15, 2025, '2025-11-27 02:23:06.72456+00', '2025-11-27 02:23:06.72456+00'),
('e940af87-b714-4747-addc-789d146f9e0f', '85981ed9-2f23-463f-bae7-8e41fe2a033b', 0, 0, 12, 2025, '2025-11-27 03:06:11.90977+00', '2025-11-27 03:06:11.90977+00');


