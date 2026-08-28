export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  public: {
    Tables: {
      achievements: {
        Row: {
          achievement_key: string;
          awarded_xp: number;
          created_at: string;
          description: string;
          icon_name: string;
          id: string;
          title: string;
          unlocked_at: string;
          user_id: string;
        };
        Insert: {
          achievement_key: string;
          awarded_xp?: number;
          created_at?: string;
          description: string;
          icon_name: string;
          id?: string;
          title: string;
          unlocked_at?: string;
          user_id: string;
        };
        Update: {
          achievement_key?: string;
          awarded_xp?: number;
          created_at?: string;
          description?: string;
          icon_name?: string;
          id?: string;
          title?: string;
          unlocked_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      class_groups: {
        Row: {
          capacity: number;
          created_at: string;
          grade_label: string;
          id: string;
          name: string;
          public_id: string;
          teacher_name: string;
          tutor_id: string;
          updated_at: string;
        };
        Insert: {
          capacity?: number;
          created_at?: string;
          grade_label?: string;
          id?: string;
          name: string;
          public_id: string;
          teacher_name?: string;
          tutor_id: string;
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          created_at?: string;
          grade_label?: string;
          id?: string;
          name?: string;
          public_id?: string;
          teacher_name?: string;
          tutor_id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      class_memberships: {
        Row: {
          created_at: string;
          group_id: string;
          id: string;
          joined_at: string;
          student_id: string;
        };
        Insert: {
          created_at?: string;
          group_id: string;
          id?: string;
          joined_at?: string;
          student_id: string;
        };
        Update: {
          created_at?: string;
          group_id?: string;
          id?: string;
          joined_at?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'class_memberships_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_group_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_memberships_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      invitations: {
        Row: {
          accepted_at: string | null;
          expires_at: string;
          group_id: string;
          id: string;
          invited_by: string;
          sent_at: string;
          status: string;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          expires_at?: string;
          group_id: string;
          id?: string;
          invited_by: string;
          sent_at?: string;
          status?: string;
          token?: string;
        };
        Update: {
          accepted_at?: string | null;
          expires_at?: string;
          group_id?: string;
          id?: string;
          invited_by?: string;
          sent_at?: string;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_group_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      join_requests: {
        Row: {
          group_id: string;
          id: string;
          requested_at: string;
          resolved_at: string | null;
          status: string;
          student_id: string;
        };
        Insert: {
          group_id: string;
          id?: string;
          requested_at?: string;
          resolved_at?: string | null;
          status?: string;
          student_id: string;
        };
        Update: {
          group_id?: string;
          id?: string;
          requested_at?: string;
          resolved_at?: string | null;
          status?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'join_requests_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_group_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'join_requests_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      level_attempts: {
        Row: {
          created_at: string;
          id: string;
          is_success: boolean;
          level_id: string;
          metadata: Json;
          runtime_ms: number | null;
          score: number;
          submitted_code: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_success?: boolean;
          level_id: string;
          metadata?: Json;
          runtime_ms?: number | null;
          score?: number;
          submitted_code: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_success?: boolean;
          level_id?: string;
          metadata?: Json;
          runtime_ms?: number | null;
          score?: number;
          submitted_code?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'level_attempts_level_id_fkey';
            columns: ['level_id'];
            isOneToOne: false;
            referencedRelation: 'levels';
            referencedColumns: ['id'];
          },
        ];
      };
      levels: {
        Row: {
          created_at: string;
          description: string;
          difficulty: string;
          id: string;
          is_published: boolean;
          narrative: string;
          programming_language: string;
          slug: string;
          sort_order: number;
          stars_reward: number;
          starter_code: string;
          title: string;
          updated_at: string;
          validation_rules: Json;
          world_id: string;
          xp_reward: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          difficulty: string;
          id?: string;
          is_published?: boolean;
          narrative: string;
          programming_language?: string;
          slug: string;
          sort_order: number;
          stars_reward?: number;
          starter_code?: string;
          title: string;
          updated_at?: string;
          validation_rules?: Json;
          world_id: string;
          xp_reward?: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          difficulty?: string;
          id?: string;
          is_published?: boolean;
          narrative?: string;
          programming_language?: string;
          slug?: string;
          sort_order?: number;
          stars_reward?: number;
          starter_code?: string;
          title?: string;
          updated_at?: string;
          validation_rules?: Json;
          world_id?: string;
          xp_reward?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'levels_world_id_fkey';
            columns: ['world_id'];
            isOneToOne: false;
            referencedRelation: 'worlds';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_key: string;
          country_code: string;
          created_at: string;
          current_streak: number;
          full_name: string;
          id: string;
          max_streak: number;
          role: Database['public']['Enums']['user_role'];
          total_xp: number;
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_key?: string;
          country_code?: string;
          created_at?: string;
          current_streak?: number;
          full_name?: string;
          id: string;
          max_streak?: number;
          role?: Database['public']['Enums']['user_role'];
          total_xp?: number;
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_key?: string;
          country_code?: string;
          created_at?: string;
          current_streak?: number;
          full_name?: string;
          id?: string;
          max_streak?: number;
          role?: Database['public']['Enums']['user_role'];
          total_xp?: number;
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          attempt_count: number;
          best_score: number;
          completed_at: string | null;
          completion_status: string;
          created_at: string;
          id: string;
          last_attempt_at: string | null;
          level_id: string;
          stars_earned: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          attempt_count?: number;
          best_score?: number;
          completed_at?: string | null;
          completion_status?: string;
          created_at?: string;
          id?: string;
          last_attempt_at?: string | null;
          level_id: string;
          stars_earned?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          attempt_count?: number;
          best_score?: number;
          completed_at?: string | null;
          completion_status?: string;
          created_at?: string;
          id?: string;
          last_attempt_at?: string | null;
          level_id?: string;
          stars_earned?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_progress_level_id_fkey';
            columns: ['level_id'];
            isOneToOne: false;
            referencedRelation: 'levels';
            referencedColumns: ['id'];
          },
        ];
      };
      worlds: {
        Row: {
          accent_color: string;
          created_at: string;
          description: string;
          id: string;
          is_published: boolean;
          mascot: string;
          region_label: string;
          slug: string;
          sort_order: number;
          theme_color: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          accent_color: string;
          created_at?: string;
          description: string;
          id?: string;
          is_published?: boolean;
          mascot: string;
          region_label: string;
          slug: string;
          sort_order: number;
          theme_color: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          accent_color?: string;
          created_at?: string;
          description?: string;
          id?: string;
          is_published?: boolean;
          mascot?: string;
          region_label?: string;
          slug?: string;
          sort_order?: number;
          theme_color?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      class_group_directory: {
        Row: {
          capacity: number | null;
          grade_label: string | null;
          id: string | null;
          member_count: number | null;
          name: string | null;
          public_id: string | null;
          teacher_name: string | null;
          tutor_id: string | null;
        };
        Insert: {
          capacity?: number | null;
          grade_label?: string | null;
          id?: string | null;
          member_count?: never;
          name?: string | null;
          public_id?: string | null;
          teacher_name?: string | null;
          tutor_id?: string | null;
        };
        Update: {
          capacity?: number | null;
          grade_label?: string | null;
          id?: string | null;
          member_count?: never;
          name?: string | null;
          public_id?: string | null;
          teacher_name?: string | null;
          tutor_id?: string | null;
        };
        Relationships: [];
      };
      classroom_roster: {
        Row: {
          avatar_key: string | null;
          current_streak: number | null;
          full_name: string | null;
          group_id: string | null;
          joined_at: string | null;
          student_id: string | null;
          total_xp: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'class_memberships_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_group_directory';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'class_memberships_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'class_groups';
            referencedColumns: ['id'];
          },
        ];
      };
      leaderboard_weekly: {
        Row: {
          avatar_key: string | null;
          completed_levels: number | null;
          country_code: string | null;
          rank: number | null;
          unlocked_achievements: number | null;
          user_id: string | null;
          username: string | null;
          weekly_xp: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      accept_join_request: {
        Args: { input_request_id: string };
        Returns: {
          created_at: string;
          group_id: string;
          id: string;
          joined_at: string;
          student_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'class_memberships';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      create_level_attempt: {
        Args: {
          input_is_success?: boolean;
          input_level_id: string;
          input_metadata?: Json;
          input_runtime_ms?: number;
          input_score?: number;
          input_submitted_code: string;
        };
        Returns: {
          created_at: string;
          id: string;
          is_success: boolean;
          level_id: string;
          metadata: Json;
          runtime_ms: number | null;
          score: number;
          submitted_code: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'level_attempts';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      is_visible_student_of: { Args: { profile_id: string }; Returns: boolean };
      update_my_profile: {
        Args: {
          input_avatar_key?: string;
          input_country_code?: string;
          input_full_name?: string;
          input_username?: string;
        };
        Returns: {
          avatar_key: string;
          country_code: string;
          created_at: string;
          current_streak: number;
          full_name: string;
          id: string;
          max_streak: number;
          role: Database['public']['Enums']['user_role'];
          total_xp: number;
          updated_at: string;
          username: string | null;
        };
        SetofOptions: {
          from: '*';
          to: 'profiles';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      upsert_my_progress: {
        Args: {
          input_best_score?: number;
          input_completion_status?: string;
          input_last_attempt_at?: string;
          input_level_id: string;
          input_stars_earned?: number;
        };
        Returns: {
          attempt_count: number;
          best_score: number;
          completed_at: string | null;
          completion_status: string;
          created_at: string;
          id: string;
          last_attempt_at: string | null;
          level_id: string;
          stars_earned: number;
          updated_at: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'user_progress';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
    };
    Enums: {
      user_role: 'child' | 'tutor';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      user_role: ['child', 'tutor'],
    },
  },
} as const;
