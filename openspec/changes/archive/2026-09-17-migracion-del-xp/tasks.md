## 1. Medir antes de tocar nada

- [x] 1.1 Consultar `user_progress`, `level_attempts` y `profiles.total_xp` con la cuenta de `.env`. Verificación: 3 niveles superados con marcas 0, 0 y 90, `total_xp: 300`, 16 intentos con 14 a cero.
- [x] 1.2 Abrir los 16 programas guardados con el lector real del cliente y contar sus pasos. Verificación: los 14 del J9 se leen y coinciden con `metadata.steps`; los 2 del `curl` viejo son ilegibles.
- [x] 1.3 Medir las tres reglas candidatas contra los nueve programas resueltos a mano y sus excesos, comprobando con el intérprete que los excesos siguen superando el nivel. Verificación: la tabla de `design.md`, y en el mundo 3 el éxito sale con el corte del límite puesto.

## 2. La migración

- [x] 2.1 Escribir `supabase/migrations/202606030033_score_by_steps.sql` con la función de recuento sobre el `jsonb` del sobre, replicando `interpreter.ts` orden por orden: montón de `y` menor, cadena por `next.block`, `avanzar N` con entero ≥ 1, salto vacío 1, salto con cuerpo el doble, y `null` ante formato, bloque o anidamiento que no reconozca. Verificación: las comprobaciones de 5.1 contra la base real.
- [x] 2.2 Añadir a la misma migración la puntuación `redondeo(100 × óptimo ÷ pasos)` acotada de 0 a 100, cero sin éxito, cero si el programa es ilegible y cero si el nivel no trae `optimalSteps`. Verificación: 5.1.
- [x] 2.3 Añadir la RPC `submit_level_attempt`, que valida el nivel publicado, guarda el intento con la puntuación calculada, delega el progreso en `upsert_my_progress` y devuelve puntuación, pasos, marca, experiencia concedida y total. Verificación: 5.1.
- [x] 2.4 Cambiar en `upsert_my_progress` la concesión de experiencia a `(marca nueva − marca anterior) × xp_reward ÷ 100`, retirando la que dependía de la transición a completado. Verificación: 5.1 —volver a superar peor suma cero— y que no quede en la base ninguna función que conceda el tope entero.
- [x] 2.5 Añadir el recálculo de las marcas ya existentes y el cuadre de `total_xp` con la suma de marcas y logros. Verificación: en la base de pruebas dos marcas pasan de 0 a 100, la de 90 se queda y `total_xp` pasa de 300 a 290.
- [x] 2.6 Revocar la RPC nueva a `public` y `anon` y concederla a `authenticated`, como las demás de la 0006. Verificación: llamarla con la clave anónima responde `42501`.
- [x] 2.7 Contarle al usuario en palabras qué cambia la migración y esperar su visto bueno; él lanza `npx supabase db push`. Verificación: `npx supabase migration list` muestra la 0033 aplicada.
- [x] 2.8 Pedirle que regenere `apps/web/src/types/database.types.ts` con la CLI. Verificación: el archivo declara `submit_level_attempt` y nadie lo editó a mano.

## 3. El cliente

- [x] 3.1 Escribir `apps/web/src/game/score.ts` con la regla de puntuación y su test, contra los nueve niveles sembrados y los excesos de `design.md`. Verificación: `npm run test:run -w @codeplay/web` en verde.
- [x] 3.2 Añadir a `apps/web/src/services/attempts.service.ts` el envío de la partida por `submit_level_attempt`, devolviendo `{ data, error }` con `AppError` como el resto. Verificación: `npm run build -w @codeplay/web` compila.
- [x] 3.3 Dejar `submitAttempt.ts` en una sola llamada, con la puntuación del cliente entre las observaciones, y que devuelva lo que la ventana tiene que enseñar. Verificación: los casos de 3.4.
- [x] 3.4 Actualizar `submitAttempt.test.ts` a la llamada única: superado, fallado, sin pasos, el sobre entero, las observaciones con pasos y puntuación, y que un fallo del servidor no lance. Verificación: `npm run test:run -w @codeplay/web` en verde.
- [x] 3.5 Guardar en `StudentLevelModule.tsx` lo que devuelve el envío y pasárselo a la ventana, sin esperar por él para abrirla. Verificación: la ventana sale igual con la red caída.
- [x] 3.6 Cambiar `LevelCompleteDialog.tsx` para que enseñe la puntuación de la partida y la experiencia concedida, con su caso de «esta vez no ganaste experiencia» y sin número ninguno si el guardado falló. Verificación: los tres casos se ven jugando en 5.2.

## 4. Documentación

- [x] 4.1 Propagar a `docs/CONTEXT.md` §2.7 —la RPC nueva, la regla, el recálculo y la tabla de lo verificado— y a §3, moviendo lo que este paso cierra. Verificación: ninguna línea de §2.7 sigue diciendo que `score` y `best_score` van a cero.
- [x] 4.2 Actualizar `docs/CONTRATO-DE-INTEGRACION.md` §3, §6 y el apéndice: un mensaje es **una** llamada, la experiencia ya no se concede una sola vez por nivel sino por diferencia de marca, y los dos contadores coinciden. Verificación: el apéndice ya no dice que `attempt_count` no se sincroniza con las filas de intentos.
- [x] 4.3 Escribir la regla elegida en `docs/DISENO-DEL-JUEGO.md` §3, que tenía la marca de agua y no el eslabón de en medio. Verificación: la fórmula y la tabla de lo que da cada nivel están ahí.
- [x] 4.4 Tachar en `docs/ROADMAP.md` §3.2 y en `docs/ROADMAP-JUEGO.md` lo que este paso cierra, dejando el J11 intacto. Verificación: el J10 queda marcado y la barra por tramos sigue pendiente.
- [x] 4.5 Añadir la 0033 a `supabase/README.md` y replicar en `openspec/config.yaml` lo que corresponda. Verificación: `npx openspec doctor` sin errores.

## 5. Verificación contra la base real

- [x] 5.1 Provocar jugando los tres casos, consultando las dos tablas después de cada uno: superar flojo, volver a superar mejor y volver a superar peor. Verificación: las puntuaciones son las que la regla dice, la experiencia concedida es la diferencia de marca y el tercer caso suma **cero**.
- [x] 5.2 Comprobar en la misma sesión que la puntuación del servidor y la del cliente coinciden en `level_attempts.metadata`, y que la ventana enseñó lo que la fila guarda. Verificación: las dos cifras son iguales en las tres partidas.
- [x] 5.3 Comprobar que la experiencia no se concede dos veces con `React.StrictMode` puesto. Verificación: una partida deja una fila de intento, sube `attempt_count` en uno y mueve `total_xp` una sola vez.
- [x] 5.4 Comprobar los bordes del recuento: un programa con bloques sueltos —sólo cuenta el montón que se ejecuta— y un nivel del mundo 3 superado con bloques detrás de la meta. Verificación: la puntuación baja por lo que sobra dentro del montón ejecutado y no por lo de fuera.
- [x] 5.5 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz. Verificación: los tres pasan, lint con cero avisos.
