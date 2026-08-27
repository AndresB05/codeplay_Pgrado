import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { User, UserProfileUpdate } from '../types/user.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * El correo no está en `profiles`: vive en la capa de autenticación, así que
 * quien lo tenga a mano lo pasa aparte.
 */
const mapProfileRowToUser = (profile: ProfileRow, email: string | null = null): User => {
  return {
    avatarKey: profile.avatar_key,
    countryCode: profile.country_code,
    createdAt: profile.created_at,
    email,
    fullName: profile.full_name,
    id: profile.id,
    maxStreak: profile.max_streak,
    role: profile.role,
    streakDays: profile.current_streak,
    updatedAt: profile.updated_at,
    username: profile.username,
    xp: profile.total_xp,
  };
};

export const profileService = {
  async getProfile(userId: string, email: string | null = null): ServiceResult<User> {
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

    return { data: mapProfileRowToUser(data, email), error: null };
  },

  /**
   * Pasa por la función RPC y no por un `update` sobre la tabla: la migración
   * que activa RLS revoca la escritura directa sobre `profiles` al rol
   * `authenticated`, de modo que `update_my_profile` es la única vía.
   */
  async updateProfile(
    updates: UserProfileUpdate,
    email: string | null = null
  ): ServiceResult<User> {
    const { data, error } = await supabase
      .rpc('update_my_profile', {
        input_username: updates.username ?? undefined,
        input_full_name: updates.fullName ?? undefined,
        input_avatar_key: updates.avatarKey ?? undefined,
        input_country_code: updates.countryCode ?? undefined,
      })
      .single();

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo actualizar el perfil.', 'profile_update_error'),
      };
    }

    return { data: mapProfileRowToUser(data, email), error: null };
  },
};
