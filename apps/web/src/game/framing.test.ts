import { describe, expect, it } from 'vitest';
import { CHARACTER_HEIGHT, frameBoard, MARGIN_TOP_PX, projectBounds, type Viewport } from './framing';
import type { LevelConfig } from './level';

/*
 * El hueco del juego medido en la pantalla de nivel a 1440 px de ancho: 782 × 640,
 * con la bandeja del lienzo empezando a 426 px de arriba.
 */
const viewport: Viewport = { width: 782, height: 640, freeHeight: 426 };

const flat = (rows: number, columns: number): LevelConfig => ({
  tiles: Array.from({ length: rows }, () => Array.from({ length: columns }, () => 'floor' as const)),
  heights: Array.from({ length: rows }, () => Array.from({ length: columns }, () => 1)),
  start: { cell: { row: rows - 1, column: 0 }, facing: 'north' },
  goal: { row: 0, column: 0 },
  optimalSteps: 1,
});

/* La del nivel 3 del mundo 2, con la meta a altura seis. */
const tower: LevelConfig = {
  ...flat(5, 5),
  heights: [
    [1, 1, 4, 3, 1],
    [1, 6, 4, 2, 1],
    [1, 6, 5, 2, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
  ],
};

const framedBounds = (config: LevelConfig) => {
  const framing = frameBoard(config, viewport);

  return projectBounds(config, viewport, Math.hypot(...framing.position), framing.lift);
};

describe.each([
  ['un 5 × 5 plano', flat(5, 5)],
  ['el 5 × 1 del nivel 1 del mundo 1', flat(5, 1)],
  ['la torre de altura seis', tower],
])('frameBoard con %s', (_, config) => {
  it('el tablero entero queda por encima de la bandeja y dentro del juego', () => {
    const bounds = framedBounds(config);

    expect(bounds.top).toBeGreaterThanOrEqual(0);
    expect(bounds.bottom).toBeLessThanOrEqual(viewport.freeHeight);
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(viewport.width);
  });

  /*
   * No sólo cabe: aprovecha el hueco. Lo que manda es lo que se acabe antes, el
   * alto libre o el ancho, y el umbral deja fuera dos cosas que son del diseño:
   * los márgenes —arriba van «Vista inicial» y el contador— y que, con esta
   * cámara, el tablero cae algo desplazado a un lado y la subida no lo corrige,
   * así que el margen lateral lo frena antes de llenar el ancho.
   */
  it('llena el alto libre o el ancho', () => {
    const bounds = framedBounds(config);
    const tall = (bounds.bottom - bounds.top) / viewport.freeHeight;
    const wide = (bounds.right - bounds.left) / viewport.width;

    expect(Math.max(tall, wide)).toBeGreaterThan(0.6);
  });
});

/*
 * Lo que pidió el usuario al ver la torre: lo más alto del tablero casi a la
 * altura de los botones, y el personaje sin cortarse al estar en la meta. Se mide
 * en huecos de varios tamaños.
 */
describe.each([
  ['a 1440 px', viewport],
  ['en un hueco más bajo', { width: 1000, height: 560, freeHeight: 330 }],
  ['en un hueco más ancho', { width: 1080, height: 800, freeHeight: 536 }],
])('frameBoard con la torre %s', (_, size) => {
  it('lo más alto del tablero llega casi a la altura de los botones', () => {
    const framing = frameBoard(tower, size);
    const bounds = projectBounds(tower, size, Math.hypot(...framing.position), framing.lift);

    expect(bounds.top).toBeGreaterThanOrEqual(MARGIN_TOP_PX - 1);
    expect(bounds.top).toBeLessThan(MARGIN_TOP_PX + 20);
  });

  it('el personaje de pie en la meta no se sale por arriba', () => {
    const framing = frameBoard(tower, size);
    const head = projectBounds(tower, size, Math.hypot(...framing.position), framing.lift, CHARACTER_HEIGHT);

    expect(head.top).toBeGreaterThanOrEqual(0);
  });
});

/*
 * El 2 del mundo 1: un zigzag que ocupa poco de su 5 × 5. Midiendo sólo sus
 * columnas quedaba pegado a la cámara, y el usuario lo vio incómodo.
 */
describe('frameBoard con huecos', () => {
  const zigzag: LevelConfig = {
    ...flat(5, 5),
    tiles: [
      ['gap', 'gap', 'floor', 'floor', 'floor'],
      ['gap', 'gap', 'floor', 'gap', 'gap'],
      ['floor', 'floor', 'floor', 'gap', 'gap'],
      ['floor', 'gap', 'gap', 'gap', 'gap'],
      ['gap', 'gap', 'gap', 'gap', 'gap'],
    ],
    heights: [
      [0, 0, 1, 1, 1],
      [0, 0, 1, 0, 0],
      [1, 1, 1, 0, 0],
      [1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
  };

  it('no se acerca más que el mismo tablero lleno y plano', () => {
    expect(Math.hypot(...frameBoard(zigzag, viewport).position)).toBeCloseTo(
      Math.hypot(...frameBoard(flat(5, 5), viewport).position),
      5,
    );
  });

  /*
   * El suelo es sólo para tableros PLANOS: el 1 del mundo 2 tiene huecos y
   * alturas, y el usuario dio por bueno su tamaño sin alejarlo.
   */
  it('un tablero con huecos y alturas no se aleja por ser hueco', () => {
    const climb: LevelConfig = {
      ...zigzag,
      heights: [
        [0, 0, 1, 2, 3],
        [0, 0, 1, 0, 0],
        [1, 1, 1, 0, 0],
        [1, 0, 0, 0, 0],
        [0, 0, 0, 0, 0],
      ],
    };

    expect(Math.hypot(...frameBoard(climb, viewport).position)).toBeLessThan(
      Math.hypot(...frameBoard(flat(5, 5), viewport).position),
    );
  });
});

describe('frameBoard con alturas', () => {
  it('la torre se aleja más que un tablero plano del mismo tamaño', () => {
    expect(Math.hypot(...frameBoard(tower, viewport).position)).toBeGreaterThan(
      Math.hypot(...frameBoard(flat(5, 5), viewport).position),
    );
  });
});
