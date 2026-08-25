# Backend de Supabase para CodePlay

Este directorio contiene solo la capa backend basada en Supabase:

- `migrations/`: esquema SQL, funciones RPC, trigger, RLS y vista del leaderboard.
- `seed.sql`: contenido inicial de mundos y niveles.

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

## Cómo aplicarlo

Si ya tienes el proyecto Supabase enlazado con la CLI:

```sh
supabase db push
```

Si quieres reiniciar y cargar el seed en local:

```sh
supabase db reset
```

## Notas de seguridad

- Las tablas con datos sensibles no aceptan escrituras directas desde el cliente.
- Las escrituras principales quedan encapsuladas en RPCs para reducir manipulación directa.
- `achievements` queda solo de lectura para el cliente autenticado; su otorgamiento debería venir de lógica segura adicional si más adelante añades Edge Functions o SQL controlado.
- La vista `leaderboard_weekly` expone solo campos seguros para ranking semanal.
