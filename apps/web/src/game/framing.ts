import { PerspectiveCamera, Vector3 } from 'three';
import { TILE_SIZE, type LevelConfig } from './level';

/*
 * EL ENCUADRE DE PARTIDA, CALCULADO. Sustituye a los dos números que se midieron
 * a mano contra un 5 × 5 plano —la distancia de la cámara y la subida del
 * tablero—, que dejaban fuera por arriba una torre de altura seis.
 *
 * Sólo aleja, acerca y sube: NO deforma. Estirar la imagen a lo ancho se probó y
 * el usuario lo retiró el 14-sep-2026 al verlo —«se ve feo y amontonado»—: los
 * cubos se quedan cubos.
 *
 * Es puro y sin WebGL: proyectar un punto es aritmética de `three`, así que se
 * prueba entero, al revés que la escena.
 */

/* El ángulo de siempre: el de la vista que eligió el usuario para todos los niveles. */
const DIRECTION = new Vector3(6.7, 9.5, 9.5).normalize();

export const FOV = 45;

/*
 * Lo que se deja libre alrededor, en píxeles, ajustado con el usuario sobre dos
 * capturas suyas el 14-sep-2026: lo más alto del tablero «casi al mismo alto que
 * los botones» —el borde de abajo de «Vista inicial» y del contador— y la base
 * casi tocando la bandeja. Los botones van en las esquinas y el tablero en el
 * centro, así que no se tapan. A los lados, que ninguna casilla toque el borde
 * redondeado del juego.
 */
export const MARGIN_TOP_PX = 56;
const MARGIN_BOTTOM = 8;
const MARGIN_SIDE = 28;

/* Lo que mide el personaje de pie, que es lo que no puede cortarse en la meta. */
export const CHARACTER_HEIGHT = 0.8 * TILE_SIZE;

export interface Viewport {
  width: number;
  height: number;
  /* El alto que la bandeja del lienzo deja libre, contado desde arriba. */
  freeHeight: number;
}

export interface Framing {
  position: [number, number, number];
  /* Cuánto sube el tablero, que es lo que lo centra sin mover el punto que mira la cámara. */
  lift: number;
}

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/*
 * Las esquinas de CADA COLUMNA que existe, de su base a su cara de arriba más
 * `above`, y no las de una caja con la columna más alta en todo el tablero: esa
 * caja mide esquinas vacías a altura seis y deja la torre del mundo 2 más pequeña
 * de lo que cabe. Los huecos no se miden: no se dibujan.
 */
const boardCorners = (config: LevelConfig, lift: number, above: number): Vector3[] => {
  const rows = config.tiles.length;
  const columns = config.tiles[0]?.length ?? 0;
  const bottom = -TILE_SIZE + lift;
  const half = TILE_SIZE / 2;

  return config.tiles.flatMap((tileRow, row) =>
    tileRow.flatMap((kind, column) => {
      if (kind === 'gap') {
        return [];
      }

      const x = (column - (columns - 1) / 2) * TILE_SIZE;
      const z = (row - (rows - 1) / 2) * TILE_SIZE;
      const top = (config.heights[row][column] - 1) * TILE_SIZE + above + lift;

      return [-half, half].flatMap((dx) =>
        [-half, half].flatMap((dz) => [
          new Vector3(x + dx, bottom, z + dz),
          new Vector3(x + dx, top, z + dz),
        ]),
      );
    }),
  );
};

/*
 * Dónde cae el tablero en la pantalla, en píxeles, con la cámara a `distance`.
 * `above` es lo que se cuenta por encima de cada columna: nada para el tablero,
 * `CHARACTER_HEIGHT` para saber dónde queda la cabeza de quien esté encima.
 */
export const projectBounds = (
  config: LevelConfig,
  viewport: Viewport,
  distance: number,
  lift: number,
  above = 0,
): Bounds => {
  const camera = new PerspectiveCamera(FOV, viewport.width / viewport.height, 0.1, 1000);
  camera.position.copy(DIRECTION).multiplyScalar(distance);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();

  const points = boardCorners(config, lift, above).map((corner) => corner.project(camera));

  /*
   * Un punto detrás de la cámara se proyecta dado la vuelta y parece caber. Se
   * cuenta como que no cabe, o la búsqueda acaba con la cámara dentro del tablero.
   */
  if (points.some((point) => point.z <= -1 || point.z >= 1)) {
    return { left: -Infinity, right: Infinity, top: -Infinity, bottom: Infinity };
  }

  const xs = points.map((point) => ((point.x + 1) / 2) * viewport.width);
  const ys = points.map((point) => ((1 - point.y) / 2) * viewport.height);

  return {
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
    bottom: Math.max(...ys),
  };
};

/*
 * La búsqueda es por bisección y no una fórmula: con perspectiva, el tamaño en
 * pantalla no es proporcional a la distancia para una caja que tiene fondo, y la
 * subida mueve además la caja más cerca o más lejos de la cámara. Las dos
 * magnitudes son monótonas, que es todo lo que la bisección necesita.
 */
const bisect = (low: number, high: number, goesHigh: (value: number) => boolean): number => {
  let from = low;
  let to = high;

  for (let round = 0; round < 40; round += 1) {
    const middle = (from + to) / 2;

    if (goesHigh(middle)) {
      to = middle;
    } else {
      from = middle;
    }
  }

  return to;
};

export const frameBoard = (config: LevelConfig, viewport: Viewport): Framing => {
  const bandTop = MARGIN_TOP_PX;
  const bandBottom = Math.max(bandTop + 1, Math.min(viewport.freeHeight, viewport.height) - MARGIN_BOTTOM);
  const bandCenter = (bandTop + bandBottom) / 2;
  const usableWidth = viewport.width - 2 * MARGIN_SIDE;

  /*
   * La cámara nunca entra en la esfera que envuelve el tablero, y la subida no
   * lo saca de ella: con la cámara dentro, la proyección deja de significar
   * nada. El radio es el del tablero sin subir, con el personaje encima.
   */
  const radius = Math.max(
    ...boardCorners(config, 0, CHARACTER_HEIGHT).map((corner) => corner.length()),
  );
  const nearest = radius * 1.05 + 1;

  let distance = nearest;
  let lift = 0;

  const fits = (candidate: number): boolean => {
    const bounds = projectBounds(config, viewport, candidate, lift);

    return (
      bounds.top >= bandTop &&
      bounds.bottom <= bandBottom &&
      bounds.left >= MARGIN_SIDE &&
      bounds.right <= MARGIN_SIDE + usableWidth
    );
  };

  /*
   * Tres pasadas de tamaño y subida, y la ÚLTIMA palabra es del tamaño: centrar
   * mueve el tablero unos píxeles, y un encuadre que se sale por abajo de la
   * bandeja es el fallo que esto existe para evitar.
   */
  for (let pass = 0; pass < 3; pass += 1) {
    distance = bisect(nearest, 400, (candidate) => {
      const bounds = projectBounds(config, viewport, candidate, lift);

      return bounds.bottom - bounds.top <= bandBottom - bandTop && bounds.right - bounds.left <= usableWidth;
    });

    // Subir el tablero lo lleva hacia arriba en la pantalla.
    lift = bisect(-radius / 2, radius / 2, (candidate) => {
      const bounds = projectBounds(config, viewport, distance, candidate);

      return (bounds.top + bounds.bottom) / 2 <= bandCenter;
    });
  }

  distance = bisect(nearest, 400, fits);

  /*
   * UN TABLERO PLANO CON HUECOS NO SE ACERCA MÁS QUE UNO LLENO DE SU TAMAÑO.
   * Midiendo sólo las columnas que existen, un camino llano que ocupa poco de su
   * rejilla se encuadraba como un tablero pequeño, y el 2 y el 3 del mundo 1
   * quedaban pegados a la cámara: el usuario lo vio incómodo el 14-sep-2026 y
   * pidió alejar ESOS DOS. Con alturas no se aplica: los niveles del mundo 2
   * también tienen huecos, pero sus columnas llenan la vista, y el usuario dio su
   * tamaño por bueno.
   */
  const hasGaps = config.tiles.some((tileRow) => tileRow.some((kind) => kind === 'gap'));
  const isFlat = config.heights.every((heightRow) => heightRow.every((height) => height <= 1));

  if (hasGaps && isFlat) {
    const solid: LevelConfig = {
      ...config,
      tiles: config.tiles.map((tileRow) => tileRow.map(() => 'floor' as const)),
      heights: config.heights.map((heightRow) => heightRow.map(() => 1)),
    };
    const floor = Math.hypot(...frameBoard(solid, viewport).position);

    if (floor > distance) {
      distance = floor;
      lift = bisect(-radius / 2, radius / 2, (candidate) => {
        const bounds = projectBounds(config, viewport, distance, candidate);

        return (bounds.top + bounds.bottom) / 2 <= bandCenter;
      });
    }
  }

  return {
    position: [DIRECTION.x * distance, DIRECTION.y * distance, DIRECTION.z * distance],
    lift,
  };
};
