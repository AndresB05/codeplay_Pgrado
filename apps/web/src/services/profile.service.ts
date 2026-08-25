import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { User, UserProfileUpdate } from '../types/user.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdateRow = Database['public']['Tables']['profiles']['Update'];

const mapProfileRowToUser = (profile: ProfileRow): User => {
  return {
    avatarUrl: profile.avatar_url,
    createdAt: profile.created_at,
    email: profile.email,
    fullName: profile.full_name,
    id: profile.id,
    role: profile.role,
    streakDays: profile.streak_days,
    updatedAt: profile.updated_at,
    xp: profile.xp,
  };
};

const buildProfileUpdatePayload = (updates: UserProfileUpdate): ProfileUpdateRow => {
  return {
    avatar_url: updates.avatarUrl,
    full_name: updates.fullName,
    updated_at: new Date().toISOString(),
  };
};

export const profileService = {
  async getProfile(userId: string): ServiceResult<User> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo cargar el perfil.', 'profile_get_error'),
      };
    }

    if (!data) {
      return { data: null, error: null };
    }

    return { data: mapProfileRowToUser(data), error: null };
  },

  async updateProfile(userId: string, updates: UserProfileUpdate): ServiceResult<User> {
    const { data, error } = await supabase
      .from('profiles')
      .update(buildProfileUpdatePayload(updates))
      .eq('id', userId)
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo actualizar el perfil.', 'profile_update_error'),
      };
    }

    return { data: mapProfileRowToUser(data), error: null };
  },
};
