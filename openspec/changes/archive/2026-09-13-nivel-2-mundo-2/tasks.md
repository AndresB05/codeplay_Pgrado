## 1. La migración y los tests

- [x] 1.1 Escribir `supabase/migrations/202606030028_seed_level_2_world_2.sql`: `update` de `cordillera-binaria` con `sort_order = 2`, slug, título, descripción y narrativa de `design.md`, `grid-blockly-2`, sobre vacío y el tablero con alturas —salida `{4,0}` al norte, meta `{0,1}`, `optimalSteps` 15—. Verificación: sin `insert`, con `where`, matrices de 5 × 5 alineadas. **Se reescribió dos veces antes de ningún `push`**: primero apuntaba al nivel 1 y el usuario lo movió al 2; y llevaba 17 pasos hasta que la búsqueda del mínimo encontró 15.
- [x] 1.2 `levelConfig.test.ts` acepta el `config` de la 0028 y `levelSolutions.test.ts` lo añade con su solución. Verificación: pasan, y con 14 y 16 en el `.sql` caen. **Medido:** suite entera 229 tests en verde; con 14 y con 16 caen 3 tests en cada caso y el archivo se restauró byte a byte.

## 2. El tablero ya enseñado

- [x] 2.1 El tablero se montó en el laboratorio durante `salto-y-alturas` y **el usuario lo jugó** antes de pedir sembrarlo. Verificación: lo dijo el 13-sep-2026.

## 3. La parada del SQL y la siembra

- [x] 3.1 Medir la fila antes del `push` y la lista de migraciones pendientes. Verificación: **medido** —una sola fila con `sort_order` 2 en `cordillera-binaria`, `b5683cd0-bfd4-4f46-be67-38a6e3d35888`, `mochila-de-datos`, «Mochila de Datos», `javascript`, `updated_at` `2026-09-11T18:36:58`; pendientes sólo la 0027 y la 0028—.
- [x] 3.2 Contarle al usuario la 0027 y la 0028 en palabras y **que él lance `npx supabase db push`**. Verificación: el usuario lo dice. **Lo lanzó** el 13-sep-2026; después, la fila `b5683cd0…` es `salta-y-sube` con la narrativa nueva, `grid-blockly-2`, las alturas del mapa y `optimalSteps` 15, `updated_at` `2026-09-13T23:59:11`, y las filas 1 y 3 del mundo 2 conservan el suyo. `migration list` da la 0028 aplicada.
- [x] 3.3 Releer las filas y jugar el nivel en su pantalla. Verificación: «¡Perfecto! Llegaste a la meta con 15 pasos, justo lo que cuesta la mejor solución». **Hecho a medias, y se dice**: la fila está releída —ver 3.2— y la pantalla **carga el nivel**, con su título, las instrucciones nuevas, 12 columnas y 25 cubos, y el personaje en la salida; el tablero cabe con 73 px de aire sobre la bandeja. **El recorrido de 15 pasos NO se jugó en esta pantalla**: el panel del navegador de la sesión estaba oculto. Lo jugó el usuario en el laboratorio antes de sembrarlo —por el camino que él eligió— y los 15 los confirma `levelSolutions.test.ts`.

## 4. Documentación y cierre

- [x] 4.1 `supabase/README.md`, `docs/CONTEXT.md` (§1.3, §2.7, §4.2b: quedan cinco), `docs/ROADMAP-JUEGO.md` (J12.2) y `openspec/config.yaml`. Verificación: ningún recuento viejo en pie y `npx openspec doctor` sin quejas.
- [x] 4.2 `npm run lint`, `npm run test:run` y `npm run build`, con la salida cruda. Verificación: todo en verde. **Medido** en la misma pasada que `salto-y-alturas`: lint sin avisos, 229 tests, build en 11,37 s.
- [x] 4.3 Commit enumerando las rutas, con autorización del usuario. **Autorizado el 13-sep-2026** en un solo commit con `salto-y-alturas`, con los dos archivados dentro.
