## Why

Tres pantallas que ya existen se quedan viejas sin avisar. El tutor no ve entrar
una solicitud hasta que recarga; el niño no ve que lo aceptaron, lo rechazaron o
lo sacaron del salón; y no ve la misión que su tutor acaba de asignarle. Los dos
diseños que lo aplazaron lo dejaron escrito con nombre y apellido —«Tiempo real
[…] Supabase Realtime es el paso 18» en
`archive/2026-08-27-salones-persistentes/design.md:43`, y «la notificación en
vivo es el paso 18» en `archive/2026-08-29-misiones-asignadas/design.md:51`—, y
ese es exactamente el alcance de este cambio.

Ahora, porque el escenario para verlo funcionar existe hoy y no durará: la base
de pruebas conserva a propósito el salón `CP-5J6H` «salon sigma» con dos
miembros y dos misiones asignadas (`docs/CONTEXT.md` §2.7), y desde el 2 de
septiembre de 2026 hay una **segunda cuenta de tutor** en `apps/web/.env`, que es
lo que permite medir los casos negativos con dos tutores de verdad.

**Esto no son notificaciones.** No hay campana, ni lista de avisos, ni no leídos,
ni nada que persista un aviso: son las mismas pantallas de siempre,
actualizándose solas. La palabra «notificaciones» aparece una única vez en todo
el repositorio, en la fila 18 de `docs/ROADMAP.md`, y no la respalda ninguna
maqueta ni ningún requisito.

## What Changes

- **Migración `202606030021`**: se añaden `join_requests`, `class_memberships` y
  `mission_assignments` a la publicación `supabase_realtime`, que **existe y hoy
  tiene cero tablas** —comprobado en el panel el 2 de septiembre de 2026, system
  id 16430, con `insert`, `update`, `delete` y `truncate` los cuatro activos—.
  Una publicación vacía no emite un solo evento. La migración **no crea la
  publicación ni toca sus operaciones**: ya están.
- **Requiere `db push`, que sólo lanza el usuario.** No requiere `gen types`:
  publicar una tabla no cambia el esquema, así que `database.types.ts` no se
  toca.
- `classrooms.service.ts` gana `subscribeToClassrooms`, y `missions.service.ts`
  gana `subscribeToAssignments`. Las dos devuelven su cancelación. **La
  suscripción entra por el servicio**, no por `supabase` dentro del provider: la
  frontera de `docs/CONTEXT.md` §4.3 se mantiene, y el servidor falso de los
  tests gana la capacidad de emitir eventos.
- `ClassroomsProvider` y `useMissionAssignments` se suscriben cuando hay sesión y
  recargan al recibir un evento.
- **Una recarga disparada desde fuera deja de levantar `loading`.** Es el defecto
  del paso 13 entrando por otra puerta: hoy `refresh()` hace `setLoading(true)`
  en los dos hooks, así que cada evento blanquearía el panel del tutor entero,
  pondría un spinner sobre la pantalla del salón y haría **desaparecer** el panel
  de misiones del niño, que devuelve `null` mientras carga. Se retira el
  `setLoading(true)` del camino silencioso y **se conservan todos los
  `setLoading(false)`**, porque la guarda `loadId` convierte lo contrario en un
  spinner encendido para siempre.

**Fuera de alcance, y a propósito:** superficie nueva de avisos, sonido,
insignias de no leído, presencia («quién está conectado») y cualquier tabla o
fila que persista un aviso. Si aparece la tentación de una tabla, es que el
alcance se desbordó.

## Capabilities

### New Capabilities

Ninguna. Todo lo que se sincroniza son pantallas que ya existen.

### Modified Capabilities

- `backend-supabase`: la base publica en vivo los cambios de tres tablas, con lo
  que eso alcanza y lo que no —los `delete` no los filtra la RLS—.
- `store-salones`: el store se suscribe a los cambios de su sesión y recarga
  solo; una recarga que no pidió quien mira no declara espera.
- `salones-tutor`: la bandeja de solicitudes se puebla sin recargar.
- `salones-alumno`: el niño ve la decisión del tutor y su retirada sin recargar.
- `misiones-asignadas`: el niño ve la misión asignada o retirada sin recargar.

## Impact

**Base de datos** — depende del proyecto de Supabase, que ya está enlazado y con
el esquema aplicado. Este cambio **añade migración**, así que necesita un
`npx supabase db push`, **que sólo puede lanzar el usuario** porque pide
credenciales por consola. La parada de `docs/ROADMAP.md` §1.3 (comprobación 9)
aplica: el `db push` no se lanza hasta que la sesión que revisa haya leído el
SQL y lo haya dicho. **No** hace falta `gen types`.

- `supabase/migrations/202606030021_publish_realtime_tables.sql` (nuevo)
- `supabase/README.md` — una entrada más en el detalle migración por migración

**Código**

- `apps/web/src/services/classrooms.service.ts` — `subscribeToClassrooms`
- `apps/web/src/services/missions.service.ts` — `subscribeToAssignments`
- `apps/web/src/context/ClassroomsProvider.tsx` — suscripción y recarga silenciosa
- `apps/web/src/hooks/useMissionAssignments.ts` — lo mismo
- `apps/web/src/test/fakeClassroomsService.ts` — capacidad de emitir eventos
- `apps/web/src/context/ClassroomsProvider.test.tsx`,
  `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.test.tsx` —
  tests nuevos, incluido uno por hook que fija que un evento no vuelve a levantar
  `loading`

**No se toca**: `apps/web/src/config/env.ts` —`VITE_DEV_TUTOR2_*` es para `curl` y
para abrir una segunda sesión, no lo lee ningún código—,
`apps/web/src/types/database.types.ts`, ni ninguna vista: las tres pantallas
afectadas (`pages/TeacherDashboard/TeacherDashboard.tsx`,
`components/dashboard/student/StudentClassroomModule.tsx`,
`components/dashboard/shared/AssignedMissionsPanel.tsx`) se arreglan dejando de
recibir un `loading` que no les corresponde, no cambiando su código.

**Documentación**: `docs/CONTEXT.md` §2.5, §2.7 y §2.8, `docs/ROADMAP.md` §2 y
§2.2, y `openspec/config.yaml`.
