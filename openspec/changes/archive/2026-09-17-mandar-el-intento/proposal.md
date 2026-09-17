## Why

**Los nueve niveles se juegan y no dejan rastro.** Medido el 17-sep-2026 antes de
escribir nada: se superó el nivel 2 del mundo 1 con los doce pasos de la mejor
solución, la pantalla felicitó, y en la base `user_progress`, `level_attempts` y
`profiles.total_xp` quedaron **exactamente igual que antes de jugar** —las únicas
filas que había eran del `curl` de verificación del 3-sep-2026—. En el código:
`createAttempt` y `upsertProgress` existen, están medidas contra la base real
desde el 2-sep-2026, y **no las llamaba nadie**; cero apariciones fuera de su
propio archivo.

Es el J9 del roadmap del juego y la tarea 3 del paso 21: el juego ya funciona
entero y la plataforma no se entera de nada de lo que pasa dentro.

## What Changes

- **Una partida terminada se guarda**, con éxito o sin él. El anfitrión traduce
  el final de partida a las dos llamadas del apéndice del contrato:
  `create_level_attempt` con el programa, y `upsert_my_progress` con el estado.
- **La escena avisa también de las partidas fallidas.** Hasta hoy sólo subía la
  llegada a la meta, porque lo único que colgaba de ese aviso era la ventana de
  felicitación. La ventana sigue saliendo sólo al llegar.
- **El intento lleva las seis cosas que puede llevar**, no cuatro: se estrenan
  `input_runtime_ms` e `input_metadata`, que estaban escritas desde el
  25-ago-2026 y nunca se habían usado. El programa viaja **entero y en su sobre**
  (§4.3), que es lo que el contrato §5 exige para poder conceder logros.
- **Fallar escribe progreso `in_progress`**, decidido por el usuario el
  17-sep-2026. Un nivel fallado aparece en el progreso desde el primer intento,
  con cuántas veces se ha probado y cuándo fue la última.
- **El contador de mundos pasa a mirar el estado** y no la existencia de la fila.
  Es la deuda §4.12, y este cambio es el que la despierta: sin el filtro, el
  primer fallo de un mundo lo pondría en 1/3.
- **La puntuación NO se manda.** El contrato se la quitó al juego el 3-sep-2026
  —la calcula el servidor leyendo el programa— y quien la calcule es el J10.
  Hasta entonces `score` y `best_score` se quedan en cero a propósito.
- **Un guardado fallido no le quita la partida al niño** (§7): la felicitación
  sale igual y el aviso llega detrás, sin pedirle que haga nada.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`juego-3d`**. Se añade el requisito de mandar el intento al servidor, y
  cambia el del final de partida: lo que sube ya no es sólo la llegada.
- **`contenido-mundos`**. El contador de niveles superados de la lista de mundos
  pasa a exigir el estado `completed`.

## Impact

**Base de datos.** Nada. Sin migración y sin `db push`: las dos RPC existen desde
la 0006 y aceptan los seis parámetros desde entonces.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/components/dashboard/student/submitAttempt.ts` | **Nuevo.** La traducción de una partida terminada a las dos llamadas |
| `apps/web/src/components/dashboard/student/submitAttempt.test.ts` | **Nuevo.** La decisión de estado y la forma del sobre |
| `apps/web/src/game/GameScene.tsx` | `LevelFinish` gana el resultado, el programa ejecutado y la duración; el aviso sube también al fallar |
| `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` | Manda el intento en el manejador, nunca en un efecto |
| `apps/web/src/components/dashboard/student/LevelCompleteDialog.tsx` | El aviso de guardado fallido |
| `apps/web/src/components/dashboard/student/StudentWorldsModule.tsx` | El contador filtra por `completion_status` (§4.12) |
| `apps/web/src/services/attempts.service.ts` | `createAttempt` pasa los seis parámetros |

**Documentación.** `docs/CONTEXT.md` §2.7, §2.9, §3 y §4.12, y
`docs/ROADMAP-JUEGO.md`.

**Lo que NO entra:**

- **El XP por marca de agua.** Hoy `upsert_my_progress` concede el `xp_reward`
  entero la primera vez y cero después. Pasar a 80 al completar y 20 al mejorar
  es el **J10**, y necesita migración.
- **Contar los pasos en el servidor.** También J10. Por eso la puntuación va a
  cero en vez de estrenar un número que aquel paso viene a cambiar.
- **Logros y misiones.** Son el paso 22, y el juego no participa: no los nombra,
  no los reporta y no sabe que existen.
- **El paso del coyote** (§4.13). Es dibujo, es independiente y no comparte una
  línea con esto.
