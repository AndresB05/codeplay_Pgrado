## Why

**El XP se concede una sola vez y la puntuación se escribe en cero.** Medido el
17-sep-2026 contra la base real antes de escribir nada, con la cuenta
`userkid2`: tres niveles superados, `total_xp: 300`, y `best_score` en **0, 0 y
90** —el 90 es del `curl` del 2-sep-2026, no de ninguna partida—. De las 16 filas
de `level_attempts`, **14 tienen `score` a cero** y guardan el programa entero: son
las partidas de la verificación del J9, que dejó el campo vacío a propósito.

Hoy `upsert_my_progress` concede el `xp_reward` entero en la transición a
completado y **cero después**, así que un segundo intento perfecto no suma nada.
Y la ventana de nivel superado enseña «+100 XP» leyendo la `xp_reward` de la
fila, un número que **no es el que se concede**.

Es el J10 del roadmap del juego y la cara «servidor» del paso 21.

## What Changes

- **El servidor cuenta los pasos leyendo el programa guardado**, con las reglas
  del contrato §4.4 y sin ejecutar nada: una función SQL recursiva sobre el JSON
  del sobre. Un programa que no se puede leer no puntúa.
- **La puntuación sale de la eficiencia:** `redondeo(100 × óptimo ÷ pasos)`,
  acotada de 0 a 100. Decidida el 17-sep-2026 después de medir tres reglas contra
  los nueve programas resueltos a mano y sus excesos. Los pasos exactos dan 100;
  un bloque olvidado detrás de la meta cuesta entre 4 y 20 puntos según el nivel;
  llegar **siempre** paga algo. Sólo puntúan los intentos con éxito.
- **El XP se concede por diferencia de marca de agua:**
  `(marca nueva − marca anterior) × tope ÷ 100`. Superar flojo paga lo que valga
  la partida, mejorar paga la diferencia y empeorar paga **cero**.
- **Una partida es UNA llamada**, `submit_level_attempt`, y no dos. Es la única
  que tiene el programa —que es de donde sale la puntuación— y con ella
  `attempt_count` pasa a contar partidas de verdad: los dos contadores que
  «nada sincronizaba» quedan sincronizados.
- **Las marcas que ya existen se recalculan** desde el mejor intento con éxito
  cuyo programa se pueda leer, y `total_xp` se ajusta a la suma de las marcas.
  Decidido por el usuario el 17-sep-2026. En la base de pruebas: dos marcas pasan
  de 0 a 100 —medido, 12/12 y 10/10—, el 90 del `curl` se queda porque su
  programa **no es el sobre del contrato** y no hay nada que leer, y `total_xp`
  baja de 300 a 290.
- **La ventana de nivel superado deja de mentir:** enseña la puntuación de la
  partida y el XP **concedido**, no la `xp_reward` de la fila. Si el guardado
  falla, no enseña ningún número inventado.
- **El cliente puntúa igual que el servidor**, con la misma regla, para poder
  enseñarla al instante sin esperar la respuesta (contrato §3). Su puntuación
  viaja en `metadata` junto a sus pasos: el día que las dos no coincidan, queda
  con qué darse cuenta.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`backend-supabase`**. Se añade que el servidor puntúa contando el programa y
  que la experiencia se concede por diferencia de marca. Cambia el requisito de
  las escrituras encapsuladas —una partida es una llamada— y el de la experiencia
  por nivel, que pasa de «la misma al completar» a «el mismo tope».
- **`juego-3d`**. Cambia el requisito de guardar la partida —una llamada, y la
  puntuación del cliente entre las observaciones— y el de la ventana de
  felicitaciones, que enseña lo que de verdad se concedió.

## Impact

**Base de datos. Lleva migración y `db push`, que lanza el usuario.** Sería la
`202606030033`, la número 30 aplicada. Dentro: la función de recuento, la de
puntuación, la RPC nueva, el cambio de la concesión de XP en
`upsert_my_progress` y el recálculo de las marcas ya existentes.

**`types/database.types.ts` se regenera con la CLI**, también el usuario, y hasta
que se regenere el cliente no puede llamar a la RPC nueva sin que `tsc` falle.
El orden es: migración → `db push` → `gen types` → el resto del cliente.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `supabase/migrations/202606030033_score_by_steps.sql` | **Nuevo.** Todo lo de arriba |
| `apps/web/src/game/score.ts` | **Nuevo.** La regla de puntuación del lado del cliente |
| `apps/web/src/game/score.test.ts` | **Nuevo.** La regla, contra los nueve niveles sembrados y sus excesos |
| `apps/web/src/services/attempts.service.ts` | Gana el envío de la partida por la RPC nueva |
| `apps/web/src/components/dashboard/student/submitAttempt.ts` | Una llamada en vez de dos; devuelve puntuación y XP concedida |
| `apps/web/src/components/dashboard/student/submitAttempt.test.ts` | Los casos de la llamada única |
| `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` | Guarda lo que el servidor devuelve para la ventana |
| `apps/web/src/components/dashboard/student/LevelCompleteDialog.tsx` | Enseña puntuación y XP concedida |
| `apps/web/src/types/progress.types.ts` | El resultado de una partida enviada |
| `apps/web/src/types/database.types.ts` | **Regenerado con la CLI**, nunca a mano |

**Documentación.** `docs/CONTEXT.md` §2.7 y §3, `docs/CONTRATO-DE-INTEGRACION.md`
§3, §6 y el apéndice, `docs/DISENO-DEL-JUEGO.md` §3, `docs/ROADMAP.md` §3.2,
`docs/ROADMAP-JUEGO.md` y `supabase/README.md`.

**Lo que NO entra:**

- **La barra por tramos de 300**, que es el J11. La barra sigue contra
  `PROVISIONAL_MAX_XP` hasta entonces.
- **Retirar las estrellas** (`stars_reward`, `stars_earned`). Están previstas para
  el paso 22 y retirarlas aquí mezclaría dos migraciones.
- **Los logros y las misiones**, que son el paso 22. La RPC nueva no concede
  ninguno, aunque sea el sitio donde algún día se concederán.
- **`repetir N veces`**, que el contrato §4.4 define y el editor no construye. El
  recuento del servidor no lo contempla, igual que el del cliente.
