import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../../../errors/AppError';
import type { LevelFinish } from '../../../game/GameScene';
import { PROGRAM_FORMAT_VERSION } from '../../../game/program';
import type { AttemptOutcome } from '../../../types/progress.types';
import { attemptRecord, submitAttempt } from './submitAttempt';

const mocks = vi.hoisted(() => ({ submit: vi.fn() }));

vi.mock('../../../services/attempts.service', () => ({
  attemptsService: { submitAttempt: mocks.submit },
}));

const finish = (over: Partial<LevelFinish> = {}): LevelFinish => ({
  steps: 12,
  optimalSteps: 12,
  success: true,
  outOfSteps: false,
  looseBlocks: false,
  program: { formatVersion: PROGRAM_FORMAT_VERSION, workspace: { blocks: {} } },
  runtimeMs: 8400,
  maxDrop: 0,
  ...over,
});

const outcome = (over: Partial<AttemptOutcome> = {}): AttemptOutcome => ({
  attemptId: 'attempt-1',
  score: 100,
  steps: 12,
  bestScore: 100,
  completionStatus: 'completed',
  attemptCount: 1,
  awardedXp: 100,
  totalXp: 400,
  unlockedAchievements: [],
  completedMissions: [],
  streak: { current: 1, max: 1, lastDay: '2026-09-18' },
  ...over,
});

describe('attemptRecord', () => {
  /*
   * Es la única observación que el servidor USA para decidir algo —«¡Auch! mis
   * rodillas»—, así que omitirla en una partida sin caídas dejaría al servidor
   * sin poder distinguir «no se cayó» de «un juego viejo que no lo manda».
   */
  it('la caída viaja entre las observaciones, y en cero cuando no hubo ninguna', () => {
    const sinCaida = attemptRecord(finish({ maxDrop: 0 })).metadata as Record<string, unknown>;
    const conCaida = attemptRecord(finish({ maxDrop: 5 })).metadata as Record<string, unknown>;

    expect(sinCaida.maxDrop).toBe(0);
    expect(conCaida.maxDrop).toBe(5);
  });


  it('el nivel superado va con éxito', () => {
    expect(attemptRecord(finish()).success).toBe(true);
  });

  /*
   * La decisión del usuario del 17-sep-2026: fallar TAMBIÉN se guarda, y el
   * servidor lo deja `in_progress`. El estado ya no se manda desde aquí, así
   * que lo que queda por comprobar es que el fallo sube como fallo.
   */
  it('el nivel fallado va sin éxito, no se queda sin mandar', () => {
    expect(attemptRecord(finish({ success: false })).success).toBe(false);
  });

  it('quedarse sin pasos es fallar, no una tercera cosa', () => {
    const record = attemptRecord(finish({ success: false, outOfSteps: true }));

    expect(record.success).toBe(false);
    expect(record.metadata).toMatchObject({ outOfSteps: true, score: 0 });
  });

  /*
   * Pisar la meta y seguir hasta agotar el máximo SÍ resuelve el nivel (§4.4):
   * `outOfSteps` no puede degradar un éxito.
   */
  it('llegar y luego agotar el máximo sigue siendo superarlo', () => {
    expect(attemptRecord(finish({ outOfSteps: true })).success).toBe(true);
  });

  /*
   * El sobre entero, no el interior: quien lea `submitted_code` para puntuarlo
   * tiene que saber qué formato está leyendo sin mirar otra columna (§4.3).
   */
  it('manda el programa dentro de su sobre, con la versión', () => {
    const record = attemptRecord(finish());

    expect(JSON.parse(record.code)).toEqual({
      formatVersion: PROGRAM_FORMAT_VERSION,
      workspace: { blocks: {} },
    });
  });

  it('las observaciones llevan los pasos y la puntuación que se le enseñaron al niño', () => {
    expect(
      attemptRecord(finish({ steps: 15, optimalSteps: 12, looseBlocks: true })).metadata
    ).toEqual({
      steps: 15,
      optimalSteps: 12,
      outOfSteps: false,
      looseBlocks: true,
      score: 80,
      maxDrop: 0,
    });
  });

  /*
   * La puntuación de una partida que no resolvió el nivel es cero, no la que
   * daría su eficiencia: es lo mismo que guarda el servidor, y las dos cifras
   * de la fila tienen que poder compararse sin excepciones.
   */
  it('una partida fallida no lleva puntuación, por eficiente que sea su programa', () => {
    expect(attemptRecord(finish({ success: false, steps: 12, optimalSteps: 12 })).metadata).toMatchObject(
      { score: 0 }
    );
  });
});

describe('submitAttempt', () => {
  beforeEach(() => {
    mocks.submit.mockReset();
  });

  it('manda una sola llamada con el programa, la duración y las observaciones', async () => {
    mocks.submit.mockResolvedValue({ data: outcome(), error: null });

    await submitAttempt('level-1', finish());

    expect(mocks.submit).toHaveBeenCalledTimes(1);
    expect(mocks.submit).toHaveBeenCalledWith(
      'level-1',
      true,
      JSON.stringify(finish().program),
      8400,
      expect.objectContaining({ steps: 12, score: 100 })
    );
  });

  it('devuelve lo que el servidor concedió', async () => {
    mocks.submit.mockResolvedValue({ data: outcome({ score: 80, awardedXp: 80 }), error: null });

    await expect(submitAttempt('level-1', finish())).resolves.toMatchObject({
      score: 80,
      awardedXp: 80,
    });
  });

  /*
   * Un guardado que falla no puede quitarle la partida al niño (§7), así que
   * esto NO lanza: devuelve que no hay nada que enseñar y la pantalla lo dice
   * en una línea.
   */
  it('un fallo del servidor devuelve nada, y no lanza', async () => {
    mocks.submit.mockResolvedValue({
      data: null,
      error: new AppError('No se pudo guardar la partida.', 'attempt_submit_error'),
    });

    await expect(submitAttempt('level-1', finish())).resolves.toBeNull();
  });
});
