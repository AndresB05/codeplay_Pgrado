/*
 * UNA SOLA ALTURA DEL NIVEL 3. La 0031 sembró este nivel ayer y el usuario lo
 * retocó el 17-sep-2026 al ver medido lo que tenía: sube a 4 la casilla de la
 * fila 3, columna 4 —contando desde el norte y desde el oeste—, que valía 3.
 * Todo lo demás de la fila se reescribe igual salvo `optimalSteps` y
 * `stepLimit`, que pasan de 13 a 14.
 *
 * La 0031 no se edita: está aplicada. Es el mismo caso que la 0024 sobre la
 * 0023, que rehízo el tablero del nivel 1 del mundo 1 con otra migración.
 *
 * POR QUÉ, y es una decisión de producto que conviene no deshacer. Con esa
 * casilla a 3 el nivel costaba 13 pasos y tenía CUATRO caminos óptimos de entre
 * 113 recorridos posibles. Se le ofrecieron dos cambios de un bloque que dejaban
 * UN ÚNICO camino correcto —12 pasos, 204 recorridos— y los rechazó:
 *
 *   «ese camino es demasiado fácil, prefiero los dos caminos con 48 recorridos,
 *   al menos esos 2 caminos no son tan obvios; darle un solo camino así de
 *   sencillo es como darle una línea recta entre caminos curvados, hace la
 *   elección muy obvia».
 *
 * Lo que queda: 14 pasos, DOS caminos óptimos, 48 recorridos posibles que no
 * repiten casilla, y DOS de ellos se quedan a un solo paso del límite. Ésa es la
 * dificultad del mundo 3 tal y como el usuario la define: no la cantidad de
 * pasos, sino lo difícil que es decidir qué camino es el eficiente.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema. Un solo `update` por `(world_id,
 * sort_order)`, sin tocar `xp_reward` ni `difficulty`.
 */

/*
 * El cambio deja un escalón de altura 4 EN MEDIO de la subida, y eso es lo que
 * rompe los caminos obvios: la casilla que da a la meta mide 3, así que hay que
 * subir a la de 4, BAJAR ANDANDO a la de 3 y volver a saltar. Pasar de largo
 * hacia arriba para poder llegar.
 *
 *            O              E
 *        N   ·  ·  ·  4M ·       fila 0
 *            ·  4  3  3  3       fila 1
 *            2  2  2 [4] 2       fila 2   ← la que sube, de 3 a 4
 *            1  2  3  3  1       fila 3
 *        S   1S 2  1  1  1       fila 4
 *
 * Uno de los dos caminos de 14 pasos:
 *
 *   girar a la izquierda        1   mira al norte
 *   avanzar 1                   1   → fila 3, columna 0
 *   girar a la derecha          1   mira al este
 *   saltar [ avanzar 2 ]        4   → sube dos escalones: fila 3, columna 2
 *   avanzar 1                   1   → fila 3, columna 3
 *   girar a la izquierda        1   mira al norte
 *   saltar [ avanzar 1 ]        2   → altura 4, fila 2
 *   avanzar 1                   1   → BAJA a la de altura 3, fila 1
 *   saltar [ avanzar 1 ]        2   → la meta, altura 4
 */
update public.levels
set slug = 'muchos-caminos',
    title = 'Nivel 3 - Muchos caminos',
    description = 'Muchos caminos suben a la cima. Sólo unos pocos te alcanzan.',
    narrative = 'Aquí no hay un camino bueno y otro malo: hay muchos, y casi todos gastan más pasos de los que tienes. Ojo con la casilla que tienes delante, que está un escalón más arriba y andando no se sube. Cuenta antes de ejecutar, y si te quedas sin pasos reinicia y prueba por otro lado.',
    programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "gap",   "gap",   "floor", "gap"  ],
            ["gap",   "floor", "floor", "floor", "floor"],
            ["floor", "floor", "floor", "floor", "floor"],
            ["floor", "floor", "floor", "floor", "floor"],
            ["floor", "floor", "floor", "floor", "floor"]
        ],
        "heights": [
            [0, 0, 0, 4, 0],
            [0, 4, 3, 3, 3],
            [2, 2, 2, 4, 2],
            [1, 2, 3, 3, 1],
            [1, 2, 1, 1, 1]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "east" },
        "goal": { "row": 0, "column": 3 },
        "optimalSteps": 14,
        "stepLimit": 14
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'costa-de-bugs')
  and sort_order = 3;
