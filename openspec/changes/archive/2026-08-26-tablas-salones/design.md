## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño y no está allí:

- **El proyecto de Supabase se creó con «automatic RLS» marcada y «expose new
  tables» desmarcada.** Una tabla nueva nace con RLS activa, sin políticas y sin
  `grant`: existe y es inaccesible. Por eso `supabase/README.md` ya avisa de que
  toda migración nueva debe traer sus políticas y sus `grant`.
- **El modelo vivo de la interfaz es `apps/web/src/types/classroom.types.ts`.**
  `ClassGroup` anida `students`, `pendingRequests` e `invitations`; en SQL eso
  son cuatro tablas. El mapeo entre ambas formas es del paso 10, pero las
  columnas de aquí tienen que dar de sí para reconstruir ese objeto.
- **Las tablas existentes referencian `auth.users (id)`**, no `public.profiles`,
  y usan `timezone('utc', now())` como default de las marcas de tiempo. Estas
  cuatro siguen esa convención.
- **Las migraciones 0010 y 0011 costaron dos `db push` fallidos** por alterar una
  columna con un `check` y un `default` colgando de ella. Aquí no se altera
  ninguna columna existente: son tablas nuevas. La única pieza preexistente que
  se toca es `profiles`, y sólo para añadirle una política más.
- **La sesión de invitado (`guest-child`) no es un usuario de `auth.users`.**
  Nada de la aplicación escribirá en estas tablas hasta el paso 10, así que la
  incompatibilidad no se manifiesta todavía; la resuelve el paso 11, con usuarios
  de prueba reales.

## Goals / Non-Goals

**Goals:**

- Que las cuatro tablas queden accesibles el mismo día que existen: política y
  `grant` en el mismo archivo que el `create table`.
- Que «un alumno, un salón» sea imposible de violar desde el cliente, venga la
  escritura por donde venga.
- Que el paso 10 pueda escribir el servicio sin volver a migrar: las columnas que
  ese paso necesita están todas aquí.
- Que la migración sea reejecutable sin romperse (`if not exists`,
  `drop policy if exists`, `create or replace`).

**Non-Goals:**

- Generar el ID público en SQL. Hoy lo genera `generatePublicId()` en el cliente
  y la base sólo impone que sea único.
- Cualquier función que el paso 10 pueda escribir como una sola sentencia.
- Vistas o agregados para el panel del tutor. Los recuentos de `ClassGroupStats`
  se calculan hoy en el cliente con funciones puras; moverlos a SQL es una
  optimización sin datos que la justifiquen.

## Decisions

### 1. Un solo archivo: tablas, restricciones, políticas, `grant` y la RPC

La alternativa era separar en `0013_create_classroom_tables.sql` y
`0014_classroom_rls_and_policies.sql`, imitando la estructura que sí tienen las
tablas anteriores (0002…0009). Se descarta: esa separación es justo la que dejó
al proyecto con las políticas en una migración aparte y una regla escrita en el
README para recordar que esa segunda mitad no puede olvidarse. Con un archivo, la
tabla y su acceso no pueden divergir ni aplicarse por mitades.

### 2. `class_memberships` guarda `joined_at`

Decisión pendiente en el ROADMAP §3.1, resuelta aquí. Las tres opciones que allí
se plantean para el paso 17 —mostrar todo el historial, mostrarlo desde la fecha
de ingreso, o preguntar al niño— sólo se distinguen en **qué se enseña**; dos de
las tres necesitan la fecha, y ninguna se estropea por tenerla.

La asimetría es lo que decide: guardar la fecha y no usarla no cuesta nada; no
guardarla y quererla después obliga a inventarla para las pertenencias ya
creadas. Se guarda, y **la decisión de privacidad sigue abierta** para el paso
17, junto al consentimiento del acudiente del paso 14.

### 3. Escrituras: RLS para las filas propias, una RPC sólo para aceptar

`profiles`, `user_progress` y `level_attempts` escriben exclusivamente por RPC.
Extender ese patrón a los salones significaría unas ocho funciones —crear,
borrar, solicitar, cancelar, salir, rechazar, invitar, retirar— y adelantar a
esta migración el diseño del servicio del paso 10.

La línea se traza por **cuánto tiene que comprobar cada escritura**:

| Operación | Vía | Por qué |
| --- | --- | --- |
| Crear y borrar salón, invitar, rechazar, retirar a un alumno | RLS | Fila propia o fila de un salón propio: la condición cabe en un `using` |
| Solicitar ingreso, cancelar, salir | RLS | Fila cuyo `student_id` es `auth.uid()` |
| **Aceptar una solicitud** | **RPC** | Escribe dos tablas y comprueba cuatro cosas a la vez |

Aceptar es la única operación que no cabe en una sentencia: hay que verificar que
quien acepta es el tutor del salón, que la solicitud está pendiente, que el salón
tiene cupo y que el niño no pertenece ya a otro, y después escribir la pertenencia
y marcar la solicitud. Partirlo en dos sentencias desde el navegador deja una
ventana en la que el niño es miembro con la solicitud aún pendiente —y esa
solicitud pendiente choca contra el índice único parcial, así que el siguiente
intento del niño fallaría por un motivo que nadie sabría explicar.

`accept_join_request(request_id uuid)` sigue la forma de las RPC existentes:
`language plpgsql`, `security definer`, `set search_path = public`, y
`raise exception` con `errcode` explícito. No se le concede `execute` a `anon`.

**El cupo hay que bloquearlo, no sólo contarlo.** Contar las pertenencias y
comparar con `capacity` tiene una carrera: dos aceptaciones simultáneas leen el
mismo recuento, las dos lo encuentran por debajo del cupo y las dos insertan.
`unique (student_id)` no salva nada, porque son alumnos distintos. La función
empieza bloqueando la fila del salón:

```sql
select capacity into group_capacity
from public.class_groups
where id = target_group_id
for update;
```

A partir de ahí el recuento es estable hasta el commit y la segunda transacción
espera. El bloqueo va **antes** de contar, y siempre sobre la misma fila —la del
salón—, de modo que dos aceptaciones concurrentes no puedan tomar los bloqueos en
orden distinto.

### 4. Ciclo de vida completo de una solicitud

`join_requests` lleva `status` con `check (status in ('pending','accepted','rejected'))`
y `resolved_at`. La alternativa —borrar la fila al aceptar o rechazar— haría
innecesario el índice parcial, pero perdería el registro de que un tutor rechazó
a un niño, que es exactamente el dato que hará falta si alguna vez hay que
explicarle al niño por qué no entró.

Conservar el rechazo obliga a decidir **quién puede sacar a un niño de ese
estado**, o el registro se convierte en una condena: sin camino de vuelta, un
niño rechazado queda excluido de ese salón para siempre y en la interfaz no hay
ningún botón que lo arregle.

| Transición | Quién la escribe | Cómo |
| --- | --- | --- |
| Nace `pending` | el niño | `insert`, si no es miembro de ningún salón y no tiene otra pendiente |
| `pending` → desaparece | el niño | `delete` de su **propia fila pendiente**. Cancelar es un acto propio y no deja rastro que justificar |
| `pending` → `rejected` | el tutor | `update` acotado por política a solicitudes pendientes de sus salones |
| `pending` → `accepted` | la RPC | `accept_join_request`, nunca por escritura directa |
| `rejected` o `accepted` | nadie | La fila queda inmutable |

**Reabrir una solicitud rechazada no es un `update`: es una fila nueva.** Por eso
**no** existe `unique (group_id, student_id)`, que es lo que la versión anterior
de este diseño llevaba. Esa restricción hacía imposible las dos vueltas atrás
razonables: el niño rechazado no podía volver a pedir entrar al mismo salón, y
—menos evidente y peor— tampoco podía hacerlo un niño que se había ido de un
salón por su propio pie. El historial se acumula en filas; la unicidad la impone
sólo el índice parcial sobre las pendientes.

Tres consecuencias que hay que aceptar a la vez:

- El niño **no** tiene `update` sobre `join_requests`. Nada suyo puede tocar una
  fila ya resuelta, así que no puede borrar su rechazo ni disfrazarlo.
- El `delete` del niño va acotado a `status = 'pending'`. Sin esa condición podría
  borrar el rechazo y reinsertar, que es justo lo que la decisión pretende evitar.
- El `update` del tutor lleva `with check (status = 'rejected')`. Sin él, un tutor
  podría marcar una solicitud como `accepted` por escritura directa y saltarse la
  RPC —y con ella el cupo, el bloqueo y la pertenencia—, dejando a un niño con la
  solicitud aceptada y sin salón.

`resolved_at` no lo escribe quien hace el `update`: lo pone un disparador
`before update` cuando el estado sale de `pending`. Así el dato es consistente
venga la escritura del tutor o de la RPC, sin depender de que el cliente se
acuerde de mandar la marca de tiempo.

**Lo que esto obliga al paso 10:** un mismo par `(student_id, group_id)` puede
tener varias filas —una resuelta y una pendiente nueva—, así que la solicitud
vigente se busca ordenando por `requested_at` y quedándose con la última. Una
consulta con `.single()` de supabase-js reventaría con `PGRST116` en cuanto un
niño vuelva a pedir entrar a un salón donde ya lo intentó.

**Lo que esto deja abierto:** un niño rechazado puede volver a solicitar tantas
veces como quiera, de una en una. No hay enfriamiento ni límite. Es molesto para
el tutor en el peor caso y no tiene arreglo barato que no invente política de
producto, así que se asume; si algún día molesta de verdad, se resuelve con una
condición sobre `requested_at` en la política de inserción.

### 5. «Un alumno, un salón» se impone en tres sitios, no en uno

| Dónde | Qué impide |
| --- | --- |
| `unique (student_id)` en `class_memberships` | Pertenecer a dos salones |
| Índice único parcial sobre `join_requests (student_id) where status = 'pending'` | Dos solicitudes pendientes a la vez |
| `with check` de la política de inserción de solicitudes | Pedir entrar a otro salón **siendo ya miembro** |

Los dos primeros son restricciones; el tercero no puede serlo, porque cruza dos
tablas. Va en la política, que exige `student_id = auth.uid()` y que no exista
ninguna fila en `class_memberships` con ese `student_id`. La subconsulta se
evalúa bajo las políticas de `class_memberships`, y el niño ve su propia
pertenencia, así que la comprobación funciona sin privilegios extra.

### 6. Se **añade** una política de lectura a `profiles`, no se reemplaza la que hay

`profiles_select_own` se queda tal cual. Junto a ella se crea
`profiles_select_own_students`, que deja al tutor leer el perfil de los niños con
pertenencia o solicitud pendiente en sus salones. Las políticas permisivas se
combinan con OR, así que añadir no quita nada a nadie —y la migración no puede
degradar el acceso que hoy funciona.

Sin esta política el panel del tutor mostraría una lista de alumnos sin nombres,
y el paso 10 descubriría el problema con el servicio ya escrito.

Riesgo de recursión: la política de `profiles` consulta `class_memberships`, cuya
política consulta `class_groups`, cuya política de lectura es incondicional para
`authenticated`. La cadena termina y ninguna política se consulta a sí misma.

### 7. Las políticas de inserción comprueban el rol contra `profiles.role`

Crear un salón exige `role = 'tutor'`; solicitar ingreso exige `role = 'child'`.
Es el primer uso real de la columna que añadió la migración 0010, y la razón por
la que el rol vive en la base y no sólo en la sesión del navegador. La subconsulta
sólo lee la fila propia, que `profiles_select_own` ya permite.

### 8. `tutor_id` y `teacher_name` conviven

`ClassGroup` tiene `teacherName`, un texto libre que el tutor escribe al crear el
salón —«Sr. Robot» en la semilla— y que no tiene por qué coincidir con su nombre
de perfil. `tutor_id` es la identidad que sostiene las políticas. Son dos cosas
distintas y se guardan por separado; unificarlas es una decisión de producto que
no toca a esta migración.

### 9. `invitations` nace con token y caducidad, aunque nadie los use

`EmailInvitation` en la interfaz sólo tiene correo, fecha y estado. El token y la
caducidad son de P5, pero añadirlos ahora cuesta dos columnas y evita migrar otra
vez una tabla que para entonces ya tendrá datos. La caducidad por defecto son 14
días.

El token se genera con **`extensions.gen_random_bytes(24)`, calificado con su
esquema**. La migración 0001 instala `pgcrypto` con `with schema extensions`, y
ninguna de las doce migraciones aplicadas llama a una sola función suya: no hay
precedente de que resuelva sin calificar. `gen_random_uuid()`, que sí usan todas
las tablas, no prueba nada al respecto —es del core desde PostgreSQL 13 y aquí
corre 17.6—. Si el `search_path` de la sesión que aplica la migración no incluye
`extensions`, un `gen_random_bytes` a secas mata el `db push` con un 42883, y ese
push lo lanza el usuario a mano contra la base real.

### 10. Menos permisos de los que se podrían dar

No hay `grant update` sobre `class_groups`: editar un salón no existe en la
interfaz y está en P5 sin prioridad. Tampoco hay política de inserción sobre
`class_memberships`: la única vía es la RPC, que corre como `security definer`.
Cuando P5 traiga la edición de salones, añadirá su política; es más barato que
retirar un permiso que ya lleva meses concedido.

### Esquema resultante

```sql
create table if not exists public.class_groups (
    id uuid primary key default gen_random_uuid(),
    tutor_id uuid not null references auth.users (id) on delete cascade,
    public_id text not null unique check (public_id ~ '^CP-[A-Z0-9]{4}$'),
    name text not null check (length(trim(name)) > 0),
    grade_label text not null default '',
    teacher_name text not null default '',
    capacity integer not null default 30 check (capacity between 1 and 100),
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.class_memberships (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    student_id uuid not null references auth.users (id) on delete cascade,
    joined_at timestamptz not null default timezone('utc', now()),
    created_at timestamptz not null default timezone('utc', now()),
    constraint class_memberships_student_unique unique (student_id)
);

create table if not exists public.join_requests (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    student_id uuid not null references auth.users (id) on delete cascade,
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'rejected')),
    requested_at timestamptz not null default timezone('utc', now()),
    resolved_at timestamptz
);

create table if not exists public.invitations (
    id uuid primary key default gen_random_uuid(),
    group_id uuid not null references public.class_groups (id) on delete cascade,
    invited_by uuid not null references auth.users (id) on delete cascade,
    email text not null,
    token text not null unique
        default encode(extensions.gen_random_bytes(24), 'hex'),
    status text not null default 'pending'
        check (status in ('pending', 'accepted', 'expired')),
    expires_at timestamptz not null default timezone('utc', now()) + interval '14 days',
    sent_at timestamptz not null default timezone('utc', now()),
    accepted_at timestamptz
);
```

La única unicidad sobre `join_requests` es el índice parcial de las pendientes
(decisión 4). Un mismo niño puede acumular varias filas para el mismo salón —una
rechazada y otra nueva—, y el paso 10 tiene que contar con ello: la solicitud
vigente de un niño es **la pendiente**, no «la suya», y la bandeja del tutor
filtra por `status = 'pending'`.

## Risks / Trade-offs

**El correo del alumno no está en `profiles`.** La lista del salón muestra nombre
e iniciales, que sí están, pero cualquier pantalla futura que quiera el correo del
niño no lo tiene: `profiles` no guarda correo y la política nueva no abre
`auth.users`. → No se mitiga aquí; se anota. Si hace falta, será una decisión con
arista de privacidad, no un `select` más.

**`unique (student_id)` cierra la puerta a pertenecer a varios salones**, que está
en P5 como pendiente sin prioridad. → Retirar una restricción única es una
migración de una línea; la escritura desordenada que evita mientras tanto no se
arregla igual de barato. Se asume.

**Las políticas que consultan otras tablas cuestan un `select` por fila.** Con
salones de 30 niños es irrelevante; conviene saberlo antes de que alguien lo
descubra con un salón de 3.000. → Los índices por `group_id` y `student_id`
cubren esas subconsultas.

**El `db push` puede fallar y dejar la migración a medias.** → El archivo sólo
crea objetos nuevos y se aplica dentro de una transacción; si falla, no queda
nada a medio crear. La reejecución es segura por construcción:
`create table if not exists`, `create index if not exists`, `drop policy if
exists` antes de cada `create policy`, y `create or replace function`. Esa
propiedad se revisa **leyendo el SQL**, no ejecutándolo dos veces: `db push` no
reaplica una migración ya registrada, y montar el stack local con Docker sólo
para comprobarlo cuesta la descarga entera y no reproduce el caso.

**El riesgo real del push no es la reejecución, es el esquema de `pgcrypto`.**
→ Ver decisión 9: la llamada va calificada como `extensions.gen_random_bytes`.
Es el único punto del archivo que depende del `search_path` de quien aplica.

**Regenerar `database.types.ts` toca un archivo del que dependen siete
servicios.** → Este cambio sólo **añade** cuatro tablas al tipo `Database`; no
retira ni renombra nada, así que ningún consumidor actual puede romperse.
`npm run build` lo confirma.

## Migration Plan

1. Escribir `supabase/migrations/202606030013_create_classroom_tables.sql`.
2. **Pausa.** `npx supabase db push` pide la contraseña de la base por consola y
   la terminal de la sesión no es interactiva. Los comandos se le entregan al
   usuario y la implementación se detiene hasta que confirme.
3. Verificar por HTTP con la clave publishable de `apps/web/.env` que las cuatro
   tablas existen: un 200 o un 401 por RLS valen igual; lo que no vale es
   404 `PGRST205`. Ese 404 justo después del push puede ser el cache de esquema
   de PostgREST, que tarda en refrescarse: se reintenta antes de dar la tabla
   por ausente.
4. Regenerar los tipos y pasar `lint`, `test:run` y `build`.

**Vuelta atrás.** No hay datos que perder: las tablas nacen vacías y ningún
código las escribe hasta el paso 10. Deshacer es una migración nueva con cuatro
`drop table ... cascade` y el `drop policy` de la política añadida a `profiles`.

## Open Questions

**Cómo se canjea una invitación sin romper el invariante del ingreso.** El
requisito dice que la pertenencia nace siempre de una solicitud aceptada, y una
invitación canjeada crearía una pertenencia sin solicitud. La salida natural es
que el canje **cree la solicitud y la acepte en el acto**, reutilizando
`accept_join_request` en vez de abrir una segunda puerta a `class_memberships`.
No se decide aquí porque el canje es P5 y no cambia ni el esquema ni las tareas
de este cambio; se deja anotado para que P5 no lo resuelva por el camino corto.
