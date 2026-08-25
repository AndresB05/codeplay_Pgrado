## Why

Las nueve migraciones de `supabase/migrations/` describen un esquema completo que
**nunca se ha aplicado a ninguna base de datos**. Comprobado hoy contra el
proyecto real: las credenciales de `apps/web/.env` funcionan
(`/auth/v1/settings` responde 200) y cualquier consulta a una tabla devuelve
404 `PGRST205`, «no existe en el cache del esquema». La base está vacía.

Mientras siga así, todo lo demás está bloqueado. P2 (`auth-real`) necesita la
columna `profiles.role`, que hoy no existe en ninguna migración. P3
(`salones-persistentes`) necesita las tablas de salones, que tampoco existen.
Y `apps/web/src/types/database.types.ts` —el archivo del que dependen los siete
servicios para tipar sus consultas— está **escrito a mano y describe un esquema
imaginario**: declara `role`, `email`, `avatar_url`, `streak_days` y `xp`,
mientras que `profiles` tiene `username`, `full_name`, `avatar_key`,
`country_code`, `total_xp`, `current_streak` y `max_streak`.

Esa última parte es lo que hace urgente el cambio: hoy el proyecto compila
porque los tipos mienten de forma consistente. En cuanto se conecte una consulta
real, fallará en tiempo de ejecución sin que TypeScript haya avisado.

## What Changes

- Se añade la CLI de Supabase como `devDependency` de la raíz y se usa vía
  `npx`. En Windows la instalación global por npm no está soportada.
- **Migración nueva** con la columna `profiles.role` (`'child' | 'tutor'`, por
  defecto `'child'`) y la actualización de `handle_new_user_profile()` para que
  tome el rol de los metadatos del registro. `authService.signUp()` ya los envía;
  hoy el disparador los ignora.
- Se aplican **todas** las migraciones contra el proyecto real: las nueve
  existentes, que nunca se aplicaron, más la nueva.
- Se regenera `apps/web/src/types/database.types.ts` con la CLI, sustituyendo el
  archivo escrito a mano.
- **BREAKING (interno):** al regenerar los tipos desaparecen los cinco campos
  inventados. Se reescriben los consumidores que dependían de ellos —
  `types/user.types.ts`, `types/progress.types.ts`, `services/profile.service.ts`,
  `services/leaderboard.service.ts` y los componentes que leen `user.xp`,
  `user.streakDays` y `user.email`. No es un cambio observable para el usuario:
  esas pantallas ya mostraban valores por defecto porque no hay datos reales.
- **`profileService.updateProfile()` pasa a llamar a la función RPC
  `update_my_profile`**. La migración 009 revoca `update` sobre `profiles` a
  `authenticated`, así que la escritura directa que hace hoy dejaría de
  funcionar en cuanto el esquema exista.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `backend-supabase`: el Purpose declara que el esquema «todavía no se ha
  aplicado a ninguna base de datos» y que los requisitos «describen el contrato
  que el esquema establece, no un sistema en funcionamiento». Con este cambio
  deja de ser cierto y hay que reescribirlo. Además se añade el requisito del
  rol en el perfil, que hoy no existe en ninguna parte del esquema.
- `contenido-mundos`: el requisito «Sala de trofeos» promete listar los logros
  «distinguiendo los obtenidos de los pendientes». Al aplicar el esquema se
  descubre que la tabla `achievements` es el registro de logros concedidos y no
  un catálogo de definiciones, así que no hay forma de saber qué está pendiente.
  El requisito se reescribe para describir lo que el sistema hace de verdad —
  listar lo conseguido— en vez de mantener una promesa que el esquema no
  sostiene.

## Impact

**Base de datos**

| Archivo | Cambio |
| --- | --- |
| `supabase/migrations/202606030001_base_extensions.sql` … `..._0009_enable_rls_and_policies.sql` | Sin tocar. Se aplican por primera vez |
| `supabase/migrations/<nueva>_add_profile_role.sql` | **Nuevo.** Columna `role` + `handle_new_user_profile()` actualizada |
| `supabase/README.md` | Actualizar: deja de describir un esquema sin aplicar |

**Tipos y servicios**

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/types/database.types.ts` | **Regenerado** con la CLI. Deja de escribirse a mano |
| `apps/web/src/types/user.types.ts` | Reescribir `User` sobre las columnas reales |
| `apps/web/src/types/progress.types.ts` | `LeaderboardEntry` sobre las columnas reales de la vista |
| `apps/web/src/services/profile.service.ts` | Nuevo mapeo y escritura vía RPC |
| `apps/web/src/services/leaderboard.service.ts` | Nuevo mapeo |

**Componentes que leen los campos que desaparecen**

`Sidebar.tsx`, `SidebarPlayerCard.tsx`, `StudentTopBar.tsx`,
`StudentSettingsModule.tsx`, `TeacherSettingsModule.tsx`, `WelcomeBanner.tsx`.
Todos usan la forma `user?.campo || <valor por defecto>`, así que el ajuste es
mecánico.

**Tests**

`apps/web/src/test/renderClassrooms.tsx` construye un `User` de prueba con los
nueve campos actuales; hay que actualizarlo. Los 54 tests existentes no tocan
Supabase, así que deben seguir pasando sin más cambios.

**Documentación**

`docs/CONTEXT.md`: este cambio **sí** entra en la lista. Es P1
(`backend-supabase-real`), no herramienta, así que al archivarlo la entrada pasa
de §3 a §2 con las rutas reales, y hay que retirar §4.1 y la mitad de §4.2 que
este cambio resuelve.

**Dependencia de Supabase: es el cambio que la resuelve.** El proyecto ya existe
y está operativo — ése era el bloqueo que arrastraban todos los demás cambios y
que este cierra. Lo que **no** puede hacerse desde aquí es la ejecución:
`supabase login`, `supabase link` y `supabase db push` piden credenciales por
consola de forma interactiva. Los ejecuta el usuario en su terminal, con la
contraseña de la base de datos, que no pasa por el chat ni se guarda en ninguna
variable de entorno del repositorio. El diseño y las tareas están partidos en
dos mitades alrededor de esa pausa.

**Fuera de alcance.** Las tablas de salones (`class_groups`,
`class_memberships`, `join_requests`, `invitations`) siguen sin existir después
de este cambio: son P3. §4.2 de `docs/CONTEXT.md` sólo se resuelve a medias.
