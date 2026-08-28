## Why

Hay **tres botones muertos** de contraseña, no uno: «¿Olvidaste tu contraseña?»
en `pages/Login/Login.tsx:143`, y los dos «Cambiar contraseña» de
`StudentSettingsModule.tsx:106` y `TeacherSettingsModule.tsx:96`. Los tres están
pintados, ninguno tiene `onClick`. Por debajo no hay nada que encender:
`services/auth.service.ts` no toca contraseñas y no existe ninguna ruta de
recuperación ni en `constants/routes.ts` ni en `router/AppRouter.tsx`.

Con el login real cerrado en el paso 12, quien olvida su contraseña **no tiene
ninguna salida**: no hay recuperación, y la única cuenta que puede volver a
entrar es la que recuerda su clave. Es el paso 13 del `docs/ROADMAP.md`.

## What Changes

El paso se parte en dos mitades, y **el orden importa** porque sólo una se puede
comprobar sin depender de que llegue un correo:

### Mitad A — cambiar la contraseña estando dentro

- `authService` gana `updatePassword()`, sobre `supabase.auth.updateUser({ password })`.
  No hay correo de por medio: la sesión abierta es la prueba de identidad.
- Los dos botones «Cambiar contraseña» dejan de estar muertos y despliegan un
  panel con dos campos —contraseña nueva y repetirla—, validado con zod como el
  resto de formularios.
- El panel es **uno solo**, en `components/dashboard/shared/`, montado por las
  dos pantallas de Ajustes. Son la misma función con dos marcos distintos; dos
  copias se separarían al primer arreglo.
- Se verifica entera y sin correo: cambiar la contraseña, cerrar sesión, y
  comprobar contra `/auth/v1/token` que **la antigua ya no vale y la nueva sí**.
  Las dos respuestas, porque sólo una de las dos no prueba nada.

### Mitad B — recuperar la olvidada

- Pantalla nueva en `/forgot-password`: se pide el correo y se llama a
  `resetPasswordForEmail()` con la URL de vuelta a la pantalla de contraseña
  nueva. «¿Olvidaste tu contraseña?» pasa a llevar aquí.
- Pantalla nueva en `/reset-password`: la que abre el enlace del correo. Dos
  campos, y al enviar reutiliza el mismo `updatePassword()` de la mitad A.
- El aviso de «te hemos enviado un correo» **no dice si la dirección existe**.
  Supabase responde igual en los dos casos a propósito, y la interfaz no puede
  ser quien convierta la pantalla en un comprobador de cuentas dadas de alta.
- **B depende de configuración del panel de Supabase que no puedo comprobar con
  la clave anónima**, así que arranca con esa comprobación como puerta. Si no
  está, B para y A queda terminada igual — no se da el paso por cerrado.

### Cuatro excepciones de alcance

La cuarta es de otra naturaleza y va primero, porque es la más pequeña:

4. **El doble de `AuthContextValue` de los tests se extrae a
   `apps/web/src/test/buildAuthValue.ts`.** Existía copiado en dos sitios
   —`test/renderClassrooms.tsx` y `hooks/useRoleHomeRedirect.test.tsx`—, y al
   crecer `AuthContextValue` con las acciones de contraseña, `tsc` señaló una,
   se arregló, y la otra apareció en la compilación siguiente. Con dos copias eso
   vuelve a pasar en cada acción nueva. Es un archivo de pruebas, no toca
   producción, pero es un archivo fuera del encargo y consta aquí como tal.

Las otras tres son la misma enfermedad:

Al verificar la mitad A apareció un defecto **anterior a este paso**, en tres
sitios distintos: hay antepasados que sustituyen su subárbol entero por un
indicador de carga en cuanto sube una bandera global, y esas banderas suben
también cuando **no ha cambiado quién está dentro**. Como Supabase refresca el
token periódicamente, hoy la aplicación ya se blanquea sola cada cierto tiempo:
nadie lo había visto porque hasta ahora ningún evento caía en mitad de una
interacción. El cambio de contraseña es la primera que dura lo suficiente.

Las tres entran porque **sin ellas la mitad A no se puede dar por verificada**:
el requisito dice que el resultado se ve en la misma pantalla, y el panel se
desmontaba antes de enseñarlo.

1. **Las tres acciones de contraseña no tocan el `loading` global** de
   `AuthProvider`. Esa bandera significa «la sesión se está resolviendo» y las
   guardas responden a ella; una contraseña se cambia dentro de una sesión ya
   resuelta. Cada pantalla lleva su propio indicador de envío.
2. **El subscriptor de `onAuthStateChange` sólo blanquea si cambia la
   identidad** —de nulo a un usuario, de uno a nulo, o de uno a otro—. Se compara
   el id y **no** el tipo de evento, así que `_event` sigue sin leerse y la
   decisión 3 de `design.md` se mantiene en pie.
3. **`ClassroomsProvider` depende de `user.id` y `user.role`, no del objeto
   `user`.** El objeto se reconstruye en cada evento de sesión, así que
   depender de él regeneraba los seis callbacks, recargaba el store entero y
   hacía parpadear el panel del tutor, que cambia su pantalla por un spinner
   mientras carga.

`PrivateRoute`, `PublicRoute` y `TeacherDashboard` **no se tocan**: los tres
arreglos están en quien levanta la bandera, no en quien reacciona a ella.

### Lo que NO entra

Google OAuth (paso 15), retirar la sesión de invitado (paso 24), contratar un
servicio de correo (paso 19) y el interruptor «Confirm email», que se queda
apagado. Tampoco se toca la contraseña de las cuentas de `apps/web/.env`: son
las de los botones «Sin login», y cambiarla rompería el acceso rápido. Las
pruebas se hacen con cuentas nuevas creadas desde `/signup`.

## Capabilities

### New Capabilities

Ninguna. Las contraseñas son parte del acceso, que ya es una capacidad existente.

### Modified Capabilities

- `auth-sesion`: tres requisitos nuevos —cambiar la contraseña desde la cuenta,
  recuperar una contraseña olvidada, y qué guarda protege la pantalla de
  contraseña nueva— y uno modificado, la guarda de las rutas privadas, que
  acota el indicador de carga a la resolución inicial.
- `store-salones`: un requisito modificado, «los salones son los de la sesión
  autenticada», que pasa a decir también **cuándo NO** se recarga: un evento de
  sesión que no cambia la identidad del usuario no vuelve a cargar el estado del
  salón. Hoy el spec sólo decía cuándo sí.

## Impact

**Depende de Supabase, pero NO necesita `db push`. Este cambio no lleva ni una
línea de SQL.** Las contraseñas viven en `auth.users`, que gestiona Supabase
entero: no hay tabla que migrar, ni política de RLS que escribir, ni disparador
que tocar.

**Lo que sí exige del panel, y es la puerta de la mitad B:** en
`Authentication → URL Configuration` tienen que estar el **Site URL**
`http://localhost:5173` y la **Redirect URL** `http://localhost:5173/reset-password`.
Sin la segunda, Supabase rechaza el `redirectTo` y el enlace del correo no
lleva a ninguna parte. No se puede leer con la clave anónima, así que la
comprueba el usuario. La mitad A no la necesita.

**Archivos que se tocan**

| Archivo | Mitad | Qué cambia |
| --- | --- | --- |
| `apps/web/src/services/auth.service.ts` | A y B | `updatePassword()` y `requestPasswordReset()`, con la forma `{ data, error }` |
| `apps/web/src/context/AuthContext.ts` | A y B | Las dos firmas nuevas |
| `apps/web/src/context/AuthProvider.tsx` | A y B | Las dos acciones. **`_event` no se toca**, ver `design.md` |
| `apps/web/src/components/auth/ChangePasswordForm.schema.ts` | A | **Nuevo.** Junto a `LoginForm.schema.ts` y `SignupForm.schema.ts` |
| `apps/web/src/components/dashboard/shared/ChangePasswordPanel.tsx` | A | **Nuevo.** El panel que montan las dos pantallas de Ajustes |
| `apps/web/src/components/dashboard/student/StudentSettingsModule.tsx` | A | El botón de la línea 106 deja de estar muerto |
| `apps/web/src/components/dashboard/teacher/TeacherSettingsModule.tsx` | A | El botón de la línea 96 deja de estar muerto |
| `apps/web/src/pages/ForgotPassword/ForgotPassword.tsx` | B | **Nuevo.** Pedir el correo de recuperación |
| `apps/web/src/pages/ResetPassword/ResetPassword.tsx` | B | **Nuevo.** La pantalla que abre el enlace |
| `apps/web/src/pages/Login/Login.tsx` | B | El botón de la línea 143 lleva a `/forgot-password` |
| `apps/web/src/constants/routes.ts` | B | `FORGOT_PASSWORD` y `RESET_PASSWORD` |
| `apps/web/src/router/AppRouter.tsx` | B | Las dos rutas, con **guardas distintas** — ver `design.md` |
| `apps/web/src/test/buildAuthValue.ts` | A | **Nuevo.** El doble de `AuthContextValue`, extraído de sus dos copias — ver excepción 4 |
| `apps/web/src/test/renderClassrooms.tsx` | A | Pasa a usar el doble extraído en vez de tener el suyo |
| `apps/web/src/services/auth.service.test.ts` | B | **Nuevo.** La URL de vuelta de la recuperación |
| `apps/web/src/pages/ResetPassword/ResetPassword.test.tsx` | B | **Nuevo.** No se envía nada si las dos contraseñas no coinciden |
| `docs/CONTEXT.md`, `docs/ROADMAP.md`, `openspec/config.yaml` | — | Estado y decisiones |

**Lo que no se toca:** `router/PrivateRoute.tsx` y `router/PublicRoute.tsx` no
cambian ni una línea. La pantalla de contraseña nueva encaja en las guardas que
ya existen, y cuál le toca es la decisión principal de `design.md`.

**Riesgo conocido:** los 61 tests de hoy sólo se ven afectados por el doble de
`AuthContext` en `test/renderClassrooms.tsx`, que es un ajuste de firma. Si falla
otra cosa, es señal y hay que mirarla.
