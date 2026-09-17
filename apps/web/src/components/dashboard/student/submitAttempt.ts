import type { LevelFinish } from '../../../game/GameScene';
import { scoreForSteps } from '../../../game/score';
import { attemptsService } from '../../../services/attempts.service';
import type { Json } from '../../../types/database.types';
import type { AttemptOutcome } from '../../../types/progress.types';

/*
 * LA TRADUCCIÓN DEL ANFITRIÓN: de una partida terminada al mensaje que el
 * servidor entiende. El juego manda un solo mensaje (contrato §3) y desde el
 * J10 eso es **una sola llamada**: `submit_level_attempt` escribe el intento, el
 * progreso y la experiencia dentro de la misma operación.
 *
 * Eran dos hasta el J10 —`create_level_attempt` y `upsert_my_progress`—, y
 * dejaron de serlo porque la puntuación sale de contar el programa: la llamada
 * que concede la experiencia tiene que tener el programa delante. De paso,
 * `user_progress.attempt_count` pasa a contar partidas y coincide con las filas
 * de intentos, que antes eran dos contadores sin nada que los sincronizara.
 *
 * Vive aquí y no en `game/` porque el juego no habla con el servidor: no sabe
 * contra qué fila juega ni quién juega. Y vive fuera del componente para poder
 * probar la decisión sin montar la pantalla.
 */

export interface AttemptRecord {
  code: string;
  success: boolean;
  runtimeMs: number;
  metadata: Json;
}

/*
 * EL PROGRESO SE ESCRIBE TAMBIÉN AL FALLAR, decidido por el usuario el
 * 17-sep-2026. Un nivel fallido queda `in_progress`, así que aparece en el
 * progreso desde el primer intento y con él las veces que se ha probado y
 * cuándo fue la última — que es lo que el tutor verá en sus informes.
 *
 * El estado ya no se manda: lo deriva el servidor de `success`. No hay riesgo de
 * degradar un nivel ya superado —`completed` no se deshace y `completed_at` no
 * se mueve— ni de que una partida con éxito se guarde como empezada.
 */
export const attemptRecord = (finish: LevelFinish): AttemptRecord => ({
  code: JSON.stringify(finish.program),
  success: finish.success,
  runtimeMs: finish.runtimeMs,
  /*
   * Observaciones, no verdades: los pasos y la puntuación de aquí son LOS QUE SE
   * LE ENSEÑARON AL NIÑO, y los que cuentan los recalcula el servidor leyendo el
   * programa (§3). Guardarlos sirve justo para eso — el día que no coincidan con
   * los suyos, uno de los dos recuentos está mal y aquí queda con qué darse
   * cuenta. La puntuación del servidor vive en su columna; ésta, aquí al lado.
   */
  metadata: {
    steps: finish.steps,
    optimalSteps: finish.optimalSteps,
    outOfSteps: finish.outOfSteps,
    looseBlocks: finish.looseBlocks,
    score: finish.success ? scoreForSteps(finish.steps, finish.optimalSteps) : 0,
  },
});

/*
 * Devuelve lo que el servidor concedió, o `null` si la partida no se pudo
 * guardar. La pantalla necesita ese objeto para enseñar la experiencia de
 * verdad: cuánta se ganó depende de la marca anterior, que aquí no se conoce.
 *
 * Nunca lanza, y quien la llama no espera por ella para dejar seguir al niño
 * (§7): un guardado que falla no puede quitarle la partida.
 */
export const submitAttempt = async (
  levelId: string,
  finish: LevelFinish
): Promise<AttemptOutcome | null> => {
  const record = attemptRecord(finish);

  const { data } = await attemptsService.submitAttempt(
    levelId,
    record.success,
    record.code,
    record.runtimeMs,
    record.metadata
  );

  return data;
};
