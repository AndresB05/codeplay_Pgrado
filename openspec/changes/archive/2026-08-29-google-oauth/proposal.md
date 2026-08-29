## Why

**Un profesor que entre con Google nace niño.** El disparador
`handle_new_user_profile` de la migración `202606030011` saca el rol de
`raw_user_meta_data` y escribe `child` cuando no viene
(`202606030011_profile_role_enum.sql:69-75`); un alta por OAuth **no trae
metadatos de rol**, y `supabase.auth.signInWithOAuth` no tiene ningún hueco
donde meterlos —`options.data` no existe, y los `queryParams` van a Google, no a
Supabase—. Ésa es la mina del paso 15 y su razón de ser.

La fontanería del viaje de ida ya está escrita y **no hay que volver a
escribirla**: `authService.signInWithGoogle()` (`auth.service.ts:168`), el
`signInWithGoogle` del contexto (`AuthProvider.tsx:260`) y los dos botones
pintados con el tema selva (`Login.tsx:197` y `Signup.tsx:301`). El proveedor
está **activado desde el 28-ago-2026** en el proyecto real. Lo que falta es **el
rol y la vuelta**.

**Y hay un segundo problema que sólo se vio midiendo, no leyendo.** Supabase
**enlaza identidades por correo verificado**: entrar con Google con un correo que
ya tenía cuenta de contraseña **no crea un usuario nuevo**, le añade el proveedor
a la que existe, y el disparador ni corre porque no hay alta. Sin nada que lo
impida, esa cuenta queda **ascendible**: se midió con una cuenta real —un niño
con membresía en un salón que entró con Google desde `/signup` eligiendo
«Tutor»— y quedó `tutor`, **fuera de su propio salón y sin vuelta atrás por la
interfaz**, mientras su tutor la seguía viendo listada como exploradora. Cuenta
muerta. Ese daño es el que fija la regla de este cambio.

## What Changes

### 1. La regla: el rol se fija en el primer registro y no cambia nunca

Enlazar proveedores **es legítimo y tiene que funcionar** —una persona puede
tener Email y Google sobre la misma cuenta—. Lo que se rechaza es **crear una
cuenta que ya existe**, que es cuando el rol intentaría cambiar.

Las dos direcciones son distintas y las dos son la especificación:

- **Formulario y después Google, mismo correo** → se enlaza el proveedor, el rol
  **no cambia**, y la pantalla de vuelta muestra un **aviso neutro** diciendo que
  ya tenía cuenta y con qué rol entra. Ahí sí se nombra el rol: es su propia
  cuenta y su propia sesión. **Nunca una pantalla de error, nunca se cierra la
  sesión, nunca se manda al acceso.**
- **Google y después el formulario, mismo correo** → el registro falla con un
  aviso **genérico** «esa cuenta ya existe», **sin nombrar el rol**, y lleva al
  acceso. Ahí no se abre sesión, y de ahí sale la asimetría: no es un capricho,
  la impone la tecnología.

El aviso genérico respeta la decisión que `CONTEXT.md` §2.2 ya tomó para
`/forgot-password`: la interfaz no se convierte en un comprobador de quién está
dado de alta ni de si detrás hay un niño o un tutor.

### 2. La intención de rol viaja en el navegador, en su propio módulo

En `/signup` el rol **ya está elegido** cuando se pulsa el botón de Google: vive
en el estado del componente porque el botón está dentro de `step === 'form'`
(`Signup.tsx:301`), después de las tarjetas de `step === 'role'`. Hoy se tira.
Pasa a guardarse antes de redirigir y a leerse al volver.

Se respeta la frontera que ya existe: **ningún componente toca `localStorage`
directamente**. Módulo nuevo `context/oauthRole.helpers.ts`, con el patrón de
`context/guest.helpers.ts`, y con una función que **lee y borra a la vez**, para
que una intención vieja no se aplique en un segundo viaje.

En `/login` no hay rol ninguno: quien entra ahí ya tiene cuenta. El botón de
`/login` además **borra** cualquier intención pendiente antes de partir.

### 3. El `redirectTo` deja de ser `/dashboard`, y la ruta de vuelta no lleva guarda

`getOAuthRedirectUrl()` apunta hoy a `ROUTES.DASHBOARD` (`auth.service.ts:32`),
que está tras `<PrivateRoute role="child">`: un tutor que volviera de Google
aterrizaría en ruta ajena y `PrivateRoute` lo rebotaría, con **parpadeo de panel
ajeno**. Pasa a apuntar a `/auth/callback`.

Esa ruta **no cuelga de ninguna guarda**, y es la única del proyecto así. Una
guarda sólo sabe que no hay sesión, y con ese único dato no distingue «el
proveedor falló» de «alguien escribió esta dirección»: redirigir en el primer
caso **descarta el fragmento donde viaja el motivo**. La pantalla resuelve los
cuatro estados —error del proveedor, sin sesión, cuenta que ya existe, y rol por
fijar—. `PrivateRoute` y `PublicRoute` **no se tocan**: ninguna sabe nada de
esta ruta.

Esto ya está probado en el flujo real: fue esa pantalla la que enseñó el error
del canje de credenciales que tuvo bloqueado el paso, por los dos caminos.

### 4. Dos migraciones: la 0017, ya aplicada, y la 0018 que la reemplaza

La **0017** creó `set_my_role`, `security definer`, imitando `update_my_profile`
de la `...0006`. **Ya está aplicada en la base real** y su reja está medida.

La **0018** la reemplaza desde una migración nueva, como la 0014 hizo con la
0013 —la aplicada no se corrige en el sitio, o el repositorio describiría un
esquema que ninguna base ha tenido—, y trae cuatro piezas:

1. Columna en `profiles` que registra si el rol **se declaró al darse de alta**,
   por defecto `false`.
2. **Backfill de las filas existentes a `true`.** Sin esto, las cuentas viejas
   siguen siendo ascendibles.
3. `handle_new_user_profile` marca `true` cuando los metadatos traían un rol
   válido —registro con contraseña— y `false` cuando no —Google—.
4. `set_my_role` **rechaza, con código propio y sin escribir nada**, si la marca
   ya es `true`; si es `false`, escribe el rol y pone la marca a `true`. Conserva
   `42501`, `22023` y `P0002`.

El cliente **no puede escribir su propio rol** por ninguna otra vía:
`202606030009_enable_rls_and_policies.sql:50` revoca `insert, update, delete`
sobre `profiles`, y esa tabla no tiene ninguna política de `update`.

### 5. Se borra `components/auth/GoogleAuthButton.tsx`

**No lo monta nadie.** Login y Signup traen cada uno su botón en línea con el
tema selva; el huérfano usa `border-gray-300`, `text-gray-700` y
`hover:bg-gray-50`, fuera del tema y contra la regla de estilos de `CLAUDE.md`.

`docs/ROADMAP.md` §3 lista **cuatro** componentes huérfanos —`WelcomeBanner`,
`WorldCard`, `SidebarPlayerCard` y `LeaderBoard`—; éste era un quinto sin contar,
y el recuento se corrige al pasar.

### Lo que NO entra

- **El código de institución.** Este cambio impide **cambiar** de rol. **No
  impide registrarse como tutor de entrada**, que es un agujero distinto y sigue
  abierto: cualquiera puede llamar a `/auth/v1/signup` con la clave anónima
  declarando `tutor`. Lo cierra el código de institución, opción 2 de
  `CONTEXT.md` §2.2, y este paso no lo implementa.
- Reparar las cuentas que ya quedaron con el rol cambiado. La 0018 congela el rol
  que cada fila tenga en el momento de aplicarse.
- La **política de privacidad** y el consentimiento del acudiente (paso 14).
- Cualquier otro proveedor de OAuth.
- Tocar `PrivateRoute` o `PublicRoute`.
- Tocar el subscriptor de `onAuthStateChange` de `AuthProvider.tsx`.
- Rellenar los huecos de la mascota (`.mascot-slot`, `ImagePlaceholder`).

## Capabilities

### New Capabilities

Ninguna. Entrar con Google es una vía de acceso más, y el acceso ya es una
capacidad existente.

### Modified Capabilities

- `auth-sesion`: dos requisitos nuevos —**acceso con Google**, con el rol elegido
  sobreviviendo el viaje y consumiéndose una sola vez, y **la pantalla de vuelta**,
  que resuelve error del proveedor, ausencia de sesión, cuenta ya existente y rol
  por fijar— y dos modificados: «El destino tras autenticarse lo decide el rol
  del perfil», que pasa a cubrir la vuelta de Google, y «El rol del registro lo
  valida el servidor», que hoy da por supuesto que el rol viaja en los metadatos
  y tiene que decir qué ocurre cuando el alta **no puede llevarlos** y qué ocurre
  al **intentar crear una cuenta que ya existe**.
- `backend-supabase`: dos requisitos modificados. «Escrituras encapsuladas en
  funciones seguras» gana la RPC del rol, y «Rol almacenado en el perfil» pasa a
  decir que el rol se fija **una sola vez** y que la base registra si ya se
  declaró.

## Impact

**Depende de Supabase y SÍ necesita `db push`.** La **0017 ya está aplicada**; la
**0018** está por aplicar, y el `db push` **sólo lo lanza el usuario**, porque
pide credenciales por consola. Su SQL se lee **antes** de lanzarlo (comprobación
9 de `ROADMAP.md` §1.3), y al lanzarlo se lee la salida: tiene que aplicar la
0018 y **ninguna más**.

**Orden que no se puede invertir:** la 0018 hace backfill a `true`, así que
**congela el rol que cada fila tenga en ese momento**. Las cuentas que quedaron
con el rol cambiado durante la verificación se borran **antes** de lanzarla, o
quedan congeladas mal.

**Los tipos se regeneran después**, con `npx supabase gen types typescript
--linked`, que también lanza el usuario: `types/database.types.ts` se genera y
nunca se edita a mano, y la columna nueva tiene que aparecer en él.

**Del panel de Supabase, ya resuelto:** la ruta de vuelta
`http://localhost:5173/auth/callback` está en **Redirect URLs**, junto a
`/reset-password` y un comodín `http://localhost:5173/**`. Y el **Client Secret**
estaba mal pegado, que fue lo que tuvo bloqueado el paso; el diagnóstico queda
escrito en `CONTEXT.md` §2.2 porque no es deducible.

**Archivos que se tocan**

| Archivo | Qué cambia |
| --- | --- |
| `supabase/migrations/202606030017_create_set_my_role_rpc.sql` | **Ya aplicada.** No se toca |
| `supabase/migrations/202606030018_lock_profile_role.sql` | **Nuevo.** Columna, backfill, y reemplazo del disparador y de `set_my_role` |
| `apps/web/src/context/oauthRole.helpers.ts` | **Nuevo.** La intención de rol. Una función lee y borra a la vez |
| `apps/web/src/pages/AuthCallback/AuthCallback.tsx` | **Nuevo.** La pantalla de vuelta y sus cuatro estados |
| `apps/web/src/services/auth.service.ts` | `getOAuthRedirectUrl()` pasa a `ROUTES.AUTH_CALLBACK`; `signUp()` distingue la cuenta que ya existe |
| `apps/web/src/services/profile.service.ts` | `setMyRole()`, con el código propio del rechazo expuesto como constante |
| `apps/web/src/context/AuthContext.ts` | `signInWithGoogle` acepta rol opcional; `updateRole` nuevo; `SignUpOutcome` gana el caso de cuenta existente |
| `apps/web/src/context/AuthProvider.tsx` | Guarda o borra la intención antes de redirigir, y expone `updateRole`. **El subscriptor de `onAuthStateChange` no se toca** |
| `apps/web/src/constants/routes.ts` | `AUTH_CALLBACK: '/auth/callback'` |
| `apps/web/src/router/AppRouter.tsx` | La ruta nueva, **sin guarda** |
| `apps/web/src/pages/Signup/Signup.tsx` | Pasa el rol elegido al botón de Google, y avisa en genérico cuando la cuenta ya existe |
| `apps/web/src/pages/Login/Login.tsx` | El botón de Google no pasa rol |
| `apps/web/src/components/auth/GoogleAuthButton.tsx` | **Se borra** |
| `apps/web/src/services/auth.service.test.ts` | La URL de vuelta de Google, y la cuenta que ya existe |
| `apps/web/src/context/oauthRole.helpers.test.ts` | **Nuevo.** La intención se consume **una sola vez** |
| `apps/web/src/test/buildAuthValue.ts` | El doble de `AuthContextValue` gana las firmas nuevas |
| `supabase/README.md` | Las migraciones 0017 y 0018 |
| `docs/CONTEXT.md`, `docs/ROADMAP.md`, `openspec/config.yaml` | Estado, decisiones y prioridades |

**Lo que no se toca:** `router/PrivateRoute.tsx`, `router/PublicRoute.tsx` y el
subscriptor de `onAuthStateChange`.
