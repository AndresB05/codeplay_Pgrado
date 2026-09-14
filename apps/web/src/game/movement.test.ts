import { describe, expect, it } from 'vitest';
import type { LevelConfig, Pose } from './level';
import { advance, jumpAdvance, turn } from './movement';

/*
 * Los primeros tests del juego. El J1 no pudo llevar ninguno porque jsdom no
 * implementa WebGL y un test que monte la escena prueba el simulacro; estas
 * reglas son puras, así que sí se prueban — y el J5 las hereda tal cual para el
 * intérprete, que es el motivo de que estén sueltas del pintado.
 *
 * El tablero se escribe aquí y NO se importa `debugLevel`: un test atado a la
 * rejilla de pega se rompería el día que el J7 la borre, y probaría dos cosas.
 *
 *      O            E
 *    ┌────────────────┐
 *  N │  .    .    .   │
 *    │  .    .    ▓   │
 *  S │  .   hueco .   │
 *    └────────────────┘
 *
 * Plano, con todas las alturas a 1: estos tests son los de antes de que hubiera
 * alturas, y tienen que seguir diciendo lo mismo. Las alturas tienen su tablero
 * más abajo.
 *
 * `optimalSteps` no lo mira ningún test —estas reglas no cuentan pasos—, pero el
 * tipo lo exige desde el J3. El valor es el real: avanzar, girar a la derecha y
 * avanzar.
 */
const board: LevelConfig = {
  tiles: [
    ['floor', 'floor', 'floor'],
    ['floor', 'floor', 'wall'],
    ['floor', 'gap', 'floor'],
  ],
  heights: [
    [1, 1, 1],
    [1, 1, 1],
    [1, 0, 1],
  ],
  start: { cell: { row: 1, column: 1 }, facing: 'north' },
  goal: { row: 0, column: 2 },
  optimalSteps: 3,
};

/*
 * Una fila de columnas para ejercitar las alturas, cada vecina elegida para un
 * caso de la tabla de `design.md`:
 *
 *   columna   0   1   2   3   4   5
 *   altura    1   2   2   4   1   hueco
 */
const hills: LevelConfig = {
  tiles: [['floor', 'floor', 'floor', 'floor', 'floor', 'gap']],
  heights: [[1, 2, 2, 4, 1, 0]],
  start: { cell: { row: 0, column: 0 }, facing: 'east' },
  goal: { row: 0, column: 4 },
  optimalSteps: 1,
};

const poseAt = (row: number, column: number, facing: Pose['facing']): Pose => ({
  cell: { row, column },
  facing,
});

describe('advance', () => {
  it('avanza a la casilla contigua cuando se puede pisar', () => {
    const result = advance(board, poseAt(1, 1, 'north'));

    expect(result.pose.cell).toEqual({ row: 0, column: 1 });
    expect(result.pose.facing).toBe('north');
    expect(result.blockedBy).toBeNull();
  });

  it('no avanza contra un muro', () => {
    const result = advance(board, poseAt(1, 1, 'east'));

    expect(result.pose.cell).toEqual({ row: 1, column: 1 });
    expect(result.blockedBy).toBe('wall');
  });

  it('no avanza contra un hueco', () => {
    const result = advance(board, poseAt(1, 1, 'south'));

    expect(result.pose.cell).toEqual({ row: 1, column: 1 });
    expect(result.blockedBy).toBe('gap');
  });

  it('no se sale por el borde norte', () => {
    const result = advance(board, poseAt(0, 0, 'north'));

    expect(result.pose.cell).toEqual({ row: 0, column: 0 });
    expect(result.blockedBy).toBe('edge');
  });

  it('no se sale por el borde este', () => {
    const result = advance(board, poseAt(0, 2, 'east'));

    expect(result.pose.cell).toEqual({ row: 0, column: 2 });
    expect(result.blockedBy).toBe('edge');
  });

  it('no se sale por el borde sur', () => {
    const result = advance(board, poseAt(2, 2, 'south'));

    expect(result.pose.cell).toEqual({ row: 2, column: 2 });
    expect(result.blockedBy).toBe('edge');
  });

  it('no se sale por el borde oeste', () => {
    const result = advance(board, poseAt(2, 0, 'west'));

    expect(result.pose.cell).toEqual({ row: 2, column: 0 });
    expect(result.blockedBy).toBe('edge');
  });

  /*
   * Lo que distingue «no avanzó» de «se quedó mirando a otro lado». Si un
   * choque girase al personaje, el niño perdería la referencia sin que ningún
   * bloque suyo lo explique.
   */
  it('un avance bloqueado no cambia la orientación', () => {
    expect(advance(board, poseAt(1, 1, 'east')).pose.facing).toBe('east');
    expect(advance(board, poseAt(1, 1, 'south')).pose.facing).toBe('south');
    expect(advance(board, poseAt(0, 0, 'north')).pose.facing).toBe('north');
  });

  // El J5 pliega las órdenes sobre una pose inicial y guarda las intermedias.
  it('no muta la pose que recibe', () => {
    const pose = poseAt(1, 1, 'north');

    advance(board, pose);

    expect(pose).toEqual({ cell: { row: 1, column: 1 }, facing: 'north' });
  });
});

describe('advance con alturas', () => {
  it('choca contra una columna un nivel más alta', () => {
    const result = advance(hills, poseAt(0, 0, 'east'));

    expect(result.pose.cell).toEqual({ row: 0, column: 0 });
    expect(result.blockedBy).toBe('high');
  });

  it('pasa a una columna de la misma altura', () => {
    expect(advance(hills, poseAt(0, 1, 'east')).pose.cell).toEqual({ row: 0, column: 2 });
  });

  it('baja a una columna más baja, aunque sean varios niveles', () => {
    expect(advance(hills, poseAt(0, 3, 'west')).pose.cell).toEqual({ row: 0, column: 2 });
    expect(advance(hills, poseAt(0, 3, 'east')).pose.cell).toEqual({ row: 0, column: 4 });
  });
});

describe('jumpAdvance', () => {
  it('sube a una columna un nivel más alta', () => {
    const result = jumpAdvance(hills, poseAt(0, 0, 'east'));

    expect(result.pose.cell).toEqual({ row: 0, column: 1 });
    expect(result.blockedBy).toBeNull();
  });

  it('avanza a una columna de la misma altura', () => {
    expect(jumpAdvance(hills, poseAt(0, 1, 'east')).pose.cell).toEqual({ row: 0, column: 2 });
  });

  it('se queda en el sitio ante una columna dos niveles más alta', () => {
    const result = jumpAdvance(hills, poseAt(0, 2, 'east'));

    expect(result.pose).toEqual(poseAt(0, 2, 'east'));
    expect(result.blockedBy).toBe('high');
  });

  it('baja saltando a una columna más baja', () => {
    expect(jumpAdvance(hills, poseAt(0, 3, 'east')).pose.cell).toEqual({ row: 0, column: 4 });
  });

  it('no cae al vacío', () => {
    const result = jumpAdvance(hills, poseAt(0, 4, 'east'));

    expect(result.pose.cell).toEqual({ row: 0, column: 4 });
    expect(result.blockedBy).toBe('gap');
  });

  it('no sube un muro ni sale del tablero', () => {
    expect(jumpAdvance(board, poseAt(1, 1, 'east')).blockedBy).toBe('wall');
    expect(jumpAdvance(hills, poseAt(0, 0, 'west')).blockedBy).toBe('edge');
  });
});

describe('turn', () => {
  it('gira a la derecha un cuarto de vuelta', () => {
    expect(turn('north', 'right')).toBe('east');
    expect(turn('west', 'right')).toBe('north');
  });

  it('gira a la izquierda un cuarto de vuelta', () => {
    expect(turn('north', 'left')).toBe('west');
    expect(turn('east', 'left')).toBe('north');
  });

  it('cuatro giros al mismo lado vuelven a la dirección de partida', () => {
    const pose = poseAt(1, 1, 'north');
    const facing = [1, 2, 3, 4].reduce((current) => turn(current, 'right'), pose.facing);

    expect(facing).toBe('north');
    expect(pose.cell).toEqual({ row: 1, column: 1 });
  });
});
