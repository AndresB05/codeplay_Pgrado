/*
 * La forma de un nivel, y es PROVISIONAL: el formato definitivo lo fija el J3,
 * que es el paso que lo escribe en el contrato para que el juego, el cliente y
 * el servidor lo lean igual. Hasta entonces esto vive aquí, escrito a mano.
 *
 * No hay campo `walkable`: se deriva de la clase de casilla. Dos campos que
 * dicen lo mismo se contradicen en cuanto alguien edite uno.
 */

/*
 * Un hueco es una casilla que no existe; un muro es una que existe y no se
 * pisa. Para moverse los dos son lo mismo —no transitable—, y la diferencia
 * está sólo en cómo se pintan.
 */
export type TileKind = 'floor' | 'wall' | 'gap';

export type Direction = 'north' | 'east' | 'south' | 'west';

/*
 * `row` y `column`, nunca `x` e `y`: en una escena 3D esos nombres son otra
 * cosa, y mezclarlos es el error clásico. La traducción a coordenadas del
 * mundo vive en un solo sitio, en GameScene.
 */
export interface Cell {
  row: number;
  column: number;
}

export interface Pose {
  cell: Cell;
  facing: Direction;
}

export interface LevelConfig {
  /** Filas de norte a sur, columnas de oeste a este. */
  tiles: TileKind[][];
  start: Pose;
  goal: Cell;
}

/*
 * El paso de la rejilla es 1,0 por decisión, y NO se deduce del tamaño de
 * ningún modelo: los bloques de Kenney miden 1,082 de ancho porque el labio de
 * hierba se solapa a propósito. Sacar el paso de ahí produce rendijas entre
 * casillas, y con los modelos entrando en el J7.4 el fallo aparecería con la
 * mecánica ya escrita encima.
 */
export const TILE_SIZE = 1;

export const isWalkable = (kind: TileKind): boolean => kind === 'floor';
