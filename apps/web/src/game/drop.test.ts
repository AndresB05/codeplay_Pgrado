import { describe, expect, it } from 'vitest';
import { maxDrop } from './drop';
import type { RunStep } from './interpreter';
import type { LevelConfig } from './level';

/*
 * La rejilla de «La torre» tal como está sembrada, medida contra la base el
 * 18-sep-2026. La casilla de altura 6 en (2,1) es ADYACENTE a la de altura 1 en
 * (3,1), así que la caída de cinco existe y es la mayor posible del nivel: de
 * ahí sale el número que «¡Auch! mis rodillas» exige.
 */
const laTorre: LevelConfig = {
  tiles: [
    ['gap', 'gap', 'floor', 'floor', 'gap'],
    ['gap', 'floor', 'floor', 'floor', 'gap'],
    ['gap', 'floor', 'floor', 'floor', 'gap'],
    ['floor', 'floor', 'floor', 'floor', 'gap'],
    ['floor', 'gap', 'gap', 'gap', 'gap'],
  ],
  heights: [
    [0, 0, 4, 3, 0],
    [0, 6, 4, 2, 0],
    [0, 6, 5, 2, 0],
    [1, 1, 1, 1, 0],
    [1, 0, 0, 0, 0],
  ],
  start: { cell: { row: 4, column: 0 }, facing: 'north' },
  goal: { row: 1, column: 1 },
  optimalSteps: 23,
};

const paso = (row: number, column: number): RunStep => ({
  pose: { cell: { row, column }, facing: 'north' },
  blockedBy: null,
  motion: 'walk',
});

describe('maxDrop', () => {
  it('una partida que no baja de nivel no cae nada', () => {
    expect(maxDrop(laTorre, [paso(3, 0), paso(3, 1), paso(3, 2)])).toBe(0);
  });

  it('subir no cuenta como caer', () => {
    expect(maxDrop(laTorre, [paso(3, 1), paso(2, 1)])).toBe(0);
  });

  /* El salto que «¡Auch! mis rodillas» premia: de la cima al suelo de un tirón. */
  it('caer de la casilla de altura 6 a la de altura 1 son cinco', () => {
    expect(maxDrop(laTorre, [paso(2, 1), paso(3, 1)])).toBe(5);
  });

  it('se queda con la caída MAYOR, no con la última ni con la suma', () => {
    /* 6 → 1 son cinco, y luego 1 → 1 son cero: la respuesta sigue siendo cinco. */
    expect(maxDrop(laTorre, [paso(2, 1), paso(3, 1), paso(3, 2)])).toBe(5);
    /* Dos caídas pequeñas no se suman en una grande. */
    expect(maxDrop(laTorre, [paso(1, 2), paso(1, 3), paso(3, 3)])).toBe(2);
  });

  it('cuenta desde la casilla de salida, no desde el primer paso', () => {
    /* La salida mide 1 y (0,2) mide 4: el primer tramo sube, no cae. */
    expect(maxDrop(laTorre, [paso(0, 2)])).toBe(0);
  });

  it('una partida sin un solo paso no cae nada', () => {
    expect(maxDrop(laTorre, [])).toBe(0);
  });

  /*
   * Una casilla fuera de la rejilla vale cero y no revienta: el recorrido lo
   * construye el intérprete, pero esta función no es quien debe decidir que un
   * recorrido es imposible.
   */
  it('una casilla fuera de la rejilla no rompe el recuento', () => {
    expect(maxDrop(laTorre, [paso(2, 1), paso(99, 99)])).toBe(6);
  });
});
