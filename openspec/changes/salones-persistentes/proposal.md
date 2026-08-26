## Why

El módulo de salones es la única parte de la aplicación que sigue viviendo en
`localStorage` con datos de ejemplo: el niño y el tutor no comparten estado, y
la solicitud que envía uno no llega nunca al otro. Las cuatro tablas ya existen
en la base real y sus políticas están verificadas una a una con sesiones reales
(`docs/CONTEXT.md` §2.7), así que lo que queda no es diseñar el backend sino
conectarlo.

Es el paso 10 del `docs/ROADMAP.md`, y desbloquea todo lo que cuelga de un salón
de verdad: la asignación de misiones (16), los reportes sobre progreso real (17)
y las invitaciones por correo (19).

## What Changes

- Nace `services/classrooms.service.ts` con la forma `{ data, error }` del resto
  de servicios: lee salones, roster, solicitudes e invitaciones, y escribe por
  RLS —salvo aceptar, que es la RPC `accept_join_request`—.
- `ClassroomsProvider` deja de leer y escribir `localStorage` y pasa a llamar al
  servicio. Carga lo que corresponde al rol de la sesión: el tutor sus salones,
  el niño el catálogo más su propio salón.
- **BREAKING** `CURRENT_STUDENT_ID = 'guest-child'` desaparece. La identidad del
  niño pasa a ser el `id` del usuario autenticado. Sin sesión no hay salones que
  mostrar: el store queda vacío en vez de sembrar ejemplos.
- **BREAKING** Las acciones del contexto pasan a ser asíncronas. `createGroup`
  devuelve `Promise<ClassGroup | null>` en vez de `ClassGroup`, y el contexto
  gana `loading` y `error`. Las demás acciones mantienen su firma vista desde
  quien las llama, porque `Promise<void>` es asignable a `() => void`.
- **BREAKING** Se retira la semilla de
  `components/dashboard/teacher/classroomsData.ts` —y con ella `buildGroup` y
  `buildStudentFromRequest`, que sólo servían para fabricar filas locales—.
  Las funciones puras de cálculo, búsqueda y formato se quedan.
- El invariante «un alumno, un salón» deja de sostenerlo el enrutado de la
  vista: lo comprueba el store antes de escribir, y por debajo lo imponen la
  restricción, el índice parcial y el `with check` que ya trae el modelo.
- Migración **0015** con dos vistas de sólo lectura, `class_group_directory` y
  `classroom_roster`. Sin ellas, dos requisitos hoy verificados de
  `salones-alumno` se apagan en silencio al conectar Supabase: un niño no puede
  leer las filas de `class_memberships` de nadie más, así que la lista de
  compañeros saldría vacía y el buscador mostraría «0 de N cupos» en todos los
  salones, de modo que el bloqueo por salón lleno no se dispararía nunca.
- De cada compañero, el roster expone **nombre, avatar, XP y racha**, y nada
  más. Es decisión del usuario, y su motivo es que los niños se comparen dentro
  de su salón: eso cierra la parte «acotar el ranking al salón» de la pregunta
  que `ROADMAP.md` §3.2 dejó abierta, y hay que recogerlo allí al archivar
  porque el paso 22 lo necesita. XP y racha valdrán 0 hasta los pasos 21 y 22;
  las columnas ya existen, así que exponerlas ahora evita volver a migrar.
- Los reportes de habilidades del tutor pasan a calcularse sobre alumnos reales.
  Como ninguna tabla de progreso conoce todavía los salones, las cinco
  competencias marcan 0 % hasta el paso 17. Es el dato verdadero sustituyendo a
  uno inventado, no una regresión encubierta.

## Capabilities

### New Capabilities

Ninguna. El cambio no introduce ninguna capacidad nueva: mueve el origen de los
datos de una capacidad existente y amplía el esquema que ya la sostiene.

### Modified Capabilities

- `store-salones`: el origen de los datos deja de ser el almacenamiento del
  navegador y pasa a ser Supabase. Se retiran los requisitos de persistencia
  versionada y de resiembra, que describen un almacenamiento que deja de
  existir, y se añaden los de identidad de la sesión, carga asíncrona y guarda
  del invariante «un alumno, un salón».
- `backend-supabase`: se añaden las dos vistas de lectura que el cliente
  necesita —recuento de cupos del catálogo y roster de un salón— y la regla de
  que no se conceden por política sino por vista con el filtro dentro.
- `salones-tutor`: el reporte de habilidades se calcula ya sobre los alumnos
  reales del salón, y queda escrito que hasta el paso 17 esos alumnos no traen
  progreso, igual que está escrito que las invitaciones no envían correo.

## Impact

**Código que se crea**

- `apps/web/src/services/classrooms.service.ts`
- `apps/web/src/services/classrooms.service.test.ts`
- `supabase/migrations/202606030015_create_classroom_read_views.sql`

**Código que se reescribe**

- `apps/web/src/context/ClassroomsProvider.tsx` — de raíz, como estaba previsto
- `apps/web/src/context/ClassroomsContext.ts` — acciones asíncronas, `loading`, `error`
- `apps/web/src/context/ClassroomsProvider.test.tsx` — contra un servicio falso
- `apps/web/src/test/renderClassrooms.tsx` — monta el servicio falso
- `apps/web/src/components/dashboard/teacher/classroomsData.ts` — se va la semilla
- `apps/web/src/components/dashboard/teacher/classroomsData.test.ts` — sin la semilla

**Vistas que se tocan, y sólo por la asincronía**

- `apps/web/src/components/dashboard/teacher/TeacherGroupsModule.tsx` — `await createGroup(...)`
- `apps/web/src/components/dashboard/teacher/TeacherGroupDetailModule.tsx` — no anunciar «ese salón ya no existe» mientras carga
- `apps/web/src/pages/TeacherDashboard/TeacherDashboard.tsx` — igual, con el listado vacío
- `apps/web/src/components/dashboard/student/StudentClassroomModule.tsx` — igual, con el buscador

Ninguna otra vista cambia: la frontera de `useClassrooms()` aguanta el resto.

**Tipos**

`types/database.types.ts` se regenera con la CLI tras aplicar la 0015, para que
las dos vistas entren en `Database['public']['Views']`. No se edita a mano.

**Dependencia de Supabase**

Sí, y es bloqueante. La migración 0015 **exige un `npx supabase db push`, que
sólo puede lanzar el usuario**: la CLI pide credenciales por consola. El resto
del cambio se puede escribir antes, pero no se puede comprobar contra la base
hasta que la migración esté aplicada. El proyecto ya está enlazado y con las
catorce migraciones anteriores aplicadas.

**Riesgo asumido**

Los 54 tests de hoy son la red de este refactor. 19 de los 24 del store
conservan su aserto y cambian sólo de andamio; los 5 de `localStorage` mueren
con la capacidad que probaban, tal y como su propio comentario anticipa; y 6 de
`classroomsData` se van con las funciones que dejan de existir. Ningún aserto de
comportamiento se relaja para que la suite pase.
