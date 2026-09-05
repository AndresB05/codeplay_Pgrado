import * as Blockly from 'blockly/core';
import { ADVANCE_BLOCK, STEPS_FIELD, TURN_LEFT_BLOCK, TURN_RIGHT_BLOCK } from './blockTypes';

/*
 * Los bloques del juego y la caja de herramientas que los ofrece.
 *
 * Se importa `blockly/core` y NO `blockly`: el punto de entrada principal
 * arrastra la biblioteca de bloques estándar —`controls_if`, `math_number`,
 * `text`…— y el generador de JavaScript, y aquí no se usa ninguno de los dos.
 * Este juego define sus tres bloques y no genera código: el intérprete del J5
 * recorre el JSON.
 *
 * Este archivo importa Blockly, así que vive BAJO la frontera diferida. Nada por
 * encima de `BlockEditorLoader` debe importarlo.
 */

/*
 * Los únicos hexadecimales del editor, por lo mismo que en `GameScene.tsx`:
 * Blockly recibe un color, no una clase de Tailwind. Son nombres del tema
 * duplicados a mano desde tailwind.config.js.
 */
const ADVANCE_COLOR = '#3B9DF8'; // sky
const TURN_COLOR = '#FF8A3D'; // papaya

/*
 * Los nombres de los tres bloques nacen en `blockTypes.ts`, sin Blockly, para
 * que el intérprete pueda leerlos sin cruzar la frontera. Se reexportan aquí
 * porque quien trabaja con los bloques los busca en este archivo.
 */
export { ADVANCE_BLOCK, STEPS_FIELD, TURN_LEFT_BLOCK, TURN_RIGHT_BLOCK };

/*
 * El número va en un CAMPO del bloque, no en un hueco donde encaje otro bloque,
 * y ésa es la única decisión de forma que este archivo toma.
 *
 * El contrato §4.4 exige que las repeticiones sean números presentes en el
 * programa, porque es lo que permite contar los pasos leyendo, sin simular el
 * juego. Un hueco para otro bloque abre la puerta a que ahí acabe una expresión,
 * y ese día el recuento deja de poder calcularse. Con un campo la garantía es
 * estructural: no hay forma de escribir algo que no sea un número.
 */
const BLOCK_DEFINITIONS = [
  {
    type: ADVANCE_BLOCK,
    /*
     * «avanzar %1» y no «avanzar %1 casillas»: el niño puede escribir un 1, y
     * «avanzar 1 casillas» está mal dicho. La unidad vive en el globo de ayuda,
     * y así el bloque se lee igual que lo nombra el contrato §4.4: `avanzar N`.
     */
    message0: 'avanzar %1',
    args0: [
      {
        type: 'field_number',
        name: STEPS_FIELD,
        value: 1,
        min: 1,
        max: 10,
        precision: 1,
      },
    ],
    previousStatement: null,
    nextStatement: null,
    colour: ADVANCE_COLOR,
    tooltip: 'Camina ese número de casillas hacia donde estás mirando.',
  },
  {
    type: TURN_LEFT_BLOCK,
    message0: 'girar a la izquierda',
    previousStatement: null,
    nextStatement: null,
    colour: TURN_COLOR,
    tooltip: 'Gira un cuarto de vuelta sin cambiar de casilla.',
  },
  {
    type: TURN_RIGHT_BLOCK,
    message0: 'girar a la derecha',
    previousStatement: null,
    nextStatement: null,
    colour: TURN_COLOR,
    tooltip: 'Gira un cuarto de vuelta sin cambiar de casilla.',
  },
];

/*
 * Las definiciones viven en un registro global de Blockly, así que definirlas
 * dos veces avisa por consola y pisa lo anterior. Con `React.StrictMode` el
 * editor se monta dos veces en desarrollo, y eso pasaría en cada recarga.
 */
export const defineGameBlocks = (): void => {
  if (Blockly.Blocks[ADVANCE_BLOCK]) {
    return;
  }

  Blockly.defineBlocksWithJsonArray(BLOCK_DEFINITIONS);
};

/*
 * Una sola categoría, y con nombre nuestro: lo que `setLocale` traduce es lo que
 * es de Blockly —los menús, los diálogos, los avisos—, no lo que escribimos
 * aquí.
 */
export const TOOLBOX = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Movimiento',
      colour: ADVANCE_COLOR,
      contents: [
        { kind: 'block', type: ADVANCE_BLOCK },
        { kind: 'block', type: TURN_LEFT_BLOCK },
        { kind: 'block', type: TURN_RIGHT_BLOCK },
      ],
    },
  ],
};
