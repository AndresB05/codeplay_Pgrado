import { describe, expect, it } from 'vitest';
import world1Migration from '../../../../supabase/migrations/202606030027_world_1_levels_format_2.sql?raw';
import world2Migration from '../../../../supabase/migrations/202606030029_world_2_levels.sql?raw';
import world3Migration from '../../../../supabase/migrations/202606030030_world_3_levels_1_2.sql?raw';
import world3Level3Migration from '../../../../supabase/migrations/202606030032_world_3_level_3_retune.sql?raw';
import { countSteps, runProgram, type Order } from './interpreter';
import type { LevelConfig, Pose } from './level';
import { readLevelConfig } from './levelConfig';
import { advance, jumpAdvance, turn } from './movement';

/*
 * EL `optimalSteps` DE CADA NIVEL SEMBRADO, COMPROBADO EN LAS DOS DIRECCIONES.
 * Nada en la base ni en la aplicación lo valida, y de él sale la puntuación: uno
 * por debajo del real deja el 100 fuera del alcance de cualquier niño sin que
 * salte ningún error, y uno por encima sólo se nota si alguien lo bate.
 *
 * Se lee de la MIGRACIÓN que lo siembra, no de una copia: si el SQL y el test se
 * separaran, la copia seguiría en verde mientras se juega otra cosa. Los tres del
 * mundo 1 viven desde la versión 2 del formato en la 0027.
 */
const seededConfig = (sql: string, sortOrder: number): LevelConfig => {
  const update = sql
    .split(/update public\.levels/)
    .find((block) => block.includes(`and sort_order = ${sortOrder};`));
  const match = update === undefined ? null : /validation_rules = '([\s\S]*?)'::jsonb/.exec(update);
  const config = match === null ? null : readLevelConfig(JSON.parse(match[1]));

  if (config === null) {
    throw new Error(`La migración ya no siembra un \`config\` legible para el nivel ${sortOrder}.`);
  }

  return config;
};

/*
 * El mínimo real, buscado sobre (casilla, orientación) con lo que cuesta cada
 * movimiento según el contrato §4.4: andar una casilla o girar, 1; saltar a la
 * casilla siguiente, 2. `avanzar N` cuesta lo mismo que N veces `avanzar 1`, y un
 * salto con `avanzar N` lo mismo que N saltos, así que basta con movimientos de
 * una casilla.
 *
 * Lo que NO se explora, y por qué no cambia el mínimo: chocar gasta pasos sin
 * mover; saltar en el sitio o saltar girando cuesta más que no hacerlo o que
 * girar andando.
 *
 * Con dos costes distintos ya no vale la búsqueda en anchura de antes: se expande
 * siempre el estado más barato pendiente, que es Dijkstra con una cola escrita a
 * mano —los tableros son de veinticinco casillas—.
 */
const minimumSteps = (config: LevelConfig): number | null => {
  const key = ({ cell, facing }: Pose): string => `${cell.row},${cell.column},${facing}`;
  const best = new Map<string, number>([[key(config.start), 0]]);
  const pending: { pose: Pose; cost: number }[] = [{ pose: config.start, cost: 0 }];

  while (pending.length > 0) {
    pending.sort((a, b) => a.cost - b.cost);
    const { pose, cost } = pending.shift()!;

    if (cost > (best.get(key(pose)) ?? Infinity)) {
      continue;
    }

    if (pose.cell.row === config.goal.row && pose.cell.column === config.goal.column) {
      return cost;
    }

    const walked = advance(config, pose);
    const jumped = jumpAdvance(config, pose);
    const moves: { pose: Pose; cost: number }[] = [
      { pose: { cell: pose.cell, facing: turn(pose.facing, 'left') }, cost: cost + 1 },
      { pose: { cell: pose.cell, facing: turn(pose.facing, 'right') }, cost: cost + 1 },
      ...(walked.blockedBy === null ? [{ pose: walked.pose, cost: cost + 1 }] : []),
      ...(jumped.blockedBy === null ? [{ pose: jumped.pose, cost: cost + 2 }] : []),
    ];

    for (const move of moves) {
      if (move.cost < (best.get(key(move.pose)) ?? Infinity)) {
        best.set(key(move.pose), move.cost);
        pending.push(move);
      }
    }
  }

  return null;
};

const levels: { name: string; config: LevelConfig; solution: Order[] }[] = [
  {
    name: 'nivel 1 del mundo 1',
    config: seededConfig(world1Migration, 1),
    solution: [{ kind: 'advance', steps: 4 }],
  },
  {
    name: 'nivel 2 del mundo 1',
    config: seededConfig(world1Migration, 2),
    solution: [
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 4 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 2 },
    ],
  },
  {
    name: 'nivel 3 del mundo 1',
    config: seededConfig(world1Migration, 3),
    solution: [
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 3 },
    ],
  },
  /*
   * EL QUE ESTE TEST CAZÓ ANTES DE SEMBRARSE. A mano se dio por bueno el camino
   * por la esquina, 17 pasos; la búsqueda encontró el salto directo del escalón a
   * la meseta, 15. Es exactamente el fallo que esto existe para evitar.
   */
  {
    name: 'nivel 1 del mundo 2',
    config: seededConfig(world2Migration, 1),
    solution: [
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 2 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
    ],
  },
  {
    name: 'nivel 2 del mundo 2',
    config: seededConfig(world2Migration, 2),
    solution: [
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 2 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 3 },
      { kind: 'turn', side: 'right' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 3 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 2 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 2 }] },
    ],
  },
  {
    name: 'nivel 3 del mundo 2',
    config: seededConfig(world2Migration, 3),
    solution: [
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 3 },
      { kind: 'turn', side: 'left' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'advance', steps: 1 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 1 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'right' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
    ],
  },
  /*
   * LOS DEL MUNDO 3, los primeros con máximo de pasos. El máximo NO entra en esta
   * búsqueda y no hace falta que entre: `stepLimit` vale lo mismo que
   * `optimalSteps` en los dos, así que el mínimo que encuentre es exactamente lo
   * que el nivel concede. Si algún día se sembrara un nivel con margen, esto
   * seguiría comprobando lo suyo —que el número apuntado es el mejor posible—,
   * que es de lo que sale la puntuación.
   *
   * EL NIVEL 1 TIENE DOS CAMINOS y este test es el que fija cuál gana: el de
   * frente —por el sur y el este— tiene un giro menos y cuesta 11 por los dos
   * saltos de los pilares; el otro, 10.
   */
  {
    name: 'nivel 1 del mundo 3',
    config: seededConfig(world3Migration, 1),
    solution: [
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 4 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 4 },
    ],
  },
  {
    name: 'nivel 2 del mundo 3',
    config: seededConfig(world3Migration, 2),
    solution: [
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 3 },
      { kind: 'turn', side: 'right' },
      { kind: 'advance', steps: 1 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'advance', steps: 1 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'turn', side: 'left' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
    ],
  },
  /*
   * EL ÚLTIMO DE LOS NUEVE, con el tablero que le dejó la 0032. Catorce pasos, y
   * lo que de verdad decide este mundo: hay DOS programas distintos de catorce
   * de entre 48 recorridos posibles, y dos de esos 48 se quedan a un solo paso.
   * El usuario rechazó a propósito las variantes de un único camino correcto
   * —«es como darle una línea recta entre caminos curvados»—.
   *
   * La solución de aquí PASA DE LARGO HACIA ARRIBA: sube al escalón de altura 4,
   * baja andando al de 3 y salta a la meta. Es el movimiento que la 0032 añadió.
   */
  {
    name: 'nivel 3 del mundo 3',
    config: seededConfig(world3Level3Migration, 3),
    solution: [
      { kind: 'turn', side: 'left' },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'right' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 2 }] },
      { kind: 'advance', steps: 1 },
      { kind: 'turn', side: 'left' },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
      { kind: 'advance', steps: 1 },
      { kind: 'jump', body: [{ kind: 'advance', steps: 1 }] },
    ],
  },
];

describe.each(levels)('$name', ({ config, solution }) => {
  it('la solución resuelta a mano llega a la meta con los pasos sembrados', () => {
    expect(runProgram(config, solution).success).toBe(true);
    expect(countSteps(solution)).toBe(config.optimalSteps);
  });

  it('no existe ningún programa más corto que los pasos sembrados', () => {
    expect(minimumSteps(config)).toBe(config.optimalSteps);
  });
});

/*
 * La búsqueda misma, contra un tablero donde saltar es obligatorio: si no supiera
 * saltar, no llegaría; si contara el salto como un paso, daría menos.
 *
 *   columna   0   1   2   3
 *   altura    1   2   3   3
 */
describe('minimumSteps con subidas', () => {
  const stairs: LevelConfig = {
    tiles: [['floor', 'floor', 'floor', 'floor']],
    heights: [[1, 2, 3, 3]],
    start: { cell: { row: 0, column: 0 }, facing: 'east' },
    goal: { row: 0, column: 3 },
    optimalSteps: 5,
  };

  it('sube saltando y cuenta cada salto como dos', () => {
    expect(minimumSteps(stairs)).toBe(5);
    expect(
      countSteps([
        { kind: 'jump', body: [{ kind: 'advance', steps: 2 }] },
        { kind: 'advance', steps: 1 },
      ]),
    ).toBe(5);
  });
});
