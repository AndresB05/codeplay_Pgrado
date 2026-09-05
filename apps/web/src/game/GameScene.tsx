import { Canvas, useFrame } from '@react-three/fiber';
import { useCallback, useMemo, useRef, useState } from 'react';
import type { Group } from 'three';
import { debugLevel } from './debugLevel';
import { readProgram, runProgram, type Run, type RunStep } from './interpreter';
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
const CHARACTER_COLOR = '#7B3FE4'; // grape
const SNOUT_COLOR = '#FFF9EF'; // cream

const SLAB_HEIGHT = 0.2;

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

const TWO_PI = Math.PI * 2;

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
          const isStart = config.start.cell.row === row && config.start.cell.column === column;
          const isGoal = config.goal.row === row && config.goal.column === column;

          let slabColor = (row + column) % 2 === 0 ? FLOOR_COLOR : FLOOR_ALT_COLOR;
          if (kind === 'wall') {
            slabColor = WALL_BASE_COLOR;
          } else if (isGoal) {
            slabColor = GOAL_COLOR;
          } else if (isStart) {
            slabColor = START_COLOR;
          }

          return (
            <group key={`${row}-${column}`} position={[x, 0, z]}>
              <mesh position={[0, -SLAB_HEIGHT / 2, 0]}>
                <boxGeometry args={[TILE_SIZE, SLAB_HEIGHT, TILE_SIZE]} />
                <meshStandardMaterial color={slabColor} />
              </mesh>

              {kind === 'wall' && (
                <mesh position={[0, TILE_SIZE / 2, 0]}>
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
  stepIndex: number;
  onStepDone: (stepIndex: number) => void;
}

const Character = ({ config, pose, step, stepIndex, onStepDone }: CharacterProps) => {
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
    const [toX, toZ] = place(step.pose.cell.row, step.pose.cell.column);

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

    node.position.x = x + (toX - x) * progress + offsetX * bump;
    node.position.z = z + (toZ - z) * progress + offsetZ * bump;

    angle.current =
      angleFrom.current +
      shortestTurn(angleFrom.current, FACING_ANGLE[step.pose.facing]) * progress;
    node.rotation.y = angle.current;

    if (progress === 1) {
      onStepDone(stepIndex);
    }
  });

  return (
    <group ref={group} position={[x, 0, z]} rotation={[0, FACING_ANGLE[pose.facing], 0]}>
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
  program: Program | null;
}

/** Lo que se enseña del resultado, y nada más: el recuento es del J6. */
const OUTCOME_MESSAGES = {
  idle: 'Coloca bloques y pulsa «Ejecutar» para ver al personaje moverse.',
  running: 'Ejecutando el programa…',
  reached: '¡Llegaste a la meta!',
  missed: 'No llegaste a la meta.',
  unreadable: 'Ese programa no se puede leer.',
};

export const GameScene = ({ program }: GameSceneProps) => {
  const config = debugLevel;

  const [run, setRun] = useState<Run | null>(null);
  const [index, setIndex] = useState(0);
  const [unreadable, setUnreadable] = useState(false);

  /*
   * El programa se lee al pulsar, no al recibirlo: si viajara en el estado, mover
   * un bloque a mitad de recorrido cambiaría lo que se está ejecutando. Es la
   * misma referencia que `BlockEditor` usa para publicar hacia arriba, y por el
   * mismo motivo.
   */
  const latest = useRef(program);
  latest.current = program;

  const step = run !== null && index < run.steps.length ? run.steps[index] : null;
  const pose = run === null || index === 0 ? config.start : run.steps[index - 1].pose;
  const isRunning = step !== null;

  /*
   * El arranque cuelga del evento del botón y NUNCA de un efecto: con
   * `React.StrictMode` un efecto se dispara dos veces en desarrollo, y aquí eso
   * sería el recorrido ejecutándose por duplicado.
   */
  const start = useCallback(() => {
    // Sin editor todavía montado no hay programa, y eso es un lienzo vacío (§4.3).
    const workspace = latest.current === null ? {} : openProgram(latest.current);
    const orders = workspace === null ? null : readProgram(workspace);

    setUnreadable(orders === null);
    setIndex(0);
    setRun(orders === null ? null : runProgram(config, orders));
  }, [config]);

  const reset = useCallback(() => {
    setRun(null);
    setIndex(0);
    setUnreadable(false);
  }, []);

  const advanceStep = useCallback((finished: number) => {
    // Un frame puede llegar con el paso ya terminado antes de que React repinte.
    setIndex((current) => (current === finished ? current + 1 : current));
  }, []);

  let outcome = OUTCOME_MESSAGES.idle;
  if (unreadable) {
    outcome = OUTCOME_MESSAGES.unreadable;
  } else if (isRunning) {
    outcome = OUTCOME_MESSAGES.running;
  } else if (run !== null) {
    outcome = run.success ? OUTCOME_MESSAGES.reached : OUTCOME_MESSAGES.missed;
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1">
        <Canvas camera={{ position: [3.8, 5.4, 5.4], fov: 45 }}>
          <ambientLight intensity={1.4} />
          <directionalLight position={[4, 6, 3]} intensity={2.2} />

          <Board config={config} />
          <Character
            config={config}
            pose={pose}
            step={step}
            stepIndex={index}
            onStepDone={advanceStep}
          />
        </Canvas>
      </div>

      {/*
       * La barra va FUERA del `<Canvas>` —dentro los elementos son objetos de
       * three, no etiquetas de HTML— y DENTRO de este archivo: la pantalla de
       * nivel del J8 tiene que heredar los controles, no volver a escribirlos.
       */}
      <div className="flex flex-wrap items-center gap-3 border-t-[3px] border-ink bg-cream px-4 py-3">
        <button type="button" className="btn btn-sm btn-leaf" onClick={start} disabled={isRunning}>
          Ejecutar
        </button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={reset}>
          Reiniciar
        </button>
        <p className="text-[15px] font-semibold leading-[1.5] text-ink-soft">{outcome}</p>
      </div>
    </div>
  );
};
