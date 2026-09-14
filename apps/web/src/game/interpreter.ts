import {
  ADVANCE_BLOCK,
  JUMP_BLOCK,
  JUMP_BODY,
  STEPS_FIELD,
  TURN_LEFT_BLOCK,
  TURN_RIGHT_BLOCK,
} from './blockTypes';
import type { Cell, LevelConfig, Pose } from './level';
import { advance, jumpAdvance, turn, type Blocker, type TurnSide } from './movement';
import { openProgram, type Program, type WorkspaceState } from './program';

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
 * Y no reimplementa ninguna regla de movimiento: `turn`, `advance` y
 * `jumpAdvance` ya deciden qué se puede pisar. Ejecutar es plegarlas sobre la
 * pose inicial quedándose con las intermedias.
 */

export type Order =
  | { kind: 'advance'; steps: number }
  | { kind: 'turn'; side: TurnSide }
  | { kind: 'jump'; body: Order[] };

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

/*
 * Cómo se mueve el personaje en cada entrada del recorrido, que es lo único que
 * la escena necesita para elegir la animación.
 *
 * Un salto con algo dentro deja DOS entradas por cada paso de su cuerpo —el
 * despegue y el aterrizaje— porque ese paso cuesta dos (§4.4), y el recorrido
 * tiene que tener tantas entradas como pasos cuenta la lectura: de eso cuelgan el
 * contador de la pantalla y los tests que atan las dos cuentas. Un salto vacío
 * cuesta uno y deja una, `hop`.
 */
export type Motion = 'walk' | 'takeoff' | 'landing' | 'hop';

export interface RunStep {
  pose: Pose;
  blockedBy: Blocker | null;
  motion: Motion;
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
  /* Donde Blockly deja los bloques que van DENTRO de otro, cada entrada con su cadena. */
  inputs?: unknown;
  /*
   * `block` puede faltar Y puede venir a `null`, que no es lo mismo para el
   * `?.` de abajo: Blockly escribe el `null` mientras se arrastra el bloque
   * siguiente para separarlo de la cadena.
   */
  next?: { block?: SerializedBlock | null };
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

/*
 * Una secuencia: el bloque de arriba y los que cuelgan de él. Sirve igual para el
 * programa entero que para el cuerpo de un salto, que es otra secuencia colgada
 * de su entrada.
 */
const readChain = (first: unknown, insideJump: boolean): Order[] | null => {
  const orders: Order[] = [];
  let block = isObject(first) ? (first as SerializedBlock) : undefined;

  while (block !== undefined) {
    const order = readOrder(block, insideJump);

    if (order === null) {
      return null;
    }

    orders.push(order);

    /*
     * LA CADENA SE ACABA EN CUANTO LO QUE SIGUE NO ES UN BLOQUE, y esto no es
     * una precaución: `block.next?.block` devolvía `null` tal cual y el bucle
     * seguía, porque `null !== undefined`, así que `readOrder` recibía `null` y
     * reventaba leyéndole el tipo.
     *
     * Y reventar aquí NO se queda aquí: `hasLooseStacks` corre en el pintado de
     * la escena, así que la excepción se lleva por delante el árbol de React y
     * **la pantalla se queda en blanco**. Es lo que pasaba al separar dos
     * bloques pegados: mientras dura el arrastre, Blockly serializa el `next`
     * del de arriba con `block: null`, y el editor publica ese estado
     * intermedio. Dentro de un salto pasa lo mismo.
     *
     * Se para en vez de rechazar el programa entero porque eso es lo que se ve
     * en pantalla: el bloque de abajo está en el aire, y la cadena que queda
     * termina donde termina.
     */
    const next = block.next?.block;
    block = isObject(next) ? (next as SerializedBlock) : undefined;
  }

  return orders;
};

const readOrder = (block: SerializedBlock, insideJump: boolean): Order | null => {
  if (block.type === TURN_LEFT_BLOCK) {
    return { kind: 'turn', side: 'left' };
  }

  if (block.type === TURN_RIGHT_BLOCK) {
    return { kind: 'turn', side: 'right' };
  }

  if (block.type === JUMP_BLOCK) {
    /*
     * UN SALTO DENTRO DE OTRO no tiene regla —ni de cuánto cuesta ni de qué hace—,
     * así que no se interpreta a medias: el programa entero es ilegible, igual
     * que con un bloque desconocido. El editor ya no deja encajarlo; esto cubre
     * lo que llegue por otro camino.
     */
    if (insideJump) {
      return null;
    }

    const body = isObject(block.inputs) ? block.inputs[JUMP_BODY] : undefined;
    const orders = readChain(isObject(body) ? body.block : undefined, true);

    return orders === null ? null : { kind: 'jump', body: orders };
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
 * no es de los nuestros, un número que no lo es, un salto dentro de otro—, y
 * rechaza el programa ENTERO, como `openProgram` con el sobre. Saltarse el
 * bloque raro dejaría un programa ejecutado a medias, jugado hasta el final y
 * con un resultado que nadie podría volver a explicar; es lo que el contrato
 * §4.2 manda con una casilla de clase desconocida y por el mismo motivo.
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

  const orders = readChain(firstOnCanvas(roots), false);

  return orders === null ? null : { orders, rootCount: roots.length };
};

/*
 * El recuento del contrato §4.4: `avanzar N` son N pasos, `girar` es uno, un
 * salto vacío es uno y un salto con cuerpo es EL DOBLE de su cuerpo. La regla del
 * salto es del usuario: saltar ahorra bloques, no pasos, así que un salto con
 * `avanzar 2` cuesta lo mismo que dos saltos con `avanzar 1`.
 *
 * Existe pudiendo usarse `runProgram(...).steps.length`, que da el mismo número,
 * porque §4.4 define el recuento como una LECTURA del programa —sin tablero,
 * sin pose y sin ejecutar nada—, y eso es lo que el servidor tendrá que hacer
 * para puntuar (J10). Sacar de la ejecución el número que se le enseña al niño
 * lo ataría a un motor que el servidor no corre, y entonces los dos lados sólo
 * coincidirían por suerte.
 */
export const countSteps = (orders: Order[]): number =>
  orders.reduce((total, order) => {
    if (order.kind === 'advance') {
      return total + order.steps;
    }

    if (order.kind === 'turn') {
      return total + 1;
    }

    return total + (order.body.length === 0 ? 1 : 2 * countSteps(order.body));
  }, 0);

/*
 * Los pasos que el personaje LLEVA DADOS, que es lo que el contador enseña: cero
 * mientras no haya recorrido, el paso en curso mientras corre, y lo que costó
 * cuando terminó o cuando se detuvo.
 *
 * Está aquí y no dentro de la escena por lo mismo que `countSteps`: dentro del
 * componente no se puede probar —jsdom no implementa WebGL—, y esta cuenta tiene
 * un borde afilado. El índice que la escena lleva vale `steps.length` al terminar,
 * así que pintar `index + 1` sin mirar si el recorrido sigue vivo enseñaría ONCE
 * pasos en un recorrido de diez. El `min` es ese borde, no una precaución.
 */
export const stepsTaken = (run: Run | null, index: number, running: boolean): number =>
  run === null ? 0 : Math.min(running ? index + 1 : index, run.steps.length);

/*
 * El índice en el que se planta un recorrido detenido con el paso `index` en
 * curso: el siguiente, para que el personaje aterrice en la casilla de ese paso.
 *
 * SALVO EN UN DESPEGUE, que se salta también su aterrizaje. Un salto son dos
 * entradas del recorrido, y parar entre ellas deja pendiente la segunda mitad del
 * arco: al reanudar, el personaje arrancaría a media altura entre dos casillas.
 */
export const stoppedIndex = (run: Run, index: number): number => {
  const next = run.steps[index]?.motion === 'takeoff' ? index + 2 : index + 1;

  return Math.min(next, run.steps.length);
};

/*
 * Si el lienzo trae bloques de sobra, que es lo ÚNICO que hay que preguntarle
 * mientras el niño construye: el J6.2 retiró enseñarle lo que cuesta su programa
 * antes de jugar, y sin eso no queda ningún número que contar aquí.
 *
 * Devuelve un booleano y no el número de montones a propósito. Ese número no lo
 * enseña nadie —el aviso dice que sobró algo, no cuánto (§4.3)—, y devolverlo
 * sería dejar puesta la cifra que este paso vino a quitar. Por lo mismo colapsa
 * en `false` los tres casos en que no hay nada que señalar: sin programa,
 * ilegible y lienzo vacío.
 *
 * Y vive aquí y no en la escena porque esos tres casos son los que muerden, y
 * dentro del componente no habría forma de probarlos: jsdom no implementa WebGL.
 */
export const hasLooseStacks = (program: Program | null): boolean => {
  const workspace = program === null ? null : openProgram(program);
  const reading = workspace === null ? null : readProgram(workspace);

  return reading !== null && reading.rootCount > 1;
};

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
 * Saltando, cada paso del cuerpo son dos entradas: el despegue, en la pose de
 * partida, y el aterrizaje, donde el salto lo deje —en la casilla siguiente, o en
 * la misma si no pudo—. El despegue no mueve nada a propósito: la escena lee el
 * aterrizaje que viene detrás para dibujar el arco entero.
 *
 * Y pisar la meta cuenta aunque el programa siga y acabe en otra casilla, que es
 * la otra mitad de la misma regla: pasarse de largo es ineficiencia, y la
 * ineficiencia se paga en la puntuación, no invalidando el nivel.
 */
export const runProgram = (config: LevelConfig, orders: Order[]): Run => {
  const steps: RunStep[] = [];
  let pose = config.start;
  let success = isGoal(config.goal, pose.cell);

  const push = (next: Pose, blockedBy: Blocker | null, motion: Motion): void => {
    pose = next;
    steps.push({ pose, blockedBy, motion });
    success = success || isGoal(config.goal, pose.cell);
  };

  const execute = (list: Order[], jumping: boolean): void => {
    list.forEach((order) => {
      if (order.kind === 'jump') {
        if (order.body.length === 0) {
          push(pose, null, 'hop');
        } else {
          execute(order.body, true);
        }

        return;
      }

      if (order.kind === 'turn') {
        const turned: Pose = { cell: pose.cell, facing: turn(pose.facing, order.side) };

        if (jumping) {
          push(pose, null, 'takeoff');
        }

        push(turned, null, jumping ? 'landing' : 'walk');

        return;
      }

      for (let step = 0; step < order.steps; step += 1) {
        if (jumping) {
          push(pose, null, 'takeoff');

          const landed = jumpAdvance(config, pose);
          push(landed.pose, landed.blockedBy, 'landing');
        } else {
          const walked = advance(config, pose);
          push(walked.pose, walked.blockedBy, 'walk');
        }
      }
    });
  };

  execute(orders, false);

  return { steps, success };
};
