## 1. Base de datos

- [x] 1.1 Escribir `supabase/migrations/202606030048_world_intros_seen.sql`: columna `profiles.seen_world_intros uuid[] not null default '{}'` y función `mark_world_intro_seen(input_world_id uuid)` (`security definer`, exige sesión, rechaza mundo inexistente, no duplica, `revoke` a `public`/`anon`, `grant` a `authenticated`). Verificar releyéndola contra la 0046
- [x] 1.2 Explicar al usuario en simple que lance `supabase db push` y `npx supabase gen types typescript --linked > apps/web/src/types/database.types.ts`, y esperar a que lo haga. Verificar que `database.types.ts` trae la columna y la función
- [x] 1.3 ~~Añadir la 0048 a `supabase/README.md`~~ Fuera de alcance: el README sólo describe hasta la 0033 y le faltan las 14 siguientes; meter sólo ésta sería incoherente

## 2. Servicio

- [x] 2.1 Añadir `getSeenWorldIntros()` y `markWorldIntroSeen(worldId)` a `apps/web/src/services/profile.service.ts`, con `{ data, error }` y sin lanzar. Verificar con un test en `profile.service.test.ts` que un error de Supabase sale como `AppError` y no como excepción

## 3. Interfaz

- [x] 3.1 Añadir la entrada desde abajo y su anulación con `prefers-reduced-motion` en `apps/web/src/main.css`. Verificar en el navegador con el movimiento reducido emulado
- [x] 3.2 Crear `apps/web/src/components/dashboard/student/WorldIntro.tsx` (imagen, burbujas y `onClose` por parámetro; `role="dialog"`, foco, Escape, clic fuera). Verificar con `WorldIntro.test.tsx`: avanza con «Siguiente», cierra con «¡Entendido!», Escape y clic en el velo, y no cierra al tocar la burbuja
- [x] 3.3 Montarlo en `apps/web/src/components/dashboard/student/StudentLevelModule.tsx` sólo en el mundo 3: leer si ya se vio al quedar el nivel `ready`, anotarlo al cerrar, segunda burbuja con la píldora y el `stepLimit` del nivel, y botón «¿Cómo se juega aquí?» en la cabecera. Verificar en el navegador con una cuenta de prueba que sale la primera vez, no sale la segunda (también tras borrar el almacenamiento del navegador), el botón lo repite y en los mundos 1 y 2 no hay ni Leo ni botón

## 4. Documentación y cierre

- [x] 4.1 Actualizar `docs/CONTEXT.md` con la explicación de Leo, la 0048 y las rutas reales. Verificar que `npx openspec doctor` pasa
- [x] 4.2 Ejecutar `npm run lint`, `npm run test:run` y `npm run build` desde la raíz y verificar que los tres pasan
