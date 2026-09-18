## Context

Ver `proposal.md` — Why. Lo que aquí importa son tres restricciones medidas el
18 de septiembre de 2026, que son las que fijan el diseño:

1. **El tutor no puede leer el progreso de sus alumnos.** La política
   `user_progress_select_own` de la `202606030009` es `auth.uid() = user_id`, y
   con sesión de tutor `user_progress` y `level_attempts` devuelven cero filas.
   No existe ninguna vista ni RPC que lo rodee: `leaderboard_weekly` es global y
   semanal, no por salón.
2. **`count_program_steps(text)` está revocada de `public` y `anon`** por la
   `202606030033`, y nunca se concedió a `authenticated`, porque hasta ahora sólo
   la llamaba `submit_level_attempt`, que es `security definer`.

   > **Corregido el 18-sep-2026, después de aplicar la `0034` y medirla.** Este
   > punto decía que bastaba llamarla desde una vista sin `security_invoker`,
   > porque ésa correría como su dueño. **Es falso, y el error cuesta una
   > migración más**: una vista así sortea la RLS y los permisos de las TABLAS
   > que consulta, pero el `execute` de una FUNCIÓN se comprueba contra quien
   > lanza la consulta. Medido: pedir la columna `steps` respondía `42501` a
   > tutor y a niño por igual, mientras cualquier otra columna de la misma vista
   > respondía 200. Lo arregla la `202606030035` concediendo el `execute` a
   > `authenticated` sobre las dos funciones de conteo — las dos, porque
   > `count_program_steps` no es `security definer` y llama a
   > `count_block_chain` con los permisos de quien la invocó.
3. **El único invariante que ayuda**: un alumno pertenece como máximo a un salón,
   así que el salón de una fila de progreso se resuelve sin ambigüedad.

## Goals / Non-Goals

**Goals:**

- Que lo que cuente el panel cuadre con lo que diga la base para la misma cuenta.
- Que el progreso siga sin ser legible tabla a tabla por nadie que no sea su
  dueño: lo que se abre es una lectura acotada, no la tabla.
- Que el detalle por nivel e intento no se cargue para quien no lo mira.

**Non-Goals:**

- La navegación mundo a mundo por alumno, que es el paso 31. Aquí el detalle es
  una tabla dentro del panel de información, no una pantalla propia.
- Tocar `submit_level_attempt` o `upsert_my_progress`. Esta migración no cambia
  ninguna escritura.
- Recortar nada por `joined_at`. El usuario decidió lo contrario y el spec lo
  recoge.

## Decisions

### Tres vistas, no una

Se crean tres, y el motivo es que hay tres granularidades con tres consumidores
distintos:

| Vista | Una fila por | Quién la lee |
| --- | --- | --- |
| `classroom_student_activity` | alumno | el snapshot de salones, para las dos columnas de la tabla |
| `classroom_level_progress` | alumno × nivel | el panel, al elegir un explorador |
| `classroom_level_attempts` | intento | el panel, para los pasos de cada intento |

La alternativa era una sola vista al detalle y agregar en el cliente. Se
descarta porque la tabla de seguimiento del **niño** también muestra el mundo y
la actividad de sus compañeros: con una sola vista, abrir la lista del salón se
llevaría por delante el historial entero de todos para pintar dos columnas.

Las tres llevan el filtro dentro, con las dos ramas de siempre: **el propio
alumno, o el tutor del salón al que pertenece**. Ninguna declara
`security_invoker`, así que no aplican la RLS de las tablas que consultan — que
es justamente por lo que el filtro va escrito dentro y es lo primero que hay que
leer al revisarlas. El linter de Supabase las marcará como
`security_definer_view`, igual que a las dos de la `0015`.

El alcance se resuelve **sin colgar la proyección de la membresía**: un alumno
sin salón sigue viendo su propio progreso por estas vistas. El `group_id` entra
con un `left join`, para quien lo tenga.

### Los pasos los cuenta `count_program_steps`, y `submitted_code` no sale

`level_attempts.metadata` ya trae `steps` y `optimalSteps` escritos por el
cliente, y coinciden con lo que cuenta el servidor. Aun así la vista llama a
`count_program_steps(submitted_code)`: el informe del tutor no puede depender de
un número que escribe quien juega. El coste es ejecutar una función `immutable`
por fila de intento, y está acotado más abajo. El `execute` de esa función y de
la que llama por dentro lo concede la `202606030035`, por lo dicho arriba.

`optimal_steps` sí sale de `levels.validation_rules->>'optimalSteps'`, que es
configuración del nivel y no la escribe nadie desde el cliente.

**Ninguna vista expone `submitted_code`.** El tutor necesita cuántos pasos tuvo
cada intento, no el programa que el niño escribió. Exponer el programa sería
además abrir la solución de cada nivel a cualquiera que tutele a alguien que la
haya resuelto.

### El resumen entra en el snapshot; el detalle, en un hook aparte

`ClassroomStudent.currentWorld` y `.hoursSinceLastActivity` son campos que ya
existen y que hoy viajan cableados. Se rellenan desde
`classroom_student_activity` dentro de `getTutorSnapshot` y
`getStudentSnapshot`, que es donde ya se compone el roster: así la frontera del
store no se toca y `getClassGroupStats` empieza a dar «activos hoy» y «mundo más
común» verdaderos sin cambiar una línea.

El detalle por nivel e intento **no** entra ahí. Va en un servicio y un hook
propios, que monta sólo el panel de información y sólo cuando hay un explorador
elegido. Meterlo en el snapshot lo cargaría en cada entrada al panel y en cada
refresco de Realtime, para una tabla que casi nunca está abierta.

### Qué se pinta donde estaban las barras

Una sección con cuatro cifras del alcance —exploradores con actividad sobre el
total, niveles superados sobre los posibles, mundos terminados sobre los
posibles, marca media de eficiencia— y debajo una lista de exploradores. Al
elegir uno, **una sola tabla**: una fila por nivel, con su mundo, su marca, sus
intentos y **los pasos de cada intento en una tira**, con el óptimo del nivel al
lado.

Se descarta el despliegue en dos alturas (nivel → intentos). Con tres niveles por
mundo y nueve en total, la tira de números cabe en la fila y evita un clic entre
el tutor y el dato que vino a ver.

Un alcance sin actividad no pinta cifras: lo dice con una frase. Es lo que el
spec exige y lo contrario de lo que hacía el semáforo.

### Qué se queda del código de habilidades

`SkillKey` y `getSkillLabel` **no se borran**: `Mission.skill` los usa para
etiquetar las cinco misiones del catálogo, que es del paso 22. Se van
`SkillReport`, `ClassroomStudent.skills`, `EMPTY_SKILLS`, `getSkillReports`,
`SKILL_DEFINITIONS`, `MASTERY_THRESHOLD` y `getMasteryTone`.

## Risks / Trade-offs

- **`count_program_steps` por fila de intento** → Es `immutable` y recorre un
  `jsonb` pequeño. El techo realista de un salón lleno son 30 alumnos × 9
  niveles × unos pocos intentos; hoy la base entera tiene 28 filas. Si alguna vez
  molesta, la salida es materializar los pasos en `level_attempts` al escribir el
  intento, no volver a creerle al cliente.
- **Un programa que el servidor no sabe leer** → `count_program_steps` devuelve
  `null`, y ese intento se informa sin número de pasos. Un cero diría que se
  resolvió sin hacer nada, que es peor que no decir nada.
- **El tutor ve lo anterior al ingreso** → Es la decisión del usuario, y su
  arista de privacidad queda anotada en el spec para el paso 14. La fecha sigue
  guardada en `class_memberships.joined_at`, así que acotar más tarde sigue
  siendo posible sin migrar nada.
- **Tres vistas `security definer` más** → El grafo de políticas no se toca, que
  es lo que evita la familia de recursión de la `0014`. A cambio, tres sitios más
  donde el filtro de alcance vive dentro de la vista y hay que leerlo para
  revisarlo.
- **`database.types.ts` queda desincronizado hasta el `gen types`** → El código
  que lee las vistas nuevas no compila hasta que el usuario lo lance. Las tareas
  lo ponen en su orden.

## Migration Plan

1. Se escribe `supabase/migrations/202606030034_create_classroom_progress_views.sql`,
   y detrás la `202606030035_grant_step_counting.sql`, que es el arreglo del
   `execute` descrito en Context.
2. **PARADA: el SQL se lee antes del `db push`.** Lo lanza el usuario, siempre,
   porque pide credenciales por consola. La sesión no lo lanza ni lo simula.
3. El usuario lanza `npx supabase gen types` y `database.types.ts` conoce las
   tres vistas.
4. Se escribe el cliente contra los tipos ya regenerados.

Volver atrás es un `drop view` de las tres: la migración no altera ninguna tabla,
ninguna política y ningún `grant` de tabla.
