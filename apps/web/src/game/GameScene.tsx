import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import { debugLevel } from './debugLevel';
import { TILE_SIZE, type Direction, type LevelConfig, type Pose } from './level';
import { advance, turn } from './movement';

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
 * La ÚNICA traducción de casilla a coordenadas del mundo. Centrar el tablero
 * alrededor del origen deja la cámara independiente del tamaño de la rejilla.
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

const Character = ({ config, pose }: { config: LevelConfig; pose: Pose }) => {
  const place = useBoardPlacement(config);
  const [x, z] = place(pose.cell.row, pose.cell.column);

  return (
    <group position={[x, 0, z]} rotation={[0, FACING_ANGLE[pose.facing], 0]}>
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

/*
 * Las órdenes sueltas del J2, hasta que el J4 traiga los bloques. Sólo en
 * desarrollo, y el acceso a `import.meta.env.DEV` es de miembro y nunca
 * desestructurado, para que Vite pueda eliminar la rama entera en producción
 * — el mismo patrón que `context/guest.helpers.ts`.
 */
declare global {
  interface Window {
    codeplayGame?: {
      forward: () => void;
      left: () => void;
      right: () => void;
      reset: () => void;
    };
  }
}

export const GameScene = () => {
  const [pose, setPose] = useState<Pose>(debugLevel.start);

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return;
    }

    window.codeplayGame = {
      forward: () => setPose((current) => advance(debugLevel, current).pose),
      left: () => setPose((current) => ({ ...current, facing: turn(current.facing, 'left') })),
      right: () => setPose((current) => ({ ...current, facing: turn(current.facing, 'right') })),
      reset: () => setPose(debugLevel.start),
    };

    return () => {
      delete window.codeplayGame;
    };
  }, []);

  return (
    <Canvas camera={{ position: [3.8, 5.4, 5.4], fov: 45 }}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[4, 6, 3]} intensity={2.2} />

      <Board config={debugLevel} />
      <Character config={debugLevel} pose={pose} />
    </Canvas>
  );
};
