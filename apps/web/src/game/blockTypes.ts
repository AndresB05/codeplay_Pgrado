/*
 * Cómo se llaman los tres bloques en el JSON del programa. Viven aparte de
 * `blocks.ts` porque ese archivo importa Blockly y **el intérprete no puede
 * importarlo**: arrastraría la librería entera al trozo de la escena, que es
 * justo lo que la frontera de `BlockEditorLoader.tsx` evita.
 *
 * La alternativa era escribir estos cuatro textos dos veces, una a cada lado de
 * la frontera. Dos copias de un nombre se contradicen en cuanto alguien edite
 * una, y aquí la contradicción no daría error: daría un programa que se
 * construye y no se ejecuta.
 */

export const ADVANCE_BLOCK = 'codeplay_advance';
export const TURN_LEFT_BLOCK = 'codeplay_turn_left';
export const TURN_RIGHT_BLOCK = 'codeplay_turn_right';
export const JUMP_BLOCK = 'codeplay_jump';

/** La entrada donde van los bloques que se ejecutan saltando. */
export const JUMP_BODY = 'BODY';

/** El campo con cuántas casillas avanzar. Lo lee el J5 y lo cuenta el J6. */
export const STEPS_FIELD = 'STEPS';
