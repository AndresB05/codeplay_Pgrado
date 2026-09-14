/*
 * Los tres niveles de la Cordillera Binaria, de una vez. «Salta y sube», que la
 * 0028 sembró como nivel 2, BAJA AL NIVEL 1 sin cambiar de tablero: el usuario
 * diseñó el 14-sep-2026 dos niveles más difíciles para el 2 y el 3. El 1 era
 * «Eco de Funciones» y el 3 «Sendero Recursivo», los dos del juego anterior.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema: ninguna columna cambia, así que
 * `database.types.ts` NO se regenera. Cada fila se localiza por `(world_id,
 * sort_order)`, como en sus migraciones, y ninguna toca `xp_reward`.
 *
 * EL ORDEN DE LOS `update` NO ES LIBRE. `levels_world_slug_unique` (0003) se
 * comprueba en cada sentencia, y `salta-y-sube` sigue en el nivel 2 hasta que se
 * reescribe: el nivel 1 no puede tomar ese slug antes. Por eso va primero el 2.
 *
 * Los tableros, filas de NORTE a SUR y columnas de oeste a este. El usuario los
 * dio con un mapa desde arriba girado respecto al boceto —su fila de arriba era
 * el borde oeste— y se confirmaron con el norte arriba, que es lo que se siembra.
 */

/*
 * NIVEL 2. La salida es una roca de altura 1 en medio de un valle; la meta, la
 * esquina noreste a altura 3. Un solo camino: rodear el valle por el este y el
 * sur, subir al muro del oeste, bajar por el borde norte y subir dos escalones.
 * La salida mira al ESTE, hacia su única vecina.
 *
 *            O              E
 *        N   2  1  1  2  3M      fila 0
 *            2  ·  ·  ·  ·       fila 1
 *            2  ·  1S 1  1       fila 2
 *            2  2  ·  ·  1       fila 3
 *        S   ·  1  1  1  1       fila 4
 *
 * La mejor solución, 25 pasos:
 *
 *   avanzar 2                   2   → fila 2, columna 4
 *   girar a la derecha          1   mira al sur
 *   avanzar 2                   2   → fila 4, columna 4
 *   girar a la derecha          1   mira al oeste
 *   avanzar 3                   3   → fila 4, columna 1
 *   girar a la derecha          1   mira al norte
 *   saltar [ avanzar 1 ]        2   → sube al muro, altura 2
 *   girar a la izquierda        1   mira al oeste
 *   avanzar 1                   1   → fila 3, columna 0
 *   girar a la derecha          1   mira al norte
 *   avanzar 3                   3   → fila 0, columna 0
 *   girar a la derecha          1   mira al este
 *   avanzar 2                   2   → baja a altura 1, fila 0, columna 2
 *   saltar [ avanzar 2 ]        4   → sube dos escalones: la meta
 */
update public.levels
set slug = 'el-gran-rodeo',
    title = 'Nivel 2 - El gran rodeo',
    description = 'Rodea el valle, sube al muro y llega a lo más alto.',
    narrative = 'Empiezas en una roca en medio del valle y la cima queda lejos: tendrás que dar un buen rodeo. Recuerda que saltando subes un escalón cada vez, y que para bajar basta con andar.',
    programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["floor", "floor", "floor", "floor", "floor"],
            ["floor", "gap",   "gap",   "gap",   "gap"  ],
            ["floor", "gap",   "floor", "floor", "floor"],
            ["floor", "floor", "gap",   "gap",   "floor"],
            ["gap",   "floor", "floor", "floor", "floor"]
        ],
        "heights": [
            [2, 1, 1, 2, 3],
            [2, 0, 0, 0, 0],
            [2, 0, 1, 1, 1],
            [2, 2, 0, 0, 1],
            [0, 1, 1, 1, 1]
        ],
        "start": { "cell": { "row": 2, "column": 2 }, "facing": "east" },
        "goal": { "row": 0, "column": 4 },
        "optimalSteps": 25
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'cordillera-binaria')
  and sort_order = 2;

/*
 * NIVEL 1. El tablero de la 0028 sin tocar una casilla: cambian el título y el
 * sitio. La salida mira al NORTE.
 *
 *            O              E
 *        N   ·  3M ·  ·  ·       fila 0
 *            ·  3  3  3  3       fila 1
 *            1  1  1  2  3       fila 2
 *            1  ·  ·  ·  ·       fila 3
 *        S   1S ·  ·  ·  ·       fila 4
 *
 * La mejor solución, 15 pasos, y NO es un camino único —la 0028 cuenta el error
 * de dar por buenos 17—:
 *
 *   avanzar 2, derecha, avanzar 2, saltar [ avanzar 1 ], izquierda,
 *   saltar [ avanzar 1 ], izquierda, avanzar 2, derecha, avanzar 1
 */
update public.levels
set slug = 'salta-y-sube',
    title = 'Nivel 1 - Salta y sube',
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
  and sort_order = 1;

/*
 * NIVEL 3. Una torre con la meta a altura 6. Como se sube un escalón por salto,
 * no se llega de frente: se sube por el este, se cruza por el norte y se vuelve
 * hacia el centro antes de los dos últimos saltos. La salida, en la esquina
 * suroeste, mira al NORTE, hacia su única vecina.
 *
 *            O              E
 *        N   ·  ·  4  3  ·       fila 0
 *            ·  6M 4  2  ·       fila 1
 *            ·  6  5  2  ·       fila 2
 *            1  1  1  1  ·       fila 3
 *        S   1S ·  ·  ·  ·       fila 4
 *
 * La mejor solución, 23 pasos:
 *
 *   avanzar 1                   1   → fila 3, columna 0
 *   girar a la derecha          1   mira al este
 *   avanzar 3                   3   → fila 3, columna 3
 *   girar a la izquierda        1   mira al norte
 *   saltar [ avanzar 1 ]        2   → altura 2
 *   avanzar 1                   1   → fila 1, columna 3
 *   saltar [ avanzar 1 ]        2   → altura 3, fila 0
 *   girar a la izquierda        1   mira al oeste
 *   saltar [ avanzar 1 ]        2   → altura 4, fila 0, columna 2
 *   girar a la izquierda        1   mira al sur
 *   avanzar 1                   1   → fila 1, columna 2
 *   saltar [ avanzar 1 ]        2   → altura 5, fila 2
 *   girar a la derecha          1   mira al oeste
 *   saltar [ avanzar 1 ]        2   → altura 6, fila 2, columna 1
 *   girar a la derecha          1   mira al norte
 *   avanzar 1                   1   → la meta
 */
update public.levels
set slug = 'la-torre',
    title = 'Nivel 3 - La torre',
    description = 'Sube hasta lo más alto de la torre, escalón a escalón.',
    narrative = 'La meta está en lo alto de la torre, y saltando sólo subes un escalón cada vez. Antes de saltar, fíjate en la casilla que tienes delante: si está dos escalones más arriba, no llegarás. ¡Busca otro camino!',
    programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "gap",   "floor", "floor", "gap"  ],
            ["gap",   "floor", "floor", "floor", "gap"  ],
            ["gap",   "floor", "floor", "floor", "gap"  ],
            ["floor", "floor", "floor", "floor", "gap"  ],
            ["floor", "gap",   "gap",   "gap",   "gap"  ]
        ],
        "heights": [
            [0, 0, 4, 3, 0],
            [0, 6, 4, 2, 0],
            [0, 6, 5, 2, 0],
            [1, 1, 1, 1, 0],
            [1, 0, 0, 0, 0]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "north" },
        "goal": { "row": 1, "column": 1 },
        "optimalSteps": 23
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'cordillera-binaria')
  and sort_order = 3;
