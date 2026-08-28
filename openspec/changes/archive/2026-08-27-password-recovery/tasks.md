> **El paso va en dos mitades y el orden importa.** Los grupos 1-5 son la mitad
> A, que se comprueba entera sin depender de ningún correo. Los grupos 6-9 son la
> mitad B. Si B se atasca, **A queda terminada igual y se dice**: no se da el
> paso por cerrado. El grupo 10 es un experimento posterior, no una condición.

## 1. Servicio y contexto: las tres operaciones de contraseña

- [x] 1.1 En `apps/web/src/services/auth.service.ts`, añadir `updatePassword(newPassword)` sobre `supabase.auth.updateUser({ password })`, con la forma `{ data, error }` y sin lanzar. Es la que usa `/reset-password`, donde no hay contraseña actual que pedir. Verificar con `npm run build`
- [x] 1.2 En el mismo archivo, añadir `changePassword({ email, currentPassword, newPassword })`, que **verifica primero** con `supabase.auth.signInWithPassword` y sólo entonces llama a `updateUser`. Vive en el servicio y **no** pasa por el `signIn` del contexto a propósito: ése mueve `loading` y `error` globales y trataría un tecleo equivocado como un fallo de sesión. Comentar las dos propiedades de la secuencia: la verificación emite una sesión nueva **del mismo usuario**, que es inocuo, y un `signInWithPassword` fallido **no toca** la sesión ya almacenada
- [x] 1.3 En el mismo archivo, añadir `requestPasswordReset(email)` sobre `resetPasswordForEmail()`, construyendo la URL de vuelta **con el patrón de `getOAuthRedirectUrl()`** —`new URL(ROUTES.RESET_PASSWORD, window.location.origin)`— y no con una cadena escrita a mano, que se desincronizaría de `routes.ts` y fallaría sólo dentro del correo. Verificar con el test de 5.1
- [x] 1.4 En `apps/web/src/context/AuthContext.ts` y `AuthProvider.tsx`, exponer las tres acciones siguiendo el patrón de las que ya hay: `setLoading`, `setError` y devolver si salió. **No tocar `_event`** en `onAuthStateChange`: la decisión 3 de `design.md` explica por qué no hace falta distinguir `PASSWORD_RECOVERY`
- [x] 1.5 Ajustar el doble de `AuthContext` en `apps/web/src/test/renderClassrooms.tsx` a las firmas nuevas. Verificar que `npm run test:run` sigue dando los 61 de hoy

## 2. Nota de diagnóstico, no puerta

- [x] 2.1 «Secure password change» está **apagado**, comprobado por el usuario en el panel, y no se toca durante el paso. Queda como nota: si en algún momento apareciera un error de reautenticación al cambiar la contraseña, ése es el interruptor responsable, y habría que traducir su mensaje en el servicio en vez de dejarlo pasar en inglés. **No es condición previa de nada**; el experimento de encenderlo es la tarea 10.1

## 3. Encender los dos botones de Ajustes

- [x] 3.1 Crear `apps/web/src/components/auth/ChangePasswordForm.schema.ts` con **dos** esquemas, junto a `LoginForm.schema.ts` y `SignupForm.schema.ts`: `changePasswordSchema` —actual + nueva + repetición— y `resetPasswordSchema` —nueva + repetición—. **Lo común se declara una vez y lo usan los dos**: el mínimo de 6 heredado de `signupSchema` —no inventar otro— y la igualdad entre las dos nuevas. Copiar esa regla es como los dos formularios acabarían con mínimos distintos sin que nadie lo decidiera
- [x] 3.2 Crear `apps/web/src/components/dashboard/shared/ChangePasswordPanel.tsx`, que es donde ya viven `StoreErrorNotice` y `ConfirmDialog`. **Tres** campos con `SignupField` —actual, nueva y repetición—, tomando el correo de `user.email` para la verificación, validación antes de llamar al contexto, y el resultado —éxito o motivo del fallo— visible en la propia pantalla. Tokens del tema: `coral` para el error y `mint` para la confirmación, como quedó en `Signup.tsx` en el paso 12
- [x] 3.3 Montar el panel desde `StudentSettingsModule.tsx`, dando `onClick` al botón muerto de la línea 106 para desplegarlo
- [x] 3.4 Montar el mismo panel desde `TeacherSettingsModule.tsx`, en el botón muerto de la línea 96. **Un solo componente para los dos**: dos copias divergirían al primer arreglo, como pasó con el `signOut` de las dos barras laterales
- [x] 3.5 Verificar que no se introduce ningún hex suelto ni ningún color fuera de `tailwind.config.js`, y que `npm run lint` sigue en cero warnings

## 4. Verificación de la mitad A contra la base real

- [x] 4.1 Crear una cuenta nueva desde `/signup` para probar. **No usar ni tocar las cuentas de `apps/web/.env`**: son las de los botones «Sin login» y cambiarles la contraseña rompe el acceso rápido. Correo reconocible a simple vista, del estilo `prueba.paso13.cambio@codeplay.test`
- [x] 4.2 **Antes del caso que funciona, probar el que no**: enviar una contraseña **actual incorrecta** con dos nuevas válidas e iguales. Comprobar que el motivo se ve en la pantalla, que **la sesión sigue abierta** —no rebota a `/login`— y, por `curl`, que la contraseña **antigua sigue entrando**. Ese último aserto es el que prueba que la verificación es real y no un campo decorativo: sin él, un `changePassword` que ignorase la actual pasaría la prueba igual
- [x] 4.3 Cambiar la contraseña con la actual **correcta** y comprobar que la pantalla lo confirma
- [x] 4.4 Cerrar sesión y comprobar por `curl` contra `/auth/v1/token?grant_type=password` **las dos respuestas, no una**: con la contraseña **antigua** el servidor responde con error, y con la **nueva** devuelve `access_token`. Una sola de las dos no prueba nada. **Nunca imprimir una contraseña en la salida**
- [x] 4.5 Comprobar los dos rechazos del formulario sin llegar al servidor: las dos nuevas distintas, y la nueva demasiado corta
- [x] 4.6 Comprobar que el mismo panel funciona igual desde el Ajustes del tutor. Reutilizar la cuenta de tutor que haga falta o crear una segunda cuenta de prueba, y **enumerar al final todas las cuentas creadas** para que el usuario las borre en `Authentication → Users`, que en cascada se llevan perfil y salones

## 5. Tests de lo que no depende del correo

- [x] 5.1 Crear `apps/web/src/services/auth.service.test.ts`: `requestPasswordReset()` llama a `resetPasswordForEmail` con `redirectTo` apuntando a `/reset-password` sobre el origen actual. Es la pieza cuyo fallo sólo se vería dentro del correo, que es el sitio más caro de depurar del proyecto
- [x] 5.2 Crear `apps/web/src/pages/ResetPassword/ResetPassword.test.tsx`: con las dos contraseñas distintas **no se llama al servicio** y se explica por qué; con las dos iguales sí se llama. Cubrir además que esa pantalla **no pide la contraseña actual**, que es la trampa de este paso

---

> **A partir de aquí es la mitad B.**

## 6. Puerta de la mitad B: configuración del panel

- [x] 6.1 **PUERTA YA PASADA.** El usuario enseñó `Authentication → URL Configuration` con el **Site URL** `http://localhost:5173` y la **Redirect URL** `http://localhost:5173/reset-password`, ambas puestas. No hay que volver a preguntar

## 7. Las dos pantallas nuevas y sus rutas

- [x] 7.1 Añadir `FORGOT_PASSWORD: '/forgot-password'` y `RESET_PASSWORD: '/reset-password'` a `apps/web/src/constants/routes.ts`
- [x] 7.2 Crear `apps/web/src/pages/ForgotPassword/ForgotPassword.tsx`: un campo de correo y el aviso de envío. El aviso **no debe revelar si la dirección tiene cuenta** —el mismo texto exista o no—, o la pantalla se convierte en un comprobador de cuentas dadas de alta. Marco visual de las pantallas de acceso, como `Login.tsx`
- [x] 7.3 Crear `apps/web/src/pages/ResetPassword/ResetPassword.tsx`: **dos campos y ni uno más**. Usa `resetPasswordSchema` —el que NO pide la contraseña actual— y `updatePassword()`, no `changePassword()`. Quien llega aquí es exactamente quien no sabe su contraseña: pedírsela sería exigirle el dato que vino a recuperar. **No monta `ChangePasswordPanel`**: vive fuera del dashboard y comparte la lógica, no el marcado
- [x] 7.4 En `apps/web/src/router/AppRouter.tsx`, montar `/forgot-password` tras `PublicRoute` y `/reset-password` tras **`PrivateRoute` sin prop `role`**. Dejar en comentario el porqué: el enlace del correo abre sesión real, así que `PublicRoute` apartaría a esa persona a su panel y la pantalla no se vería nunca; y declarar un rol rebotaría a la mitad de la gente al panel del otro. **`PrivateRoute` y `PublicRoute` no se tocan**: la prop `role` ya era opcional y este es el primer caso que la aprovecha
- [x] 7.5 Dar `onClick` al botón muerto de `pages/Login/Login.tsx:143` para que lleve a `/forgot-password`
- [x] 7.6 Comprobar a mano que `/reset-password` **sin ninguna sesión** redirige a `/login`, y que `/forgot-password` con sesión y rol lleva al panel de ese rol

## 8. Verificación de la entrega del correo

- [x] 8.1 Pedir la recuperación **una sola vez** contra la dirección del dueño del proyecto, que es la única a la que el correo de fábrica de Supabase llega con fiabilidad. **Esa dirección no se escribe en ningún archivo del repositorio** —ni aquí, ni en `docs/`, ni en el mensaje del commit—: el repositorio es público y en la documentación se la nombra «el correo del dueño del proyecto»
- [x] 8.2 Si el correo no llega, **diagnosticar antes de repetir**: el límite de envíos del correo de fábrica es de unos pocos por hora, y reintentar en bucle quema la cuota y bloquea la prueba durante una hora. Revisar primero la respuesta del servidor a la petición
- [x] 8.3 El enlace lo abre el usuario. Comprobar con él que aterriza en `/reset-password` y que la pantalla se ve, en vez de rebotar a un panel
- [x] 8.4 Fijar la contraseña nueva desde esa pantalla y comprobar por `curl` que la cuenta entra con ella

## 9. Cierre

- [x] 9.1 Ejecutar `npm run lint` (cero warnings), `npm run test:run` (los 61 de hoy más los nuevos) y `npm run build`. Los tres pasan hoy y no deben romperse
- [x] 9.2 En `docs/CONTEXT.md` §2.2, añadir las filas de lo que este paso cierra, y anotar en las decisiones de diseño **que el cambio desde Ajustes pide la contraseña actual y la verifica contra el servidor**, con su motivo —computadores de aula compartidos, y un niño puede no controlar el correo con el que se recupera— y con el límite que no cubre: protege a quien usa la aplicación, no a quien tenga el token de una sesión robada y llame a la API directamente, que sólo lo cierra el interruptor del servidor. **La única decisión abierta que queda anotada en acceso es la del rol elegido por el navegador**: la de la contraseña actual deja de estar abierta porque este paso la cierra
- [x] 9.3 En `docs/CONTEXT.md`, dejar constancia de qué mitad quedó terminada. Si B no se pudo verificar, **decirlo explícitamente en vez de dar el paso por cerrado**
- [x] 9.4 En `docs/ROADMAP.md`, poner la fila 13 a ✅ con `password-recovery` **sólo si las dos mitades están verificadas**. Si B quedó a medias, la fila se queda en 🔄 con el motivo escrito
- [x] 9.5 Replicar en `openspec/config.yaml` lo que cambie del estado y comprobar con `npx openspec doctor` que el YAML sigue parseando. Validar con `npx openspec validate password-recovery`
- [x] 9.6 Al archivar, revisar **a mano** el `## Purpose` de `openspec/specs/auth-sesion/spec.md`: los deltas no lo transportan. Hoy no menciona las contraseñas
- [x] 9.7 Al commitear, **enumerar las rutas** en `git add`. Nada de `git add -A`

## 10. Experimento posterior, con la mitad A ya funcionando debajo

- [x] 10.1 Con A verificada, **proponer al usuario** encender «Secure password change» y repetir la prueba de A, para ver si la reautenticación se satisface con la sesión recién creada por `signInWithPassword` o si el servidor exige además un **nonce por correo**. Si exige nonce: se apaga, se anota y no se implementa —el correo de fábrica no da para meter un envío en cada cambio de contraseña—. Si se satisface con la sesión, es defensa en profundidad gratis y se anota como tal. **Es un experimento, no una condición previa**, y el interruptor lo toca el usuario, no la sesión

**Resultado del experimento (27-ago-2026).** El usuario encendió el interruptor.
Con una cuenta nueva —`prueba.paso13.nonce@codeplay.test`—, el cambio desde Ajustes
funciona igual: `updateUser` responde 200, la pantalla confirma, la contraseña
anterior deja de entrar y la nueva entra. **El servidor NO pidió ningún nonce por
correo**: la sesión de segundos que emite `signInWithPassword` le basta. Se queda
encendido, no hay nada que implementar, y la cautela que queda —lo que satisface al
servidor es esa frescura, no el formulario— queda anotada en `CONTEXT.md` §2.2.
