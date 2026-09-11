import { Clone, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useCallback, useMemo, useRef, useState, type ElementRef } from 'react';
import { createPortal } from 'react-dom';
import { BufferGeometry, Float32BufferAttribute } from 'three';
import type { Group } from 'three';
import { debugLevel } from './debugLevel';
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
 * LOS TRES COLORES DEL SUELO NO SON DEL TEMA: SON DEL KIT, y por eso están aquí
 * en vez de en `tailwind.config.js`. El tablero lo dibuja el juego, pero encima
 * se posan piezas de Kenney, y un verde parecido se ve como un remiendo.
 *
 * `Textures/colormap.png` del platformer no es un dibujo: es una paleta de 16 ×
 * 16 celdas, y cada modelo apunta con sus UV a la suya. Los tres de abajo salen
 * medidos de ahí, con las UV leídas del propio `block-grass.glb`: la cara de
 * arriba usa (0,9688 · 0,5312) y las de abajo (0,4688 · 0,5312). El verde
 * oscuro del damero es la celda de debajo de la hierba, (0,9688 · 0,5938).
 *
 * Es el COLOR DEL CENTRO de cada celda, que no es lo mismo que el color de la
 * celda: llevan 27, 27 y 31 tonos distintos —un degradado mínimo de la
 * compresión— que en pantalla no se ven.
 */
const GRASS_LIGHT = '#57C186';
const GRASS_DARK = '#45AF7E';
const SOIL = '#E89066';

const CHARACTER_COLOR = '#7B3FE4'; // grape
const SNOUT_COLOR = '#FFF9EF'; // cream

/*
 * LOS MODELOS SE PIDEN POR URL, no se importan: viven en `public/`, que Vite
 * sirve tal cual y sin renombrar, así que no entran al grafo del bundle —lo que
 * entra es el cargador—. `useLoader` los cachea por URL, así que pedir el mismo
 * archivo dos veces no lo descarga dos veces.
 *
 * Y va con el `GLTFLoader` de `three`, no con `useGLTF` de drei: aquél arrastra
 * al trozo los decodificadores de Draco y de Meshopt —26 kB medidos— que ningún
 * modelo de estos kits usa, y de fábrica engancha el de Draco contra un CDN
 * ajeno.
 *
 * Ninguno de los 233 modelos lleva su textura dentro: los dos kits apuntan por
 * ruta relativa a su `Textures/colormap.png`, que tiene que seguir siendo
 * hermano de los `.glb` de su carpeta o salen en blanco SIN error en consola.
 */
const PLATFORM_MODEL = '/models/platformer/platform.glb';
const GOAL_MODEL = '/models/platformer/flag.glb';
const ROCK_MODEL = '/models/survival/rock-b.glb';
const STUMP_MODEL = '/models/survival/tree-trunk.glb';

const PLATFORM_LARGE_MODEL = '/models/platformer/block-grass-large.glb';
const PLATFORM_TALL_MODEL = '/models/platformer/block-grass-large-tall.glb';
const TREE_MODEL = '/models/platformer/tree.glb';
const PINE_MODEL = '/models/platformer/tree-pine.glb';
const FENCE_MODEL = '/models/platformer/fence-straight.glb';
const FLAT_ROCK_MODEL = '/models/survival/rock-flat.glb';

const BOARD_MODELS = [PLATFORM_MODEL, GOAL_MODEL, ROCK_MODEL, STUMP_MODEL];
const SCENERY_MODELS = [
  PLATFORM_LARGE_MODEL,
  PLATFORM_TALL_MODEL,
  TREE_MODEL,
  PINE_MODEL,
  FENCE_MODEL,
  FLAT_ROCK_MODEL,
  PLATFORM_MODEL,
];

useLoader.preload(GLTFLoader, [...BOARD_MODELS, ...SCENERY_MODELS]);

/** Lo que baja el canto de tierra, y cuánto sobresale la hierba por encima. */
const GROUND_DEPTH = 0.6;
const GRASS_LIP = 0.04;

/*
 * CÓMO SE LEE LA CASILLA DEL PERSONAJE DESDE FUERA, y por qué son dos nombres.
 *
 * Comprobar este juego es comparar DÓNDE ESTÁ EL PERSONAJE contra lo que el
 * intérprete dice —una pantalla que dice de sí misma que hizo algo no es la
 * prueba de que lo hizo—, y hasta ahora eso se hacía buscando en la escena el
 * material morado del cubo. Eso ata la comprobación al aspecto: el día que el
 * cubo deje paso a un modelo, la única verificación que vale se va con él.
 *
 * Con nombre, `scene.getObjectByName` da el grupo del personaje sea cual sea su
 * aspecto, y su posición LOCAL —dentro del grupo del tablero— da la casilla:
 * `col = x + 2`, `fila = z + 2`. Por eso el tablero también lleva nombre: es el
 * marco en el que esa cuenta significa algo. Comprobado contra la vía vieja: las
 * dos dan la misma lectura en las 32 muestras de un PROGRAMA A entero.
 */
const BOARD_NODE = 'board';
const SCENERY_NODE = 'scenery';
const CHARACTER_NODE = 'character';

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
 * EL SUELO ES UNA SOLA PIEZA, y ésa es la decisión de la que cuelga todo lo
 * demás. Un bloque del kit por casilla —que fue el primer intento— no se lee
 * como un suelo: se ven veinticinco piezas puestas una al lado de otra. Aquí el
 * tablero es UNA geometría con tres grupos de material: los dos verdes del
 * damero arriba y la tierra en el canto.
 *
 * La cuadrícula se ve SÓLO por el color. Las casillas comparten arista, así que
 * no hay junta ni rendija que dibujar, y lo único que distingue una de la
 * siguiente es el tono. Es la única razón por la que la cuadrícula se ve: el
 * niño cuenta casillas para saber cuántos pasos da.
 *
 * El canto se dibuja SÓLO en el contorno —el de fuera y el del hueco—, porque
 * por dentro no se ve nada, y va metido `GRASS_LIP` hacia dentro para que la
 * hierba sobresalga: es el labio que tienen las piezas del kit, y sin él la
 * arista entre hierba y tierra queda viva y no se parece a lo que va al lado.
 *
 * La forma la manda `LevelConfig`, así que un tablero sin huecos —los niveles de
 * verdad no los llevan— sale de aquí sin tocar nada.
 */
const useBoardGeometry = (config: LevelConfig) =>
  useMemo(() => {
    const rows = config.tiles.length;
    const columns = config.tiles[0]?.length ?? 0;
    const drawn = (row: number, column: number) =>
      row >= 0 &&
      row < rows &&
      column >= 0 &&
      column < columns &&
      config.tiles[row][column] !== 'gap';

    const light: number[] = [];
    const dark: number[] = [];
    const soil: number[] = [];

    const quad = (
      into: number[],
      a: [number, number, number],
      b: [number, number, number],
      c: [number, number, number],
      d: [number, number, number],
    ) => {
      into.push(...a, ...b, ...c, ...a, ...c, ...d);
    };

    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        if (!drawn(row, column)) {
          continue;
        }

        const x0 = (column - (columns - 1) / 2) * TILE_SIZE - TILE_SIZE / 2;
        const x1 = x0 + TILE_SIZE;
        const z0 = (row - (rows - 1) / 2) * TILE_SIZE - TILE_SIZE / 2;
        const z1 = z0 + TILE_SIZE;

        quad(
          (row + column) % 2 === 0 ? light : dark,
          [x0, 0, z1],
          [x1, 0, z1],
          [x1, 0, z0],
          [x0, 0, z0],
        );

        const inX0 = x0 + GRASS_LIP;
        const inX1 = x1 - GRASS_LIP;
        const inZ0 = z0 + GRASS_LIP;
        const inZ1 = z1 - GRASS_LIP;
        const bottom = -GROUND_DEPTH;

        /*
         * EL LABIO SE METE SÓLO HACIA DENTRO DE SU CARA, nunca a lo largo de
         * ella. Metiéndolo por los cuatro costados —que es como estaba— dos
         * casillas vecinas del contorno dejaban 0,08 de aire entre sus faldones
         * y por ahí se veía el fondo: una rendija blanca en el canto, que es
         * justo lo que este paso vino a quitar. A lo largo de la cara el panel
         * va de borde a borde, y en las esquinas los dos paneles se cruzan un
         * poco: un solape que no se ve es mejor que una rendija que sí.
         */
        if (!drawn(row - 1, column)) {
          quad(soil, [x0, 0, inZ0], [x1, 0, inZ0], [x1, bottom, inZ0], [x0, bottom, inZ0]);
        }

        if (!drawn(row + 1, column)) {
          quad(soil, [x1, 0, inZ1], [x0, 0, inZ1], [x0, bottom, inZ1], [x1, bottom, inZ1]);
        }

        if (!drawn(row, column - 1)) {
          quad(soil, [inX0, 0, z1], [inX0, 0, z0], [inX0, bottom, z0], [inX0, bottom, z1]);
        }

        if (!drawn(row, column + 1)) {
          quad(soil, [inX1, 0, z0], [inX1, 0, z1], [inX1, bottom, z1], [inX1, bottom, z0]);
        }
      }
    }

    const geometry = new BufferGeometry();

    geometry.setAttribute(
      'position',
      new Float32BufferAttribute([...light, ...dark, ...soil], 3),
    );
    geometry.addGroup(0, light.length / 3, 0);
    geometry.addGroup(light.length / 3, dark.length / 3, 1);
    geometry.addGroup((light.length + dark.length) / 3, soil.length / 3, 2);
    geometry.computeVertexNormals();

    return geometry;
  }, [config]);

/*
 * EL ESCENARIO DE FUERA, y la regla que lo gobierna entero: LAS PIEZAS SE
 * FUSIONAN. Nada se posa entero y despegado al lado de otra cosa —cada
 * plataforma se solapa con el tablero o con su vecina, cada árbol se hunde en la
 * plataforma que lo sostiene y la pasarela sale del canto en vez de flotar entre
 * dos—. Lo apoyado y separado es justo lo que el usuario devolvió del primer
 * intento.
 *
 * Va DENTRO del grupo del tablero para que lo levante el mismo `BOARD_LIFT` y
 * la cuenta de la casilla siga significando lo mismo. Y va fuera de la rejilla:
 * el tablero llega a ±2,5, así que todo lo de aquí empieza más allá y sólo
 * muerde lo justo para fundirse.
 *
 * Las alturas son la cara de arriba de cada plataforma; los modelos crecen
 * desde su base, así que la `y` de cada pieza es esa cara menos lo que mide.
 * Ninguna de estas cifras es requisito de nada: el J7.4 rehará el escenario
 * mundo por mundo.
 */
const SCENERY: {
  model: string;
  position: [number, number, number];
  scale?: number;
  turn?: number;
}[] = [
  /*
   * LA LÍNEA QUE NO SE CRUZA ES LA HUELLA DEL TABLERO: nada que asome por
   * encima de la hierba entra en x ni en z entre −2,5 y 2,5. Fundir es que las
   * piezas no se lean despegadas, y para eso basta con que **se toquen** y con
   * que las plataformas se muerdan **entre ellas**, que es donde el solape no le
   * quita nada a nadie. Metidas en el tablero, en cambio, se comen la casilla
   * —y las dos que más importan son la salida y la meta—.
   *
   * `block-grass-large` mide 2,0821 de lado, así que su borde queda pegado al
   * del tablero con el centro en ±3,541. Ésa es la cifra de la que salen las
   * columnas de la izquierda y de la derecha, y la fila del sur.
   *
   * Y LAS PLATAFORMAS NO SE GIRAN: girar un bloque cuadrado no cambia nada a la
   * vista y le engorda la caja alineada en `|cos t| + |sin t| − 1`, que es un
   * 25 % a 0,3 rad y un 18 % a 0,2 —hasta el 41 % a 45°—. Con eso, dos de ellas
   * se metían **0,26 y 0,19** dentro del tablero sólo por el giro. Lo que se
   * gira son las piezas de encima, que es donde se nota y donde no hay huella
   * que respetar.
   */
  { model: PLATFORM_TALL_MODEL, position: [-3.541, -1, -3] },
  { model: PLATFORM_TALL_MODEL, position: [3.541, -1.2, -2.8] },
  { model: PLATFORM_LARGE_MODEL, position: [-3.541, -0.7, -1] },
  { model: PLATFORM_LARGE_MODEL, position: [3.541, -0.8, -0.9] },
  { model: PLATFORM_LARGE_MODEL, position: [-2, -0.9, 3.541] },

  // Los árboles, hundidos en la plataforma que los sostiene y a escalas distintas.
  { model: TREE_MODEL, position: [-3.9, 0.85, -3.2], scale: 0.9, turn: 0.5 },
  { model: PINE_MODEL, position: [-3.25, 0.85, -3.6], scale: 1.15, turn: -1.2 },
  { model: PINE_MODEL, position: [3.8, 0.65, -3.1], scale: 0.85, turn: 2 },
  { model: TREE_MODEL, position: [3.25, 0.65, -2.6], scale: 0.7, turn: -0.6 },

  // La piedra plana, tumbada sobre la plataforma baja de la derecha.
  { model: FLAT_ROCK_MODEL, position: [3.6, 0.14, -0.9], scale: 0.8, turn: 0.4 },

  // La valla, en su plataforma propia detrás del personaje y sin tocar el tablero.
  { model: FENCE_MODEL, position: [-2.5, 0.05, 3.3], scale: 1 },
  { model: FENCE_MODEL, position: [-1.5, 0.05, 3.3], scale: 1 },

  // El trozo de pasarela: sale del canto de la plataforma, no flota entre dos.
  { model: PLATFORM_MODEL, position: [-3.05, 0.22, -1], turn: 0.1 },
];

const Scenery = () => {
  const models = useLoader(GLTFLoader, SCENERY_MODELS);
  const scenes: Record<string, Group> = {};

  SCENERY_MODELS.forEach((url, index) => {
    scenes[url] = models[index].scene;
  });

  return (
    <group name={SCENERY_NODE}>
      {SCENERY.map((piece, index) => (
        <Clone
          key={`${piece.model}-${index}`}
          object={scenes[piece.model]}
          position={piece.position}
          rotation={[0, piece.turn ?? 0, 0]}
          scale={piece.scale ?? 1}
        />
      ))}
    </group>
  );
};

/*
 * LO QUE OCUPA CADA CASILLA QUE NO SE PISA, y por qué son piezas distintas: un
 * tablero con cuatro veces el mismo cubo no dice nada; con una plataforma de
 * madera, dos rocas y un tocón, cada casilla cuenta algo. La repartición la
 * decidió el usuario sobre su boceto.
 *
 * `sink` es lo que se HUNDE la pieza por debajo del plano de pisar, y no es un
 * ajuste fino: una roca apoyada encima parece puesta ahí y una hundida parece
 * que está. Es la regla que gobierna este paso entero — las piezas se funden,
 * no se posan.
 *
 * Y `scale` las lleva a pasar de su casilla, que es lo que las hace leerse como
 * obstáculo: los adornos del tramo siguiente miden la mitad, y ésa es toda la
 * diferencia que el niño necesita ver.
 */
const OBSTACLES: Record<string, { model: string; scale: number; sink: number; turn: number }> = {
  '0-3': { model: PLATFORM_MODEL, scale: 1, sink: 0.05, turn: 0 },
  '1-1': { model: ROCK_MODEL, scale: 1.6, sink: 0.16, turn: 0.6 },
  '3-3': { model: ROCK_MODEL, scale: 1.45, sink: 0.12, turn: -2.1 },
  '3-1': { model: STUMP_MODEL, scale: 4, sink: 0.16, turn: 0.9 },
};

const Obstacles = ({ config }: { config: LevelConfig }) => {
  const place = useBoardPlacement(config);
  const [platform, flag, rock, stump] = useLoader(GLTFLoader, BOARD_MODELS);
  const scenes: Record<string, Group> = {
    [PLATFORM_MODEL]: platform.scene,
    [ROCK_MODEL]: rock.scene,
    [STUMP_MODEL]: stump.scene,
  };

  const [goalX, goalZ] = place(config.goal.row, config.goal.column);

  return (
    <>
      {config.tiles.map((tileRow, row) =>
        tileRow.map((kind, column) => {
          if (kind !== 'wall') {
            return null;
          }

          const spot = OBSTACLES[`${row}-${column}`];

          if (spot === undefined) {
            return null;
          }

          const [x, z] = place(row, column);

          return (
            <Clone
              key={`${row}-${column}`}
              object={scenes[spot.model]}
              position={[x, -spot.sink, z]}
              rotation={[0, spot.turn, 0]}
              scale={spot.scale}
            />
          );
        }),
      )}

      {/*
       * La meta la dice la bandera y nada más: la salida NO se marca, porque
       * basta con que el personaje esté ahí. Los dos tintes de antes —azul en la
       * salida, amarillo en la meta— se fueron con la losa por casilla.
       */}
      <Clone object={flag.scene} position={[goalX - 0.15, -0.05, goalZ]} rotation={[0, -0.4, 0]} />
    </>
  );
};

const Board = ({ config }: { config: LevelConfig }) => {
  const geometry = useBoardGeometry(config);

  return (
    <>
      {/*
       * `metalness` a cero y la rugosidad por defecto, que es lo que declaran los
       * materiales del kit: así el suelo que dibujamos y las piezas que se posan
       * encima se iluminan igual y el canto de tierra es el mismo color a la
       * vista, no un color parecido.
       */}
      <mesh geometry={geometry}>
        <meshStandardMaterial attach="material-0" color={GRASS_LIGHT} metalness={0} />
        <meshStandardMaterial attach="material-1" color={GRASS_DARK} metalness={0} />
        <meshStandardMaterial attach="material-2" color={SOIL} metalness={0} />
      </mesh>

      <Obstacles config={config} />
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
    <group
      ref={group}
      name={CHARACTER_NODE}
      position={[x, 0, z]}
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

export const GameScene = ({ program, controlsHost, messageHost }: GameSceneProps) => {
  const config = debugLevel;

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
      <Canvas camera={{ position: CAMERA_START, fov: 45 }}>
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 3]} intensity={2.2} />

        <group name={BOARD_NODE} position={[0, BOARD_LIFT, 0]}>
          <Scenery />
          <Board config={config} />
          <Character
            config={config}
            pose={pose}
            step={step}
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
