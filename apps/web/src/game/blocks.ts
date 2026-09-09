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
 *
 * Los dos giros llevan colores DISTINTOS, y no es decoración: son el único par
 * de bloques cuyo texto se diferencia en una palabra al final, y el niño los
 * busca en la caja por el color antes de leerlos.
 */
const ADVANCE_COLOR = '#3B9DF8'; // sky
const TURN_LEFT_COLOR = '#FF8A3D'; // papaya
const TURN_RIGHT_COLOR = '#7B3FE4'; // grape

/*
 * Los nombres de los tres bloques nacen en `blockTypes.ts`, sin Blockly, para
 * que el intérprete pueda leerlos sin cruzar la frontera. Se reexportan aquí
 * porque quien trabaja con los bloques los busca en este archivo.
 */
export { ADVANCE_BLOCK, STEPS_FIELD, TURN_LEFT_BLOCK, TURN_RIGHT_BLOCK };

/*
 * LOS ICONOS DE LOS BLOQUES, en línea y no como ficheros.
 *
 * Un `field_image` pide una URL, y un fichero suelto es exactamente la trampa
 * que el J4 evitó al quitar papelera, zoom y sonidos: sin configurar la ruta de
 * `media/` dan 404 en silencio. Un `data:` no tiene ruta que configurar.
 *
 * Y NO se serializan: `field_image` no guarda estado, así que el JSON del
 * contrato §4.3 sigue siendo el mismo —`fields: { STEPS: n }` y nada más—.
 */
const icon = (path: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fff"><path d="${path}"/></svg>`,
  )}`;

const ARROW_UP = icon('M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z');
const ROTATE_LEFT = icon(
  'M7.11 8.53L5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61V17.9c-.87-.15-1.71-.49-2.46-1.03L7.1 18.32zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.05-7.44-7-7.93z',
);
const ROTATE_RIGHT = icon(
  'M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42l1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z',
);

const ICON_SIZE = 20;
const iconField = (src: string, alt: string) => ({
  type: 'field_image',
  src,
  width: ICON_SIZE,
  height: ICON_SIZE,
  alt,
});

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
    message0: '%1 avanzar %2',
    args0: [
      iconField(ARROW_UP, 'avanzar'),
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
    message0: '%1 girar a la izquierda',
    args0: [iconField(ROTATE_LEFT, 'girar a la izquierda')],
    previousStatement: null,
    nextStatement: null,
    colour: TURN_LEFT_COLOR,
    tooltip: 'Gira un cuarto de vuelta sin cambiar de casilla.',
  },
  {
    type: TURN_RIGHT_BLOCK,
    message0: '%1 girar a la derecha',
    args0: [iconField(ROTATE_RIGHT, 'girar a la derecha')],
    previousStatement: null,
    nextStatement: null,
    colour: TURN_RIGHT_COLOR,
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
 * Los tres bloques que la caja ofrece, sin categoría que los envuelva.
 *
 * Hasta el J6.3 esto era un `categoryToolbox` de una sola categoría, porque la
 * caja se inyectaba con el lienzo. Desde que vive SEPARADA —en la columna
 * derecha, como un flyout suelto y siempre abierto— la categoría sobra: era un
 * clic entre el niño y sus bloques, y el desplegable que la abría pertenecía al
 * espacio inyectado, que es justo lo que se ha dejado de usar.
 */
export const FLYOUT_BLOCKS: Blockly.utils.toolbox.FlyoutItemInfoArray = [
  { kind: 'block', type: ADVANCE_BLOCK },
  { kind: 'block', type: TURN_LEFT_BLOCK },
  { kind: 'block', type: TURN_RIGHT_BLOCK },
];
