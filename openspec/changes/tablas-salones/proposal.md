## Why

El módulo de salones es la parte más desarrollada de la aplicación —panel del
tutor, buscador del niño, solicitudes, invitaciones— y **no tiene ni una tabla en
la base de datos**. Las doce migraciones de `supabase/migrations/` cubren
perfiles, contenido, progreso, logros y ranking; ninguna corresponde a
`ClassGroup`, `StudentMembership`, `JoinRequest` ni `EmailInvitation`. Todo ese
estado vive hoy en una clave de `localStorage` sembrada con datos de ejemplo.

Es el paso 9 del roadmap y lo único que queda de P1. Bloquea a P3
(`salones-persistentes`), que no puede escribir un servicio contra tablas que no
existen.

Además hay un invariante que se pierde si estas tablas nacen sin él. Hoy
«un alumno, un salón» lo sostiene el enrutado de `StudentClassroomModule`, que
sólo monta el buscador cuando `membership.status === 'none'`; `requestJoin()` no
comprueba nada. En cuanto la escritura deje de pasar obligatoriamente por esa
vista, el invariante desaparece. Nace aquí, en el modelo, o no nace.

## What Changes

- **Una migración nueva**, `202606030013_create_classroom_tables.sql`, con las
  cuatro tablas (`class_groups`, `class_memberships`, `join_requests`,
  `invitations`), sus índices y sus restricciones.
- **Sus políticas de RLS y sus `grant` van en el mismo archivo.** El proyecto se
  creó con RLS automática y sin exposición automática de tablas: una tabla sin
  política y sin `grant` existe pero es inaccesible. No se separa en dos
  migraciones para que la tabla y su acceso no puedan divergir.
- **«Un alumno, un salón» pasa al modelo**: `unique (student_id)` en
  `class_memberships`, más un índice único parcial sobre `join_requests`
  restringido a `status = 'pending'`. Y una comprobación en la política de
  inserción de solicitudes: quien ya es miembro de un salón no puede pedir
  entrar a otro.
- **Las solicitudes resueltas se conservan y son inmutables para el niño**, que
  sólo puede cancelar la suya mientras siga pendiente. Volver a pedir entrar
  —tras un rechazo, o después de haberse ido de un salón— es una solicitud
  nueva, no la reapertura de la anterior: así el rechazo sobrevive y el niño no
  se queda sin camino de vuelta.
- **`class_memberships` guarda `joined_at`.** Decisión del ROADMAP §3.1 tomada
  en este paso: se guarda la fecha. Guardarla no decide qué historial ve el
  tutor —eso sigue siendo del paso 17—, sólo mantiene abiertas las tres opciones
  de §3.1. No guardarla cierra una de ellas de forma irreversible.
- **Una sola función RPC**, `accept_join_request`. Aceptar una solicitud escribe
  dos tablas y tiene que comprobar a la vez el cupo del salón, que la solicitud
  está pendiente, que quien acepta es el tutor de ese salón y que el niño no
  pertenece ya a otro. Eso no cabe en dos sentencias sueltas desde el navegador.
  El resto de escrituras —crear salón, borrarlo, solicitar ingreso, cancelar,
  salir, rechazar, invitar, retirar a un alumno— son operaciones sobre filas
  propias y van por políticas de RLS.
- **Una política de lectura nueva sobre `profiles`.** Hoy `profiles_select_own`
  deja a cada persona ver sólo su propia fila, así que un tutor no podría leer
  el nombre de sus alumnos: la lista del salón saldría vacía de nombres. Se
  **añade** una segunda política —no se toca la existente— que permite al tutor
  leer los perfiles de los niños con pertenencia o con solicitud pendiente en
  sus salones.
- Se regenera `apps/web/src/types/database.types.ts` con la CLI.

**No cambia nada de lo que el usuario ve.** La aplicación sigue leyendo y
escribiendo `localStorage` a través de `useClassrooms()` hasta el paso 10. Esta
migración deja las tablas en pie y vacías.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `backend-supabase`: hoy su Purpose declara que «no hay tablas para el módulo
  de salones». Deja de ser cierto. Se añaden los requisitos del esquema de
  salones: las cuatro tablas y sus relaciones, el invariante «un alumno, un
  salón» sostenido por la base, el ingreso sólo por solicitud aceptada, el cupo
  respetado al aceptar, la fecha de ingreso registrada y el acceso a los datos
  de un salón acotado por pertenencia.

`salones-tutor`, `salones-alumno` y `store-salones` **no se tocan**: describen lo
que hace la aplicación, y la aplicación no cambia de comportamiento en este paso.

## Impact

**Base de datos**

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/202606030013_create_classroom_tables.sql` | **Nuevo.** Cuatro tablas, índices, restricciones, RLS, `grant` y la RPC `accept_join_request` |
| `supabase/README.md` | Añadir la entrada 13 a la lista de migraciones |

Las doce migraciones existentes **no se tocan**. Esta no convierte ni restringe
ninguna columna ya poblada, así que no aplica la lección de las migraciones 0010
y 0011 —desmontar lo que depende de una columna antes de alterarla—. Lo único
preexistente que se modifica es la tabla `profiles`, y sólo para **añadirle** una
política de lectura junto a la que ya tiene.

**Tipos**

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/types/database.types.ts` | **Regenerado** con `npx supabase gen types typescript --linked`. Nunca a mano |

`apps/web/src/types/classroom.types.ts` **no se toca**. Es el modelo vivo de la
interfaz y el mapeo entre él y las filas de la base es trabajo del paso 10.

**Código de la aplicación**

Ninguno. No hay servicio nuevo, ni cambios en `ClassroomsProvider`, ni en
ninguna vista. Los 54 tests no tocan Supabase y deben seguir pasando sin
modificación: si alguno falla, es una señal, no un test que arreglar.

**Documentación**

- `docs/CONTEXT.md`: P1 pasa de §3 a §2 con la ruta real, y §4.2 —«faltan las
  tablas de salones»— se retira entera.
- `docs/ROADMAP.md`: paso 9 a ✅, y §3.1 recoge que la fecha de ingreso ya se
  guarda, con la decisión de privacidad todavía abierta para el paso 17.
- `openspec/config.yaml`: su bloque `context` afirma que «falta la columna
  profiles.role y las tablas de salones» y habla de «9 migraciones SQL» y de un
  `seed.sql` que ya no existe. Se corrige lo que este cambio deja obsoleto.

**Dependencia de Supabase.** El proyecto **ya existe, está enlazado y tiene el
esquema aplicado** desde `backend-supabase-real` (25-ago-2026); ése era el
bloqueo que arrastraban los demás cambios de backend y está resuelto. Lo que
sigue sin poder hacerse desde aquí es la ejecución: `npx supabase db push` pide
la contraseña de la base por consola, y la terminal de esta sesión no es
interactiva. La implementación se parte en dos mitades alrededor de esa pausa:
se prepara la migración, se entregan los comandos al usuario, y se continúa con
la regeneración de tipos cuando confirme.

**Fuera de alcance.** El servicio `classrooms.service.ts` y la reescritura de
`ClassroomsProvider` (paso 10). El envío real de correos y el canje del token de
invitación (P5): la columna del token y su caducidad se crean aquí para no
volver a migrar la tabla, pero nadie las usa todavía. Editar o archivar un salón,
que no existe en la interfaz. Y la política de qué historial ve el tutor de un
niño que jugó antes de entrar al salón, que es del paso 17.
