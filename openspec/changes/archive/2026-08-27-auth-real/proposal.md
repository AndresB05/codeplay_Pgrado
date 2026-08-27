## Why

Los formularios de `pages/Login` y `pages/Signup` ya llaman a `authService`, pero
lo que hacen **después** de que el servidor responde sigue escrito para cuando no
había sesión real: navegan siempre a `ROUTES.DASHBOARD`, dan por bueno un
registro que no trajo sesión, y dejan entrar a un panel a quien tiene sesión pero
no tiene perfil. El resultado es que el rol —que la base ya guarda bien desde la
migración `202606030011`— no manda en ninguna de las tres decisiones.

Es el paso 12 del `docs/ROADMAP.md` y cierra la prioridad P2 de
`docs/CONTEXT.md` §3. Desbloquea el paso 13 (recuperar contraseña), el 14
(consentimiento del acudiente) y el 24 (retirar la sesión de invitado), que
necesitan que la identidad real sea la única puerta.

## What Changes

- **El destino tras entrar lo decide el rol del perfil, no una constante.**
  `Login.tsx:55` y `Signup.tsx:83` navegan hoy a `ROUTES.DASHBOARD` pase lo que
  pase: un tutor aterriza en el panel del niño y `PrivateRoute` lo rebota, con
  parpadeo visible. El patrón correcto ya existe en `components/home/Navbar.tsx:41-48`
  —esperar a que llegue `user` y navegar con `getHomeRouteForRole(user.role)`—,
  así que se **extrae a un hook compartido** y lo usan los tres sitios en vez de
  quedar copiado tres veces.

- **Un registro que no devuelve sesión deja de fallar en silencio.** Cuando
  «Confirm email» está encendido en Supabase, `signUp` responde `session: null`;
  el código actual navega igual al panel y `PrivateRoute` echa a `/login` sin
  decir nada. **Es un fallo que ocurrió de verdad**: el interruptor estuvo
  encendido en el proyecto real hasta el 27-ago-2026, así que todo registro
  hecho hasta entonces terminaba mudo en `/login`. La pantalla de registro pasa
  a quedarse donde está y a pedir que se confirme el correo.

- **Una sesión sin perfil deja de dar acceso a un panel.** Hoy
  `profile.service.ts:45` devuelve `{ data: null, error: null }` cuando no hay
  fila, `AuthProvider` guarda `user = null`, `useActiveRole()` da `null` y
  `PrivateRoute.tsx:37` sólo redirige si `activeRole` **no** es nulo: un tutor
  sin perfil ve el panel del niño. Pasa a no haber acceso: la sesión que no tiene
  perfil se cierra y el motivo se ve en `/login`.

- **BREAKING** `AuthContextValue.signUp` deja de devolver `boolean`. Devuelve un
  resultado de tres valores para que la pantalla distinga «entró», «hay que
  confirmar el correo» y «falló». `test/renderClassrooms.tsx:31` se ajusta.

- **El rol sigue eligiéndolo el navegador, y eso queda escrito.** El disparador
  lo lee de los metadatos del registro, así que cualquiera puede darse de alta
  como tutor. **No se arregla en este paso**: se documenta en `design.md` con lo
  que costaría cerrarlo y se anota en `docs/CONTEXT.md`, para que sea una
  decisión y no un accidente.

- **Dos archivos quedan fuera de la lista del encargo, y entran con motivo
  escrito.** Ninguno de los dos es ampliación de alcance: son las dos piezas sin
  las cuales los arreglos pedidos no se sostienen.

  1. `router/PublicRoute.tsx`. Aparta hoy de las rutas públicas a **todo** el
     que tenga sesión, mire o no el rol. En cuanto `PrivateRoute` mande a
     `/login` a quien tiene sesión y no tiene rol —que es el arreglo del
     problema 3—, `PublicRoute` lo devuelve a `getHomeRouteForRole(null)`, que
     es `/dashboard/worlds`, una ruta privada de niño, y de ahí otra vez a
     `/login`: **bucle infinito**. Las dos guardas se ajustan a la vez o
     ninguna.
  2. `components/home/Navbar.tsx`. El encargo manda reutilizar su patrón sin
     duplicar la lógica. Extraerlo a un hook y dejarle a `Navbar` la copia
     original sería crear justo la duplicación que se venía a evitar: pasaría a
     haber dos implementaciones de la misma regla, una en el hook y otra en el
     archivo del que se copió. `Navbar` pasa a llamar al hook, y su comentario
     —el que explica que el rol lo manda el servidor y no el botón pulsado— se
     muda con él.

- Fuera de alcance a propósito, cada uno con su paso: recuperar contraseña (13),
  Google OAuth (15, y además el proveedor está desactivado en el proyecto real)
  y retirar la sesión de invitado (24). El botón «¿Olvidaste tu contraseña?» de
  `Login.tsx:139` se queda sin `onClick`, y los dos botones de Google se quedan
  como están.

## Capabilities

### New Capabilities

Ninguna. El cambio no introduce ninguna capacidad nueva: completa el
comportamiento de una que ya existe.

### Modified Capabilities

- `auth-sesion`: cuatro requisitos nuevos —el destino tras autenticarse lo
  decide el rol del perfil, un registro sin sesión pide confirmar el correo, una
  sesión sin perfil no da acceso a ningún panel, y el rol del registro lo valida
  el servidor— y uno modificado, la guarda de las rutas privadas, que hasta
  ahora no decía qué pasa cuando no hay rol activo.

  `Rol efectivo de la sesión` **no** se toca: `useActiveRole()` sigue haciendo lo
  que su requisito dice. Lo que faltaba no era cómo se calcula el rol, sino qué
  hacer cuando sale nulo, y eso es de la guarda.

## Impact

**Depende de Supabase, pero NO necesita `db push`.** El esquema ya trae todo lo
que el paso usa: la migración `supabase/migrations/202606030011_profile_role_enum.sql`
lee el rol de los metadatos del registro y crea el perfil con él, degradando a
`child` cualquier valor manipulado. Este cambio **no lleva ni una línea de SQL**,
así que no hay nada que el usuario tenga que lanzar por consola.

Lo que sí exige del panel de Supabase es que **«Confirm email» siga apagado**
(`Authentication → Sign In / Providers → Email`), o el registro real no se puede
probar. Comprobado el 27-ago-2026 contra el proyecto `izndpzmtalhdrgvjurbx`:
`/auth/v1/settings` responde `"mailer_autoconfirm": true`.

**Archivos que se tocan**

| Archivo | Qué cambia |
| --- | --- |
| `apps/web/src/hooks/useRoleHomeRedirect.ts` | **Nuevo.** El patrón de `Navbar` extraído: espera al perfil y navega al panel de su rol |
| `apps/web/src/pages/Login/Login.tsx` | Deja de navegar a `ROUTES.DASHBOARD`; usa el hook |
| `apps/web/src/pages/Signup/Signup.tsx` | Igual, más la rama de «confirma tu correo» |
| `apps/web/src/components/home/Navbar.tsx` | Su `useEffect` se sustituye por el hook, para no dejar la lógica duplicada |
| `apps/web/src/context/AuthProvider.tsx` | `signUp` devuelve el resultado de tres valores; una sesión sin perfil se cierra con su motivo |
| `apps/web/src/context/AuthContext.ts` | La firma de `signUp` y el tipo del resultado |
| `apps/web/src/services/profile.service.ts` | La ausencia de fila deja de ser `{ data: null, error: null }` y pasa a ser un error con código propio |
| `apps/web/src/router/PrivateRoute.tsx` | Sin rol activo no se entra en una ruta con rol |
| `apps/web/src/router/PublicRoute.tsx` | Sólo aparta de las rutas públicas a quien además tiene rol, para que la redirección de `PrivateRoute` no entre en bucle |
| `apps/web/src/test/renderClassrooms.tsx` | El doble de `signUp` sigue la firma nueva |
| `apps/web/src/hooks/useRoleHomeRedirect.test.tsx` | **Nuevo.** El destino según el rol |
| `apps/web/src/context/AuthProvider.test.tsx` | **Nuevo.** Registro sin sesión y sesión sin perfil |
| `docs/CONTEXT.md`, `docs/ROADMAP.md`, `openspec/config.yaml` | Estado, y la decisión sobre el rol elegido por el navegador |

**Lo que no se toca:** `services/auth.service.ts` está completo y no cambia.
Tampoco `hooks/useActiveRole.ts`, `context/guest.helpers.ts` ni
`context/auth.helpers.ts`: el paso 24 sólo pide comprobar que funcionan sin la
sesión de invitado, y ya lo hacen.

**Riesgo conocido:** los 53 tests actuales cubren el store de salones, que monta
`AuthContext` con un doble. Cambiar la firma de `signUp` los alcanza por ese
doble y por nada más. Si alguno falla por otro motivo, es señal y no estorbo.
