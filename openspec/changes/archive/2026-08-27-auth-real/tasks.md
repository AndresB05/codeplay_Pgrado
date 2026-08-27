## 1. Puerta de entrada: el entorno permite probar el registro

- [x] 1.1 Comprobar que la confirmación por correo sigue apagada antes de escribir nada de código: `curl -s "$U/auth/v1/settings" -H "apikey: $K" | tr ',' '\n' | grep autoconfirm` debe decir `"mailer_autoconfirm":true`. Si dice `false`, **parar** y pedir al usuario que apague «Confirm email» en `Authentication → Sign In / Providers → Email`; sin eso el registro real no se puede probar. Verificado así el 27-ago-2026, pero se repite porque es un interruptor del panel y puede cambiar entre sesiones

## 2. Servicio de perfil: la ausencia de fila deja de ser ambigua

- [x] 2.1 En `apps/web/src/services/profile.service.ts`, hacer que `getProfile()` devuelva un `AppError` con código `profile_not_found` y mensaje en español cuando `maybeSingle()` no encuentre fila, en lugar del `{ data: null, error: null }` de la línea 45. Dejar en comentario **por qué** es un error y no un vacío: la consulta terminó bien, así que el `null` significa que la fila no existe, no que haya fallado la red. Verificar con `npm run build`, que `tsc` señala a cualquier consumidor que asumiera lo anterior
- [x] 2.2 Revisar el otro consumidor, `apps/web/src/hooks/useProfile.ts:28`, y comprobar que la firma nueva no lo rompe ni le cambia el comportamiento observable

## 3. `AuthProvider`: una sesión sin perfil no sobrevive, y el registro dice qué pasó

- [x] 3.1 En `apps/web/src/context/AuthContext.ts`, cambiar la firma de `signUp` para que devuelva `'signed-in' | 'confirmation-required' | 'error'` en vez de `boolean`, y declarar ahí el tipo del resultado. Verificar con `npm run build`
- [x] 3.2 En `apps/web/src/context/AuthProvider.tsx`, hacer que `syncSessionProfile()` devuelva `boolean` —cierto cuando quedó un perfil cargado—, y que `signIn` y `signUp` lo propaguen. Verificar que `signIn` ya no puede devolver «entró» cuando no hay perfil, con el test de 6.2
- [x] 3.3 En el mismo archivo, **partir en dos** la rama única `if (profileResult.error)` que hay hoy en la línea 40. Sólo cuando el código sea `profile_not_found` se cierra la sesión con `authService.signOut()` —no con el `signOut` del contexto, que empieza borrando el error— y se deja el motivo en el estado de error. Cualquier otro error deja la sesión **abierta** y sólo guarda el motivo: un corte de red no significa que la cuenta no tenga perfil, y colgar el cierre de la rama común echaría a un usuario legítimo por un fallo pasajero. Comentar **por qué** se cierra en el caso que sí: sin perfil no hay rol, ninguna ruta con rol la admite y las políticas de RLS cuelgan del perfil, así que esa sesión no puede hacer nada y dejarla viva es lo que hoy deja entrar a un panel ajeno. Verificar con los tests de 6.3
- [x] 3.4 Hacer que `signUp` devuelva `'confirmation-required'` cuando el servidor cree la cuenta pero no devuelva sesión, y `'signed-in'` cuando sí. Verificar con el test de 6.4

## 4. Navegación por rol: una sola pieza para los tres sitios que autentican

- [x] 4.1 Crear `apps/web/src/hooks/useRoleHomeRedirect.ts` con el patrón que hoy vive en `components/home/Navbar.tsx:41-48`: esperar a que llegue `user` y navegar a `getHomeRouteForRole(user.role)`. Su API **nace con tres cosas**, no con dos: arrancar la espera, cancelarla, y **el indicador de si se está esperando**. Ese tercero no es un extra: `Navbar.tsx:143` lo usa hoy como `disabled={signingIn || loading}` para desactivar los botones mientras se autentica, y un hook que se quede el estado sin devolverlo deja a `Navbar` sin con qué sustituirlo. Mudar allí el comentario de `Navbar` que explica que el rol lo manda el perfil del servidor y no el botón pulsado. Verificar con el test de 6.1
- [x] 4.2 Reescribir `components/home/Navbar.tsx` para que use el hook en lugar de su propio `useEffect` y su estado `signingIn`, tomando del hook el indicador de espera para el `disabled` de la línea 143. Verificar a mano que el acceso «Sin login» sigue llevando al niño a `/dashboard/worlds` y al profesor a `/teacher/groups`, y que los botones siguen desactivándose mientras se autentica
- [x] 4.3 En `apps/web/src/pages/Login/Login.tsx`, sustituir el `navigate(ROUTES.DASHBOARD)` de la línea 55 por la espera del hook. **No tocar** el botón «¿Olvidaste tu contraseña?» de la línea 139, que sigue sin `onClick` porque es el paso 13
- [x] 4.4 En `apps/web/src/pages/Signup/Signup.tsx`, sustituir el `navigate(ROUTES.DASHBOARD)` de la línea 83 por la rama de tres salidas: `'signed-in'` arranca la espera del hook, `'confirmation-required'` se queda en la pantalla y muestra el aviso, `'error'` sigue pintando `error.message` como ya hace
- [x] 4.5 Añadir en `Signup.tsx` el recuadro de aviso de «confirma tu correo» con los tokens del tema —`border-mint-dark`, `bg-mint-soft`, `text-mint-dark`—, en paralelo al recuadro de error `coral` de las líneas 180-184. Verificar que no se introduce ningún hex suelto ni ningún color fuera de `tailwind.config.js`
- [x] 4.6 **No tocar** los botones de Google de ninguna de las dos pantallas: es el paso 15 y el proveedor está desactivado en el proyecto real

## 5. Guardas de ruta: sin rol no se entra, y sin bucle

- [x] 5.1 En `apps/web/src/router/PrivateRoute.tsx:37`, quitar el `activeRole &&` de la condición y hacer que una ruta con rol y sin rol activo redirija a `ROUTES.LOGIN`. Verificar que un `activeRole` nulo ya no cae en «cualquier rol vale»
- [x] 5.2 En `apps/web/src/router/PublicRoute.tsx:23`, apartar de las rutas públicas sólo a quien tenga sesión **y** rol activo. Sin esto, la redirección de 5.1 rebota contra `getHomeRouteForRole(null)`, que es `/dashboard/worlds`, y se cierra un bucle infinito entre las dos guardas. Verificar el par a mano con el caso de 7.4
- [x] 5.3 Comprobar que `hooks/useActiveRole.ts` y las dos guardas siguen funcionando **sin** sesión de invitado, que es lo único que el paso 24 pide de aquí. No se espera ningún cambio: dejarlo escrito si en efecto no lo hubo

## 6. Tests nuevos, sólo donde aportan

- [x] 6.1 Crear `apps/web/src/hooks/useRoleHomeRedirect.test.tsx`: con perfil `tutor` se navega a `/teacher/groups`, con perfil `child` a `/dashboard/worlds`, y mientras `user` sea nulo no se navega a ningún sitio. Verificar con `npm run test:run`
- [x] 6.2 Crear `apps/web/src/context/AuthProvider.test.tsx` con el doble de `auth.service` y de `lib/supabase`, y cubrir en él que `signIn` devuelve falso cuando la sesión llega sin perfil
- [x] 6.3 En el mismo archivo, cubrir **las dos ramas** del fallo al cargar el perfil: con `profile_not_found` la sesión se cierra —se llama a `signOut`— y queda un error con el motivo; con cualquier otro error la sesión **sobrevive** y sólo queda el motivo. La segunda es la que impide que un corte de red eche a un usuario legítimo, así que sin ella la primera no está probada, está sobreajustada
- [x] 6.4 En el mismo archivo, cubrir las dos ramas del registro: sin sesión devuelve `'confirmation-required'` y con sesión `'signed-in'`. Es la única forma de comprobar la rama de confirmación sin volver a encender el interruptor del panel de Supabase
- [x] 6.5 Ajustar el doble de `signUp` en `apps/web/src/test/renderClassrooms.tsx:31` a la firma nueva. **Los 53 tests que existen hoy tienen que seguir pasando.** Si alguno falla por otro motivo, es señal: mirarla, no relajar ni borrar el test

## 7. Verificación contra la base real

- [x] 7.1 Registrar desde la aplicación un tutor con el correo `prueba.paso12.tutor@codeplay.test` y comprobar con `curl` que `profiles` recibe su fila con `role = 'tutor'`, y que la pantalla aterriza en `/teacher/groups`
- [x] 7.2 Dar de alta `prueba.paso12.child@codeplay.test` con `curl` contra `/auth/v1/signup` enviando un rol **manipulado** en los metadatos —algo que no sea `child` ni `tutor`— y comprobar que el alta no falla y que su fila de `profiles` queda con `role = 'child'`, que es lo que hace el disparador de la migración `202606030011`. Esta cuenta cubre las dos comprobaciones con un solo alta: el rol manipulado y el aterrizaje del niño
- [x] 7.3 Iniciar sesión en la aplicación con la cuenta de 7.2 y comprobar que aterriza en `/dashboard/worlds`. **Son dos cuentas en total, que es el máximo permitido**
- [x] 7.4 Iniciar sesión con las dos cuentas de prueba que ya existen en `apps/web/.env` y comprobar que el tutor va a `/teacher/groups` y el niño a `/dashboard/worlds`, sin parpadeo de panel ajeno. **Nunca imprimir una contraseña en la salida**
- [x] 7.5 Enumerar al usuario las dos cuentas creadas y decirle textualmente que las borre en `Authentication → Users`, y que al borrar el usuario se van en cascada su perfil y sus salones. No las puede borrar la sesión: hace falta el panel de Supabase

## 8. Cierre obligatorio y documentación

- [x] 8.1 Ejecutar `npm run lint` (cero warnings), `npm run test:run` (los 53 de hoy más los nuevos) y `npm run build`. Los tres pasan hoy y no deben romperse
- [x] 8.2 En `docs/CONTEXT.md` §2.2, pasar a ✅ las cuatro filas que este paso cierra —formularios de login y registro, registro por pasos con selección de rol, y sincronización sesión ↔ perfil— y dejar 🟡 la de Google, que es el paso 15. Añadir en las decisiones de diseño la del rol elegido por el navegador, con las tres opciones de cierre que enumera `design.md`
- [x] 8.3 En `docs/CONTEXT.md` §3, marcar P2 como APLICADO igual que se hizo con P3, dejando fuera lo que sigue siendo de otros pasos: Google OAuth (15) y retirar la sesión de invitado (24)
- [x] 8.4 En `docs/ROADMAP.md`, poner la fila 12 a ✅ con `auth-real` como nombre del cambio
- [x] 8.5 Arreglar **una sola** errata de `docs/ROADMAP.md`: la línea 50 dice «Cuatro comprobaciones» y luego enumera cinco. Mencionarla en el mensaje del commit. **No tocar las líneas 86 ni 136**, que también dicen «54 tests»: no son erratas. El commit `35685d0` audita la contabilidad —54 antes del paso 10, 51 después, 53 hoy tras dos commits más—, así que ambas describen correctamente el momento del que hablan, y la 136 habla justamente del momento previo al refactor. La autorización para tocarlas está retirada
- [x] 8.6 Replicar en `openspec/config.yaml` lo que cambie del estado —el login real deja de ser «lo siguiente»— y comprobar con `npx openspec doctor` que el YAML sigue parseando
- [x] 8.7 Validar el cambio con `npx openspec validate auth-real`

## 9. Archivado

- [x] 9.1 Al archivar, revisar **a mano** el `## Purpose` de `openspec/specs/auth-sesion/spec.md`: los deltas no lo transportan, y hoy dice «mientras el login real no está conectado», que deja de ser cierto con este paso. Reescribirlo para que describa el acceso real, con el atajo de desarrollo en su sitio de atajo
- [x] 9.2 Al commitear, **enumerar las rutas** en `git add`. Nada de `git add -A`: el commit `982a299` se llevó por delante cuatro artefactos sin commitear que estaban en el árbol
