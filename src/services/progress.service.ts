import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { UserProgress } from '../types/progress.types';

type UserProgressRow = Database['public']['Tables']['user_progress']['Row'];
type UserProgressInsert = Database['public']['Tables']['user_progress']['Insert'];

const mapUserProgressRow = (progress: UserProgressRow): UserProgress => {
  return {
    completed: progress.completed,
    completedAt: progress.completed_at,
    createdAt: progress.created_at,
    id: progress.id,
    levelId: progress.level_id,
    stars: progress.stars,
    updatedAt: progress.updated_at,
    userId: progress.user_id,
  };
};

const buildProgressPayload = (
  userId: string,
  levelId: string,
  completed: boolean,
  stars: number
): UserProgressInsert => {
  return {
    completed,
    completed_at: completed ? new Date().toISOString() : null,
    level_id: levelId,
    stars,
    updated_at: new Date().toISOString(),
    user_id: userId,
  };
};

export const progressService = {
  async getMyProgress(userId: string): ServiceResult<UserProgress[]> {
    const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', userId);

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo cargar el progreso del usuario.',
          'progress_get_error'
        ),
      };
    }

    return { data: data.map(mapUserProgressRow), error: null };
  },

  async upsertProgress(
    userId: string,
    levelId: string,
    completed: boolean,
    stars: number
  ): ServiceResult<UserProgress> {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert(buildProgressPayload(userId, levelId, completed, stars), {
        onConflict: 'user_id,level_id',
      })
      .select('*')
      .single();

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo guardar el progreso del nivel.',
          'progress_upsert_error'
        ),
      };
    }

    return { data: mapUserProgressRow(data), error: null };
  },
};
