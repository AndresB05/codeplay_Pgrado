## Why

En la prueba preliminar del 25-sep-2026 el tutor no podía saber de un vistazo
quién estaba en clase: las tarjetas cuentan a quien jugó en las últimas 24
horas, no a quien tiene CodePlay abierto. Y con un salón entero, encontrar a un
alumno o ver quién va retrasado en las misiones obligaba a recorrer la tabla
fila a fila.

## What Changes

- **«Activos hoy» pasa a «Conectados ahora»**, en el detalle de un salón y en la
  lista de salones (la tarjeta de resumen y la cifra de cada salón). Cuenta la
  presencia en tiempo real que ya pinta el punto verde de la tabla.
- **Filtros en la tabla de seguimiento**: nombre, mundo y actividad (conectado /
  inactivo). Sólo en la vista del tutor.
- **Filtros en «Quién ha cumplido»**: los mismos tres y estado (cumplida /
  pendiente).
- No se añade ningún otro filtro: los eligió el usuario.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `salones-tutor`: el panel cuenta los conectados ahora y la tabla de
  seguimiento se puede filtrar.
- `misiones-asignadas`: la tabla de quién ha cumplido se puede filtrar.

## Impact

- `apps/web/src/components/dashboard/teacher/classroomsData.ts` —
  `getClassGroupStats` cuenta conectados en vez de activos del día.
- `apps/web/src/types/classroom.types.ts` — `ClassGroupStats`.
- `apps/web/src/components/dashboard/teacher/TeacherGroupDetailModule.tsx` y
  `TeacherGroupsModule.tsx` — las tarjetas.
- `apps/web/src/components/dashboard/shared/StudentRosterTable.tsx` — los
  filtros, sólo con el tutor.
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` — los
  filtros de «Quién ha cumplido».
- Nuevo: `apps/web/src/components/dashboard/shared/rosterFilters.ts`, con tests,
  y una barra de filtros reutilizable.
- **El store no cambia**: `onlineStudentIds` ya sale de `useClassrooms()`.
- **No toca Supabase:** ni esquema ni datos, no hace falta `db push`.
