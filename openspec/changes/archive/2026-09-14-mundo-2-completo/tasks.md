## 1. La migración y los tests

- [x] 1.1 Escribir `supabase/migrations/202606030029_world_2_levels.sql`: tres `update` de `cordillera-binaria` —el 2 antes que el 1 por el slug—, con los textos de `design.md`, `grid-blockly-2`, sobre vacío y los tableros confirmados. Verificación: sin `insert`, con `where`, matrices de 5 × 5 alineadas.
- [x] 1.2 `levelConfig.test.ts` y `levelSolutions.test.ts` leen los tres niveles de la 0029. Verificación: pasan, y con ±1 en el `.sql` caen. **Medido:** 42 tests en verde en los dos archivos; con 24 y 26 en el nivel 2, y con 22 y 24 en el 3, caen 3 tests en cada caso, y el archivo se restauró con el mismo hash.

## 2. Enseñar los tableros

- [x] 2.1 Montar los niveles 2 y 3 en el laboratorio de forma temporal, jugar sus soluciones y enseñárselos al usuario. Verificación: el personaje llega a la meta con 25 y 23; el usuario los da por buenos. Revertir antes del commit. **Medido:** con `?nivel=2` y `?nivel=3` en el laboratorio, las dos soluciones cargadas en el editor dan «¡Perfecto! Llegaste a la meta con 25 pasos» y «… con 23 pasos». El usuario confirmó los mapas y lanzó el `push`; **no consta que los jugara en el laboratorio**. Revertido antes del commit.

## 3. La parada del SQL y la siembra

- [x] 3.1 Medir las tres filas del mundo 2 y la lista de migraciones pendientes antes del `push`. **Medido:** `sort_order` 1 `871fb0f8…` `eco-de-funciones` («Eco de Funciones», `javascript`, `updated_at` `2026-09-11T18:36:58`); 2 `b5683cd0…` `salta-y-sube` («Nivel 2 - Salta y sube», `grid-blockly-2`, `2026-09-13T23:59:11`); 3 `6cb31f58…` `sendero-recursivo` («Sendero Recursivo», `javascript`, `2026-09-11T18:36:58`). `migration list`: aplicadas hasta la 0028; la 0029 es la única pendiente.
- [x] 3.2 Contarle al usuario la 0029 en palabras y **que él lance `npx supabase db push`**. **Lo lanzó** el 14-sep-2026; `migration list` da la 0029 aplicada. Las tres filas conservan su `id` y cambian a la vez, `updated_at` `2026-09-14T13:26:30`: 1 `871fb0f8…` `salta-y-sube`, 2 `b5683cd0…` `el-gran-rodeo`, 3 `6cb31f58…` `la-torre`, las tres en `grid-blockly-2` con el sobre vacío y `xp_reward` 100. Comparadas campo a campo con la 0029 —`validation_rules` entero, slug, título, descripción y narrativa—: coinciden las tres.
- [x] 3.3 Releer las filas, compararlas con lo medido y jugar los niveles en su pantalla. **Medido:** filas releídas —ver 3.2—, y los tres niveles jugados en `/dashboard/worlds/:worldId/:levelId`, cada uno abierto de cero, con su solución cargada en el editor: «Nivel 1 - Salta y sube», «¡Perfecto! Llegaste a la meta con 15 pasos»; «Nivel 2 - El gran rodeo», «… con 25 pasos»; «Nivel 3 - La torre», «… con 23 pasos». Un primer intento del 3 leyó el personaje de la pantalla anterior y no valió; se repitió abriéndolo de cero.

## 4. Documentación y cierre

- [x] 4.1 `supabase/README.md` (entrada 29, «veintinueve»), `docs/CONTEXT.md` (árbol, §2 backend con 29 migraciones y su fila, §4.2b: quedan tres), `docs/ROADMAP-JUEGO.md` (J12.1 a J12.3) y `openspec/config.yaml` (árbol y prioridad 4). Verificación: ningún recuento viejo en pie y `npx openspec doctor` sin quejas. **Medido:** `doctor` da «OpenSpec root: ok».
- [x] 4.2 `npm run lint`, `npm run test:run` y `npm run build`, con la salida cruda. **Medido:** lint sin avisos, 235 tests en 21 archivos, build en 10,74 s. El laboratorio temporal ya estaba revertido.
- [x] 4.3 Commit enumerando las rutas, con autorización del usuario, y archivar el cambio. **Autorizado el 14-sep-2026**, en un solo commit con el cambio archivado dentro.
