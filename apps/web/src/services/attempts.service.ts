import { createAppError } from '../errors/createAppError';
import { supabase } from '../lib/supabase';
import type { ServiceResult } from '../types/api.types';
import type { Database, Json } from '../types/database.types';
import type {
  AchievementUnlock,
  AttemptOutcome,
  LevelAttempt,
  MissionCompletionUnlock,
  StreakState,
} from '../types/progress.types';

type LevelAttemptRow = Database['public']['Tables']['level_attempts']['Row'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const numberField = (source: Record<string, unknown>, key: string): number | null =>
  typeof source[key] === 'number' ? (source[key] as number) : null;

/*
 * La RPC devuelve un `jsonb`, así que llega como `Json` y no tipado: se estrecha
 * aquí una vez en vez de dejar que la pantalla adivine. Un campo que no sea el
 * número que se espera deja la respuesta por ilegible, y quien la llama lo trata
 * como un guardado que falló — que es lo que fue, aunque la fila exista.
 */
const readAttemptOutcome = (value: unknown): AttemptOutcome | null => {
  if (!isObject(value)) {
    return null;
  }

  const score = numberField(value, 'score');
  const bestScore = numberField(value, 'best_score');
  const attemptCount = numberField(value, 'attempt_count');
  const awardedXp = numberField(value, 'awarded_xp');
  const totalXp = numberField(value, 'total_xp');

  if (
    typeof value.attempt_id !== 'string' ||
    typeof value.completion_status !== 'string' ||
    score === null ||
    bestScore === null ||
    attemptCount === null ||
    awardedXp === null ||
    totalXp === null
  ) {
    return null;
  }

  return {
    attemptId: value.attempt_id,
    score,
    /* `null` es un programa que el servidor no pudo leer, y es un valor legítimo. */
    steps: numberField(value, 'steps'),
    bestScore,
    completionStatus: value.completion_status,
    attemptCount,
    awardedXp,
    totalXp,
    unlockedAchievements: readUnlocked(value.unlocked_achievements),
    completedMissions: readCompletedMissions(value.completed_missions),
    streak: readStreak(value.streak),
  };
};

/*
 * LOS LOGROS Y LA RACHA SE LEEN BLANDOS, y el resto de la respuesta duro. No es
 * incoherencia: sin ellos la partida se guardó igual y lo único que se pierde
 * es un aviso, mientras que sin la puntuación no hay nada que enseñar. Dar la
 * partida por perdida porque falte un logro sería cambiar algo importante por
 * algo que no lo es.
 */
const readUnlocked = (value: unknown): AchievementUnlock[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((element) => {
    if (
      !isObject(element) ||
      typeof element.key !== 'string' ||
      typeof element.title !== 'string'
    ) {
      return [];
    }

    return [
      {
        key: element.key,
        title: element.title,
        description: typeof element.description === 'string' ? element.description : '',
        iconName: typeof element.icon_name === 'string' ? element.icon_name : 'trophy',
        awardedXp: numberField(element, 'awarded_xp') ?? 0,
      },
    ];
  });
};

/*
 * LAS MISIONES CUMPLIDAS SE LEEN IGUAL DE BLANDAS QUE LOS LOGROS, y por lo
 * mismo: sin ellas la partida se guardó, se puntuó y pagó su XP —el `total_xp`
 * que viene al lado ya las incluye—, y lo único que se pierde es un aviso. La
 * misión sigue cumplida en la base y la tarjeta lo dirá en cuanto se recargue.
 */
const readCompletedMissions = (value: unknown): MissionCompletionUnlock[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((element) => {
    if (
      !isObject(element) ||
      typeof element.key !== 'string' ||
      typeof element.title !== 'string'
    ) {
      return [];
    }

    return [
      {
        key: element.key,
        title: element.title,
        description: typeof element.description === 'string' ? element.description : '',
        awardedXp: numberField(element, 'awarded_xp') ?? 0,
      },
    ];
  });
};

const readStreak = (value: unknown): StreakState => {
  if (!isObject(value)) {
    return { current: 0, max: 0, lastDay: null };
  }

  return {
    current: numberField(value, 'current') ?? 0,
    max: numberField(value, 'max') ?? 0,
    lastDay: typeof value.last_day === 'string' ? value.last_day : null,
  };
};

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
   * NO ES EL CAMINO DE UNA PARTIDA desde el J10: ése es `submitAttempt`, que
   * guarda intento y progreso juntos y deja que el servidor puntúe. Esta sigue
   * existiendo porque la RPC sigue existiendo —`submit_level_attempt` se apoya
   * en ella—, y guarda el intento **con la puntuación que se le pase**, así que
   * llamarla para una partida escribiría el cero que este paso vino a quitar.
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

  /**
   * UNA PARTIDA TERMINADA, EN UNA LLAMADA. El intento, el progreso y la
   * experiencia se escriben dentro de la misma operación del servidor, que es
   * quien puntúa contando el programa (contrato §3).
   *
   * No se le pasa la puntuación: no la acepta. La del cliente viaja dentro de
   * `metadata`, para poder cotejarla con la que el servidor calculó.
   *
   * Tampoco se le pasa el estado del progreso. Sale de `success` en el
   * servidor, que es lo que impide que una partida con éxito acabe guardada
   * como empezada.
   */
  async submitAttempt(
    levelId: string,
    success: boolean,
    code: string,
    runtimeMs?: number,
    metadata: Json = {}
  ): ServiceResult<AttemptOutcome> {
    const { data, error } = await supabase.rpc('submit_level_attempt', {
      input_level_id: levelId,
      input_submitted_code: code,
      input_is_success: success,
      ...(runtimeMs === undefined ? {} : { input_runtime_ms: runtimeMs }),
      input_metadata: metadata,
    });

    if (error) {
      return {
        data: null,
        error: createAppError(error, 'No se pudo guardar la partida.', 'attempt_submit_error'),
      };
    }

    const outcome = readAttemptOutcome(data);

    if (outcome === null) {
      return {
        data: null,
        error: createAppError(null, 'No se pudo guardar la partida.', 'attempt_submit_error'),
      };
    }

    return { data: outcome, error: null };
  },
};
