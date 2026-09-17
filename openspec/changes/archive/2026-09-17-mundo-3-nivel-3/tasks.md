## 1. La migración y los tests

- [x] 1.1 Escribir `supabase/migrations/202606030031_world_3_level_3.sql`: un `update` sobre `costa-de-bugs` por `(world_id, sort_order)`, con el tablero y los textos de `design.md`, `grid-blockly-2`, sobre vacío, salida mirando al este y `stepLimit` = `optimalSteps` = 13. Verificación: sin `insert`, con `where`, sin tocar `xp_reward` ni `difficulty`, matrices de 5 × 5 alineadas.
- [x] 1.2 Añadir el nivel a `apps/web/src/game/levelConfig.test.ts` leyéndolo de la 0031, y hacer que el caso del `stepLimit` cubra los tres del mundo. Verificación: `npm run test:run -w @codeplay/web` en verde.
- [x] 1.3 Añadir el nivel a `apps/web/src/game/levelSolutions.test.ts` con su solución resuelta a mano. Verificación: llega a la meta con 13 pasos y la búsqueda no encuentra nada más corto.
- [x] 1.4 Comprobar que `optimalSteps` **cae con ±1**: cambiarlo a 12 y a 14 en el `.sql`, ejecutar y restaurar en UTF-8 sin BOM comparando el hash. Verificación: los dos fallan y el archivo queda byte a byte igual.

## 2. La 0031, aplicada

- [x] 2.1 Medir la fila 3 de `costa-de-bugs` en la base y contarle al usuario en palabras qué cambia y a qué valores. Verificación: el usuario da el visto bueno antes de lanzar nada.
- [x] 2.2 **El usuario lanza `npx supabase db push`.** Verificación: la 0031 aparece aplicada en `npx supabase migration list`.

## 3. El retoque de una altura, en la 0032

- [x] 3.1 Medir qué le pasa al nivel con el cambio que pide el usuario, y con las alternativas de un bloque, antes de escribir nada: pasos mínimos, caminos óptimos y recorridos posibles. Verificación: el usuario elige con los números delante.
- [x] 3.2 Escribir `supabase/migrations/202606030032_world_3_level_3_retune.sql`: un `update` que reescriba la fila entera con la altura nueva y `optimalSteps` = `stepLimit` = 14. **La 0031 no se edita.** Verificación: sin `insert`, con `where`, sin tocar `xp_reward` ni `difficulty`.
- [x] 3.3 Apuntar los dos tests a la 0032 y actualizar alturas, pasos y la solución resuelta a mano. Verificación: `npm run test:run -w @codeplay/web` en verde.
- [x] 3.4 Comprobar que el 14 **cae con ±1**: probar 13 y 15 y restaurar en UTF-8 sin BOM comparando el hash. Verificación: los dos fallan y el archivo queda byte a byte igual.
- [x] 3.5 **El usuario lanza `npx supabase db push`.** Verificación: la 0032 aparece aplicada en `npx supabase migration list`.
- [x] 3.6 Releer la fila y compararla campo a campo con el `.sql` de la 0032. Verificación: las siete columnas coinciden y `xp_reward` no cambió.
- [x] 3.7 Jugar el nivel desde la lista del mundo 3. Verificación: termina con «¡Perfecto!» y el contador clavado en 0, y un programa de más se queda sin pasos.

## 4. Cierre

- [x] 4.1 **Cerrar `docs/CONTEXT.md` §4.2b**: los nueve niveles sembrados, la deuda resuelta. Y actualizar `docs/ROADMAP-JUEGO.md` (J12.7 y el J12 entero), `supabase/README.md` y `openspec/config.yaml`. Verificación: `npx openspec doctor` sin errores.
- [x] 4.2 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz y enseñar la salida cruda. Verificación: los tres pasan, lint con cero avisos.
- [x] 4.3 Commit con las rutas enumeradas y el cambio de OpenSpec archivado dentro, con permiso del usuario. Verificación: `git status` limpio y un solo commit.

## 5. Lo que se va a otra sesión

- [x] 5.1 Escribir el encargo para la sesión siguiente, **cuando el usuario lo pida**: el **J9** —mandar el intento, con `attemptsService.createAttempt` ya escrito y sin usar— y **el paso del coyote** en las bajadas. **Vive en la conversación, no en el repositorio**: es un encargo para pegar en una sesión nueva, no un artefacto del proyecto. Verificación: el encargo nombra las dos cosas y no da por sabido nada que esa sesión no pueda leer de los documentos.
