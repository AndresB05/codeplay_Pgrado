/*
 * El nivel 1 del mundo 1, rediseñado: el primero de los nueve puzles del juego
 * de bloques. Hasta hoy las nueve filas eran del concepto anterior —el de
 * escribir JavaScript— y ninguna tenía rejilla, salida, meta ni pasos óptimos:
 * existían los títulos, no los puzles. Ver docs/CONTEXT.md §4.2b.
 *
 * ES UNA MIGRACIÓN DE DATOS, no de esquema: ninguna columna se añade, se
 * renombra ni cambia de tipo, así que `database.types.ts` NO se regenera.
 *
 * Las tres columnas van reinterpretadas, decidido en el paso 23.1 (CONTEXT
 * §2.7): `validation_rules` lleva la definición del puzle, `starter_code` la
 * disposición inicial de bloques y `programming_language` la versión del
 * formato de serialización —de ahí `grid-blockly-1` y no `javascript`—. El
 * esquema se diseñó para un editor de código en el navegador; con bloques sigue
 * habiendo programa, así que ninguna columna sobra y ninguna hace falta.
 *
 * LA FILA SE LOCALIZA POR (world_id, sort_order) Y NO POR SLUG, porque el slug
 * es justo lo que cambia: `ruta-del-colibri` es el nombre del juego anterior, y
 * una migración aplicada no se edita, así que si no se cambia aquí lo arrastra
 * para siempre. Buscar por el slug viejo dejaría de encontrar la fila en cuanto
 * esto se ejecutara una vez, y por el nuevo no la encontraría la primera. La
 * pareja sobrevive al cambio y tiene índice único propio
 * (`levels_world_sort_order_unique`, migración 0003), así que identifica una
 * fila y sólo una.
 *
 * No lleva `insert`: las nueve filas ya existen desde la 0012. Y es repetible
 * —los `update` escriben valores fijos—, con una salvedad honesta: el
 * disparador `handle_levels_updated_at` de la 0003 mueve `updated_at` en cada
 * pasada aunque el contenido sea idéntico.
 */

/*
 * EL PUZLE, diseñado por el usuario y resuelto a mano antes de sembrarlo, como
 * exige el contrato §4.2: nadie comprueba `optimalSteps` y de él sale la
 * puntuación.
 *
 *            O                       E
 *          ┌───────────────────────────┐
 *        N │ SALIDA  .     .    META   │
 *          └───────────────────────────┘
 *
 * Una sola fila de cuatro casillas, el personaje en un extremo mirando al otro
 * y la meta en la cuarta: camino recto y sin giros, que es la introducción a la
 * jugabilidad para quien no ha jugado nunca.
 *
 * La mejor solución es `avanzar 3` —tres pasos, uno por casilla recorrida—, y
 * tres `avanzar 1` cuestan lo mismo: los pasos se cuentan por casillas y no por
 * bloques (§4.4). Por debajo de tres no hay programa posible: de la columna 0 a
 * la 3 hay tres casillas y ningún giro que ahorrar. Así que el número ni deja
 * el 100 fuera del alcance de nadie ni se puede batir.
 *
 * Las columnas van de oeste a este, así que salir de la columna 0 mirando al
 * otro extremo es `east`. La matriz se escribe entera y alineada: el tablero es
 * rectangular y un hueco se escribiría `'gap'`, nunca acortando una fila —aquí
 * no hay ninguno, pero la regla decide cómo se escribe—.
 */
update public.levels
set slug = 'siempre-adelante',
    title = 'Nivel 1 - Siempre adelante',
    description = 'Avanza en línea recta hasta la meta.',
    narrative = 'Pon los bloques avanzar en el lienzo para mover al personaje.',
    programming_language = 'grid-blockly-1',
    starter_code = '{"formatVersion":"grid-blockly-1","workspace":{}}',
    validation_rules = '{
        "tiles": [
            ["floor", "floor", "floor", "floor"]
        ],
        "start": { "cell": { "row": 0, "column": 0 }, "facing": "east" },
        "goal": { "row": 0, "column": 3 },
        "optimalSteps": 3
    }'::jsonb
where world_id = (select id from public.worlds where slug = 'selva-algoritmica')
  and sort_order = 1;

/*
 * El lienzo arranca VACÍO, y el sobre de arriba lo dice sin ambigüedad: `{}` es
 * lo que Blockly serializa para un espacio de trabajo sin bloques, y el §7 lo
 * llama «sin programa de partida», que es un nivel perfectamente normal. No es
 * el valor por defecto de la columna —la cadena vacía—, que no es una instancia
 * válida de nada.
 */

/*
 * LA EXPERIENCIA, IGUAL EN LOS NUEVE. Hoy están sembrados con nueve cifras
 * distintas —100, 120 y 140 en la Selva; 180, 200 y 240 en la Cordillera; 150,
 * 210 y 260 en la Costa—, heredadas de cuando la dificultad se premiaba con más
 * XP. Lo que distingue un nivel difícil de uno fácil es la puntuación que se
 * saca en él, que sale de los pasos, no un premio mayor por terminarlo.
 *
 * Va sin `where` a propósito: son los nueve, y escribir el mismo 100 sobre el
 * que ya lo tiene no cambia nada.
 */
update public.levels
set xp_reward = 100;
