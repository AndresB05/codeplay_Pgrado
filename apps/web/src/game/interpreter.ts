import { ADVANCE_BLOCK, STEPS_FIELD, TURN_LEFT_BLOCK, TURN_RIGHT_BLOCK } from './blockTypes';
import type { Cell, LevelConfig, Pose } from './level';
import { advance, turn, type Blocker, type TurnSide } from './movement';
import type { WorkspaceState } from './program';

/*
 * El intérprete: lee el programa que serializa el editor y lo ejecuta sobre el
 * tablero. **Puro** — aquí no entran Blockly, `three` ni JSX, y por eso se puede
 * probar, igual que `movement.ts`.
 *
 * LA FRONTERA CON `program.ts`. Aquél abre el sobre y se niega a propósito a
 * saber qué hay dentro; éste lee la carta. La forma la fija el contrato §4.3 y
 * conocerla es el trabajo de este archivo, no de aquél: si viviera allí, el J8 y
 * el J9 —que sólo abren y cierran el sobre— cargarían con ella sin usarla.
 *
 * Y no reimplementa ninguna regla de movimiento: `turn` y `advance` ya deciden
 * qué se puede pisar. Ejecutar es plegarlas sobre la pose inicial quedándose con
 * las intermedias.
 */

export type Order = { kind: 'advance'; steps: number } | { kind: 'turn'; side: TurnSide };

export interface ProgramReading {
  orders: Order[];
  /*
   * Cuántos montones sueltos traía el lienzo. Sólo se ejecuta uno (§4.3), y sin
   * este número la regla FALLA EN SILENCIO: un bloque olvidado más arriba se
   * ejecuta en lugar del programa y el niño no puede distinguir «mi programa
   * está mal» de «mi programa no se ejecutó».
   */
  rootCount: number;
}

export interface RunStep {
  pose: Pose;
  blockedBy: Blocker | null;
}

export interface Run {
  steps: RunStep[];
  success: boolean;
}

/*
 * Lo que hay dentro del sobre, tal y como el contrato §4.3 lo transcribe de una
 * salida real. Se declara laxo porque llega de fuera: lo estrecha `readOrder`.
 */
interface SerializedBlock {
  type?: unknown;
  fields?: unknown;
  next?: { block?: SerializedBlock };
  x?: unknown;
  y?: unknown;
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/*
 * Los bloques SUELTOS del lienzo, que es lo único que `workspace.blocks.blocks`
 * trae: el resto de la secuencia cuelga de `next.block` (§4.3). Un lienzo vacío
 * se serializa `{}`, y eso no es un programa roto: es «sin programa de partida».
 */
const readRoots = (workspace: WorkspaceState): SerializedBlock[] | null => {
  const container = workspace.blocks;

  if (container === undefined) {
    return [];
  }

  if (!isObject(container)) {
    return null;
  }

  const roots = container.blocks;

  if (roots === undefined) {
    return [];
  }

  if (!Array.isArray(roots)) {
    return null;
  }

  return roots as SerializedBlock[];
};

const coordinate = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0;

/*
 * Con varios montones se ejecuta el que empieza MÁS ARRIBA, y a igual altura el
 * de más a la izquierda. §4.3 dejó esta decisión «al paso que ejecute» y la toma
 * aquí el J5, escrita en el contrato.
 *
 * El orden del array no sirve: es de construcción, no de pantalla, así que dos
 * lienzos idénticos a la vista ejecutarían montones distintos según en qué orden
 * se armaron. La regla tiene que poder verse.
 */
const firstOnCanvas = (roots: SerializedBlock[]): SerializedBlock | undefined =>
  roots.reduce<SerializedBlock | undefined>((best, block) => {
    if (best === undefined) {
      return block;
    }

    const y = coordinate(block.y);
    const bestY = coordinate(best.y);

    if (y !== bestY) {
      return y < bestY ? block : best;
    }

    return coordinate(block.x) < coordinate(best.x) ? block : best;
  }, undefined);

const readOrder = (block: SerializedBlock): Order | null => {
  if (block.type === TURN_LEFT_BLOCK) {
    return { kind: 'turn', side: 'left' };
  }

  if (block.type === TURN_RIGHT_BLOCK) {
    return { kind: 'turn', side: 'right' };
  }

  if (block.type !== ADVANCE_BLOCK) {
    return null;
  }

  const steps = isObject(block.fields) ? block.fields[STEPS_FIELD] : undefined;

  if (typeof steps !== 'number' || !Number.isInteger(steps) || steps < 1) {
    return null;
  }

  return { kind: 'advance', steps };
};

/*
 * Devuelve `null` cuando encuentra algo que no entiende —un tipo de bloque que
 * no es de los tres, o un número que no lo es—, y rechaza el programa ENTERO,
 * como `openProgram` con el sobre. Saltarse el bloque raro dejaría un programa
 * ejecutado a medias, jugado hasta el final y con un resultado que nadie podría
 * volver a explicar; es lo que el contrato §4.2 manda con una casilla de clase
 * desconocida y por el mismo motivo.
 *
 * Hoy el único productor es nuestro editor. El día que el programa venga de la
 * base (J8) o de un intento guardado, este camino deja de ser teórico.
 *
 * Devuelve además CUÁNTOS montones había, que es información que `readRoots` ya
 * tiene y que `firstOnCanvas` descarta al elegir uno. Sacarla por aquí es lo que
 * permite avisar de los bloques sueltos: contarlos fuera obligaría a repetir
 * `readRoots`, que además de contar valida la forma.
 */
export const readProgram = (workspace: WorkspaceState): ProgramReading | null => {
  const roots = readRoots(workspace);

  if (roots === null) {
    return null;
  }

  const orders: Order[] = [];
  let block = firstOnCanvas(roots);

  while (block !== undefined) {
    const order = readOrder(block);

    if (order === null) {
      return null;
    }

    orders.push(order);
    block = block.next?.block;
  }

  return { orders, rootCount: roots.length };
};

/*
 * El recuento del contrato §4.4: `avanzar N` son N pasos y `girar` es uno.
 *
 * Existe pudiendo usarse `runProgram(...).steps.length`, que da el mismo número,
 * porque §4.4 define el recuento como una LECTURA del programa —sin tablero,
 * sin pose y sin ejecutar nada—, y eso es lo que el servidor tendrá que hacer
 * para puntuar (J10). Sacar de la ejecución el número que se le enseña al niño
 * lo ataría a un motor que el servidor no corre, y entonces los dos lados sólo
 * coincidirían por suerte.
 */
export const countSteps = (orders: Order[]): number =>
  orders.reduce((total, order) => total + (order.kind === 'advance' ? order.steps : 1), 0);

const isGoal = (goal: Cell, cell: Cell): boolean =>
  goal.row === cell.row && goal.column === cell.column;

/*
 * Una entrada por paso ORDENADO, nunca por paso conseguido: `avanzar 4` contra
 * un muro que está a dos casillas deja cuatro, y las dos últimas repiten la pose
 * con su `blockedBy`. Es el contrato §4.4 metido en la estructura —«se cuentan
 * los pasos ordenados, no los ejecutados»—, y por eso chocar NO detiene el
 * programa: lo natural al escribir esto es parar, y parar hace que el recuento
 * del cliente y el del servidor dejen de poder coincidir con lo que se vio.
 *
 * Y pisar la meta cuenta aunque el programa siga y acabe en otra casilla, que es
 * la otra mitad de la misma regla: pasarse de largo es ineficiencia, y la
 * ineficiencia se paga en la puntuación, no invalidando el nivel.
 */
export const runProgram = (config: LevelConfig, orders: Order[]): Run => {
  const steps: RunStep[] = [];
  let pose = config.start;
  let success = isGoal(config.goal, pose.cell);

  orders.forEach((order) => {
    if (order.kind === 'turn') {
      pose = { cell: pose.cell, facing: turn(pose.facing, order.side) };
      steps.push({ pose, blockedBy: null });

      return;
    }

    for (let step = 0; step < order.steps; step += 1) {
      const result = advance(config, pose);

      pose = result.pose;
      steps.push({ pose, blockedBy: result.blockedBy });
      success = success || isGoal(config.goal, pose.cell);
    }
  });

  return { steps, success };
};
