import { TILE_SIZE, type LevelConfig } from './level';

/*
 * PRUEBA DE ASSETS (rama `prueba/kaykit-platformer`), no definitiva: decorado de
 * bloques de hierba junto al tablero, a imitación de las muestras del Platformer
 * Kit de Kenney.
 *
 * NO SE COMPONE A MANO, SE GENERA POR REGLAS, con una SEMILLA sacada del propio
 * tablero: el mismo nivel sale siempre igual y no cambia entre repintados.
 *
 * Las reglas salen de lo que el usuario fue viendo:
 *  - DOS O TRES LADOS del tablero llevan una fila VARIADA pegada a él: bloques
 *    grandes, pequeños y alargados, de alturas distintas.
 *  - Los BLOQUES ALTOS van en un lado de detrás que haya quedado VACÍO, pegados
 *    al tablero. Puestos detrás de la fila de otro lado quedaban raros, y en su
 *    propio lado hacen que el decorado rodee el tablero sin inclinarse.
 *  - Por delante —sur y este, el lado de la cámara de partida— los bloques
 *    quedan bajos: una montaña ahí tapaba al personaje.
 *  - Dos bloques vecinos NUNCA a la misma altura: dos losas casi iguales
 *    montadas de lado quedaban fatal.
 *  - Los adornos van en la mitad de cada cima que mira a la cámara: son los que
 *    se ven sin girarla. Nunca pisan una casilla.
 *  - La tierra de cada bloque baja hasta el suelo: son montañas, no bultos.
 *  - Con `fillGaps`, SIGUE LA FORMA DEL TABLERO: las casillas vacías que dan al
 *    exterior se juntan en rectángulos y cada uno lo cubre UNA pieza grande o
 *    alargada, por debajo del camino. Nunca un bloque de una casilla: es el
 *    peor para rellenar. Un hueco suelto de una casilla se queda vacío, y los
 *    ENCERRADOS entre casillas son agujeros del puzle y también.
 */

const KIT = '/models/platformer';
const SURVIVAL = '/models/survival';

export type Side = 'north' | 'south' | 'east' | 'west';

export interface IslandPiece {
  url: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
  // Sólo en los rellenos: su escala en x y en z, que no tiene por qué ser igual.
  stretch?: [number, number];
  // Sólo en los bloques: hasta dónde baja su tierra.
  bottom?: number;
  // Sólo en los bloques: el lado del tablero al que pertenece.
  side?: Side;
}

interface BlockKind {
  model: string;
  // Medio lado de la cara de arriba, sin el labio de hierba: a lo largo del
  // borde del tablero y hacia fuera.
  along: number;
  across: number;
  height: number;
}

const LARGE: BlockKind = { model: 'block-grass-large', along: 1, across: 1, height: 1 };
const SMALL: BlockKind = { model: 'block-grass', along: 0.5, across: 0.5, height: 1 };
const LONG: BlockKind = { model: 'block-grass-long', along: 1, across: 0.5, height: 1 };

const ROW_KINDS = [LARGE, LARGE, LONG, LONG, SMALL];
const BACK_ROW_KINDS = [LARGE, LARGE, SMALL];

interface Decor {
  url: string;
  weight: number;
  scale: [number, number];
  // Cuánto ocupa en el suelo a su tamaño: la copa de un árbol, no su tronco.
  radius: number;
}

// Todos verdes: el árbol otoñal amarillo desentonaba.
const TREES: Decor[] = [
  { url: `${KIT}/tree.glb`, weight: 3, scale: [0.8, 1], radius: 0.56 },
  { url: `${KIT}/tree-pine.glb`, weight: 2, scale: [0.8, 1], radius: 0.48 },
  { url: `${KIT}/tree-pine-small.glb`, weight: 2, scale: [0.8, 1.1], radius: 0.34 },
  { url: `${SURVIVAL}/tree.glb`, weight: 3, scale: [1.2, 1.5], radius: 0.28 },
  { url: `${SURVIVAL}/tree-tall.glb`, weight: 2, scale: [1.2, 1.5], radius: 0.28 },
];

const SMALL_DECOR: Decor[] = [
  { url: `${KIT}/grass.glb`, weight: 3, scale: [0.9, 1.2], radius: 0.27 },
  { url: `${KIT}/flowers.glb`, weight: 2, scale: [0.8, 1], radius: 0.4 },
  { url: `${KIT}/plant.glb`, weight: 2, scale: [0.9, 1.2], radius: 0.29 },
  { url: `${KIT}/mushrooms.glb`, weight: 1, scale: [0.9, 1.1], radius: 0.26 },
  { url: `${KIT}/rocks.glb`, weight: 1, scale: [0.5, 0.8], radius: 0.3 },
];

// Alturas de la cara de arriba sobre la hierba del tablero, que está en y = 0.
const NEAR_TOP: [number, number] = [0.2, 1.4];
const FAR_RISE: [number, number] = [0.6, 1.8];
const FRONT_TOP: [number, number] = [-0.5, 0.25];
// Lo mínimo que se diferencian en altura dos bloques vecinos.
const MIN_STEP = 0.4;
const NEAR_BLOCKS: [number, number] = [2, 3];
const FAR_BLOCKS: [number, number] = [1, 2];
// Cuánto se mete un bloque en el borde del tablero.
const TUCK: [number, number] = [0, 0.2];
const TALL_TUCK = 0.1;
// Los rellenos de los huecos quedan por debajo del camino.
const FILL_TOP: [number, number] = [-0.8, -0.15];
// Lo más pequeño que se rellena, en casillas: un hueco suelto se queda vacío.
const FILL_MIN_CELLS = 2;
const TREES_PER_TOP: [number, number] = [2, 4];
const SMALLS_PER_TOP: [number, number] = [1, 3];
const ISLAND_BOTTOM = -1.6;
const DECOR_INSET = 0.12;
const FOOTPRINT_MARGIN = 0.1;
// Cuánto se desplazan los adornos hacia la mitad que mira a la cámara: el −1 del
// azar se recorta a esto, y el +1 queda entero.
const CAMERA_BIAS = -0.2;

// Sur y este miran a la cámara de partida.
const FRONT_SIDES: Side[] = ['south', 'east'];
const BACK_SIDES: Side[] = ['north', 'west'];

// Mulberry32: pequeño, rápido y con semilla. No es para nada criptográfico.
const seeded = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const seedOf = (config: LevelConfig): number => {
  const text = JSON.stringify([config.tiles, config.heights]);
  let hash = 2166136261;

  for (let i = 0; i < text.length; i++) {
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  }

  return hash >>> 0;
};

interface PlacedBlock {
  x: number;
  z: number;
  // Medio lado en x y en z del mundo, ya girado y escalado.
  halfX: number;
  halfZ: number;
  front: boolean;
  // Si caben árboles encima sin tapar ninguna casilla desde la cámara.
  trees: boolean;
  top: number;
}

export interface IslandOptions {
  // Rellenar los huecos exteriores con piezas grandes. Ver la cabecera.
  fillGaps?: boolean;
}

export const generateIslands = (
  config: LevelConfig,
  { fillGaps = false }: IslandOptions = {}
): IslandPiece[] => {
  const random = seeded(seedOf(config));
  const between = ([min, max]: [number, number]) => min + (max - min) * random();
  const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];
  const pickWeighted = (items: Decor[]): Decor => {
    const total = items.reduce((sum, item) => sum + item.weight, 0);
    let roll = random() * total;

    for (const item of items) {
      roll -= item.weight;
      if (roll <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  };

  const halfX = ((config.tiles[0]?.length ?? 0) * TILE_SIZE) / 2;
  const halfZ = (config.tiles.length * TILE_SIZE) / 2;
  const rows = config.tiles.length;
  const columns = config.tiles[0]?.length ?? 0;

  /*
   * Los huecos EXTERIORES: los que se alcanzan desde el borde del rectángulo
   * pasando sólo por huecos. Sin `fillGaps` no cuenta ninguno, y el tablero se
   * trata como el rectángulo entero, que es como se ha hecho siempre.
   */
  const exterior = config.tiles.map((tileRow) => tileRow.map(() => false));
  if (fillGaps) {
    const frontier: [number, number][] = [];
    config.tiles.forEach((tileRow, row) =>
      tileRow.forEach((kind, column) => {
        const onEdge = row === 0 || column === 0 || row === rows - 1 || column === columns - 1;
        if (kind === 'gap' && onEdge) {
          exterior[row][column] = true;
          frontier.push([row, column]);
        }
      })
    );
    while (frontier.length > 0) {
      const [row, column] = frontier.pop() as [number, number];
      for (const [dr, dc] of [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ]) {
        const [r, c] = [row + dr, column + dc];
        if (config.tiles[r]?.[c] === 'gap' && !exterior[r][c]) {
          exterior[r][c] = true;
          frontier.push([r, c]);
        }
      }
    }
  }

  const isOpen = (row: number, column: number) =>
    row < 0 || column < 0 || row >= rows || column >= columns || exterior[row][column];

  // Si un punto, o su entorno de radio `margin`, cae sobre una casilla del tablero.
  const insideFootprint = (x: number, z: number, margin: number) =>
    [
      [x - margin, z - margin],
      [x + margin, z - margin],
      [x - margin, z + margin],
      [x + margin, z + margin],
    ].some(([px, pz]) => !isOpen(Math.floor(pz + halfZ), Math.floor(px + halfX)));

  const blocks: PlacedBlock[] = [];
  const pieces: IslandPiece[] = [];

  // Una altura al azar que no quede pegada a la del vecino.
  const apart = (range: [number, number], neighbour: number | null): number => {
    const top = between(range);

    if (neighbour === null || Math.abs(top - neighbour) >= MIN_STEP) {
      return top;
    }

    // Hacia el lado que toque; si eso se sale del rango, hacia el otro.
    const up = neighbour + MIN_STEP;
    const down = neighbour - MIN_STEP;
    const preferred = top >= neighbour ? up : down;
    const other = preferred === up ? down : up;

    return preferred <= range[1] && preferred >= range[0] - MIN_STEP ? preferred : other;
  };

  const geometryOf = (side: Side) => {
    const alongX = side === 'north' || side === 'south';

    return {
      alongX,
      alongHalf: alongX ? halfX : halfZ,
      edge: alongX ? halfZ : halfX,
      outward: side === 'north' || side === 'west' ? -1 : 1,
      front: FRONT_SIDES.includes(side),
    };
  };

  const place = (
    side: Side,
    kind: BlockKind,
    width: number,
    along: number,
    distance: number,
    top: number
  ) => {
    const { alongX, outward, front } = geometryOf(side);
    const alongSize = kind.along * width;
    const acrossSize = kind.across * width;
    const [x, z] = alongX ? [along, outward * distance] : [outward * distance, along];

    blocks.push({
      x,
      z,
      halfX: alongX ? alongSize : acrossSize,
      halfZ: alongX ? acrossSize : alongSize,
      front,
      trees: !front,
      top,
    });
    pieces.push({
      url: `${KIT}/${kind.model}.glb`,
      position: [x, top - kind.height, z],
      // El bloque largo va a lo largo del borde: en los lados este y oeste, girado.
      rotation: alongX ? 0 : Math.PI / 2,
      scale: width,
      bottom: ISLAND_BOTTOM,
      side,
    });
  };

  // Dos lados siempre, a veces tres, en orden barajado.
  const sides: Side[] = ['north', 'south', 'east', 'west'];
  for (let i = sides.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [sides[i], sides[j]] = [sides[j], sides[i]];
  }
  const chosen = sides.slice(0, random() < 0.4 ? 3 : 2);

  // El lado de detrás que queda libre, si lo hay: ahí van los bloques altos.
  const tallSide = BACK_SIDES.find((side) => !chosen.includes(side)) ?? null;

  for (const side of chosen) {
    const { alongHalf, edge, front } = geometryOf(side);

    // La fila, pegada al tablero, de un extremo del lado hacia el otro.
    const count = Math.round(between(NEAR_BLOCKS));
    let cursor = between([-alongHalf - 0.5, -alongHalf + 0.8]);
    let previous: number | null = null;
    let nearest = -Infinity;

    for (let k = 0; k < count && cursor < alongHalf + 0.5; k++) {
      const kind = pick(ROW_KINDS);
      const width = between([0.85, 1.15]);
      const alongSize = kind.along * width;
      const acrossSize = kind.across * width;
      const top = apart(front ? FRONT_TOP : NEAR_TOP, previous);

      place(side, kind, width, cursor + alongSize, edge + acrossSize - between(TUCK), top);
      // El siguiente se mete un poco en éste: son vecinos, no islas sueltas.
      cursor += alongSize * 2 - between([0.2, 0.5]);
      previous = top;
      nearest = Math.max(nearest, top);
    }

    /*
     * Los bloques altos. Su altura se sigue midiendo contra esta fila, pero van
     * al lado de detrás que haya quedado libre, pegados al tablero. Sólo si no
     * hay ninguno libre se quedan detrás de la fila.
     */
    if (!front && nearest > -Infinity) {
      const behind = Math.round(between(FAR_BLOCKS));
      let farCursor = between([-alongHalf, 0]);
      let farPrevious: number | null = null;

      for (let k = 0; k < behind; k++) {
        const kind = pick(BACK_ROW_KINDS);
        const width = between([0.9, 1.2]);
        const alongSize = kind.along * width;
        const acrossSize = kind.across * width;
        const rise = between(FAR_RISE);
        const top = apart([nearest + rise, nearest + rise], farPrevious);

        if (tallSide === null) {
          place(side, kind, width, farCursor + alongSize, edge + 1.6 + acrossSize, top);
        } else {
          place(
            tallSide,
            kind,
            width,
            farCursor + alongSize,
            geometryOf(tallSide).edge + acrossSize - TALL_TUCK,
            top
          );
        }

        farCursor += alongSize * 2 + between([-0.4, 0.4]);
        farPrevious = top;
      }
    }
  }

  /*
   * Los rellenos: los huecos exteriores en rectángulos, voraz como las losas del
   * tablero, y cada rectángulo de dos casillas o más, UNA pieza. Un pasillo de
   * una casilla de ancho lleva la pieza alargada; lo ancho, la grande. Árboles
   * sólo si no tapan: la cámara mira desde el sureste, así que un árbol esconde
   * lo que tiene al noroeste, y sólo se pone si ahí no hay ninguna casilla.
   */
  if (fillGaps) {
    const taken = exterior.map((row) => row.map((open) => !open));
    const free = (row: number, column: number) =>
      row < rows && column < columns && !taken[row][column];
    let previous: number | null = null;

    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        if (!free(row, column)) {
          continue;
        }

        let width = 1;
        while (free(row, column + width)) {
          width++;
        }
        let depth = 1;
        while (
          Array.from({ length: width }, (_, k) => free(row + depth, column + k)).every(Boolean)
        ) {
          depth++;
        }
        for (let r = row; r < row + depth; r++) {
          for (let c = column; c < column + width; c++) {
            taken[r][c] = true;
          }
        }

        if (width * depth < FILL_MIN_CELLS) {
          continue;
        }

        const x = column + width / 2 - halfX;
        const z = row + depth / 2 - halfZ;
        const top = apart(FILL_TOP, previous);
        previous = top;

        const strip = width === 1 || depth === 1;
        const kind = strip ? LONG : LARGE;
        // La alargada va a lo largo de x; si el pasillo va de norte a sur, girada.
        const turned = strip && depth > width;
        const [along, across] = turned ? [depth, width] : [width, depth];
        const stretch: [number, number] = [along / 2 / kind.along, across / 2 / kind.across];

        let treesFit = true;
        for (let c = column - 1; c < column + width; c++) {
          treesFit &&= isOpen(row - 1, c);
        }
        for (let r = row; r < row + depth; r++) {
          treesFit &&= isOpen(r, column - 1);
        }

        blocks.push({
          x,
          z,
          halfX: width / 2,
          halfZ: depth / 2,
          front: false,
          trees: treesFit,
          top,
        });
        pieces.push({
          url: `${KIT}/${kind.model}.glb`,
          position: [x, top - kind.height, z],
          rotation: turned ? Math.PI / 2 : 0,
          scale: 1,
          stretch,
          bottom: ISLAND_BOTTOM,
        });
      }
    }
  }

  /*
   * Encima de cada bloque, adornos DENTRO de su cara de arriba y del lado que
   * mira a la cámara: el hueco hasta el borde cuenta lo que ocupa cada adorno a
   * su tamaño, así que la copa de un árbol no sobresale. Nunca donde los tape
   * otro bloque más alto, ni sobre el tablero, y árboles nunca delante.
   */
  for (const block of blocks) {
    const roomy = Math.min(block.halfX, block.halfZ) >= 0.45;
    const trees = block.trees && roomy ? Math.round(between(TREES_PER_TOP)) : 0;
    const smalls = Math.round(between(SMALLS_PER_TOP));
    const wanted = [
      ...Array.from({ length: trees }, () => TREES),
      ...Array.from({ length: smalls }, () => SMALL_DECOR),
    ];
    const placed: { x: number; z: number; radius: number }[] = [];

    for (const pool of wanted) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const decor = pickWeighted(pool);
        const scale = between(decor.scale);
        const radius = decor.radius * scale;
        const roomX = block.halfX - DECOR_INSET - radius;
        const roomZ = block.halfZ - DECOR_INSET - radius;

        if (roomX <= 0 || roomZ <= 0) {
          continue;
        }

        // La cámara está hacia +x y +z: ahí se asoman los adornos.
        const x = block.x + between([CAMERA_BIAS, 1]) * roomX;
        const z = block.z + between([CAMERA_BIAS, 1]) * roomZ;

        const covered = blocks.some(
          (other) =>
            other !== block &&
            other.top > block.top &&
            Math.abs(x - other.x) < other.halfX + radius &&
            Math.abs(z - other.z) < other.halfZ + radius
        );
        const crowded = placed.some(
          (other) => Math.hypot(other.x - x, other.z - z) < other.radius + radius
        );

        if (covered || crowded || insideFootprint(x, z, FOOTPRINT_MARGIN + radius)) {
          continue;
        }

        placed.push({ x, z, radius });
        pieces.push({
          url: decor.url,
          position: [x, block.top, z],
          rotation: random() * Math.PI * 2,
          scale,
        });
        break;
      }
    }
  }

  return pieces;
};
