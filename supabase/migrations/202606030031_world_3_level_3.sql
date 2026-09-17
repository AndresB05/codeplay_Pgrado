/*
 * El nivel 3 de la Costa de Bugs, el último de los nueve. Cierra el J12 y con él
 * la lista de puzles sin diseñar: desde esta migración los NUEVE niveles se
 * juegan desde su fila. La 0030 sembró el 1 y el 2; éste llega aparte porque el
 * usuario lo diseñó un día después y no quiso esperar para los otros dos.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema: ninguna columna cambia, así que
 * `database.types.ts` NO se regenera. La fila se localiza por `(world_id,
 * sort_order)`, y no toca `xp_reward` ni `difficulty`.
 *
 * Un solo `update`, así que no hay orden que cuidar. `muchos-caminos` no choca
 * con ningún slug del mundo —ni con el `tormenta-final` que reemplaza, ni con
 * `dos-caminos` ni con `el-faro`—, de modo que `levels_world_slug_unique` (0003)
 * no puede saltar.
 *
 * LA DIFICULTAD DE ESTE MUNDO SE MIDE EN CAMINOS, NO EN PASOS, y lo fijó el
 * usuario el 17-sep-2026 al ver este tablero medido: «el punto de la dificultad
 * de este mundo no es la cantidad de pasos, sino de caminos, complicando al
 * usuario tomar decisiones sobre qué camino es más eficiente y correcto». Por eso
 * este nivel cuesta 13 y el 2 diecisiete, y no es un error de progresión: éste
 * tiene CUATRO caminos óptimos —el que más de los tres— y el 2 sólo dos.
 *
 * Filas de NORTE a SUR y columnas de oeste a este. El usuario dio los mapas
 * girados respecto al boceto por cuarta vez —su fila de arriba era el borde
 * oeste—, se confirmaron con el norte arriba y se le enseñó el tablero montado en
 * el motor antes de escribir esto. Confirmó las alturas y el aspecto.
 */

/*
 * Una colina compacta: la esquina noroeste y el borde norte están vacíos, y
 * también la esquina noreste. La salida en la esquina suroeste a altura 1, y la
 * meta en el borde norte —la cuarta casilla desde el oeste— a altura 4, a la que
 * sólo se entra desde la casilla de altura 3 que tiene al sur. Hay otra columna
 * de altura 4 suelta, en el borde oeste del segundo escalón, que no lleva a nada.
 *
 * LA SALIDA MIRA AL ESTE, y ahí la casilla de delante está un escalón MÁS ALTA:
 * andando no se sube, así que el primer «avanzar» choca. Es decisión del usuario
 * —«gira al personaje, que esté mirando hacia la otra salida»— y es lo que hace
 * el nivel: mirando al norte el mínimo era 12 con dos caminos óptimos; mirando al
 * este es 13 con CUATRO, porque el giro de arranque se puede pagar en sitios
 * distintos y ninguno sale más barato.
 *
 *            O              E
 *        N   ·  ·  ·  4M ·       fila 0
 *            ·  4  3  3  3       fila 1
 *            2  2  2  3  2       fila 2
 *            1  2  3  3  1       fila 3
 *        S   1S 2  1  1  1       fila 4
 *
 * Uno de los cuatro caminos de 13 pasos:
 *
 *   girar a la izquierda        1   mira al norte
 *   avanzar 1                   1   → fila 3, columna 0
 *   saltar [ avanzar 1 ]        2   → altura 2, fila 2
 *   girar a la derecha          1   mira al este
 *   avanzar 2                   2   → fila 2, columna 2
 *   saltar [ avanzar 1 ]        2   → altura 3, columna 3
 *   girar a la izquierda        1   mira al norte
 *   avanzar 1                   1   → fila 1, columna 3
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
            [2, 2, 2, 3, 2],
            [1, 2, 3, 3, 1],
            [1, 2, 1, 1, 1]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "east" },
        "goal": { "row": 0, "column": 3 },
        "optimalSteps": 13,
        "stepLimit": 13
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'costa-de-bugs')
  and sort_order = 3;
