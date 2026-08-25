// Este archivo debe regenerarse desde Supabase CLI cuando tengas el project ref final.
// Comando:
// npx supabase gen types typescript --project-id TU_REF > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          requirement_type: 'levels_completed' | 'streak_days' | 'xp_earned';
          requirement_value: number;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          icon: string;
          id?: string;
          name: string;
          requirement_type: 'levels_completed' | 'streak_days' | 'xp_earned';
          requirement_value: number;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          requirement_type?: 'levels_completed' | 'streak_days' | 'xp_earned';
          requirement_value?: number;
        };
        Relationships: [];
      };
      level_attempts: {
        Row: {
          code: string;
          created_at: string;
          id: string;
          level_id: string;
          success: boolean;
          user_id: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          id?: string;
          level_id: string;
          success: boolean;
          user_id: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          id?: string;
          level_id?: string;
          success?: boolean;
          user_id?: string;
        };
        Relationships: [];
      };
      levels: {
        Row: {
          created_at: string;
          description: string;
          difficulty: 'easy' | 'medium' | 'hard';
          id: string;
          name: string;
          order_index: number;
          world_id: string;
          xp_reward: number;
        };
        Insert: {
          created_at?: string;
          description: string;
          difficulty: 'easy' | 'medium' | 'hard';
          id?: string;
          name: string;
          order_index: number;
          world_id: string;
          xp_reward: number;
        };
        Update: {
          created_at?: string;
          description?: string;
          difficulty?: 'easy' | 'medium' | 'hard';
          id?: string;
          name?: string;
          order_index?: number;
          world_id?: string;
          xp_reward?: number;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          role: 'child' | 'tutor';
          streak_days: number;
          updated_at: string;
          xp: number;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          role?: 'child' | 'tutor';
          streak_days?: number;
          updated_at?: string;
          xp?: number;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: 'child' | 'tutor';
          streak_days?: number;
          updated_at?: string;
          xp?: number;
        };
        Relationships: [];
      };
      user_progress: {
        Row: {
          completed: boolean;
          completed_at: string | null;
          created_at: string;
          id: string;
          level_id: string;
          stars: number;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          level_id: string;
          stars?: number;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          level_id?: string;
          stars?: number;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      worlds: {
        Row: {
          color: string;
          created_at: string;
          description: string;
          icon: string;
          id: string;
          name: string;
          order_index: number;
        };
        Insert: {
          color: string;
          created_at?: string;
          description: string;
          icon: string;
          id?: string;
          name: string;
          order_index: number;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string;
          icon?: string;
          id?: string;
          name?: string;
          order_index?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      leaderboard_weekly: {
        Row: {
          avatar_url: string | null;
          full_name: string;
          rank: number;
          user_id: string;
          xp: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      _trigger_on_auth_user_created: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [key: string]: never;
    };
    CompositeTypes: {
      [key: string]: never;
    };
  };
}
