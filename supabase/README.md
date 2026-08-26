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

## Cómo aplicarlo

Si ya tienes el proyecto Supabase enlazado con la CLI:

```sh
supabase db push
```

Para reiniciar en local, aplicando de nuevo las quince migraciones —siembra
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
