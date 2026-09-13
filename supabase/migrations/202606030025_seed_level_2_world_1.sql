/*
 * El nivel 2 del mundo 1, rediseñado: el segundo de los nueve puzles del juego
 * de bloques y el primero con giros. Hasta hoy la fila era «Puente Condicional»,
 * del juego anterior —el de escribir JavaScript—, y además pedía una condición,
 * que rompe el recuento de pasos (DISENO-DEL-JUEGO.md §3).
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema, igual que la 0023: ninguna columna
 * cambia, así que `database.types.ts` NO se regenera.
 *
 * LA FILA SE LOCALIZA POR (world_id, sort_order) Y NO POR SLUG, por lo mismo que
 * la 0023: el slug es lo que cambia, y por `puente-condicional` no se
 * encontraría la segunda vez ni por `camino-con-curvas` la primera.
 *
 * No toca `xp_reward`: la 0023 ya igualó los nueve a 100.
 */

/*
 * EL PUZLE, diseñado por el usuario sobre un boceto el 13-sep-2026 y resuelto a
 * mano antes de sembrarlo: nadie comprueba `optimalSteps` y de él sale la
 * puntuación (contrato §4.2). Desde este nivel lo comprueba además
 * `levelSolutions.test.ts`, que lee este mismo archivo.
 *
 * Filas de NORTE a SUR y columnas de oeste a este. Visto desde la cámara de
 * partida —al sureste— es el boceto tal cual: la salida a la izquierda y la
 * meta en la esquina derecha.
 *
 *            O              E
 *        N   ·  ·  ■  ■  M       fila 0
 *            ·  ·  ■  ·  ·       fila 1
 *            ·  ·  ■  ·  ·       fila 2
 *            S  ·  ■  ·  ·       fila 3
 *        S   ■  ■  ■  ·  ·       fila 4
 *
 * UN SOLO CAMINO de diez casillas en zigzag, y todo lo demás es HUECO: la base
 * plana del boceto es una referencia de dibujo, no suelo. Los huecos se escriben
 * `'gap'` y no recortando filas, porque el tablero es rectangular (§4.2).
 *
 * LA SALIDA MIRA AL SUR, por la regla del usuario: el personaje empieza mirando
 * hacia la única casilla vecina a la que llega con un `avanzar` sin chocar.
 *
 * La mejor solución, 12 pasos:
 *
 *   avanzar 1               1   → fila 4, columna 0
 *   girar a la izquierda    1   mira al este
 *   avanzar 2               2   → fila 4, columna 2
 *   girar a la izquierda    1   mira al norte
 *   avanzar 4               4   → fila 0, columna 2
 *   girar a la derecha      1   mira al este
 *   avanzar 2               2   → fila 0, columna 4: la meta
 *
 * Por debajo de 12 no hay programa posible: el camino es único, hay que recorrer
 * sus nueve casillas y cambiar de dirección tres veces, y cada cambio es de 90° y
 * cuesta un giro. `avanzar 4` cuesta lo mismo que cuatro `avanzar 1` (§4.4), que
 * es justo el truco que cuenta la narrativa.
 */
update public.levels
set slug = 'camino-con-curvas',
    title = 'Nivel 2 - Camino con curvas',
    description = 'Avanza y gira para seguir el camino hasta la meta.',
    narrative = 'Usa avanzar y los giros para seguir el camino hasta la meta. ¡Truco! Puedes cambiar el número del bloque avanzar: en vez de poner cuatro bloques de avanzar 1, pon uno solo con el número 4.',
    programming_language = 'grid-blockly-1',
    starter_code = '{"formatVersion":"grid-blockly-1","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "gap",   "floor", "floor", "floor"],
            ["gap",   "gap",   "floor", "gap",   "gap"  ],
            ["gap",   "gap",   "floor", "gap",   "gap"  ],
            ["floor", "gap",   "floor", "gap",   "gap"  ],
            ["floor", "floor", "floor", "gap",   "gap"  ]
        ],
        "start": { "cell": { "row": 3, "column": 0 }, "facing": "south" },
        "goal": { "row": 0, "column": 4 },
        "optimalSteps": 12
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 2;
