/*
 * El puzle del nivel 1, rediseñado por el usuario el 11-sep-2026 después de
 * verlo jugándose: el camino pasa a leerse **en vertical** en la pantalla y gana
 * una casilla. Dos frases suyas, y ninguna es de forma: «añade una columna más,
 * que se ve más corto de lo que pensé» y «no está mal, sólo que está en
 * horizontal y lo quiero vertical».
 *
 * ES UNA MIGRACIÓN NUEVA Y NO UNA CORRECCIÓN DE LA 0023. Aquélla está aplicada,
 * y una migración aplicada no se edita: el repositorio dejaría de describir un
 * esquema que la base ha tenido de verdad.
 *
 * Toca UNA sola columna, `validation_rules`, porque es lo único que cambia. El
 * título, el slug, la descripción y la narrativa siguen valiendo —«Siempre
 * adelante» y «Pon los bloques avanzar en el lienzo para mover al personaje» no
 * dicen nada de la orientación—, el sobre de partida sigue vacío y `xp_reward`
 * ya lo igualó la 0023 en los nueve niveles.
 *
 * La fila se localiza igual que entonces, por `(world_id, sort_order)`, que es
 * lo único que no ha cambiado nunca de esta fila.
 */

/*
 * EL PUZLE, resuelto a mano antes de sembrarlo: nadie comprueba `optimalSteps` y
 * de él sale la puntuación (contrato §4.2).
 *
 * Las filas van de NORTE a SUR y las columnas de oeste a este, así que una sola
 * columna de cinco filas es un camino que se recorre **hacia el fondo de la
 * pantalla**: eso es lo que lo hace vertical, y no un giro de la cámara.
 *
 *          ┌─────────┐
 *        N │  META   │   fila 0
 *          │    .    │   fila 1
 *          │    .    │   fila 2
 *          │    .    │   fila 3
 *        S │ SALIDA  │   fila 4
 *          └─────────┘
 *
 * La salida va al SUR mirando al norte, o sea en el extremo más cercano al niño
 * caminando hacia el fondo. Es la misma disposición que la rejilla de pega del
 * J2, que es contra la que se encuadró la cámara, y deja al personaje en la
 * parte de la pantalla donde primero cae la vista.
 *
 * La mejor solución es `avanzar 4` —cuatro pasos, uno por casilla recorrida—, y
 * cuatro `avanzar 1` cuestan lo mismo: los pasos se cuentan por casillas y no
 * por bloques (§4.4). Por debajo de cuatro no hay programa posible: de la fila 4
 * a la 0 hay cuatro casillas y ningún giro que ahorrar. Así que el número ni
 * deja el 100 fuera del alcance de nadie ni se puede batir.
 *
 * Sigue siendo un camino recto y sin giros, que es lo que pide el primer nivel
 * de quien no ha jugado nunca: lo único que cambia es por dónde se lee.
 */
update public.levels
set validation_rules = '{
        "tiles": [
            ["floor"],
            ["floor"],
            ["floor"],
            ["floor"],
            ["floor"]
        ],
        "start": { "cell": { "row": 4, "column": 0 }, "facing": "north" },
        "goal": { "row": 0, "column": 0 },
        "optimalSteps": 4
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 1;
