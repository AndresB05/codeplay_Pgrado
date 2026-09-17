import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database, Json } from '../types/database.types';
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
   *
   * Los **seis** parámetros, desde el J9. Hasta entonces pasaba cuatro y el
   * intento se guardaba sin duración ni observaciones, que son dos de las tres
   * cosas que el contrato §3 deja mandar al juego.
   *
   * `score` sigue en cero a propósito: el contrato lo retiró del mensaje el
   * 3-sep-2026 —lo calcula el servidor leyendo el programa— y quien lo calcule
   * es el J10. Mandarlo desde aquí sería estrenar el número que aquel paso
   * viene a quitar.
   */
  async createAttempt(
    levelId: string,
    success: boolean,
    code: string,
    score = 0,
    runtimeMs?: number,
    metadata: Json = {}
  ): ServiceResult<LevelAttempt> {
    const { data, error } = await supabase
      .rpc('create_level_attempt', {
        input_level_id: levelId,
        input_submitted_code: code,
        input_is_success: success,
        input_score: score,
        ...(runtimeMs === undefined ? {} : { input_runtime_ms: runtimeMs }),
        input_metadata: metadata,
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
