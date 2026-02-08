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
      anomalies: {
        Row: {
          anomaly_type: string
          description: string | null
          detected_at: string
          id: string
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          severity: string
          status: string
        }
        Insert: {
          anomaly_type: string
          description?: string | null
          detected_at?: string
          id?: string
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          severity: string
          status?: string
        }
        Update: {
          anomaly_type?: string
          description?: string | null
          detected_at?: string
          id?: string
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          severity?: string
          status?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          user_id: string
          username: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          user_id: string
          username?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          anomaly_id: string | null
          content: string
          created_at: string | null
          id: string
          report_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          anomaly_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          report_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          anomaly_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          report_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomalies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "user_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          color: string
          created_at: string
          description: string | null
          duration: string
          icon: string
          id: string
          is_active: boolean
          lessons: number
          level: string
          order_index: number
          title: string
          topics: string[] | null
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          duration?: string
          icon?: string
          id?: string
          is_active?: boolean
          lessons?: number
          level?: string
          order_index?: number
          title: string
          topics?: string[] | null
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          duration?: string
          icon?: string
          id?: string
          is_active?: boolean
          lessons?: number
          level?: string
          order_index?: number
          title?: string
          topics?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      environmental_data: {
        Row: {
          created_at: string
          data_source: string
          humidity: number | null
          id: string
          latitude: number
          longitude: number
          pressure: number | null
          temperature: number | null
          weather_condition: string | null
          wind_speed: number | null
        }
        Insert: {
          created_at?: string
          data_source: string
          humidity?: number | null
          id?: string
          latitude: number
          longitude: number
          pressure?: number | null
          temperature?: number | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Update: {
          created_at?: string
          data_source?: string
          humidity?: number | null
          id?: string
          latitude?: number
          longitude?: number
          pressure?: number | null
          temperature?: number | null
          weather_condition?: string | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      lesson_content: {
        Row: {
          content: Json
          content_type: string
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          lesson_number: number
          order_index: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          content_type?: string
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_number: number
          order_index?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          content_type?: string
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          lesson_number?: number
          order_index?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_content_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          reference_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          confidence: number | null
          created_at: string
          forecast_data: Json | null
          id: string
          latitude: number
          longitude: number
          prediction_type: string
          risk_level: string
          valid_until: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          forecast_data?: Json | null
          id?: string
          latitude: number
          longitude: number
          prediction_type: string
          risk_level: string
          valid_until: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          forecast_data?: Json | null
          id?: string
          latitude?: number
          longitude?: number
          prediction_type?: string
          risk_level?: string
          valid_until?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string
          location: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          location?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          request_count: number | null
          user_id: string
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          request_count?: number | null
          user_id: string
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          request_count?: number | null
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      reactions: {
        Row: {
          anomaly_id: string | null
          created_at: string | null
          id: string
          reaction_type: string
          report_id: string | null
          user_id: string
        }
        Insert: {
          anomaly_id?: string | null
          created_at?: string | null
          id?: string
          reaction_type: string
          report_id?: string | null
          user_id: string
        }
        Update: {
          anomaly_id?: string | null
          created_at?: string | null
          id?: string
          reaction_type?: string
          report_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactions_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomalies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "public_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "user_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_progress: {
        Row: {
          completed_lessons: number[] | null
          course_id: string
          id: string
          last_activity: string
          progress: number
          started_at: string
          user_id: string
        }
        Insert: {
          completed_lessons?: number[] | null
          course_id: string
          id?: string
          last_activity?: string
          progress?: number
          started_at?: string
          user_id: string
        }
        Update: {
          completed_lessons?: number[] | null
          course_id?: string
          id?: string
          last_activity?: string
          progress?: number
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          latitude: number
          longitude: number
          report_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude: number
          longitude: number
          report_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          latitude?: number
          longitude?: number
          report_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      chat_messages_public: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          username: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          username?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      public_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          latitude: number | null
          longitude: number | null
          report_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          latitude?: never
          longitude?: never
          report_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string | null
          image_url?: string | null
          latitude?: never
          longitude?: never
          report_type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_max_requests?: number
          p_user_id: string
          p_window_minutes?: number
        }
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
