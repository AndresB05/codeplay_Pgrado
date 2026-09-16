## 1. La migración y los tests

- [x] 1.1 Escribir `supabase/migrations/202606030030_world_3_levels_1_2.sql`: dos `update` sobre `costa-de-bugs` localizados por `(world_id, sort_order)`, con los tableros y los textos de `design.md`, `grid-blockly-2`, sobre vacío y `stepLimit` igual a `optimalSteps`. Verificación: sin `insert`, con `where`, sin tocar `xp_reward`, matrices de 5 × 5 alineadas y el nivel 3 sin mencionar.
- [x] 1.2 Añadir los dos niveles a `apps/web/src/game/levelConfig.test.ts` leyéndolos de la 0030: forma, alturas, salida, meta, `optimalSteps` y `stepLimit`. Verificación: `npm run test:run -w @codeplay/web` en verde.
- [x] 1.3 Añadir los dos a `apps/web/src/game/levelSolutions.test.ts` con su solución resuelta a mano. Verificación: las dos llegan a la meta con los pasos sembrados y la búsqueda no encuentra nada más corto.
- [x] 1.4 Comprobar que `optimalSteps` **cae con ±1** en los dos niveles: cambiar el número en el `.sql`, ejecutar el test y restaurar leyendo y escribiendo en UTF-8 sin BOM, comparando el hash. Verificación: los dos fallan con 9/11 y con 16/18, y el archivo queda byte a byte igual.

## 2. Contárselo antes del push

- [x] 2.1 Medir las dos filas de `costa-de-bugs` en la base con `npx supabase migration list` y lo que haga falta, y contarle al usuario **en palabras** qué fila cambia y a qué valores. Verificación: el usuario da el visto bueno antes de lanzar nada.
- [x] 2.2 **El usuario lanza `npx supabase db push`.** Verificación: la migración aparece aplicada en `npx supabase migration list`.
- [x] 2.3 Releer las dos filas y compararlas campo a campo con el `.sql`. Verificación: slug, título, descripción, narrativa, lenguaje, `starter_code` y `validation_rules` coinciden, y `xp_reward` no cambió.
- [x] 2.4 Jugar los dos niveles desde la lista del mundo 3 en el navegador y comprobar el contador en cuenta atrás, la solución óptima y el congelado al pasarse. Verificación: los dos terminan con «¡Perfecto!» y un programa de más se queda sin pasos.

## 3. Cierre

- [x] 3.1 Actualizar `docs/CONTEXT.md` §4.2b —dos de los tres del mundo 3 sembrados, el tercero pendiente y por qué—, `docs/ROADMAP-JUEGO.md` (J12.5 y J12.6), `supabase/README.md` y `openspec/config.yaml`. Verificación: `npx openspec doctor` sin errores.
- [x] 3.2 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz y enseñar la salida cruda. Verificación: los tres pasan, lint con cero avisos.
- [x] 3.3 Commit con las rutas enumeradas y el cambio de OpenSpec archivado dentro, con permiso del usuario. Verificación: `git status` limpio y un solo commit.
