## 1. Migración: el `username` del disparador

- [x] 1.1 Escribir `supabase/migrations/202606030019_bound_generated_username.sql`, que recree `public.handle_new_user_profile()` con el cuerpo de la 0018 y una sola diferencia: el nombre normalizado se descarta a `null` cuando no case con `'^[a-z0-9_]{3,30}$'`, la misma expresión del `check` de la 0002. Verificar leyendo el `.sql` que no toca ninguna tabla, ningún `check` y ninguna otra función.
- [x] 1.2 **PARAR Y AVISAR, antes de que se aplique nada.** Escrito el `.sql`, la sesión que ejecuta se detiene y avisa; la sesión que revisa **lee la migración** y da el visto bueno. Sin él no se sigue, no se pide el `db push` y no se toca ninguna tarea posterior de este grupo. Es la comprobación 9 de `docs/ROADMAP.md` §1.3, y el control que el paso 9 se saltó dos veces.
- [x] 1.3 **Bloqueada hasta el visto bueno de 1.2.** Pedir al usuario que lance `npx supabase db push`: la CLI pide credenciales por consola. **Leer la salida** y verificar que aplica la 0019 y ninguna más; si arrastra otras, hay migraciones sin aplicar en la base y eso se mira antes de seguir. **Salida del usuario:** la CLI listó una sola migración, `202606030019_bound_generated_username.sql`, y terminó con «Finished supabase db push». Ninguna arrastrada.
- [x] 1.4 Comprobar si `gen types` cambiaría algo antes de regenerar: buscar `handle_new_user_profile` en `apps/web/src/types/database.types.ts`. Si no aparece —lo esperable, es un disparador y no una RPC—, no se regenera nada y se anota. Si apareciera, lo lanza el usuario y **no se edita el archivo a mano**. **Resultado:** no aparece —`Functions` sólo expone las RPC—, así que `gen types` no cambia nada y no se regenera. `database.types.ts` queda sin tocar.
- [x] 1.5 Verificar con **tres** altas por `curl` contra `/auth/v1/signup`, leyendo credenciales del `.env` sin imprimirlas: (a) local-part de 2 caracteres → cuenta creada, `username` nulo; (b) local-part de más de 30 → cuenta creada, `username` nulo; (c) local-part normal y libre → cuenta creada **con** el `username` asignado. La (c) es la que prueba que no se rompió lo que funcionaba. **Resultado, contra la base real:**

  | Caso | Largo | `/auth/v1/signup` | `username` en `profiles` |
  | --- | --- | --- | --- |
  | a) `ab@…` | 2 | 200 | `null` |
  | b) `abcdefghijklmnopqrstuvwxyz1234567@…` | 33 | 200 | `null` |
  | c) `probamigracion0019@…` | 18 | 200 | `probamigracion0019` |

  Las dos primeras respondían «Database error saving new user» antes de la 0019. La tercera confirma que la asignación normal sigue funcionando.
- [ ] 1.6 Pedir al usuario que borre las tres cuentas de prueba desde el panel de Supabase: `apps/web/.env` sólo tiene la clave anónima, que no puede borrar usuarios.

## 2. Servicio de autenticación: mensajes en español

- [x] 2.1 En `apps/web/src/services/auth.service.ts`, añadir `AUTH_ERROR_MESSAGES` y el helper `authError()`, calcados de `ERROR_MESSAGES` y `classroomError()` de `classrooms.service.ts`: indexar por `error.code` de GoTrue, conservar el error original como causa y caer en el mensaje genérico en español cuando el código no esté contemplado.
- [x] 2.2 Sustituir por `authError()` **las ocho** llamadas a `createAppError` del archivo —líneas 64, 124, 148, 168, 192, 203, 220 y 261—, que son las de `applyNewPassword`, `getSession`, `requestPasswordReset`, `signIn`, **las dos de `signInWithGoogle`** (fallo del proveedor y URL ausente), `signOut` y `signUp`. Verificar con `grep -c createAppError` que no queda ninguna. **No tocar** la rama de `user_already_exists` (línea 248), que ya traduce y cuyo código lee `AuthProvider`. Verificar que `npm run test:run` sigue pasando `auth.service.test.ts`.
- [x] 2.3 Comprobar que las tres comparaciones de `error.code` de `AuthProvider.tsx` —`:66`, `:180` y `:298`— siguen mirando códigos que fijan los servicios a mano y no `String(error.status)`. Verificar en pantalla, no leyendo: registrarse con un correo ya dado de alta debe seguir saltando a `/login` con su aviso.
- [x] 2.4 **Provocar desde la pantalla lo que la interfaz puede provocar, y dejar escrito lo que no.** Con `npm run dev`: contraseña equivocada en `/login` → debe salir en español. Los otros dos casos los ejecuta el usuario (ver 2.5). El caso «contraseña demasiado corta en `/signup`» **se retira porque es imposible**, y el motivo se anota aquí en vez de taparlo con otro:

  **Ramas de `AUTH_ERROR_MESSAGES` que la interfaz de hoy NO puede disparar**, y por qué:

  | Rama | Por qué no llega |
  | --- | --- |
  | `weak_password` | `min(6)` de zod en los **cuatro** esquemas —`signupSchema`, `loginSchema`, `changePasswordSchema` y `resetPasswordSchema`, los dos últimos desde el `newPasswordShape` compartido de `ChangePasswordForm.schema.ts`—. El mínimo del servidor se configura en el panel de Supabase: **si algún día sube por encima de 6, zod deja de atraparlo y la rama se enciende**. Por eso la entrada se queda |
  | `email_address_invalid` | `z.string().email()` valida antes de enviar |
  | `validation_failed` | Los esquemas cubren los campos que se mandan |
  | `email_not_confirmed` | `mailer_autoconfirm` está encendido en el proyecto |
  | `signup_disabled` | El interruptor está activo |
  | `user_not_found` | `resetPasswordForEmail` responde igual exista o no la cuenta, a propósito |
  | `reauthentication_needed` | No se pudo fabricar; ver `docs/CONTEXT.md` §2.2 |
  | `over_request_rate_limit` | Alcanzable repitiendo fallos en `/login`, **no se provoca a propósito**: dejaría el proyecto limitado un rato |

  Sí alcanzables y sin provocar aquí: `same_password` (no hay comprobación en cliente de que la nueva sea distinta), `otp_expired` y `flow_state_expired` (enlace de correo caducado), `session_not_found`, `over_email_send_rate_limit`.
- [x] 2.5 **Los dos casos que ejecuta el usuario**, y anotar literal su respuesta con el código: (a) en Ajustes → «Cambiar contraseña», teclear la contraseña actual **equivocada** —no puede cambiar nada, porque el camino termina en el rechazo de la reautenticación— y leer el aviso; (b) en `/signup`, registrarse con un correo **que ya tiene cuenta** —no crea ninguna, la que hay ya existe— y comprobar que salta a `/login` con su aviso, que es la mitad en pantalla de la 2.3. **Ninguno de los dos pasa por `AUTH_ERROR_MESSAGES`**: (a) lo construye `changePassword` a mano y (b) la rama `ACCOUNT_ALREADY_EXISTS`; son regresión de que no se rompió lo que ya estaba en español. **Respuesta del usuario, literal:** (a) «La contraseña actual no es correcta.» — el `AppError` de `changePassword` con código `auth_wrong_current_password`; (b) «Ya existe una cuenta con ese correo. Inicia sesión.», leída **en `/login`**, o sea que el salto y el código `ACCOUNT_ALREADY_EXISTS` siguen enteros.

## 3. Panel del niño: dejar de inventar datos

- [x] 3.1 Exportar `FALLBACK_STUDENT_NAME` desde `apps/web/src/services/classrooms.service.ts`, sin cambiar su valor ni duplicarlo.
- [x] 3.2 `Sidebar.tsx:103-104`: nombre a `|| FALLBACK_STUDENT_NAME` importado, racha a `?? 0`.
- [x] 3.3 `StudentTopBar.tsx:39`: racha a `?? 0`.
- [x] 3.4 `StudentSettingsModule.tsx:29-31`: nombre a `|| FALLBACK_STUDENT_NAME`, racha a `?? 0`, y **quitar** el correo de ejemplo sin poner otro en su lugar.
- [x] 3.5 Verificar que `SidebarPlayerCard.tsx:24` y `WelcomeBanner.tsx:33` siguen intactos: su `|| 0` es correcto y no los monta nadie.
- [x] 3.7 `StudentWorldsModule.tsx:90-94`: `getHeroName` devuelve `'Leo'` a secas —literal distinto de `'Explorer Leo'`, por eso no salió al buscar—, y la línea 298 lo pinta como «¡HOLA, Leo!». Replegar a `FALLBACK_STUDENT_NAME` **en el `if (!fullName)` y en el `||` final**, sin tocar el recorte del primer nombre. Es el quinto archivo, y cerrarlo no es opcional: el escenario «Perfil sin nombre» del delta de `auth-sesion` no se cumple con «¡HOLA, Leo!» en pantalla.
- [x] 3.6 Verificar **en pantalla** con la cuenta de niño del `.env`: la barra lateral y la barra superior muestran `0 días`, no `42`, y en ningún sitio aparece «Explorer Leo» ni `explorador@codeplay.co`.

## 4. Barra de XP: la primitiva y su máximo

- [x] 4.1 Crear `apps/web/src/constants/progress.ts` con `PROVISIONAL_MAX_XP = 1000` —el valor está fijado aquí, no se decide al implementar: es el único precedente del repo, el `maxXP={1000}` de `WelcomeBanner`— y un comentario que diga que el esquema no tiene umbrales de XP y que los fija el paso 22. Declararla **una sola vez**; nadie más escribe el número.
- [x] 4.2 Retintar `apps/web/src/components/ui/XPBar.tsx` al tema selva: `text-ink-soft`, pista `bg-jungle-soft` con `border-2 border-ink`, relleno `from-jungle-light to-jungle`. Verificar con `grep` que no queda ningún `neutral` ni `secondary` en el archivo, ni ningún hexadecimal suelto.
- [x] 4.3 Verificar que `WelcomeBanner.tsx` sigue compilando pese al retintado: `npm run build` pasa. No se adapta ni se borra — es huérfano y se rehace en su paso.

## 5. Barra de XP: las cuatro ubicaciones

- [x] 5.1 `Sidebar.tsx`: montar `XPBar` **debajo** del chip de racha (líneas 163-166), con `user?.xp ?? 0` y `PROVISIONAL_MAX_XP`.
- [x] 5.2 `StudentTopBar.tsx`: montar `XPBar` **a la izquierda** del chip de racha (líneas 61-64), con el ancho acotado para que no empuje la cabecera.
- [x] 5.3 `StudentRosterTable.tsx`: ampliar las **dos** ramas de `gridColumns` con una pista para el XP —vista del niño entre «Última actividad» y «Racha», vista del tutor entre «Racha» y «Acciones»— y emitir el encabezado y la celda en la posición que corresponde a cada rama. `showLabel={false}`: en una columna no cabe la etiqueta.
- [x] 5.4 **No unificar las dos posiciones.** Verificar que siguen siendo distintas: lo pidió el usuario así.
- [x] 5.5 Verificar **en pantalla** las cuatro: panel del niño con la cuenta de niño del `.env`, tabla del salón desde la vista del niño, y detalle del salón desde la cuenta de tutor. Las cuatro barras muestran `0` sin cifra inventada, y ninguna se ve gris.

## 6. Dos tests, y sólo dos

El mapa de mensajes **no** se testea: el test repetiría el mapa y los dos dirían
la misma mentira. Se testea la fontanería, que es donde un fallo pasa inadvertido.

- [x] 6.1 En `apps/web/src/services/auth.service.test.ts`, añadir un `it(` que compruebe que un `AuthError` con mensaje en inglés **no acaba en `AppError.message`**: el mensaje sale en español y el texto crudo del servidor queda accesible como causa. No comprueba qué dice cada entrada del mapa, sólo que la traducción está cableada.
- [x] 6.2 Añadir un `it(` que fije el `?? 0` de la racha frente al `|| 0`: con `streakDays` a `0` la pantalla muestra `0`, no el valor de relleno. Es el fallo que vivió meses sin que nadie lo viera, y las dos versiones se ven idénticas en cualquier cuenta que sí tenga racha. Si hace falta un archivo de test nuevo, colocarlo junto al componente que prueba, como el resto del repo.

## 7. Cierre

- [x] 7.1 Ejecutar `npm run lint`, `npm run test:run` y `npm run build`. Los tres pasan hoy y no deben romperse. Comparar los tests **por el nombre de cada `it(`**, no por el total: se parte de **75 en 8 archivos** y se llega a **77**, con los dos del grupo 6 y ningún `it(` retirado. Si el 6.2 estrenó archivo, son 9.
- [x] 7.2 Actualizar `docs/CONTEXT.md`: mover a «aplicadas» lo que corresponda con las rutas reales, y anotar **tres** cabos sueltos nuevos —que `profile.service.ts` sigue devolviendo inglés; que la tabla gana una columna y empeora a 375 px (paso 25); y **qué ramas de `AUTH_ERROR_MESSAGES` no puede alcanzar la interfaz de hoy**, con la tabla de la 2.4—. Los tres se anotan, no se cierran.
- [x] 7.3 Marcar la fila **28** en `docs/ROADMAP.md` §2, colocada **antes de la 16**, con su motivo en §2.1, y **retirar de §3 los tres cabos sueltos que este cambio cierra** (el `username` del disparador, los fallos en inglés y los datos inventados del panel). Al retirar el tercero, **corregir su recuento**: el cabo suelto dice «TRES archivos» y son **cinco**, con **siete** líneas —`Sidebar.tsx` ×2, `StudentTopBar.tsx`, `StudentSettingsModule.tsx` ×3 y `StudentWorldsModule.tsx` ×2, este último con el literal `'Leo'` a secas, que es por lo que no salió al buscar `'Explorer Leo'`—.
- [x] 7.4 Corregir **`docs/ROADMAP.md` §3.2** en el mismo cierre: su párrafo sobre `XPBar` —«usa `text-neutral-light`, `bg-neutral-dark` y `from-secondary to-secondary-light`… Reutilizarla exige retintarla»— queda obsoleto en cuanto se retinte. Deja escrito que ya está hecho y en qué cambio, para que el paso 21 no lo lea como pendiente. La tabla de «¿Se renderiza?» de esa misma sección también cambia: el XP ya no se ve sólo en Ajustes.
- [x] 7.5 Comprobar si `openspec/config.yaml` necesita réplica —sólo si cambiaron stack, estructura, convenciones o prioridades— y que `npx openspec doctor` sigue parseando.
- [ ] 7.6 Preparar el commit **enumerando las rutas** en `git add`, nunca `git add -A`.
