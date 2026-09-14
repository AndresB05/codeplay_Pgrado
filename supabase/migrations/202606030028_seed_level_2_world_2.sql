/*
 * El nivel 2 del mundo 2, rediseñado: el primero de la Cordillera Binaria que se
 * siembra y el primero con subidas. Hasta hoy la fila era «Mochila de Datos», del
 * juego anterior. Va en el 2 y no en el 1 por decisión del usuario el
 * 13-sep-2026: el nivel 1 del mundo será uno más fácil, todavía sin diseñar.
 *
 * Se juega con el bloque «saltar» que trajo `salto-y-alturas`, así que va en la
 * versión 2 del formato, igual que la 0027, que se aplica antes.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema: ninguna columna cambia, así que
 * `database.types.ts` NO se regenera. Localiza la fila por `(world_id,
 * sort_order)` y no por slug, porque el slug es lo que cambia. No toca
 * `xp_reward`: la 0023 ya igualó los nueve a 100.
 */

/*
 * EL PUZLE, diseñado por el usuario sobre un boceto el 13-sep-2026 y jugado por él
 * en el laboratorio antes de sembrarlo. Filas de NORTE a SUR y columnas de oeste a
 * este, con la lectura de siempre del boceto: la esquina izquierda del dibujo es
 * la suroeste. Cada número es la altura de la columna; `·` es hueco.
 *
 *            O              E
 *        N   ·  3M ·  ·  ·       fila 0
 *            ·  3  3  3  3       fila 1
 *            1  1  1  2  3       fila 2
 *            1  ·  ·  ·  ·       fila 3
 *        S   1S ·  ·  ·  ·       fila 4
 *
 * Una subida de altura 1 a una meseta de altura 3, por un escalón de altura 2. La
 * salida mira al NORTE, hacia su única vecina.
 *
 * NO ES UN CAMINO ÚNICO, y eso costó un error que conviene dejar escrito: al
 * leerlo a mano se dio por bueno el recorrido por la esquina —subir el escalón y
 * la columna de altura 3 de la derecha con `saltar [avanzar 2]`, 17 pasos—, y la
 * búsqueda del mínimo de `levelSolutions.test.ts` encontró uno más corto. Desde el
 * escalón se salta DIRECTAMENTE a la meseta hacia el norte. Sembrar 17 habría
 * dejado a cualquier niño que lo viera batiendo «la mejor solución».
 *
 * La mejor solución, 15 pasos:
 *
 *   avanzar 2                   2   → fila 2, columna 0
 *   girar a la derecha          1   mira al este
 *   avanzar 2                   2   → fila 2, columna 2
 *   saltar [ avanzar 1 ]        2   → sube al escalón, altura 2
 *   girar a la izquierda        1   mira al norte
 *   saltar [ avanzar 1 ]        2   → sube a la meseta, altura 3
 *   girar a la izquierda        1   mira al oeste
 *   avanzar 2                   2   → fila 1, columna 1
 *   girar a la derecha          1   mira al norte
 *   avanzar 1                   1   → fila 0, columna 1: la meta
 *
 * Por debajo de 15 no hay programa: de la salida al escalón hay cuatro casillas y
 * un salto con un giro, y del escalón a la meta cuatro casillas más, una saltando,
 * con tres cambios de dirección; la búsqueda del test lo confirma.
 */
update public.levels
set slug = 'salta-y-sube',
    title = 'Nivel 2 - Salta y sube',
    description = 'Usa el bloque saltar para subir a lo alto de la montaña.',
    narrative = 'Andando no puedes subir a una casilla más alta: mete un avanzar dentro del bloque saltar para subir un escalón. ¡Fíjate bien! Hay más de un camino hasta arriba, y no todos cuestan lo mismo.',
    programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "floor", "gap",   "gap",   "gap"  ],
            ["gap",   "floor", "floor", "floor", "floor"],
            ["floor", "floor", "floor", "floor", "floor"],
            ["floor", "gap",   "gap",   "gap",   "gap"  ],
            ["floor", "gap",   "gap",   "gap",   "gap"  ]
        ],
        "heights": [
            [0, 3, 0, 0, 0],
            [0, 3, 3, 3, 3],
            [1, 1, 1, 2, 3],
            [1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "north" },
        "goal": { "row": 0, "column": 1 },
        "optimalSteps": 15
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'cordillera-binaria')
  and sort_order = 2;
