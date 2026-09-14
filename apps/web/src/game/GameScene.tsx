import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef, useState, type ElementRef } from 'react';
import { createPortal } from 'react-dom';
import type { Group } from 'three';
import {
  countSteps,
  hasLooseStacks,
  readProgram,
  runProgram,
  stepsTaken,
  type Run,
  type RunStep,
} from './interpreter';
import { TILE_SIZE, type Direction, type LevelConfig, type Pose } from './level';
import { openProgram, type Program } from './program';

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

/*
 * Lo que dura un paso en pantalla. Ni tanto que aburra ni tan poco que el niño
 * no pueda seguir el recorrido con la vista, que es para lo que se anima: si el
 * personaje apareciera directamente en la meta, no habría nada que contar.
 */
const STEP_SECONDS = 0.34;

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
 * EL ENCUADRE DE PARTIDA LO MANDA LA BANDEJA, y por eso son dos números y no
 * uno. Desde que el lienzo va superpuesto al juego, la mitad de abajo del hueco
 * está tapada por él: un tablero centrado y a la distancia de antes metía su
 * fila sur —la de la salida— justo debajo de la bandeja. Medido: la esquina
 * sureste caía 154 px por debajo del borde de la bandeja.
 *
 * Se corrige por los dos lados. `CAMERA_START` aleja la cámara hasta que el
 * tablero cabe en la franja libre, y `BOARD_LIFT` lo sube hasta el centro de
 * esa franja. Alejar sin subir no basta —la perspectiva deja la esquina
 * cercana abajo por mucho que se aleje—, y subir sin alejar saca el borde
 * norte por arriba.
 *
 * La cámara ARRANCA MÁS LEJOS de lo que el tablero de hoy pide, y es a
 * propósito: las cinco por cinco casillas son cubos de colores, y las
 * ilustraciones del mundo ocuparán bastante más alto que una losa de 0,2. Un
 * encuadre ajustado a los cubos se queda corto el día que lleguen, y acercarse
 * está a una rueda de ratón —volver a encuadrar un tablero que ya no cabe, no—.
 * Por eso sube también `MAX_DISTANCE`: el tope de antes queda por debajo del
 * arranque de ahora, y los controles lo recortarían en el primer frame.
 *
 * El ÁNGULO es el mismo de antes —los tres números crecen a la vez, así que la
 * vista no gira—, y la subida se vuelve a medir porque la franja libre ha
 * cambiado: la bandeja abre más plegada.
 *
 * Y el tablero NO se centra en esa franja, que era lo primero que se probó: se
 * queda entre su centro y el del hueco entero, porque centrado en la franja se
 * lee alto —lo que el ojo toma por «el juego» es el hueco, y la bandeja va
 * ENCIMA de él, no al lado—. Lo que manda por abajo es no llegar a tocar la
 * bandeja. Con estos números el tablero cae en 345-623 y la bandeja empieza en
 * 653: 30 px de aire, justo el borde de su sombra.
 *
 * Se levanta EL TABLERO y no el punto al que mira la cámara porque mover ése
 * rompería «Vista inicial»: los controles guardan su vista de partida al
 * construirse, con el punto en el origen, y volver a ella lo devolvería ahí. El
 * personaje va dentro del mismo grupo, así que su casilla se sigue calculando
 * igual: cambia dónde se pinta el tablero, no dónde está.
 */
const CAMERA_START: [number, number, number] = [6.7, 9.5, 9.5];
const BOARD_LIFT = 1.8;

/*
 * EL TABLERO CONTRA EL QUE SE MIDIERON LOS DOS NÚMEROS DE ARRIBA: cinco por
 * cinco casillas, que es la rejilla de pega del J2. Desde que el nivel llega de
 * la base el tablero ya no mide siempre eso, así que esas cifras dejan de valer
 * como cifras y pasan a valer como REFERENCIA: lo que se conserva es la
 * relación. Con un tablero de cinco, todo esto da exactamente lo de antes.
 */
const REFERENCE_SPAN = 5;

/*
 * LA CÁMARA ARRANCA A LA DISTANCIA QUE PIDE EL TABLERO, y no a una fija: un
 * tablero pequeño encuadrado para un 5 × 5 se queda minúsculo, y entonces la
 * rejilla deja de poder contarse, que es lo único que el niño necesita ver.
 *
 * Se escala la POSICIÓN entera, así que el ángulo no cambia. Manda el lado mayor
 * porque es el que primero se sale del encuadre.
 *
 * Y CON ELLA SE ESCALAN `BOARD_LIFT` Y `MAX_DISTANCE`. La subida coloca el
 * tablero en la franja que la bandeja deja libre, y cuánto hay que subir depende
 * de lo lejos que esté la cámara: medido, acercarla sin tocar la subida saca el
 * tablero por arriba. Y el tope del acercamiento, porque la partida sale a
 * 3,0026 por casilla del lado mayor: con el tope fijo de 18, un tablero de seis
 * arrancaría recortado. El SUELO no se escala y no es incoherencia: no meterse
 * dentro del tablero es una distancia absoluta, y no perderlo de vista es
 * relativa a lo grande que sea.
 */
const boardScale = (config: LevelConfig): number => {
  const span = Math.max(config.tiles.length, config.tiles[0]?.length ?? 0);

  return Math.max(span / REFERENCE_SPAN, MIN_DISTANCE / Math.hypot(...CAMERA_START));
};

const cameraStartFor = (config: LevelConfig): [number, number, number] => {
  const scale = boardScale(config);

  return [CAMERA_START[0] * scale, CAMERA_START[1] * scale, CAMERA_START[2] * scale];
};

/*
 * Los iconos de la superposición y de los botones. Van aquí y no en
 * `components/decor/` porque no son adornos: nombran lo que hace cada control, y
 * viven pegados a él.
 */
const BackIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ViewCubeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" fill="currentColor" opacity="0.35" />
    <path d="M4 7.5L12 12l8-4.5M12 12v9" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
        }),
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

    const progress = Math.min(elapsed.current / STEP_SECONDS, 1);

    /*
     * UN SALTO SON DOS ENTRADAS Y UN SOLO ARCO. El recorrido lleva el despegue y
     * el aterrizaje por separado porque cada casilla saltada cuesta dos pasos, y
     * aquí se cosen: el despegue dibuja la primera mitad del arco —hacia donde
     * caerá, que dice el paso siguiente— y el aterrizaje la segunda. Un salto
     * vacío es el arco entero en el sitio.
     *
     * `along` es lo recorrido del trayecto completo, de la casilla de partida a la
     * de llegada; en un paso andando coincide con el progreso.
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

    const along = alongFrom + (alongTo - alongFrom) * progress;
    const lift = step.motion === 'walk' ? 0 : JUMP_HEIGHT * 4 * along * (1 - along);
    const [toX, toZ] = place(target.cell.row, target.cell.column);
    const toY = topOf(config, target.cell.row, target.cell.column);

    /*
     * Un avance imposible no mueve al personaje, así que sin topetazo el paso
     * sería un tercio de segundo de nada: el niño no vería CONTRA QUÉ se paró,
     * que es justo lo que `advance` devuelve en `blockedBy` para que se enseñe.
     */
    const bump =
      step.blockedBy === null
        ? 0
        : BUMP_DISTANCE * (progress < 0.5 ? progress * 2 : (1 - progress) * 2);
    const [offsetX, offsetZ] = FACING_OFFSET[step.pose.facing];

    node.position.x = x + (toX - x) * along + offsetX * bump;
    node.position.y = y + (toY - y) * along + lift;
    node.position.z = z + (toZ - z) * along + offsetZ * bump;

    angle.current =
      angleFrom.current +
      shortestTurn(angleFrom.current, FACING_ANGLE[step.pose.facing]) * progress;
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
  | { kind: 'run'; run: Run; steps: number; rootCount: number };

const stepsLabel = (count: number): string => (count === 1 ? '1 paso' : `${count} pasos`);

const OUTCOME_MESSAGES = {
  idle: 'Coloca bloques y pulsa «Ejecutar» para ver al personaje moverse.',
  running: 'Ejecutando el programa…',
  stopped: 'Has detenido el recorrido. Pulsa «Ejecutar» para empezar otra vez.',
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
 * Gastar MENOS pasos que `optimalSteps` también es perfecto, y lleva texto
 * propio. Significa que el número del nivel está sembrado por encima del óptimo
 * real —el contrato §4.2 avisa de que no lo comprueba nadie—, y eso lo caza
 * quien siembra el nivel resolviendo su puzle, no el niño que lo juega: no se le
 * acusa de nada. El texto de los pasos justos es el que no sirve aquí, porque
 * afirma una igualdad que en ese caso sería falsa.
 */
const outcomeOf = (run: Run, steps: number, optimalSteps: number): string => {
  const best = `la mejor solución cuesta ${stepsLabel(optimalSteps)}`;

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

export const GameScene = ({ level, program, controlsHost, messageHost }: GameSceneProps) => {
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

  // Los pasos DADOS, que es lo único que el contador dice. La cuenta vive fuera.
  const steps = stepsTaken(run, index, isRunning);

  /*
   * El arranque cuelga del evento del botón y NUNCA de un efecto: con
   * `React.StrictMode` un efecto se dispara dos veces en desarrollo, y aquí eso
   * sería el recorrido ejecutándose por duplicado.
   */
  const start = useCallback(() => {
    // Sin editor todavía montado no hay programa, y eso es un lienzo vacío (§4.3).
    const workspace = latest.current === null ? {} : openProgram(latest.current);
    const reading = workspace === null ? null : readProgram(workspace);

    setIndex(0);
    setHalted(false);

    if (reading === null) {
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
    });
  }, [config]);

  /*
   * Detener es ADELANTAR EL ÍNDICE y marcar el intento como congelado, y con eso
   * salen tres cosas de una: la pose pasa a ser la del paso en curso —que es
   * donde el usuario quiere que se quede el personaje, en su casilla y con su
   * orientación—, el paso a animar se vuelve `null` y el bucle de frames se
   * planta, y el contador se queda en el paso que se estaba dando.
   *
   * El personaje ATERRIZA en esa casilla en vez de congelarse entre dos: un cubo
   * parado a medio camino se lee como un fallo de dibujo, y lo que se recorre de
   * más dura un tercio de segundo.
   */
  const stop = useCallback(() => {
    setIndex((current) => current + 1);
    setHalted(true);
  }, []);

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
      <Canvas camera={{ position: cameraStartFor(config), fov: 45 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 3]} intensity={2.2} />

        <group name={BOARD_NODE} position={[0, BOARD_LIFT * boardScale(config), 0]}>
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
          maxDistance={MAX_DISTANCE * boardScale(config)}
        />
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
       * El contador dice lo que LLEVA y nunca lo que falta. Enseñar el número a
       * batir mientras se juega convierte el nivel en un problema de optimización
       * cuando todavía es un problema de llegar; lo que costó y lo que costaba lo
       * bueno se dicen al terminar, y ahí es una lección y no una exigencia.
       *
       * Y se ve SIEMPRE, con un cero en reposo: un marcador ya puesto explica de
       * qué van a ser los números que suban, y un cero no es un número a batir.
       * No usa el texto del resultado a propósito —aquí la etiqueta es la que
       * nombra la magnitud, y allí la frase ya la nombra—.
       */}
      <p className="pointer-events-none absolute right-4 top-4 flex items-center gap-2.5 rounded-full bg-ink px-4 py-2 font-display text-[17px] text-white shadow-[0_6px_18px_rgba(42,27,69,0.28)]">
        <StepsIcon />
        Pasos: {steps}
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
          messageHost,
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
          controlsHost,
        )}
    </div>
  );
};
