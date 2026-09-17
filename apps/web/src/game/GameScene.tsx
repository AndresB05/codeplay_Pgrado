import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementRef,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { Group, PerspectiveCamera } from 'three';
import { heightAt, STEP_SECONDS, stepSeconds } from './fall';
import { FOV, frameBoard } from './framing';
import {
  countSteps,
  hasLooseStacks,
  readProgram,
  runProgram,
  stepsTaken,
  stoppedIndex,
  type Run,
  type RunStep,
} from './interpreter';
import { TILE_SIZE, type Direction, type LevelConfig, type Pose } from './level';
import { openProgram, sealProgram, type Program } from './program';

/*
 * Los únicos hexadecimales del juego, y van aquí por lo mismo que en los iconos
 * SVG: un material de three recibe un color, no una clase de Tailwind. Son
 * nombres del tema duplicados a mano desde tailwind.config.js.
 */
/*
 * El suelo va a dos tonos en damero, y no es adorno: con un solo verde las 25
 * casillas se ven como un único plano y la rejilla deja de poder contarse, que
 * es justo lo que el niño tiene que hacer para saber cuántos pasos da. Las
 * losas siguen contiguas —el damero no abre rendijas—, así que el paso de 1,0
 * se conserva.
 */
const FLOOR_COLOR = '#4ECB85'; // jungle-light
const FLOOR_ALT_COLOR = '#1F9D5B'; // jungle
const WALL_COLOR = '#5A5170'; // ink-soft
const WALL_BASE_COLOR = '#8B82A6'; // ink-faint
const START_COLOR = '#3B9DF8'; // sky
const GOAL_COLOR = '#FFC93C'; // sun
/*
 * CÓMO SE LEE LA CASILLA DEL PERSONAJE DESDE FUERA. Comprobar este juego es
 * comparar DÓNDE ESTÁ EL PERSONAJE contra lo que dice el intérprete —una
 * pantalla que dice de sí misma que hizo algo no es la prueba de que lo hizo—, y
 * buscarlo por su color ata la comprobación al aspecto. Con nombre,
 * `scene.getObjectByName` da su grupo sea cual sea su aspecto, y su posición
 * LOCAL —dentro del grupo del tablero— da la casilla. Por eso el tablero lleva
 * nombre también: es el marco en el que esa cuenta significa algo.
 */
const BOARD_NODE = 'board';
const CHARACTER_NODE = 'character';

const CHARACTER_COLOR = '#7B3FE4'; // grape
const SNOUT_COLOR = '#FFF9EF'; // cream

/*
 * Norte es −z, que es lo que hace que avanzar mirando al norte reste una fila.
 * Con el personaje mirando a −z en local, girar a la derecha desde el norte es
 * un cuarto de vuelta NEGATIVO alrededor de Y.
 */
const FACING_ANGLE: Record<Direction, number> = {
  north: 0,
  east: -Math.PI / 2,
  south: Math.PI,
  west: Math.PI / 2,
};

/*
 * La misma dirección, en coordenadas del mundo. No es una copia de los pasos de
 * `movement.ts`: aquélla mueve filas y columnas, ésta mueve metros, y sólo sirve
 * para empujar el topetazo hacia donde el personaje mira.
 */
const FACING_OFFSET: Record<Direction, [number, number]> = {
  north: [0, -1],
  east: [1, 0],
  south: [0, 1],
  west: [-1, 0],
};

/** Cuánto se asoma el personaje contra lo que no puede pisar, antes de volver. */
const BUMP_DISTANCE = 0.22;

/*
 * Lo alto que sube el arco de un salto por encima de la recta entre las dos
 * casillas. Tiene que pasar holgado por encima de un nivel —si no, subir un
 * escalón se ve como atravesarlo—, y no tanto que el personaje se salga del
 * encuadre saltando en lo alto de una columna.
 */
const JUMP_HEIGHT = 0.9;

const TWO_PI = Math.PI * 2;

/*
 * Los topes de la cámara, y ninguno es estético.
 *
 * Por ABAJO no se puede pasar de la horizontal: por debajo del tablero se ve el
 * envés de las losas, que no está dibujado para verse. Por ARRIBA no se llega al
 * cenit: desde ahí el personaje es una silueta y la marca que lleva sobre la
 * cabeza —la que dice hacia dónde mira— deja de distinguirse, así que girar
 * dejaría de verse, que es justo lo que esa marca existe para enseñar.
 *
 * Y el acercamiento se acota por los dos lados para que el tablero ni llene la
 * pantalla ni se quede lejos. Desplazar el centro está desactivado: es la única
 * forma de perder el tablero de vista, y un niño que lo pierda no sabe volver.
 */
const MIN_POLAR_ANGLE = Math.PI / 7;
const MAX_POLAR_ANGLE = Math.PI / 2 - 0.12;
const MIN_DISTANCE = 4;
const MAX_DISTANCE = 18;

/*
 * El encuadre de partida ya no son números medidos a mano: lo calcula
 * `framing.ts` con el tablero y el hueco que la bandeja deja libre. Ver
 * `FramedView`.
 */

/*
 * Los iconos de la superposición y de los botones. Van aquí y no en
 * `components/decor/` porque no son adornos: nombran lo que hace cada control, y
 * viven pegados a él.
 */
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M15 5l-7 7 7 7"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ViewCubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="currentColor" opacity="0.35" />
    <path
      d="M4 7.5L12 12l8-4.5M12 12v9"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
  </svg>
);

const StepsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <ellipse cx="8" cy="8.5" rx="3.2" ry="4.6" fill="currentColor" />
    <ellipse cx="15.5" cy="15" rx="3.2" ry="4.6" fill="currentColor" opacity="0.6" />
  </svg>
);

const PlayIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M7 4.5l12 7.5-12 7.5V4.5Z" fill="currentColor" />
  </svg>
);

const StopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" rx="3" fill="currentColor" />
  </svg>
);

const ReloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M20 12a8 8 0 1 1-2.6-5.9M20 3.5V9h-5.5"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/** El ángulo equivalente más corto: girar de norte a oeste es un cuarto, no tres. */
const shortestTurn = (from: number, to: number): number => {
  const difference = to - from;

  return difference - TWO_PI * Math.round(difference / TWO_PI);
};

/*
 * La ÚNICA traducción de casilla a coordenadas del mundo. Centrar el tablero
 * alrededor del origen deja la cámara independiente del tamaño de la rejilla.
 *
 * El ancho sale de la fila 0 porque el tablero es rectangular por contrato
 * (§4.2). Si alguna vez dejaran de serlo, esto descentraría sin dar error.
 */
const useBoardPlacement = (config: LevelConfig) =>
  useMemo(() => {
    const rows = config.tiles.length;
    const columns = config.tiles[0]?.length ?? 0;

    return (row: number, column: number): [number, number] => [
      (column - (columns - 1) / 2) * TILE_SIZE,
      (row - (rows - 1) / 2) * TILE_SIZE,
    ];
  }, [config]);

/*
 * La altura a la que se pisa una casilla, en metros del mundo. Una columna de un
 * cubo tiene la cara de arriba en `y = 0`, que es donde ha pisado siempre el
 * personaje: con todas las alturas a 1 nada cambia de sitio.
 */
const topOf = (config: LevelConfig, row: number, column: number): number =>
  (config.heights[row][column] - 1) * TILE_SIZE;

const Board = ({ config }: { config: LevelConfig }) => {
  const place = useBoardPlacement(config);

  return (
    <>
      {config.tiles.map((tileRow, row) =>
        tileRow.map((kind, column) => {
          // Un hueco no se dibuja: por él se ve el fondo, y eso es el vacío.
          if (kind === 'gap') {
            return null;
          }

          const [x, z] = place(row, column);
          const height = config.heights[row][column];
          const isStart = config.start.cell.row === row && config.start.cell.column === column;
          const isGoal = config.goal.row === row && config.goal.column === column;

          let topColor: string | null = null;
          if (kind === 'wall') {
            topColor = WALL_BASE_COLOR;
          } else if (isGoal) {
            topColor = GOAL_COLOR;
          } else if (isStart) {
            topColor = START_COLOR;
          }

          return (
            <group key={`${row}-${column}`} position={[x, 0, z]}>
              {/*
               * LA CASILLA ES UNA COLUMNA DE CUBOS, uno por nivel, apoyada en el
               * suelo del tablero: el usuario fijó que nada flota. Cada cubo mide
               * lo que ocupa —el paso de la rejilla es 1,0—, así que no hay una
               * segunda medida que mantener.
               *
               * El de más abajo se hunde media altura porque la cara de arriba de
               * una columna de UN cubo es el plano de pisar de siempre, `y = 0`.
               *
               * EL DAMERO SE EXTIENDE A LOS NIVELES, y no es adorno por lo mismo
               * que no lo es en el suelo: dos cubos apilados del mismo color se
               * leen como uno alto, y entonces no se cuentan los niveles que hay
               * que subir. Sólo el de arriba lleva el color de la salida o la
               * meta, que es la casilla que se pisa.
               */}
              {Array.from({ length: height }, (_, level) => (
                <mesh key={level} position={[0, (level - 0.5) * TILE_SIZE, 0]}>
                  <boxGeometry args={[TILE_SIZE, TILE_SIZE, TILE_SIZE]} />
                  <meshStandardMaterial
                    color={
                      level === height - 1 && topColor !== null
                        ? topColor
                        : (row + column + level) % 2 === 0
                          ? FLOOR_COLOR
                          : FLOOR_ALT_COLOR
                    }
                  />
                </mesh>
              ))}

              {kind === 'wall' && (
                <mesh position={[0, (height - 0.5) * TILE_SIZE, 0]}>
                  <boxGeometry args={[TILE_SIZE, TILE_SIZE, TILE_SIZE]} />
                  <meshStandardMaterial color={WALL_COLOR} />
                </mesh>
              )}
            </group>
          );
        })
      )}
    </>
  );
};

interface CharacterProps {
  config: LevelConfig;
  /** Dónde está el personaje antes del paso que se anima, o dónde se quedó. */
  pose: Pose;
  /** El paso en curso, o `null` si no hay ejecución que animar. */
  step: RunStep | null;
  /*
   * El paso que viene después del en curso. Sólo lo lee el DESPEGUE de un salto:
   * su pose no cambia —la lógica del salto vive en el aterrizaje—, y sin mirar
   * adónde va a caer el arco no tendría hacia dónde ir.
   */
  nextStep: RunStep | null;
  stepIndex: number;
  onStepDone: (stepIndex: number) => void;
}

const Character = ({ config, pose, step, nextStep, stepIndex, onStepDone }: CharacterProps) => {
  const place = useBoardPlacement(config);
  const group = useRef<Group>(null);

  /*
   * El reloj del paso vive en el bucle de frames y no en el estado de React: el
   * estado sólo cambia cuando un paso TERMINA, una vez cada tercio de segundo,
   * y no sesenta veces por segundo.
   *
   * Y el paso en curso se compara aquí dentro en vez de reiniciarse desde un
   * efecto, porque un efecto y el bucle de frames no tienen orden garantizado
   * entre sí: el primer frame del paso nuevo podría llegar con el reloj viejo.
   */
  const animated = useRef<RunStep | null>(null);
  const elapsed = useRef(0);
  const angle = useRef(FACING_ANGLE[pose.facing]);
  const angleFrom = useRef(FACING_ANGLE[pose.facing]);

  const [x, z] = place(pose.cell.row, pose.cell.column);
  const y = topOf(config, pose.cell.row, pose.cell.column);

  useFrame((_, delta) => {
    const node = group.current;

    if (node === null) {
      return;
    }

    /*
     * Sin paso que animar, el personaje se planta donde diga la pose. Y hay que
     * plantarlo aquí: reiniciar a mitad de un paso lo devuelve a una pose que
     * puede ser la misma que ya tenía en las propiedades, y entonces nadie
     * deshace lo que este bucle movió — se quedaría a medio camino entre dos
     * casillas.
     */
    if (step === null) {
      animated.current = null;
      angle.current = FACING_ANGLE[pose.facing];
      node.position.x = x;
      node.position.y = y;
      node.position.z = z;
      node.rotation.y = angle.current;

      return;
    }

    if (animated.current !== step) {
      animated.current = step;
      elapsed.current = 0;
      angleFrom.current = angle.current;
    }

    elapsed.current += delta;

    /*
     * UN SALTO SON DOS ENTRADAS Y UN SOLO ARCO. El recorrido lleva el despegue y
     * el aterrizaje por separado porque cada casilla saltada cuesta dos pasos, y
     * aquí se cosen: el despegue dibuja la primera mitad del arco —hacia donde
     * caerá, que dice el paso siguiente— y el aterrizaje la segunda. Un salto
     * vacío es el arco entero en el sitio.
     */
    let target = step.pose;
    let alongFrom = 0;
    let alongTo = 1;

    if (step.motion === 'takeoff') {
      target = nextStep?.pose ?? step.pose;
      alongTo = 0.5;
    } else if (step.motion === 'landing') {
      alongFrom = 0.5;
    }

    const [toX, toZ] = place(target.cell.row, target.cell.column);
    const toY = topOf(config, target.cell.row, target.cell.column);

    /*
     * DOS RELOJES, Y UNO SOLO DECIDE CUÁNDO SE ACABA EL PASO. Andar dura siempre
     * lo mismo —`walked`—, así que el ritmo del recorrido no depende del
     * relieve; la CAÍDA, en cambio, tarda lo que la altura pida (`fall.ts`), y
     * un paso que baja se alarga por detrás hasta que el personaje aterriza.
     *
     * Sin separarlos, darle tiempo a la caída habría puesto al personaje a andar
     * a cámara lenta hacia el borde, que no es lo que se estaba arreglando.
     */
    const duration = stepSeconds(step.motion, y, toY);
    const progress = Math.min(elapsed.current / duration, 1);
    const walked = Math.min(elapsed.current / STEP_SECONDS, 1);

    const along = alongFrom + (alongTo - alongFrom) * walked;
    const lift = step.motion === 'walk' ? 0 : JUMP_HEIGHT * 4 * along * (1 - along);

    /*
     * Un avance imposible no mueve al personaje, así que sin topetazo el paso
     * sería un tercio de segundo de nada: el niño no vería CONTRA QUÉ se paró,
     * que es justo lo que `advance` devuelve en `blockedBy` para que se enseñe.
     */
    const bump =
      step.blockedBy === null ? 0 : BUMP_DISTANCE * (walked < 0.5 ? walked * 2 : (1 - walked) * 2);
    const [offsetX, offsetZ] = FACING_OFFSET[step.pose.facing];

    node.position.x = x + (toX - x) * along + offsetX * bump;
    node.position.y = heightAt(step.motion, y, toY, along, elapsed.current) + lift;
    node.position.z = z + (toZ - z) * along + offsetZ * bump;

    angle.current =
      angleFrom.current + shortestTurn(angleFrom.current, FACING_ANGLE[step.pose.facing]) * walked;
    node.rotation.y = angle.current;

    if (progress === 1) {
      onStepDone(stepIndex);
    }
  });

  return (
    <group
      ref={group}
      name={CHARACTER_NODE}
      position={[x, y, z]}
      rotation={[0, FACING_ANGLE[pose.facing], 0]}
    >
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.5, 0.7, 0.5]} />
        <meshStandardMaterial color={CHARACTER_COLOR} />
      </mesh>

      {/*
       * El saliente de la cara que mira. Sin él, un cubo girado 90° es el mismo
       * cubo. Va sobre la cabeza y no en la cara: puesto en la cara, mirando en
       * dirección contraria a la cámara lo tapa el propio cuerpo, y esa
       * orientación se queda sin marca.
       */}
      <mesh position={[0, 0.74, -0.16]}>
        <boxGeometry args={[0.22, 0.12, 0.26]} />
        <meshStandardMaterial color={SNOUT_COLOR} />
      </mesh>
    </group>
  );
};

interface FramedViewProps {
  config: LevelConfig;
  freeHeight: number | null;
  board: RefObject<Group>;
  controls: RefObject<ElementRef<typeof OrbitControls>>;
}

/*
 * EL ENCUADRE, APLICADO. Vive dentro del `<Canvas>` porque el tamaño del lienzo
 * sólo se sabe ahí, y se recalcula cuando ese tamaño cambia.
 *
 * Se sube EL TABLERO y no el punto al que mira la cámara, porque los controles
 * guardan su vista de partida con el punto en el origen y «Vista inicial» vuelve
 * a ella. Por eso, con el encuadre puesto, se les pide guardarla otra vez. El
 * personaje va dentro del grupo del tablero, así que su casilla se sigue leyendo
 * igual: cambia dónde se pinta, no dónde está.
 */
const FramedView = ({ config, freeHeight, board, controls }: FramedViewProps) => {
  const camera = useThree((state) => state.camera) as PerspectiveCamera;
  const width = useThree((state) => state.size.width);
  const height = useThree((state) => state.size.height);

  useLayoutEffect(() => {
    if (width === 0 || height === 0) {
      return;
    }

    const framing = frameBoard(config, { width, height, freeHeight: freeHeight ?? height });
    const distance = Math.hypot(...framing.position);

    camera.position.set(...framing.position);
    camera.lookAt(0, 0, 0);
    board.current?.position.setY(framing.lift);

    const orbit = controls.current;

    if (orbit !== null) {
      // Los topes se abren si hace falta: unos topes más cerrados que la partida la recortarían.
      orbit.minDistance = Math.min(MIN_DISTANCE, distance);
      orbit.maxDistance = Math.max(MAX_DISTANCE, distance * 1.5);
      orbit.update();
      orbit.saveState();
    }
  }, [board, camera, config, controls, freeHeight, height, width]);

  return null;
};

interface GameSceneProps {
  /*
   * EL NIVEL LLEGA DE FUERA, y la escena no trae ninguno dentro: es lo que
   * permite que añadir un nivel cueste una fila y no una publicación del juego
   * (contrato §2). Viene ya comprobado —quien rechaza el que no se puede leer es
   * el anfitrión, §7—, así que aquí no hay nada que validar.
   */
  level: LevelConfig;
  program: Program | null;
  /*
   * El hueco donde van los tres botones, que desde el J6.3 viven en la columna
   * derecha de la pantalla y no en una franja bajo el juego. Baja como dato
   * desde la composición y los botones se pintan ahí con un portal: así cambian
   * de zona SIN que el estado del intento ni el intérprete suban por encima de
   * la frontera diferida, que es lo que el J5 dejó medido a cero en el trozo
   * principal.
   */
  controlsHost: HTMLElement | null;
  /*
   * El hueco del mensaje, en la franja del título del lienzo. Baja como dato
   * por el mismo motivo que el de los botones: lo que se le dice al niño sale
   * del intento, y el intento no sube.
   */
  messageHost: HTMLElement | null;
  /*
   * Si el recorrido está detenido, para que la composición bloquee el lienzo:
   * lo que se reanuda tiene que ser lo que está a la vista, y el lienzo no es de
   * la escena. Sube un booleano y nada del intento.
   */
  onHaltedChange?: (halted: boolean) => void;
  /*
   * Un recorrido TERMINADO, haya llegado a la meta o no. Desde el J9 también
   * sube el fallido, porque el intento se guarda igual (contrato §3: el mensaje
   * sale «con éxito o sin él»). Quien decide qué se enseña por haber llegado es
   * el anfitrión, no la escena.
   */
  onFinish?: (result: LevelFinish) => void;
  /*
   * El alto del juego que la bandeja del lienzo deja libre al abrir, en píxeles
   * desde arriba. Lo mide la composición, que es quien pone la bandeja; sin
   * medida todavía, se encuadra en el alto entero.
   */
  freeHeight?: number | null;
}

/*
 * Lo que la escena sabe de una partida terminada. Es la MATERIA PRIMA del
 * mensaje del contrato §3, no el mensaje: aquí no hay `levelId` ni nada del
 * servidor, porque la escena no sabe contra qué fila se está jugando.
 *
 * `program` es el sobre de §4.3 con el programa QUE SE EJECUTÓ, congelado al
 * pulsar «Ejecutar»: mover un bloque después no lo cambia, que es la misma
 * regla que ya protegía a la ejecución.
 */
export interface LevelFinish {
  steps: number;
  optimalSteps: number;
  success: boolean;
  /* Se acabó el máximo de pasos del nivel. Con `success`, la meta se pisó antes. */
  outOfSteps: boolean;
  /* Quedaron montones de bloques fuera del que se ejecutó (§4.3). */
  looseBlocks: boolean;
  program: Program;
  /* De «Ejecutar» a la llegada, en reloj de pared. Incluye lo que durase detenido. */
  runtimeMs: number;
}

/*
 * Lo que ocurrió al pulsar «Ejecutar». Un solo valor y no tres banderas sueltas:
 * «ilegible», «vacío» y «se ejecutó» se excluyen entre sí, y con banderas
 * paralelas la barra tendría que derivarse de combinaciones que nadie ha
 * comprobado que no ocurran.
 *
 * `steps` es el recuento LEÍDO del programa (§4.4), no la longitud del recorrido.
 */
type Attempt =
  | { kind: 'unreadable' }
  | { kind: 'empty' }
  | {
      kind: 'run';
      run: Run;
      steps: number;
      rootCount: number;
      /* Lo que se ejecutó y cuándo empezó, que es lo que el J9 manda al servidor. */
      program: Program;
      startedAt: number;
    };

const stepsLabel = (count: number): string => (count === 1 ? '1 paso' : `${count} pasos`);

const OUTCOME_MESSAGES = {
  idle: 'Coloca bloques y pulsa «Ejecutar» para ver al personaje moverse.',
  running: 'Ejecutando el programa…',
  stopped:
    'Has detenido el recorrido. Pulsa «Ejecutar» para seguir o «Reiniciar» para cambiar los bloques.',
  empty: 'No hay bloques que ejecutar. Arrastra alguno al lienzo.',
  unreadable: 'Ese programa no se puede leer.',
};

/*
 * El montón de más arriba SÍ se ejecutó y su resultado es real, así que el aviso
 * ACOMPAÑA al resultado en vez de sustituirlo: §4.3 se negó a rechazar el
 * programa por tener bloques sueltos para no castigar el olvido en una esquina,
 * que es lo más frecuente en un lienzo de niño. Sin el aviso, en cambio, la
 * regla falla en silencio y el niño no distingue «mi programa está mal» de «mi
 * programa no se ejecutó».
 */
const LOOSE_BLOCKS_WARNING =
  'Te sobraron bloques sueltos: sólo se ejecutó el montón de más arriba.';

/*
 * El mismo aviso, en PRESENTE y mientras el niño construye. Es lo único que
 * sobrevive del J6.1: el usuario retiró enseñarle lo que cuesta su programa
 * antes de jugar, pero no esto, porque no lleva ningún número y no presiona —
 * dice que hay un bloque olvidado, que es el fallo en silencio del J5.
 */
const LOOSE_BLOCKS_NOTICE = 'Tienes bloques sueltos: sólo se ejecutará el montón de más arriba.';

/*
 * Un recorrido cortado por el máximo NO se reanuda —eso regalaría los pasos que
 * el nivel no da—, así que el texto manda a «Reiniciar» y no a «Ejecutar». Es la
 * diferencia con el recorrido detenido, que se parece y no es lo mismo: aquél lo
 * para el niño y sigue donde iba; éste lo para el nivel y se acabó.
 */
const OUT_OF_STEPS_MESSAGE =
  'Te quedaste sin pasos y el personaje no puede seguir. Pulsa «Reiniciar» y busca un camino más corto.';

/*
 * Gastar MENOS pasos que `optimalSteps` también es perfecto, y lleva texto
 * propio. Significa que el número del nivel está sembrado por encima del óptimo
 * real —el contrato §4.2 avisa de que no lo comprueba nadie—, y eso lo caza
 * quien siembra el nivel resolviendo su puzle, no el niño que lo juega: no se le
 * acusa de nada. El texto de los pasos justos es el que no sirve aquí, porque
 * afirma una igualdad que en ese caso sería falsa.
 */
const outcomeOf = (run: Run, steps: number, optimalSteps: number): string => {
  const best = `la mejor solución cuesta ${stepsLabel(optimalSteps)}`;

  /*
   * QUEDARSE SIN PASOS NO ES NO LLEGAR, y decirle lo segundo le señala el fallo
   * que no es: su programa no está mal escrito, es demasiado largo. Y va detrás
   * de la llegada a propósito — un programa que pisó la meta y siguió hasta
   * agotar el máximo SÍ resolvió el nivel (§4.4), así que ahí manda el resultado.
   */
  if (run.outOfSteps && !run.success) {
    return OUT_OF_STEPS_MESSAGE;
  }

  if (!run.success) {
    return `No llegaste a la meta. Usaste ${stepsLabel(steps)} y ${best}.`;
  }

  if (steps > optimalSteps) {
    return `¡Llegaste a la meta! Usaste ${stepsLabel(steps)} y ${best}.`;
  }

  if (steps < optimalSteps) {
    return `¡Perfecto! Llegaste a la meta con ${stepsLabel(steps)}, menos todavía de lo que cuesta la mejor solución que teníamos apuntada.`;
  }

  return `¡Perfecto! Llegaste a la meta con ${stepsLabel(steps)}, justo lo que cuesta la mejor solución.`;
};

export const GameScene = ({
  level,
  program,
  controlsHost,
  messageHost,
  onHaltedChange,
  onFinish,
  freeHeight = null,
}: GameSceneProps) => {
  const config = level;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [index, setIndex] = useState(0);

  /*
   * Un recorrido CONGELADO no es uno terminado, y por eso hace falta esta marca:
   * los dos se ven igual desde el índice —nadie avanza— y sin embargo uno lleva
   * resultado y el otro no.
   */
  const [halted, setHalted] = useState(false);

  const controls = useRef<ElementRef<typeof OrbitControls>>(null);
  const board = useRef<Group>(null);

  /*
   * El programa se lee al pulsar, no al recibirlo: si viajara en el estado, mover
   * un bloque a mitad de recorrido cambiaría lo que se está ejecutando. Es la
   * misma referencia que `BlockEditor` usa para publicar hacia arriba, y por el
   * mismo motivo.
   */
  const latest = useRef(program);
  latest.current = program;

  /*
   * Esto sí se lee de las PROPIEDADES, y no contradice a esa referencia: aquélla
   * existe para que `start()` lea el valor fresco sin arrastrar closures, no
   * para prohibir pintar lo que ya llega. Lo que protege es que la EJECUCIÓN no
   * dependa de lo que el niño toque mientras corre, y el contador de arriba
   * sigue saliendo del intento congelado.
   */
  const looseStacks = useMemo(() => hasLooseStacks(program), [program]);

  // El intento entero y no sólo su recorrido: el contador necesita su recuento.
  const active = attempt !== null && attempt.kind === 'run' ? attempt : null;
  const run = active === null ? null : active.run;
  const step = run !== null && !halted && index < run.steps.length ? run.steps[index] : null;
  const nextStep = step !== null && run !== null ? (run.steps[index + 1] ?? null) : null;
  const pose = run === null || index === 0 ? config.start : run.steps[index - 1].pose;
  const isRunning = step !== null;

  // Los pasos DADOS. La cuenta vive fuera para poder probarla sin WebGL.
  const steps = stepsTaken(run, index, isRunning);

  /*
   * LO QUE LE QUEDA, que es lo que el contador dice en un nivel con máximo. Es el
   * vuelco de la regla de abajo, y sólo ahí: en un nivel con límite el puzle YA
   * es un problema de optimización —está diseñado así—, de modo que esconder el
   * número no protege nada y deja al niño plantándose sin saber por qué.
   *
   * `null` es «este nivel no tiene máximo», que es el caso de los seis sembrados.
   */
  const remaining = config.stepLimit === undefined ? null : config.stepLimit - steps;

  /*
   * El arranque cuelga del evento del botón y NUNCA de un efecto: con
   * `React.StrictMode` un efecto se dispara dos veces en desarrollo, y aquí eso
   * sería el recorrido ejecutándose por duplicado.
   */
  const start = useCallback(() => {
    /*
     * UN RECORRIDO DETENIDO SE REANUDA, y reanudar es sólo quitar la marca: el
     * intento, su recorrido y el índice se quedan, así que el personaje sigue
     * desde su casilla y el contador desde su número. No se relee el lienzo: la
     * composición lo bloquea mientras está detenido, así que no ha cambiado.
     */
    if (halted && run !== null) {
      setHalted(false);

      return;
    }

    // Sin editor todavía montado no hay programa, y eso es un lienzo vacío (§4.3).
    const workspace = latest.current === null ? {} : openProgram(latest.current);
    const reading = workspace === null ? null : readProgram(workspace);

    setIndex(0);
    setHalted(false);

    /*
     * Las dos van juntas porque acaban igual —un sobre que no es de esta versión
     * y un montón de bloques que no se entiende son «no se puede leer»—, y así
     * `workspace` queda con qué sellar el programa del intento más abajo.
     */
    if (workspace === null || reading === null) {
      setAttempt({ kind: 'unreadable' });

      return;
    }

    /*
     * Sin ÓRDENES no hubo intento, y se mira eso y no los pasos que produjo la
     * ejecución. Hoy los dos criterios coinciden —toda orden produce al menos
     * un paso—, pero eso es una invariante de `runProgram` que nada declara: el
     * día que exista un bloque que no cueste paso, un lienzo vacío volvería a
     * confundirse con un programa que no hace nada, y eso es lo que hasta hoy
     * pintaba «No llegaste a la meta» cuando no había nada que ejecutar.
     */
    if (reading.orders.length === 0) {
      setAttempt({ kind: 'empty' });

      return;
    }

    setAttempt({
      kind: 'run',
      run: runProgram(config, reading.orders),
      steps: countSteps(reading.orders),
      rootCount: reading.rootCount,
      program: sealProgram(workspace),
      startedAt: Date.now(),
    });
  }, [config, halted, run]);

  /*
   * Detener es ADELANTAR EL ÍNDICE y marcar el intento como congelado, y con eso
   * salen tres cosas de una: la pose pasa a ser la del paso en curso —que es
   * donde el usuario quiere que se quede el personaje, en su casilla y con su
   * orientación—, el paso a animar se vuelve `null` y el bucle de frames se
   * planta, y el contador se queda en el paso que se estaba dando.
   *
   * El personaje ATERRIZA en esa casilla en vez de congelarse entre dos: un cubo
   * parado a medio camino se lee como un fallo de dibujo, y lo que se recorre de
   * más dura un tercio de segundo. Y un salto aterriza entero: ver `stoppedIndex`.
   */
  const stop = useCallback(() => {
    setIndex((current) => (run === null ? current + 1 : stoppedIndex(run, current)));
    setHalted(true);
  }, [run]);

  useEffect(() => {
    onHaltedChange?.(halted);
  }, [halted, onHaltedChange]);

  /*
   * EL FINAL SE AVISA UNA VEZ POR RECORRIDO TERMINADO. La referencia guarda el
   * recorrido ya avisado: sin ella, cualquier repintado con el recorrido
   * terminado volvería a abrir la ventana que el niño acaba de cerrar, y con
   * `React.StrictMode` el efecto avisaría dos veces.
   *
   * Desde el J9 eso ya no es sólo una ventana: es UN INTENTO GUARDADO, así que
   * la referencia dejó de proteger una molestia para proteger una fila
   * duplicada. Se marca ANTES de avisar, no después, por el mismo motivo.
   *
   * Y avisa llegue o no a la meta. Lo que NO avisa sigue igual: un recorrido
   * detenido por el niño no ha terminado, y un lienzo vacío o ilegible no
   * llegó a ejecutarse — no hay partida que guardar.
   */
  const reported = useRef<Run | null>(null);
  const finished = run !== null && !halted && index >= run.steps.length;

  useEffect(() => {
    if (!finished || active === null || reported.current === active.run) {
      return;
    }

    reported.current = active.run;
    onFinish?.({
      steps: active.steps,
      optimalSteps: config.optimalSteps,
      success: active.run.success,
      outOfSteps: active.run.outOfSteps,
      looseBlocks: active.rootCount > 1,
      program: active.program,
      runtimeMs: Math.max(0, Date.now() - active.startedAt),
    });
  }, [finished, active, config.optimalSteps, onFinish]);

  const reset = useCallback(() => {
    setAttempt(null);
    setIndex(0);
    setHalted(false);
  }, []);

  // La vista de partida la guardan los propios controles al montarse.
  const resetView = useCallback(() => controls.current?.reset(), []);

  const advanceStep = useCallback((finished: number) => {
    // Un frame puede llegar con el paso ya terminado antes de que React repinte.
    setIndex((current) => (current === finished ? current + 1 : current));
  }, []);

  /*
   * DETENER NO PRODUCE RESULTADO, y no es sólo que un recorrido congelado no haya
   * terminado: el resultado diría «No llegaste a la meta», y eso es acusar al
   * niño de un fallo que no ha cometido —paró él—. Es el mismo error que el J6
   * corrigió con el lienzo vacío, donde se le contaba que su programa era malo
   * cuando lo que pasaba es que no había programa.
   */
  let outcome = OUTCOME_MESSAGES.idle;
  if (isRunning) {
    outcome = OUTCOME_MESSAGES.running;
  } else if (halted) {
    outcome = OUTCOME_MESSAGES.stopped;
  } else if (attempt !== null && attempt.kind === 'unreadable') {
    outcome = OUTCOME_MESSAGES.unreadable;
  } else if (attempt !== null && attempt.kind === 'empty') {
    outcome = OUTCOME_MESSAGES.empty;
  } else if (active !== null) {
    outcome = outcomeOf(active.run, active.steps, config.optimalSteps);
  }

  // El aviso es del recorrido TERMINADO: ni durante la ejecución ni al congelarla.
  const warning =
    !isRunning && !halted && active !== null && active.rootCount > 1 ? LOOSE_BLOCKS_WARNING : null;

  /*
   * Y el del lienzo CEDE cuando el del resultado está en pantalla: los dos dicen
   * lo mismo —uno en presente, el otro en pasado— y un niño que deje un bloque
   * suelto y ejecute se comería la misma frase dos veces seguidas.
   */
  const notice = !isRunning && warning === null && looseStacks;

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ fov: FOV }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 3]} intensity={2.2} />

        <group ref={board} name={BOARD_NODE}>
          <Board config={config} />
          <Character
            config={config}
            pose={pose}
            step={step}
            nextStep={nextStep}
            stepIndex={index}
            onStepDone={advanceStep}
          />
        </group>

        {/*
         * Girar y acercar, acotados. `enablePan` desactivado porque desplazar el
         * centro es la única forma de dejar el tablero fuera de la pantalla, y en
         * la pantalla de nivel no habrá nadie al lado para devolverlo.
         */}
        <OrbitControls
          ref={controls}
          enablePan={false}
          minPolarAngle={MIN_POLAR_ANGLE}
          maxPolarAngle={MAX_POLAR_ANGLE}
          minDistance={MIN_DISTANCE}
          maxDistance={MAX_DISTANCE}
        />

        <FramedView config={config} freeHeight={freeHeight} board={board} controls={controls} />
      </Canvas>

      {/*
       * TODO LO QUE SE LE DICE AL NIÑO VA SUPERPUESTO AL JUEGO, y no dentro del
       * `<Canvas>`: ahí dentro los elementos son objetos de three y no etiquetas
       * de HTML. Está aquí porque el niño está mirando al personaje, y porque la
       * franja que había bajo el juego se fue con los botones a la columna
       * derecha.
       */}
      <button
        type="button"
        className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink py-2 pl-2.5 pr-4 font-display text-[15px] text-white shadow-[0_6px_18px_rgba(42,27,69,0.28)] transition-transform hover:-translate-y-[1px]"
        onClick={resetView}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
          <BackIcon />
        </span>
        <ViewCubeIcon />
        Vista inicial
      </button>

      {/*
       * Sin máximo, el contador dice lo que LLEVA y nunca lo que falta. Enseñar
       * el número a batir mientras se juega convierte el nivel en un problema de
       * optimización cuando todavía es un problema de llegar; lo que costó y lo
       * que costaba lo bueno se dicen al terminar, y ahí es una lección y no una
       * exigencia.
       *
       * Con máximo dice lo que QUEDA, y baja. No es una excepción a la regla de
       * arriba: es que ahí el nivel ya es un problema de optimización por diseño.
       *
       * Y se ve SIEMPRE, con su valor de reposo puesto —cero sin máximo, el
       * máximo entero con él—: un marcador ya puesto explica de qué van a ser los
       * números que se muevan. La ETIQUETA cambia con la magnitud, que es lo que
       * impide leer lo que queda como lo que se lleva.
       */}
      <p className="pointer-events-none absolute right-4 top-4 flex items-center gap-2.5 rounded-full bg-ink px-4 py-2 font-display text-[17px] text-white shadow-[0_6px_18px_rgba(42,27,69,0.28)]">
        <StepsIcon />
        {remaining === null ? `Pasos: ${steps}` : `Pasos restantes: ${remaining}`}
      </p>

      {/*
       * LO QUE SE LE DICE AL NIÑO VA EN LA FRANJA DEL TÍTULO DEL LIENZO, a la
       * derecha de la etiqueta, y viaja hasta allí por un portal por lo mismo
       * que los botones: el intento y quien lo lee se quedan bajo la frontera
       * diferida. Antes era una banda sobre el juego, y estorbaba justo donde
       * hay que mirar — que es el tablero.
       *
       * Los tres textos van en una línea y no apilados: la franja es una franja.
       */}
      {messageHost !== null &&
        createPortal(
          <div className="flex flex-wrap items-baseline gap-x-3">
            <p className="text-[14px] font-semibold leading-[1.5] text-ink-soft">{outcome}</p>

            {warning !== null && (
              <p className="text-[14px] font-bold leading-[1.5] text-coral-dark">{warning}</p>
            )}

            {notice && (
              <p className="text-[14px] font-bold leading-[1.5] text-coral-dark">
                {LOOSE_BLOCKS_NOTICE}
              </p>
            )}
          </div>,
          messageHost
        )}

      {/*
       * LOS BOTONES SE VEN ARRIBA Y VIVEN AQUÍ. El portal los pinta en el hueco
       * que baja la composición, así que cambian de zona de la pantalla sin que
       * el estado del intento ni `start()` salgan de debajo de la frontera
       * diferida —que es lo que arrastraría el intérprete al trozo principal—.
       */}
      {controlsHost !== null &&
        createPortal(
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              className="btn btn-sm btn-leaf flex-1 gap-2 px-3"
              onClick={start}
              disabled={isRunning}
            >
              <PlayIcon />
              Ejecutar
            </button>
            <button
              type="button"
              className="btn btn-sm btn-slate flex-col gap-0.5 px-3 leading-none"
              onClick={stop}
              disabled={!isRunning}
            >
              <StopIcon />
              Detener
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost flex-col gap-0.5 px-3 leading-none"
              onClick={reset}
            >
              <ReloadIcon />
              Reiniciar
            </button>
          </div>,
          controlsHost
        )}
    </div>
  );
};
