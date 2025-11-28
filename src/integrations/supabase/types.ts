export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_area_id: string | null
          responsible_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_area_id?: string | null
          responsible_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_area_id?: string | null
          responsible_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_parent_area_id_fkey"
            columns: ["parent_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          attendance_date: string
          check_in: string | null
          check_out: string | null
          created_at: string
          id: string
          minutes_late: number
          notes: string | null
          scheduled_end: string
          scheduled_start: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_date: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          id?: string
          minutes_late?: number
          notes?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_date?: string
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          id?: string
          minutes_late?: number
          notes?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_audit: {
        Row: {
          action: string
          created_at: string
          email: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          email?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_events: {
        Row: {
          created_at: string
          device_id: string
          event_type: string
          hash: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id: string
          event_type: string
          hash?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string
          event_type?: string
          hash?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      biometric_templates: {
        Row: {
          created_at: string
          device_id: string
          encrypted_template: string
          id: string
          method: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          encrypted_template: string
          id?: string
          method?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          encrypted_template?: string
          id?: string
          method?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          contract_number: string
          created_at: string | null
          department: string | null
          end_date: string | null
          file_path: string | null
          id: string
          notes: string | null
          position: string
          profile_id: string
          salary: number | null
          start_date: string
          status: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          contract_number: string
          created_at?: string | null
          department?: string | null
          end_date?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          position: string
          profile_id: string
          salary?: number | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          contract_number?: string
          created_at?: string | null
          department?: string | null
          end_date?: string | null
          file_path?: string | null
          id?: string
          notes?: string | null
          position?: string
          profile_id?: string
          salary?: number | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      despido_audit: {
        Row: {
          action: string
          created_at: string
          despido_id: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          despido_id: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          despido_id?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despido_audit_despido_id_fkey"
            columns: ["despido_id"]
            isOneToOne: false
            referencedRelation: "despidos"
            referencedColumns: ["id"]
          },
        ]
      }
      despido_documentos: {
        Row: {
          created_at: string
          despido_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          nombre_archivo: string
          tipo_documento: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          despido_id: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          nombre_archivo: string
          tipo_documento: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          despido_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          nombre_archivo?: string
          tipo_documento?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "despido_documentos_despido_id_fkey"
            columns: ["despido_id"]
            isOneToOne: false
            referencedRelation: "despidos"
            referencedColumns: ["id"]
          },
        ]
      }
      despido_notificaciones: {
        Row: {
          created_at: string
          despido_id: string
          id: string
          leida: boolean
          mensaje: string
          tipo_notificacion: string
          user_id: string
        }
        Insert: {
          created_at?: string
          despido_id: string
          id?: string
          leida?: boolean
          mensaje: string
          tipo_notificacion: string
          user_id: string
        }
        Update: {
          created_at?: string
          despido_id?: string
          id?: string
          leida?: boolean
          mensaje?: string
          tipo_notificacion?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "despido_notificaciones_despido_id_fkey"
            columns: ["despido_id"]
            isOneToOne: false
            referencedRelation: "despidos"
            referencedColumns: ["id"]
          },
        ]
      }
      despidos: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          estado: string
          fecha_despido: string
          id: string
          indemnizacion: number | null
          liquidacion_final: number | null
          motivo: string
          observaciones: string | null
          tipo_despido: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          estado?: string
          fecha_despido: string
          id?: string
          indemnizacion?: number | null
          liquidacion_final?: number | null
          motivo: string
          observaciones?: string | null
          tipo_despido: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          estado?: string
          fecha_despido?: string
          id?: string
          indemnizacion?: number | null
          liquidacion_final?: number | null
          motivo?: string
          observaciones?: string | null
          tipo_despido?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          employee_id: string | null
          estado: Database["public"]["Enums"]["document_status"]
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean | null
          mime_type: string | null
          motivo_rechazo: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          uploaded_by: string
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          estado?: Database["public"]["Enums"]["document_status"]
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          motivo_rechazo?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          uploaded_by: string
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          employee_id?: string | null
          estado?: Database["public"]["Enums"]["document_status"]
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          motivo_rechazo?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_activities: {
        Row: {
          assigned_by: string | null
          comments: string | null
          completion_date: string | null
          created_at: string
          description: string | null
          due_date: string | null
          employee_id: string
          id: string
          priority: string | null
          progress_percentage: number | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          comments?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id: string
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          comments?: string | null
          completion_date?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          employee_id?: string
          id?: string
          priority?: string | null
          progress_percentage?: number | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_training: {
        Row: {
          completion_date: string | null
          course_id: string
          created_at: string
          employee_id: string
          end_date: string | null
          id: string
          notes: string | null
          progress_percentage: number | null
          responsible_id: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          course_id: string
          created_at?: string
          employee_id: string
          end_date?: string | null
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          responsible_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          course_id?: string
          created_at?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          notes?: string | null
          progress_percentage?: number | null
          responsible_id?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_training_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      holiday_calendar: {
        Row: {
          created_at: string | null
          holiday_date: string
          holiday_name: string
          id: string
          is_official: boolean | null
          year: number
        }
        Insert: {
          created_at?: string | null
          holiday_date: string
          holiday_name: string
          id?: string
          is_official?: boolean | null
          year: number
        }
        Update: {
          created_at?: string | null
          holiday_date?: string
          holiday_name?: string
          id?: string
          is_official?: boolean | null
          year?: number
        }
        Relationships: []
      }
      incidents: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          file_paths: string[] | null
          id: string
          incident_type: string
          location: string | null
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          file_paths?: string[] | null
          id?: string
          incident_type: string
          location?: string | null
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          file_paths?: string[] | null
          id?: string
          incident_type?: string
          location?: string | null
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      inspection_progress: {
        Row: {
          approval_percentage: number | null
          approved_items: number | null
          completed_items: number | null
          completion_percentage: number | null
          id: string
          inspection_id: string
          pending_items: number | null
          rejected_items: number | null
          total_items: number | null
          updated_at: string | null
        }
        Insert: {
          approval_percentage?: number | null
          approved_items?: number | null
          completed_items?: number | null
          completion_percentage?: number | null
          id?: string
          inspection_id: string
          pending_items?: number | null
          rejected_items?: number | null
          total_items?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_percentage?: number | null
          approved_items?: number | null
          completed_items?: number | null
          completion_percentage?: number | null
          id?: string
          inspection_id?: string
          pending_items?: number | null
          rejected_items?: number | null
          total_items?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_progress_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: true
            referencedRelation: "sh_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string | null
          description: string | null
          id: string
          is_resolved: boolean | null
          item_id: string
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          item_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_resolved?: boolean | null
          item_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_assignments: {
        Row: {
          assigned_date: string
          created_at: string | null
          id: string
          item_id: string
          notes: string | null
          quantity: number
          return_date: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_date?: string
          created_at?: string | null
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_date?: string
          created_at?: string | null
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          return_date?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_item_states: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          item_id: string
          observations: string | null
          previous_state: string | null
          state: string
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          item_id: string
          observations?: string | null
          previous_state?: string | null
          state: string
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          item_id?: string
          observations?: string | null
          previous_state?: string | null
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_item_states_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          location: string | null
          min_stock: number | null
          name: string
          status: string | null
          stock_quantity: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          min_stock?: number | null
          name: string
          status?: string | null
          stock_quantity?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          location?: string | null
          min_stock?: number | null
          name?: string
          status?: string | null
          stock_quantity?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_maintenance: {
        Row: {
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          file_paths: string[] | null
          id: string
          item_id: string
          maintenance_type: string
          observations: string | null
          performed_by: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          file_paths?: string[] | null
          id?: string
          item_id: string
          maintenance_type: string
          observations?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          file_paths?: string[] | null
          id?: string
          item_id?: string
          maintenance_type?: string
          observations?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_maintenance_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_maintenance_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          assignment_id: string | null
          authorized_by: string | null
          condition_after: string | null
          condition_before: string | null
          created_at: string | null
          damage_description: string | null
          file_paths: string[] | null
          id: string
          item_id: string
          movement_date: string | null
          movement_type: string
          observations: string | null
          quantity: number
          user_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          authorized_by?: string | null
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string | null
          damage_description?: string | null
          file_paths?: string[] | null
          id?: string
          item_id: string
          movement_date?: string | null
          movement_type: string
          observations?: string | null
          quantity: number
          user_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          authorized_by?: string | null
          condition_after?: string | null
          condition_before?: string | null
          created_at?: string | null
          damage_description?: string | null
          file_paths?: string[] | null
          id?: string
          item_id?: string
          movement_date?: string | null
          movement_type?: string
          observations?: string | null
          quantity?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "inventory_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_authorized_by_fkey"
            columns: ["authorized_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_vacancies: {
        Row: {
          area_id: string
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          position_title: string
          priority: string | null
          requirements: string | null
          salary_range_max: number | null
          salary_range_min: number | null
          status: string
          updated_at: string
        }
        Insert: {
          area_id: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position_title: string
          priority?: string | null
          requirements?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          area_id?: string
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          position_title?: string
          priority?: string | null
          requirements?: string | null
          salary_range_max?: number | null
          salary_range_min?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_vacancies_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      performance_evaluations: {
        Row: {
          areas_for_improvement: string | null
          comments: string | null
          created_at: string
          employee_id: string
          evaluation_period_end: string
          evaluation_period_start: string
          evaluator_id: string
          goals: string | null
          id: string
          overall_score: number | null
          productivity_score: number | null
          soft_skills_score: number | null
          status: string
          strengths: string | null
          technical_skills_score: number | null
          updated_at: string
        }
        Insert: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_id: string
          evaluation_period_end: string
          evaluation_period_start: string
          evaluator_id: string
          goals?: string | null
          id?: string
          overall_score?: number | null
          productivity_score?: number | null
          soft_skills_score?: number | null
          status?: string
          strengths?: string | null
          technical_skills_score?: number | null
          updated_at?: string
        }
        Update: {
          areas_for_improvement?: string | null
          comments?: string | null
          created_at?: string
          employee_id?: string
          evaluation_period_end?: string
          evaluation_period_start?: string
          evaluator_id?: string
          goals?: string | null
          id?: string
          overall_score?: number | null
          productivity_score?: number | null
          soft_skills_score?: number | null
          status?: string
          strengths?: string | null
          technical_skills_score?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          created_at: string | null
          department: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_number: string | null
          full_name: string
          hire_date: string | null
          id: string
          manager_id: string | null
          must_change_password: boolean | null
          phone: string | null
          position: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_number?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          approved_by: string | null
          approved_date: string | null
          created_at: string
          current_area_id: string | null
          current_position: string
          employee_id: string
          id: string
          justification: string | null
          notes: string | null
          proposed_date: string | null
          status: string
          target_area_id: string | null
          target_position: string
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          current_area_id?: string | null
          current_position: string
          employee_id: string
          id?: string
          justification?: string | null
          notes?: string | null
          proposed_date?: string | null
          status?: string
          target_area_id?: string | null
          target_position: string
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          approved_date?: string | null
          created_at?: string
          current_area_id?: string | null
          current_position?: string
          employee_id?: string
          id?: string
          justification?: string | null
          notes?: string | null
          proposed_date?: string | null
          status?: string
          target_area_id?: string | null
          target_position?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotions_current_area_id_fkey"
            columns: ["current_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_target_area_id_fkey"
            columns: ["target_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_applications: {
        Row: {
          availability_date: string | null
          candidate_id: string
          created_at: string | null
          created_by: string | null
          current_stage: string | null
          hiring_manager: string | null
          id: string
          position_id: string | null
          priority: string | null
          salary_expectation: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          availability_date?: string | null
          candidate_id: string
          created_at?: string | null
          created_by?: string | null
          current_stage?: string | null
          hiring_manager?: string | null
          id?: string
          position_id?: string | null
          priority?: string | null
          salary_expectation?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          availability_date?: string | null
          candidate_id?: string
          created_at?: string | null
          created_by?: string | null
          current_stage?: string | null
          hiring_manager?: string | null
          id?: string
          position_id?: string | null
          priority?: string | null
          salary_expectation?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "recruitment_positions"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_candidates: {
        Row: {
          assigned_recruiter: string | null
          created_at: string | null
          current_location: string | null
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          resume_url: string | null
          seniority: string | null
          source: string | null
          status: string
          updated_at: string | null
          rfc: string | null
          curp: string | null
          nss: string | null
          address: string | null
        }
        Insert: {
          assigned_recruiter?: string | null
          created_at?: string | null
          current_location?: string | null
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          resume_url?: string | null
          seniority?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          rfc?: string | null
          curp?: string | null
          nss?: string | null
          address?: string | null
        }
        Update: {
          assigned_recruiter?: string | null
          created_at?: string | null
          current_location?: string | null
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          resume_url?: string | null
          seniority?: string | null
          source?: string | null
          status?: string
          updated_at?: string | null
          rfc?: string | null
          curp?: string | null
          nss?: string | null
          address?: string | null
        }
        Relationships: []
      }
      recruitment_files: {
        Row: {
          candidate_id: string
          created_at: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          mime_type: string | null
          uploaded_by: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_files_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "recruitment_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_interview_participants: {
        Row: {
          interview_id: string
          participant_id: string
          participant_role: string
          response_status: string | null
        }
        Insert: {
          interview_id: string
          participant_id: string
          participant_role: string
          response_status?: string | null
        }
        Update: {
          interview_id?: string
          participant_id?: string
          participant_role?: string
          response_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_interview_participants_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "recruitment_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_interviews: {
        Row: {
          application_id: string
          created_at: string | null
          created_by: string | null
          decision: string
          duration_minutes: number | null
          feedback_summary: string | null
          id: string
          interview_type: string
          location: string | null
          meeting_url: string | null
          next_steps: string | null
          scheduled_at: string
          status: string
          updated_at: string | null
        }
        Insert: {
          application_id: string
          created_at?: string | null
          created_by?: string | null
          decision?: string
          duration_minutes?: number | null
          feedback_summary?: string | null
          id?: string
          interview_type: string
          location?: string | null
          meeting_url?: string | null
          next_steps?: string | null
          scheduled_at: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string | null
          created_by?: string | null
          decision?: string
          duration_minutes?: number | null
          feedback_summary?: string | null
          id?: string
          interview_type?: string
          location?: string | null
          meeting_url?: string | null
          next_steps?: string | null
          scheduled_at?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_interviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruitment_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_notes: {
        Row: {
          application_id: string | null
          author_id: string
          content: string
          created_at: string | null
          id: string
          interview_id: string | null
          visibility: string | null
        }
        Insert: {
          application_id?: string | null
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          interview_id?: string | null
          visibility?: string | null
        }
        Update: {
          application_id?: string | null
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          interview_id?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recruitment_notes_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "recruitment_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recruitment_notes_interview_id_fkey"
            columns: ["interview_id"]
            isOneToOne: false
            referencedRelation: "recruitment_interviews"
            referencedColumns: ["id"]
          },
        ]
      }
      recruitment_positions: {
        Row: {
          created_at: string | null
          created_by: string | null
          department: string | null
          description: string | null
          hiring_manager: string | null
          id: string
          location: string | null
          seniority: string | null
          status: string
          title: string
          updated_at: string | null
          work_end_time: string | null
          work_start_time: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          hiring_manager?: string | null
          id?: string
          location?: string | null
          seniority?: string | null
          status?: string
          title: string
          updated_at?: string | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          department?: string | null
          description?: string | null
          hiring_manager?: string | null
          id?: string
          location?: string | null
          seniority?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          work_end_time?: string | null
          work_start_time?: string | null
        }
        Relationships: []
      }
      sh_area_evaluations: {
        Row: {
          average_score: number | null
          cleanliness_score: number | null
          compliance_score: number | null
          created_at: string | null
          ergonomics_score: number | null
          evaluated_by: string
          evaluation_date: string
          file_paths: string[] | null
          furniture_condition_score: number | null
          hazmat_control_score: number | null
          id: string
          lighting_score: number | null
          observations: string | null
          order_score: number | null
          recommendations: string | null
          risk_control_score: number | null
          sector_id: string
          signage_score: number | null
          tools_condition_score: number | null
          total_score: number | null
          updated_at: string | null
          ventilation_score: number | null
        }
        Insert: {
          average_score?: number | null
          cleanliness_score?: number | null
          compliance_score?: number | null
          created_at?: string | null
          ergonomics_score?: number | null
          evaluated_by: string
          evaluation_date?: string
          file_paths?: string[] | null
          furniture_condition_score?: number | null
          hazmat_control_score?: number | null
          id?: string
          lighting_score?: number | null
          observations?: string | null
          order_score?: number | null
          recommendations?: string | null
          risk_control_score?: number | null
          sector_id: string
          signage_score?: number | null
          tools_condition_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          ventilation_score?: number | null
        }
        Update: {
          average_score?: number | null
          cleanliness_score?: number | null
          compliance_score?: number | null
          created_at?: string | null
          ergonomics_score?: number | null
          evaluated_by?: string
          evaluation_date?: string
          file_paths?: string[] | null
          furniture_condition_score?: number | null
          hazmat_control_score?: number | null
          id?: string
          lighting_score?: number | null
          observations?: string | null
          order_score?: number | null
          recommendations?: string | null
          risk_control_score?: number | null
          sector_id?: string
          signage_score?: number | null
          tools_condition_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          ventilation_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sh_area_evaluations_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sh_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sh_checklists: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          items: Json
          name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sh_inspections: {
        Row: {
          completed_date: string | null
          created_at: string | null
          file_paths: string[] | null
          findings: string | null
          id: string
          inspector_id: string
          recommendations: string | null
          scheduled_date: string
          sector_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          completed_date?: string | null
          created_at?: string | null
          file_paths?: string[] | null
          findings?: string | null
          id?: string
          inspector_id: string
          recommendations?: string | null
          scheduled_date: string
          sector_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_date?: string | null
          created_at?: string | null
          file_paths?: string[] | null
          findings?: string | null
          id?: string
          inspector_id?: string
          recommendations?: string | null
          scheduled_date?: string
          sector_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sh_inspections_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sh_sectors"
            referencedColumns: ["id"]
          },
        ]
      }
      sh_sectors: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          responsible_id: string | null
          risk_level: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          responsible_id?: string | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          responsible_id?: string | null
          risk_level?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          name: string
          provider: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          name: string
          provider?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          name?: string
          provider?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: string | null
          last_active_at: string
          token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: string | null
          last_active_at?: string
          token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_active_at?: string
          token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          department: string | null
          email: string
          failed_login_attempts: number
          full_name: string
          id: string
          is_locked: boolean
          is_verified: boolean
          last_login_at: string | null
          password_hash: string
          password_reset_expires_at: string | null
          password_reset_token: string | null
          phone: string | null
          position: string | null
          status: string
          updated_at: string
          username: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          failed_login_attempts?: number
          full_name: string
          id?: string
          is_locked?: boolean
          is_verified?: boolean
          last_login_at?: string | null
          password_hash: string
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          username?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          failed_login_attempts?: number
          full_name?: string
          id?: string
          is_locked?: boolean
          is_verified?: boolean
          last_login_at?: string | null
          password_hash?: string
          password_reset_expires_at?: string | null
          password_reset_token?: string | null
          phone?: string | null
          position?: string | null
          status?: string
          updated_at?: string
          username?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      vacancy_applications: {
        Row: {
          applicant_email: string
          applicant_id: string | null
          applicant_name: string
          applicant_phone: string | null
          cover_letter: string | null
          created_at: string
          id: string
          notes: string | null
          resume_url: string | null
          status: string
          updated_at: string
          vacancy_id: string
        }
        Insert: {
          applicant_email: string
          applicant_id?: string | null
          applicant_name: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
          vacancy_id: string
        }
        Update: {
          applicant_email?: string
          applicant_id?: string | null
          applicant_name?: string
          applicant_phone?: string | null
          cover_letter?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_applications_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "job_vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_balances: {
        Row: {
          available_days: number | null
          created_at: string | null
          id: string
          total_days: number | null
          updated_at: string | null
          used_days: number | null
          user_id: string
          year: number
        }
        Insert: {
          available_days?: number | null
          created_at?: string | null
          id?: string
          total_days?: number | null
          updated_at?: string | null
          used_days?: number | null
          user_id: string
          year?: number
        }
        Update: {
          available_days?: number | null
          created_at?: string | null
          id?: string
          total_days?: number | null
          updated_at?: string | null
          used_days?: number | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      vacation_blackout_periods: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string
          id: string
          is_active: boolean | null
          reason: string
          start_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          reason: string
          start_date: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          reason?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacation_blackout_periods_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      vacation_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attendance_percentage: number | null
          created_at: string | null
          created_by: string | null
          daily_salary: number | null
          days_requested: number
          end_date: string
          has_attendance_alert: boolean | null
          id: string
          notes: string | null
          reason: string | null
          rejection_reason: string | null
          request_number: string | null
          return_date: string | null
          sent_to_documentation_at: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string
          vacation_bonus_amount: number | null
          vacation_bonus_percentage: number | null
          work_schedule: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          daily_salary?: number | null
          days_requested: number
          end_date: string
          has_attendance_alert?: boolean | null
          id?: string
          notes?: string | null
          reason?: string | null
          rejection_reason?: string | null
          request_number?: string | null
          return_date?: string | null
          sent_to_documentation_at?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
          vacation_bonus_amount?: number | null
          vacation_bonus_percentage?: number | null
          work_schedule?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attendance_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          daily_salary?: number | null
          days_requested?: number
          end_date?: string
          has_attendance_alert?: boolean | null
          id?: string
          notes?: string | null
          reason?: string | null
          rejection_reason?: string | null
          request_number?: string | null
          return_date?: string | null
          sent_to_documentation_at?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
          vacation_bonus_amount?: number | null
          vacation_bonus_percentage?: number | null
          work_schedule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacation_requests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_biometric_status: {
        Row: {
          active_templates: number | null
          has_active_template: boolean | null
          last_enrollment: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_vacation_days: {
        Args: { years_of_service: number }
        Returns: number
      }
      calculate_years_of_service: {
        Args: { hire_date: string }
        Returns: number
      }
      check_overdue_inspection_alerts: { Args: never; Returns: undefined }
      check_overdue_maintenance_alerts: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: number }
      delete_user_safe: {
        Args: { session_token: string; user_id_to_delete: string }
        Returns: Json
      }
      generate_employee_number: { Args: never; Returns: string }
      generate_pbkdf2_hash: {
        Args: { password: string; salt_hex: string }
        Returns: string
      }
      generate_vacation_request_number: { Args: never; Returns: string }
      get_all_users: {
        Args: { session_token: string }
        Returns: {
          created_at: string
          email: string
          full_name: string
          id: string
          last_login_at: string
          phone: string
          role: string
          status: string
          updated_at: string
          username: string
        }[]
      }
      get_current_user_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hire_candidate: {
        Args: { candidate_id: string; contract_data: Json }
        Returns: Json
      }
      is_system_user: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "superadmin" | "admin_rrhh"
      document_status: "pendiente" | "validado" | "rechazado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["superadmin", "admin_rrhh"],
      document_status: ["pendiente", "validado", "rechazado"],
    },
  },
} as const
