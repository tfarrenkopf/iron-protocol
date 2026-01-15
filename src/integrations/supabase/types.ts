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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
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
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          max_combo: number
          total_reps: number
          total_score: number
          total_sets: number
          total_weight: number
          total_xp: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          max_combo?: number
          total_reps?: number
          total_score?: number
          total_sets?: number
          total_weight?: number
          total_xp?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          max_combo?: number
          total_reps?: number
          total_score?: number
          total_sets?: number
          total_weight?: number
          total_xp?: number
          updated_at?: string
        }
        Relationships: []
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
    }
    Functions: {
      calculate_mission_difficulty: {
        Args: {
          p_estimated_minutes: number
          p_exercise_count: number
          p_total_sets: number
        }
        Returns: number
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
