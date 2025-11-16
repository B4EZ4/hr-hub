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
          salary: number | null
          start_date: string
          status: string | null
          type: string
          updated_at: string | null
          user_id: string
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
          salary?: number | null
          start_date: string
          status?: string | null
          type: string
          updated_at?: string | null
          user_id: string
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
          salary?: number | null
          start_date?: string
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number | null
          id: string
          is_public: boolean | null
          mime_type: string | null
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
          file_path: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
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
          file_path?: string
          file_size?: number | null
          id?: string
          is_public?: boolean | null
          mime_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          uploaded_by?: string
          version?: number | null
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
          user_id: string
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
          user_id: string
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
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_assignments_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
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
            foreignKeyName: "inventory_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
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
          full_name: string
          hire_date: string | null
          id: string
          manager_id: string | null
          must_change_password: boolean | null
          phone: string | null
          position: string | null
          status: string | null
          updated_at: string | null
          user_id: string
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
          full_name: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
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
          full_name?: string
          hire_date?: string | null
          id?: string
          manager_id?: string | null
          must_change_password?: boolean | null
          phone?: string | null
          position?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
      vacation_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          days_requested: number
          end_date: string
          id: string
          reason: string | null
          rejection_reason: string | null
          start_date: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested: number
          end_date: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          days_requested?: number
          end_date?: string
          id?: string
          reason?: string | null
          rejection_reason?: string | null
          start_date?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "superadmin"
        | "admin_rrhh"
        | "manager"
        | "empleado"
        | "oficial_sh"
        | "auditor"
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
      app_role: [
        "superadmin",
        "admin_rrhh",
        "manager",
        "empleado",
        "oficial_sh",
        "auditor",
      ],
    },
  },
} as const
