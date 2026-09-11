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
      achievements: {
        Row: {
          category: string
          code_name: string
          created_at: string
          description: string | null
          hint: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_hidden: boolean
          name: string
          rarity: string
          sort_order: number
          trigger_type: string
          trigger_value: number
          xp_reward: number
        }
        Insert: {
          category: string
          code_name: string
          created_at?: string
          description?: string | null
          hint?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_hidden?: boolean
          name: string
          rarity?: string
          sort_order?: number
          trigger_type: string
          trigger_value?: number
          xp_reward?: number
        }
        Update: {
          category?: string
          code_name?: string
          created_at?: string
          description?: string | null
          hint?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_hidden?: boolean
          name?: string
          rarity?: string
          sort_order?: number
          trigger_type?: string
          trigger_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      boss_templates: {
        Row: {
          code_name: string
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean
          lore: string
          name: string
          sort_order: number
          weakness_multiplier: number
          weaknesses: string[]
        }
        Insert: {
          code_name: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          lore: string
          name: string
          sort_order?: number
          weakness_multiplier?: number
          weaknesses?: string[]
        }
        Update: {
          code_name?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          lore?: string
          name?: string
          sort_order?: number
          weakness_multiplier?: number
          weaknesses?: string[]
        }
        Relationships: []
      }
      campaign_completions: {
        Row: {
          campaign_id: string
          completed_at: string
          completion_time_seconds: number
          created_at: string
          id: string
          is_personal_record: boolean
          missions_completed: number
          total_score: number
          total_weight: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string
          completion_time_seconds: number
          created_at?: string
          id?: string
          is_personal_record?: boolean
          missions_completed: number
          total_score?: number
          total_weight?: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string
          completion_time_seconds?: number
          created_at?: string
          id?: string
          is_personal_record?: boolean
          missions_completed?: number
          total_score?: number
          total_weight?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_completions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_missions: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          mission_id: string
          order_index: number
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          mission_id: string
          order_index?: number
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          mission_id?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "collection_missions_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          code_name: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          popularity_score: number
          updated_at: string
          visibility: string
        }
        Insert: {
          code_name: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          popularity_score?: number
          updated_at?: string
          visibility?: string
        }
        Update: {
          code_name?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          popularity_score?: number
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetics: {
        Row: {
          code_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          rarity: string
          sort_order: number
          type: string
          unlock_achievement_id: string | null
          unlock_milestone_id: string | null
          value: string
        }
        Insert: {
          code_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rarity?: string
          sort_order?: number
          type: string
          unlock_achievement_id?: string | null
          unlock_milestone_id?: string | null
          value: string
        }
        Update: {
          code_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rarity?: string
          sort_order?: number
          type?: string
          unlock_achievement_id?: string | null
          unlock_milestone_id?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetics_unlock_achievement_id_fkey"
            columns: ["unlock_achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cosmetics_unlock_milestone_id_fkey"
            columns: ["unlock_milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          equipment: Database["public"]["Enums"]["equipment_type"][]
          focus_areas: string[] | null
          id: string
          instructions_execution: string | null
          instructions_setup: string | null
          instructions_tips: string | null
          is_public: boolean
          is_public_mission_allowed: boolean
          name: string
          primary_muscle_group: string
          secondary_muscle_groups: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: Database["public"]["Enums"]["equipment_type"][]
          focus_areas?: string[] | null
          id?: string
          instructions_execution?: string | null
          instructions_setup?: string | null
          instructions_tips?: string | null
          is_public?: boolean
          is_public_mission_allowed?: boolean
          name: string
          primary_muscle_group: string
          secondary_muscle_groups?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          equipment?: Database["public"]["Enums"]["equipment_type"][]
          focus_areas?: string[] | null
          id?: string
          instructions_execution?: string | null
          instructions_setup?: string | null
          instructions_tips?: string | null
          is_public?: boolean
          is_public_mission_allowed?: boolean
          name?: string
          primary_muscle_group?: string
          secondary_muscle_groups?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          contact_email: string | null
          created_at: string
          id: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          contact_email?: string | null
          created_at?: string
          id?: string
          message: string
          status?: string
          user_id: string
        }
        Update: {
          contact_email?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hiit_configs: {
        Row: {
          code_name: string
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          name: string
          rest_duration_sec: number
          rounds: number
          work_duration_sec: number
        }
        Insert: {
          code_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name: string
          rest_duration_sec?: number
          rounds?: number
          work_duration_sec?: number
        }
        Update: {
          code_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          name?: string
          rest_duration_sec?: number
          rounds?: number
          work_duration_sec?: number
        }
        Relationships: [
          {
            foreignKeyName: "hiit_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          category: string
          code_name: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          target_value: number
          tier: number
        }
        Insert: {
          category: string
          code_name: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          target_value: number
          tier?: number
        }
        Update: {
          category?: string
          code_name?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          target_value?: number
          tier?: number
        }
        Relationships: []
      }
      mission_assignments: {
        Row: {
          assigned_at: string
          assignee_id: string
          assignee_type: string
          completed_at: string | null
          completed_session_id: string | null
          due_at: string | null
          handler_id: string
          id: string
          mission_snapshot: Json
          started_at: string | null
          status: string
        }
        Insert: {
          assigned_at?: string
          assignee_id: string
          assignee_type: string
          completed_at?: string | null
          completed_session_id?: string | null
          due_at?: string | null
          handler_id: string
          id?: string
          mission_snapshot: Json
          started_at?: string | null
          status?: string
        }
        Update: {
          assigned_at?: string
          assignee_id?: string
          assignee_type?: string
          completed_at?: string | null
          completed_session_id?: string | null
          due_at?: string | null
          handler_id?: string
          id?: string
          mission_snapshot?: Json
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_assignments_completed_session_id_fkey"
            columns: ["completed_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_assignments_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          mission_id: string
          order_index: number
          rest_between_sets_sec: number
          target_reps: number
          target_sets: number
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          mission_id: string
          order_index?: number
          rest_between_sets_sec?: number
          target_reps?: number
          target_sets?: number
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          mission_id?: string
          order_index?: number
          rest_between_sets_sec?: number
          target_reps?: number
          target_sets?: number
        }
        Relationships: [
          {
            foreignKeyName: "mission_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mission_exercises_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          code_name: string
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: number
          estimated_minutes: number
          focus_areas: string[] | null
          id: string
          intro_lore: string | null
          is_public: boolean
          name: string
          outro_lore: string | null
          popularity_score: number
          updated_at: string
        }
        Insert: {
          code_name: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          estimated_minutes?: number
          focus_areas?: string[] | null
          id?: string
          intro_lore?: string | null
          is_public?: boolean
          name: string
          outro_lore?: string | null
          popularity_score?: number
          updated_at?: string
        }
        Update: {
          code_name?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: number
          estimated_minutes?: number
          focus_areas?: string[] | null
          id?: string
          intro_lore?: string | null
          is_public?: boolean
          name?: string
          outro_lore?: string | null
          popularity_score?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "missions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          context: Json | null
          created_at: string
          deep_link: string
          dismissed_at: string | null
          id: string
          priority: string
          read_at: string | null
          recipient_user_id: string
          status: string
          title: string
          type: string
        }
        Insert: {
          body: string
          context?: Json | null
          created_at?: string
          deep_link: string
          dismissed_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          recipient_user_id: string
          status?: string
          title: string
          type: string
        }
        Update: {
          body?: string
          context?: Json | null
          created_at?: string
          deep_link?: string
          dismissed_at?: string | null
          id?: string
          priority?: string
          read_at?: string | null
          recipient_user_id?: string
          status?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          achieved_at: string
          created_at: string
          exercise_id: string
          id: string
          record_type: string
          session_id: string | null
          unit: string
          user_id: string
          value: number
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          exercise_id: string
          id?: string
          record_type: string
          session_id?: string | null
          unit?: string
          user_id: string
          value: number
        }
        Update: {
          achieved_at?: string
          created_at?: string
          exercise_id?: string
          id?: string
          record_type?: string
          session_id?: string | null
          unit?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_campaign_id: string | null
          created_at: string
          display_name: string | null
          equipped_icon_id: string | null
          equipped_title_id: string | null
          id: string
          max_combo: number
          rival_code: string | null
          total_reps: number
          total_score: number
          total_sets: number
          total_weight: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          active_campaign_id?: string | null
          created_at?: string
          display_name?: string | null
          equipped_icon_id?: string | null
          equipped_title_id?: string | null
          id: string
          max_combo?: number
          rival_code?: string | null
          total_reps?: number
          total_score?: number
          total_sets?: number
          total_weight?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          active_campaign_id?: string | null
          created_at?: string
          display_name?: string | null
          equipped_icon_id?: string | null
          equipped_title_id?: string | null
          id?: string
          max_combo?: number
          rival_code?: string | null
          total_reps?: number
          total_score?: number
          total_sets?: number
          total_weight?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_campaign_id_fkey"
            columns: ["active_campaign_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_icon_id_fkey"
            columns: ["equipped_icon_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_equipped_title_id_fkey"
            columns: ["equipped_title_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
        ]
      }
      rivalries: {
        Row: {
          created_at: string
          id: string
          rival_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rival_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rival_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rivalries_rival_id_fkey"
            columns: ["rival_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rivalries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      squad_members: {
        Row: {
          id: string
          joined_at: string
          share_stats: boolean
          squad_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          share_stats?: boolean
          squad_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          share_stats?: boolean
          squad_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "squad_members_squad_id_fkey"
            columns: ["squad_id"]
            isOneToOne: false
            referencedRelation: "squads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "squad_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      squads: {
        Row: {
          code_name: string
          created_at: string
          description: string | null
          handler_id: string
          id: string
          invite_code: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          code_name: string
          created_at?: string
          description?: string | null
          handler_id: string
          id?: string
          invite_code?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          code_name?: string
          created_at?: string
          description?: string | null
          handler_id?: string
          id?: string
          invite_code?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "squads_handler_id_fkey"
            columns: ["handler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          notified: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          notified?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_campaign_progress: {
        Row: {
          best_completion_time_seconds: number | null
          campaign_id: string
          completed_at: string | null
          created_at: string
          current_run_started_at: string
          id: string
          missions_completed_count: number
          total_completions: number
          total_missions_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          best_completion_time_seconds?: number | null
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          current_run_started_at?: string
          id?: string
          missions_completed_count?: number
          total_completions?: number
          total_missions_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          best_completion_time_seconds?: number | null
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          current_run_started_at?: string
          id?: string
          missions_completed_count?: number
          total_completions?: number
          total_missions_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_campaign_progress_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_campaign_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cosmetics: {
        Row: {
          cosmetic_id: string
          id: string
          is_equipped: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          cosmetic_id: string
          id?: string
          is_equipped?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          cosmetic_id?: string
          id?: string
          is_equipped?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cosmetics_cosmetic_id_fkey"
            columns: ["cosmetic_id"]
            isOneToOne: false
            referencedRelation: "cosmetics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cosmetics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          completed_at: string | null
          created_at: string
          current_value: number
          id: string
          milestone_id: string
          notified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          milestone_id: string
          notified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_value?: number
          id?: string
          milestone_id?: string
          notified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          created_at: string
          id: string
          in_app_enabled: boolean
          push_enabled: boolean
          sms_enabled: boolean
          type_preferences: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          type_preferences?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          in_app_enabled?: boolean
          push_enabled?: boolean
          sms_enabled?: boolean
          type_preferences?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_time_tracking: {
        Row: {
          created_at: string
          duration_seconds: number | null
          id: string
          session_end: string | null
          session_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          session_end?: string | null
          session_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          id?: string
          session_end?: string | null
          session_start?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_weight_history: {
        Row: {
          exercise_id: string
          id: string
          last_weight: number
          max_weight: number
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          exercise_id: string
          id?: string
          last_weight?: number
          max_weight?: number
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          exercise_id?: string
          id?: string
          last_weight?: number
          max_weight?: number
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_weight_history_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_weight_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      war_report_campaign_snapshots: {
        Row: {
          average_completion_time_seconds: number | null
          campaign_id: string
          created_at: string
          fastest_completion_seconds: number | null
          id: string
          replay_rate: number | null
          total_completions: number | null
          total_score: number | null
          total_weight_lifted: number | null
          unique_players_count: number | null
          week_start_date: string
        }
        Insert: {
          average_completion_time_seconds?: number | null
          campaign_id: string
          created_at?: string
          fastest_completion_seconds?: number | null
          id?: string
          replay_rate?: number | null
          total_completions?: number | null
          total_score?: number | null
          total_weight_lifted?: number | null
          unique_players_count?: number | null
          week_start_date: string
        }
        Update: {
          average_completion_time_seconds?: number | null
          campaign_id?: string
          created_at?: string
          fastest_completion_seconds?: number | null
          id?: string
          replay_rate?: number | null
          total_completions?: number | null
          total_score?: number | null
          total_weight_lifted?: number | null
          unique_players_count?: number | null
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "war_report_campaign_snapshots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_boss_damage: {
        Row: {
          base_damage: number
          bonus_damage: number
          boss_id: string
          created_at: string
          id: string
          session_id: string | null
          total_damage: number
          user_id: string
          weakness_hits: string[] | null
        }
        Insert: {
          base_damage?: number
          bonus_damage?: number
          boss_id: string
          created_at?: string
          id?: string
          session_id?: string | null
          total_damage?: number
          user_id: string
          weakness_hits?: string[] | null
        }
        Update: {
          base_damage?: number
          bonus_damage?: number
          boss_id?: string
          created_at?: string
          id?: string
          session_id?: string | null
          total_damage?: number
          user_id?: string
          weakness_hits?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_boss_damage_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "weekly_bosses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_boss_damage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_boss_damage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_bosses: {
        Row: {
          code_name: string
          created_at: string
          current_hp: number
          defeated_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_defeated: boolean
          lore: string
          max_hp: number
          name: string
          template_id: string | null
          weakness_multiplier: number
          weaknesses: string[]
          week_end: string
          week_start: string
        }
        Insert: {
          code_name: string
          created_at?: string
          current_hp?: number
          defeated_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_defeated?: boolean
          lore: string
          max_hp?: number
          name: string
          template_id?: string | null
          weakness_multiplier?: number
          weaknesses?: string[]
          week_end: string
          week_start: string
        }
        Update: {
          code_name?: string
          created_at?: string
          current_hp?: number
          defeated_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_defeated?: boolean
          lore?: string
          max_hp?: number
          name?: string
          template_id?: string | null
          weakness_multiplier?: number
          weaknesses?: string[]
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_bosses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "boss_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          completed_at: string | null
          damage_dealt: number
          id: string
          max_combo: number
          mission_id: string | null
          mission_snapshot: Json | null
          score_earned: number
          sets_completed: number
          started_at: string
          status: string
          total_reps: number
          total_weight: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string | null
          damage_dealt?: number
          id?: string
          max_combo?: number
          mission_id?: string | null
          mission_snapshot?: Json | null
          score_earned?: number
          sets_completed?: number
          started_at?: string
          status?: string
          total_reps?: number
          total_weight?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string | null
          damage_dealt?: number
          id?: string
          max_combo?: number
          mission_id?: string | null
          mission_snapshot?: Json | null
          score_earned?: number
          sets_completed?: number
          started_at?: string
          status?: string
          total_reps?: number
          total_weight?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          actual_reps: number
          completed_at: string
          exercise_id: string
          id: string
          score_earned: number
          session_id: string
          set_number: number
          target_reps: number | null
          unit: string
          weight: number
        }
        Insert: {
          actual_reps: number
          completed_at?: string
          exercise_id: string
          id?: string
          score_earned?: number
          session_id: string
          set_number: number
          target_reps?: number | null
          unit?: string
          weight: number
        }
        Update: {
          actual_reps?: number
          completed_at?: string
          exercise_id?: string
          id?: string
          score_earned?: number
          session_id?: string
          set_number?: number
          target_reps?: number | null
          unit?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      global_leaderboard: {
        Row: {
          display_name: string | null
          max_combo: number | null
          rank: number | null
          total_score: number | null
          total_sets: number | null
          total_xp: number | null
        }
        Relationships: []
      }
      mission_leaderboard: {
        Row: {
          completed_at: string | null
          display_name: string | null
          max_combo: number | null
          mission_id: string | null
          rank: number | null
          score_earned: number | null
          total_weight: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rival_weekly_stats: {
        Row: {
          display_name: string | null
          rival_code: string | null
          user_id: string | null
          weekly_max_combo: number | null
          weekly_score: number | null
          weekly_sessions: number | null
          weekly_sets: number | null
          weekly_weight: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      war_report_current_week: {
        Row: {
          average_completion_time_seconds: number | null
          campaign_code: string | null
          campaign_id: string | null
          campaign_name: string | null
          created_at: string | null
          fastest_completion_seconds: number | null
          id: string | null
          replay_rate: number | null
          total_completions: number | null
          total_score: number | null
          total_weight_lifted: number | null
          unique_players_count: number | null
          week_start_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "war_report_campaign_snapshots_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_boss_leaderboard: {
        Row: {
          base_damage: number | null
          bonus_damage: number | null
          boss_id: string | null
          contribution_count: number | null
          display_name: string | null
          rank: number | null
          total_damage: number | null
          user_id: string | null
          weakness_hits_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_boss_damage_boss_id_fkey"
            columns: ["boss_id"]
            isOneToOne: false
            referencedRelation: "weekly_bosses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_boss_damage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_boss_damage: {
        Args: {
          p_base_damage: number
          p_bonus_damage: number
          p_session_id: string
          p_user_id: string
          p_weakness_hits: string[]
        }
        Returns: {
          code_name: string
          created_at: string
          current_hp: number
          defeated_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_defeated: boolean
          lore: string
          max_hp: number
          name: string
          template_id: string | null
          weakness_multiplier: number
          weaknesses: string[]
          week_end: string
          week_start: string
        }
        SetofOptions: {
          from: "*"
          to: "weekly_bosses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      calculate_mission_difficulty: {
        Args: {
          p_estimated_minutes: number
          p_exercise_count: number
          p_total_sets: number
        }
        Returns: number
      }
      emit_notification: {
        Args: {
          p_body: string
          p_context?: Json
          p_deep_link: string
          p_priority?: string
          p_recipient_user_id: string
          p_title: string
          p_type: string
        }
        Returns: string
      }
      generate_war_report_snapshot: { Args: never; Returns: undefined }
      get_active_weekly_boss: {
        Args: never
        Returns: {
          code_name: string
          current_hp: number
          defeated_at: string
          id: string
          image_url: string
          is_defeated: boolean
          lore: string
          max_hp: number
          name: string
          total_damage_dealt: number
          unique_contributors: number
          weakness_multiplier: number
          weaknesses: string[]
          week_end: string
          week_start: string
        }[]
      }
      get_boss_defeat_stats: {
        Args: { p_boss_id: string }
        Returns: {
          boss_name: string
          defeated_at: string
          max_hp: number
          time_to_defeat_seconds: number
          total_contributions: number
          total_damage_dealt: number
          total_weakness_hits: number
          unique_contributors: number
          week_start: string
        }[]
      }
      get_completed_mission_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_mission_stats: {
        Args: { p_mission_id: string }
        Returns: {
          avg_score: number
          completion_count: number
          total_weight_lifted: number
          unique_players: number
        }[]
      }
      get_user_assignments: {
        Args: { _user_id: string }
        Returns: {
          assigned_at: string
          assignee_type: string
          due_at: string
          handler_id: string
          handler_name: string
          id: string
          mission_snapshot: Json
          squad_name: string
          status: string
        }[]
      }
      get_user_boss_damage: {
        Args: { p_user_id: string }
        Returns: {
          contribution_count: number
          total_damage: number
          weakness_hits_count: number
        }[]
      }
      get_user_mission_rank: {
        Args: { p_mission_id: string; p_user_id: string }
        Returns: {
          total_players: number
          user_best_score: number
          user_rank: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_squad_handler: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
      is_squad_member: {
        Args: { _squad_id: string; _user_id: string }
        Returns: boolean
      }
      rotate_weekly_boss: {
        Args: never
        Returns: {
          code_name: string
          created_at: string
          current_hp: number
          defeated_at: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_defeated: boolean
          lore: string
          max_hp: number
          name: string
          template_id: string | null
          weakness_multiplier: number
          weaknesses: string[]
          week_end: string
          week_start: string
        }
        SetofOptions: {
          from: "*"
          to: "weekly_bosses"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      app_role: "user" | "handler"
      equipment_type:
        | "BENCH"
        | "DUMBBELLS"
        | "BARBELL"
        | "CABLE_MACHINE"
        | "LAT_PULLDOWN"
        | "LEG_PRESS"
        | "LEG_CURL"
        | "LEG_EXTENSION"
        | "SMITH_MACHINE"
        | "PEC_DECK"
        | "CHEST_PRESS"
        | "SHOULDER_PRESS_MACHINE"
        | "SEATED_ROW"
        | "PULL_UP_BAR"
        | "DIP_STATION"
        | "PREACHER_BENCH"
        | "HACK_SQUAT"
        | "CALF_RAISE"
        | "AB_MACHINE"
        | "BODYWEIGHT"
        | "KETTLEBELL"
        | "EZ_BAR"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["user", "handler"],
      equipment_type: [
        "BENCH",
        "DUMBBELLS",
        "BARBELL",
        "CABLE_MACHINE",
        "LAT_PULLDOWN",
        "LEG_PRESS",
        "LEG_CURL",
        "LEG_EXTENSION",
        "SMITH_MACHINE",
        "PEC_DECK",
        "CHEST_PRESS",
        "SHOULDER_PRESS_MACHINE",
        "SEATED_ROW",
        "PULL_UP_BAR",
        "DIP_STATION",
        "PREACHER_BENCH",
        "HACK_SQUAT",
        "CALF_RAISE",
        "AB_MACHINE",
        "BODYWEIGHT",
        "KETTLEBELL",
        "EZ_BAR",
      ],
    },
  },
} as const
