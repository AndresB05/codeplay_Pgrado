import type { LevelFinish } from '../../../game/GameScene';
import { attemptsService } from '../../../services/attempts.service';
import { progressService } from '../../../services/progress.service';
import type { Json } from '../../../types/database.types';

/*
 * LA TRADUCCIÓN DEL ANFITRIÓN: de una partida terminada a las dos llamadas que
 * el servidor entiende. El juego manda un solo mensaje (contrato §3) y el
 * apéndice fija que son dos llamadas —`create_level_attempt` y
 * `upsert_my_progress`—, independientes y sin nada que las sincronice:
 * `user_progress.attempt_count` cuenta las segundas, no las filas de la primera.
 *
 * Vive aquí y no en `game/` porque el juego no habla con el servidor: no sabe
 * contra qué fila juega ni quién juega. Y vive fuera del componente para poder
 * probar la decisión sin montar la pantalla.
 */

/** Los dos estados que `upsert_my_progress` acepta; cualquier otro es `22023`. */
export type CompletionStatus = 'completed' | 'in_progress';

export interface AttemptRecord {
  code: string;
  success: boolean;
  runtimeMs: number;
  metadata: Json;
  completionStatus: CompletionStatus;
}

/*
 * EL PROGRESO SE ESCRIBE TAMBIÉN AL FALLAR, decidido por el usuario el
 * 17-sep-2026. Un nivel fallido queda `in_progress`, así que aparece en el
 * progreso desde el primer intento y con él las veces que se ha probado y
 * cuándo fue la última — que es lo que el tutor verá en sus informes.
 *
 * No hay riesgo de degradar un nivel ya superado: `upsert_my_progress` deja
 * `completed` en cuanto lo estuvo alguna vez, y `completed_at` no se mueve.
 * Lo que sí obliga es a que el contador de mundos mire el estado, y no la
 * existencia de la fila (`docs/CONTEXT.md` §4.12).
 */
export const attemptRecord = (finish: LevelFinish): AttemptRecord => ({
  code: JSON.stringify(finish.program),
  success: finish.success,
  runtimeMs: finish.runtimeMs,
  /*
   * Observaciones, no verdades: los pasos de aquí son LOS QUE SE LE ENSEÑARON AL
   * NIÑO, y el número que cuenta lo recalculará el servidor leyendo el programa
   * (§3). Guardarlos sirve justo para eso — el día que los dos no coincidan, uno
   * de los dos recuentos está mal y aquí queda con qué darse cuenta.
   */
  metadata: {
    steps: finish.steps,
    optimalSteps: finish.optimalSteps,
    outOfSteps: finish.outOfSteps,
    looseBlocks: finish.looseBlocks,
  },
  completionStatus: finish.success ? 'completed' : 'in_progress',
});

/*
 * Devuelve si quedó guardado ENTERO. Las dos llamadas se hacen siempre, aunque
 * la primera falle: son independientes, y renunciar a la segunda por la primera
 * perdería el progreso de una partida que sí ocurrió.
 *
 * Nunca lanza, y quien la llama no espera por ella para dejar seguir al niño
 * (§7): un guardado que falla no puede quitarle la partida.
 */
export const submitAttempt = async (levelId: string, finish: LevelFinish): Promise<boolean> => {
  const record = attemptRecord(finish);

  /*
   * `score` y `stars` van a cero a propósito. El contrato retiró la puntuación
   * del mensaje —la calcula el servidor contando el programa, y eso es el J10— y
   * las estrellas son herencia de un diseño anterior que ninguna pantalla pinta.
   */
  const attempt = await attemptsService.createAttempt(
    levelId,
    record.success,
    record.code,
    0,
    record.runtimeMs,
    record.metadata
  );

  const progress = await progressService.upsertProgress(levelId, record.completionStatus, 0, 0);

  return attempt.error === null && progress.error === null;
};
