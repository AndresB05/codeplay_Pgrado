import { describe, expect, it } from 'vitest';
import {
  countSteps,
  hasLooseStacks,
  readProgram,
  runProgram,
  stepsTaken,
  stoppedIndex,
  type Order,
} from './interpreter';
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
  heights: [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ],
  start: { cell: { row: 4, column: 0 }, facing: 'north' },
  goal: { row: 0, column: 4 },
  optimalSteps: 10,
};

/*
 * Una escalera, para el salto. Hay que saltar para subirla: andando se choca
 * contra la columna de la 1, y saltando se sube de uno en uno.
 *
 *   columna   0   1   2   3
 *   altura    1   2   3   3
 */
const stairs: LevelConfig = {
  tiles: [['floor', 'floor', 'floor', 'floor']],
  heights: [[1, 2, 3, 3]],
  start: { cell: { row: 0, column: 0 }, facing: 'east' },
  goal: { row: 0, column: 3 },
  optimalSteps: 5,
};

/*
 * Un saltar con girar a la derecha y avanzar 1 dentro, con la forma que Blockly
 * escribe para un bloque con cuerpo: `inputs.BODY.block` y, desde ahí, su propia
 * cadena `next`. La salida real la comprueba `blocks.test.ts` contra el editor;
 * aquí se usa para los casos que el editor no produce.
 */
const jumpWith = (body: unknown) => ({
  blocks: {
    languageVersion: 0,
    blocks: [{ type: 'codeplay_jump', x: 0, y: 0, inputs: { BODY: { block: body } } }],
  },
});

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

  /*
   * El caso REAL que dejaba la pantalla en blanco, y por eso el test lleva el
   * `null` literal: mientras se arrastra el bloque de abajo para separarlo,
   * Blockly serializa el `next` del de arriba con `block: null`, el editor
   * publica ese estado intermedio, y `hasLooseStacks` —que corre en el pintado
   * de la escena— reventaba leyéndole el tipo a `null`.
   */
  it('un `next` con el bloque a null acaba la cadena, y no revienta', () => {
    const workspace = {
      blocks: {
        languageVersion: 0,
        blocks: [
          {
            type: 'codeplay_advance',
            id: 'AAA',
            x: 20,
            y: 20,
            fields: { STEPS: 2 },
            next: { block: null },
          },
        ],
      },
    };

    expect(readProgram(workspace)).toEqual({
      orders: [{ kind: 'advance', steps: 2 }],
      rootCount: 1,
    });
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

  it('lee un saltar con su cuerpo en orden', () => {
    const workspace = jumpWith({
      type: 'codeplay_turn_right',
      next: { block: { type: 'codeplay_advance', fields: { STEPS: 1 } } },
    });

    expect(readProgram(workspace)?.orders).toEqual([
      {
        kind: 'jump',
        body: [
          { kind: 'turn', side: 'right' },
          { kind: 'advance', steps: 1 },
        ],
      },
    ]);
  });

  it('un saltar sin nada dentro es un salto vacío, no un programa roto', () => {
    const workspace = {
      blocks: { languageVersion: 0, blocks: [{ type: 'codeplay_jump', x: 0, y: 0 }] },
    };

    expect(readProgram(workspace)?.orders).toEqual([{ kind: 'jump', body: [] }]);
  });

  /* El mismo `null` de un arrastre a mitad, pero dentro del cuerpo. */
  it('un cuerpo con el bloque a null a mitad de un arrastre no revienta', () => {
    expect(readProgram(jumpWith(null))?.orders).toEqual([{ kind: 'jump', body: [] }]);
    expect(
      readProgram(
        jumpWith({ type: 'codeplay_advance', fields: { STEPS: 2 }, next: { block: null } }),
      )?.orders,
    ).toEqual([{ kind: 'jump', body: [{ kind: 'advance', steps: 2 }] }]);
  });

  it('rechaza el programa entero si un saltar lleva otro dentro', () => {
    const nested = jumpWith({
      type: 'codeplay_advance',
      fields: { STEPS: 1 },
      next: { block: { type: 'codeplay_jump' } },
    });

    expect(readProgram(nested)).toBeNull();
  });

  it('rechaza el programa entero si el cuerpo trae un bloque que no entiende', () => {
    expect(readProgram(jumpWith({ type: 'controls_repeat_ext' }))).toBeNull();
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

  it('andando se choca contra la escalera', () => {
    const run = runProgram(stairs, [{ kind: 'advance', steps: 1 }]);

    expect(run.steps).toEqual([
      { pose: stairs.start, blockedBy: 'high', motion: 'walk' },
    ]);
  });

  /*
   * Dos entradas por casilla saltada, despegue y aterrizaje, porque esa casilla
   * cuesta dos: es lo que mantiene el recorrido con tantas entradas como pasos
   * cuenta la lectura.
   */
  it('saltando sube la escalera, con despegue y aterrizaje por casilla', () => {
    const run = runProgram(stairs, [
      { kind: 'jump', body: [{ kind: 'advance', steps: 2 }] },
      { kind: 'advance', steps: 1 },
    ]);

    expect(run.success).toBe(true);
    expect(run.steps.map((step) => step.motion)).toEqual([
      'takeoff',
      'landing',
      'takeoff',
      'landing',
      'walk',
    ]);
    expect(run.steps.map((step) => step.pose.cell.column)).toEqual([0, 1, 1, 2, 3]);
  });

  it('un saltar vacío salta en el sitio con una sola entrada', () => {
    const run = runProgram(stairs, [{ kind: 'jump', body: [] }]);

    expect(run.steps).toEqual([{ pose: stairs.start, blockedBy: null, motion: 'hop' }]);
  });

  it('un salto que no alcanza su casilla aterriza donde despegó', () => {
    const tooHigh: LevelConfig = { ...stairs, heights: [[1, 3, 3, 3]] };
    const run = runProgram(tooHigh, [{ kind: 'jump', body: [{ kind: 'advance', steps: 1 }] }]);

    expect(run.steps.map((step) => [step.motion, step.pose.cell.column, step.blockedBy])).toEqual([
      ['takeoff', 0, null],
      ['landing', 0, 'high'],
    ]);
  });

  it('un giro dentro de un salto gira al aterrizar, sin cambiar de casilla', () => {
    const run = runProgram(stairs, [{ kind: 'jump', body: [{ kind: 'turn', side: 'left' }] }]);

    expect(run.steps).toEqual([
      { pose: stairs.start, blockedBy: null, motion: 'takeoff' },
      { pose: { cell: stairs.start.cell, facing: 'north' }, blockedBy: null, motion: 'landing' },
    ]);
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
      heights: [[1, 1]],
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

  it('un saltar vacío cuesta un paso', () => {
    expect(countSteps([{ kind: 'jump', body: [] }])).toBe(1);
  });

  /* La regla del usuario: saltar ahorra bloques, no pasos. */
  it('un saltar con avanzar 2 cuesta lo mismo que dos saltar con avanzar 1', () => {
    const together: Order[] = [{ kind: 'jump', body: [{ kind: 'advance', steps: 2 }] }];
    const apart: Order[] = [
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
    ];

    expect(countSteps(together)).toBe(4);
    expect(countSteps(apart)).toBe(4);
  });

  it('un saltar con girar y avanzar 1 dentro cuesta cuatro', () => {
    expect(
      countSteps([
        {
          kind: 'jump',
          body: [
            { kind: 'turn', side: 'right' },
            { kind: 'advance', steps: 1 },
          ],
        },
      ]),
    ).toBe(4);
  });

  /*
   * Y la misma atadura que los dos de arriba, con saltos: se rompe el día que un
   * paso saltado deje UNA entrada en vez de dos, que es el atajo natural al
   * animarlo.
   */
  it('cuenta lo mismo que la ejecución con saltos llenos, vacíos y fallidos', () => {
    const orders: Order[] = [
      { kind: 'jump', body: [] },
      { kind: 'jump', body: [{ kind: 'advance', steps: 3 }] },
      { kind: 'jump', body: [{ kind: 'turn', side: 'left' }, { kind: 'advance', steps: 1 }] },
      { kind: 'advance', steps: 2 },
    ];

    expect(countSteps(orders)).toBe(runProgram(stairs, orders).steps.length);
  });
});

/*
 * El contador de la pantalla, que es lo único que este módulo sabe de ella. Los
 * cinco estados en los que puede pillarle el niño, y el borde que este paso vino
 * a evitar: al terminar, el índice de la escena vale `steps.length`, así que la
 * cuenta de «mientras corre» daría un paso de más.
 */
describe('stepsTaken', () => {
  const orders = readProgram(PROGRAM_A)!.orders;
  const run = runProgram(board, orders);

  it('sin recorrido dice cero, que es lo que enseña en reposo', () => {
    expect(stepsTaken(null, 0, false)).toBe(0);
  });

  it('el primer paso es uno y no cero', () => {
    expect(stepsTaken(run, 0, true)).toBe(1);
  });

  it('a mitad cuenta el paso en curso', () => {
    expect(stepsTaken(run, 4, true)).toBe(5);
  });

  it('detenido se queda en los pasos dados hasta ahí', () => {
    expect(stepsTaken(run, 5, false)).toBe(5);
  });

  it('terminado se queda en lo que costó, y NO en un paso más', () => {
    expect(stepsTaken(run, run.steps.length, false)).toBe(10);
  });

  /*
   * ESTE TEST NO PUEDE FALLAR HOY, y por eso está, igual que los dos de
   * `countSteps`: el número en el que el contador se queda y el que el resultado
   * enseña son la misma magnitud, y el spec lo promete. Se rompe el día que
   * alguien haga que el contador salga del recorrido en vez de las órdenes, que
   * es el atajo que este proyecto lleva evitando desde el J6.
   */
  it('el número en el que se queda es el recuento que enseña el resultado', () => {
    expect(stepsTaken(run, run.steps.length, false)).toBe(countSteps(orders));
  });
});

/*
 * Dónde se planta un recorrido detenido. El borde que importa es el salto: parar
 * entre su despegue y su aterrizaje dejaría al personaje a media altura al
 * reanudar.
 */
describe('stoppedIndex', () => {
  const orders: Order[] = [
    { kind: 'advance', steps: 1 },
    { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
    { kind: 'turn', side: 'right' },
  ];
  const run = runProgram(board, orders);

  it('andando se planta en la casilla del paso en curso', () => {
    expect(run.steps[0].motion).toBe('walk');
    expect(stoppedIndex(run, 0)).toBe(1);
  });

  it('en un despegue se salta también el aterrizaje', () => {
    expect(run.steps[1].motion).toBe('takeoff');
    expect(stoppedIndex(run, 1)).toBe(3);
  });

  it('en un aterrizaje se planta en la casilla donde cae', () => {
    expect(run.steps[2].motion).toBe('landing');
    expect(stoppedIndex(run, 2)).toBe(3);
  });

  it('en el último paso no se pasa del final', () => {
    expect(stoppedIndex(run, run.steps.length - 1)).toBe(run.steps.length);
  });

  it('el contador detenido en un despegue cuenta el salto entero', () => {
    expect(stepsTaken(run, stoppedIndex(run, 1), false)).toBe(3);
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
