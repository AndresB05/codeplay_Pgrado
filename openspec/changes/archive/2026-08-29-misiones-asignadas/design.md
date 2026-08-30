## Context

Ver `proposal.md` → Why para la motivación. Lo que condiciona el diseño y hay que
tener delante:

**Tres cosas que el enunciado da por hechas y no lo están.** Comprobadas contra
el disco antes de diseñar:

1. **No existen «misiones normales» en la sala de trofeos.**
   `StudentTrophiesModule` monta `AchievementList` sobre `useAchievements`, que
   lee `achievements` —el registro de logros **ya concedidos**, no un catálogo—.
   El catálogo de logros no existe y es el paso 22 (`CONTEXT.md` §4.2).
2. **Nada puede completar una misión.** Eso llega con los pasos 20 y 21.
3. **`missionCatalog` es ficción local**: cinco entradas `m1`…`m5` en
   `teacher/classroomsData.ts:159`, sin relación con las 9 filas de `levels`, y
   `assignedMissionIds` es estado del componente, independiente de
   `selectedGroupId`.

**Corrección al ancla del XP.** El encargo decía que la siembra da «100 y 120»;
son los dos primeros de nueve. `202606030012` reparte:

| Mundo | XP de sus tres niveles |
| --- | --- |
| Selva Algorítmica | 100, 120, 140 |
| Cordillera Binaria | 180, 200, 240 |
| Costa de Bugs | 150, 210, 260 |

**El techo real es 260, no 120.** Es el único XP escrito con un número en todo el
proyecto —`achievements.awarded_xp` guarda lo que dio cada logro, pero no hay
catálogo que los defina—, así que es el único ancla medible que existe para «más
XP que un nivel normal». Un premio de 130 sería «más que un nivel» sólo si se
mira el nivel más flojo.

## Goals / Non-Goals

**Goals:**

- Que la asignación sobreviva a la recarga y viaje entre sesiones y dispositivos.
- Que el selector de alcance del panel gobierne también la escritura.
- Que el niño vea lo asignado sin que se le prometa nada que no exista.
- Que el tutor vea el cumplimiento **y entienda por qué está todo pendiente**.

**Non-Goals:**

- **Ninguna tabla de cumplimientos.** Diseñarla obliga a decidir qué reporta el
  juego y con qué garantía, que es la PREGUNTA ABIERTA de `ROADMAP.md` §3.2,
  marcada como previa al paso 20. No se toma de paso.
- Ligar `mission_key` a `levels`. El catálogo sigue siendo local.
- Tocar `ClassroomsProvider`. `CONTEXT.md` §4.3 dice que esa frontera aguantó y
  se mantiene.
- Realtime. Que el niño vea la asignación sin recargar **la aplicación entera**
  se consigue recargando al montar; la notificación en vivo es el paso 18.

## Decisions

### 1. Una tabla, `mission_assignments`, con la forma de la 0013

Migración `202606030020`, con tabla, políticas y `grant` en el **mismo** archivo:
el proyecto se creó con RLS automática, así que una tabla sin ellos existe y es
inaccesible, y separarlos permite aplicar la mitad.

```sql
create table if not exists public.mission_assignments (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    mission_key text not null check (length(trim(mission_key)) > 0),
    assigned_by uuid not null references auth.users (id) on delete cascade,
    assigned_at timestamptz not null default timezone('utc', now()),
    constraint mission_assignments_group_mission_unique unique (group_id, mission_key)
);
```

**Cuelga del salón, no del tutor.** El cabo suelto de `ROADMAP.md` §3 dejaba esa
decisión abierta. Cuelga del salón porque es lo que el niño puede consultar: su
pertenencia lo liga a un salón, no a una persona. Colgarla del tutor obligaría a
que el niño supiera quién es su tutor para leer sus misiones, y hoy la vista del
niño no expone esa identidad. `assigned_by` conserva el autor, que es dato de
auditoría, no de acceso.

**`unique (group_id, mission_key)`, no `unique (mission_key)`.** La misma misión
en dos salones del mismo tutor es lo normal, no una colisión.

**`mission_key` es texto sin clave ajena, a sabiendas.** El catálogo vive en el
cliente y no hay tabla a la que apuntar; una clave ajena a `levels` sería mentira,
porque las cinco misiones no son ninguno de los nueve niveles. Queda escrito en la
migración, como hace la 0013 con sus decisiones. Lo que aguanta la integridad
mientras tanto es el cliente: una clave que no esté en el catálogo se ignora al
pintar en vez de romper la pantalla.

**El valor de `mission_key` es el `id` del catálogo** (`m1`…`m5`). Es opaco en la
base, y la alternativa —renombrar los ids a slugs— tocaría el catálogo entero por
una mejora cosmética de una tabla provisional. Cuando el catálogo se ligue a
`levels`, ese es el momento de decidir la clave definitiva y migrar las filas.

### 2. Políticas: quién lee y quién escribe

| Operación | Quién |
| --- | --- |
| `select` | El niño inscrito en el salón, o el tutor del salón |
| `insert` | El tutor del salón, y `assigned_by = auth.uid()` |
| `delete` | El tutor del salón |

Sin `update`: retirar una misión es borrar la fila, y no hay ningún campo que
tenga sentido editar. El `grant` se queda en `select, insert, delete`, como el de
`class_groups`; conceder `update` ahora sería más difícil de retirar después.

`revoke all ... from public` **y** `from anon` por separado. Revocar de `public`
no retira lo concedido directamente a un rol, que es la lección que la 0009 no
aprendió y la 0013 sí (`ROADMAP.md` §3).

### 3. Comprobación 5: el grafo, recorrido desde cada ESCRITURA

Es donde muerde. El paso 9 se aplicó con una recursión que mataba un `insert` y no
aparecía en ningún `select`, y pasó dos revisiones porque las dos miraron en la
misma dirección. Una subconsulta dentro de una política expande las políticas de
la tabla consultada, así que hay que recorrer el grafo entero desde cada
operación.

**Desde el `insert`** (la escritura que el paso 9 no miró):

```
mission_assignments.insert
  └─> class_groups        (¿es mío el salón?)
        └─> class_groups_select_authenticated  =  using (true)   ← TERMINA
```

**Desde el `delete`:** mismo camino, mismo final.

**Desde el `select`:**

```
mission_assignments.select
  ├─> class_memberships   (rama del niño)
  │     └─> class_memberships_select_related
  │           ├─ student_id = auth.uid()                          ← TERMINA
  │           └─> class_groups → using (true)                     ← TERMINA
  └─> class_groups        (rama del tutor)
        └─> using (true)                                          ← TERMINA
```

**Y desde la otra punta:** ninguna política existente consulta
`mission_assignments`, porque la tabla es nueva y nadie la referencia. **El ciclo
no puede cerrarse por ningún lado.** Si alguna vez hiciera falta consultar
`profiles` desde aquí —hoy no hace falta: ser tutor del salón ya implica el rol,
porque `class_groups_insert_own` lo exigió al crearlo—, la salida es una función
`security definer`, como hizo la 0014.

**Esto no sustituye a la comprobación con sesión real.** El razonamiento es lo que
dice dónde mirar; la prueba es `curl` con las dos cuentas y casos negativos, que
está en las tareas.

### 4. El premio: 300 / 400 / 500

`Mission` gana `xpReward: number`, y las cinco entradas lo declaran escalado por
su `difficultyLabel`:

| `difficultyLabel` | `xpReward` | Misiones |
| --- | --- | --- |
| Fácil | **300** | La ruta del leopardo, Cosecha en bucle |
| Intermedio | **400** | El puente que decide, Caza del error |
| Difícil | **500** | Plan maestro |

**Los tres valores quedan decididos aquí, no al implementar.** El más bajo (300)
supera al nivel más generoso de la siembra (260), así que cualquier misión premia
más que cualquier nivel, que es lo que la hace especial. Los saltos de 100 son
legibles para un niño y dejan sitio para intercalar valores si el catálogo crece.

Alternativa descartada: derivar el premio de `SkillKey`. La habilidad dice de qué
va la misión, no cuánto cuesta; la dificultad sí.

**El premio se muestra, no se otorga.** Nada suma XP todavía: `upsert_my_progress`
incrementa `profiles.total_xp` desde el progreso de niveles, y de misiones no sabe
nada. El número de la tarjeta es una promesa del catálogo, no un saldo.

### 5. Servicio y hook propios, sin tocar el store

Precedente: `worlds.service.ts` + `useWorlds()` y `achievements.service.ts` +
`useAchievements()`. `ClassroomsProvider` no se toca.

**Una sola lectura sirve a los dos roles.** `select *` sobre `mission_assignments`
devuelve, por RLS, las asignaciones del salón del niño o las de los salones del
tutor, según quién pregunte. El hook no necesita saber el rol ni el `groupId`: la
base ya filtra. De ahí sale, gratis, que el niño sin salón obtenga cero filas.

```
missionsService.listAssignments()                    → MissionAssignment[]
missionsService.assignMission(missionKey, groupIds)  → null
missionsService.unassignMission(missionKey, groupIds)→ null
```

`{ data, error }` con `AppError`, nunca lanza, con los motivos de la base
traducidos por código como en `classrooms.service.ts`.

**`assignMission` inserta con «no dupliques»** (`onConflict: 'group_id,mission_key'`,
`ignoreDuplicates: true`), que en PostgREST es un `on conflict do nothing` y por
eso **no exige el `grant` de `update`**. Sin eso, asignar con «Todos» a un tutor
que ya tenía la misión en uno de sus salones moriría con `23505` por una fila que
ya estaba bien.

`useMissionAssignments()` expone `{ assignments, loading, error, assign, unassign,
refresh }` y **recarga tras cada escritura**, como hace el store de salones: es
una consulta barata y evita una familia de errores de sincronía.

### 6. El niño: un componente en `shared/`, montado en dos sitios

`shared/AssignedMissionsPanel.tsx`, como `StudentRosterTable`,
`ChangePasswordPanel` y `ChangeNamePanel`. Se monta en:

- `StudentWorldsModule.tsx` — **encima** de la sección de Filtros (hoy línea 313)
- `StudentClassroomModule.tsx` — **encima** de `<StudentRosterTable>` (hoy 142)

**El panel se pinta a sí mismo o no se pinta.** Devuelve `null` mientras carga y
cuando no hay ninguna misión que enseñar, sin dejar hueco, sin título huérfano y
sin tarjeta vacía. Eso resuelve de una vez los dos casos que se ven hoy con las
cuentas de `.env`: el niño **sin salón** —que no tiene tutor que le asigne nada— y
el niño **con salón y sin misiones asignadas**. Si la lectura falla, el panel sí
dice que falló: callar un error es afirmar que no hay misiones.

**Ningún botón que prometa jugar.** La tarjeta lleva título, descripción, la
habilidad, la dificultad, el premio en XP y una línea que dice que la misión
llegará con el juego. No hay `onClick` en ninguna parte.

**Una clave desconocida se ignora.** Como `mission_key` no tiene clave ajena, una
fila puede apuntar a una misión que ya no está en el catálogo; se descarta al
resolver en vez de pintar una tarjeta rota.

### 7. El tutor: el alcance manda, y el cumplimiento se explica

En `TeacherPanelModule.tsx`, `assignedMissionIds` desaparece y su lugar lo ocupa
lo que devuelve el hook, cruzado con `scopedGroups`:

| Salones del alcance que la tienen | Qué muestra la tarjeta |
| --- | --- |
| Todos | «Asignada», y el botón la retira |
| Algunos | «En N de M salones», y el botón la asigna al resto |
| Ninguno | «Asignar misión» |
| No hay salones | Botón deshabilitado, con el motivo |

**Apartado «Cumplimiento», sólo con un salón concreto elegido.** Con «Todos» no
hay lista que enseñar sin mezclar alumnos de salones distintos.

Se pinta como **una tabla: los alumnos en filas y las misiones asignadas en
columnas**, con «Pendiente» en cada celda. La alternativa —una tarjeta por misión
con la lista completa del salón dentro— repite el mismo roster tantas veces como
misiones haya y no añade ni un dato. La tabla ancha va en un contenedor con
desplazamiento horizontal propio; el panel del tutor no es responsive y eso es del
paso 25 (`CONTEXT.md` §4.4), pero al menos no lo empeora.

**Encima de la tabla, el motivo, visible sin desplegar nada:** nadie puede
cumplirlas hasta que el juego reporte el progreso (paso 21). Es lo que separa «no
lo ha hecho nadie» de «esto está roto». El salón sin alumnos lo dice en vez de
enseñar una tabla vacía.

## Risks / Trade-offs

- **`mission_key` sin clave ajena admite cualquier texto** → El `check` exige que
  no esté vacío, y el cliente ignora las claves que no reconoce. La integridad de
  verdad llega cuando el catálogo tenga tabla, y hasta entonces el único escritor
  es la aplicación, que sólo manda ids del catálogo.
- **El catálogo es local: si cambia, las filas guardadas quedan colgando** → Se
  ignoran al pintar. Retirar una entrada del catálogo no rompe nada, pero deja
  filas huérfanas en la base; hoy son cinco entradas fijas y nadie las edita.
- **La tabla de cumplimiento enseña una columna por misión** → Con las cinco
  asignadas son cinco columnas; el desplazamiento horizontal las absorbe. Si el
  catálogo creciera mucho, habría que paginar o elegir misión, y para entonces el
  estado ya no será constante y la pantalla tendrá que rehacerse igualmente.
- **Todo «Pendiente» puede leerse como un fallo** → Por eso el motivo es un
  requisito del spec y no una nota al pie. Es la decisión del usuario.
- **El niño no ve la asignación en el mismo instante en que el tutor la hace** →
  El hook recarga al montar, así que basta con entrar a la pantalla; el vivo es el
  paso 18. Sin esto habría que meter Realtime en un paso que no lo pide.
- **`database.types.ts` se queda corto hasta que el usuario regenere** → El
  servicio no compila contra una tabla que los tipos no conocen, así que el orden
  de las tareas es rígido: `db push`, luego `gen types`, y sólo después el
  servicio. No se edita el archivo a mano por ningún motivo (`CLAUDE.md`).

## Migration Plan

1. Se escribe `202606030020_create_mission_assignments.sql`.
2. **Parada.** La sesión que revisa lee el SQL **antes** del `db push`
   (`ROADMAP.md` §1.3, comprobación 9).
3. **El usuario lanza `npx supabase db push`** —pide credenciales por consola— y
   se lee la salida: tiene que aplicar la 0020 y **ninguna más**. Si arrastra
   otras, hay migraciones sin aplicar en la base y eso se mira antes de seguir.
4. **El usuario lanza `npx supabase gen types typescript --linked >
   apps/web/src/types/database.types.ts`**, por el mismo motivo.
5. Verificación por `curl` con las dos cuentas de `.env` y casos negativos, antes
   de escribir una sola línea de interfaz.
6. Servicio, hook, y después las tres pantallas.

**Vuelta atrás.** La tabla es nueva y nada la referencia: borrarla con un `drop
table ... cascade` deja el esquema exactamente como estaba. Ningún dato anterior
depende de ella, así que la vuelta atrás no pierde nada que existiera antes.
