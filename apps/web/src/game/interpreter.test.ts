import { describe, expect, it } from 'vitest';
import { readProgram, runProgram, type Order } from './interpreter';
import type { LevelConfig } from './level';

/*
 * El intérprete es puro, así que se prueba entero: la escena que lo usa no, por
 * lo de siempre —jsdom no implementa WebGL—.
 *
 * El tablero se escribe aquí y NO se importa `debugLevel`, por el mismo motivo
 * que en `movement.test.ts`: un test atado a la rejilla de pega se rompería el
 * día que el J7 la borre. Éste es el tablero del contrato §4.2, que es el mismo
 * dibujo.
 *
 *          O                             E
 *      ┌───────────────────────────────────┐
 *    N │  .     .     .     ▓    META      │
 *      │  .     ▓     .     .     .        │
 *      │  .     .    hueco  .     .        │
 *      │  .     ▓     .     ▓     .        │
 *    S │ SALIDA .     .     .     .        │
 *      └───────────────────────────────────┘
 */
const board: LevelConfig = {
  tiles: [
    ['floor', 'floor', 'floor', 'wall', 'floor'],
    ['floor', 'wall', 'floor', 'floor', 'floor'],
    ['floor', 'floor', 'gap', 'floor', 'floor'],
    ['floor', 'wall', 'floor', 'wall', 'floor'],
    ['floor', 'floor', 'floor', 'floor', 'floor'],
  ],
  start: { cell: { row: 4, column: 0 }, facing: 'north' },
  goal: { row: 0, column: 4 },
  optimalSteps: 10,
};

/*
 * El PROGRAMA A del contrato §4.4 —girar derecha, avanzar 4, girar izquierda,
 * avanzar 4— tal y como el editor lo serializa, copiado de §4.3 sin tocar una
 * coma. Pegar la salida real y no una construida a mano es lo que hace que este
 * test pruebe el formato del contrato y no la idea que el intérprete tiene de él.
 */
const PROGRAM_A = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: 'codeplay_turn_right',
        id: 'q`?B*tqQ(NK]!y$45l:L',
        x: 0,
        y: 0,
        next: {
          block: {
            type: 'codeplay_advance',
            id: 'wzIPDa)Y5@bF]AG}yj2O',
            fields: { STEPS: 4 },
            next: {
              block: {
                type: 'codeplay_turn_left',
                id: '+{JkZ7]Vb}a_X5(SMDfi',
                next: {
                  block: {
                    type: 'codeplay_advance',
                    id: 'y]7[v^m-bD:=:x()v3dL',
                    fields: { STEPS: 4 },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

const stack = (type: string, y: number, x = 0) => ({ type, x, y });

describe('readProgram', () => {
  it('lee el PROGRAMA A del contrato bajando por la cadena de bloques', () => {
    expect(readProgram(PROGRAM_A)).toEqual([
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 4 },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 4 },
    ]);
  });

  it('un lienzo vacío es un programa sin órdenes, no un programa roto', () => {
    expect(readProgram({})).toEqual([]);
  });

  it('con varios montones sueltos ejecuta el que empieza más arriba', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [stack('codeplay_turn_right', 120), stack('codeplay_turn_left', 40)],
      },
    };

    expect(readProgram(workspace)).toEqual([{ kind: 'turn', side: 'left' }]);
  });

  it('a la misma altura ejecuta el de más a la izquierda', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [stack('codeplay_turn_right', 40, 300), stack('codeplay_turn_left', 40, 20)],
      },
    };

    expect(readProgram(workspace)).toEqual([{ kind: 'turn', side: 'left' }]);
  });

  it('rechaza el programa entero si encuentra un bloque que no entiende', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'codeplay_turn_right',
            next: { block: { type: 'controls_repeat_ext' } },
          },
        ],
      },
    };

    expect(readProgram(workspace)).toBeNull();
  });

  it('rechaza el programa entero si el número de casillas no lo es', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [{ type: 'codeplay_advance', fields: { STEPS: '4' } }],
      },
    };

    expect(readProgram(workspace)).toBeNull();
  });
});

describe('runProgram', () => {
  it('resuelve el tablero del contrato con el PROGRAMA A', () => {
    const orders = readProgram(PROGRAM_A);
    const run = runProgram(board, orders!);

    expect(run.success).toBe(true);
    expect(run.steps[run.steps.length - 1].pose.cell).toEqual({ row: 0, column: 4 });
    expect(run.steps.every((step) => step.blockedBy === null)).toBe(true);
  });

  /*
   * La comprobación de que la forma del recorrido no rompe el recuento que el J6
   * hará LEYENDO el programa: los diez pasos que el contrato §4.4 cuenta para el
   * PROGRAMA A son las diez entradas que la ejecución produce. Contar aquí sería
   * escribir el J6; comprobar que los dos números pueden coincidir, no.
   */
  it('produce tantas entradas como pasos cuenta el contrato', () => {
    const run = runProgram(board, readProgram(PROGRAM_A)!);

    expect(run.steps).toHaveLength(board.optimalSteps);
  });

  it('cuenta las casillas que no pudo dar y sigue con la orden siguiente', () => {
    // Un paso al este desde la salida deja el muro de la fila 3 justo delante.
    const orders: Order[] = [
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 4 },
      { kind: 'turn', side: 'right' },
    ];

    const run = runProgram(board, orders);

    expect(run.steps).toHaveLength(8);
    expect(run.steps.slice(3, 7).map((step) => step.blockedBy)).toEqual([
      'wall',
      'wall',
      'wall',
      'wall',
    ]);
    expect(run.steps[6].pose.cell).toEqual({ row: 4, column: 1 });
    expect(run.steps[7].pose.facing).toBe('east');
  });

  it('un giro no cambia de casilla y siempre se puede dar', () => {
    const run = runProgram(board, [{ kind: 'turn', side: 'left' }]);

    expect(run.steps).toHaveLength(1);
    expect(run.steps[0].pose).toEqual({ cell: board.start.cell, facing: 'west' });
    expect(run.steps[0].blockedBy).toBeNull();
  });

  it('pisar la meta cuenta aunque el programa siga y acabe en otra casilla', () => {
    const orders: Order[] = [
      ...readProgram(PROGRAM_A)!,
      { kind: 'turn', side: 'right' },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
    ];

    const run = runProgram(board, orders);

    expect(run.success).toBe(true);
    expect(run.steps[run.steps.length - 1].pose.cell).toEqual({ row: 1, column: 4 });
  });

  it('no se llega si el recorrido nunca pisa la meta', () => {
    const run = runProgram(board, [{ kind: 'advance', steps: 2 }]);

    expect(run.success).toBe(false);
  });

  it('un programa sin órdenes no mueve a nadie ni llega a ninguna parte', () => {
    const run = runProgram(board, []);

    expect(run.steps).toEqual([]);
    expect(run.success).toBe(false);
  });

  it('no saca al personaje del tablero por el borde', () => {
    const run = runProgram(board, [{ kind: 'turn', side: 'left' }, { kind: 'advance', steps: 1 }]);

    expect(run.steps[1].blockedBy).toBe('edge');
    expect(run.steps[1].pose.cell).toEqual(board.start.cell);
  });
});
