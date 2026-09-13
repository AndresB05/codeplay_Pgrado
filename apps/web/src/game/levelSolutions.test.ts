import { describe, expect, it } from 'vitest';
import level1Migration from '../../../../supabase/migrations/202606030024_level_1_vertical_board.sql?raw';
import level2Migration from '../../../../supabase/migrations/202606030025_seed_level_2_world_1.sql?raw';
import level3Migration from '../../../../supabase/migrations/202606030026_seed_level_3_world_1.sql?raw';
import { countSteps, runProgram, type Order } from './interpreter';
import type { LevelConfig, Pose } from './level';
import { readLevelConfig } from './levelConfig';
import { advance, turn } from './movement';

/*
 * EL `optimalSteps` DE CADA NIVEL SEMBRADO, COMPROBADO EN LAS DOS DIRECCIONES.
 * Nada en la base ni en la aplicación lo valida, y de él sale la puntuación: uno
 * por debajo del real deja el 100 fuera del alcance de cualquier niño sin que
 * salte ningún error, y uno por encima sólo se nota si alguien lo bate.
 *
 * Se lee de la MIGRACIÓN que lo siembra, no de una copia: si el SQL y el test se
 * separaran, la copia seguiría en verde mientras se juega otra cosa.
 */
const seededConfig = (sql: string): LevelConfig => {
  const match = /validation_rules = '([\s\S]*?)'::jsonb/.exec(sql);
  const config = match === null ? null : readLevelConfig(JSON.parse(match[1]));

  if (config === null) {
    throw new Error('La migración ya no siembra un `config` legible.');
  }

  return config;
};

/*
 * El mínimo real, buscado en anchura sobre (casilla, orientación). Avanzar una
 * casilla y girar cuestan 1, que es el recuento del contrato §4.4: `avanzar N`
 * cuesta lo mismo que N veces `avanzar 1`. Chocar gasta pasos sin mover, así que
 * un camino mínimo nunca choca y no hace falta explorarlo.
 */
const minimumSteps = (config: LevelConfig): number | null => {
  const key = ({ cell, facing }: Pose): string => `${cell.row},${cell.column},${facing}`;
  const seen = new Set([key(config.start)]);
  let frontier: Pose[] = [config.start];

  for (let steps = 0; frontier.length > 0; steps += 1) {
    if (
      frontier.some(
        ({ cell }) => cell.row === config.goal.row && cell.column === config.goal.column,
      )
    ) {
      return steps;
    }

    const next: Pose[] = [];

    for (const pose of frontier) {
      const moved = advance(config, pose);
      const candidates = [
        ...(moved.blockedBy === null ? [moved.pose] : []),
        { cell: pose.cell, facing: turn(pose.facing, 'left') },
        { cell: pose.cell, facing: turn(pose.facing, 'right') },
      ];

      for (const candidate of candidates) {
        if (!seen.has(key(candidate))) {
          seen.add(key(candidate));
          next.push(candidate);
        }
      }
    }

    frontier = next;
  }

  return null;
};

const levels: { name: string; sql: string; solution: Order[] }[] = [
  {
    name: 'nivel 1 del mundo 1',
    sql: level1Migration,
    solution: [{ kind: 'advance', steps: 4 }],
  },
  {
    name: 'nivel 2 del mundo 1',
    sql: level2Migration,
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
    sql: level3Migration,
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
];

describe.each(levels)('$name', ({ sql, solution }) => {
  const config = seededConfig(sql);

  it('la solución resuelta a mano llega a la meta con los pasos sembrados', () => {
    expect(runProgram(config, solution).success).toBe(true);
    expect(countSteps(solution)).toBe(config.optimalSteps);
  });

  it('no existe ningún programa más corto que los pasos sembrados', () => {
    expect(minimumSteps(config)).toBe(config.optimalSteps);
  });
});
