## Why

Tres de los cabos sueltos que `docs/ROADMAP.md` §3 tiene anotados son **fallos
vivos que se ven hoy con una cuenta real**, no deuda teórica: un correo con menos
de 3 o más de 30 caracteres antes de la arroba aborta el alta entera con
«Database error saving new user»; los fallos de acceso salen en inglés en una
aplicación en español para niños; y el panel del niño inventa nombre, correo y
racha, hasta el punto de afirmar «42 días» dos veces en la misma pantalla con una
cuenta recién creada. Ninguno depende de un paso posterior, así que se cierran
ahora.

Aprovechando que el mismo panel se toca, se le da superficie al XP. El dato ya se
lee de la base —`profiles.total_xp` y la vista del roster—, pero sólo se pinta en
Ajustes: `docs/ROADMAP.md` §3.2 lo anotó como lo que deja incompleto al paso 21,
que escribiría un número que el niño apenas puede ver.

## What Changes

- **El `username` derivado del correo deja de abortar el alta.** Una migración
  nueva acota la longitud a 3–30 caracteres *después* de normalizar y deja `null`
  cuando no encaja, igual que ya hace cuando el nombre está cogido. El `check` de
  la migración `202606030002` **no se toca**: el formato es del dominio, y quien
  cede es quien lo deriva.
- **Los fallos de autenticación se muestran en español.** Mapeo por código de
  error, con el mismo patrón que `classrooms.service.ts` estrenó en el paso 10.
  El texto original del servidor sigue viajando como causa.
- **El panel del niño deja de inventar datos.** Cada campo con su arreglo, que no
  es el mismo para los tres: la racha con `?? 0` porque `0` es un valor legítimo;
  el nombre con `||` y el `FALLBACK_STUDENT_NAME` que ya existe, porque
  `full_name` sí puede llegar vacío; el correo, sin ningún valor inventado.
- **El XP del niño se ve en cuatro sitios**: barra lateral, barra superior y la
  tabla de seguimiento en sus dos vistas. Se reutiliza `XPBar`, **retintada** al
  tema de selva antes de montarla, porque hoy usa los nombres de color anteriores
  al rediseño y se ve gris y apagada.
- El **máximo** de la barra es una constante provisional declarada en un solo
  sitio: el esquema no tiene niveles ni umbrales de XP, y eso lo fija el paso 22.

Fuera de alcance, a propósito: calcular XP, rachas o progreso (pasos 21 y 22),
el responsive de la tabla al ganar una columna (paso 25), los reportes de
habilidades (paso 17) y los cuatro componentes huérfanos, que se rehacen, no se
recuperan.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `backend-supabase`: se añade el requisito de que el nombre de usuario derivado
  del correo nunca aborte el alta. Hoy el disparador sólo convierte la cadena
  vacía en `null` y nada acota la longitud.
- `auth-sesion`: se añaden dos requisitos, ninguno de los cuales existe hoy —
  que los fallos de autenticación lleguen en español, y que el panel muestre la
  identidad real de quien ha entrado en lugar de datos de relleno.
- `contenido-mundos`: se añade el requisito de que el XP del niño se vea en su
  panel —barra lateral y barra superior—, con el máximo provisional.
- `salones-tutor`: se añade el requisito de la columna de XP en la tabla de
  seguimiento, con la posición distinta según quién mire.

El XP se parte en **dos** requisitos y no en uno porque las superficies viven en
capacidades distintas. El `Purpose` de `contenido-mundos` es «Presentar **al
niño** el contenido educativo», así que un escenario del tutor lo contradiría; y
`docs/CONTEXT.md` §2.3 sitúa `shared/StudentRosterTable.tsx` en `salones-tutor`,
que es quien ya posee la tabla de seguimiento y la regla de que la vista del niño
la reutiliza sin la columna de acciones.

## Impact

**Base de datos.** Migración nueva
`supabase/migrations/202606030019_bound_generated_username.sql`, que reemplaza
`public.handle_new_user_profile()` sin tocar las anteriores. **Necesita un
`db push`, y lo lanza el usuario**: la CLI de Supabase está instalada y el
proyecto enlazado, pero `db push` pide credenciales por consola. Entre escribir
el `.sql` y lanzarlo se **para**: la comprobación 9 de `docs/ROADMAP.md` §1.3
exige que la sesión que revisa lea la migración **antes** de que se aplique, y es
justo el control que el paso 9 se saltó dos veces. `gen types`
probablemente no cambie nada —es una función de disparador, no una RPC, y no
aparece en `Database['public']['Functions']`—, así que se comprueba antes de
regenerar.

**Código.**

- `apps/web/src/errors/createAppError.ts` — hoy usa `error.message` crudo en las
  ramas de `AuthError` y de cualquier error con mensaje, así que el
  `fallbackMessage` en español nunca se alcanza con Supabase.
- `apps/web/src/services/auth.service.ts` — `signIn`, `signUp`, `signOut`,
  `getSession`, `requestPasswordReset` y `applyNewPassword`. La rama de
  `user_already_exists` de la línea 248 ya traduce y **no se duplica**.
- `apps/web/src/context/AuthProvider.tsx` — comparaciones de `error.code` en las
  líneas 66, 180 y 298, que hoy conviven con un `code` que para `AuthError` vale
  `String(error.status)`.
- `apps/web/src/components/dashboard/Sidebar/Sidebar.tsx` — nombre y racha
  inventados (103-104) y hueco de la barra de XP bajo el chip de racha (163-166).
- `apps/web/src/components/dashboard/student/StudentTopBar.tsx` — racha inventada
  (39) y barra de XP a la izquierda del chip de racha (61-64).
- `apps/web/src/components/dashboard/student/StudentSettingsModule.tsx` — nombre,
  correo y racha inventados (29-31).
- `apps/web/src/components/dashboard/shared/StudentRosterTable.tsx` — columna de
  XP en las dos ramas de `gridColumns`.
- `apps/web/src/components/ui/XPBar.tsx` — retintado al tema de selva.
- `apps/web/src/services/classrooms.service.ts` — se exporta
  `FALLBACK_STUDENT_NAME`, que hoy es privado.

**Lo que no se toca**, y se dice para que nadie lo arregle de paso:
`SidebarPlayerCard.tsx:24` y `WelcomeBanner.tsx:33` usan `|| 0` para la racha,
que ahí es correcto porque nadie los monta; `getSkillReports` y su 0 % son el
paso 17; y el `check` de la migración `202606030002` se queda como está.
