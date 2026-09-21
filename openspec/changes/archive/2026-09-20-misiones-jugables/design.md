## Context

Ver `proposal.md` — Why. Aquí queda lo medido el 20-sep-2026 que condiciona el
cómo:

- **`mission_assignments` está vacía** en la base real. Añadirle una clave ajena
  no arrastra ninguna fila huérfana, y eso abarata el cambio: no hay migración de
  datos que inventar.
- **`achievements` no tiene `grant insert` para ningún rol**, y `award_achievements`
  es `security definer` por eso. `mission_completions` nace con la misma puerta.
- **`submit_level_attempt` ya concede logros y racha en dos bloques `begin …
  exception` separados**, y devuelve el motivo del fallo en `achievements_error`.
  La concesión de misiones entra como un tercer bloque, no dentro de los otros.
- **La cuenta de niño de `.env` tiene los nueve niveles al 100 y 2900 XP**, así
  que satisface las cuatro misiones del catálogo nuevo **sin tener que volver a
  jugar**. Es el banco de pruebas de la puesta al día al asignar.

Y la lección que este cambio hereda entera de `CONTEXT.md` §2.11: **una función
que ya existe se reescribe partiendo de su texto y se diffea antes de aplicar**;
`array || 'literal'` es ambiguo y se usa `array_append`; y un `exception when
others` abre **subtransacción**, así que revierte lo escrito dentro de él.

## Goals / Non-Goals

**Goals:**

- Que una misión se pueda cumplir **hoy**, con los nueve niveles que existen.
- Que el catálogo esté en **un solo sitio** y la asignación apunte a él de
  verdad.
- Que el XP de una misión entre por el mismo camino que el de un logro, y una
  sola vez.

**Non-Goals:**

- **No se diseña ningún puzle nuevo.** Una misión no es contenido, es una
  pregunta sobre el contenido.
- **No entra el calendario** con fecha límite: decisión del usuario del
  20-sep-2026, se anota en `ROADMAP.md`.
- **No se publica `mission_completions` en Realtime.** El tutor recarga el panel;
  añadir una cuarta tabla a `supabase_realtime` es otro cambio.
- **No se toca `ClassroomsProvider`.** Este cambio va por su propio servicio y su
  propio hook, como ya hacía `misiones-asignadas`. La frontera de §4.3 sigue en
  pie.

## Decisions

### Las condiciones se codifican en SQL, no en una columna `jsonb`

El catálogo guarda **qué se le enseña al niño** —título, descripción, dificultad,
XP, orden— y la condición vive dentro de `award_missions`, un `case` por clave.
Es exactamente lo que `award_achievements` hace con sus veinte.

Alternativa considerada: una columna `condition jsonb` interpretada por la RPC,
que dejaría añadir una misión sin tocar código. Se descarta por dos razones: el
intérprete de condiciones es más código que las cuatro condiciones que tendría que
interpretar, y el catálogo se lee **sin ser secreto** por cualquiera con sesión,
así que una condición ahí dentro sería pública. La del contrato es la misma
regla: la condición de un logro no va donde se lee sin sesión.

### La clave de una misión de mundo lleva el orden, no el UUID

`clear_world_2` es el segundo mundo, y el número se lee con
`split_part(mission_key, '_', 3)::integer`. Misma regla que `perfect_w2_l3`, por
el mismo motivo: los identificadores de la siembra no son los mismos en otro
proyecto de Supabase, y una clave ilegible convierte cualquier consulta de
depuración en un acertijo. **Renombrar un mundo no toca ninguna clave**, que es
lo que `renombrar-mundos` acaba de comprobar.

### `mission_completions` y no `achievements`

Lo pedía el contrato y el motivo es de cardinalidad: el `unique (user_id,
achievement_key)` de `achievements` significa «una vez en la vida» y una misión
es **reasignable** —`mission_assignments` ya declara `unique (group_id,
mission_key)` porque la misma misión en dos salones es lo normal—.

La tabla nueva lleva `unique (user_id, mission_key)`, que es lo que hace cumplir
la decisión del usuario de **pagar una sola vez en la vida**, y una columna
`group_id` **not null** que guarda dónde ocurrió. Guardarlo y no derivarlo es lo
que impide que un niño que cambia de salón borre lo cumplido de los informes de
su antiguo tutor.

### Quién puede leer un cumplimiento

Sin `grant insert`, `update` ni `delete` para nadie: escribe sólo la función
`security definer`, igual que `achievements`. La política de lectura tiene tres
ramas:

1. **El propio niño** — `user_id = auth.uid()`.
2. **El tutor del salón donde se cumplió** — `group_id` entre sus salones. Es la
   rama que conserva los informes del tutor anterior.
3. **El tutor del salón donde el niño está ahora** — porque un niño que cumplió
   la misión en otro salón se le mostraría «Pendiente» para siempre, y eso sería
   falso: no puede volver a cumplirla.

**Análisis de ciclos de RLS, desde la escritura y desde la lectura**
(`ROADMAP.md` §1.3, punto 5). Desde la escritura es trivial: **no hay política de
escritura**, porque no hay `grant` que la active, y `security definer` no expande
políticas. Desde la lectura, la política consulta `class_groups` —que se lee con
`using (true)` y ahí termina el recorrido— y `class_memberships`, cuyas políticas
no miran `mission_completions`. No se cierra ningún ciclo. Es el mismo grafo que
ya recorre `mission_assignments_select_related`.

### Dos puntos de evaluación, una sola función

`award_missions(input_user_id)` concentra la evaluación y la concesión. La llaman
dos sitios:

1. **`submit_level_attempt`**, al terminar una partida. Es el camino normal.
2. **`assign_mission_to_groups`**, al asignar. Es el que evita que un salón donde
   varios ya cumplían salga entero en «Pendiente» hasta que cada uno vuelva a
   jugar.

Alternativa considerada: sólo el primero, y documentar el desfase como se
documentó el de los logros («cobra lo suyo en la siguiente partida»). Se descarta
porque el síntoma es **exactamente** el que este cambio viene a quitar: una tabla
entera en «Pendiente» que se lee como un fallo. En los logros ese desfase no tiene
testigo; aquí lo tiene, y es el profesor.

**Queda un desfase que no se cierra y se escribe:** un niño que **entra a un
salón después** de que la misión se asignara, y que ya cumplía la condición, la
verá cumplida en su siguiente partida y no antes. Cerrarlo obligaría a evaluar al
aceptar una solicitud de ingreso, que es otra superficie y otro cambio.

### `assign_mission_to_groups` sustituye al `upsert` de PostgREST

Hoy `assignMission` hace un `upsert` con `ignoreDuplicates`. Pasa a ser una RPC
`security definer` porque la puesta al día escribe **en las filas de otros
usuarios** —`mission_completions` y `profiles.total_xp` de sus alumnos—, y eso no
lo puede hacer el rol del tutor por ninguna vía directa.

La función comprueba ella misma que **todos** los salones del argumento son del
tutor y levanta `42501` si alguno no lo es; no se apoya en la política de
`mission_assignments`, porque `security definer` no la expande. La regla de
`ROADMAP.md` §1.3.5 aplica aquí con todo su peso: **la garantía se mueve de la
política a la función, y hay que escribirla dentro**.

La inserción mantiene `on conflict do nothing`, que es lo que permite mandar
todos los salones del alcance —incluidos los que ya la tienen— sin calcular el
subconjunto con estado que puede estar viejo.

**La puesta al día va en su propio bloque `begin … exception`**, separado de la
inserción. Es la tercera lección de §2.11 aplicada al revés: aquí el bloque se
quiere, precisamente porque abre subtransacción y así un fallo concediendo
revierte lo concedido **pero no la asignación**. El motivo viaja en el `jsonb` de
respuesta, bajo `missions_error`, y no se traga.

### `submit_level_attempt` gana un tercer bloque, no una rama dentro de otro

La concesión de misiones va **después** de la de logros y **antes** de leer
`total_xp`, porque las misiones también pagan y el total que se devuelve tiene que
incluirlas. Bloque propio: si comparte el `exception` con los logros, un fallo
concediendo una misión revertiría los logros ya escritos, que es la trampa que la
`0040` pagó con la racha.

La respuesta gana dos claves, `completed_missions` y `missions_error`. Claves
nuevas, no cambios en las que hay: un cliente viejo las ignora.

### El cliente las lee **blandas**, como los logros

`readCompletedMissions` copia la forma de `readUnlocked`: si el campo no es una
lista, o un elemento no trae clave y título, se descarta en vez de dar la partida
por perdida. Sin las misiones la partida se guardó igual y lo único que falta es
un aviso; sin la puntuación no hay nada que enseñar. Es la incoherencia
deliberada que `attempts.service.ts` ya documenta.

### El aviso distingue misión de logro con un campo, no con un componente nuevo

`AchievementToast` gana un `kind` por elemento de la cola —`'achievement'` o
`'mission'`— que cambia el rótulo superior y el icono. Duplicar el componente
duplicaría la cola, y entonces un logro y una misión de la misma partida se
pintarían **encima el uno del otro**, que es justo lo que la cola existe para
evitar.

### Qué se retira, y por qué no es limpieza de paso

`SkillKey`, `SKILL_LABELS`, `getSkillLabel` y `Mission.estimatedMinutes` se van
con el catálogo viejo. No es limpieza oportunista: son **sus** campos. `SkillKey`
ya estaba marcado en `classroom.types.ts` como algo que «dejó de medir nada el
18-sep-2026» y cuya «suerte la decide el paso 22»; los minutos estimados eran un
número inventado, y el repositorio ya pagó una vez por enseñar datos inventados
en el panel del tutor.

## Risks / Trade-offs

- **[Reescribir `submit_level_attempt` de memoria]** → Es el fallo que costó
  cinco de las seis migraciones del paso 22. Mitigación: se parte del texto de la
  `0040`, y **se diffea contra él** antes de aplicar. El diff tiene que enseñar
  exactamente tres cosas: la variable nueva, el bloque nuevo y las dos claves
  nuevas en el `jsonb`.
- **[`array || 'literal'` otra vez]** → `award_missions` acumula claves ganadas
  en un `text[]`. Se usa `array_append` en todas, sin excepción.
- **[Un fallo concediendo tumba la partida]** → El bloque propio con `exception
  when others` lo impide, y `missions_error` impide que el motivo sea invisible.
- **[La puesta al día es cara en un salón grande]** → Es una evaluación por
  alumno del alcance, con consultas sobre sus propias filas. Con salones de
  decenas de alumnos no es problema; con miles lo sería, y entonces la evaluación
  se movería a una sola consulta por conjunto. Queda escrito, no resuelto.
- **[Cuatro misiones son pocas]** → Lo son a propósito: el usuario las quiere
  **cumplibles de punta a punta en la prueba preliminar**, no un catálogo grande
  a medio funcionar. Ampliarlo es insertar filas en `mission_catalog` y una rama
  más en `award_missions`; nada de lo que entra aquí lo estorba.
- **[La misión y el logro pagan por lo mismo]** → Un niño que termina el mundo 1
  al 100 cobra el logro del mundo y, si la tiene asignada, la misión. Es
  deliberado: son dos cosas distintas, una la pone el juego y la otra su
  profesor, y el XP total no ordena nada fuera del salón.
- **[`gen types` sale en UTF-16 con CRLF]** → Lo lanza el usuario y hay que
  reconvertirlo a UTF-8 con LF antes de commitear. Va escrito en las tareas.

## Migration Plan

1. `renombrar-mundos` tiene que estar **aplicado y empujado** antes: el catálogo
   de misiones nombra los mundos por su nombre nuevo.
2. Se escribe `supabase/migrations/202606030044_playable_missions.sql`.
3. **PARADA: el SQL se lee antes del `db push`** (`ROADMAP.md` §1.3, punto 9),
   con el diff de `submit_level_attempt` contra el texto de la `0040` delante.
4. El **usuario** lanza `npx supabase db push`, y después `npx supabase gen
   types`. La salida del `push` tiene que aplicar `202606030044` y ninguna otra.
5. Se reconvierte `database.types.ts` a UTF-8 con LF.
6. Se verifica contra la base: asignar desde el panel del tutor y comprobar que
   la cuenta de niño de `.env` —que ya tiene los nueve al 100— aparece cumplida
   en las cuatro sin haber vuelto a jugar, y que su `total_xp` sube exactamente
   1600.

**Vuelta atrás:** una migración que devuelva `submit_level_attempt` al texto de
la `0040` y deje caer las dos tablas. El XP concedido por misiones no se
desharía solo; es la misma situación que cualquier concesión, y no hay pérdida de
datos.
