import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { LevelAttempt } from '../types/progress.types';

type LevelAttemptRow = Database['public']['Tables']['level_attempts']['Row'];

const mapLevelAttemptRow = (attempt: LevelAttemptRow): LevelAttempt => {
  return {
    code: attempt.submitted_code,
    createdAt: attempt.created_at,
    id: attempt.id,
    levelId: attempt.level_id,
    runtimeMs: attempt.runtime_ms,
    score: attempt.score,
    success: attempt.is_success,
    userId: attempt.user_id,
  };
};

export const attemptsService = {
  /**
   * Pasa por la función RPC: la migración que activa RLS revoca la escritura
   * directa sobre `level_attempts` al rol `authenticated`. La función toma el
   * usuario de la sesión, así que no se le pasa.
   */
  async createAttempt(
    levelId: string,
    success: boolean,
    code: string,
    score = 0
  ): ServiceResult<LevelAttempt> {
    const { data, error } = await supabase
      .rpc('create_level_attempt', {
        input_level_id: levelId,
        input_submitted_code: code,
        input_is_success: success,
        input_score: score,
      })
      .single();

    if (error) {
      return {
        data: null,
        error: createAppError(
          error,
          'No se pudo registrar el intento del nivel.',
          'attempt_create_error'
        ),
      };
    }

    return { data: mapLevelAttemptRow(data), error: null };
  },
};
