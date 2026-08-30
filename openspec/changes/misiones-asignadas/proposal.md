## Why

Hoy una misión no es nada. `missionCatalog` son cinco entradas inventadas en
`apps/web/src/components/dashboard/teacher/classroomsData.ts:159`, el tutor las
«asigna» a un estado local que se pierde al recargar, el selector de alcance del
panel **se ignora** —`assignedMissionIds` no depende de `selectedGroupId`—, y el
niño no las ve en ninguna parte. Es el paso 16 del roadmap y el cabo suelto de
`ROADMAP.md` §3.

El usuario pide dos cosas: que lo que el tutor asigna **le llegue al niño aunque
todavía no se pueda jugar**, y que el tutor vea **quién la cumplió y quién no**.

## What Changes

- **Migración `202606030020`**: tabla `mission_assignments` —salón, clave de
  misión, quién asignó y cuándo—, con la misión asignada **una sola vez por
  salón**. Políticas de RLS y `grant` en el **mismo** archivo, como la 0013.
- **`mission_key` es texto sin clave ajena**, a sabiendas: el catálogo vive en el
  cliente y no hay tabla a la que apuntar. Queda escrito en el SQL.
- **El catálogo gana el premio en XP.** `Mission` incorpora `xpReward` y las cinco
  entradas lo declaran, escalado por su `difficultyLabel`. Son misiones
  especiales: **todas por encima del nivel más generoso de la siembra**.
- **El selector de alcance deja de ignorarse.** Con un salón elegido se asigna a
  ese salón; con «Todos», a todos los del tutor, y una misión sólo se ve
  «Asignada» si **todos** la tienen. Sin salones, los botones quedan
  deshabilitados: hoy se puede «asignar» sin tener ni un salón.
- **Apartado de cumplimiento para el tutor**, sólo con un salón concreto elegido.
  Como nada puede completar una misión, sale **todo el salón en «Pendiente»**, y
  la pantalla **dice por qué**: una lista de pendientes sin explicar parece un
  fallo.
- **El niño ve sólo las asignadas**, en dos sitios: encima de los Filtros de
  «Mundos» y encima de la tabla de compañeros de «Mi salón». Sin salón, o con
  salón y sin misiones, **no se pinta nada**. Ningún botón promete jugar.
- **NO se crea tabla de cumplimientos.** El estado se **calcula**. Diseñarla
  obligaría a decidir qué reporta el juego y con qué garantía, que es la pregunta
  abierta de `ROADMAP.md` §3.2, previa al paso 20.
- Servicio y hook propios —`missions.service.ts` + `useMissionAssignments()`—,
  siguiendo el precedente de `worlds.service.ts` + `useWorlds()`.
  **`ClassroomsProvider` no se toca** (`CONTEXT.md` §4.3).

## Capabilities

### New Capabilities

- `misiones-asignadas`: qué es una misión, quién puede asignarla y a qué salón,
  qué ve el niño de las asignadas, y por qué el cumplimiento sale todo pendiente.
  Cruza los dos roles, así que no cabe entero ni en `salones-tutor` ni en
  `contenido-mundos`.

### Modified Capabilities

- `backend-supabase`: requisito nuevo para el esquema de la asignación de
  misiones —tabla, unicidad por salón, cascada al borrar el salón y `mission_key`
  como texto sin clave ajena—.
- `salones-tutor`: el requisito «Selector de alcance del panel» pasa a gobernar
  también la asignación de misiones, no sólo las métricas y los reportes.

## Impact

**Base de datos.** Una migración nueva,
`supabase/migrations/202606030020_create_mission_assignments.sql`. **Necesita un
`supabase db push`, que lo lanza el usuario** porque la CLI pide credenciales por
consola. Después hace falta **regenerar `apps/web/src/types/database.types.ts`**
con `npx supabase gen types typescript --linked`, que el usuario lanza por el
mismo motivo: el servicio se tipa contra la fila generada y no a mano.

**Código nuevo**

- `apps/web/src/services/missions.service.ts`
- `apps/web/src/hooks/useMissionAssignments.ts`
- `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.tsx`

**Código modificado**

- `apps/web/src/types/classroom.types.ts` — `Mission` gana `xpReward`
- `apps/web/src/components/dashboard/teacher/classroomsData.ts` — las cinco
  entradas del catálogo declaran su premio
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` — la sección
  «Asignación de misiones» se conecta y aparece el apartado de cumplimiento
- `apps/web/src/components/dashboard/student/StudentWorldsModule.tsx` — el panel,
  encima de la sección de Filtros (hoy línea 313)
- `apps/web/src/components/dashboard/student/StudentClassroomModule.tsx` — el
  panel, encima de `<StudentRosterTable>` (hoy línea 142)

**Documentación**: `docs/CONTEXT.md` —§2.3, §2.7, §3, la nota de que las misiones
**no son funcionales todavía**, y dos sitios que la capacidad nueva deja falsos:
una **§2.8 propia** con la forma de las otras siete, porque §0.2 promete que los
identificadores de §2 se usan tal cual como `<capability-path>`, y el recuento de
la propia §0.2, que pasa a 8 capacidades y **pierde el número de requisitos**
(dice 40; son 71)—, `docs/ROADMAP.md` (fila 16 y retirada del cabo suelto de §3)
y `openspec/config.yaml`.

**Fuera de alcance**: jugar una misión, completarla, cualquier escritura de
progreso, y ligar el catálogo a `levels`.
