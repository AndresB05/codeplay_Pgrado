# Backend de Supabase para CodePlay

Este directorio contiene solo la capa backend basada en Supabase:

- `migrations/`: esquema SQL, funciones RPC, trigger, RLS, vista del leaderboard
  y el contenido inicial de mundos y niveles.

No hay `seed.sql`. `db push` no ejecuta el seed —sólo lo hace `db reset` en
local—, así que el contenido nunca llegaba al proyecto remoto. Vive en la
migración 0012 y se aplica como todo lo demás.

## Estructura

1. `202606030001_base_extensions.sql`
   - Extensión `pgcrypto` y trigger helper para `updated_at`.
2. `202606030002_create_profiles.sql`
   - Tabla `profiles`.
3. `202606030003_create_learning_content.sql`
   - Tablas `worlds` y `levels`.
4. `202606030004_create_progress_tracking.sql`
   - Tablas `user_progress` y `level_attempts`.
5. `202606030005_create_achievements.sql`
   - Tabla `achievements`.
6. `202606030006_create_rpc_functions.sql`
   - RPCs seguras para `update_my_profile`, `create_level_attempt` y `upsert_my_progress`.
7. `202606030007_create_profile_trigger.sql`
   - Trigger `on_auth_user_created` para crear `profiles` automáticamente.
8. `202606030008_create_weekly_leaderboard_view.sql`
   - Vista `leaderboard_weekly`.
9. `202606030009_enable_rls_and_policies.sql`
   - RLS, políticas y permisos.
10. `202606030010_add_profile_role.sql`
    - Columna `profiles.role` y disparador que la rellena desde el registro.
11. `202606030011_profile_role_enum.sql`
    - Convierte `role` al enum `user_role` y retira el check redundante.
12. `202606030012_seed_learning_content.sql`
    - Mundos y niveles iniciales. Era `seed.sql`.
13. `202606030013_create_classroom_tables.sql`
    - Las cuatro tablas de salones —`class_groups`, `class_memberships`,
      `join_requests` e `invitations`—, sus índices, sus políticas, sus `grant`
      y la RPC `accept_join_request`, **todo en un solo archivo**: una tabla y su
      acceso no deben poder aplicarse por mitades. Añade además una segunda
      política de lectura a `profiles` para que el tutor vea el nombre de sus
      alumnos, sin tocar la que ya existía.

14. `202606030014_fix_profiles_policy_recursion.sql`
    - Corrige una recursión de RLS que traía la 0013: insertar una solicitud de
      ingreso moría con `42P17`, porque su política consulta `profiles` y
      `profiles_select_own_students` consultaba a su vez `join_requests`. La
      condición pasa a una función `security definer`, que no expande políticas.
      **La 0013 no se edita**: ya estaba aplicada, y corregirla en el sitio
      dejaría el repositorio describiendo un esquema que ninguna base ha tenido.

15. `202606030015_create_classroom_read_views.sql`
    - Dos vistas de sólo lectura: `class_group_directory`, el catálogo de
      salones más el recuento de alumnos de cada uno, y `classroom_roster`, la
      lista de un salón vista por su tutor o por quien pertenece a él.
    - **Por qué vistas y no políticas.** Sin ellas, un niño no puede leer las
      filas de `class_memberships` de nadie más que él, así que la lista de
      compañeros sale vacía y el buscador muestra «0 de N cupos» en todos los
      salones. Ampliar la política de lectura de `class_memberships` con una
      rama «o pertenezco a ese salón» la haría consultar la tabla que protege:
      recursión, la misma familia de fallo que arregló la 0014, y que aparece
      antes al escribir que al leer. Esta migración **no toca ninguna política**.
    - Ninguna de las dos declara `security_invoker = true`, así que no aplican la
      RLS de las tablas que consultan: el filtro de a quién alcanza cada una va
      escrito **dentro** de la vista y es lo primero que hay que leer al
      revisarlas. El linter de Supabase las marca como `security_definer_view`;
      está previsto.
    - **Qué expone el roster:** `full_name`, `avatar_key`, `total_xp` y
      `current_streak`, y ninguna otra columna de `profiles`. Ni correo, ni
      país, ni nombre de usuario. XP y racha están para que los niños se
      comparen dentro de su salón; hoy valen 0 para todos hasta que el juego
      escriba progreso. El recuento del catálogo es un agregado: dice si un
      salón está lleno, nunca quién está dentro.

16. `202606030016_drop_invitation_email.sql`
    - Elimina `invitations.email`, **el único sitio del esquema donde se
      almacenaba el correo de alguien sin cuenta**: lo escribía el tutor, no su
      dueño, y en una plataforma para niños ese tercero puede ser un menor. Nada
      lo borraba nunca y la finalidad que lo justificaba —el envío, que es el
      paso 19— no ocurre.
    - **Se elimina la columna en vez de dejar de escribirla:** dejar de escribir
      no borra lo que ya está dentro, y una columna viva se vuelve a llenar en
      cuanto alguien la encuentre disponible, sin volver a hacerse la pregunta.
      **La tabla se queda**: el token, la caducidad, las políticas y la cascada
      siguen sirviendo para el paso 19. Ninguna política ni ningún `grant` se
      tocan.
    - *(Entrada añadida durante el paso 15: la 0016 se aplicó sin documentarse
      aquí, y el listado tenía un hueco.)*

17. `202606030017_create_set_my_role_rpc.sql`
    - `set_my_role(input_role text)`, `security definer`, para fijar el rol del
      perfil **después** del alta. Hace falta porque `signInWithOAuth` no admite
      metadatos: una cuenta creada con Google nace `child` por el disparador de
      la 0011 aunque quien se registró eligiera «Tutor», y la 0009 revoca la
      escritura directa sobre `profiles`.
    - `auth.uid()` se lee **dentro del cuerpo y nunca es parámetro**, que es lo
      que hace imposible fijar el rol de otra persona. Sin sesión, `42501`.
      Parámetro `text` y no el enum: con el enum, un valor inválido muere en la
      conversión de PostgREST con un error que no dice nada útil; así el rechazo
      es explícito con `22023`, y el enum sigue siendo la última defensa.

18. `202606030018_lock_profile_role.sql`
    - Añade `profiles.is_role_declared`, hace **backfill a `true`** de todas las
      filas existentes, y reemplaza el disparador y `set_my_role`. **La 0017 no
      se edita**, por lo mismo que la 0014 no editó la 0013.
    - **Por qué.** Supabase **enlaza identidades por correo verificado**, así que
      entrar con Google con el correo de una cuenta que ya existe no crea usuario
      —le añade el proveedor— y el disparador no corre. Sin esta migración,
      `set_my_role` alcanzaba a esa cuenta: un niño con membresía que entrara
      desde el registro eligiendo «Tutor» quedaba `tutor`, **fuera de su propio
      salón y sin vuelta atrás por la interfaz**. El rol es la reja de
      `class_groups_insert_own` y `join_requests_insert_own`, así que cambiarlo
      no es editar un campo: es dejar una cuenta sin sitio.
    - **El cierre cuelga de dos condiciones, no de una.** La marca corta a quien
      **ya eligió** (`ZC001`); los **lazos de salón** —membresía, solicitud
      `pending` o salón propio— cortan a quien **ya construyó algo** con el rol
      que tiene (`ZC002`). La marca sola dejaba una ventana permanente: una
      cuenta nacida del botón de la pantalla de acceso queda sin declarar para
      siempre. El rol y la marca se escriben en **la misma sentencia**, para que
      no quede un instante con el rol fijado y todavía cambiable.
    - La clase `ZC` de los dos `SQLSTATE` cae en el tramo `I`-`Z` que el estándar
      deja a la implementación, y no es ninguna de las dos que PostgreSQL ocupa
      (`P0` y `XX`).
    - **Pega conocida, anotada y no corregida:** la 0017 comprobaba `if not
      found` **después** del `update`; ésta sólo lo hace tras el `select`. Si el
      perfil desapareciera entre las dos sentencias, la función devolvería `null`
      en vez de `P0002` y el cliente vería un error de PostgREST. Ventana de
      microsegundos y **no produce dato corrupto**. No se corrige en el sitio
      porque ya está aplicada; **que la recoja la próxima migración que toque
      esta función.**

## Cómo aplicarlo

Si ya tienes el proyecto Supabase enlazado con la CLI:

```sh
supabase db push
```

Para reiniciar en local, aplicando de nuevo las dieciocho migraciones —siembra
incluida—:

```sh
supabase db reset
```

**Toda migración nueva debe traer sus propias políticas y sus `grant`.** El
proyecto se creó con RLS automática y sin exposición automática de tablas, así
que una tabla sin ellos existe pero es inaccesible.

Al revocar, `revoke ... from public` **no** retira lo concedido directamente a un
rol: hay que revocar de `anon` aparte, o una tabla podría nacer legible sin
sesión si el esquema tuviera privilegios por defecto para ese rol. La migración
0013 lo hace; las anteriores sólo revocan de `public`.

Las funciones también: PostgreSQL concede `execute` a `public` por defecto, así
que una RPC nueva necesita su `revoke` antes de su `grant`.

**Cuando una política consulte otra tabla, comprueba el ciclo desde cada
escritura, no sólo desde las lecturas.** La 0013 se aplicó con una recursión que
sólo aparecía al insertar, nunca al leer, y por eso pasó dos revisiones.

## Notas de seguridad

- Las tablas con datos sensibles no aceptan escrituras directas desde el cliente.
- Las escrituras principales quedan encapsuladas en RPCs para reducir manipulación directa.
- `achievements` queda solo de lectura para el cliente autenticado; su otorgamiento debería venir de lógica segura adicional si más adelante añades Edge Functions o SQL controlado.
- La vista `leaderboard_weekly` expone solo campos seguros para ranking semanal.
