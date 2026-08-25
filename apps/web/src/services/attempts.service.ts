import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { LevelAttempt } from '../types/progress.types';

type LevelAttemptRow = Database['public']['Tables']['level_attempts']['Row'];
type LevelAttemptInsert = Database['public']['Tables']['level_attempts']['Insert'];

const mapLevelAttemptRow = (attempt: LevelAttemptRow): LevelAttempt => {
  return {
    code: attempt.code,
    createdAt: attempt.created_at,
    id: attempt.id,
    levelId: attempt.level_id,
    success: attempt.success,
    userId: attempt.user_id,
  };
};

const buildAttemptPayload = (
  userId: string,
  levelId: string,
  success: boolean,
  code: string
): LevelAttemptInsert => {
  return {
    code,
    level_id: levelId,
    success,
    user_id: userId,
  };
};

export const attemptsService = {
  async createAttempt(
    userId: string,
    levelId: string,
    success: boolean,
    code: string
  ): ServiceResult<LevelAttempt> {
    const { data, error } = await supabase
      .from('level_attempts')
      .insert(buildAttemptPayload(userId, levelId, success, code))
      .select('*')
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
