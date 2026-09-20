## Why

El paso 22 es lo último que la secuencia pone antes de la prueba preliminar, y
**no existe nada**: medido el 18 de septiembre de 2026 contra la base real con la
cuenta de niño de `.env`, que tiene **900 XP y los nueve niveles al 100**:

| Qué | Cuánto |
| --- | --- |
| Filas en `achievements` | **0** |
| `profiles.current_streak` | **0** |
| `profiles.max_streak` | **0** |

No es que falten logros: es que **nadie los concede y nadie cuenta días**. Las
dos piezas ya están a medio poner desde hace semanas y nunca se cerraron:

- **`achievements` es una tabla real desde la `0005`** —`achievement_key`,
  `title`, `description`, `icon_name`, `awarded_xp`, único por
  `(user_id, achievement_key)`— con RLS de lectura propia y **sin `grant insert`
  para nadie**, que es exactamente lo que hace falta: sólo puede escribir una
  función `security definer`.
- **`profiles.current_streak` y `max_streak` existen desde la `0002`**, con su
  `check` de no negativos, y **ningún código los toca**. La `0015` ya lo dejó
  anotado: «`current_streak` todavía no lo calcula nadie».
- **`total_xp` ya suma `achievements.awarded_xp`** desde la `0033`, así que
  conceder experiencia por un logro cuadra la cuenta sin tocarla.
- **`submit_level_attempt` es el sitio**, y su propio comentario lo dice: «NO
  concede logros, aunque sea el sitio donde algún día se concederán (paso 22)».

Y lo que hace el paso posible: **el servidor ya sabe leer el programa de Blockly
desde SQL**. `count_block_chain` lo recorre bloque a bloque reconociendo los
cuatro tipos, y de ahí sale la puntuación desde el J10. Contar giros seguidos o
bloques de salto es extender ese recorrido, no inventarlo.

Mientras tanto la **Sala de Trofeos** enseña cuatro tarjetas de maqueta, y dos de
ellas —«Arquitecto de Variables» y «Señor de los Bucles»— premian bucles y
variables que **los cuatro bloques del juego no permiten**: la misma frontera por
la que el paso 17 retiró las cinco barras de habilidades.

## What Changes

### Las rachas

- **Un día es un día de Colombia (UTC−5)**, decidido por el usuario. No es un
  detalle: medido sobre los 28 intentos de la cuenta de niño, las partidas de
  las 00:20 a la 01:43 UTC del 18-sep son **la noche del 17 en Colombia**, así
  que el mismo historial da racha **2 en UTC y 0 en hora local**. Con UTC, al
  niño el día se le acabaría a las 7 de la tarde.
- **La racha sube con una partida SUPERADA**, decidido por el usuario: entrar y
  fallar no cuenta. Vale cualquier nivel, incluso uno ya superado.
- Un día con varias partidas superadas **sube la racha una sola vez**.
- Se guarda además **el último día contado**, que hoy no existe: sin él no se
  puede saber si una racha sigue viva o está rota.

### Los logros: veinte, y los concede el servidor

**El juego nunca dice qué logro cree merecer** (contrato §5). Y **todos exigen
superar el nivel**, corregido por el usuario: cuatro giros o diez saltos sin
llegar a la meta no conceden nada. Eso es además lo que §5 ya pedía para
cualquier logro atado a un nivel.

| Categoría | Cuántos | Qué mira el servidor |
| --- | --- | --- |
| Nivel perfecto | 9 | El historial: marca 100 en ese nivel |
| Mundo perfecto | 3 | El historial: los tres niveles del mundo al 100 |
| Todo perfecto | 1 | El historial: los nueve al 100 |
| Acción | 3 | El programa enviado, más el éxito de esa partida |
| Ejecución | 1 | Una observación del juego, más el éxito de esa partida |
| Racha | 3 | El contador de días |

Los tres de **acción** salen de leer el programa: «Sin mareos» (cuatro giros a la
derecha seguidos), «Intentando volar» (diez bloques de salto) y «Eso fue
innecesario...» (un programa de 67 pasos). **Comprobado que los tres caben con la
meta**: sólo en Selva y Cordillera, porque los tres niveles de Costa de Bugs
tienen `stepLimit` igual a su óptimo y cortan la partida antes.

El de **ejecución** es «¡Auch! mis rodillas», exclusivo de «La torre». Medida su
rejilla: la casilla de altura 6 en `(2,1)` es **adyacente** a una de altura 1 en
`(3,1)`, así que la caída de 5 existe y es la mayor posible del nivel. Una caída
no se lee del programa sin reimplementar el motor dentro de la base, así que **el
juego la observa y la manda**, y el servidor la usa con la misma condición que
`success`: es el mismo bit de confianza que el contrato ya reconocía, ni uno más.

### El catálogo vive en la base, no en el cliente

Tabla nueva `achievement_catalog`, sembrada por la migración. `achievements`
sigue guardando título y descripción **copiados** al conceder —sus columnas son
`not null` desde la `0005` y así un logro renombrado no reescribe el pasado de
nadie—, pero la fuente es una sola. Sin esto, el cliente necesitaría su propia
copia para pintar los logros que faltan, y las dos se separarían.

### El aviso de logro desbloqueado

`submit_level_attempt` **devuelve ya un `jsonb`** con lo concedido, así que los
logros nuevos y la racha viajan en esa misma respuesta: la pantalla no consulta
otra vez para saber qué enseñar. El aviso aparece sobre la pantalla del juego,
en cola si son varios.

### La Sala de Trofeos, y las estrellas

- **Fuera la sección «Lógica» entera**, decidido por el usuario: sus dos tarjetas
  premian lo que los cuatro bloques no permiten.
- **«Grandes trofeos» pasa a ser los tres logros de mundo perfecto**, que es lo
  que el usuario decidió que signifique esa fila.
- La lista de abajo enseña el catálogo entero: lo conseguido y **lo que falta**.
- **Se retiran las estrellas**, que la fila 22 del roadmap incluye: `stars_earned`
  en `user_progress`, `stars_reward` en `levels` y el parámetro
  `input_stars_earned` de `upsert_my_progress`. Ninguna pantalla las muestra y el
  contrato §3 ya avisa de que están previstas para retirar.

## Capabilities

### New Capabilities

- `logros-y-rachas`: qué se premia, quién lo concede y qué se cree sin
  comprobar.

### Modified Capabilities

- `backend-supabase`: el catálogo de logros, la concesión dentro de la partida,
  el día de la racha y la retirada de las estrellas.
- `contenido-mundos`: la Sala de Trofeos deja de ser maqueta.

## Impact

**Base de datos. Necesita `db push` y `gen types`, que lanza el usuario.**

Una migración, `202606030036`: `achievement_catalog` y su siembra,
`profiles.last_streak_day`, las funciones de lectura de programa que faltan, la
concesión, el recuento de días y la retirada de las estrellas.
`submit_level_attempt` pasa a conceder y a devolver lo concedido.

**Código.**

- `game/` — la caída observada llega a `LevelFinish` y de ahí a `metadata`.
- `services/achievements.service.ts` y `hooks/useAchievements.ts` — el catálogo
  con lo conseguido encima.
- El aviso de logro desbloqueado, y su cola.
- `student/StudentTrophiesModule.tsx` — la sala, sin maqueta.
- Los tres sitios donde hoy viajan las estrellas.
- Tests de las funciones nuevas y de las pantallas.

**Lo que NO cambia:** el juego sigue sin saber que los logros existen, y ninguna
pantalla nueva consulta Supabase por su cuenta.
