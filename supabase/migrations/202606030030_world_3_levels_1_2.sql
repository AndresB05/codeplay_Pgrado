/*
 * Los niveles 1 y 2 de la Costa de Bugs. El 3 NO entra: el usuario diseñó estos
 * dos el 16-sep-2026 y el tercero llega después, en la 0031. Hasta entonces el
 * nivel 3 sigue siendo «Tormenta Final», del juego anterior, y la pantalla lo
 * rechaza entero — que es el estado esperado, no un fallo.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema: ninguna columna cambia, así que
 * `database.types.ts` NO se regenera. Cada fila se localiza por `(world_id,
 * sort_order)`, y ninguna toca `xp_reward` ni `difficulty`.
 *
 * EL ORDEN DE LOS `update` ES LIBRE AQUÍ, y no lo era en la 0029. Allí un slug
 * cambiaba de fila y `levels_world_slug_unique` (0003) se comprueba en cada
 * sentencia. Los dos slugs nuevos —`dos-caminos` y `el-faro`— no coinciden con
 * ninguno de los tres que este mundo trae sembrados desde la 0012
 * —`ola-de-errores`, `faro-asincrono`, `tormenta-final`—, así que ninguna
 * sentencia puede chocar con otra.
 *
 * LA REGLA DEL MUNDO 3 ES EL MÁXIMO DE PASOS, y la trae `stepLimit` (contrato
 * §4.2, mecánica de `limite-de-pasos`): al agotarlo el recorrido se corta y el
 * personaje se queda donde esté. En los dos vale lo mismo que `optimalSteps`,
 * por decisión del usuario: aquí pasar el nivel ES resolverlo del todo.
 *
 * Los tableros, filas de NORTE a SUR y columnas de oeste a este. El usuario los
 * dio con los mapas girados respecto al boceto —su fila de arriba era el borde
 * oeste— por tercera vez, se confirmaron con el norte arriba y **se le enseñaron
 * montados en el motor del juego, desde cinco ángulos**, antes de escribir esto.
 */

/*
 * NIVEL 1. Un anillo llano por los cuatro bordes con el centro de tres por tres
 * vacío. Salida en la esquina suroeste y meta en la noreste, las dos a altura 1.
 * Todo el anillo es llano SALVO DOS PILARES de altura 2 pegados a la esquina
 * sureste, uno a cada lado de ella.
 *
 * LOS PILARES SON EL NIVEL. Se puede rodear por los dos lados, y el que el
 * personaje tiene DE FRENTE al empezar tiene un giro menos —se arranca sin
 * girar— y aun así cuesta uno más, porque cada pilar obliga a un salto y un
 * salto cuesta dos. La salida mira al ESTE, o sea al camino malo.
 *
 *            O              E
 *        N   1  1  1  1  1M     fila 0
 *            1  ·  ·  ·  1      fila 1
 *            1  ·  ·  ·  1      fila 2
 *            1  ·  ·  ·  2      fila 3
 *        S   1S 1  1  2  1      fila 4
 *
 * La mejor solución, 10 pasos:
 *
 *   girar a la izquierda        1   mira al norte
 *   avanzar 4                   4   → fila 0, columna 0
 *   girar a la derecha          1   mira al este
 *   avanzar 4                   4   → la meta
 *
 * Y el camino de frente, por el sur y el este, cuesta 11: ocho casillas y un
 * solo giro, pero dos saltos.
 */
update public.levels
set slug = 'dos-caminos',
    title = 'Nivel 1 - Dos caminos',
    description = 'Hay dos maneras de rodear el agujero, y sólo una te alcanza.',
    narrative = 'En este mundo tienes los pasos contados: mira el número de arriba, que va bajando, y si llega a cero el personaje se queda quieto y hay que reiniciar. Puedes rodear el agujero por un lado o por el otro, así que cuenta antes de ejecutar — y no olvides que saltar un escalón cuesta el doble que andar.',
    programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["floor", "floor", "floor", "floor", "floor"],
            ["floor", "gap",   "gap",   "gap",   "floor"],
            ["floor", "gap",   "gap",   "gap",   "floor"],
            ["floor", "gap",   "gap",   "gap",   "floor"],
            ["floor", "floor", "floor", "floor", "floor"]
        ],
        "heights": [
            [1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 0, 0, 0, 2],
            [1, 1, 1, 2, 1]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "east" },
        "goal": { "row": 0, "column": 4 },
        "optimalSteps": 10,
        "stepLimit": 10
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'costa-de-bugs')
  and sort_order = 1;

/*
 * NIVEL 2. Una torre de altura 5 en el borde oeste, la segunda casilla contando
 * desde el norte, a la que SÓLO se entra desde la casilla de altura 4 que tiene
 * al norte: desde sus otras dos vecinas hay tres y cuatro escalones de golpe.
 * La salida está en la esquina sureste y mira al NORTE, que es el borde que se
 * acaba a dos casillas: de frente no se llega a ninguna parte.
 *
 *            O              E
 *        N   4  3  3  2  ·       fila 0
 *            5M 2  2  1  ·       fila 1
 *            1  2  ·  1  1       fila 2
 *            1  1  ·  ·  1       fila 3
 *        S   ·  1  1  1  1S      fila 4
 *
 * La mejor solución, 17 pasos:
 *
 *   girar a la izquierda        1   mira al oeste
 *   avanzar 3                   3   → fila 4, columna 1
 *   girar a la derecha          1   mira al norte
 *   avanzar 1                   1   → fila 3, columna 1
 *   saltar [ avanzar 1 ]        2   → altura 2, fila 2
 *   avanzar 1                   1   → fila 1, columna 1
 *   saltar [ avanzar 1 ]        2   → altura 3, fila 0
 *   girar a la izquierda        1   mira al oeste
 *   saltar [ avanzar 1 ]        2   → altura 4, fila 0, columna 0
 *   girar a la izquierda        1   mira al sur
 *   saltar [ avanzar 1 ]        2   → la meta, altura 5
 *
 * Con la salida mirando al oeste el mínimo habría sido 16, y el camino bueno
 * estaría de frente. El usuario eligió el norte viendo las dos imágenes.
 */
update public.levels
set slug = 'el-faro',
    title = 'Nivel 2 - El faro',
    description = 'Sube a lo alto del faro sin gastar un paso de más.',
    narrative = 'El faro está en la punta más alta, y de frente no se sube: por ahí el suelo se acaba enseguida. Mira bien el tablero antes de colocar un solo bloque, porque tienes los pasos justos y cada giro te cuesta uno.',
    programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["floor", "floor", "floor", "floor", "gap"  ],
            ["floor", "floor", "floor", "floor", "gap"  ],
            ["floor", "floor", "gap",   "floor", "floor"],
            ["floor", "floor", "gap",   "gap",   "floor"],
            ["gap",   "floor", "floor", "floor", "floor"]
        ],
        "heights": [
            [4, 3, 3, 2, 0],
            [5, 2, 2, 1, 0],
            [1, 2, 0, 1, 1],
            [1, 1, 0, 0, 1],
            [0, 1, 1, 1, 1]
        ],
        "start": { "cell": { "row": 4, "column": 4 }, "facing": "north" },
        "goal": { "row": 1, "column": 0 },
        "optimalSteps": 17,
        "stepLimit": 17
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'costa-de-bugs')
  and sort_order = 2;
