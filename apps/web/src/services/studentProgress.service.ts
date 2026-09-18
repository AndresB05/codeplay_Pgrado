import { AppError } from '../errors/AppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database } from '../types/database.types';
import type { LevelAttempt, LevelProgress, StudentProgressDetail } from '../types/classroom.types';

type ProgressRow = Database['public']['Views']['classroom_level_progress']['Row'];
type AttemptRow = Database['public']['Views']['classroom_level_attempts']['Row'];

/** Cuántos niveles y mundos publicados hay, que es el denominador del panel. */
export interface CatalogSize {
  levels: number;
  worlds: number;
}

export interface StudentProgressService {
  getCatalogSize: () => ServiceResult<CatalogSize>;
  getDetail: (studentId: string) => ServiceResult<StudentProgressDetail>;
}

/*
 * Los motivos llegan en inglés y la interfaz es en español, así que se traducen
 * por código, como en `classrooms.service.ts`, con el original como causa.
 */
const ERROR_MESSAGES: Record<string, string> = {
  '42501': 'No tienes permiso para ver el avance de este explorador.',
  '42P17': 'El servidor no pudo comprobar los permisos. Avisa a quien mantiene la plataforma.',
};

const readErrorCode = (error: unknown): string | undefined => {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const { code } = error as { code?: unknown };

    return typeof code === 'string' ? code : undefined;
  }

  return undefined;
};

const progressError = (error: unknown): AppError => {
  const code = readErrorCode(error);

  return new AppError(
    (code && ERROR_MESSAGES[code]) || 'No se pudo cargar el avance de este explorador.',
    code ?? 'student_progress_get_error',
    error
  );
};

/*
 * Las columnas de una vista llegan anulables aunque la consulta nunca devuelva
 * nulos —PostgreSQL no propaga la nulabilidad de la tabla de origen—, así que
 * todo lo que sale de las dos pasa por aquí. Los únicos nulos de verdad son
 * `optimal_steps` y `steps`, y ésos viajan tal cual.
 */
const mapProgressRow = (row: ProgressRow): LevelProgress => ({
  levelId: row.level_id ?? '',
  levelTitle: row.level_title ?? '',
  worldTitle: row.world_title ?? '',
  worldSortOrder: row.world_sort_order ?? 0,
  levelSortOrder: row.level_sort_order ?? 0,
  completed: row.completion_status === 'completed',
  bestScore: row.best_score ?? 0,
  attemptCount: row.attempt_count ?? 0,
  optimalSteps: row.optimal_steps,
});

const mapAttemptRow = (row: AttemptRow): LevelAttempt => ({
  attemptId: row.attempt_id ?? '',
  levelId: row.level_id ?? '',
  isSuccess: row.is_success ?? false,
  score: row.score ?? 0,
  steps: row.steps,
  createdAtIso: row.created_at ?? '',
});

export const studentProgressService: StudentProgressService = {
  /**
   * El tamaño del catálogo publicado. Se lee en vez de escribirse a mano porque
   * los nueve niveles de hoy son una siembra, no una constante: el día que entre
   * un mundo más, el denominador del panel sube solo.
   */
  async getCatalogSize(): ServiceResult<CatalogSize> {
    const { data, error } = await supabase
      .from('levels')
      .select('world_id')
      .eq('is_published', true);

    if (error) {
      return { data: null, error: progressError(error) };
    }

    const rows = data ?? [];

    return {
      data: { levels: rows.length, worlds: new Set(rows.map((row) => row.world_id)).size },
      error: null,
    };
  },

  /**
   * El avance de un explorador, nivel a nivel y partida a partida. Quién puede
   * pedirlo lo decide el filtro que las vistas de la 0034 llevan dentro, no
   * este servicio: pasar el identificador de alguien a quien no se tutela
   * devuelve vacío, no un error.
   */
  async getDetail(studentId: string): ServiceResult<StudentProgressDetail> {
    const [progress, attempts] = await Promise.all([
      supabase
        .from('classroom_level_progress')
        .select('*')
        .eq('student_id', studentId)
        .order('world_sort_order')
        .order('level_sort_order'),
      /*
       * De la más vieja a la más nueva: la tira de pasos se lee como la
       * historia de cómo el explorador llegó a su marca, y al revés no se
       * entiende.
       */
      supabase
        .from('classroom_level_attempts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at'),
    ]);

    const readError = progress.error ?? attempts.error;

    if (readError) {
      return { data: null, error: progressError(readError) };
    }

    const attemptsByLevel: Record<string, LevelAttempt[]> = {};

    (attempts.data ?? []).map(mapAttemptRow).forEach((attempt) => {
      const bucket = attemptsByLevel[attempt.levelId];

      if (bucket) {
        bucket.push(attempt);
      } else {
        attemptsByLevel[attempt.levelId] = [attempt];
      }
    });

    return {
      data: { levels: (progress.data ?? []).map(mapProgressRow), attemptsByLevel },
      error: null,
    };
  },
};
