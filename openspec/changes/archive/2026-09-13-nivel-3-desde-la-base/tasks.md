## 1. La migración, escrita y sin aplicar

- [x] 1.1 Escribir `supabase/migrations/202606030026_seed_level_3_world_1.sql`: un `update` de la fila de `selva-algoritmica` con `sort_order = 3`, con slug, título, descripción y narrativa de `design.md`, `grid-blockly-1`, sobre vacío y el tablero 5 × 5 —salida `{4,2}` al oeste, meta `{3,4}`, `optimalSteps` 20—. Verificación: sin `insert`, sin `update` sin `where`, matriz de 5 filas de 5.

## 2. Los tests

- [x] 2.1 `apps/web/src/game/levelConfig.test.ts` acepta el `config` del nivel 3 leído de la 0026. Verificación: `npm run test:run` pasa.
- [x] 2.2 `apps/web/src/game/levelSolutions.test.ts` añade el nivel 3 con su solución de 15 bloques. Verificación: pasa, y con `optimalSteps` 19 y 21 en el `.sql` cae —deshecho y comprobado byte a byte—. **Medido:** 25 tests en verde con 20; con 19 y con 21 caen los dos del nivel 3, y el archivo restaurado es idéntico byte a byte.

## 3. Enseñar el tablero antes de sembrar

- [x] 3.1 **Temporal.** El laboratorio monta el `config` de la 0026. Verificación: la escena tiene 14 cubos.
- [x] 3.2 Jugar la solución en el laboratorio con las trampas del §4.10 delante. Verificación: el personaje, leído de la escena, pisa las 14 casillas en orden hasta la meta, con «Pasos: 20» y «¡Perfecto!». **Medido** con 73 frames y `hidden: false`, el `<pre>` con `codeplay_advance` antes de ejecutar: salida en fila 4 columna 2 mirando al oeste, las 14 casillas en el orden del camino y «¡Perfecto! Llegaste a la meta con 20 pasos, justo lo que cuesta la mejor solución.»
- [x] 3.3 Captura con la vista de hoy, a disco, verificada y mandada al usuario, con el texto de la tarjeta y de «Instrucciones». Verificación: el usuario da tablero y texto por buenos. **Los dio por buenos lanzando el `push`** el 13-sep-2026.
- [x] 3.4 Revertir el laboratorio a `debugLevel` y borrar la captura y el receptor. Verificación: `git diff` del laboratorio sale vacío. **Medido:** el diff sale vacío, el receptor está parado y el directorio temporal quedó con cero elementos.

## 4. La parada del SQL y la siembra

- [x] 4.1 Medir la fila del nivel 3 antes del `push`, y comprobar con `npx supabase migration list` que la 0026 es la única pendiente. Verificación: una sola fila casa y es la de la 0012. **Medido el 13-sep-2026:** una sola fila con `sort_order` 3, id `a8b8fe9b-3d10-40f5-971f-d073d5a47a08`, slug `ciclo-del-rio`, «Ciclo del Río», `javascript`, `{"goal":"repeat_pattern","requiresLoop":true}`, `xp_reward` 100, `updated_at` `2026-09-11T18:36:58.232779+00:00`. Los niveles 1 y 2 están en `2026-09-11T22:59:43` y `2026-09-13T22:08:35`. `migration list`: 0024 y 0025 aplicadas, **0026 pendiente y única**.
- [x] 4.2 **Parar**, contar al usuario en palabras qué fila toca y con qué valores, y **que él lance `npx supabase db push`**. Verificación: el usuario lo dice.
- [x] 4.3 Releer la fila después del `push` y compararla con 4.1. Verificación: los campos son los de la 0026 y las filas de los niveles 1 y 2 conservan su `updated_at`. **Medido:** la fila `a8b8fe9b…` pasa a `la-escalera`, título, descripción y narrativa nuevos, `grid-blockly-1`, sobre vacío y el tablero con `optimalSteps` 20; `updated_at` de `2026-09-11T18:36:58` a `2026-09-13T22:25:23`. Niveles 1 y 2 con el mismo `updated_at` que en 4.1. `migration list` da la 0026 aplicada.
- [x] 4.4 Jugar el nivel 3 en su pantalla, entrando desde la lista. Verificación: personaje en la meta leído de la escena y «¡Perfecto! Llegaste a la meta con 20 pasos, justo lo que cuesta la mejor solución». **Medido** con 73 frames y `hidden: false`: la lista enseña los tres niveles del mundo 1 con sus títulos nuevos; la pantalla, 14 cubos, la narrativa con «¡Ojo con la escalera!» y el personaje en fila 4 columna 2 mirando al oeste. El editor de esa pantalla publicó —se fue el texto del lienzo vacío y no salió «No hay bloques que ejecutar»— y el recorrido pisó las 14 casillas en orden hasta la meta, con «Pasos: 20» y la frase de arriba literal.

## 5. Documentación y cierre

- [x] 5.1 `supabase/README.md`: la entrada de la 0026 y «veinticinco» a veintiséis. Verificación: la lista llega a la 26.
- [x] 5.2 `docs/CONTEXT.md`: §1.3 y §2.7 con 26 migraciones y la fila de la tabla; §4.2b con **seis** pendientes, releyendo cada frase. Verificación: ningún recuento viejo sigue en pie.
- [x] 5.3 `docs/ROADMAP-JUEGO.md` §3: J7.3 hecho y **J7 cerrado**. Verificación: las dos filas dicen ✅.
- [x] 5.4 `openspec/config.yaml`: recuento de migraciones y la prioridad 4 con los tres niveles del mundo 1. Verificación: `npx openspec doctor` no se queja.
- [x] 5.5 `npm run lint`, `npm run test:run` y `npm run build`, con la salida cruda. Verificación: lint sin avisos, ningún test roto, build termina. **Medido:** lint sin salida de avisos; `Test Files 21 passed (21)`, `Tests 194 passed (194)`; `✓ built in 9.90s` con los mismos tamaños de trozo que tras el J7.2 (635,48 / 648,51 / 849,42 kB); `openspec doctor` con la raíz en `ok` y el cambio válido en `--strict`.
- [x] 5.6 Commit enumerando las rutas, con autorización del usuario. Verificación: `git status` enseña sólo lo de este cambio. **Autorizado por el usuario el 13-sep-2026**, en un solo commit con el cambio ya archivado dentro.
