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

## Cómo aplicarlo

Si ya tienes el proyecto Supabase enlazado con la CLI:

```sh
supabase db push
```

Para reiniciar en local, aplicando de nuevo las doce migraciones —siembra
incluida—:

```sh
supabase db reset
```

**Toda migración nueva debe traer sus propias políticas y sus `grant`.** El
proyecto se creó con RLS automática y sin exposición automática de tablas, así
que una tabla sin ellos existe pero es inaccesible.

## Notas de seguridad

- Las tablas con datos sensibles no aceptan escrituras directas desde el cliente.
- Las escrituras principales quedan encapsuladas en RPCs para reducir manipulación directa.
- `achievements` queda solo de lectura para el cliente autenticado; su otorgamiento debería venir de lógica segura adicional si más adelante añades Edge Functions o SQL controlado.
- La vista `leaderboard_weekly` expone solo campos seguros para ranking semanal.
