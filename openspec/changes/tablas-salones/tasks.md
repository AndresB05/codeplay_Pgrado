## 1. La migración: tablas y restricciones

Archivo nuevo `supabase/migrations/202606030013_create_classroom_tables.sql`.
Las doce migraciones existentes no se tocan.

- [x] 1.1 Crear el archivo con marca de tiempo posterior a `202606030012`, siguiendo la serie `20260603xxxx`. Verificación: `ls supabase/migrations/` lo ordena último.
- [x] 1.2 Declarar `class_groups` con `tutor_id` hacia `auth.users (id) on delete cascade`, `public_id` único con `check (public_id ~ '^CP-[A-Z0-9]{4}$')`, `name`, `grade_label`, `teacher_name`, `capacity` con `check (capacity between 1 and 100)` y las dos marcas de tiempo con `timezone('utc', now())` (design, Esquema resultante). Verificación: el SQL declara el `unique` de `public_id` y el `check` del formato.
- [x] 1.3 Declarar `class_memberships` con `group_id` hacia `class_groups (id) on delete cascade`, `student_id` hacia `auth.users`, **`joined_at`** (design, decisión 2) y `constraint class_memberships_student_unique unique (student_id)`. Verificación: el SQL contiene la restricción única sobre `student_id` a secas, no sobre el par con `group_id`.
- [x] 1.4 Declarar `join_requests` con `status` acotado por `check` a `pending`/`accepted`/`rejected`, `requested_at` y `resolved_at`, y **sin** restricción única sobre `(group_id, student_id)`: reabrir una solicitud rechazada es una fila nueva, y esa restricción la impediría —igual que impediría volver a pedir entrar a un salón del que el niño se fue por su propio pie— (design, decisión 4). Verificación: el SQL no borra filas al resolverlas y no declara `unique (group_id, student_id)`.
- [x] 1.5 Declarar `invitations` con `group_id`, `invited_by`, `email`, `token` único con default `encode(extensions.gen_random_bytes(24), 'hex')` —**calificado con el esquema**—, `status`, `expires_at` a 14 días y `accepted_at` (design, decisión 9). Verificación: la llamada lleva el prefijo `extensions.`; la migración 0001 instala `pgcrypto` con `with schema extensions` y ninguna migración aplicada llama a una función suya, así que sin calificar el `db push` puede morir con 42883.
- [x] 1.6 Añadir el índice único **parcial** `join_requests_one_pending_per_student_idx` sobre `(student_id) where status = 'pending'`, más los índices por `group_id` de las tres tablas hijas y por `student_id` de `class_memberships` y `join_requests` (design, decisión 5). Verificación: el índice de solicitudes lleva la cláusula `where`; sin ella impediría también las rechazadas.
- [x] 1.7 Enganchar `class_groups` al trigger `set_current_timestamp_updated_at` que ya existe desde la migración 0001, con `drop trigger if exists` delante. Verificación: el patrón coincide con el de `handle_profiles_updated_at` en la migración 0002.
- [x] 1.8 Añadir un disparador `before update` sobre `join_requests` que ponga `resolved_at` cuando el estado sale de `pending` (design, decisión 4). Verificación: una solicitud rechazada por el tutor queda con `resolved_at` sin que el cliente mande esa columna.

## 2. La migración: RLS, políticas y `grant`

Van en el **mismo archivo** que las tablas (design, decisión 1). El proyecto se
creó con RLS automática y sin exposición automática: sin esto, las cuatro tablas
existen y son inaccesibles.

- [x] 2.1 `alter table ... enable row level security` en las cuatro tablas. Verificación: las cuatro aparecen con RLS activa en `pg_tables`/`pg_class` tras el push.
- [x] 2.2 Políticas de lectura: `class_groups` legible por cualquier `authenticated` —lo exige el buscador del niño—; `class_memberships`, `join_requests` e `invitations` legibles sólo por el niño dueño de la fila o por el tutor del salón (specs, «Acceso a los datos de un salón acotado por pertenencia»). Verificación: ninguna de las tres últimas tiene una política que devuelva filas a un `authenticated` sin relación con el salón.
- [x] 2.3 Políticas de escritura del tutor: `insert` en `class_groups` con `tutor_id = auth.uid()` **y** rol `tutor` en `profiles` (design, decisión 7); `delete` de sus propios salones; `insert` y `delete` de invitaciones de sus salones; `delete` de pertenencias de sus salones; `update` de solicitudes **pendientes** de sus salones, con `with check (status = 'rejected')` (design, decisión 4). Verificación: cada política nombra `auth.uid()`, ninguna permite tocar un salón ajeno, y el `update` de solicitudes no admite `accepted`: aceptar por escritura directa se saltaría el cupo y dejaría al niño sin pertenencia.
- [x] 2.4 Políticas de escritura del niño: `insert` en `join_requests` con `student_id = auth.uid()`, rol `child`, y `not exists` de pertenencia previa (design, decisión 5); `delete` de su propia solicitud **acotado a `status = 'pending'`** —cancelar—; `delete` de su propia pertenencia —salir—. **Sin política de `update`** sobre `join_requests` (design, decisión 4). Verificación: el `with check` de la inserción contiene la subconsulta contra `class_memberships`, y el niño no tiene ningún camino para tocar una solicitud ya resuelta: ni borrar su rechazo ni reescribirlo.
- [x] 2.5 **No** crear política de `insert` sobre `class_memberships`: la única vía es la RPC (design, decisión 10). Verificación: el archivo no contiene ninguna política `for insert` sobre esa tabla.
- [x] 2.6 Añadir `profiles_select_own_students` **sin tocar** `profiles_select_own`: el tutor lee el perfil de los niños con pertenencia o solicitud pendiente en sus salones (design, decisión 6). Verificación: `profiles_select_own` sigue textualmente en la base y la política nueva es una segunda entrada, no un reemplazo.
- [x] 2.7 `revoke all ... from public, anon` y `grant` mínimos sobre las cuatro tablas a `authenticated`: `select, insert, delete` donde haga falta y `update` sólo en `join_requests`. Sin `update` sobre `class_groups` (design, decisión 10). Verificación: el archivo no concede ningún permiso a `anon`.
- [x] 2.8 Poner `drop policy if exists` delante de cada `create policy` y usar `create ... if not exists` en tablas e índices, más `drop trigger if exists` y `create or replace function`, para que la migración sea reejecutable. Verificación: **por lectura del SQL**, comprobando que ninguna sentencia del archivo falla si el objeto ya existe. No se levanta el stack local para ejecutarla dos veces: `db push` no reaplica una migración ya registrada y montar Docker no reproduce el caso.

## 3. La migración: `accept_join_request`

- [x] 3.1 Escribir `accept_join_request(request_id uuid)` en el mismo archivo, con `language plpgsql`, `security definer` y `set search_path = public`, siguiendo la forma de las RPC de la migración 0006. Verificación: la firma y las cláusulas coinciden con las de `upsert_my_progress`.
- [x] 3.2 Comprobar dentro de la función, con `raise exception` y `errcode` explícito en cada caso: que hay sesión, que la solicitud existe y está `pending`, que quien llama es el tutor del salón, que el salón no ha alcanzado su `capacity` y que el niño no tiene ya pertenencia (specs, «El ingreso a un salón pasa siempre por una solicitud aceptada» y «El cupo del salón se respeta al aceptar»). Verificación: las cinco comprobaciones están en el cuerpo y ninguna se delega al cliente.
- [x] 3.3 Bloquear la fila del salón con `select ... from public.class_groups where id = ... for update` **antes** de contar las pertenencias (design, decisión 3). Verificación: el `for update` está en el cuerpo y precede al recuento. Sin él, dos aceptaciones simultáneas leen el mismo recuento y las dos insertan: el salón se pasa del cupo y `unique (student_id)` no lo impide, porque son alumnos distintos.
- [x] 3.4 Insertar la pertenencia y marcar la solicitud como `accepted` en la misma función; `resolved_at` lo pone el disparador de la tarea 1.8. Verificación: no existe ningún camino que deje al niño como miembro con la solicitud todavía `pending`.
- [x] 3.5 `revoke execute` a `public` y `anon`, `grant execute` a `authenticated`. Verificación: el archivo contiene ambas sentencias; PostgreSQL concede `execute` a `public` por defecto y sin el `revoke` quedaría abierta.

## 4. PAUSA: aplicar la migración (lo ejecuta el usuario)

`npx supabase db push` pide la contraseña de la base por consola y la terminal de
esta sesión no es interactiva (design, Migration Plan).

- [x] 4.1 Entregar al usuario el comando exacto y **detener la implementación** hasta que confirme. Verificación: el comando está escrito en el chat y no se ha tocado ningún archivo más.
- [x] 4.2 Cuando confirme, verificar por HTTP con la clave publishable de `apps/web/.env` que las cuatro tablas existen: `class_groups`, `class_memberships`, `join_requests` e `invitations`. Verificación: ninguna responde 404 `PGRST205`; un 200 o un 401 por RLS valen igual, porque ambos prueban que la tabla existe. Un `PGRST205` inmediatamente después del push puede ser el cache de esquema de PostgREST y no una tabla ausente: reintentar antes de diagnosticar nada.
- [x] 4.3 Comprobar que `anon` no lee ninguna de las cuatro. Verificación: la consulta sin sesión devuelve vacío o 401, nunca filas.
- [x] 4.4 Anotar qué **no** queda verificado: las políticas por rol y por pertenencia no se pueden probar de verdad sin dos usuarios reales, que llegan en el paso 11. Verificación: la limitación queda escrita en `docs/CONTEXT.md`, no sólo en el chat.

## 5. Tipos generados

- [x] 5.1 Regenerar `apps/web/src/types/database.types.ts` con `npx supabase gen types typescript --linked`, nunca a mano. Verificación: el archivo contiene las cuatro tablas nuevas y la función `accept_join_request`, y conserva las anteriores.
- [x] 5.2 Comprobar que no se rompió ningún consumidor: el cambio sólo añade tablas al tipo `Database`. Verificación: `npm run build` pasa sin errores nuevos.

## 6. Documentación

- [x] 6.1 Añadir la entrada 13 a la lista de migraciones de `supabase/README.md`, describiendo que trae tablas, RLS, `grant` y la RPC en un solo archivo. Verificación: el README menciona `202606030013_create_classroom_tables.sql`.
- [x] 6.2 En `docs/CONTEXT.md`: mover P1 `tablas-salones` de §3 a §2.7 con la ruta real de la migración, retirar §4.2 entera —ya no faltan las tablas— y recoger en §2.7 la decisión de `joined_at` y la limitación de la tarea 4.4. Verificación: §4.2 ya no describe un problema vigente y §3 no conserva una P1 aplicada.
- [x] 6.3 En `docs/ROADMAP.md`: marcar el paso 9 como ✅ con el nombre del cambio, y actualizar §3.1 para que diga que la fecha de ingreso **ya se guarda** y que lo que sigue abierto es qué historial se muestra, en el paso 17. Verificación: §3.1 deja de pedir una decisión que ya está tomada.
- [x] 6.4 En `openspec/config.yaml`, corregir el bloque `context`, que hoy afirma que «falta la columna profiles.role y las tablas de salones», habla de «9 migraciones SQL» y de un `seed.sql` que ya no existe; y la regla de `proposal` que dice que el proyecto de Supabase «hoy no lo está» enlazado, cuando lo está desde `backend-supabase-real`. Verificación: `npx openspec doctor` no reporta errores de parseo.

## 7. Verificación final

- [x] 7.1 `npm run lint`. Verificación: 0 errores y 0 warnings.
- [x] 7.2 `npm run test:run`. Verificación: los 54 tests siguen pasando. Este cambio no toca código de la aplicación: si alguno falla, es una señal, no un test que ajustar.
- [x] 7.3 `npm run build`. Verificación: `tsc && vite build` termina sin errores con los tipos regenerados.
- [x] 7.4 `npx openspec validate tablas-salones`. Verificación: el cambio sigue siendo válido tras la implementación.
- [x] 7.5 Comprobar que la aplicación arranca y navega igual que antes con la sesión de invitado: este cambio no debe alterar ninguna pantalla. Verificación: `npm run dev`, entrar como *Niño* y como *Profesor*, y ver los salones de `localStorage` sin errores en consola.
