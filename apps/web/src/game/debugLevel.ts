import type { LevelConfig } from './level';

/*
 * La rejilla de pega del J2, y NO es un puzle diseñado ni contenido del
 * producto: los nueve puzles los diseña el usuario, y se siembran en el J7.1
 * leyéndolos de la base. Ésta existe sólo para ejercitar las reglas de
 * movimiento y ver el tablero pintado; depurar el pintado contra un puzle que
 * además importa es depurar dos cosas a la vez.
 *
 * Lleva un muro y un hueco a propósito: sin ellos las reglas nacen sin nada
 * que las ejercite. La matriz se escribe alineada para que se lea como el
 * tablero que es.
 *
 *          O                             E
 *      ┌───────────────────────────────────┐
 *    N │  .     .     .     ▓    META      │
 *      │  .     ▓     .     .     .        │
 *      │  .     .    hueco  .     .        │
 *      │  .     ▓     .     ▓     .        │
 *    S │ SALIDA .     .     .     .        │
 *      └───────────────────────────────────┘
 *
 * La mejor solución son diez pasos: girar a la derecha, avanzar cuatro por la
 * fila sur, girar a la izquierda y avanzar cuatro por la columna este. Es el
 * ejemplo resuelto del contrato §4.4, y de ahí sale `optimalSteps`.
 */
export const debugLevel: LevelConfig = {
  tiles: [
    ['floor', 'floor', 'floor', 'wall', 'floor'],
    ['floor', 'wall', 'floor', 'floor', 'floor'],
    ['floor', 'floor', 'gap', 'floor', 'floor'],
    ['floor', 'wall', 'floor', 'wall', 'floor'],
    ['floor', 'floor', 'floor', 'floor', 'floor'],
  ],
  start: { cell: { row: 4, column: 0 }, facing: 'north' },
  goal: { row: 0, column: 4 },
  optimalSteps: 10,
};
