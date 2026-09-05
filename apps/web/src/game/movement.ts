import { isWalkable, type Cell, type Direction, type LevelConfig, type Pose } from './level';

/*
 * Las reglas de movimiento, y viven aparte de la escena a propósito: el J5 las
 * reutiliza para el intérprete, y si nacen enredadas con el pintado, el J5 las
 * reescribe. Aquí no entra `three`, ni JSX, ni estado — que es además lo que
 * permite probarlas, porque jsdom no implementa WebGL y una escena no se puede
 * probar.
 */

export type Blocker = 'wall' | 'gap' | 'edge';

export interface AdvanceResult {
  pose: Pose;
  blockedBy: Blocker | null;
}

export type TurnSide = 'left' | 'right';

const CLOCKWISE: readonly Direction[] = ['north', 'east', 'south', 'west'];

const STEPS: Record<Direction, Cell> = {
  north: { row: -1, column: 0 },
  east: { row: 0, column: 1 },
  south: { row: 1, column: 0 },
  west: { row: 0, column: -1 },
};

export const turn = (facing: Direction, side: TurnSide): Direction => {
  const quarter = side === 'right' ? 1 : CLOCKWISE.length - 1;

  return CLOCKWISE[(CLOCKWISE.indexOf(facing) + quarter) % CLOCKWISE.length];
};

/*
 * Chocar NO es un error: no se lanza y no se devuelve `{ data, error }`, que es
 * la convención de los servicios —piezas que hablan con el exterior y fallan
 * por causas ajenas—. Un muro delante es una regla del juego.
 *
 * El motivo del bloqueo se devuelve aunque hoy no lo lea nadie: la función ya
 * tiene que distinguir los tres casos para decidir, así que sale gratis, y el
 * J5 lo necesita para decirle al niño por qué se paró.
 *
 * Y no muta la pose que recibe. Es lo que dejará al J5 ejecutar un programa
 * plegando las órdenes sobre una pose inicial y quedarse con las intermedias
 * para animarlas.
 */
export const advance = (config: LevelConfig, pose: Pose): AdvanceResult => {
  const step = STEPS[pose.facing];
  const cell: Cell = {
    row: pose.cell.row + step.row,
    column: pose.cell.column + step.column,
  };

  const kind = config.tiles[cell.row]?.[cell.column];

  if (kind === undefined) {
    return { pose, blockedBy: 'edge' };
  }

  if (!isWalkable(kind)) {
    return { pose, blockedBy: kind === 'wall' ? 'wall' : 'gap' };
  }

  return { pose: { cell, facing: pose.facing }, blockedBy: null };
};
