import { describe, expect, it } from 'vitest';
import type { LevelFinish } from '../../../game/GameScene';
import { PROGRAM_FORMAT_VERSION } from '../../../game/program';
import { attemptRecord } from './submitAttempt';

const finish = (over: Partial<LevelFinish> = {}): LevelFinish => ({
  steps: 12,
  optimalSteps: 12,
  success: true,
  outOfSteps: false,
  looseBlocks: false,
  program: { formatVersion: PROGRAM_FORMAT_VERSION, workspace: { blocks: {} } },
  runtimeMs: 8400,
  ...over,
});

describe('attemptRecord', () => {
  it('el nivel superado va como `completed`', () => {
    expect(attemptRecord(finish()).completionStatus).toBe('completed');
  });

  /*
   * La decisión del usuario del 17-sep-2026, y la que obliga al filtro del
   * contador de mundos: fallar TAMBIÉN escribe progreso.
   */
  it('el nivel fallado va como `in_progress`, no se queda sin escribir', () => {
    expect(attemptRecord(finish({ success: false })).completionStatus).toBe('in_progress');
  });

  it('quedarse sin pasos es fallar, no una tercera cosa', () => {
    const record = attemptRecord(finish({ success: false, outOfSteps: true }));

    expect(record.completionStatus).toBe('in_progress');
    expect(record.success).toBe(false);
  });

  /*
   * Pisar la meta y seguir hasta agotar el máximo SÍ resuelve el nivel (§4.4):
   * `outOfSteps` no puede degradar un éxito.
   */
  it('llegar y luego agotar el máximo sigue siendo superarlo', () => {
    expect(attemptRecord(finish({ outOfSteps: true })).completionStatus).toBe('completed');
  });

  /*
   * El sobre entero, no el interior: quien lea `submitted_code` en el J10 tiene
   * que saber qué formato está leyendo sin mirar otra columna (§4.3).
   */
  it('manda el programa dentro de su sobre, con la versión', () => {
    const record = attemptRecord(finish());

    expect(JSON.parse(record.code)).toEqual({
      formatVersion: PROGRAM_FORMAT_VERSION,
      workspace: { blocks: {} },
    });
  });

  it('las observaciones llevan los pasos que se le enseñaron al niño', () => {
    expect(
      attemptRecord(finish({ steps: 15, optimalSteps: 12, looseBlocks: true })).metadata
    ).toEqual({ steps: 15, optimalSteps: 12, outOfSteps: false, looseBlocks: true });
  });
});
