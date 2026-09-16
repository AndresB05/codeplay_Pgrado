import { describe, expect, it } from 'vitest';
import migration from '../../../../supabase/migrations/202606030027_world_1_levels_format_2.sql?raw';
import world2Migration from '../../../../supabase/migrations/202606030029_world_2_levels.sql?raw';
import world3Migration from '../../../../supabase/migrations/202606030030_world_3_levels_1_2.sql?raw';
import { debugLevel } from './debugLevel';
import { openLevel, readLevelConfig } from './levelConfig';
import { PROGRAM_FORMAT_VERSION } from './program';

/*
 * La frontera del §7, probada con los datos que de verdad hay en la base: las
 * filas sembradas siguen en el formato del juego anterior salvo las de los
 * niveles ya rediseñados, así que el camino de rechazo no es una hipótesis —se
 * recorre al abrir cualquiera de las demás—.
 *
 * LOS `config` DE LOS NIVELES SE LEEN DE SU MIGRACIÓN, no se copian a mano aquí.
 * Son puzles diseñados por el usuario, sembrados en migraciones que una vez
 * aplicadas no se editan, y el número de pasos óptimos no lo comprueba nadie: si
 * el SQL y este test se separaran, la copia de aquí seguiría en verde mientras
 * lo que se juega es otra cosa. Desde la versión 2 del formato los tres del mundo
 * 1 viven en la 0027, que los reescribió con alturas.
 */
const seededConfig = (sql: string, sortOrder: number): unknown => {
  const update = sql
    .split(/update public\.levels/)
    .find((block) => block.includes(`and sort_order = ${sortOrder};`));
  const match = update === undefined ? null : /validation_rules = '([\s\S]*?)'::jsonb/.exec(update);

  if (match === null) {
    throw new Error(`La migración ya no siembra el nivel ${sortOrder} como se esperaba.`);
  }

  return JSON.parse(match[1]);
};

/* El sobre vacío tal y como lo escribe esa misma migración. */
const emptyEnvelope = `{"formatVersion":"${PROGRAM_FORMAT_VERSION}","workspace":{}}`;

/*
 * Las `validation_rules` que la siembra 0012 puso en el nivel 2, del juego
 * anterior. Ya no son las suyas —la 0025 lo rediseñó—, pero siguen siendo la
 * forma exacta de las filas que quedan sin rediseñar.
 */
const previousGame = { goal: 'choose_safe_path', requiresCondition: true };

/*
 * Un tablero de dos casillas VÁLIDO EN TODO lo que los casos de rechazo no
 * rompen. Cada caso cambia UNA cosa sobre él: si le faltaran las alturas, todos
 * los rechazos saldrían en verde por ese motivo y ninguno probaría el suyo.
 */
const pair = {
  tiles: [['floor', 'floor']],
  heights: [[1, 1]],
  start: { cell: { row: 0, column: 0 }, facing: 'east' },
  goal: { row: 0, column: 1 },
  optimalSteps: 1,
};

describe('readLevelConfig', () => {
  it('acepta el tablero base de los casos de rechazo', () => {
    expect(readLevelConfig(pair)).not.toBeNull();
  });

  it('acepta el puzle del nivel 1 tal y como lo reescribe la 0027', () => {
    expect(readLevelConfig(seededConfig(migration, 1))).toEqual({
      tiles: [['floor'], ['floor'], ['floor'], ['floor'], ['floor']],
      heights: [[1], [1], [1], [1], [1]],
      start: { cell: { row: 4, column: 0 }, facing: 'north' },
      goal: { row: 0, column: 0 },
      optimalSteps: 4,
    });
  });

  /* El primer tablero sembrado con huecos y con una salida que no mira al frente. */
  it('acepta el puzle del nivel 2 tal y como lo reescribe la 0027', () => {
    const config = readLevelConfig(seededConfig(migration, 2));

    expect(config?.tiles).toHaveLength(5);
    expect(config?.tiles.every((row) => row.length === 5)).toBe(true);
    expect(config?.start).toEqual({ cell: { row: 3, column: 0 }, facing: 'south' });
    expect(config?.goal).toEqual({ row: 0, column: 4 });
    expect(config?.optimalSteps).toBe(12);
  });

  it('acepta el puzle del nivel 3 tal y como lo reescribe la 0027', () => {
    const config = readLevelConfig(seededConfig(migration, 3));

    expect(config?.tiles).toHaveLength(5);
    expect(config?.start).toEqual({ cell: { row: 4, column: 2 }, facing: 'west' });
    expect(config?.goal).toEqual({ row: 3, column: 4 });
    expect(config?.optimalSteps).toBe(20);
  });

  /* La 0027 no cambia ningún puzle: gana alturas a 1 donde hay casilla y 0 donde no. */
  it('la 0027 da altura 1 a cada casilla que existe y 0 a cada hueco', () => {
    [1, 2, 3].forEach((sortOrder) => {
      const config = readLevelConfig(seededConfig(migration, sortOrder));

      config?.tiles.forEach((row, r) =>
        row.forEach((kind, c) => expect(config.heights[r][c]).toBe(kind === 'gap' ? 0 : 1)),
      );
    });
  });

  /* El primer tablero sembrado con alturas distintas de 1: la 0028 lo puso en el 2. */
  it('acepta el puzle del nivel 1 del mundo 2 tal y como lo mueve la 0029', () => {
    const config = readLevelConfig(seededConfig(world2Migration, 1));

    expect(config?.heights).toEqual([
      [0, 3, 0, 0, 0],
      [0, 3, 3, 3, 3],
      [1, 1, 1, 2, 3],
      [1, 0, 0, 0, 0],
      [1, 0, 0, 0, 0],
    ]);
    expect(config?.start).toEqual({ cell: { row: 4, column: 0 }, facing: 'north' });
    expect(config?.goal).toEqual({ row: 0, column: 1 });
    expect(config?.optimalSteps).toBe(15);
  });

  it('acepta el puzle del nivel 2 del mundo 2 tal y como lo siembra la 0029', () => {
    const config = readLevelConfig(seededConfig(world2Migration, 2));

    expect(config?.heights).toEqual([
      [2, 1, 1, 2, 3],
      [2, 0, 0, 0, 0],
      [2, 0, 1, 1, 1],
      [2, 2, 0, 0, 1],
      [0, 1, 1, 1, 1],
    ]);
    expect(config?.start).toEqual({ cell: { row: 2, column: 2 }, facing: 'east' });
    expect(config?.goal).toEqual({ row: 0, column: 4 });
    expect(config?.optimalSteps).toBe(25);
  });

  it('acepta el puzle del nivel 3 del mundo 2 tal y como lo siembra la 0029', () => {
    const config = readLevelConfig(seededConfig(world2Migration, 3));

    expect(config?.heights).toEqual([
      [0, 0, 4, 3, 0],
      [0, 6, 4, 2, 0],
      [0, 6, 5, 2, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 0, 0, 0],
    ]);
    expect(config?.start).toEqual({ cell: { row: 4, column: 0 }, facing: 'north' });
    expect(config?.goal).toEqual({ row: 1, column: 1 });
    expect(config?.optimalSteps).toBe(23);
  });

  /* Aceptar no puede depender de que el tablero sea trivial: éste lleva muro y hueco. */
  it('acepta un tablero con muros y huecos', () => {
    expect(readLevelConfig(JSON.parse(JSON.stringify(debugLevel)))).toEqual(debugLevel);
  });

  it('acepta columnas de varias alturas', () => {
    expect(readLevelConfig({ ...pair, heights: [[1, 3]] })?.heights).toEqual([[1, 3]]);
  });

  it('rechaza el objeto vacío con que viene sembrada la columna', () => {
    expect(readLevelConfig({})).toBeNull();
  });

  it('rechaza las reglas del juego anterior', () => {
    expect(readLevelConfig(previousGame)).toBeNull();
  });

  /*
   * Un valor desconocido NO es suelo (§4.2): se rechaza el nivel entero, igual
   * que una versión que no se reconoce.
   */
  it('rechaza una casilla de clase desconocida', () => {
    expect(readLevelConfig({ ...pair, tiles: [['floor', 'lava']] })).toBeNull();
  });

  /*
   * El tablero es rectangular y un hueco se escribe `'gap'`. Una fila corta se
   * jugaría como borde del tablero, y al niño se le dice otra cosa que con un
   * hueco.
   */
  it('rechaza una fila más corta que las demás', () => {
    expect(
      readLevelConfig({
        ...pair,
        tiles: [['floor', 'floor'], ['floor']],
        heights: [[1, 1], [1]],
      }),
    ).toBeNull();
  });

  it('rechaza un tablero sin alturas', () => {
    expect(readLevelConfig({ ...pair, heights: undefined })).toBeNull();
  });

  /* La misma contradicción por los dos lados: dos maneras de decir si ahí hay casilla. */
  it('rechaza un hueco con altura y una casilla que existe sin ella', () => {
    expect(readLevelConfig({ ...pair, tiles: [['floor', 'gap']], heights: [[1, 1]] })).toBeNull();
    expect(readLevelConfig({ ...pair, heights: [[1, 0]] })).toBeNull();
  });

  it('rechaza alturas que no casan con el tablero o que no son enteras', () => {
    expect(readLevelConfig({ ...pair, heights: [[1]] })).toBeNull();
    expect(readLevelConfig({ ...pair, heights: [[1, 1], [1, 1]] })).toBeNull();
    expect(readLevelConfig({ ...pair, heights: [[1, 1.5]] })).toBeNull();
    expect(readLevelConfig({ ...pair, heights: [[1, '2']] })).toBeNull();
    expect(readLevelConfig({ ...pair, heights: [[1, -1]] })).toBeNull();
  });

  it('rechaza una salida o una meta fuera del tablero', () => {
    expect(
      readLevelConfig({ ...pair, start: { cell: { row: 1, column: 0 }, facing: 'east' } }),
    ).toBeNull();
    expect(readLevelConfig({ ...pair, goal: { row: 0, column: 2 } })).toBeNull();
  });

  /*
   * Un nivel imposible: el personaje nace dentro del muro, o la meta no se puede
   * pisar. El contrato no lo escribe, pero es un error de siembra que SÍ se puede
   * cazar leyendo, a diferencia de un `optimalSteps` equivocado.
   */
  it('rechaza una salida o una meta sobre una casilla que no se pisa', () => {
    expect(readLevelConfig({ ...pair, tiles: [['wall', 'floor']] })).toBeNull();
    expect(readLevelConfig({ ...pair, tiles: [['floor', 'gap']], heights: [[1, 0]] })).toBeNull();
  });

  it('rechaza una orientación de salida que no existe', () => {
    expect(
      readLevelConfig({ ...pair, start: { cell: { row: 0, column: 0 }, facing: 'arriba' } }),
    ).toBeNull();
  });

  /*
   * EL MÁXIMO DE PASOS, POR LOS DOS LADOS. Que falte es el caso de los seis
   * niveles sembrados, y tiene que seguir siendo un nivel normal: si el campo
   * ausente se leyera como cero, los seis dejarían de dejar dar un paso.
   */
  it('acepta un nivel sin máximo de pasos y no se inventa ninguno', () => {
    const config = readLevelConfig(pair);

    expect(config).not.toBeNull();
    expect(config).not.toHaveProperty('stepLimit');
  });

  it('acepta un máximo de pasos igual o mayor que los pasos óptimos', () => {
    expect(readLevelConfig({ ...pair, stepLimit: 1 })?.stepLimit).toBe(1);
    expect(readLevelConfig({ ...pair, stepLimit: 9 })?.stepLimit).toBe(9);
  });

  /*
   * Por debajo del óptimo el nivel no es difícil: es imposible, y nadie lo
   * notaría jugando —el niño creería que el puzle tiene una solución que él no
   * encuentra—. Se caza leyendo, como la meta sobre un hueco.
   */
  it('rechaza un máximo de pasos por debajo de los pasos óptimos', () => {
    expect(readLevelConfig({ ...pair, optimalSteps: 5, stepLimit: 4 })).toBeNull();
  });

  it('rechaza un máximo de pasos que no es un entero positivo', () => {
    expect(readLevelConfig({ ...pair, stepLimit: 0 })).toBeNull();
    expect(readLevelConfig({ ...pair, stepLimit: -2 })).toBeNull();
    expect(readLevelConfig({ ...pair, stepLimit: 2.5 })).toBeNull();
    expect(readLevelConfig({ ...pair, stepLimit: '4' })).toBeNull();
    expect(readLevelConfig({ ...pair, stepLimit: null })).toBeNull();
  });

  /*
   * LOS DEL MUNDO 3, que son los primeros con máximo de pasos. Se comprueba
   * `stepLimit` además del tablero: es lo que gobierna el mundo entero, y un
   * `update` que lo dejara fuera daría un nivel que se juega sin él en silencio.
   */
  it('acepta el nivel 1 del mundo 3 tal y como lo siembra la 0030', () => {
    const config = readLevelConfig(seededConfig(world3Migration, 1));

    expect(config?.heights).toEqual([
      [1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 0, 0, 0, 2],
      [1, 1, 1, 2, 1],
    ]);
    expect(config?.start).toEqual({ cell: { row: 4, column: 0 }, facing: 'east' });
    expect(config?.goal).toEqual({ row: 0, column: 4 });
    expect(config?.optimalSteps).toBe(10);
    expect(config?.stepLimit).toBe(10);
  });

  it('acepta el nivel 2 del mundo 3 tal y como lo siembra la 0030', () => {
    const config = readLevelConfig(seededConfig(world3Migration, 2));

    expect(config?.heights).toEqual([
      [4, 3, 3, 2, 0],
      [5, 2, 2, 1, 0],
      [1, 2, 0, 1, 1],
      [1, 1, 0, 0, 1],
      [0, 1, 1, 1, 1],
    ]);
    expect(config?.start).toEqual({ cell: { row: 4, column: 4 }, facing: 'north' });
    expect(config?.goal).toEqual({ row: 1, column: 0 });
    expect(config?.optimalSteps).toBe(17);
    expect(config?.stepLimit).toBe(17);
  });

  /*
   * DECISIÓN DE SIEMBRA, no del formato: el formato admite un máximo con margen.
   * En el mundo 3 el usuario los ató —pasar el nivel ES resolverlo del todo—, y
   * de eso cuelga el XP que el J10 escribirá, así que se comprueba.
   */
  it('los dos del mundo 3 conceden justo los pasos de su mejor solución', () => {
    [1, 2].forEach((sortOrder) => {
      const config = readLevelConfig(seededConfig(world3Migration, sortOrder));

      expect(config?.stepLimit).toBe(config?.optimalSteps);
    });
  });

  /* Los seis ya sembrados se juegan sin límite, y este cambio no los toca. */
  it('ninguno de los seis niveles sembrados trae máximo de pasos', () => {
    [migration, world2Migration].forEach((sql) =>
      [1, 2, 3].forEach((sortOrder) =>
        expect(readLevelConfig(seededConfig(sql, sortOrder))).not.toHaveProperty('stepLimit'),
      ),
    );
  });

  /* De este número sale la puntuación, y nada más en el sistema lo comprueba. */
  it('rechaza unos pasos óptimos que no son un entero positivo', () => {
    expect(readLevelConfig({ ...pair, optimalSteps: 0 })).toBeNull();
    expect(readLevelConfig({ ...pair, optimalSteps: -3 })).toBeNull();
    expect(readLevelConfig({ ...pair, optimalSteps: 1.5 })).toBeNull();
    expect(readLevelConfig({ ...pair, optimalSteps: '3' })).toBeNull();
  });

  it('rechaza lo que no es un tablero', () => {
    expect(readLevelConfig(null)).toBeNull();
    expect(readLevelConfig('')).toBeNull();
    expect(readLevelConfig({ tiles: [] })).toBeNull();
    expect(readLevelConfig({ tiles: [[]] })).toBeNull();
  });
});

describe('openLevel', () => {
  const row = {
    formatVersion: PROGRAM_FORMAT_VERSION,
    config: seededConfig(migration, 1),
    starterCode: emptyEnvelope,
  };

  it('abre el nivel 1 tal y como lo reescribe la 0027', () => {
    const level = openLevel(row);

    expect(level?.config.optimalSteps).toBe(4);
    expect(level?.workspace).toEqual({});
  });

  /*
   * El valor por defecto de la columna. §7: «sin programa de partida» es un
   * nivel normal y no se avisa de nada, así que esto NO es motivo de rechazo.
   */
  it('acepta un nivel sin programa de partida', () => {
    expect(openLevel({ ...row, starterCode: '' })?.workspace).toEqual({});
  });

  it('rechaza el nivel cuando su versión no se reconoce', () => {
    expect(openLevel({ ...row, formatVersion: 'javascript' })).toBeNull();
  });

  /*
   * La versión 1 dejó de aceptarse con las alturas: un tablero de la 1 no las
   * trae, y su programa no sabría qué es un salto. Es el caso de las filas del
   * mundo 1 mientras la 0027 no esté aplicada.
   */
  it('rechaza un nivel de la versión 1 del formato', () => {
    expect(
      openLevel({
        ...row,
        formatVersion: 'grid-blockly-1',
        starterCode: '{"formatVersion":"grid-blockly-1","workspace":{}}',
      }),
    ).toBeNull();
  });

  /*
   * Las dos versiones tienen que ser la conocida, y eso es lo que hace que un
   * DESACUERDO entre ellas rechace el nivel: hoy sólo existe una versión, así
   * que coincidir y ser la conocida son lo mismo. Es el único caso que no se cae
   * solo de comprobar cada campo por su lado —los dos son válidos por separado y
   * lo que está mal es el par—.
   */
  it('rechaza el nivel cuando la versión del sobre no es la del nivel', () => {
    expect(
      openLevel({ ...row, starterCode: '{"formatVersion":"grid-blockly-1","workspace":{}}' }),
    ).toBeNull();
  });

  it('rechaza un programa de partida que no es un sobre', () => {
    expect(openLevel({ ...row, starterCode: 'const pasos = []' })).toBeNull();
    expect(openLevel({ ...row, starterCode: '{}' })).toBeNull();
  });

  it('rechaza el nivel cuando su puzle no describe un tablero', () => {
    expect(openLevel({ ...row, config: previousGame })).toBeNull();
    expect(openLevel({ ...row, config: {} })).toBeNull();
  });
});
