## 1. Herramienta: CLI de Supabase

- [ ] 1.1 Instalar `supabase` como `devDependency` de la raíz con `npm install -D supabase`, sin `-w`: es herramienta del monorepo, no del workspace `@codeplay/web`. En Windows la instalación global por npm no está soportada, así que se usa siempre vía `npx` (design, decisión 8). Verificación: `npx supabase --version` imprime una versión.

## 2. Migración del rol (antes de la pausa)

Archivo nuevo en `supabase/migrations/`. Las nueve existentes no se tocan.

- [ ] 2.1 Crear la migración con marca de tiempo **posterior a `202606030009`** —no basta con que sea posterior a la 0002 que crea la tabla— y nombre descriptivo, p. ej. `202606030010_add_profile_role.sql` (design, Risks). Verificación: el archivo ordena último en `ls supabase/migrations/`.
- [ ] 2.2 Añadir en esa migración la columna `role` a `public.profiles`: `text not null default 'child'` con `check (role in ('child','tutor'))`, no un tipo enum (design, decisión 2). Verificación: el SQL declara el `check` y el `default`.
- [ ] 2.3 En la misma migración, reescribir `public.handle_new_user_profile()` con `create or replace` para que inserte también `role`, leyéndolo de `new.raw_user_meta_data ->> 'role'` y **cayendo a `'child'` si el valor falta o no es `child` ni `tutor`** (design, decisión 3). Verificación: el SQL contempla el valor inválido sin dejar que llegue al `check`.
- [ ] 2.4 Comprobar que la migración conserva el resto del cuerpo del disparador —normalización de `username`, comprobación de duplicado, `full_name`, `avatar_key`, `country_code`— y no sólo añade el rol. Verificación: comparar contra `202606030007_create_profile_trigger.sql`; los campos anteriores siguen presentes.

## 3. PAUSA: aplicar el esquema (lo ejecuta el usuario)

`supabase login`, `link` y `db push` piden credenciales por consola y la
contraseña de la base de datos no debe pasar por el chat ni por ninguna variable
de entorno del repositorio (design, decisión 4).

- [ ] 3.1 Entregar al usuario los tres comandos exactos, con el `project-ref` tomado del subdominio de `VITE_SUPABASE_URL` en `apps/web/.env`, y **detener la implementación** hasta que confirme. Verificación: los comandos están escritos en el chat y la ejecución está detenida.
- [ ] 3.2 Cuando el usuario confirme, verificar por HTTP con la clave publishable de `.env` que las tablas existen: consultar `profiles`, `worlds` y `levels`. Verificación: ninguna responde 404 `PGRST205`; un 200 o un 401 por RLS valen igual, porque ambos prueban que la tabla existe (design, decisión 4).

## 4. Tipos generados (después de la pausa)

- [ ] 4.1 Regenerar `apps/web/src/types/database.types.ts` con `npx supabase gen types typescript --linked`, sobrescribiendo el archivo escrito a mano. Verificación: el archivo contiene `role` en `profiles` y las columnas reales `username`, `avatar_key`, `country_code`, `total_xp`, `current_streak`, `max_streak`, y ya **no** contiene `email`, `avatar_url`, `xp` ni `streak_days`.
- [ ] 4.2 Ejecutar `npm run build` para que `tsc` liste todos los consumidores rotos, y usar esa salida como inventario real del alcance, no la lista del proposal (design, Risks). Verificación: la lista de errores está recogida antes de empezar a corregir.

## 5. Tipos y servicios del cliente

- [ ] 5.1 Reescribir `User` en `apps/web/src/types/user.types.ts` sobre las columnas reales: `xp` → `total_xp`, `streakDays` → `current_streak`, `avatarUrl` → `avatarKey` sobre `avatar_key`, más `username`, `countryCode` y `maxStreak`; `email` deja de derivarse de `ProfileRow` (design, decisión 5). Verificación: ningún campo de `User` referencia una columna inexistente.
- [ ] 5.2 Ajustar `mapProfileRowToUser()` en `apps/web/src/services/profile.service.ts` al nuevo mapeo, y decidir de dónde recibe el correo: la fila del perfil ya no lo tiene. Verificación: la función compila contra el `ProfileRow` regenerado.
- [ ] 5.3 Hacer que `profileService.updateProfile()` llame a la función RPC `update_my_profile` en vez de `.update()` sobre la tabla, porque la migración 009 revoca `update` a `authenticated` (design, decisión 6). Verificación: el servicio invoca `supabase.rpc('update_my_profile', …)` y sigue devolviendo `{ data, error }` con `AppError`, sin lanzar.
- [ ] 5.4 Rellenar `email` en el `User` desde `session.user.email` allí donde se construye con la sesión disponible, en `apps/web/src/context/AuthProvider.tsx` (design, decisión 5). Verificación: `user.email` sigue teniendo valor en la aplicación y no sale de `profiles`.
- [ ] 5.5 Ajustar `LeaderboardEntry` en `apps/web/src/types/progress.types.ts` y el mapeo de `apps/web/src/services/leaderboard.service.ts` a las columnas reales de la vista `leaderboard_weekly`: `user_id`, `username`, `avatar_key`, `country_code`, `weekly_xp`, `completed_levels`, `unlocked_achievements`, `rank`. Verificación: ambos compilan contra los tipos regenerados.

## 6. Componentes que leen los campos retirados

- [ ] 6.1 Ajustar los seis componentes que consumen `user.xp`, `user.streakDays` o `user.email`: `Sidebar.tsx`, `SidebarPlayerCard.tsx`, `StudentTopBar.tsx`, `StudentSettingsModule.tsx`, `TeacherSettingsModule.tsx` y `WelcomeBanner.tsx`. Conservar los valores por defecto que muestran hoy: esas pantallas no deben cambiar de aspecto (design, Non-Goals). Verificación: `npm run build` deja de reportar errores en esos archivos y la interfaz muestra lo mismo que antes.
- [ ] 6.2 Actualizar el `User` de prueba de `apps/web/src/test/renderClassrooms.tsx` a la nueva forma. Verificación: `npm run test:run` vuelve a pasar los 54 tests.

## 7. Documentación

- [ ] 7.1 Reescribir el Purpose de `openspec/specs/backend-supabase/spec.md`: hoy afirma que el esquema «todavía no se ha aplicado a ninguna base de datos» y que los requisitos «describen el contrato que el esquema establece, no un sistema en funcionamiento». El delta **no** transporta el Purpose al archivar, así que se edita en el spec principal (design, decisión 7). Verificación: el Purpose describe un esquema aplicado.
- [ ] 7.2 Actualizar `supabase/README.md`: deja de describir un esquema sin aplicar y debe recoger la migración nueva y el efecto de «Enable automatic RLS» sin exposición automática sobre las migraciones futuras. Verificación: el README menciona la migración del rol.
- [ ] 7.3 Actualizar `docs/CONTEXT.md`: retirar §4.1 —`database.types.ts` desincronizado, resuelto— y acotar §4.2 a lo que sigue faltando, que son sólo las tablas de salones. Verificación: §4.1 ya no describe un problema vigente.
- [ ] 7.4 Replicar en el bloque `context` de `openspec/config.yaml` lo que cambie de §1 y de la deuda técnica: hoy ese bloque afirma que `database.types.ts` está escrito a mano y que no hay tablas. Verificación: `npx openspec doctor` no reporta errores de parseo.

## 8. Verificación final

- [ ] 8.1 Ejecutar `npm run lint`. Verificación: 0 errores y 0 warnings.
- [ ] 8.2 Ejecutar `npm run test:run`. Verificación: los 54 tests pasan.
- [ ] 8.3 Ejecutar `npm run build`. Verificación: `tsc && vite build` termina sin errores, con los tipos regenerados y todos los consumidores ajustados.
- [ ] 8.4 Comprobar que la aplicación sigue arrancando y navegando con la sesión de invitado, que es el único acceso mientras P2 no exista. Verificación: `npm run dev`, entrar como *Niño* y como *Profesor*, y ver que las pantallas cargan sin errores en consola.
