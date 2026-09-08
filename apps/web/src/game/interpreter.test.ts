import { describe, expect, it } from 'vitest';
import { countSteps, hasLooseStacks, readProgram, runProgram, type Order } from './interpreter';
import type { LevelConfig } from './level';
import { sealProgram } from './program';

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

/*
 * Un paso al este desde la salida deja el muro de la fila 3 justo delante, así
 * que el `avanzar 4` no da ninguna de sus cuatro casillas. Ocho pasos ordenados
 * y sólo cuatro conseguidos: es el programa con el que se ve que las dos cuentas
 * hablan de lo ordenado.
 */
const BLOCKED_PROGRAM: Order[] = [
  { kind: 'turn', side: 'right' },
  { kind: 'advance', steps: 1 },
  { kind: 'turn', side: 'left' },
  { kind: 'advance', steps: 4 },
  { kind: 'turn', side: 'right' },
];

const stack = (type: string, y: number, x = 0) => ({ type, x, y });

describe('readProgram', () => {
  it('lee el PROGRAMA A del contrato bajando por la cadena de bloques', () => {
    expect(readProgram(PROGRAM_A)).toEqual({
      orders: [
        { kind: 'turn', side: 'right' },
        { kind: 'advance', steps: 4 },
        { kind: 'turn', side: 'left' },
        { kind: 'advance', steps: 4 },
      ],
      rootCount: 1,
    });
  });

  it('un lienzo vacío es un programa sin órdenes, no un programa roto', () => {
    expect(readProgram({})).toEqual({ orders: [], rootCount: 0 });
  });

  it('con varios montones sueltos ejecuta el que empieza más arriba', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [stack('codeplay_turn_right', 120), stack('codeplay_turn_left', 40)],
      },
    };

    expect(readProgram(workspace)).toEqual({
      orders: [{ kind: 'turn', side: 'left' }],
      rootCount: 2,
    });
  });

  it('a la misma altura ejecuta el de más a la izquierda', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [stack('codeplay_turn_right', 40, 300), stack('codeplay_turn_left', 40, 20)],
      },
    };

    expect(readProgram(workspace)).toEqual({
      orders: [{ kind: 'turn', side: 'left' }],
      rootCount: 2,
    });
  });

  /*
   * El montón que NO se ejecuta se cuenta igual, y ése es el punto: la escena no
   * puede avisar de que sobraron bloques con un número que sólo mira lo que sí
   * se ejecutó.
   */
  it('cuenta los montones que no ejecuta, que es de lo que hay que avisar', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [
          stack('codeplay_turn_left', 10),
          stack('codeplay_turn_right', 80),
          stack('codeplay_turn_right', 150),
        ],
      },
    };

    expect(readProgram(workspace)?.rootCount).toBe(3);
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
    const run = runProgram(board, readProgram(PROGRAM_A)!.orders);

    expect(run.success).toBe(true);
    expect(run.steps[run.steps.length - 1].pose.cell).toEqual({ row: 0, column: 4 });
    expect(run.steps.every((step) => step.blockedBy === null)).toBe(true);
  });

  /*
   * La forma del recorrido no rompe el recuento que se hace LEYENDO: los diez
   * pasos que el contrato §4.4 cuenta para el PROGRAMA A son las diez entradas
   * que la ejecución produce, y son además los `optimalSteps` del tablero. Que
   * los dos números coincidan de verdad lo fija `countSteps`, más abajo.
   */
  it('produce tantas entradas como pasos cuenta el contrato', () => {
    const run = runProgram(board, readProgram(PROGRAM_A)!.orders);

    expect(run.steps).toHaveLength(board.optimalSteps);
  });

  it('cuenta las casillas que no pudo dar y sigue con la orden siguiente', () => {
    const run = runProgram(board, BLOCKED_PROGRAM);

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
      ...readProgram(PROGRAM_A)!.orders,
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

describe('countSteps', () => {
  it('cuenta el PROGRAMA A del contrato en diez pasos', () => {
    expect(countSteps(readProgram(PROGRAM_A)!.orders)).toBe(10);
  });

  it('un giro cuesta un paso', () => {
    expect(countSteps([{ kind: 'turn', side: 'left' }])).toBe(1);
  });

  it('avanzar N cuesta N pasos', () => {
    expect(countSteps([{ kind: 'advance', steps: 4 }])).toBe(4);
  });

  it('un programa sin órdenes cuesta cero pasos', () => {
    expect(countSteps([])).toBe(0);
  });

  it('cuenta sin tablero: el mismo programa cuesta lo mismo lo pise donde lo pise', () => {
    const otherBoard: LevelConfig = {
      tiles: [['floor', 'floor']],
      start: { cell: { row: 0, column: 0 }, facing: 'east' },
      goal: { row: 0, column: 1 },
      optimalSteps: 1,
    };

    const orders = readProgram(PROGRAM_A)!.orders;

    expect(countSteps(orders)).toBe(10);
    expect(runProgram(otherBoard, orders).steps).toHaveLength(10);
  });

  /*
   * LOS DOS TESTS DE ABAJO NO PUEDEN FALLAR HOY, y por eso están.
   *
   * `runProgram` empuja una entrada por giro y N por `avanzar N`, que es la
   * misma tabla que suma `countSteps`, así que las dos cuentas coinciden por
   * construcción. Lo que fijan es esa construcción: se rompen el día que alguien
   * haga que chocar DETENGA el programa —que es lo natural al escribir un
   * intérprete, y por eso el módulo ya lleva un comentario avisando—. Sin ellos,
   * el síntoma aparecería en el J10 como un número distinto en la pantalla del
   * niño y en la puntuación del servidor, sin nada que apunte a la causa.
   */
  it('cuenta lo mismo que pasos recorre la ejecución del PROGRAMA A', () => {
    const orders = readProgram(PROGRAM_A)!.orders;

    expect(countSteps(orders)).toBe(runProgram(board, orders).steps.length);
  });

  it('cuenta lo mismo que la ejecución aunque el programa choque', () => {
    expect(countSteps(BLOCKED_PROGRAM)).toBe(runProgram(board, BLOCKED_PROGRAM).steps.length);
  });
});

/*
 * Lo único que se le pregunta al lienzo mientras el niño construye, y los tres
 * casos en que la respuesta es «nada que señalar». Están aquí y no en la escena
 * porque ahí no se pueden probar: jsdom no implementa WebGL.
 */
describe('hasLooseStacks', () => {
  it('sin programa todavía no hay nada que señalar', () => {
    expect(hasLooseStacks(null)).toBe(false);
  });

  it('un sobre con una versión de formato desconocida no señala nada', () => {
    expect(hasLooseStacks({ formatVersion: 'grid-blockly-99', workspace: PROGRAM_A })).toBe(false);
  });

  it('un programa que no se entiende no señala nada', () => {
    const workspace = {
      blocks: { languageVersion: 0, blocks: [stack('bloque_de_otro_juego', 0)] },
    };

    expect(hasLooseStacks(sealProgram(workspace))).toBe(false);
  });

  it('un lienzo vacío no tiene bloques de sobra', () => {
    expect(hasLooseStacks(sealProgram({}))).toBe(false);
  });

  it('una sola secuencia no tiene bloques de sobra', () => {
    expect(hasLooseStacks(sealProgram(PROGRAM_A))).toBe(false);
  });

  it('dos montones sueltos sí, que es de lo que hay que avisar', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [
          { type: 'codeplay_advance', x: 0, y: 200, fields: { STEPS: 4 } },
          stack('codeplay_turn_left', 40),
        ],
      },
    };

    expect(hasLooseStacks(sealProgram(workspace))).toBe(true);
  });
});
