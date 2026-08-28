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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          process_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          process_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          process_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      annual_plans: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          budget: number | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          budget?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "annual_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "annual_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      applicability_rules: {
        Row: {
          conditions: Json
          created_at: string
          effective_from: string
          effective_to: string | null
          expert_review_status: string
          explanation_template: string
          id: string
          outcome: string
          requirement_id: string
          rule_code: string
          status: string
          supersedes_rule_id: string | null
          updated_at: string
          version_number: number
        }
        Insert: {
          conditions?: Json
          created_at?: string
          effective_from: string
          effective_to?: string | null
          expert_review_status?: string
          explanation_template: string
          id?: string
          outcome: string
          requirement_id: string
          rule_code: string
          status?: string
          supersedes_rule_id?: string | null
          updated_at?: string
          version_number: number
        }
        Update: {
          conditions?: Json
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          expert_review_status?: string
          explanation_template?: string
          id?: string
          outcome?: string
          requirement_id?: string
          rule_code?: string
          status?: string
          supersedes_rule_id?: string | null
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "applicability_rules_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applicability_rules_supersedes_rule_id_fkey"
            columns: ["supersedes_rule_id"]
            isOneToOne: false
            referencedRelation: "applicability_rules"
            referencedColumns: ["id"]
          },
        ]
      }
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
      assessment_items: {
        Row: {
          assessment_id: string
          created_at: string
          evidence_document_version_id: string | null
          id: string
          justification: string | null
          observation: string | null
          response: string
          responsible_user_id: string | null
          score: number | null
          snapshot_item_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          justification?: string | null
          observation?: string | null
          response?: string
          responsible_user_id?: string | null
          score?: number | null
          snapshot_item_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          justification?: string | null
          observation?: string | null
          response?: string
          responsible_user_id?: string | null
          score?: number | null
          snapshot_item_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_items_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_items_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_items_snapshot_item_id_fkey"
            columns: ["snapshot_item_id"]
            isOneToOne: false
            referencedRelation: "organization_standard_snapshot_items"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_scoring_rules: {
        Row: {
          code: string
          created_at: string
          expert_review_status: string
          id: string
          response_multipliers: Json
          standard_profile_version_id: string
          status: string
          version_number: number
        }
        Insert: {
          code: string
          created_at?: string
          expert_review_status?: string
          id?: string
          response_multipliers: Json
          standard_profile_version_id: string
          status?: string
          version_number: number
        }
        Update: {
          code?: string
          created_at?: string
          expert_review_status?: string
          id?: string
          response_multipliers?: Json
          standard_profile_version_id?: string
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessment_scoring_rules_standard_profile_version_id_fkey"
            columns: ["standard_profile_version_id"]
            isOneToOne: false
            referencedRelation: "standard_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          organization_id: string
          responsible_user_id: string | null
          score: number | null
          score_explanation: Json
          scoring_rule_id: string
          snapshot_id: string
          standard_profile_version_id: string
          status: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          void_reason: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          organization_id: string
          responsible_user_id?: string | null
          score?: number | null
          score_explanation?: Json
          scoring_rule_id: string
          snapshot_id: string
          standard_profile_version_id: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          void_reason?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          responsible_user_id?: string | null
          score?: number | null
          score_explanation?: Json
          scoring_rule_id?: string
          snapshot_id?: string
          standard_profile_version_id?: string
          status?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          void_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_scoring_rule_id_fkey"
            columns: ["scoring_rule_id"]
            isOneToOne: false
            referencedRelation: "assessment_scoring_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "organization_standard_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_standard_profile_version_id_fkey"
            columns: ["standard_profile_version_id"]
            isOneToOne: false
            referencedRelation: "standard_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_actions: {
        Row: {
          audit_finding_id: string
          created_at: string
          due_at: string | null
          evidence_document_version_id: string | null
          id: string
          improvement_action_id: string | null
          organization_id: string
          status: string
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audit_finding_id: string
          created_at?: string
          due_at?: string | null
          evidence_document_version_id?: string | null
          id?: string
          improvement_action_id?: string | null
          organization_id: string
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audit_finding_id?: string
          created_at?: string
          due_at?: string | null
          evidence_document_version_id?: string | null
          id?: string
          improvement_action_id?: string | null
          organization_id?: string
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_actions_audit_finding_id_fkey"
            columns: ["audit_finding_id"]
            isOneToOne: false
            referencedRelation: "audit_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_actions_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_actions_improvement_action_id_fkey"
            columns: ["improvement_action_id"]
            isOneToOne: false
            referencedRelation: "improvement_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_agenda_items: {
        Row: {
          assigned_to: string | null
          audit_engagement_id: string
          id: string
          organization_id: string
          scheduled_at: string | null
          status: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          audit_engagement_id: string
          id?: string
          organization_id: string
          scheduled_at?: string | null
          status?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          audit_engagement_id?: string
          id?: string
          organization_id?: string
          scheduled_at?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_agenda_items_audit_engagement_id_fkey"
            columns: ["audit_engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_agenda_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_agenda_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_checklists: {
        Row: {
          audit_engagement_id: string
          code: string
          criteria_reference: string | null
          id: string
          notes: string | null
          organization_id: string
          response: string | null
          title: string
        }
        Insert: {
          audit_engagement_id: string
          code: string
          criteria_reference?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          response?: string | null
          title: string
        }
        Update: {
          audit_engagement_id?: string
          code?: string
          criteria_reference?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          response?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_checklists_audit_engagement_id_fkey"
            columns: ["audit_engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_checklists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_engagements: {
        Row: {
          audit_program_id: string
          created_at: string
          criteria: Json
          id: string
          organization_id: string
          require_independent_approval: boolean
          scheduled_at: string | null
          scope_summary: string | null
          site_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audit_program_id: string
          created_at?: string
          criteria?: Json
          id?: string
          organization_id: string
          require_independent_approval?: boolean
          scheduled_at?: string | null
          scope_summary?: string | null
          site_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audit_program_id?: string
          created_at?: string
          criteria?: Json
          id?: string
          organization_id?: string
          require_independent_approval?: boolean
          scheduled_at?: string | null
          scope_summary?: string | null
          site_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_engagements_audit_program_id_fkey"
            columns: ["audit_program_id"]
            isOneToOne: false
            referencedRelation: "audit_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_engagements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_engagements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_engagements_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_evidences: {
        Row: {
          audit_engagement_id: string
          created_at: string
          document_version_id: string
          id: string
          organization_id: string
        }
        Insert: {
          audit_engagement_id: string
          created_at?: string
          document_version_id: string
          id?: string
          organization_id: string
        }
        Update: {
          audit_engagement_id?: string
          created_at?: string
          document_version_id?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_evidences_audit_engagement_id_fkey"
            columns: ["audit_engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_evidences_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_evidences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_evidences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_findings: {
        Row: {
          audit_engagement_id: string
          classification: string
          created_at: string
          criteria_reference: string | null
          description: string | null
          id: string
          organization_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          audit_engagement_id: string
          classification: string
          created_at?: string
          criteria_reference?: string | null
          description?: string | null
          id?: string
          organization_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          audit_engagement_id?: string
          classification?: string
          created_at?: string
          criteria_reference?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_findings_audit_engagement_id_fkey"
            columns: ["audit_engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_programs: {
        Row: {
          created_at: string
          criteria: Json
          id: string
          name: string
          organization_id: string
          scope_summary: string | null
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          criteria?: Json
          id?: string
          name: string
          organization_id: string
          scope_summary?: string | null
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          criteria?: Json
          id?: string
          name?: string
          organization_id?: string
          scope_summary?: string | null
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "audit_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audit_engagement_id: string
          created_at: string
          document_version_id: string | null
          id: string
          organization_id: string
          status: string
          summary: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audit_engagement_id: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          organization_id: string
          status?: string
          summary: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audit_engagement_id?: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          organization_id?: string
          status?: string
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_reports_audit_engagement_id_fkey"
            columns: ["audit_engagement_id"]
            isOneToOne: true
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_team_members: {
        Row: {
          audit_engagement_id: string
          created_at: string
          id: string
          independence_declared_at: string | null
          organization_id: string
          organization_member_id: string
          team_role: string
        }
        Insert: {
          audit_engagement_id: string
          created_at?: string
          id?: string
          independence_declared_at?: string | null
          organization_id: string
          organization_member_id: string
          team_role: string
        }
        Update: {
          audit_engagement_id?: string
          created_at?: string
          id?: string
          independence_declared_at?: string | null
          organization_id?: string
          organization_member_id?: string
          team_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_team_members_audit_engagement_id_fkey"
            columns: ["audit_engagement_id"]
            isOneToOne: false
            referencedRelation: "audit_engagements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "audit_team_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_team_members_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_executions: {
        Row: {
          attempt_count: number
          automation_rule_version_id: string
          available_at: string
          completed_at: string | null
          created_at: string
          domain_event_id: string
          dry_run: boolean
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          organization_id: string
          result: Json
          started_at: string
          status: string
        }
        Insert: {
          attempt_count?: number
          automation_rule_version_id: string
          available_at?: string
          completed_at?: string | null
          created_at?: string
          domain_event_id: string
          dry_run?: boolean
          id?: string
          idempotency_key: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          organization_id: string
          result?: Json
          started_at?: string
          status?: string
        }
        Update: {
          attempt_count?: number
          automation_rule_version_id?: string
          available_at?: string
          completed_at?: string | null
          created_at?: string
          domain_event_id?: string
          dry_run?: boolean
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          organization_id?: string
          result?: Json
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_executions_automation_rule_version_id_fkey"
            columns: ["automation_rule_version_id"]
            isOneToOne: false
            referencedRelation: "automation_rule_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_domain_event_id_fkey"
            columns: ["domain_event_id"]
            isOneToOne: false
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "automation_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rule_versions: {
        Row: {
          action: Json
          approved_at: string | null
          approved_by: string | null
          automation_rule_id: string
          conditions: Json
          created_at: string
          event_type: string
          id: string
          organization_id: string
          status: string
          version_number: number
        }
        Insert: {
          action: Json
          approved_at?: string | null
          approved_by?: string | null
          automation_rule_id: string
          conditions?: Json
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          status?: string
          version_number: number
        }
        Update: {
          action?: Json
          approved_at?: string | null
          approved_by?: string | null
          automation_rule_id?: string
          conditions?: Json
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          status?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "automation_rule_versions_automation_rule_id_fkey"
            columns: ["automation_rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_rule_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "automation_rule_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          activated_at: string | null
          code: string
          created_at: string
          emergency_stopped_at: string | null
          emergency_stopped_by: string | null
          id: string
          max_executions_per_hour: number
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          code: string
          created_at?: string
          emergency_stopped_at?: string | null
          emergency_stopped_by?: string | null
          id?: string
          max_executions_per_hour?: number
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          code?: string
          created_at?: string
          emergency_stopped_at?: string | null
          emergency_stopped_by?: string | null
          id?: string
          max_executions_per_hour?: number
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "automation_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_plans: {
        Row: {
          code: string
          created_at: string
          feature_flags: Json
          id: string
          limits: Json
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          feature_flags?: Json
          id?: string
          limits?: Json
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          feature_flags?: Json
          id?: string
          limits?: Json
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_subscriptions: {
        Row: {
          billing_plan_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          provider_customer_reference: string | null
          provider_subscription_reference: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          billing_plan_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          status: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          billing_plan_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          provider_customer_reference?: string | null
          provider_subscription_reference?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscriptions_billing_plan_id_fkey"
            columns: ["billing_plan_id"]
            isOneToOne: false
            referencedRelation: "billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "billing_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_usage_periods: {
        Row: {
          billing_subscription_id: string
          created_at: string
          id: string
          organization_id: string
          period_end: string
          period_start: string
          usage: Json
        }
        Insert: {
          billing_subscription_id: string
          created_at?: string
          id?: string
          organization_id: string
          period_end: string
          period_start: string
          usage?: Json
        }
        Update: {
          billing_subscription_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          usage?: Json
        }
        Relationships: [
          {
            foreignKeyName: "billing_usage_periods_billing_subscription_id_fkey"
            columns: ["billing_subscription_id"]
            isOneToOne: false
            referencedRelation: "billing_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_usage_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "billing_usage_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_webhook_events: {
        Row: {
          event_reference: string
          id: string
          last_error: string | null
          payload_hash: string
          processed_at: string | null
          provider_code: string
          received_at: string
          signature_valid: boolean
          status: string
        }
        Insert: {
          event_reference: string
          id?: string
          last_error?: string | null
          payload_hash: string
          processed_at?: string | null
          provider_code: string
          received_at?: string
          signature_valid?: boolean
          status?: string
        }
        Update: {
          event_reference?: string
          id?: string
          last_error?: string | null
          payload_hash?: string
          processed_at?: string | null
          provider_code?: string
          received_at?: string
          signature_valid?: boolean
          status?: string
        }
        Relationships: []
      }
      classification_change_proposals: {
        Row: {
          comparison: Json
          created_at: string
          current_classification_id: string | null
          evaluator_version_id: string
          id: string
          organization_id: string
          proposed_ciiu_code: string | null
          proposed_economic_activity: string | null
          proposed_effective_from: string
          proposed_employee_count: number
          proposed_risk_class: number
          proposed_standard_profile_id: string
          reasons: Json
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scope_key: string
          status: string
        }
        Insert: {
          comparison?: Json
          created_at?: string
          current_classification_id?: string | null
          evaluator_version_id: string
          id?: string
          organization_id: string
          proposed_ciiu_code?: string | null
          proposed_economic_activity?: string | null
          proposed_effective_from: string
          proposed_employee_count: number
          proposed_risk_class: number
          proposed_standard_profile_id: string
          reasons?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_key?: string
          status?: string
        }
        Update: {
          comparison?: Json
          created_at?: string
          current_classification_id?: string | null
          evaluator_version_id?: string
          id?: string
          organization_id?: string
          proposed_ciiu_code?: string | null
          proposed_economic_activity?: string | null
          proposed_effective_from?: string
          proposed_employee_count?: number
          proposed_risk_class?: number
          proposed_standard_profile_id?: string
          reasons?: Json
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scope_key?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "classification_change_proposa_proposed_standard_profile_id_fkey"
            columns: ["proposed_standard_profile_id"]
            isOneToOne: false
            referencedRelation: "standard_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_change_proposals_current_classification_id_fkey"
            columns: ["current_classification_id"]
            isOneToOne: false
            referencedRelation: "organization_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_change_proposals_evaluator_version_id_fkey"
            columns: ["evaluator_version_id"]
            isOneToOne: false
            referencedRelation: "classification_evaluator_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classification_change_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "classification_change_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_evaluator_versions: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          evaluator_id: string
          expert_review_status: string
          id: string
          rules_summary: Json
          version_code: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          evaluator_id: string
          expert_review_status?: string
          id?: string
          rules_summary?: Json
          version_code: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          evaluator_id?: string
          expert_review_status?: string
          id?: string
          rules_summary?: Json
          version_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "classification_evaluator_versions_evaluator_id_fkey"
            columns: ["evaluator_id"]
            isOneToOne: false
            referencedRelation: "classification_evaluators"
            referencedColumns: ["id"]
          },
        ]
      }
      classification_evaluators: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      committee_commitments: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          meeting_minutes_id: string
          organization_id: string
          status: string
          task_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          meeting_minutes_id: string
          organization_id: string
          status?: string
          task_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          meeting_minutes_id?: string
          organization_id?: string
          status?: string
          task_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_commitments_meeting_minutes_id_fkey"
            columns: ["meeting_minutes_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_commitments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "committee_commitments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_commitments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_meetings: {
        Row: {
          committee_period_id: string
          created_at: string
          held_at: string | null
          id: string
          meeting_template_id: string | null
          organization_id: string
          scheduled_at: string
          status: string
          updated_at: string
        }
        Insert: {
          committee_period_id: string
          created_at?: string
          held_at?: string | null
          id?: string
          meeting_template_id?: string | null
          organization_id: string
          scheduled_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          committee_period_id?: string
          created_at?: string
          held_at?: string | null
          id?: string
          meeting_template_id?: string | null
          organization_id?: string
          scheduled_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_meetings_committee_period_id_fkey"
            columns: ["committee_period_id"]
            isOneToOne: false
            referencedRelation: "committee_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_meetings_meeting_template_id_fkey"
            columns: ["meeting_template_id"]
            isOneToOne: false
            referencedRelation: "meeting_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "committee_meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_members: {
        Row: {
          appointed_on: string
          committee_period_id: string
          created_at: string
          id: string
          internal_role: string
          organization_id: string
          organization_member_id: string
          status: string
        }
        Insert: {
          appointed_on?: string
          committee_period_id: string
          created_at?: string
          id?: string
          internal_role: string
          organization_id: string
          organization_member_id: string
          status?: string
        }
        Update: {
          appointed_on?: string
          committee_period_id?: string
          created_at?: string
          id?: string
          internal_role?: string
          organization_id?: string
          organization_member_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_members_committee_period_id_fkey"
            columns: ["committee_period_id"]
            isOneToOne: false
            referencedRelation: "committee_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "committee_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_members_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_periods: {
        Row: {
          committee_id: string
          created_at: string
          ends_on: string | null
          id: string
          organization_id: string
          starts_on: string
          status: string
        }
        Insert: {
          committee_id: string
          created_at?: string
          ends_on?: string | null
          id?: string
          organization_id: string
          starts_on: string
          status?: string
        }
        Update: {
          committee_id?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          organization_id?: string
          starts_on?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "committee_periods_committee_id_fkey"
            columns: ["committee_id"]
            isOneToOne: false
            referencedRelation: "committees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committee_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "committee_periods_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      committee_types: {
        Row: {
          code: string
          created_at: string
          default_config: Json
          description: string | null
          id: string
          name: string
          status: string
        }
        Insert: {
          code: string
          created_at?: string
          default_config?: Json
          description?: string | null
          id?: string
          name: string
          status?: string
        }
        Update: {
          code?: string
          created_at?: string
          default_config?: Json
          description?: string | null
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      committees: {
        Row: {
          committee_type_id: string
          config: Json
          created_at: string
          id: string
          name: string
          organization_id: string
          site_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          committee_type_id: string
          config?: Json
          created_at?: string
          id?: string
          name: string
          organization_id: string
          site_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          committee_type_id?: string
          config?: Json
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          site_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "committees_committee_type_id_fkey"
            columns: ["committee_type_id"]
            isOneToOne: false
            referencedRelation: "committee_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "committees_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "committees_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_document_requirements: {
        Row: {
          contract_id: string
          created_at: string
          due_at: string | null
          id: string
          organization_id: string
          required: boolean
          requirement_id: string | null
          status: string
          title: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          due_at?: string | null
          id?: string
          organization_id: string
          required?: boolean
          requirement_id?: string | null
          status?: string
          title: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          due_at?: string | null
          id?: string
          organization_id?: string
          required?: boolean
          requirement_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_document_requirements_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_document_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contract_document_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_document_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_document_submissions: {
        Row: {
          contract_document_requirement_id: string
          document_version_id: string
          id: string
          organization_id: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          submitted_by: string | null
        }
        Insert: {
          contract_document_requirement_id: string
          document_version_id: string
          id?: string
          organization_id: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Update: {
          contract_document_requirement_id?: string
          document_version_id?: string
          id?: string
          organization_id?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_document_submissions_contract_document_requiremen_fkey"
            columns: ["contract_document_requirement_id"]
            isOneToOne: false
            referencedRelation: "contract_document_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_document_submissions_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_document_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contract_document_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_evaluations: {
        Row: {
          contract_id: string
          created_at: string
          evaluated_at: string | null
          evaluated_by: string | null
          id: string
          notes: string | null
          organization_id: string
          score: number | null
          status: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          score?: number | null
          status?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          evaluated_at?: string | null
          evaluated_by?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_evaluations_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contract_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_site_accesses: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          contract_id: string
          id: string
          organization_id: string
          site_id: string
          status: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          contract_id: string
          id?: string
          organization_id: string
          site_id: string
          status?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          contract_id?: string
          id?: string
          organization_id?: string
          site_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_site_accesses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_site_accesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contract_site_accesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_site_accesses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_contacts: {
        Row: {
          contractor_organization_id: string
          created_at: string
          email: string
          id: string
          name: string
          organization_id: string
          status: string
          user_id: string | null
        }
        Insert: {
          contractor_organization_id: string
          created_at?: string
          email: string
          id?: string
          name: string
          organization_id: string
          status?: string
          user_id?: string | null
        }
        Update: {
          contractor_organization_id?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          organization_id?: string
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractor_contacts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "contractor_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contractor_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_organizations: {
        Row: {
          created_at: string
          id: string
          kind: string
          legal_name: string
          organization_id: string
          status: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          legal_name: string
          organization_id: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          legal_name?: string
          organization_id?: string
          status?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contractor_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_portal_accesses: {
        Row: {
          contract_id: string
          contractor_contact_id: string
          created_at: string
          id: string
          organization_id: string
          site_id: string | null
          status: string
        }
        Insert: {
          contract_id: string
          contractor_contact_id: string
          created_at?: string
          id?: string
          organization_id: string
          site_id?: string | null
          status?: string
        }
        Update: {
          contract_id?: string
          contractor_contact_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          site_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_portal_accesses_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_portal_accesses_contractor_contact_id_fkey"
            columns: ["contractor_contact_id"]
            isOneToOne: false
            referencedRelation: "contractor_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_portal_accesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contractor_portal_accesses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_portal_accesses_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contractor_workers: {
        Row: {
          contractor_organization_id: string
          created_at: string
          display_name: string
          external_reference: string | null
          id: string
          organization_id: string
          site_id: string | null
          status: string
        }
        Insert: {
          contractor_organization_id: string
          created_at?: string
          display_name: string
          external_reference?: string | null
          id?: string
          organization_id: string
          site_id?: string | null
          status?: string
        }
        Update: {
          contractor_organization_id?: string
          created_at?: string
          display_name?: string
          external_reference?: string | null
          id?: string
          organization_id?: string
          site_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "contractor_workers_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "contractor_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_workers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contractor_workers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contractor_workers_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          code: string
          contractor_organization_id: string
          created_at: string
          ends_at: string | null
          id: string
          organization_id: string
          requirement_id: string | null
          starts_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          contractor_organization_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          organization_id: string
          requirement_id?: string | null
          starts_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          contractor_organization_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          organization_id?: string
          requirement_id?: string | null
          starts_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_contractor_organization_id_fkey"
            columns: ["contractor_organization_id"]
            isOneToOne: false
            referencedRelation: "contractor_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_action_proposals: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          organization_id: string
          proposal: Json
          proposal_type: string
          proposed_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          organization_id: string
          proposal: Json
          proposal_type: string
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          proposal?: Json
          proposal_type?: string
          proposed_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_action_proposals_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copilot_action_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "copilot_action_proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_conversations: {
        Row: {
          actor_user_id: string
          created_at: string
          id: string
          organization_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          actor_user_id: string
          created_at?: string
          id?: string
          organization_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          actor_user_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "copilot_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_messages: {
        Row: {
          actor_user_id: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          organization_id: string
          prompt_injection_flag: boolean
          role: string
        }
        Insert: {
          actor_user_id?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          organization_id: string
          prompt_injection_flag?: boolean
          role: string
        }
        Update: {
          actor_user_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          organization_id?: string
          prompt_injection_flag?: boolean
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copilot_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "copilot_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      copilot_sources: {
        Row: {
          assistant_message_id: string
          created_at: string
          excerpt: string | null
          id: string
          organization_id: string
          source_id: string
          source_type: string
          source_version_id: string | null
        }
        Insert: {
          assistant_message_id: string
          created_at?: string
          excerpt?: string | null
          id?: string
          organization_id: string
          source_id: string
          source_type: string
          source_version_id?: string | null
        }
        Update: {
          assistant_message_id?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          organization_id?: string
          source_id?: string
          source_type?: string
          source_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_sources_assistant_message_id_fkey"
            columns: ["assistant_message_id"]
            isOneToOne: false
            referencedRelation: "copilot_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "copilot_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "copilot_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_evidences: {
        Row: {
          created_at: string
          created_by: string | null
          document_version_id: string
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_version_id: string
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_version_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_evidences_organization_id_document_version_id_fkey"
            columns: ["organization_id", "document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      document_versions: {
        Row: {
          bucket_id: string
          created_at: string
          document_id: string
          id: string
          mime_type: string
          organization_id: string
          original_name: string
          size_bytes: number
          storage_path: string
          uploaded_by: string | null
          version_number: number
        }
        Insert: {
          bucket_id: string
          created_at?: string
          document_id: string
          id?: string
          mime_type: string
          organization_id: string
          original_name: string
          size_bytes: number
          storage_path: string
          uploaded_by?: string | null
          version_number: number
        }
        Update: {
          bucket_id?: string
          created_at?: string
          document_id?: string
          id?: string
          mime_type?: string
          organization_id?: string
          original_name?: string
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_fkey"
            columns: ["organization_id", "document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["organization_id", "id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          deleted_by: string | null
          entity_id: string
          entity_type: string
          expires_at: string | null
          id: string
          organization_id: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id: string
          entity_type: string
          expires_at?: string | null
          id?: string
          organization_id: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          entity_id?: string
          entity_type?: string
          expires_at?: string | null
          id?: string
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "domain_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_actions: {
        Row: {
          created_at: string
          due_at: string | null
          emergency_finding_id: string
          evidence_document_version_id: string | null
          id: string
          improvement_action_id: string | null
          organization_id: string
          responsible_user_id: string | null
          status: string
          title: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          emergency_finding_id: string
          evidence_document_version_id?: string | null
          id?: string
          improvement_action_id?: string | null
          organization_id: string
          responsible_user_id?: string | null
          status?: string
          title: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          due_at?: string | null
          emergency_finding_id?: string
          evidence_document_version_id?: string | null
          id?: string
          improvement_action_id?: string | null
          organization_id?: string
          responsible_user_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_actions_emergency_finding_id_fkey"
            columns: ["emergency_finding_id"]
            isOneToOne: false
            referencedRelation: "emergency_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_actions_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_actions_improvement_action_id_fkey"
            columns: ["improvement_action_id"]
            isOneToOne: false
            referencedRelation: "improvement_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_brigade_members: {
        Row: {
          active: boolean
          appointed_at: string
          created_at: string
          emergency_brigade_id: string
          id: string
          organization_id: string
          organization_member_id: string
          responsibility: string
        }
        Insert: {
          active?: boolean
          appointed_at?: string
          created_at?: string
          emergency_brigade_id: string
          id?: string
          organization_id: string
          organization_member_id: string
          responsibility?: string
        }
        Update: {
          active?: boolean
          appointed_at?: string
          created_at?: string
          emergency_brigade_id?: string
          id?: string
          organization_id?: string
          organization_member_id?: string
          responsibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_brigade_members_emergency_brigade_id_fkey"
            columns: ["emergency_brigade_id"]
            isOneToOne: false
            referencedRelation: "emergency_brigades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_brigade_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_brigade_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_brigade_members_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_brigades: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          site_id: string
          specialty: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          site_id: string
          specialty: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          site_id?: string
          specialty?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_brigades_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_brigades_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_brigades_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_directory_entries: {
        Row: {
          active: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          display_name: string
          id: string
          operational_role: string
          organization_id: string
          site_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          active?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name: string
          id?: string
          operational_role: string
          organization_id: string
          site_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          active?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          display_name?: string
          id?: string
          operational_role?: string
          organization_id?: string
          site_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_directory_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_directory_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_directory_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_drill_results: {
        Row: {
          created_at: string
          duration_seconds: number | null
          emergency_drill_id: string
          id: string
          organization_id: string
          outcome: string
          participant_count: number | null
          recorded_by: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          emergency_drill_id: string
          id?: string
          organization_id: string
          outcome: string
          participant_count?: number | null
          recorded_by?: string | null
          summary: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          emergency_drill_id?: string
          id?: string
          organization_id?: string
          outcome?: string
          participant_count?: number | null
          recorded_by?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_drill_results_emergency_drill_id_fkey"
            columns: ["emergency_drill_id"]
            isOneToOne: true
            referencedRelation: "emergency_drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_drill_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_drill_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_drills: {
        Row: {
          conducted_at: string | null
          coordinator_user_id: string | null
          created_at: string
          emergency_plan_version_id: string | null
          emergency_scenario_id: string | null
          id: string
          organization_id: string
          scheduled_at: string | null
          site_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          conducted_at?: string | null
          coordinator_user_id?: string | null
          created_at?: string
          emergency_plan_version_id?: string | null
          emergency_scenario_id?: string | null
          id?: string
          organization_id: string
          scheduled_at?: string | null
          site_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          conducted_at?: string | null
          coordinator_user_id?: string | null
          created_at?: string
          emergency_plan_version_id?: string | null
          emergency_scenario_id?: string | null
          id?: string
          organization_id?: string
          scheduled_at?: string | null
          site_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_drills_emergency_plan_version_id_fkey"
            columns: ["emergency_plan_version_id"]
            isOneToOne: false
            referencedRelation: "emergency_plan_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_drills_emergency_scenario_id_fkey"
            columns: ["emergency_scenario_id"]
            isOneToOne: false
            referencedRelation: "emergency_scenarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_drills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_drills_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_drills_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_findings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          emergency_drill_id: string
          id: string
          organization_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emergency_drill_id: string
          id?: string
          organization_id: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          emergency_drill_id?: string
          id?: string
          organization_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_findings_emergency_drill_id_fkey"
            columns: ["emergency_drill_id"]
            isOneToOne: false
            referencedRelation: "emergency_drills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_plan_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          document_version_id: string | null
          effective_from: string | null
          effective_to: string | null
          id: string
          organization_id: string
          site_id: string
          status: string
          summary: string
          updated_at: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          document_version_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          organization_id: string
          site_id: string
          status?: string
          summary: string
          updated_at?: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          document_version_id?: string | null
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          organization_id?: string
          site_id?: string
          status?: string
          summary?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "emergency_plan_versions_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_plan_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_plan_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_plan_versions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_resources: {
        Row: {
          created_at: string
          evidence_document_version_id: string | null
          expires_at: string | null
          id: string
          inspection_due_at: string | null
          location_description: string | null
          name: string
          organization_id: string
          quantity: number
          resource_type: string
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evidence_document_version_id?: string | null
          expires_at?: string | null
          id?: string
          inspection_due_at?: string | null
          location_description?: string | null
          name: string
          organization_id: string
          quantity?: number
          resource_type: string
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evidence_document_version_id?: string | null
          expires_at?: string | null
          id?: string
          inspection_due_at?: string | null
          location_description?: string | null
          name?: string
          organization_id?: string
          quantity?: number
          resource_type?: string
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_resources_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_resources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_resources_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      emergency_scenarios: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          site_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          site_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          site_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergency_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_scenarios_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_scenarios_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      hazard_catalog: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          expert_review_status: string
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          expert_review_status?: string
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          expert_review_status?: string
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      health_program_enrollments: {
        Row: {
          created_at: string
          health_surveillance_program_id: string
          id: string
          next_review_at: string | null
          organization_id: string
          organization_member_id: string
          status: string
        }
        Insert: {
          created_at?: string
          health_surveillance_program_id: string
          id?: string
          next_review_at?: string | null
          organization_id: string
          organization_member_id: string
          status?: string
        }
        Update: {
          created_at?: string
          health_surveillance_program_id?: string
          id?: string
          next_review_at?: string | null
          organization_id?: string
          organization_member_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_program_enrollments_health_surveillance_program_id_fkey"
            columns: ["health_surveillance_program_id"]
            isOneToOne: false
            referencedRelation: "health_surveillance_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_program_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "health_program_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_program_enrollments_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      health_surveillance_programs: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_surveillance_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "health_surveillance_programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_job_effects: {
        Row: {
          before_data: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          import_job_id: string
          operation: string
          organization_id: string
        }
        Insert: {
          before_data?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          import_job_id: string
          operation: string
          organization_id: string
        }
        Update: {
          before_data?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          import_job_id?: string
          operation?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_job_effects_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_job_effects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "import_job_effects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          completed_at: string | null
          content_hash: string
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          idempotency_key: string
          import_type: string
          mapping: Json
          mode: string
          organization_id: string
          status: string
          summary: Json
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          content_hash: string
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          idempotency_key: string
          import_type: string
          mapping?: Json
          mode?: string
          organization_id: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          content_hash?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          idempotency_key?: string
          import_type?: string
          mapping?: Json
          mode?: string
          organization_id?: string
          status?: string
          summary?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "import_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      import_rows: {
        Row: {
          created_at: string
          id: string
          import_job_id: string
          normalized_data: Json | null
          organization_id: string
          raw_data: Json
          row_number: number
          status: string
          target_reference: string | null
          validation_errors: Json
        }
        Insert: {
          created_at?: string
          id?: string
          import_job_id: string
          normalized_data?: Json | null
          organization_id: string
          raw_data: Json
          row_number: number
          status?: string
          target_reference?: string | null
          validation_errors?: Json
        }
        Update: {
          created_at?: string
          id?: string
          import_job_id?: string
          normalized_data?: Json | null
          organization_id?: string
          raw_data?: Json
          row_number?: number
          status?: string
          target_reference?: string | null
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_rows_import_job_id_fkey"
            columns: ["import_job_id"]
            isOneToOne: false
            referencedRelation: "import_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_rows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "import_rows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_actions: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          evidence_document_version_id: string | null
          gap_id: string
          generated_key: string | null
          id: string
          organization_id: string
          priority: string
          responsible_user_id: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_note: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence_document_version_id?: string | null
          gap_id: string
          generated_key?: string | null
          id?: string
          organization_id: string
          priority: string
          responsible_user_id?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          evidence_document_version_id?: string | null
          gap_id?: string
          generated_key?: string | null
          id?: string
          organization_id?: string
          priority?: string
          responsible_user_id?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "improvement_actions_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_actions_gap_id_fkey"
            columns: ["gap_id"]
            isOneToOne: false
            referencedRelation: "improvement_gaps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "improvement_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_findings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          organization_id: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "improvement_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      improvement_gaps: {
        Row: {
          assessment_item_id: string | null
          created_at: string
          created_by: string | null
          deduplication_key: string
          description: string | null
          finding_id: string | null
          id: string
          last_detected_assessment_id: string | null
          organization_id: string
          origin_type: string
          priority: string
          requirement_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assessment_item_id?: string | null
          created_at?: string
          created_by?: string | null
          deduplication_key: string
          description?: string | null
          finding_id?: string | null
          id?: string
          last_detected_assessment_id?: string | null
          organization_id: string
          origin_type: string
          priority?: string
          requirement_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assessment_item_id?: string | null
          created_at?: string
          created_by?: string | null
          deduplication_key?: string
          description?: string | null
          finding_id?: string | null
          id?: string
          last_detected_assessment_id?: string | null
          organization_id?: string
          origin_type?: string
          priority?: string
          requirement_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "improvement_gaps_assessment_item_id_fkey"
            columns: ["assessment_item_id"]
            isOneToOne: false
            referencedRelation: "assessment_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_gaps_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "improvement_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_gaps_last_detected_assessment_id_fkey"
            columns: ["last_detected_assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_gaps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "improvement_gaps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "improvement_gaps_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_actions: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          improvement_action_id: string | null
          incident_id: string
          organization_id: string
          responsible_user_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          improvement_action_id?: string | null
          incident_id: string
          organization_id: string
          responsible_user_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          improvement_action_id?: string | null
          incident_id?: string
          organization_id?: string
          responsible_user_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_actions_improvement_action_id_fkey"
            columns: ["improvement_action_id"]
            isOneToOne: false
            referencedRelation: "improvement_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_causes: {
        Row: {
          cause_type: string
          created_at: string
          description: string
          id: string
          incident_investigation_id: string
          organization_id: string
        }
        Insert: {
          cause_type: string
          created_at?: string
          description: string
          id?: string
          incident_investigation_id: string
          organization_id: string
        }
        Update: {
          cause_type?: string
          created_at?: string
          description?: string
          id?: string
          incident_investigation_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_causes_incident_investigation_id_fkey"
            columns: ["incident_investigation_id"]
            isOneToOne: false
            referencedRelation: "incident_investigations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_causes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_causes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_communications: {
        Row: {
          communication_type: string
          created_at: string
          document_version_id: string | null
          id: string
          incident_id: string
          organization_id: string
          status: string
        }
        Insert: {
          communication_type: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          incident_id: string
          organization_id: string
          status?: string
        }
        Update: {
          communication_type?: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          incident_id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_communications_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_communications_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_communications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_evidences: {
        Row: {
          created_at: string
          document_version_id: string
          id: string
          incident_id: string
          organization_id: string
          visibility: string
        }
        Insert: {
          created_at?: string
          document_version_id: string
          id?: string
          incident_id: string
          organization_id: string
          visibility?: string
        }
        Update: {
          created_at?: string
          document_version_id?: string
          id?: string
          incident_id?: string
          organization_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_evidences_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_evidences_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_evidences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_evidences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_export_templates: {
        Row: {
          code: string
          created_at: string
          document_version_id: string | null
          id: string
          organization_id: string
          status: string
          title: string
          version: string
        }
        Insert: {
          code: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          organization_id: string
          status?: string
          title: string
          version: string
        }
        Update: {
          code?: string
          created_at?: string
          document_version_id?: string | null
          id?: string
          organization_id?: string
          status?: string
          title?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_export_templates_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_export_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_export_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_investigations: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          incident_id: string
          lead_user_id: string | null
          methodology_note: string | null
          organization_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          incident_id: string
          lead_user_id?: string | null
          methodology_note?: string | null
          organization_id: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          incident_id?: string
          lead_user_id?: string | null
          methodology_note?: string | null
          organization_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_investigations_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: true
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_investigations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_investigations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_people: {
        Row: {
          created_at: string
          display_reference: string | null
          id: string
          incident_id: string
          organization_id: string
          organization_member_id: string | null
          role: string
        }
        Insert: {
          created_at?: string
          display_reference?: string | null
          id?: string
          incident_id: string
          organization_id: string
          organization_member_id?: string | null
          role: string
        }
        Update: {
          created_at?: string
          display_reference?: string | null
          id?: string
          incident_id?: string
          organization_id?: string
          organization_member_id?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_people_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_people_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_people_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_sensitive_details: {
        Row: {
          affected_person_reference: string | null
          created_at: string
          health_information_note: string | null
          incident_id: string
          organization_id: string
          restricted_description: string | null
          updated_at: string
        }
        Insert: {
          affected_person_reference?: string | null
          created_at?: string
          health_information_note?: string | null
          incident_id: string
          organization_id: string
          restricted_description?: string | null
          updated_at?: string
        }
        Update: {
          affected_person_reference?: string | null
          created_at?: string
          health_information_note?: string | null
          incident_id?: string
          organization_id?: string
          restricted_description?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_sensitive_details_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: true
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incident_sensitive_details_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incident_sensitive_details_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          classification: string
          closed_at: string | null
          closed_by: string | null
          created_at: string
          id: string
          occurred_at: string | null
          organization_id: string
          reference_code: string
          reported_at: string
          reported_by: string | null
          site_id: string | null
          status: string
          summary: string
          updated_at: string
        }
        Insert: {
          classification: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          occurred_at?: string | null
          organization_id: string
          reference_code: string
          reported_at?: string
          reported_by?: string | null
          site_id?: string | null
          status?: string
          summary: string
          updated_at?: string
        }
        Update: {
          classification?: string
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          id?: string
          occurred_at?: string | null
          organization_id?: string
          reference_code?: string
          reported_at?: string
          reported_by?: string | null
          site_id?: string | null
          status?: string
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_calculation_runs: {
        Row: {
          calculated_at: string
          completed_at: string | null
          created_at: string
          failure_reason: string | null
          formula_snapshot: string
          id: string
          idempotency_key: string
          indicator_version_id: string
          organization_id: string
          period_end: string
          period_start: string
          requested_by: string | null
          source_snapshot: Json
          started_at: string | null
          status: string
          target_direction_snapshot: string
          target_value_snapshot: number | null
        }
        Insert: {
          calculated_at?: string
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          formula_snapshot?: string
          id?: string
          idempotency_key: string
          indicator_version_id: string
          organization_id: string
          period_end: string
          period_start: string
          requested_by?: string | null
          source_snapshot?: Json
          started_at?: string | null
          status?: string
          target_direction_snapshot?: string
          target_value_snapshot?: number | null
        }
        Update: {
          calculated_at?: string
          completed_at?: string | null
          created_at?: string
          failure_reason?: string | null
          formula_snapshot?: string
          id?: string
          idempotency_key?: string
          indicator_version_id?: string
          organization_id?: string
          period_end?: string
          period_start?: string
          requested_by?: string | null
          source_snapshot?: Json
          started_at?: string | null
          status?: string
          target_direction_snapshot?: string
          target_value_snapshot?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "indicator_calculation_runs_indicator_version_id_fkey"
            columns: ["indicator_version_id"]
            isOneToOne: false
            referencedRelation: "indicator_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_calculation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "indicator_calculation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_catalog: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          owner_user_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          owner_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_user_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "indicator_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "indicator_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_results: {
        Row: {
          calculation_run_id: string
          created_at: string
          dimension_values: Json
          explanation: Json
          formula_snapshot: string
          id: string
          indicator_version_id: string
          legal_entity_id: string | null
          organization_id: string
          period_end: string
          period_start: string
          site_id: string | null
          source_snapshot: Json
          target_direction_snapshot: string
          target_value: number | null
          value: number
        }
        Insert: {
          calculation_run_id: string
          created_at?: string
          dimension_values?: Json
          explanation?: Json
          formula_snapshot?: string
          id?: string
          indicator_version_id: string
          legal_entity_id?: string | null
          organization_id: string
          period_end: string
          period_start: string
          site_id?: string | null
          source_snapshot?: Json
          target_direction_snapshot?: string
          target_value?: number | null
          value: number
        }
        Update: {
          calculation_run_id?: string
          created_at?: string
          dimension_values?: Json
          explanation?: Json
          formula_snapshot?: string
          id?: string
          indicator_version_id?: string
          legal_entity_id?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          site_id?: string | null
          source_snapshot?: Json
          target_direction_snapshot?: string
          target_value?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_results_calculation_run_id_fkey"
            columns: ["calculation_run_id"]
            isOneToOne: false
            referencedRelation: "indicator_calculation_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_results_indicator_version_id_fkey"
            columns: ["indicator_version_id"]
            isOneToOne: false
            referencedRelation: "indicator_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_results_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "legal_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "indicator_results_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_results_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      indicator_versions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          dimensions: Json
          effective_from: string
          effective_to: string | null
          formula_description: string
          id: string
          indicator_id: string
          organization_id: string
          periodicity: string
          source_config: Json
          status: string
          target_direction: string
          target_value: number | null
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dimensions?: Json
          effective_from?: string
          effective_to?: string | null
          formula_description: string
          id?: string
          indicator_id: string
          organization_id: string
          periodicity: string
          source_config?: Json
          status?: string
          target_direction?: string
          target_value?: number | null
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dimensions?: Json
          effective_from?: string
          effective_to?: string | null
          formula_description?: string
          id?: string
          indicator_id?: string
          organization_id?: string
          periodicity?: string
          source_config?: Json
          status?: string
          target_direction?: string
          target_value?: number | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "indicator_versions_indicator_id_fkey"
            columns: ["indicator_id"]
            isOneToOne: false
            referencedRelation: "indicator_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "indicator_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "indicator_versions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_connections: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          id: string
          organization_id: string
          provider_code: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          organization_id: string
          provider_code: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          organization_id?: string
          provider_code?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "integration_connections_organization_id_fkey"
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "legal_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      management_review_commitments: {
        Row: {
          created_at: string
          due_at: string | null
          id: string
          management_review_id: string
          organization_id: string
          status: string
          task_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          due_at?: string | null
          id?: string
          management_review_id: string
          organization_id: string
          status?: string
          task_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          due_at?: string | null
          id?: string
          management_review_id?: string
          organization_id?: string
          status?: string
          task_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_review_commitments_management_review_id_fkey"
            columns: ["management_review_id"]
            isOneToOne: false
            referencedRelation: "management_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_review_commitments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "management_review_commitments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_review_commitments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      management_review_decisions: {
        Row: {
          created_at: string
          decision: string
          id: string
          management_review_id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          decision: string
          id?: string
          management_review_id: string
          organization_id: string
        }
        Update: {
          created_at?: string
          decision?: string
          id?: string
          management_review_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_review_decisions_management_review_id_fkey"
            columns: ["management_review_id"]
            isOneToOne: false
            referencedRelation: "management_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_review_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "management_review_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      management_review_entries: {
        Row: {
          content: Json
          entry_type: string
          id: string
          management_review_id: string
          organization_id: string
        }
        Insert: {
          content?: Json
          entry_type: string
          id?: string
          management_review_id: string
          organization_id: string
        }
        Update: {
          content?: Json
          entry_type?: string
          id?: string
          management_review_id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_review_entries_management_review_id_fkey"
            columns: ["management_review_id"]
            isOneToOne: false
            referencedRelation: "management_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_review_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "management_review_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      management_reviews: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          chair_user_id: string | null
          created_at: string
          document_version_id: string | null
          id: string
          minutes_content: Json
          organization_id: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          chair_user_id?: string | null
          created_at?: string
          document_version_id?: string | null
          id?: string
          minutes_content?: Json
          organization_id: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          chair_user_id?: string | null
          created_at?: string
          document_version_id?: string | null
          id?: string
          minutes_content?: Json
          organization_id?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "management_reviews_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "management_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "management_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_agenda_items: {
        Row: {
          committee_meeting_id: string
          id: string
          notes: string | null
          organization_id: string
          position: number
          title: string
        }
        Insert: {
          committee_meeting_id: string
          id?: string
          notes?: string | null
          organization_id: string
          position: number
          title: string
        }
        Update: {
          committee_meeting_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          position?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_agenda_items_committee_meeting_id_fkey"
            columns: ["committee_meeting_id"]
            isOneToOne: false
            referencedRelation: "committee_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "meeting_agenda_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendance: {
        Row: {
          attendance_note: string | null
          committee_meeting_id: string
          organization_id: string
          organization_member_id: string
          present: boolean
        }
        Insert: {
          attendance_note?: string | null
          committee_meeting_id: string
          organization_id: string
          organization_member_id: string
          present?: boolean
        }
        Update: {
          attendance_note?: string | null
          committee_meeting_id?: string
          organization_id?: string
          organization_member_id?: string
          present?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_committee_meeting_id_fkey"
            columns: ["committee_meeting_id"]
            isOneToOne: false
            referencedRelation: "committee_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "meeting_attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minute_signatures: {
        Row: {
          committee_member_id: string | null
          content_hash: string
          content_snapshot: Json
          id: string
          meeting_minutes_id: string
          organization_id: string
          signed_at: string
          signer_role: string
          signer_user_id: string
        }
        Insert: {
          committee_member_id?: string | null
          content_hash: string
          content_snapshot: Json
          id?: string
          meeting_minutes_id: string
          organization_id: string
          signed_at?: string
          signer_role: string
          signer_user_id: string
        }
        Update: {
          committee_member_id?: string | null
          content_hash?: string
          content_snapshot?: Json
          id?: string
          meeting_minutes_id?: string
          organization_id?: string
          signed_at?: string
          signer_role?: string
          signer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minute_signatures_committee_member_id_fkey"
            columns: ["committee_member_id"]
            isOneToOne: false
            referencedRelation: "committee_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minute_signatures_meeting_minutes_id_fkey"
            columns: ["meeting_minutes_id"]
            isOneToOne: false
            referencedRelation: "meeting_minutes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minute_signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "meeting_minute_signatures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          committee_meeting_id: string
          content: Json
          created_at: string
          document_version_id: string | null
          id: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          committee_meeting_id: string
          content?: Json
          created_at?: string
          document_version_id?: string | null
          id?: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          committee_meeting_id?: string
          content?: Json
          created_at?: string
          document_version_id?: string | null
          id?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_committee_meeting_id_fkey"
            columns: ["committee_meeting_id"]
            isOneToOne: true
            referencedRelation: "committee_meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "meeting_minutes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body: Json
          code: string
          created_at: string
          id: string
          organization_id: string
          status: string
          title: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body?: Json
          code: string
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          title: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body?: Json
          code?: string
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          title?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "meeting_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "meeting_templates_organization_id_fkey"
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
      minimum_standards: {
        Row: {
          code: string
          created_at: string
          criterion: string | null
          effective_from: string | null
          effective_to: string | null
          expected_evidence: string | null
          expert_review_status: string
          functional_description: string
          id: string
          normative_source_version_id: string
          phva_cycle: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          criterion?: string | null
          effective_from?: string | null
          effective_to?: string | null
          expected_evidence?: string | null
          expert_review_status?: string
          functional_description: string
          id?: string
          normative_source_version_id: string
          phva_cycle: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          criterion?: string | null
          effective_from?: string | null
          effective_to?: string | null
          expected_evidence?: string | null
          expert_review_status?: string
          functional_description?: string
          id?: string
          normative_source_version_id?: string
          phva_cycle?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "minimum_standards_normative_source_version_id_fkey"
            columns: ["normative_source_version_id"]
            isOneToOne: false
            referencedRelation: "normative_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      normative_review_artifacts: {
        Row: {
          applicability_rule_id: string | null
          artifact_key: string
          artifact_type: string
          assessment_scoring_rule_id: string | null
          content_snapshot: Json
          created_at: string
          created_by: string
          id: string
          minimum_standard_id: string | null
          normative_source_version_id: string | null
          profile_standard_id: string | null
          requirement_id: string | null
          review_status: string
          risk_methodology_formula_id: string | null
          risk_methodology_interpretation_rule_id: string | null
          risk_methodology_version_id: string | null
          source_path: string | null
          standard_profile_version_id: string | null
          supersedes_artifact_id: string | null
          title: string
        }
        Insert: {
          applicability_rule_id?: string | null
          artifact_key: string
          artifact_type: string
          assessment_scoring_rule_id?: string | null
          content_snapshot: Json
          created_at?: string
          created_by: string
          id?: string
          minimum_standard_id?: string | null
          normative_source_version_id?: string | null
          profile_standard_id?: string | null
          requirement_id?: string | null
          review_status?: string
          risk_methodology_formula_id?: string | null
          risk_methodology_interpretation_rule_id?: string | null
          risk_methodology_version_id?: string | null
          source_path?: string | null
          standard_profile_version_id?: string | null
          supersedes_artifact_id?: string | null
          title: string
        }
        Update: {
          applicability_rule_id?: string | null
          artifact_key?: string
          artifact_type?: string
          assessment_scoring_rule_id?: string | null
          content_snapshot?: Json
          created_at?: string
          created_by?: string
          id?: string
          minimum_standard_id?: string | null
          normative_source_version_id?: string | null
          profile_standard_id?: string | null
          requirement_id?: string | null
          review_status?: string
          risk_methodology_formula_id?: string | null
          risk_methodology_interpretation_rule_id?: string | null
          risk_methodology_version_id?: string | null
          source_path?: string | null
          standard_profile_version_id?: string | null
          supersedes_artifact_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "normative_review_artifacts_applicability_rule_id_fkey"
            columns: ["applicability_rule_id"]
            isOneToOne: false
            referencedRelation: "applicability_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_assessment_scoring_rule_id_fkey"
            columns: ["assessment_scoring_rule_id"]
            isOneToOne: false
            referencedRelation: "assessment_scoring_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_minimum_standard_id_fkey"
            columns: ["minimum_standard_id"]
            isOneToOne: false
            referencedRelation: "minimum_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_normative_source_version_id_fkey"
            columns: ["normative_source_version_id"]
            isOneToOne: false
            referencedRelation: "normative_source_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_profile_standard_id_fkey"
            columns: ["profile_standard_id"]
            isOneToOne: false
            referencedRelation: "profile_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_risk_methodology_formula_id_fkey"
            columns: ["risk_methodology_formula_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_formulas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_risk_methodology_interpretation_fkey"
            columns: ["risk_methodology_interpretation_rule_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_interpretation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_risk_methodology_version_id_fkey"
            columns: ["risk_methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_standard_profile_version_id_fkey"
            columns: ["standard_profile_version_id"]
            isOneToOne: false
            referencedRelation: "standard_profile_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_artifacts_supersedes_artifact_id_fkey"
            columns: ["supersedes_artifact_id"]
            isOneToOne: false
            referencedRelation: "normative_review_artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      normative_review_audit: {
        Row: {
          action: string
          actor_user_id: string | null
          after_data: Json | null
          before_data: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
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
        }
        Relationships: []
      }
      normative_review_decisions: {
        Row: {
          artifact_id: string
          content_snapshot: Json
          decided_at: string
          decided_by: string
          decision: string
          id: string
          note: string
          proposal_id: string | null
        }
        Insert: {
          artifact_id: string
          content_snapshot: Json
          decided_at?: string
          decided_by: string
          decision: string
          id?: string
          note: string
          proposal_id?: string | null
        }
        Update: {
          artifact_id?: string
          content_snapshot?: Json
          decided_at?: string
          decided_by?: string
          decision?: string
          id?: string
          note?: string
          proposal_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "normative_review_decisions_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "normative_review_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_decisions_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "normative_review_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      normative_review_proposals: {
        Row: {
          artifact_id: string
          created_at: string
          id: string
          proposed_by: string
          proposed_content: Json
          rationale: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          successor_artifact_id: string | null
        }
        Insert: {
          artifact_id: string
          created_at?: string
          id?: string
          proposed_by: string
          proposed_content: Json
          rationale: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          successor_artifact_id?: string | null
        }
        Update: {
          artifact_id?: string
          created_at?: string
          id?: string
          proposed_by?: string
          proposed_content?: Json
          rationale?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          successor_artifact_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "normative_review_proposals_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "normative_review_artifacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_review_proposals_successor_artifact_id_fkey"
            columns: ["successor_artifact_id"]
            isOneToOne: false
            referencedRelation: "normative_review_artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      normative_reviewer_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          reason: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          reason: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          reason?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      normative_source_versions: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          expert_review_status: string
          id: string
          interpretive_note: string | null
          official_reference: string
          official_url: string | null
          source_id: string
          status: string
          supersedes_version_id: string | null
          updated_at: string
          version_code: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          expert_review_status?: string
          id?: string
          interpretive_note?: string | null
          official_reference: string
          official_url?: string | null
          source_id: string
          status?: string
          supersedes_version_id?: string | null
          updated_at?: string
          version_code: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          expert_review_status?: string
          id?: string
          interpretive_note?: string | null
          official_reference?: string
          official_url?: string | null
          source_id?: string
          status?: string
          supersedes_version_id?: string | null
          updated_at?: string
          version_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "normative_source_versions_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "normative_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "normative_source_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "normative_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      normative_sources: {
        Row: {
          code: string
          created_at: string
          id: string
          issuing_authority: string | null
          jurisdiction: string
          source_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          issuing_authority?: string | null
          jurisdiction?: string
          source_type: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          issuing_authority?: string | null
          jurisdiction?: string
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_deliveries: {
        Row: {
          attempt_count: number
          available_at: string
          channel: string
          created_at: string
          delivered_at: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          notification_id: string
          organization_id: string
          status: string
        }
        Insert: {
          attempt_count?: number
          available_at?: string
          channel: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notification_id: string
          organization_id: string
          status?: string
        }
        Update: {
          attempt_count?: number
          available_at?: string
          channel?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          notification_id?: string
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: true
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_event_consumptions: {
        Row: {
          attempt_count: number
          available_at: string
          completed_at: string | null
          created_at: string
          domain_event_id: string
          id: string
          idempotency_key: string
          last_error: string | null
          locked_at: string | null
          locked_by: string | null
          organization_id: string
          status: string
        }
        Insert: {
          attempt_count?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          domain_event_id: string
          id?: string
          idempotency_key: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          organization_id: string
          status?: string
        }
        Update: {
          attempt_count?: number
          available_at?: string
          completed_at?: string | null
          created_at?: string
          domain_event_id?: string
          id?: string
          idempotency_key?: string
          last_error?: string | null
          locked_at?: string | null
          locked_by?: string | null
          organization_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_event_consumptions_domain_event_id_fkey"
            columns: ["domain_event_id"]
            isOneToOne: true
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_event_consumptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_event_consumptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          in_app_enabled: boolean
          organization_id: string
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          organization_id: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          in_app_enabled?: boolean
          organization_id?: string
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_preferences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          body_template: string
          channel: string
          created_at: string
          event_type: string
          id: string
          organization_id: string
          status: string
          title_template: string
          version_number: number
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          body_template: string
          channel: string
          created_at?: string
          event_type: string
          id?: string
          organization_id: string
          status?: string
          title_template: string
          version_number: number
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          body_template?: string
          channel?: string
          created_at?: string
          event_type?: string
          id?: string
          organization_id?: string
          status?: string
          title_template?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notification_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          domain_event_id: string
          id: string
          organization_id: string
          priority: string
          read_at: string | null
          recipient_user_id: string
          safe_link: string | null
          status: string
          title: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          domain_event_id: string
          id?: string
          organization_id: string
          priority?: string
          read_at?: string | null
          recipient_user_id: string
          safe_link?: string | null
          status?: string
          title: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          domain_event_id?: string
          id?: string
          organization_id?: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string
          safe_link?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_domain_event_id_fkey"
            columns: ["domain_event_id"]
            isOneToOne: false
            referencedRelation: "domain_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      occupational_fitness_concepts: {
        Row: {
          concept: string
          created_at: string
          evidence_document_version_id: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issued_by_user_id: string | null
          organization_id: string
          organization_member_id: string
        }
        Insert: {
          concept: string
          created_at?: string
          evidence_document_version_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at: string
          issued_by_user_id?: string | null
          organization_id: string
          organization_member_id: string
        }
        Update: {
          concept?: string
          created_at?: string
          evidence_document_version_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by_user_id?: string | null
          organization_id?: string
          organization_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "occupational_fitness_concepts_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupational_fitness_concepts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "occupational_fitness_concepts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupational_fitness_concepts_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
        ]
      }
      occupational_health_decisions: {
        Row: {
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          created_by: string | null
          decision_type: string
          id: string
          organization_id: string
          organization_member_id: string
          reason_summary: string
          status: string
        }
        Insert: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          decision_type: string
          id?: string
          organization_id: string
          organization_member_id: string
          reason_summary: string
          status?: string
        }
        Update: {
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          created_by?: string | null
          decision_type?: string
          id?: string
          organization_id?: string
          organization_member_id?: string
          reason_summary?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "occupational_health_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "occupational_health_decisions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupational_health_decisions_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_characteristics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_classifications: {
        Row: {
          change_reason: string
          ciiu_code: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          economic_activity: string | null
          effective_from: string
          effective_to: string | null
          employee_count: number
          evaluator_version_id: string
          explanation: Json
          id: string
          organization_id: string
          risk_class: number
          scope_key: string
          standard_profile_id: string
        }
        Insert: {
          change_reason: string
          ciiu_code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          economic_activity?: string | null
          effective_from: string
          effective_to?: string | null
          employee_count: number
          evaluator_version_id: string
          explanation?: Json
          id?: string
          organization_id: string
          risk_class: number
          scope_key?: string
          standard_profile_id: string
        }
        Update: {
          change_reason?: string
          ciiu_code?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          economic_activity?: string | null
          effective_from?: string
          effective_to?: string | null
          employee_count?: number
          evaluator_version_id?: string
          explanation?: Json
          id?: string
          organization_id?: string
          risk_class?: number
          scope_key?: string
          standard_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_classifications_evaluator_version_id_fkey"
            columns: ["evaluator_version_id"]
            isOneToOne: false
            referencedRelation: "classification_evaluator_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_classifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_classifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_classifications_standard_profile_id_fkey"
            columns: ["standard_profile_id"]
            isOneToOne: false
            referencedRelation: "standard_profiles"
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_requirements: {
        Row: {
          applicability_rule_id: string | null
          classification_id: string | null
          evaluated_at: string
          evaluated_by: string | null
          explanation: Json
          id: string
          input_snapshot: Json
          is_current: boolean
          organization_id: string
          requirement_id: string
          result: string
          valid_from: string
          valid_to: string | null
        }
        Insert: {
          applicability_rule_id?: string | null
          classification_id?: string | null
          evaluated_at?: string
          evaluated_by?: string | null
          explanation?: Json
          id?: string
          input_snapshot?: Json
          is_current?: boolean
          organization_id: string
          requirement_id: string
          result: string
          valid_from: string
          valid_to?: string | null
        }
        Update: {
          applicability_rule_id?: string | null
          classification_id?: string | null
          evaluated_at?: string
          evaluated_by?: string | null
          explanation?: Json
          id?: string
          input_snapshot?: Json
          is_current?: boolean
          organization_id?: string
          requirement_id?: string
          result?: string
          valid_from?: string
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_requirements_applicability_rule_id_fkey"
            columns: ["applicability_rule_id"]
            isOneToOne: false
            referencedRelation: "applicability_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requirements_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "organization_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_requirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_requirements_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_standard_snapshot_items: {
        Row: {
          applicability_result: string | null
          created_at: string
          id: string
          item_code: string
          item_snapshot: Json
          item_type: string
          minimum_standard_id: string | null
          organization_requirement_id: string | null
          requirement_id: string | null
          snapshot_id: string
        }
        Insert: {
          applicability_result?: string | null
          created_at?: string
          id?: string
          item_code: string
          item_snapshot: Json
          item_type: string
          minimum_standard_id?: string | null
          organization_requirement_id?: string | null
          requirement_id?: string | null
          snapshot_id: string
        }
        Update: {
          applicability_result?: string | null
          created_at?: string
          id?: string
          item_code?: string
          item_snapshot?: Json
          item_type?: string
          minimum_standard_id?: string | null
          organization_requirement_id?: string | null
          requirement_id?: string | null
          snapshot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_standard_snapshot_items_minimum_standard_id_fkey"
            columns: ["minimum_standard_id"]
            isOneToOne: false
            referencedRelation: "minimum_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standard_snapshot_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standard_snapshot_items_snapshot_id_fkey"
            columns: ["snapshot_id"]
            isOneToOne: false
            referencedRelation: "organization_standard_snapshots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standard_snapshot_organization_requirement_id_fkey"
            columns: ["organization_requirement_id"]
            isOneToOne: false
            referencedRelation: "organization_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_standard_snapshots: {
        Row: {
          classification_id: string | null
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          reason: string | null
          rules_snapshot: Json
          snapshot_date: string
          snapshot_type: string
          source_snapshot: Json
          standard_profile_version_id: string | null
        }
        Insert: {
          classification_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          reason?: string | null
          rules_snapshot?: Json
          snapshot_date?: string
          snapshot_type: string
          source_snapshot?: Json
          standard_profile_version_id?: string | null
        }
        Update: {
          classification_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          reason?: string | null
          rules_snapshot?: Json
          snapshot_date?: string
          snapshot_type?: string
          source_snapshot?: Json
          standard_profile_version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_standard_snapshot_standard_profile_version_id_fkey"
            columns: ["standard_profile_version_id"]
            isOneToOne: false
            referencedRelation: "standard_profile_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standard_snapshots_classification_id_fkey"
            columns: ["classification_id"]
            isOneToOne: false
            referencedRelation: "organization_classifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_standard_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "organization_standard_snapshots_organization_id_fkey"
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
      plan_activities: {
        Row: {
          annual_plan_id: string
          budget: number | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          organization_id: string
          priority: string
          responsible_user_id: string | null
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          annual_plan_id: string
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          organization_id: string
          priority?: string
          responsible_user_id?: string | null
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          annual_plan_id?: string
          budget?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          organization_id?: string
          priority?: string
          responsible_user_id?: string | null
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_activities_annual_plan_id_fkey"
            columns: ["annual_plan_id"]
            isOneToOne: false
            referencedRelation: "annual_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "plan_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_assignments: {
        Row: {
          assigned_at: string
          created_at: string
          created_by: string | null
          expected_replacement_at: string | null
          id: string
          life_expires_at: string | null
          organization_id: string
          organization_member_id: string
          ppe_catalog_id: string
          replacement_required: boolean
          site_id: string | null
          size_label: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          expected_replacement_at?: string | null
          id?: string
          life_expires_at?: string | null
          organization_id: string
          organization_member_id: string
          ppe_catalog_id: string
          replacement_required?: boolean
          site_id?: string | null
          size_label?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string
          created_at?: string
          created_by?: string | null
          expected_replacement_at?: string | null
          id?: string
          life_expires_at?: string | null
          organization_id?: string
          organization_member_id?: string
          ppe_catalog_id?: string
          replacement_required?: boolean
          site_id?: string | null
          size_label?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_assignments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_assignments_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_assignments_ppe_catalog_id_fkey"
            columns: ["ppe_catalog_id"]
            isOneToOne: false
            referencedRelation: "ppe_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_assignments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_catalog: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
          useful_life_days: number | null
        }
        Insert: {
          category: string
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          useful_life_days?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          useful_life_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ppe_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_catalog_controls: {
        Row: {
          created_at: string
          organization_id: string
          ppe_catalog_id: string
          risk_control_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          ppe_catalog_id: string
          risk_control_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          ppe_catalog_id?: string
          risk_control_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_catalog_controls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_catalog_controls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_catalog_controls_ppe_catalog_id_fkey"
            columns: ["ppe_catalog_id"]
            isOneToOne: false
            referencedRelation: "ppe_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_catalog_controls_risk_control_id_fkey"
            columns: ["risk_control_id"]
            isOneToOne: false
            referencedRelation: "risk_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_catalog_hazards: {
        Row: {
          created_at: string
          hazard_id: string
          ppe_catalog_id: string
        }
        Insert: {
          created_at?: string
          hazard_id: string
          ppe_catalog_id: string
        }
        Update: {
          created_at?: string
          hazard_id?: string
          ppe_catalog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_catalog_hazards_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazard_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_catalog_hazards_ppe_catalog_id_fkey"
            columns: ["ppe_catalog_id"]
            isOneToOne: false
            referencedRelation: "ppe_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_deliveries: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          created_by: string | null
          delivered_at: string
          delivery_kind: string
          evidence_document_version_id: string | null
          id: string
          inventory_id: string
          organization_id: string
          ppe_assignment_id: string
          quantity: number
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string
          delivery_kind?: string
          evidence_document_version_id?: string | null
          id?: string
          inventory_id: string
          organization_id: string
          ppe_assignment_id: string
          quantity: number
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string
          delivery_kind?: string
          evidence_document_version_id?: string | null
          id?: string
          inventory_id?: string
          organization_id?: string
          ppe_assignment_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "ppe_deliveries_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_deliveries_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "ppe_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_deliveries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_deliveries_ppe_assignment_id_fkey"
            columns: ["ppe_assignment_id"]
            isOneToOne: false
            referencedRelation: "ppe_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_inspections: {
        Row: {
          created_at: string
          evidence_document_version_id: string | null
          id: string
          inspected_at: string
          inspected_by: string | null
          notes: string | null
          organization_id: string
          ppe_assignment_id: string
          status: string
        }
        Insert: {
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          inspected_at?: string
          inspected_by?: string | null
          notes?: string | null
          organization_id: string
          ppe_assignment_id: string
          status: string
        }
        Update: {
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          inspected_at?: string
          inspected_by?: string | null
          notes?: string | null
          organization_id?: string
          ppe_assignment_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_inspections_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_inspections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inspections_ppe_assignment_id_fkey"
            columns: ["ppe_assignment_id"]
            isOneToOne: false
            referencedRelation: "ppe_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_inventory: {
        Row: {
          id: string
          organization_id: string
          ppe_catalog_id: string
          quantity_on_hand: number
          reorder_point: number | null
          site_id: string | null
          size_label: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          ppe_catalog_id: string
          quantity_on_hand?: number
          reorder_point?: number | null
          site_id?: string | null
          size_label?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          ppe_catalog_id?: string
          quantity_on_hand?: number
          reorder_point?: number | null
          site_id?: string | null
          size_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ppe_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_inventory_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inventory_ppe_catalog_id_fkey"
            columns: ["ppe_catalog_id"]
            isOneToOne: false
            referencedRelation: "ppe_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inventory_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          delivery_id: string | null
          evidence_document_version_id: string | null
          id: string
          inventory_id: string
          movement_type: string
          note: string | null
          organization_id: string
          quantity_delta: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivery_id?: string | null
          evidence_document_version_id?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          note?: string | null
          organization_id: string
          quantity_delta: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivery_id?: string | null
          evidence_document_version_id?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          note?: string | null
          organization_id?: string
          quantity_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "ppe_inventory_movements_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "ppe_deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inventory_movements_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "ppe_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_inventory_movements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ppe_retirements: {
        Row: {
          created_at: string
          evidence_document_version_id: string | null
          id: string
          organization_id: string
          ppe_assignment_id: string
          reason: string
          retired_at: string
          retired_by: string | null
        }
        Insert: {
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          organization_id: string
          ppe_assignment_id: string
          reason: string
          retired_at?: string
          retired_by?: string | null
        }
        Update: {
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          organization_id?: string
          ppe_assignment_id?: string
          reason?: string
          retired_at?: string
          retired_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ppe_retirements_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_retirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "ppe_retirements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ppe_retirements_ppe_assignment_id_fkey"
            columns: ["ppe_assignment_id"]
            isOneToOne: true
            referencedRelation: "ppe_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      processes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "processes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_standards: {
        Row: {
          created_at: string
          id: string
          minimum_standard_id: string
          standard_profile_version_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          minimum_standard_id: string
          standard_profile_version_id: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          minimum_standard_id?: string
          standard_profile_version_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "profile_standards_minimum_standard_id_fkey"
            columns: ["minimum_standard_id"]
            isOneToOne: false
            referencedRelation: "minimum_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_standards_standard_profile_version_id_fkey"
            columns: ["standard_profile_version_id"]
            isOneToOne: false
            referencedRelation: "standard_profile_versions"
            referencedColumns: ["id"]
          },
        ]
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
      requirements: {
        Row: {
          code: string
          created_at: string
          expert_review_status: string
          id: string
          normative_source_version_id: string
          status: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          expert_review_status?: string
          id?: string
          normative_source_version_id: string
          status?: string
          summary: string
          title: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          expert_review_status?: string
          id?: string
          normative_source_version_id?: string
          status?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_normative_source_version_id_fkey"
            columns: ["normative_source_version_id"]
            isOneToOne: false
            referencedRelation: "normative_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_assessments: {
        Row: {
          acceptability: string | null
          assessed_at: string | null
          assessed_by: string | null
          consequence_level: number | null
          created_at: string
          deficiency_level: number | null
          exposure_level: number | null
          id: string
          input_data: Json
          methodology_snapshot: Json
          organization_id: string
          parent_risk_assessment_id: string | null
          probability_interpretation: string | null
          probability_level: number | null
          result_data: Json
          risk_identification_id: string | null
          risk_interpretation: string | null
          risk_level: number | null
          risk_methodology_version_id: string
          status: string
          updated_at: string
        }
        Insert: {
          acceptability?: string | null
          assessed_at?: string | null
          assessed_by?: string | null
          consequence_level?: number | null
          created_at?: string
          deficiency_level?: number | null
          exposure_level?: number | null
          id?: string
          input_data?: Json
          methodology_snapshot?: Json
          organization_id: string
          parent_risk_assessment_id?: string | null
          probability_interpretation?: string | null
          probability_level?: number | null
          result_data?: Json
          risk_identification_id?: string | null
          risk_interpretation?: string | null
          risk_level?: number | null
          risk_methodology_version_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          acceptability?: string | null
          assessed_at?: string | null
          assessed_by?: string | null
          consequence_level?: number | null
          created_at?: string
          deficiency_level?: number | null
          exposure_level?: number | null
          id?: string
          input_data?: Json
          methodology_snapshot?: Json
          organization_id?: string
          parent_risk_assessment_id?: string | null
          probability_interpretation?: string | null
          probability_level?: number | null
          result_data?: Json
          risk_identification_id?: string | null
          risk_interpretation?: string | null
          risk_level?: number | null
          risk_methodology_version_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "risk_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_parent_risk_assessment_id_fkey"
            columns: ["parent_risk_assessment_id"]
            isOneToOne: false
            referencedRelation: "risk_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_risk_identification_id_fkey"
            columns: ["risk_identification_id"]
            isOneToOne: false
            referencedRelation: "risk_identifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_assessments_risk_methodology_version_id_fkey"
            columns: ["risk_methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_control_alerts: {
        Row: {
          alert_type: string
          created_at: string
          detected_at: string
          id: string
          organization_id: string
          resolved_at: string | null
          risk_control_id: string
          updated_at: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          detected_at?: string
          id?: string
          organization_id: string
          resolved_at?: string | null
          risk_control_id: string
          updated_at?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          detected_at?: string
          id?: string
          organization_id?: string
          resolved_at?: string | null
          risk_control_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_control_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "risk_control_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_control_alerts_risk_control_id_fkey"
            columns: ["risk_control_id"]
            isOneToOne: false
            referencedRelation: "risk_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_control_verifications: {
        Row: {
          created_at: string
          effectiveness: string
          evidence_document_version_id: string | null
          id: string
          next_verification_at: string | null
          organization_id: string
          risk_control_id: string
          verification_note: string
          verified_at: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          effectiveness: string
          evidence_document_version_id?: string | null
          id?: string
          next_verification_at?: string | null
          organization_id: string
          risk_control_id: string
          verification_note: string
          verified_at?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          effectiveness?: string
          evidence_document_version_id?: string | null
          id?: string
          next_verification_at?: string | null
          organization_id?: string
          risk_control_id?: string
          verification_note?: string
          verified_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_control_verifications_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_control_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "risk_control_verifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_control_verifications_risk_control_id_fkey"
            columns: ["risk_control_id"]
            isOneToOne: false
            referencedRelation: "risk_controls"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_controls: {
        Row: {
          control_type: string
          created_at: string
          created_by: string | null
          description: string
          effectiveness: string | null
          evidence_document_version_id: string | null
          id: string
          improvement_action_id: string | null
          last_verified_at: string | null
          last_verified_by: string | null
          next_verification_at: string | null
          organization_id: string
          responsible_user_id: string | null
          risk_identification_id: string
          status: string
          target_date: string | null
          task_id: string | null
          updated_at: string
          verification_status: string
        }
        Insert: {
          control_type: string
          created_at?: string
          created_by?: string | null
          description: string
          effectiveness?: string | null
          evidence_document_version_id?: string | null
          id?: string
          improvement_action_id?: string | null
          last_verified_at?: string | null
          last_verified_by?: string | null
          next_verification_at?: string | null
          organization_id: string
          responsible_user_id?: string | null
          risk_identification_id: string
          status?: string
          target_date?: string | null
          task_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Update: {
          control_type?: string
          created_at?: string
          created_by?: string | null
          description?: string
          effectiveness?: string | null
          evidence_document_version_id?: string | null
          id?: string
          improvement_action_id?: string | null
          last_verified_at?: string | null
          last_verified_by?: string | null
          next_verification_at?: string | null
          organization_id?: string
          responsible_user_id?: string | null
          risk_identification_id?: string
          status?: string
          target_date?: string | null
          task_id?: string | null
          updated_at?: string
          verification_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_controls_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_controls_improvement_action_id_fkey"
            columns: ["improvement_action_id"]
            isOneToOne: false
            referencedRelation: "improvement_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_controls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "risk_controls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_controls_risk_identification_id_fkey"
            columns: ["risk_identification_id"]
            isOneToOne: false
            referencedRelation: "risk_identifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_controls_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_identifications: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          exposed_count: number | null
          hazard_id: string
          id: string
          legal_requirement: boolean
          organization_id: string
          possible_effects: string | null
          risk_task_id: string
          status: string
          updated_at: string
          worst_consequence: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          exposed_count?: number | null
          hazard_id: string
          id?: string
          legal_requirement?: boolean
          organization_id: string
          possible_effects?: string | null
          risk_task_id: string
          status?: string
          updated_at?: string
          worst_consequence?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          exposed_count?: number | null
          hazard_id?: string
          id?: string
          legal_requirement?: boolean
          organization_id?: string
          possible_effects?: string | null
          risk_task_id?: string
          status?: string
          updated_at?: string
          worst_consequence?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "risk_identifications_hazard_id_fkey"
            columns: ["hazard_id"]
            isOneToOne: false
            referencedRelation: "hazard_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_identifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "risk_identifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_identifications_risk_task_id_fkey"
            columns: ["risk_task_id"]
            isOneToOne: false
            referencedRelation: "risk_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodologies: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          normative_source_version_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          normative_source_version_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          normative_source_version_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodologies_normative_source_version_id_fkey"
            columns: ["normative_source_version_id"]
            isOneToOne: false
            referencedRelation: "normative_source_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodology_catalogs: {
        Row: {
          code: string
          entries: Json
          id: string
          label: string
          methodology_version_id: string
        }
        Insert: {
          code: string
          entries?: Json
          id?: string
          label: string
          methodology_version_id: string
        }
        Update: {
          code?: string
          entries?: Json
          id?: string
          label?: string
          methodology_version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodology_catalogs_methodology_version_id_fkey"
            columns: ["methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodology_formulas: {
        Row: {
          code: string
          expert_review_status: string
          expression: string
          id: string
          interpretation: Json
          methodology_version_id: string
          output_variable_code: string
          status: string
        }
        Insert: {
          code: string
          expert_review_status?: string
          expression: string
          id?: string
          interpretation?: Json
          methodology_version_id: string
          output_variable_code: string
          status?: string
        }
        Update: {
          code?: string
          expert_review_status?: string
          expression?: string
          id?: string
          interpretation?: Json
          methodology_version_id?: string
          output_variable_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodology_formulas_methodology_version_id_fkey"
            columns: ["methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodology_interpretation_rules: {
        Row: {
          condition: Json
          expert_review_status: string
          explanation: string
          id: string
          methodology_version_id: string
          outcome: Json
          rule_code: string
          status: string
        }
        Insert: {
          condition: Json
          expert_review_status?: string
          explanation: string
          id?: string
          methodology_version_id: string
          outcome: Json
          rule_code: string
          status?: string
        }
        Update: {
          condition?: Json
          expert_review_status?: string
          explanation?: string
          id?: string
          methodology_version_id?: string
          outcome?: Json
          rule_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodology_interpretation_rul_methodology_version_id_fkey"
            columns: ["methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodology_review_decisions: {
        Row: {
          decided_at: string
          decided_by: string
          decision: string
          id: string
          methodology_version_id: string
          note: string
        }
        Insert: {
          decided_at?: string
          decided_by: string
          decision: string
          id?: string
          methodology_version_id: string
          note: string
        }
        Update: {
          decided_at?: string
          decided_by?: string
          decision?: string
          id?: string
          methodology_version_id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodology_review_decisions_methodology_version_id_fkey"
            columns: ["methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodology_reviewers: {
        Row: {
          created_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_methodology_variables: {
        Row: {
          code: string
          data_type: string
          definition: Json
          display_order: number
          id: string
          label: string
          methodology_version_id: string
          required: boolean
        }
        Insert: {
          code: string
          data_type: string
          definition?: Json
          display_order?: number
          id?: string
          label: string
          methodology_version_id: string
          required?: boolean
        }
        Update: {
          code?: string
          data_type?: string
          definition?: Json
          display_order?: number
          id?: string
          label?: string
          methodology_version_id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodology_variables_methodology_version_id_fkey"
            columns: ["methodology_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_methodology_versions: {
        Row: {
          configuration: Json
          created_at: string
          effective_from: string | null
          effective_to: string | null
          expert_review_status: string
          id: string
          interpretive_note: string
          methodology_id: string
          status: string
          supersedes_version_id: string | null
          updated_at: string
          version_code: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          expert_review_status?: string
          id?: string
          interpretive_note: string
          methodology_id: string
          status?: string
          supersedes_version_id?: string | null
          updated_at?: string
          version_code: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          expert_review_status?: string
          id?: string
          interpretive_note?: string
          methodology_id?: string
          status?: string
          supersedes_version_id?: string | null
          updated_at?: string
          version_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_methodology_versions_methodology_id_fkey"
            columns: ["methodology_id"]
            isOneToOne: false
            referencedRelation: "risk_methodologies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_methodology_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "risk_methodology_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_tasks: {
        Row: {
          activity_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_routine: boolean
          name: string
          organization_id: string
          status: string
          updated_at: string
          zone_or_location: string
        }
        Insert: {
          activity_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_routine?: boolean
          name: string
          organization_id: string
          status?: string
          updated_at?: string
          zone_or_location: string
        }
        Update: {
          activity_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_routine?: boolean
          name?: string
          organization_id?: string
          status?: string
          updated_at?: string
          zone_or_location?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_tasks_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "risk_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      saas_support_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          organization_id: string
          reason: string
          reinova_admin_user_id: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id: string
          reason: string
          reinova_admin_user_id: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          organization_id?: string
          reason?: string
          reinova_admin_user_id?: string
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "saas_support_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "saas_support_sessions_organization_id_fkey"
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
      standard_profile_versions: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          expert_review_status: string
          id: string
          standard_profile_id: string
          status: string
          supersedes_version_id: string | null
          updated_at: string
          version_code: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          expert_review_status?: string
          id?: string
          standard_profile_id: string
          status?: string
          supersedes_version_id?: string | null
          updated_at?: string
          version_code: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          expert_review_status?: string
          id?: string
          standard_profile_id?: string
          status?: string
          supersedes_version_id?: string | null
          updated_at?: string
          version_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "standard_profile_versions_standard_profile_id_fkey"
            columns: ["standard_profile_id"]
            isOneToOne: false
            referencedRelation: "standard_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standard_profile_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "standard_profile_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      standard_profiles: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_comments: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          task_id: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "task_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string
          depends_on_task_id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          depends_on_task_id: string
          organization_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          depends_on_task_id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "task_dependencies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_evidences: {
        Row: {
          created_at: string
          created_by: string | null
          document_version_id: string
          id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_version_id: string
          id?: string
          organization_id: string
          task_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_version_id?: string
          id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_evidences_document_version_id_fkey"
            columns: ["document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_evidences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "task_evidences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_evidences_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_recurrence_rules: {
        Row: {
          created_at: string
          ends_at: string | null
          frequency: string
          id: string
          interval_count: number
          organization_id: string
          starts_at: string
          timezone: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          frequency: string
          id?: string
          interval_count?: number
          organization_id: string
          starts_at: string
          timezone?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          frequency?: string
          id?: string
          interval_count?: number
          organization_id?: string
          starts_at?: string
          timezone?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_recurrence_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "task_recurrence_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          annual_plan_id: string | null
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          improvement_action_id: string | null
          occurrence_at: string | null
          occurrence_key: string | null
          organization_id: string
          plan_activity_id: string | null
          priority: string
          recurrence_rule_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          annual_plan_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          improvement_action_id?: string | null
          occurrence_at?: string | null
          occurrence_key?: string | null
          organization_id: string
          plan_activity_id?: string | null
          priority?: string
          recurrence_rule_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          annual_plan_id?: string | null
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          improvement_action_id?: string | null
          occurrence_at?: string | null
          occurrence_key?: string | null
          organization_id?: string
          plan_activity_id?: string | null
          priority?: string
          recurrence_rule_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_annual_plan_id_fkey"
            columns: ["annual_plan_id"]
            isOneToOne: false
            referencedRelation: "annual_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_improvement_action_id_fkey"
            columns: ["improvement_action_id"]
            isOneToOne: false
            referencedRelation: "improvement_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_plan_activity_id_fkey"
            columns: ["plan_activity_id"]
            isOneToOne: false
            referencedRelation: "plan_activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_recurrence_rule_id_fkey"
            columns: ["recurrence_rule_id"]
            isOneToOne: false
            referencedRelation: "task_recurrence_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_attendances: {
        Row: {
          checked_at: string
          checked_by: string | null
          created_at: string
          evidence_document_version_id: string | null
          id: string
          organization_id: string
          status: string
          training_enrollment_id: string
        }
        Insert: {
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          organization_id: string
          status: string
          training_enrollment_id: string
        }
        Update: {
          checked_at?: string
          checked_by?: string | null
          created_at?: string
          evidence_document_version_id?: string | null
          id?: string
          organization_id?: string
          status?: string
          training_enrollment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_attendances_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_attendances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_attendances_training_enrollment_id_fkey"
            columns: ["training_enrollment_id"]
            isOneToOne: true
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_catalog: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          default_passing_percent: number
          description: string | null
          duration_minutes: number | null
          id: string
          organization_id: string
          status: string
          title: string
          updated_at: string
          validity_days: number | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          default_passing_percent?: number
          description?: string | null
          duration_minutes?: number | null
          id?: string
          organization_id: string
          status?: string
          title: string
          updated_at?: string
          validity_days?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          default_passing_percent?: number
          description?: string | null
          duration_minutes?: number | null
          id?: string
          organization_id?: string
          status?: string
          title?: string
          updated_at?: string
          validity_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "training_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_certificates: {
        Row: {
          certificate_code: string
          created_at: string
          evidence_document_version_id: string | null
          expires_at: string | null
          id: string
          issued_at: string
          issued_by: string | null
          organization_id: string
          training_enrollment_id: string
        }
        Insert: {
          certificate_code: string
          created_at?: string
          evidence_document_version_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          organization_id: string
          training_enrollment_id: string
        }
        Update: {
          certificate_code?: string
          created_at?: string
          evidence_document_version_id?: string | null
          expires_at?: string | null
          id?: string
          issued_at?: string
          issued_by?: string | null
          organization_id?: string
          training_enrollment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_certificates_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_certificates_training_enrollment_id_fkey"
            columns: ["training_enrollment_id"]
            isOneToOne: true
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_enrollments: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          invited_at: string
          organization_id: string
          organization_member_id: string
          status: string
          training_session_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          invited_at?: string
          organization_id: string
          organization_member_id: string
          status?: string
          training_session_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          invited_at?: string
          organization_id?: string
          organization_member_id?: string
          status?: string
          training_session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_organization_member_id_fkey"
            columns: ["organization_member_id"]
            isOneToOne: false
            referencedRelation: "organization_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_enrollments_training_session_id_fkey"
            columns: ["training_session_id"]
            isOneToOne: false
            referencedRelation: "training_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_evaluation_options: {
        Row: {
          display_order: number
          id: string
          is_correct: boolean
          label: string
          organization_id: string
          question_id: string
        }
        Insert: {
          display_order: number
          id?: string
          is_correct?: boolean
          label: string
          organization_id: string
          question_id: string
        }
        Update: {
          display_order?: number
          id?: string
          is_correct?: boolean
          label?: string
          organization_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluation_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_evaluation_options_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluation_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "training_evaluation_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      training_evaluation_questions: {
        Row: {
          created_at: string
          display_order: number
          id: string
          organization_id: string
          prompt: string
          template_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          organization_id: string
          prompt: string
          template_id: string
          weight: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          organization_id?: string
          prompt?: string
          template_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluation_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_evaluation_questions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluation_questions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_evaluation_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      training_evaluation_responses: {
        Row: {
          id: string
          option_id: string
          organization_id: string
          question_id: string
          selected_at: string
          training_evaluation_id: string
        }
        Insert: {
          id?: string
          option_id: string
          organization_id: string
          question_id: string
          selected_at?: string
          training_evaluation_id: string
        }
        Update: {
          id?: string
          option_id?: string
          organization_id?: string
          question_id?: string
          selected_at?: string
          training_evaluation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluation_responses_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "training_evaluation_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluation_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_evaluation_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluation_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "training_evaluation_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluation_responses_training_evaluation_id_fkey"
            columns: ["training_evaluation_id"]
            isOneToOne: false
            referencedRelation: "training_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      training_evaluation_templates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          passing_percent: number
          status: string
          title: string
          training_catalog_id: string
          updated_at: string
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          passing_percent: number
          status?: string
          title: string
          training_catalog_id: string
          updated_at?: string
          version_number: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          passing_percent?: number
          status?: string
          title?: string
          training_catalog_id?: string
          updated_at?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_evaluation_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluation_templates_training_catalog_id_fkey"
            columns: ["training_catalog_id"]
            isOneToOne: false
            referencedRelation: "training_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      training_evaluations: {
        Row: {
          created_at: string
          evaluated_at: string
          evaluated_by: string | null
          evidence_document_version_id: string | null
          id: string
          maximum_score: number
          organization_id: string
          passed: boolean
          score: number
          scoring_snapshot: Json
          status: string
          template_id: string | null
          training_enrollment_id: string
        }
        Insert: {
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string | null
          evidence_document_version_id?: string | null
          id?: string
          maximum_score: number
          organization_id: string
          passed: boolean
          score: number
          scoring_snapshot?: Json
          status?: string
          template_id?: string | null
          training_enrollment_id: string
        }
        Update: {
          created_at?: string
          evaluated_at?: string
          evaluated_by?: string | null
          evidence_document_version_id?: string | null
          id?: string
          maximum_score?: number
          organization_id?: string
          passed?: boolean
          score?: number
          scoring_snapshot?: Json
          status?: string
          template_id?: string | null
          training_enrollment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_evaluations_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "training_evaluation_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_evaluations_training_enrollment_id_fkey"
            columns: ["training_enrollment_id"]
            isOneToOne: true
            referencedRelation: "training_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_plans: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          minimum_standard_id: string | null
          organization_id: string
          owner_user_id: string | null
          requirement_id: string | null
          status: string
          target_group_label: string | null
          title: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          minimum_standard_id?: string | null
          organization_id: string
          owner_user_id?: string | null
          requirement_id?: string | null
          status?: string
          target_group_label?: string | null
          title: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          minimum_standard_id?: string | null
          organization_id?: string
          owner_user_id?: string | null
          requirement_id?: string | null
          status?: string
          target_group_label?: string | null
          title?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_minimum_standard_id_fkey"
            columns: ["minimum_standard_id"]
            isOneToOne: false
            referencedRelation: "minimum_standards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_plans_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      training_sessions: {
        Row: {
          capacity: number | null
          created_at: string
          created_by: string | null
          ends_at: string
          evidence_document_version_id: string | null
          id: string
          instructor_user_id: string | null
          location: string | null
          organization_id: string
          starts_at: string
          status: string
          title: string
          training_catalog_id: string | null
          training_plan_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          ends_at: string
          evidence_document_version_id?: string | null
          id?: string
          instructor_user_id?: string | null
          location?: string | null
          organization_id: string
          starts_at: string
          status?: string
          title: string
          training_catalog_id?: string | null
          training_plan_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          created_by?: string | null
          ends_at?: string
          evidence_document_version_id?: string | null
          id?: string
          instructor_user_id?: string | null
          location?: string | null
          organization_id?: string
          starts_at?: string
          status?: string
          title?: string
          training_catalog_id?: string | null
          training_plan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_sessions_evidence_document_version_id_fkey"
            columns: ["evidence_document_version_id"]
            isOneToOne: false
            referencedRelation: "document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_training_catalog_id_fkey"
            columns: ["training_catalog_id"]
            isOneToOne: false
            referencedRelation: "training_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_sessions_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plan_indicators"
            referencedColumns: ["training_plan_id"]
          },
          {
            foreignKeyName: "training_sessions_training_plan_id_fkey"
            columns: ["training_plan_id"]
            isOneToOne: false
            referencedRelation: "training_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      work_restrictions: {
        Row: {
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          occupational_fitness_concept_id: string
          organization_id: string
          restriction_summary: string
          status: string
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          occupational_fitness_concept_id: string
          organization_id: string
          restriction_summary: string
          status?: string
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          occupational_fitness_concept_id?: string
          organization_id?: string
          restriction_summary?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_restrictions_occupational_fitness_concept_id_fkey"
            columns: ["occupational_fitness_concept_id"]
            isOneToOne: false
            referencedRelation: "occupational_fitness_concepts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_restrictions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "work_restrictions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      emergency_resilient_directory: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          display_name: string | null
          id: string | null
          operational_role: string | null
          organization_id: string | null
          site_id: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          display_name?: string | null
          id?: string | null
          operational_role?: string | null
          organization_id?: string | null
          site_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          display_name?: string | null
          id?: string | null
          operational_role?: string | null
          organization_id?: string | null
          site_id?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_directory_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "emergency_directory_entries_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_directory_entries_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      management_dashboard_metrics: {
        Row: {
          active_documents: number | null
          open_actions: number | null
          open_tasks: number | null
          organization_id: string | null
        }
        Insert: {
          active_documents?: never
          open_actions?: never
          open_tasks?: never
          organization_id?: string | null
        }
        Update: {
          active_documents?: never
          open_actions?: never
          open_tasks?: never
          organization_id?: string | null
        }
        Relationships: []
      }
      training_plan_indicators: {
        Row: {
          attended_count: number | null
          coverage_percent: number | null
          effectiveness_percent: number | null
          enrolled_count: number | null
          evaluated_count: number | null
          organization_id: string | null
          passed_count: number | null
          training_plan_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "management_dashboard_metrics"
            referencedColumns: ["organization_id"]
          },
          {
            foreignKeyName: "training_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      accept_my_invitations: { Args: never; Returns: number }
      accept_ppe_delivery: {
        Args: { p_delivery_id: string }
        Returns: undefined
      }
      add_invited_member: {
        Args: {
          p_organization_id: string
          p_role_id: string
          p_site_id?: string
          p_user_id: string
        }
        Returns: string
      }
      approve_classification_change: {
        Args: { p_proposal_id: string }
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
      complete_assessment: {
        Args: { p_assessment_id: string }
        Returns: number
      }
      complete_organization_onboarding: {
        Args: { p_idempotency_key: string; p_organization_id: string }
        Returns: Json
      }
      create_normative_review_artifact: {
        Args: {
          p_artifact_key: string
          p_artifact_type: string
          p_content: Json
          p_source_path: string
          p_title: string
        }
        Returns: string
      }
      create_normative_review_proposal: {
        Args: { p_artifact_id: string; p_content: Json; p_rationale: string }
        Returns: string
      }
      create_organization_standard_snapshot: {
        Args: {
          p_classification_id?: string
          p_organization_id: string
          p_reason?: string
          p_snapshot_date?: string
          p_snapshot_type: string
        }
        Returns: string
      }
      create_ppe_inventory: {
        Args: {
          p_organization_id: string
          p_ppe_catalog_id: string
          p_reorder_point?: number
          p_site_id: string
          p_size_label?: string
        }
        Returns: string
      }
      decide_normative_review: {
        Args: {
          p_artifact_id: string
          p_decision: string
          p_note: string
          p_proposal_id?: string
        }
        Returns: string
      }
      deliver_ppe: {
        Args: {
          p_assignment_id: string
          p_delivery_kind?: string
          p_evidence_document_version_id?: string
          p_inventory_id: string
          p_quantity: number
        }
        Returns: string
      }
      evaluate_organization_applicability: {
        Args: { p_as_of?: string; p_organization_id: string }
        Returns: number
      }
      get_request_auth_context: {
        Args: never
        Returns: {
          role: string
          user_id: string
        }[]
      }
      grade_training_evaluation: {
        Args: {
          p_answers: Json
          p_enrollment_id: string
          p_template_id: string
        }
        Returns: string
      }
      inspect_ppe: {
        Args: {
          p_assignment_id: string
          p_evidence_document_version_id?: string
          p_notes?: string
          p_status: string
        }
        Returns: string
      }
      list_automation_event_candidates: {
        Args: { p_limit?: number; p_organization_id: string }
        Returns: {
          event_type: string
          id: string
          occurred_at: string
        }[]
      }
      manage_normative_reviewer: {
        Args: {
          p_email: string
          p_reason: string
          p_role: string
          p_status: string
        }
        Returns: string
      }
      record_ppe_inventory_movement: {
        Args: {
          p_evidence_document_version_id?: string
          p_inventory_id: string
          p_movement_type: string
          p_note?: string
          p_quantity: number
        }
        Returns: string
      }
      reject_classification_change: {
        Args: { p_note: string; p_proposal_id: string }
        Returns: string
      }
      request_automation_dry_run: {
        Args: { p_event_id: string; p_rule_version_id: string }
        Returns: string
      }
      request_indicator_calculation: {
        Args: {
          p_indicator_version_id: string
          p_period_end: string
          p_period_start: string
        }
        Returns: string
      }
      retire_ppe: {
        Args: {
          p_assignment_id: string
          p_evidence_document_version_id?: string
          p_reason: string
        }
        Returns: string
      }
      retry_automation_execution: {
        Args: { p_execution_id: string }
        Returns: undefined
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
