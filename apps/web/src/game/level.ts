/*
 * La forma de un nivel. El J3 la fijó en CONTRATO-DE-INTEGRACION.md §4.2, que es
 * donde está el porqué de cada campo; aquí sólo vive el tipo.
 *
 * Y es el MISMO objeto que viaja por el cable, sin traducción, a diferencia de
 * las filas de la base —que tienen `mapLevelRow` porque una fila y un tipo de
 * dominio son cosas distintas—. `config` viaja entero en un solo hueco, así que
 * una segunda forma sería un traductor sin información nueva. Lo que sí hace
 * falta en la frontera es validar, y eso llega con el consumidor (J8).
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
  /**
   * Filas de norte a sur, columnas de oeste a este. Rectangular: un hueco se
   * escribe `'gap'` y nunca acortando una fila, o `advance` lo trata como borde.
   */
  tiles: TileKind[][];
  /**
   * Cuántos cubos tiene la columna de cada casilla, alineada con `tiles`. Suelo
   * y muro miden uno o más; un hueco mide cero. Las columnas se apoyan siempre en
   * el suelo del tablero —nada flota—, así que no hace falta describir qué hay
   * debajo de cada una.
   */
  heights: number[][];
  start: Pose;
  /** Se pisa mirando adonde sea: llegar no exige orientación. */
  goal: Cell;
  /** Los pasos de la mejor solución. Se define a mano al diseñar el nivel. */
  optimalSteps: number;
}

/*
 * El paso de la rejilla es 1,0 por decisión, y NO se deduce del tamaño de
 * ningún modelo: los bloques de Kenney miden 1,082 de ancho porque el labio de
 * hierba se solapa a propósito. Sacar el paso de ahí produce rendijas entre
 * casillas.
 *
 * EL AVISO YA SE PUSO A PRUEBA, y valía. El J6.4 metió los modelos y el paso no
 * se tocó, que era justo de lo que avisaba esto; la rendija apareció igual por
 * otro lado —el labio del faldón metido por los cuatro costados, 0,08 de aire
 * entre casillas vecinas—, o sea que el fallo entró por donde no se le esperaba.
 *
 * Hoy el juego **no carga ningún modelo**: el usuario los retiró enteros en el
 * J7.1 y el tablero volvió a ser geometría. La regla se queda escrita para
 * cuando el J13 los traiga otra vez.
 */
export const TILE_SIZE = 1;

export const isWalkable = (kind: TileKind): boolean => kind === 'floor';
