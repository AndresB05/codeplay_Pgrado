import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { UserProgress } from '../types/progress.types';

type UserProgressRow = Database['public']['Tables']['user_progress']['Row'];

const mapUserProgressRow = (progress: UserProgressRow): UserProgress => {
  return {
    attemptCount: progress.attempt_count,
    bestScore: progress.best_score,
    completedAt: progress.completed_at,
    completionStatus: progress.completion_status,
    createdAt: progress.created_at,
    id: progress.id,
    lastAttemptAt: progress.last_attempt_at,
    levelId: progress.level_id,
    stars: progress.stars_earned,
    updatedAt: progress.updated_at,
    userId: progress.user_id,
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

  /**
   * Pasa por la función RPC: la migración que activa RLS revoca la escritura
   * directa sobre `user_progress` al rol `authenticated`. La función toma el
   * usuario de la sesión, así que no se le pasa.
   */
  async upsertProgress(
    levelId: string,
    completionStatus: string,
    bestScore: number,
    stars: number
  ): ServiceResult<UserProgress> {
    const { data, error } = await supabase
      .rpc('upsert_my_progress', {
        input_level_id: levelId,
        input_completion_status: completionStatus,
        input_best_score: bestScore,
        input_stars_earned: stars,
      })
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
