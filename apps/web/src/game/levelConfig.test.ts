import { describe, expect, it } from 'vitest';
import migration from '../../../../supabase/migrations/202606030023_seed_level_1_world_1.sql?raw';
import { debugLevel } from './debugLevel';
import { openLevel, readLevelConfig } from './levelConfig';
import { PROGRAM_FORMAT_VERSION } from './program';

/*
 * La frontera del §7, probada con los datos que de verdad hay en la base: las
 * nueve filas sembradas siguen en el formato del juego anterior salvo la del
 * nivel 1, así que el camino de rechazo no es una hipótesis —se recorre al
 * abrir cualquier otro nivel—.
 *
 * EL `config` DEL NIVEL 1 SE LEE DE SU MIGRACIÓN, no se copia a mano aquí. Es un
 * puzle diseñado por el usuario, sembrado en una migración que una vez aplicada
 * no se edita, y el número de pasos óptimos no lo comprueba nadie: si el SQL y
 * este test se separaran, la copia de aquí seguiría en verde mientras lo que se
 * juega es otra cosa.
 */
const seededConfig = (): unknown => {
  const match = /validation_rules = '([\s\S]*?)'::jsonb/.exec(migration);

  if (match === null) {
    throw new Error('La migración del nivel 1 ya no siembra `validation_rules` como se esperaba.');
  }

  return JSON.parse(match[1]);
};

/* El sobre vacío tal y como lo escribe esa misma migración. */
const emptyEnvelope = `{"formatVersion":"${PROGRAM_FORMAT_VERSION}","workspace":{}}`;

/* Las `validation_rules` del nivel 2, copiadas de la siembra 0012. */
const previousGame = { goal: 'choose_safe_path', requiresCondition: true };

describe('readLevelConfig', () => {
  it('acepta el puzle que siembra la migración del nivel 1', () => {
    expect(readLevelConfig(seededConfig())).toEqual({
      tiles: [['floor', 'floor', 'floor', 'floor']],
      start: { cell: { row: 0, column: 0 }, facing: 'east' },
      goal: { row: 0, column: 3 },
      optimalSteps: 3,
    });
  });

  /* Aceptar no puede depender de que el tablero sea trivial: éste lleva muro y hueco. */
  it('acepta un tablero con muros y huecos', () => {
    expect(readLevelConfig(JSON.parse(JSON.stringify(debugLevel)))).toEqual(debugLevel);
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
    expect(
      readLevelConfig({
        tiles: [['floor', 'lava']],
        start: { cell: { row: 0, column: 0 }, facing: 'east' },
        goal: { row: 0, column: 1 },
        optimalSteps: 1,
      }),
    ).toBeNull();
  });

  /*
   * El tablero es rectangular y un hueco se escribe `'gap'`. Una fila corta se
   * jugaría como borde del tablero, y al niño se le dice otra cosa que con un
   * hueco.
   */
  it('rechaza una fila más corta que las demás', () => {
    expect(
      readLevelConfig({
        tiles: [
          ['floor', 'floor'],
          ['floor'],
        ],
        start: { cell: { row: 0, column: 0 }, facing: 'east' },
        goal: { row: 0, column: 1 },
        optimalSteps: 1,
      }),
    ).toBeNull();
  });

  it('rechaza una salida o una meta fuera del tablero', () => {
    expect(
      readLevelConfig({
        tiles: [['floor', 'floor']],
        start: { cell: { row: 1, column: 0 }, facing: 'east' },
        goal: { row: 0, column: 1 },
        optimalSteps: 1,
      }),
    ).toBeNull();

    expect(
      readLevelConfig({
        tiles: [['floor', 'floor']],
        start: { cell: { row: 0, column: 0 }, facing: 'east' },
        goal: { row: 0, column: 2 },
        optimalSteps: 1,
      }),
    ).toBeNull();
  });

  /*
   * Un nivel imposible: el personaje nace dentro del muro, o la meta no se puede
   * pisar. El contrato no lo escribe, pero es un error de siembra que SÍ se puede
   * cazar leyendo, a diferencia de un `optimalSteps` equivocado.
   */
  it('rechaza una salida o una meta sobre una casilla que no se pisa', () => {
    expect(
      readLevelConfig({
        tiles: [['wall', 'floor']],
        start: { cell: { row: 0, column: 0 }, facing: 'east' },
        goal: { row: 0, column: 1 },
        optimalSteps: 1,
      }),
    ).toBeNull();

    expect(
      readLevelConfig({
        tiles: [['floor', 'gap']],
        start: { cell: { row: 0, column: 0 }, facing: 'east' },
        goal: { row: 0, column: 1 },
        optimalSteps: 1,
      }),
    ).toBeNull();
  });

  it('rechaza una orientación de salida que no existe', () => {
    expect(
      readLevelConfig({
        tiles: [['floor', 'floor']],
        start: { cell: { row: 0, column: 0 }, facing: 'arriba' },
        goal: { row: 0, column: 1 },
        optimalSteps: 1,
      }),
    ).toBeNull();
  });

  /* De este número sale la puntuación, y nada más en el sistema lo comprueba. */
  it('rechaza unos pasos óptimos que no son un entero positivo', () => {
    const board = {
      tiles: [['floor', 'floor']],
      start: { cell: { row: 0, column: 0 }, facing: 'east' },
      goal: { row: 0, column: 1 },
    };

    expect(readLevelConfig({ ...board, optimalSteps: 0 })).toBeNull();
    expect(readLevelConfig({ ...board, optimalSteps: -3 })).toBeNull();
    expect(readLevelConfig({ ...board, optimalSteps: 1.5 })).toBeNull();
    expect(readLevelConfig({ ...board, optimalSteps: '3' })).toBeNull();
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
    config: seededConfig(),
    starterCode: emptyEnvelope,
  };

  it('abre el nivel 1 tal y como lo siembra su migración', () => {
    const level = openLevel(row);

    expect(level?.config.optimalSteps).toBe(3);
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
   * Las dos versiones tienen que ser la conocida, y eso es lo que hace que un
   * DESACUERDO entre ellas rechace el nivel: hoy sólo existe una versión, así
   * que coincidir y ser la conocida son lo mismo. Es el único caso que no se cae
   * solo de comprobar cada campo por su lado —los dos son válidos por separado y
   * lo que está mal es el par—.
   */
  it('rechaza el nivel cuando la versión del sobre no es la del nivel', () => {
    expect(
      openLevel({ ...row, starterCode: '{"formatVersion":"grid-blockly-0","workspace":{}}' }),
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
