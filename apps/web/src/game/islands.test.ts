import { describe, expect, it } from 'vitest';
import { debugLevel } from './debugLevel';
import { generateIslands } from './islands';
import type { LevelConfig } from './level';

describe('generateIslands', () => {
  it('sale igual cada vez para el mismo tablero', () => {
    expect(generateIslands(debugLevel)).toEqual(generateIslands(debugLevel));
  });

  it('pone islas y adornos', () => {
    const pieces = generateIslands(debugLevel);

    expect(pieces.some((piece) => piece.url.includes('block-grass'))).toBe(true);
    expect(pieces.some((piece) => !piece.url.includes('block-grass'))).toBe(true);
  });

  it('no pone adornos dentro de la huella del tablero', () => {
    const half = 2.5;
    const decor = generateIslands(debugLevel).filter((piece) => !piece.url.includes('block-grass'));

    for (const piece of decor) {
      const [x, , z] = piece.position;
      expect(Math.abs(x) >= half || Math.abs(z) >= half).toBe(true);
    }
  });
});

describe('generateIslands, los lados', () => {
  it('decora al menos dos lados del tablero', () => {
    const blocks = generateIslands(debugLevel).filter((piece) => piece.bottom !== undefined);
    const sides = new Set(blocks.map((piece) => piece.side));

    expect(sides.size).toBeGreaterThanOrEqual(2);
  });
});

describe('generateIslands, por delante', () => {
  it('deja bajos los bloques de delante', () => {
    const front = generateIslands(debugLevel).filter(
      (piece) => piece.side === 'south' || piece.side === 'east'
    );

    // El bloque del kit mide 1 de alto: su cara de arriba es la posición más 1.
    for (const piece of front) {
      expect(piece.position[1] + 1).toBeLessThanOrEqual(0.25);
    }
  });
});

describe('generateIslands, rellenar huecos', () => {
  // El «Camino con curvas» del mundo 1: casillas vacías que dan al exterior.
  const curvy: LevelConfig = {
    tiles: [
      ['gap', 'gap', 'floor', 'floor', 'floor'],
      ['gap', 'gap', 'floor', 'gap', 'gap'],
      ['gap', 'gap', 'floor', 'gap', 'gap'],
      ['floor', 'gap', 'floor', 'gap', 'gap'],
      ['floor', 'floor', 'floor', 'gap', 'gap'],
    ],
    heights: [
      [0, 0, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 0, 1, 0, 0],
      [1, 1, 1, 0, 0],
    ],
    start: { cell: { row: 3, column: 0 }, facing: 'south' },
    goal: { row: 0, column: 4 },
    optimalSteps: 10,
  };

  const cellOf = (x: number, z: number) => [Math.floor(z + 2.5), Math.floor(x + 2.5)];

  it('rellena con piezas de dos casillas o más, por debajo del camino', () => {
    const fills = generateIslands(curvy, { fillGaps: true }).filter(
      (piece) => piece.stretch !== undefined
    );

    expect(fills.length).toBeGreaterThan(0);
    for (const fill of fills) {
      const [along, across] = fill.stretch as [number, number];
      const cells = fill.url.includes('block-grass-long')
        ? along * 2 * across
        : along * 2 * across * 2;

      expect(cells).toBeGreaterThanOrEqual(2);
      expect(fill.position[1] + 1).toBeLessThan(0);
    }
  });

  it('no pone adornos sobre ninguna casilla del camino', () => {
    const decor = generateIslands(curvy, { fillGaps: true }).filter(
      (piece) => piece.bottom === undefined
    );

    for (const {
      position: [x, , z],
    } of decor) {
      const [row, column] = cellOf(x, z);
      expect(curvy.tiles[row]?.[column] ?? 'gap').toBe('gap');
    }
  });

  it('sin relleno no cambia nada', () => {
    expect(generateIslands(curvy, { fillGaps: false })).toEqual(generateIslands(curvy));
  });
});
