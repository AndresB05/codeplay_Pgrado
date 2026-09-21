## Why

**Hoy una misión no se puede cumplir, y el panel del tutor lo dice con todas las
letras:** «Todos aparecen en Pendiente porque todavía no hay forma de cumplir una
misión». El contrato §8 dejó abierto a propósito «cómo se relacionan las misiones
que un profesor asigna con los niveles del juego. Hoy son dos catálogos distintos
y nada los une».

Dos cosas más, medidas y no escritas hasta ahora:

- **El catálogo de misiones vive en el cliente** —cinco entradas en
  `dashboard/teacher/classroomsData.ts`— y `mission_assignments.mission_key` es
  texto **sin clave ajena** contra él, a sabiendas: la propia migración `0020` lo
  deja escrito. El paso 22 resolvió exactamente ese problema para los logros
  poniendo `achievement_catalog` en la base, con el motivo escrito: con el
  catálogo en SQL para conceder y una copia en TypeScript para pintar, las dos se
  separan en cuanto alguien toque una.
- **De las cinco misiones, tres premian bucles, condicionales y descomposición**,
  que los cuatro bloques del juego —avanzar, dos giros y saltar— no permiten
  practicar. Es la misma frontera por la que el paso 17 retiró las barras de
  habilidades y por la que el paso 22 dejó esas ideas fuera del catálogo de
  logros. Heredarlas sería repetir el error dos veces.

## What Changes

Decisiones del usuario del 20-sep-2026, que son las dos que este cambio no podía
tomar solo:

**Qué cuenta como cumplir una misión.** Una misión es un **reto sobre los nueve
niveles que ya existen**, con una condición que el servidor comprueba con la
misma maquinaria de los logros: el historial y el programa enviado. No hay puzles
nuevos que diseñar y se puede cumplir el mismo día.

**Qué misiones hay.** Fuera las cinco del cliente; catálogo nuevo en la base con
**cuatro**, decidido por el usuario el 20-sep-2026: pocas y **cumplibles de punta
a punta en la prueba preliminar**, no un catálogo grande a medio funcionar.

| Clave | Título | Se cumple | Dificultad | XP |
| --- | --- | --- | --- | --- |
| `clear_world_1` | Recorre el Sendero | Superando los tres niveles del Sendero de los Patrones | Fácil | 300 |
| `clear_world_2` | Cruza la Cordillera | Superando los tres niveles de la Cordillera de la Abstracción | Intermedio | 400 |
| `clear_world_3` | Resuelve la Encrucijada | Superando los tres niveles de la Encrucijada de las Decisiones | Difícil | 500 |
| `flawless_3` | Ni un paso de más | Consiguiendo 100 de 100 en tres niveles distintos | Intermedio | 400 |

**Son dos formas de condición y las dos son una consulta sobre las filas del
propio niño.** Tres preguntan si le queda algún nivel de su mundo sin superar; la
cuarta cuenta cuántos tiene al 100. Se descartó una quinta —«supera tres niveles
en el primer intento»— por ser la única que necesitaba una subconsulta
correlacionada sobre `min(created_at)` y arrastraba un empate de milisegundos que
concedería de más.

**Los tres de mundo piden SUPERAR, no la marca máxima**, y ahí está la raya que
los separa de los logros: `perfect_world_N` exige los tres al 100, esta misión
exige terminarlos. Un niño puede cumplir la misión sin tener el logro.

Y el resto:

- **`mission_catalog` en la base**, con el mismo patrón que `achievement_catalog`:
  título, descripción, dificultad, XP y orden, leído entero por quien pinta.
- **`mission_assignments.mission_key` gana su clave ajena** contra ese catálogo.
  La deuda que la `0020` dejó escrita se cierra aquí.
- **`mission_completions`**, tabla propia, porque no puede montar sobre
  `achievements` —su `unique (user_id, achievement_key)` significa «una vez en la
  vida» y una misión es reasignable—. Guarda **el salón donde se cumplió**, no lo
  deriva: un niño que cambie de salón haría desaparecer lo cumplido de los
  informes de su antiguo profesor. Es lo que el contrato pedía.
- **El cumplimiento es individual**, aunque la asignación sea del salón: que un
  alumno la cumpla NO la retira de los demás. La misión sigue en el salón hasta
  que el tutor la retire.
- **La misión paga su XP, una sola vez en la vida.** El `unique (user_id,
  mission_key)` es lo que lo sostiene: reasignarla en otro salón la muestra ya
  cumplida y no vuelve a pagar.
- **El niño se entera en la misma partida**, con el mismo aviso de esquina que
  los logros, diciendo «¡Misión cumplida!» en lugar de «¡Logro desbloqueado!».
- **El tutor ve «Cumplida» de verdad** en «Quién ha cumplido», y desaparece el
  aviso de que nadie puede cumplirlas.
- **Asignar pone al día a quien ya cumplía la condición.** Sin esto, un salón
  donde varios ya terminaron el mundo 1 saldría entero en «Pendiente» hasta que
  cada uno volviera a jugar, que es exactamente el síntoma que este cambio viene
  a quitar.
- **BREAKING (interno): `SkillKey` y `getSkillLabel` se retiran.** Dejaron de
  medir nada el 18-sep-2026 con las barras de habilidades y sobrevivían sólo como
  rótulo de estas cinco misiones. También se va `estimatedMinutes`, que era un
  número inventado.
- **Fuera de este cambio, por decisión del usuario:** el **calendario** con fecha
  límite para las misiones. Se anota en `ROADMAP.md` §3 como cabo suelto para
  después de la prueba preliminar.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `misiones-asignadas`: una misión pasa a poder cumplirse y a pagar su XP; el
  catálogo se muda del cliente a la base; el cumplimiento deja de calcularse y
  pasa a guardarse con su salón; asignar pone al día a quien ya cumplía la
  condición.

## Impact

**Base de datos — necesita `db push`, que lanza el usuario.** Una migración
nueva, `202606030044_playable_missions.sql`:

- `create table public.mission_catalog` con su RLS de lectura y sus cuatro filas.
- `delete` defensivo de asignaciones huérfanas —hoy `mission_assignments` está
  **vacía**, medido— y `alter table` para añadir la clave ajena.
- `create table public.mission_completions` con su RLS y sin ningún `grant` de
  escritura: como `achievements`, sólo escribe una función `security definer`.
- `create function public.award_missions(uuid)` — evalúa y concede.
- `create function public.assign_mission_to_groups(uuid[], text)` — asigna y pone
  al día.
- `create or replace function public.submit_level_attempt(...)` — **se reescribe
  partiendo de su texto de la `0040`** y se diffea antes de aplicar, que es la
  primera de las tres lecciones de `CONTEXT.md` §2.11.

**Tipos:** `apps/web/src/types/database.types.ts` **sí hay que regenerarlo**, con
`npx supabase gen types`, que lanza el usuario. Con `>` de PowerShell sale en
UTF-16 con CRLF y hay que reconvertirlo a UTF-8 con LF.

**Código de la aplicación:**

- `apps/web/src/types/classroom.types.ts` — `Mission` cambia de forma; se van
  `SkillKey` y `estimatedMinutes`.
- `apps/web/src/components/dashboard/teacher/classroomsData.ts` — se van
  `missionCatalog`, `SKILL_LABELS` y `getSkillLabel`.
- `apps/web/src/services/missions.service.ts` — lectura del catálogo y de los
  cumplimientos; `assignMission` pasa por la RPC nueva.
- `apps/web/src/hooks/useMissionAssignments.ts` — trae también catálogo y
  cumplimientos.
- `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.tsx` — la
  tarjeta del niño dice si está cumplida en lugar de que llegará con el juego.
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` — «Quién ha
  cumplido» con el dato real, y fuera el aviso.
- `apps/web/src/services/attempts.service.ts` y
  `apps/web/src/types/progress.types.ts` — la respuesta de la partida trae las
  misiones cumplidas.
- `apps/web/src/components/dashboard/student/AchievementToast.tsx` y
  `StudentLevelModule.tsx` — el aviso distingue logro de misión.

**Tests que cambian:** `AssignedMissionsPanel.test.tsx`,
`TeacherPanelModule.test.tsx`, `attempts.service` si existe, y uno nuevo para la
lectura blanda de las misiones cumplidas.

**Depende de `renombrar-mundos`**, que va primero: el catálogo de misiones nombra
los mundos por su nombre nuevo.
