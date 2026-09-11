/*
 * La frontera del nivel: lo que llega de la base se COMPRUEBA aquí antes de
 * jugarlo. El contrato §4.2 lo dice con todas las letras —«lo que sí hace falta
 * en la frontera es comprobar, no traducir»—: el JSON llega sin tipo y `config`
 * es, campo por campo, el tipo del juego, así que no hay nada que traducir y sí
 * algo que verificar.
 *
 * Devuelve `null` y nunca el motivo, igual que `openProgram` y por lo mismo:
 * todos los motivos acaban en el mismo sitio (§7, rechazar el nivel entero), así
 * que distinguirlos sería información inventada para nadie. Y rechaza ENTERO,
 * nunca a medias: un nivel que no se puede cargar es un contratiempo; uno
 * cargado mal y jugado hasta el final guarda un intento ilegible.
 *
 * Sin `three` y sin Blockly, como `program.ts` y por el mismo motivo: esto corre
 * POR ENCIMA de la frontera diferida, así que un nivel ilegible no llega a
 * descargar el motor 3D.
 */

import { isWalkable, type Cell, type Direction, type LevelConfig, type Pose, type TileKind } from './level';
import { openProgram, PROGRAM_FORMAT_VERSION, type WorkspaceState } from './program';

const TILE_KINDS: readonly string[] = ['floor', 'wall', 'gap'];
const DIRECTIONS: readonly string[] = ['north', 'east', 'south', 'west'];

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIndex = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value);

/*
 * El tablero es RECTANGULAR, y esto es lo que hace cumplir esa regla: una fila
 * más corta que las demás se rechaza en vez de tomarse por un tablero con hueco.
 * No es formalismo — salirse del borde y pisar un hueco se pintan igual pero se
 * le explican al niño con palabras distintas, así que dos maneras de escribir el
 * mismo tablero dirían cosas distintas al jugarlo.
 *
 * Y una casilla de clase desconocida NO se trata como suelo: se rechaza. Es el
 * mismo caso que una versión que no se reconoce.
 */
const readTiles = (value: unknown): TileKind[][] | null => {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const width = Array.isArray(value[0]) ? value[0].length : 0;

  if (width === 0) {
    return null;
  }

  const tiles: TileKind[][] = [];

  for (const row of value) {
    if (!Array.isArray(row) || row.length !== width) {
      return null;
    }

    const kinds: TileKind[] = [];

    for (const kind of row) {
      if (typeof kind !== 'string' || !TILE_KINDS.includes(kind)) {
        return null;
      }

      kinds.push(kind as TileKind);
    }

    tiles.push(kinds);
  }

  return tiles;
};

const readCell = (value: unknown, rows: number, columns: number): Cell | null => {
  if (!isObject(value)) {
    return null;
  }

  const { row, column } = value;

  if (!isIndex(row) || !isIndex(column)) {
    return null;
  }

  if (row < 0 || row >= rows || column < 0 || column >= columns) {
    return null;
  }

  return { row, column };
};

/* La salida lleva orientación y la meta no: sin ella el primer «avanzar» es ambiguo. */
const readPose = (value: unknown, rows: number, columns: number): Pose | null => {
  if (!isObject(value)) {
    return null;
  }

  const cell = readCell(value.cell, rows, columns);
  const { facing } = value;

  if (cell === null || typeof facing !== 'string' || !DIRECTIONS.includes(facing)) {
    return null;
  }

  return { cell, facing: facing as Direction };
};

export const readLevelConfig = (value: unknown): LevelConfig | null => {
  if (!isObject(value)) {
    return null;
  }

  const tiles = readTiles(value.tiles);

  if (tiles === null) {
    return null;
  }

  const rows = tiles.length;
  const columns = tiles[0].length;

  const start = readPose(value.start, rows, columns);
  const goal = readCell(value.goal, rows, columns);
  const { optimalSteps } = value;

  if (start === null || goal === null) {
    return null;
  }

  /*
   * Y LAS DOS CASILLAS TIENEN QUE PODER PISARSE. El contrato no lo escribe, pero
   * una salida sobre un muro nace con el personaje dentro de él y una meta sobre
   * un hueco no se puede alcanzar: es un nivel imposible, o sea un `config` que
   * no describe un tablero jugable (§7).
   *
   * Es de la familia del `optimalSteps` mal sembrado —un error de siembra que no
   * salta por ningún lado— con una diferencia que decide: éste sí se puede
   * comprobar leyendo, y comprobarlo aquí cuesta dos líneas. El otro no, y por
   * eso sigue dependiendo de que quien siembre resuelva su puzle a mano.
   */
  if (!isWalkable(tiles[start.cell.row][start.cell.column])) {
    return null;
  }

  if (!isWalkable(tiles[goal.row][goal.column])) {
    return null;
  }

  /*
   * Mayor que cero, no «cualquier número»: de él sale la puntuación, y nada más
   * en el sistema lo comprueba. Quien siembra un nivel resuelve su puzle antes.
   */
  if (!isIndex(optimalSteps) || optimalSteps <= 0) {
    return null;
  }

  return { tiles, start, goal, optimalSteps };
};

/*
 * El `starter_code` VACÍO no es un error: §7 dice que significa «sin programa de
 * partida», que es un nivel perfectamente normal —se empieza con el lienzo
 * vacío— y que no hay que avisar de nada. Es además el valor por defecto de la
 * columna, así que éste es el caso de todo nivel que no traiga bloques puestos.
 *
 * Lo que sí se rechaza es un texto que pretenda ser un sobre y no lo sea: ahí
 * alguien quiso decir algo y no se le entiende.
 */
const readStarterCode = (text: string): WorkspaceState | null => {
  if (text.trim() === '') {
    return {};
  }

  let value: unknown;

  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }

  return openProgram(value);
};

export interface PlayableLevel {
  config: LevelConfig;
  workspace: WorkspaceState;
}

/*
 * LA PUERTA ÚNICA, y es una sola a propósito: el §7 describe un nivel que se
 * carga o no se carga, no tres comprobaciones que alguien tenga que acordarse de
 * hacer y de combinar bien. Quien la llama es el anfitrión —la pantalla de
 * nivel—, porque el §7 manda avisarle a él.
 *
 * LA VERSIÓN DEL NIVEL MANDA: es la que dice si el juego desplegado puede con
 * él, y si no la reconoce no se mira nada más. La del sobre gobierna el sobre,
 * que es la que viajará pegada al intento, y la comprueba `openProgram`.
 *
 * Que las dos tengan que ser la conocida es también lo que hace que un
 * DESACUERDO entre ellas rechace el nivel. Hoy sólo existe una versión, así que
 * «coincidir» y «ser la conocida» son lo mismo; el día que haya dos, esto seguirá
 * rechazando el par que no case, que es lo que hay que conservar: una fila que
 * dice dos cosas distintas sobre sí misma no tiene una lectura correcta, y
 * quedarse con una en silencio deja la otra sin que nadie la compruebe nunca.
 */
export const openLevel = (row: {
  formatVersion: string;
  config: unknown;
  starterCode: string;
}): PlayableLevel | null => {
  if (row.formatVersion !== PROGRAM_FORMAT_VERSION) {
    return null;
  }

  const config = readLevelConfig(row.config);

  if (config === null) {
    return null;
  }

  const workspace = readStarterCode(row.starterCode);

  if (workspace === null) {
    return null;
  }

  return { config, workspace };
};
