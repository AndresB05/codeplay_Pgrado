/*
 * Los tres niveles del mundo 1, pasados a la versión 2 del formato.
 *
 * La 2 llegó con `salto-y-alturas`, decidido por el usuario el 13-sep-2026: el
 * tablero gana la altura de cada casilla y el programa gana un bloque, «saltar»,
 * que lleva otros dentro. Cambian las dos formas que la versión nombra, así que
 * el juego sólo acepta ya `grid-blockly-2`, y estas tres filas, sembradas en la 1
 * por la 0023, la 0024, la 0025 y la 0026, dejarían de jugarse sin esta migración.
 *
 * Se pudo retirar la 1 sin coste porque todavía no hay ningún intento guardado
 * que la lleve (J9). El día que los haya, cambiar de versión obligará a decidir
 * qué se hace con ellos.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema: ninguna columna cambia, así que
 * `database.types.ts` NO se regenera.
 *
 * NO CAMBIA NINGÚN PUZLE. Cada tablero es el mismo casilla a casilla, con la misma
 * salida, la misma meta y los mismos pasos óptimos —4, 12 y 20—; lo único que
 * gana es `heights`, con altura 1 en cada casilla que existe y 0 en cada hueco.
 * Con todas las alturas a 1 el juego se ve y se juega exactamente igual que antes.
 * Título, descripción, narrativa y slug no se tocan.
 *
 * Cada fila se localiza por `(world_id, sort_order)`, como en sus migraciones.
 */

-- Nivel 1 - Siempre adelante: la columna de la 0024.
update public.levels
set programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["floor"],
            ["floor"],
            ["floor"],
            ["floor"],
            ["floor"]
        ],
        "heights": [
            [1],
            [1],
            [1],
            [1],
            [1]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "north" },
        "goal": { "row": 0, "column": 0 },
        "optimalSteps": 4
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 1;

-- Nivel 2 - Camino con curvas: el zigzag de la 0025.
update public.levels
set programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "gap",   "floor", "floor", "floor"],
            ["gap",   "gap",   "floor", "gap",   "gap"  ],
            ["gap",   "gap",   "floor", "gap",   "gap"  ],
            ["floor", "gap",   "floor", "gap",   "gap"  ],
            ["floor", "floor", "floor", "gap",   "gap"  ]
        ],
        "heights": [
            [0, 0, 1, 1, 1],
            [0, 0, 1, 0, 0],
            [0, 0, 1, 0, 0],
            [1, 0, 1, 0, 0],
            [1, 1, 1, 0, 0]
        ],
        "start": { "cell": { "row": 3, "column": 0 }, "facing": "south" },
        "goal": { "row": 0, "column": 4 },
        "optimalSteps": 12
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 2;

-- Nivel 3 - La escalera: la vuelta de la 0026.
update public.levels
set programming_language = 'grid-blockly-2',
    starter_code = '{"formatVersion":"grid-blockly-2","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "gap",   "floor", "floor", "floor"],
            ["gap",   "floor", "floor", "gap",   "floor"],
            ["floor", "floor", "gap",   "gap",   "floor"],
            ["floor", "gap",   "gap",   "gap",   "floor"],
            ["floor", "floor", "floor", "gap",   "gap"  ]
        ],
        "heights": [
            [0, 0, 1, 1, 1],
            [0, 1, 1, 0, 1],
            [1, 1, 0, 0, 1],
            [1, 0, 0, 0, 1],
            [1, 1, 1, 0, 0]
        ],
        "start": { "cell": { "row": 4, "column": 2 }, "facing": "west" },
        "goal": { "row": 3, "column": 4 },
        "optimalSteps": 20
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 3;
