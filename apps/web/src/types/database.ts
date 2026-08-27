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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      areas: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          parent_area_id: string | null
          site_id: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          parent_area_id?: string | null
          site_id: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_area_id?: string | null
          site_id?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "areas_organization_site_fkey"
            columns: ["organization_id", "site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "areas_parent_fkey"
            columns: ["organization_id", "site_id", "parent_area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["organization_id", "site_id", "id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: { id: string; organization_id: string; entity_type: string; entity_id: string; title: string; status: string; expires_at: string | null; deleted_at: string | null; deleted_by: string | null; created_by: string | null; updated_by: string | null; created_at: string; updated_at: string }
        Insert: { id?: string; organization_id: string; entity_type: string; entity_id: string; title: string; status?: string; expires_at?: string | null; deleted_at?: string | null; deleted_by?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string }
        Update: { id?: string; organization_id?: string; entity_type?: string; entity_id?: string; title?: string; status?: string; expires_at?: string | null; deleted_at?: string | null; deleted_by?: string | null; created_by?: string | null; updated_by?: string | null; created_at?: string; updated_at?: string }
        Relationships: []
      }
      document_versions: {
        Row: { id: string; organization_id: string; document_id: string; version_number: number; bucket_id: string; storage_path: string; original_name: string; mime_type: string; size_bytes: number; uploaded_by: string | null; created_at: string }
        Insert: { id?: string; organization_id: string; document_id: string; version_number: number; bucket_id: string; storage_path: string; original_name: string; mime_type: string; size_bytes: number; uploaded_by?: string | null; created_at?: string }
        Update: { id?: string; organization_id?: string; document_id?: string; version_number?: number; bucket_id?: string; storage_path?: string; original_name?: string; mime_type?: string; size_bytes?: number; uploaded_by?: string | null; created_at?: string }
        Relationships: []
      }
      document_evidences: {
        Row: { id: string; organization_id: string; document_version_id: string; entity_type: string; entity_id: string; created_by: string | null; created_at: string }
        Insert: { id?: string; organization_id: string; document_version_id: string; entity_type: string; entity_id: string; created_by?: string | null; created_at?: string }
        Update: { id?: string; organization_id?: string; document_version_id?: string; entity_type?: string; entity_id?: string; created_by?: string | null; created_at?: string }
        Relationships: []
      }
      domain_events: {
        Row: {
          actor_user_id: string | null
          aggregate_id: string
          aggregate_type: string
          attempt_count: number
          available_at: string
          event_type: string
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          occurred_at: string
          organization_id: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          actor_user_id?: string | null
          aggregate_id: string
          aggregate_type: string
          attempt_count?: number
          available_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          occurred_at?: string
          organization_id: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          actor_user_id?: string | null
          aggregate_id?: string
          aggregate_type?: string
          attempt_count?: number
          available_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          occurred_at?: string
          organization_id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "domain_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_entities: {
        Row: {
          ciiu_code: string | null
          created_at: string
          created_by: string | null
          economic_activity: string | null
          employee_count: number
          id: string
          legal_name: string
          legal_representative: string | null
          organization_id: string
          risk_class: number | null
          status: string
          tax_id: string
          trade_name: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ciiu_code?: string | null
          created_at?: string
          created_by?: string | null
          economic_activity?: string | null
          employee_count?: number
          id?: string
          legal_name: string
          legal_representative?: string | null
          organization_id: string
          risk_class?: number | null
          status?: string
          tax_id: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ciiu_code?: string | null
          created_at?: string
          created_by?: string | null
          economic_activity?: string | null
          employee_count?: number
          id?: string
          legal_name?: string
          legal_representative?: string | null
          organization_id?: string
          risk_class?: number | null
          status?: string
          tax_id?: string
          trade_name?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      member_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          organization_member_id: string
          role_id: string
          site_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          organization_member_id: string
          role_id: string
          site_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          organization_member_id?: string
          role_id?: string
          site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_roles_organization_member_fkey"
            columns: ["organization_id", "organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_roles_organization_site_fkey"
            columns: ["organization_id", "site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["organization_id", "id"]
          },
          {
            foreignKeyName: "member_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          completion_idempotency_key: string | null
          completion_result: Json | null
          created_at: string
          created_by: string | null
          current_step: number
          draft_data: Json
          id: string
          organization_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          completion_idempotency_key?: string | null
          completion_result?: Json | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          draft_data?: Json
          id?: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          completion_idempotency_key?: string | null
          completion_result?: Json | null
          created_at?: string
          created_by?: string | null
          current_step?: number
          draft_data?: Json
          id?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_characteristics: {
        Row: {
          chemical_exposure: boolean
          confined_spaces: boolean
          created_at: string
          created_by: string | null
          electrical_work: boolean
          heavy_machinery: boolean
          id: string
          manual_load_handling: boolean
          night_work: boolean
          organization_id: string
          remote_work: boolean
          transport_operations: boolean
          updated_at: string
          updated_by: string | null
          work_at_height: boolean
        }
        Insert: {
          chemical_exposure?: boolean
          confined_spaces?: boolean
          created_at?: string
          created_by?: string | null
          electrical_work?: boolean
          heavy_machinery?: boolean
          id?: string
          manual_load_handling?: boolean
          night_work?: boolean
          organization_id: string
          remote_work?: boolean
          transport_operations?: boolean
          updated_at?: string
          updated_by?: string | null
          work_at_height?: boolean
        }
        Update: {
          chemical_exposure?: boolean
          confined_spaces?: boolean
          created_at?: string
          created_by?: string | null
          electrical_work?: boolean
          heavy_machinery?: boolean
          id?: string
          manual_load_handling?: boolean
          night_work?: boolean
          organization_id?: string
          remote_work?: boolean
          transport_operations?: boolean
          updated_at?: string
          updated_by?: string | null
          work_at_height?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "organization_characteristics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          organization_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          country_code: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          nit: string | null
          settings: Json
          slug: string
          status: string
          timezone: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          nit?: string | null
          settings?: Json
          slug: string
          status?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          nit?: string | null
          settings?: Json
          slug?: string
          status?: string
          timezone?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          action: string
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
        }
        Insert: {
          action: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
        }
        Update: {
          action?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          phone: string | null
          second_last_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          middle_name?: string | null
          phone?: string | null
          second_last_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          phone?: string | null
          second_last_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          city: string | null
          code: string
          created_at: string
          created_by: string | null
          department: string | null
          id: string
          legal_entity_id: string
          name: string
          organization_id: string
          risk_class: number | null
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          legal_entity_id: string
          name: string
          organization_id: string
          risk_class?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          department?: string | null
          id?: string
          legal_entity_id?: string
          name?: string
          organization_id?: string
          risk_class?: number | null
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_legal_entity_fkey"
            columns: ["organization_id", "legal_entity_id"]
            isOneToOne: false
            referencedRelation: "legal_entities"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_my_invitations: { Args: never; Returns: number }
      add_invited_member: {
        Args: {
          p_organization_id: string
          p_role_id: string
          p_site_id?: string
          p_user_id: string
        }
        Returns: string
      }
      can: {
        Args: {
          p_organization_id: string
          p_permission_code: string
          p_site_id?: string
        }
        Returns: boolean
      }
      complete_organization_onboarding: {
        Args: { p_idempotency_key: string; p_organization_id: string }
        Returns: Json
      }
      save_organization_onboarding_step: {
        Args: { p_data: Json; p_organization_id: string; p_step: number }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
