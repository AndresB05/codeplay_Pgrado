import { isWalkable, type Cell, type Direction, type LevelConfig, type Pose } from './level';

/*
 * Las reglas de movimiento, y viven aparte de la escena a propósito: el J5 las
 * reutiliza para el intérprete, y si nacen enredadas con el pintado, el J5 las
 * reescribe. Aquí no entra `three`, ni JSX, ni estado — que es además lo que
 * permite probarlas, porque jsdom no implementa WebGL y una escena no se puede
 * probar.
 */

/*
 * `high` es la columna demasiado alta: la que avanzar no sube nunca y saltar no
 * sube si le saca dos niveles o más. Va con nombre propio y no disfrazada de muro
 * porque la escena la enseña igual —un topetazo— pero no es lo mismo: un muro no
 * se pisa nunca, y una columna alta se sube desde otra casilla.
 */
export type Blocker = 'wall' | 'gap' | 'edge' | 'high';

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
 * Y no muta la pose que recibe. Es lo que deja al intérprete ejecutar un programa
 * plegando las órdenes sobre una pose inicial y quedarse con las intermedias
 * para animarlas.
 *
 * `climb` es lo único que distingue andar de saltar, y por eso las dos órdenes
 * comparten esta función en vez de repetir las comprobaciones: cuántos niveles
 * puede SUBIR el personaje de una casilla a la siguiente. Bajar no tiene límite
 * —las columnas son pilares y siempre hay dónde pisar—, y caer al vacío no existe:
 * un hueco bloquea igual.
 */
const reach = (config: LevelConfig, pose: Pose, climb: number): AdvanceResult => {
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

  const rise = config.heights[cell.row][cell.column] - config.heights[pose.cell.row][pose.cell.column];

  if (rise > climb) {
    return { pose, blockedBy: 'high' };
  }

  return { pose: { cell, facing: pose.facing }, blockedBy: null };
};

/* Andando no se sube nada: a la misma altura o más abajo. */
export const advance = (config: LevelConfig, pose: Pose): AdvanceResult => reach(config, pose, 0);

/* Saltando se sube un nivel, nunca dos. */
export const jumpAdvance = (config: LevelConfig, pose: Pose): AdvanceResult => reach(config, pose, 1);
