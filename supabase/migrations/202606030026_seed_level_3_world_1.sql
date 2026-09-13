/*
 * El nivel 3 del mundo 1, rediseñado: el último de la Selva Algorítmica. Hasta
 * hoy la fila era «Ciclo del Río», del juego anterior, que pedía un bucle. El
 * usuario decidió el 13-sep-2026 que este nivel va SIN «repetir»: se resuelve con
 * los tres bloques de siempre, y ese bloque no existe todavía.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema, igual que la 0023 y la 0025:
 * ninguna columna cambia, así que `database.types.ts` NO se regenera.
 *
 * LA FILA SE LOCALIZA POR (world_id, sort_order) Y NO POR SLUG, por lo mismo que
 * la 0023: el slug es lo que cambia.
 *
 * No toca `xp_reward`: la 0023 ya igualó los nueve a 100.
 */

/*
 * EL PUZLE, diseñado por el usuario sobre un boceto el 13-sep-2026 y resuelto a
 * mano antes de sembrarlo. Lo comprueba además `levelSolutions.test.ts`, que lee
 * este mismo archivo: la solución llega con `optimalSteps` y no hay ninguna más
 * corta.
 *
 * Filas de NORTE a SUR y columnas de oeste a este, con la misma lectura del
 * boceto que el nivel 2: la esquina izquierda del dibujo es la suroeste.
 *
 *            O              E
 *        N   ·  ·  ■  ■  ■       fila 0
 *            ·  ■  ■  ·  ■       fila 1
 *            ■  ■  ·  ·  ■       fila 2
 *            ■  ·  ·  ·  M       fila 3
 *        S   ■  ■  S  ·  ·       fila 4
 *
 * UN SOLO CAMINO de catorce casillas que rodea el tablero, con una ESCALERA en
 * el centro, y todo lo demás es HUECO: la base plana del boceto es una
 * referencia de dibujo. La meta queda cerca de la salida en línea recta, pero
 * separada por huecos: hay que dar la vuelta entera.
 *
 * LA SALIDA MIRA AL OESTE, por la regla del usuario: hacia la única casilla
 * vecina a la que llega con un `avanzar` sin chocar.
 *
 * La mejor solución, 20 pasos:
 *
 *   avanzar 2               2   → fila 4, columna 0
 *   girar a la derecha      1   mira al norte
 *   avanzar 2               2   → fila 2, columna 0
 *   girar a la derecha      1   mira al este
 *   avanzar 1               1   → fila 2, columna 1
 *   girar a la izquierda    1   mira al norte
 *   avanzar 1               1   → fila 1, columna 1
 *   girar a la derecha      1   mira al este
 *   avanzar 1               1   → fila 1, columna 2
 *   girar a la izquierda    1   mira al norte
 *   avanzar 1               1   → fila 0, columna 2
 *   girar a la derecha      1   mira al este
 *   avanzar 2               2   → fila 0, columna 4
 *   girar a la derecha      1   mira al sur
 *   avanzar 3               3   → fila 3, columna 4: la meta
 *
 * Por debajo de 20 no hay programa posible: el camino es único, hay que recorrer
 * sus trece casillas y cambiar de dirección siete veces, y cada cambio es de 90°
 * y cuesta un giro.
 */
update public.levels
set slug = 'la-escalera',
    title = 'Nivel 3 - La escalera',
    description = 'Da la vuelta al tablero y sube la escalera hasta la meta.',
    narrative = 'La meta parece cerca, pero no hay suelo en medio: tienes que dar la vuelta. ¡Ojo con la escalera! Antes de cada giro, fíjate hacia dónde mira el personaje: a veces toca girar a la derecha y a veces a la izquierda.',
    programming_language = 'grid-blockly-1',
    starter_code = '{"formatVersion":"grid-blockly-1","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["gap",   "gap",   "floor", "floor", "floor"],
            ["gap",   "floor", "floor", "gap",   "floor"],
            ["floor", "floor", "gap",   "gap",   "floor"],
            ["floor", "gap",   "gap",   "gap",   "floor"],
            ["floor", "floor", "floor", "gap",   "gap"  ]
        ],
        "start": { "cell": { "row": 4, "column": 2 }, "facing": "west" },
        "goal": { "row": 3, "column": 4 },
        "optimalSteps": 20
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 3;
