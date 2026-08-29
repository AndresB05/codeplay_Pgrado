> **ORDEN DE EJECUCIÓN, que ya no es el orden de los números.** Los grupos 1-7
> están hechos y verificados. El **grupo 10 es lo que queda por construir** —la
> regla del rol, la migración 0018 y las dos direcciones— y **va antes** del
> grupo 8, que es su verificación. El grupo 9 cierra.
>
> **La regla que manda desde ahora:** el rol se fija en el **primer registro** y
> **no cambia nunca**. Enlazar proveedores es legítimo y tiene que seguir
> funcionando; lo que se rechaza es **crear una cuenta que ya existe**.
>
> Lo que el usuario **ya hizo** el 28-ago-2026, y no hay que volver a pedirle:
> el proyecto de Google Cloud, la pantalla de consentimiento, el cliente OAuth y
> las credenciales pegadas en el panel —incluido **repegar el Client Secret**,
> que era lo que tenía el paso bloqueado—. **Nunca se le pide el secreto.**

## 1. Puerta: la ruta de vuelta en el panel de Supabase

- [x] 1.1 **PUERTA YA PASADA.** El usuario añadió la ruta de vuelta a **Redirect URLs** en `Authentication → URL Configuration`. La lista tiene ahora `http://localhost:5173/reset-password`, `http://localhost:5173/auth/callback` y un comodín `http://localhost:5173/**`. El Site URL sigue siendo `http://localhost:5173`. No hay que volver a preguntar
- [x] 1.2 Dejar anotado que **el comodín se retira al desplegar**, y por qué: enmascara errores de ruta, y con el flujo `implicit` —que es el que usa este cliente, ver `design.md` Risks— haría que cualquier ruta del dominio real pudiera recibir un refresh token en el fragmento de la URL. En localhost se queda. La anotación va en `CONTEXT.md`, tarea 9.3

## 2. La migración, que se lee antes de aplicarse

- [x] 2.1 Crear `supabase/migrations/202606030017_create_set_my_role_rpc.sql` con `set_my_role(input_role text)`, calcada de `update_my_profile` de la `...0006`: `language plpgsql`, `security definer`, `set search_path = public`, `returns public.profiles`. `auth.uid()` **dentro del cuerpo y nunca como parámetro**, y `raise ... using errcode = '42501'` si es nulo. Verificar leyendo el archivo junto a la 0006 que las cuatro piezas están y en el mismo orden
- [x] 2.2 En la misma función, validar el parámetro: si no es `child` ni `tutor`, `raise ... using errcode = '22023'` sin escribir nada. **Parámetro `text` y no el enum** a propósito —con el enum el valor inválido muere en la conversión de PostgREST con un error que no dice nada útil—; el enum `user_role` sigue siendo la última defensa, como en el disparador. `raise ... using errcode = 'P0002'` si el `update` no encuentra la fila
- [x] 2.3 Cerrar la migración con `revoke all on function public.set_my_role(text) from public, anon;` y `grant execute on function public.set_my_role(text) to authenticated;`. **Revocar de `public` no basta**: la 0009 enseñó que eso no retira lo concedido directamente a un rol, hay que revocar de `anon` aparte. Verificar comparando con las tres últimas líneas de la 0006
- [x] 2.4 **Leer el SQL entero con el usuario ANTES de que lance el `db push`** (comprobación 9 de `ROADMAP.md` §1.3). Es él quien lo lanza, porque pide credenciales por consola
- [x] 2.5 Con el `db push` lanzado, **leer la salida**: tiene que aplicar la 0017 y **ninguna más**. Si arrastra otras, hay migraciones sin aplicar en la base y eso se mira antes de seguir
- [x] 2.6 Comprobar contra la base real que la función existe y que su reja funciona, **con las dos respuestas**: llamarla por REST **sin sesión**, sólo con la clave anónima, y comprobar que responde permiso denegado; y llamarla **con la sesión de la cuenta de prueba** pasando un valor que no es `child` ni `tutor`, y comprobar que responde `22023` y que el rol del perfil **no cambia**. Con `curl` o Python; **nunca imprimir la contraseña ni el `access_token`**
- [x] 2.7 **Tarea que faltaba en el plan, y es una puerta del `build`:** pedir al usuario que regenere los tipos con `npx supabase gen types typescript --linked`, que también pide credenciales por consola. `types/database.types.ts` **se genera y nunca se edita a mano**, y su bloque `Functions` no conoce `set_my_role`: hasta que se regenere, `profileService.setMyRole()` no compila y `npm run build` falla. Es el mismo paso que el 8 del `ROADMAP.md` hizo tras la 0007. Verificar que `set_my_role` aparece en el bloque `Functions` del archivo regenerado
**Resultado del grupo 2 (28-ago-2026).** El `db push` aplicó **la 0017 y ninguna
más**. Los tipos se regeneraron y se instalaron a mano tras convertirlos de UTF-16LE
—PowerShell escribe así con `>`— y pasarlos por Prettier: **diff real de 22 líneas,
sólo `set_my_role` bajo `Functions`**, o sea que el esquema no tenía deriva. El tipo
generado declara `isOneToOne: true` e `isSetofReturn: false`, que es lo que hace
correcto el `.single()` de `setMyRole()`.

La reja de la función está medida contra la base real, no razonada:

| Llamada | Respuesta |
| --- | --- |
| Sin sesión, sólo clave anónima | 401, `42501`, «permission denied for function set_my_role» |
| Sesión de **tutor** + `"superadmin"` | `22023`; su rol sigue `tutor`, leído filtrando por su id |
| Sesión de **niño** + `"superadmin"` | `22023`; su rol sigue `child` |
| `null`, `""` y `"CHILD"` | Rechazados los tres |

Las dos respuestas comprobadas en cada caso: que la llamada falle **y** que el rol no
haya cambiado. `"CHILD"` importa aparte: confirma que la comparación distingue
mayúsculas y que no hay normalización silenciosa que dejara pasar un valor casi bueno.

- [x] 2.8 Documentar la **0017 y la 0018** en `supabase/README.md`. Al hacerlo apareció que **la 0016 tampoco estaba documentada** —se quedó fuera de `invitaciones-sin-correo`— y el listado tenía un hueco: se añade también, marcada como entrada tardía, y se corrige el recuento del final del archivo, que decía quince cuando ya son dieciocho. La pega de `P0002` de la tarea 10.5b queda anotada ahí, junto a la 0018

## 3. La intención de rol, en su propio módulo

- [x] 3.1 Crear `apps/web/src/context/oauthRole.helpers.ts` con el patrón de `context/guest.helpers.ts`: **la clave se declara una vez** y se expone por funciones, porque ningún componente toca `localStorage` directamente. Tres funciones: guardar, **leer-borrando** y borrar. Verificar con el test de 3.2
- [x] 3.2 Crear `apps/web/src/context/oauthRole.helpers.test.ts`: la intención guardada **se consume una sola vez** —la segunda lectura devuelve nulo—, un valor guardado que no sea `child` ni `tutor` no se devuelve como rol, y borrar deja el almacén sin la clave. Es la mitad de la cobertura que el paso pide, y la que impide que una intención vieja se aplique en un segundo viaje
- [x] 3.3 Comentar en el módulo **por qué la lectura borra** en la misma llamada y no en dos funciones: con `get` + `clear` separados, cualquier camino que devuelva antes de la segunda deja una intención viva que se aplicaría al siguiente viaje, que en un computador de aula puede ser el de otra persona

## 4. El servicio, el contexto y la ruta de vuelta

- [x] 4.1 Añadir `AUTH_CALLBACK: '/auth/callback'` a `apps/web/src/constants/routes.ts`
- [x] 4.2 En `apps/web/src/services/auth.service.ts`, apuntar `getOAuthRedirectUrl()` a `ROUTES.AUTH_CALLBACK` en lugar de `ROUTES.DASHBOARD`. Verificar con el test de 7.1
- [x] 4.3 En `apps/web/src/services/profile.service.ts`, añadir `setMyRole(role, email)` sobre la RPC `set_my_role`, con la forma `{ data, error }` y devolviendo el `User` mapeado desde la fila que retorna la función. Es la segunda escritura que pasa por RPC, igual que `updateProfile()`: la escritura directa sobre `profiles` sigue revocada
- [x] 4.4 En `apps/web/src/context/AuthContext.ts` y `AuthProvider.tsx`, hacer que `signInWithGoogle` acepte un rol **opcional**: con rol guarda la intención, **sin rol la borra**. Los dos momentos de descarte son distintos y los dos hacen falta —el de la partida impide que una intención vieja se aplique a un acceso que nunca la pidió—
- [x] 4.5 En los mismos dos archivos, añadir `updateRole(role)`, que llama a `profileService.setMyRole()` y deja `user` con la fila que devolvió el servidor. **No toca `loading`**, por la misma razón que las tres acciones de contraseña del paso 13: esa bandera significa «la sesión se está resolviendo» y las guardas cambian su subárbol entero por un spinner; aquí la sesión ya está resuelta
- [x] 4.6 **No tocar el subscriptor de `onAuthStateChange`** (`AuthProvider.tsx:96-122`). Es el arreglo del paso 13, compara el id del usuario a propósito y sigue sin leer `_event`. Verificar con `git diff` que esas líneas no aparecen en el cambio
- [x] 4.7 Ajustar el doble de `AuthContextValue` en `apps/web/src/test/buildAuthValue.ts` a las dos firmas nuevas, y comprobar con `npm run test:run` que los 66 de hoy siguen pasando

## 5. La pantalla de vuelta

- [x] 5.1 Crear `apps/web/src/pages/AuthCallback/AuthCallback.tsx`: espera a que el perfil esté cargado, lee la intención **borrándola**, y **sólo si hay intención y no coincide** con `user.role` llama a `updateRole()`. Después navega con `getHomeRouteForRole()` sobre el rol que devolvió el servidor, como ya hace `hooks/useRoleHomeRedirect.ts`. Mientras tanto muestra un aviso de acceso en curso, con el marco de las pantallas de acceso y **los tokens del tema**, nunca hex sueltos
- [x] 5.2 Montar la ruta en `apps/web/src/router/AppRouter.tsx` **sin guarda**, y dejar en comentario el porqué. Se montó primero tras `PrivateRoute` sin prop `role`, imitando a `/reset-password`, y **eso resultó estar mal**: cuando el proveedor devuelve un error tampoco hay sesión, así que la guarda redirigía a `/login` y **descartaba el fragmento con el motivo** antes de que la pantalla se montara. Una guarda sólo sabe que no hay sesión y no puede distinguir «el proveedor falló» de «alguien escribió la dirección». **`PrivateRoute` y `PublicRoute` siguen sin tocarse**: ninguna sabe nada de esta ruta
- [x] 5.3 Comprobar a mano los **tres** estados de la pantalla de vuelta, no dos

**Medido en el navegador el 28-ago-2026, después de quitar la guarda:**

| Estado | Resultado |
| --- | --- |
| Fragmento de error del proveedor | Se queda en `/auth/callback` y **muestra el motivo**; ofrece «Volver al acceso» |
| Sin sesión y sin error | → `/login`, igual que antes |
| Con sesión (tutor) e intención `tutor` que coincide | → `/teacher/groups`, intención **consumida**, sin escritura, cero errores en consola |

También se comprobó que **el fragmento de error sobrevive** a la carga: el
cliente de Supabase sólo lo limpia cuando consigue extraer una sesión de él, así
que la pantalla puede leerlo sin trucos de orden de importación. Eso se midió
aparte, cargando `/login` con un fragmento de error y viendo que seguía en la URL.

## 6. Los dos botones, que no son simétricos

- [x] 6.1 En `pages/Signup/Signup.tsx`, que `handleGoogleSignup` pase el rol ya elegido. El botón vive dentro de `step === 'form'` (línea 301), es decir **después** de las tarjetas de `step === 'role'`: el rol está en el estado del componente en el momento del clic y hoy se tira
- [x] 6.2 En `pages/Login/Login.tsx`, que `handleGoogleSignIn` **no** pase rol (línea 197). Quien entra ahí ya tiene cuenta, y esa llamada además borra cualquier intención pendiente
- [x] 6.3 Borrar `apps/web/src/components/auth/GoogleAuthButton.tsx`. No tiene consumidores —comprobarlo con `grep` antes de borrar— y usa `border-gray-300`, `text-gray-700` y `hover:bg-gray-50`, fuera del tema. **No se adopta**: los dos botones en línea no son el mismo —textos distintos, y sólo uno lleva rol—, y unificarlos costaría más que el marcado que ya está bien
- [x] 6.4 Verificar con `npm run lint` (cero warnings) y `npm run build` que nada quedaba importándolo

## 7. Tests de lo que no depende del navegador

- [x] 7.1 En `apps/web/src/services/auth.service.test.ts`, añadir el equivalente de lo que ya se prueba para la recuperación: `signInWithGoogle()` llama a `signInWithOAuth` con `redirectTo` apuntando a `/auth/callback` sobre el origen actual, construido desde `ROUTES` y no con una cadena a mano. El fallo de esa URL **no se ve en la aplicación**: se ve como una vuelta al Site URL que parece un fallo de código
- [x] 7.2 Comprobar con `npm run test:run` que los 66 de hoy más los nuevos pasan. **Si uno que pasaba deja de pasar, esa es la señal que se pagó por tener**: se mira, no se «arregla»
- [x] 7.3 **Comparar los tests por los NOMBRES de los `it(`, no por el número** (comprobación 7 de `ROADMAP.md` §1.3): `git show HEAD:<ruta>` contra el archivo actual, en los cinco archivos de test. Un total que cuadra puede esconder uno retirado y otro añadido, y este cambio toca `test/buildAuthValue.ts`, que es el doble que montan varios de ellos: un ajuste de firma mal hecho puede dejar un test pasando por el motivo equivocado

## 8. Verificación contra la base real

> Patrón en `docs/CONTEXT.md` §5. Herramientas: `curl` 8.19 y Python 3.12; **no
> hay `psql` ni `gh`**. Reglas: nunca imprimir una contraseña ni un
> `access_token`, y **comprobar las dos respuestas, no una**.
>
> **No crear ni borrar cuentas por cuenta propia.** Si hace falta una cuenta
> nueva, se le pide al usuario y se le explica para qué. Las cuentas de prueba
> de los pasos 12, 13 y 14 ya están borradas: no pedirle que borre nada que no
> se haya creado en este paso.

- [x] 8.0 **Antes de medir nada, preguntar al usuario cuántas cuentas de Google distintas tiene disponibles.** La aplicación sigue «En prueba» en Google, así que **cada correo nuevo tiene que estar en la lista de usuarios de prueba de Google Cloud** o recibirá «Acceso bloqueado», que parece un fallo del código y no lo es. Con el número delante, recortar con él el plan de verificación —qué casos se miden y con qué cuenta cada uno— y **dejar escrito qué quedó sin medir y por qué**

> **REPARTO DE LAS TRES CUENTAS, rehecho el 28-ago-2026 tras aplicar la 0018.**
> Se las llama A, B y C; **sus direcciones no se escriben aquí**, que el
> repositorio es público. Estado de partida: cuatro cuentas, todas con
> `is_role_declared = true` por el backfill, el tutor «Profe Prueba» dueño de
> «salon sigma» (`CP-5J6H`) y dos niños con membresía. **Ninguna cuenta queda
> sin declarar**, así que los casos que necesitan una hay que crearla.
>
> **Cada paso con Google lo conduce el usuario**: la pantalla de consentimiento
> es de Google y ahí no se meten credenciales por él. Esta sesión lee la base
> antes y después, por REST.
>
> **Hacen falta DOS puntos de borrado**, y van anunciados: no se puede medir un
> alta nueva sobre un correo que ya tiene cuenta.
>
> | Ronda | Cuenta | Caso | Qué se espera |
> | --- | --- | --- | --- |
> | 1 | **A** | 8.1 `/signup` + Tutor + Google | `tutor`, declarado `true`, a `/teacher/groups` |
> | 1 | **B** | 8.7 `/signup` + Tutor + **contraseña** | `tutor`, declarado `true` |
> | 1 | **C** | 8.4 `/login` + Google | `child`, declarado **`false`** |
> | 2 | A | 8.3 `/login` + Google | rol sin cambios |
> | 2 | B | 8.6 `/signup` + **Niño** + Google | enlaza, **`ZC001`**, aviso neutro que dice «Tutor», sesión abierta |
> | 2 | B | 8.11 repetir 8.6 | mismo rechazo |
> | 2 | C | 8.10b, 8.10 y 8.11 | **cinco medidas con una sola cuenta**, en el orden del bloque de abajo |
> | 2 | C | 8.9 `/signup` con formulario y el correo de C | 422 genérico, sin sesión, a `/login` |
> | — | | **BORRADO de A y B** | |
> | 3 | A | 8.2 `/signup` + Niño + Google | `child`, declarado `true`, a `/dashboard/worlds` |
> | 3 | B | 8.4' `/login` + Google, luego 8.10 `/signup` + Tutor + Google | **se aplica**: sin lazos, la primera declaración vale |
> | 3 | — | 8.12 y 8.8 | el salón intacto, y la lista de cuentas a borrar |
>
> **`ZC002` (tarea 8.10b) es además la mitad de 10.5 que no se pudo medir sin
> crear cuentas.**

> **SECUENCIA DE LA CUENTA C, y el orden es la parte importante.** C tiene que
> medir `ZC002` **y** 8.10, y son **excluyentes en el orden ingenuo**: si 8.10 va
> primero, C queda declarada y a partir de ahí cualquier intento choca antes con
> `ZC001`, de modo que `ZC002` no llegaría a probarse nunca. No hay una cuarta
> cuenta de Google con la que arreglarlo después.
>
> El orden que sí funciona **aprovecha que `ZC002` mira `status = 'pending'`**, y
> que quitar a un alumno del salón es un `delete` sobre `class_memberships`
> (0013:189) que **no toca `join_requests`**: la fila se queda en `'accepted'`,
> que la reja ya no mira.
>
> | # | Acción | Qué se espera | Tarea |
> | --- | --- | --- | --- |
> | 1 | C pide entrar a «salon sigma» y el tutor **NO** acepta | solicitud `pending` → ascender da **`ZC002`** | 8.10b, rama *solicitud* |
> | 2 | El tutor **acepta** | membresía → ascender da **`ZC002`** otra vez | 8.10b, rama *membresía* — **el caso Taxo** |
> | 3 | El tutor la **quita** del salón | sin membresía y con la solicitud en `'accepted'`: **C vuelve a estar sin lazos y sigue SIN declarar** | — |
> | 4 | Ascender | **SE APLICA**, y queda declarada | 8.10 |
> | 5 | Ascender pidiendo **el OTRO rol** (Niño) | **`ZC001`**: la marca ya es `true` | 8.11 |
> | 5b | Ascender pidiendo **el mismo rol** (Tutor) | **no se llama a la RPC** y no hay aviso | 8.11b |
>
> **Cinco medidas con una sola cuenta**, y las dos condiciones del cierre por
> separado. El paso 1 es además la sonda más barata y **reversible**: si algo
> saliera mal, el tutor rechaza o C cancela.

**Resultados de la secuencia de C (29-ago-2026).** C es `taxoxolotl`,
`2e2a77eb…`, creada desde el botón de `/login` con Google. Nació **`child` y sin
declarar**, que es la premisa de todo lo demás.

**Paso 1 — `ZC002`, rama de la solicitud pendiente. MEDIDO.** Con la solicitud a
«salon sigma» en `pending`, C fue a `/signup`, eligió «Tutor» y entró con Google.
El rol **no cambió** y la pantalla mostró el **aviso neutro**.

Lo que lo prueba no es que el rol siga igual, sino **que `updated_at` no se
movió**: siguió en el valor del alta, `01:33:47.138924`. El disparador
`handle_profiles_updated_at` mueve esa marca ante **cualquier** `update`, así que
un `update` que hubiera reescrito el mismo rol también la habría movido. **No
hubo escritura de ninguna clase.** Es prueba más fuerte que comparar el rol.

**Y se puede afirmar cuál de los dos códigos fue sin abrir el inspector de red:**
el aviso neutro sólo lo produce `PROFILE_ROLE_LOCKED`, que sólo llega desde
`ZC001` o `ZC002`; `ZC001` exige `is_role_declared = true`, y seguía `false`.
Luego fue `ZC002`.

**Una simetría que conviene dejar escrita:** el perfil de C se hizo visible a la
sesión del tutor **por la rama de solicitud pendiente de
`is_visible_student_of`**, que es **la misma condición** que levanta `ZC002`. La
visibilidad y el bloqueo cuelgan del mismo hecho: se puede leer la fila
precisamente porque está bloqueada.

**Paso 2 — montaje del caso Taxo.** El tutor aceptó la solicitud desde esta
sesión (`accept_join_request` → 200). Estado resultante de C: **membresía** en
«salon sigma» desde `01:47:23`, solicitud en `accepted`, **cero pendientes** en
toda la base, y el perfil intacto —`child`, sin declarar, `updated_at` otra vez
sin moverse: aceptar una solicitud no toca `profiles`—.

Eso **aísla la segunda rama**: sin ninguna solicitud pendiente, si `ZC002` vuelve
a levantarse en el paso 2b sólo puede ser por la **membresía**.

**Paso 2b — `ZC002`, rama de la membresía. MEDIDO. Es el daño de Taxo
reproducido paso por paso, NO ocurriendo.**

C repitió `/signup` + «Tutor» + Google, ya con la membresía puesta. Resultado:

| Comprobación | Valor |
| --- | --- |
| `role` | `child` — no cambió |
| `is_role_declared` | `false` |
| `updated_at` | `01:33:47.138924`, el del alta: **ninguna escritura** |
| Membresía en «salon sigma» | **intacta** |
| A ojo, desde la pantalla de salón del alumno | sigue viendo a sus tres compañeros |
| Solicitudes `pending` en toda la base | **cero** |

Como no quedaba **ninguna** solicitud pendiente, este `ZC002` sólo pudo venir de
la **membresía**. Las dos ramas quedan medidas **por separado**.

La comparación con el incidente que motivó la regla es exacta: misma cuenta sin
declarar, mismo salón, mismo camino —`/signup`, «Tutor», Google—, y el resultado
opuesto. Antes quedaba `tutor`, fuera de su salón y fantasma en la lista de su
tutor. Ahora no se escribe nada y conserva su sitio.

**Paso 3 — se le quita el lazo, y la visibilidad se apaga con él.** El tutor
borró la membresía desde esta sesión (`DELETE` sobre `class_memberships` → 200).
Estado de C: **0 membresías, 0 solicitudes pendientes, 0 salones propios**; su
única solicitud quedó en `accepted`, que la reja ya no mira.

Y el efecto colateral **es la mejor prueba de que los lazos se fueron**: el
perfil de C **dejó de ser visible** para la sesión del tutor. Es la misma
simetría del paso 1, ahora al revés — se podía leer la fila porque estaba
bloqueada, y deja de poder leerse justo cuando deja de estarlo.

**Consecuencia práctica para los pasos 4 y 5**, decidida antes de pedir datos: a
partir de aquí esta sesión **no puede leer el perfil de C** —sin lazos primero, y
`tutor` después, que un tutor no ve a otro—. Los dos pasos se verifican por lo
que enseña la pantalla, que en estos casos es concluyente:

- **Paso 4**: si el ascenso se aplica, C aterriza en `/teacher/groups` como
  Tutor. Un rechazo la habría dejado en el aviso neutro y en `/dashboard/worlds`.
  Los dos desenlaces son distinguibles a ojo, sin leer la base.
- **Paso 5**: si sale el aviso neutro, sólo puede ser `ZC001`. `ZC002` está
  descartado —C no tiene ningún lazo— y la marca quedó en `true` en la misma
  sentencia que escribió el rol en el paso 4.

**Paso 4 — la primera declaración legítima SE APLICA. MEDIDO.** Sin lazos y sin
declarar, C fue a `/signup`, eligió «Tutor» y entró con Google: el ascenso se
aplicó y aterrizó en `/teacher/groups` como Tutor, **sin aviso neutro**. Es la
mitad que la reja no debía morder, y la que justifica que el cierre cuelgue de
dos condiciones y no sólo de la marca.

Estado de la base leído después, con la sesión del tutor: «salon sigma» intacto
con sus **dos alumnos originales**, y los tres perfiles visibles con
`updated_at` en `01:03:51` — que es **el momento del backfill de la 0018**, así
que nada los ha tocado desde entonces. C **ya no es visible**: tutor y sin lazos,
que es la contraprueba del paso 3. Y no tiene ningún salón propio.

**Corrección al plan del paso 5, y el error era de esta sesión.** Se había
escrito «repetir eligiendo Tutor → `ZC001`», y **eso no mide `ZC001`**:
`AuthCallback` sólo llama a la RPC cuando la intención **difiere** del rol del
perfil (decisión 3, «sólo se llama si hace falta»). Repitiendo con «Tutor», C ya
es tutor, la llamada no se hace, y no hay ni rechazo ni aviso — se habría anotado
como cierre por marca algo que en realidad nunca llegó al servidor.

Los dos casos son distintos y **los dos están en el delta**, así que se miden los
dos. Su señal distintiva es la presencia o ausencia del aviso:

| Paso | Se elige | Qué pasa | Requisito |
| --- | --- | --- | --- |
| 5 | **Niño** | `child ≠ tutor` → se llama a la RPC → la marca está en `true` → **`ZC001`**, aviso neutro diciendo «Tutor», y a `/teacher/groups` | «Se intenta registrar con Google una cuenta que ya declaró su rol» |
| 5b | **Tutor** | coincide → **no se llama a la RPC**, **no hay aviso**, directo a `/teacher/groups` | «El perfil ya coincide con lo elegido» |

**Paso 5 — `ZC001`. MEDIDO.** C, ya tutor, fue a `/signup`, eligió **«Niño»** y
entró con Google. Como `child ≠ tutor`, la RPC **sí** se llamó, y respondió el
rechazo por marca: **aviso neutro diciendo «Entras como Tutor, y tu tipo de
cuenta no cambia»**, y a `/teacher/groups`.

**Paso 5b — la rama «ya coincide». MEDIDO.** Repitiendo con **«Tutor»**, la
intención coincide con el rol del perfil, así que `AuthCallback` **no llama a la
RPC**: sin aviso, directo a `/teacher/groups`.

**Cómo se enuncia el 5b sin afirmar de más:** «sin aviso» por sí solo es
compatible con dos causas —que la intención no se guardara nunca, o que se
guardara y coincidiera—. Lo que separa la buena es que **el paso 4 ya demostró
que la intención se guarda y se consume** por ese mismo camino: allí sí se
aplicó. Con eso, la ausencia de aviso en el 5b sólo puede ser el corte por
coincidencia.

**Y de los pasos 5 y 5b sale una prueba que no se podía leer.** Desde el paso 4,
C es tutor sin lazos y **no es visible para ninguna sesión disponible**, así que
su `is_role_declared` no se puede consultar. Pero `ZC001` sólo salta con la marca
en `true`, y `ZC002` está descartado porque C no tiene ningún lazo —comprobado en
las tres tablas—. Luego **el paso 4 escribió el rol Y la marca**, que es
exactamente lo que la misma sentencia de la 0018 prometía. **La marca se demuestra
por el rechazo, no por lectura.**

**8.12 — integridad final. VERIFICADA.** «salon sigma» conserva sus **dos alumnos
originales**; los tres perfiles visibles siguen con `updated_at` en `01:03:51`,
que es **la huella del backfill de la 0018**, sin moverse desde entonces; y con la
sesión del niño de prueba, la vista `classroom_roster` sigue mostrándole a sus
compañeros. **La verificación no dejó la base peor de como la encontró.**

**Resumen de la cuenta C: cinco medidas, una sola cuenta de Google.**

| Paso | Estado de C | Resultado |
| --- | --- | --- |
| 1 | sin declarar, solicitud `pending` | **`ZC002`** rama solicitud |
| 2b | sin declarar, con membresía | **`ZC002`** rama membresía — *el daño de Taxo no ocurriendo* |
| 4 | sin declarar, sin lazos | **se aplica**: rol y marca, en la misma sentencia |
| 5 | declarada, pidiendo el otro rol | **`ZC001`** |
| 5b | declarada, pidiendo el mismo rol | la RPC **ni se llama** |

**8.3 — entrar con Google desde `/login` no toca el rol. MEDIDO.** La cuenta A
—creada con Google desde `/signup` eligiendo «Tutor»— entró por `/login` con
Google y fue directa a `/teacher/groups` como Tutor, **sin aviso**. Sin intención
pendiente `AuthCallback` no llama a la RPC, así que ese camino no puede cambiar
el rol de nadie.

**8.6 — `ZC001` sobre una marca puesta por el DISPARADOR. MEDIDO, y es la
dirección que la cuenta C no cubría.** La cuenta B se registró con el
**formulario y contraseña** eligiendo «Tutor», así que su `is_role_declared` lo
puso `handle_new_user_profile` al darse de alta, **no la RPC**. Después fue a
`/signup`, eligió «Niño» y entró con Google: el proveedor **se enlazó**, saltó
`ZC001` —B no tiene lazos, así que `ZC002` está descartado—, salió el **aviso
neutro «Entras como Tutor»**, la sesión quedó **abierta** y aterrizó en
`/teacher/groups`.

Con esto quedan cerradas **las dos procedencias de la marca**: la que escribe el
disparador en un alta con metadatos (B) y la que escribe la RPC en la primera
declaración de una cuenta de proveedor (C, paso 4). Las dos bloquean igual
después.

**Lectura de `Table Editor → profiles` de la ronda 1**, hecha por la sesión que
revisa —ninguna sesión de esta sesión puede ver a un tutor ajeno—:

| Cuenta | `role` | `is_role_declared` |
| --- | --- | --- |
| A, alta con Google eligiendo «Tutor» | `tutor` | `true` |
| B, alta con formulario eligiendo «Tutor» | `tutor` | `true` |

Eso cierra además **8.1** y la mitad «registro» de **8.7** con el disparador
nuevo: un alta con metadatos válidos deja el rol elegido **y** la marca.

**8.9 — el registro con formulario sobre un correo que sólo tiene Google.
MEDIDO, y cierra la duda que 10.1 no podía cerrar.**

Con la cuenta C recreada por `/login` —**sólo-Google, sin ninguna contraseña**—:

| Comprobación | Resultado |
| --- | --- |
| Aviso al enviar el formulario | **genérico**: «Ya existe una cuenta con ese correo. Inicia sesión.» |
| Dónde se ve | en `/login`, tras el salto |
| ¿Nombra el rol? | **no** |
| ¿Se abre sesión? | **no** |
| Entrar con la contraseña inventada en ese intento | **rechazada** |

La última fila es la que importa: **`signUp()` NO le añadió contraseña a una
cuenta que no tenía ninguna**. La medición de 10.1 no podía distinguirlo, porque
allí la cuenta ya tenía una y añadirle otra habría sido indistinguible de no
hacer nada. **El aviso genérico es sólo un aviso, sin efecto**, y con eso
`design.md` §7 queda confirmado en el único montaje que podía tumbarlo.

De paso queda comprobado el arreglo de que **el aviso sobreviva al salto**: se
enseña en `/login` porque viaja por el `error` del contexto. Sin eso, la persona
aterrizaría allí sin que nada le dijera por qué.

**8.2 — alta de niño con Google.** `/signup` eligiendo «Niño» con Google sobre un
correo sin cuenta: aterriza en el portal del niño. Falta confirmar
`is_role_declared = true`, que es lo que la distingue de la creada por `/login`
—ésa queda en `false` porque nadie eligió—.

**8.2 FALLÓ, y destapó un agujero que rompía la regla en el camino más común.**
No fue un fallo de la medición.

**Medido:** una cuenta registrada por `/signup` eligiendo «Niño» con Google quedó
`role=child`, **`is_role_declared=false`**, y con `created_at == updated_at`
(`02:39:22.671622`). Los tiempos idénticos prueban que **no hubo segunda
escritura**: la RPC no llegó a llamarse.

**Causa,** en `AuthCallback.tsx:99`: `if (pendingRole && pendingRole !== user.role)`.
El disparador crea **todo** perfil de proveedor como `child`, así que quien elige
«Niño» tiene intención `child` y rol `child`, coinciden, y la llamada se saltaba.

**Consecuencia:** todo niño registrado con Google quedaba con la marca en
`false`, **indistinguible de quien sólo pulsó Google en `/login` sin elegir**. Y
por tanto podía después ir a `/signup`, elegir «Tutor» y **el ascenso se
aplicaba**: sin lazos no hay `ZC002`, y sin marca no hay `ZC001`.

**Es la tercera aparición de la misma causa raíz**, el atajo «sólo si el rol
difiere»: en el paso 5 hizo que la prueba planeada no midiera nada, y aquí hace
que la regla no se cumpla. La decisión 3 definía «hace falta» como «el rol
difiere», y **la definición correcta es «hay intención y el rol aún no está
declarado»** — un dato que el navegador no tiene.

**Arreglo aplicado:** la RPC se llama **siempre que haya intención**, coincida o
no. El cliente reenvía; el servidor decide. Se descartó exponer la marca al
cliente: sería una segunda copia de la regla en el navegador, que es de donde
vino este fallo, y además puede llegar vieja.

**Lo que cambia y hay que volver a medir:**

| Caso | Antes | Ahora |
| --- | --- | --- |
| **8.2** intención coincide, **sin declarar** | no se escribía nada — **el agujero** | escribe rol y marca |
| **5b** intención coincide, **ya declarado** | sin aviso, directo al panel | `ZC001` → **aviso neutro**, y al panel |

El cambio de 5b es a mejor: antes esa persona aterrizaba en su panel como si
acabara de registrarse, y no se había registrado — entró.

Actualizados `design.md` decisión 3 y el delta de `auth-sesion`, donde el
requisito **encodificaba el propio fallo**: decía que si el perfil ya coincide
con la intención no se escriba nada.

**8.2 y 8.2b — REMEDIDOS SOBRE EL ARREGLO, y los dos salen como dice el delta.**

- **8.2**: la cuenta que había quedado en el estado defectuoso —`child`, marca
  `false`— pasó por `/signup` eligiendo «Niño» con Google y **la marca quedó en
  `true`**. El agujero está cerrado en el camino más común.
- **8.2b**: repitiendo lo mismo sobre la cuenta ya declarada salta **`ZC001`** y
  sale el **aviso neutro «Entras como Niño»**. **Ese observable es nuevo**: antes
  ese caso no mostraba nada y aterrizaba en el panel como si acabara de
  registrarse.

**8.8 y 8.12 — CIERRE Y CONTRAPRUEBA.** Tras borrar las tres cuentas de prueba,
la base queda con los **tres perfiles originales** visibles, todos con
`updated_at` en `01:03:51` —la huella del backfill de la 0018, **sin moverse**—,
«salon sigma» con sus **dos alumnos**, y dos solicitudes, ambas `accepted`. La de
la cuenta C se fue **en cascada** con su usuario. **Cero restos de A, B y C.** La
verificación no dejó la base peor de como la encontró.

Las cuentas creadas durante todo el paso fueron tres, y las tres están borradas.
Las cuatro originales no se tocaron.

> **CABO ABIERTO, no anotado como resultado hasta que se confirme.** Tras pulsar
> «Continuar» en 8.2b, el usuario acabó en `/login`. **El código no puede hacer
> eso**: el botón del estado bloqueado navega a
> `getHomeRouteForRole(user?.role ?? null)` (`AuthCallback.tsx:185`), que sólo
> devuelve `/teacher/groups` o `/dashboard/worlds`; el único `ROUTES.LOGIN` de esa
> pantalla está en la línea 214, que es el botón del **otro** estado, el del error
> del proveedor.
>
> La explicación probable es **el orden**: si las cuentas se borraron **antes** de
> pulsar «Continuar», el perfil desapareció, `AuthProvider` cerró la sesión por
> perfil ausente —el invariante del paso 12— y la guarda mandó a `/login`. Eso
> sería **correcto** y ya está documentado en `CONTEXT.md` §2.2.
>
> **ORDEN CONFIRMADO POR EL USUARIO: hizo 8.2b PRIMERO y borró las cuentas
> DESPUÉS.** Así que la explicación de arriba **no vale** y el cabo sigue vivo.

> **INTENTO DE REPRODUCCIÓN DEL CABO, dos veces, NEGATIVO las dos.** Sin crear ni
> borrar ninguna cuenta: se usó la cuenta de niño de `.env`
> —`is_role_declared = true`, así que `ZC001` salta **antes** de cualquier
> `update` y no se le puede escribir nada—, y se entró por el botón «Sin login»,
> que autentica de verdad sin teclear ninguna contraseña.
>
> **Intento 1 — sesión preexistente.** Sesión por contraseña, intención `child`
> escrita en `localStorage`, navegación a `/auth/callback`. Salió el aviso neutro
> por `ZC001` y la intención se consumió. Al pulsar «Continuar»: **`/dashboard/worlds`**,
> sesión viva.
>
> **Intento 2 — sesión establecida DESDE EL FRAGMENTO**, que era la única
> diferencia señalada con la vuelta real. Se reutilizaron los tokens de esa misma
> sesión para construir `/auth/callback#access_token=…&refresh_token=…`, se limpió
> el almacén antes y se navegó: el cliente consumió el fragmento —el hash quedó
> limpio—, estableció la sesión, y salió el aviso. Al pulsar «Continuar»:
> **`/dashboard/worlds`**, sesión viva. *(Ningún token se imprimió: la
> construcción se hizo dentro del navegador.)*
>
> El 400 que aparece en consola es **la propia RPC devolviendo `ZC001`**, y el
> `ERR_CONNECTION_REFUSED` es el websocket de HMR de Vite. Ninguno es la causa.
>
> **Estado: no reproducible con el estado que se puede construir desde aquí.** Lo
> único que las dos reproducciones no incluyen es una identidad de Google real,
> que exige otra vuelta por el proveedor y una cuenta nueva.
>
> **Antes de gastar una cuenta, hay una pregunta que discrimina y no cuesta
> nada:** si el `/login` apareció **inmediatamente** al pulsar «Continuar», o si
> se aterrizó en el panel y el `/login` llegó **después**, al borrar las cuentas
> con la página todavía abierta. Lo segundo sería el invariante del paso 12
> funcionando —perfil ausente, sesión cerrada, guarda a `/login`— y no un
> defecto. **Pendiente de esa respuesta.**

> **CABO CERRADO: NO HABÍA DEFECTO.** El usuario precisó lo que faltaba:
> «Continuar» **sí** lo llevó al portal del niño. Salió al inicio por su cuenta y
> **sólo después** borró las cuentas; el `/login` que había reportado vino de ahí.
>
> Las dos reproducciones negativas quedan como **descartes válidos**: no
> reproducían porque no había nada que reproducir. Y sirvieron para acotar el
> problema hasta que la pregunta correcta —¿el `/login` fue inmediato o
> posterior?— resolvió el caso **sin gastar otra cuenta de Google**.
>
> **Y de paso se observó en vivo un camino que sólo estaba descrito como
> hipótesis.** El usuario lo dijo sin que se le preguntara: «cuando borro la
> cuenta sin salirme del portal se sale del portal y va al login». Es el
> invariante del paso 12 ocurriendo de verdad —perfil ausente, sesión cerrada,
> guarda a `/login`—, y `CONTEXT.md` §2.2 lo describía en condicional, «si alguien
> borra un perfil a mano en el panel». **Es la primera vez que se ve pasar.**
>
> **8.2b queda medido entero:** aviso neutro por `ZC001`, y «Continuar» aterriza
> en `/dashboard/worlds`.

> **RESULTADOS YA MEDIDOS, y no se repiten.**
>
> - **8.5 está medida: Supabase SÍ enlaza identidades por correo verificado.**
>   Entrar con Google con un correo que ya tenía cuenta de contraseña **no crea
>   usuario**: le añade el proveedor. Siguen siendo los mismos usuarios y la fila
>   de la cuenta muestra `Email + Google`. Como no hay alta, **el disparador no
>   corre**.
> - **8.6 está medida, y salió mal a propósito de nadie.** `taxoxolotl` era
>   `child` con membresía en «salon sigma»; se entró con Google desde `/signup`
>   eligiendo «Tutor» y **quedó `tutor`**: fuera de su propio salón, sin vuelta
>   atrás por la interfaz, y el tutor la seguía viendo listada como exploradora.
>   Ése es el daño que motiva el grupo 10, y **su resultado esperado cambia**: con
>   la 0018 aplicada, ese intento tiene que **rechazarse**.
> - La mitad **«login con contraseña»** de 8.7 está medida, con las dos
>   respuestas: `user.tutor` entra y su perfil sale `tutor`, `user.kid2` entra y
>   sale `child`, y la contraseña equivocada sigue dando 400 `invalid_credentials`.
> - La mitad **«registro con contraseña»** de 8.7 está medida: el alta de
>   `taxoxolotl` desde `/signup` eligiendo «Niño» dejó `profiles.role = 'child'`.
>
> **El grupo 8 no se ejecuta hasta que el grupo 10 esté aplicado**, porque lo que
> verifica es la regla que el grupo 10 construye.

- [x] 8.1 Alta con Google eligiendo **tutor** en `/signup`, con un correo sin cuenta: comprobar por REST que `profiles.role = 'tutor'`, que la marca de rol declarado queda a `true`, y que se aterriza en `/teacher/groups` **sin pasar por el panel del niño** en ningún momento
- [x] 8.2 **A REMEDIR tras el arreglo.** Alta con Google eligiendo **niño**, con un correo sin cuenta: `profiles.role = 'child'`, marca a `true`, y se aterriza en `/dashboard/worlds`
- [x] 8.3 Entrar con Google desde `/login` con una cuenta que **ya existe**: comprobar que el rol **no cambia**. Leer el rol antes y después, que una sola lectura no prueba nada
- [x] 8.4 Cuenta nueva creada desde el botón de `/login`, donde no hay rol elegido: comprobar que queda `child` y, **esto es lo que hay que mirar**, que la marca de rol declarado queda a **`false`**, porque nadie eligió. Es el caso que deja la puerta abierta a una primera declaración posterior, y por eso se mide aparte en 8.10
- [x] 8.5 **YA MEDIDA**, ver la nota de arriba: Supabase enlaza identidades por correo verificado y el disparador no corre. No repetirla
- [x] 8.6 **Rehacer con el resultado esperado invertido.** Una cuenta con contraseña y rol ya declarado que entra con Google desde `/signup` eligiendo **el otro rol**: el proveedor **se enlaza**, el rol **no cambia**, la sesión **sigue abierta**, y la pantalla de vuelta muestra el **aviso neutro** nombrando el rol con el que entra. Comprobar por REST que el rol es el mismo antes y después, y a ojo que **no** aparece una pantalla de error ni se va a `/login`. Si la cuenta tiene membresía, comprobar además que **la conserva y sigue entrando a su salón**: es el daño exacto que este cambio impide
- [x] 8.7 Comprobar que el login y el registro **con contraseña** siguen funcionando igual, por los dos roles. **Las dos mitades ya están medidas** (ver nota); rehacer sólo el registro, porque el disparador cambia en la 0018: un alta con contraseña eligiendo «Tutor» tiene que dejar `role = 'tutor'` **y la marca a `true`**
- [x] 8.2b **A REMEDIR tras el arreglo**, porque su observable cambia: con una cuenta que ya declaró su rol, ir a `/signup` y elegir **el mismo rol que ya tiene**. Antes no salía aviso; ahora la RPC sí se llama y tiene que salir **`ZC001`** con el aviso neutro. Es la antigua rama «5b»
- [x] 8.8 Enumerar al final **todas** las cuentas creadas durante la verificación, para que el usuario las borre en `Authentication → Users`
- [x] 8.9 **La otra dirección, replanteada sobre una cuenta SIN contraseña.** La cuenta C original se borró antes de ejecutarlo, y el usuario la recrea entrando por `/login` con Google: queda **sólo-Google, `child` y sin declarar**, que es justo lo que este caso necesita. Lo que mide es si `signUp()` **le añade contraseña a una cuenta que no tenía ninguna** —lo medido antes fue sobre una cuenta que sí la tenía, y es el caso distinto—. Original: una cuenta creada **con Google** y después un registro **con el formulario** usando el mismo correo. Comprobar que **no se abre sesión**, que el aviso es **genérico** —dice que la cuenta ya existe y **no nombra el rol**—, que lleva a `/login`, y por REST que la cuenta existente **no cambió de rol**. Comprobar además lo que 10.1 haya medido: si `signUp()` le añadió contraseña o la dejó intacta
- [x] 8.10 **Las dos condiciones del cierre, medidas por separado** (`design.md` §6). Primero **sin lazos**: tomar la cuenta de 8.4 —creada desde `/login`, `child` y **no declarada**— e ir a `/signup` a elegir **Tutor** con Google. Se espera que **sí se aplique**: esa persona nunca eligió y ésta es su primera elección
- [x] 8.10b **Y ahora con lazos, que es la ventana que la marca sola no cerraba.** Con otra cuenta igual —`child`, **no declarada**— hacer que **entre a un salón** primero, y sólo después ir a `/signup` a elegir **Tutor** con Google. Tiene que **RECHAZARSE**, con el código de los lazos y no con el del rol declarado. Comprobar por REST que el rol **no cambia** y que **conserva la membresía**, y a ojo que sale el aviso neutro. Éste es el daño de Taxo por el otro camino: sin esta condición la cuenta quedaría muerta y fantasma en la lista de su tutor
- [x] 8.11 Repetir el intento de 8.6 **una segunda vez** sobre la misma cuenta: tiene que volver a rechazarse igual. Es lo que prueba que el cierre es del servidor y no del navegador, donde la intención ya se habría consumido de todos modos
- [x] 8.12 Comprobar que **el salón sobrevive**: el tutor sigue viendo a sus alumnos y ninguno ha cambiado de rol por nada de lo anterior. Es la comprobación de que la verificación no dejó la base peor de como la encontró

## 9. Cierre

- [x] 9.1 Ejecutar `npm run lint` (cero warnings), `npm run test:run` y `npm run build`. Los tres pasan hoy y no deben romperse. **El recuento de tests no es el criterio**: se cierra comparando los nombres de los `it(` con `git show HEAD:<ruta>`, como en la tarea 7.3, y diciendo cuál entró y cuál se fue
- [x] 9.2 En `docs/CONTEXT.md` §2.2, poner la fila «Botón de acceso con Google» a ✅ con las rutas reales, añadir las filas de lo que este paso cierra, y anotar en las decisiones de diseño **la regla del rol y su límite**, en dos afirmaciones separadas para que nadie las lea como una: (a) el rol se fija en el primer registro y **no cambia nunca**, porque es la reja de `class_groups_insert_own` y `join_requests_insert_own` y cambiarlo dejaba una cuenta fuera de su propio salón —con el caso medido como prueba—; (b) esto **no** impide registrarse como `tutor` de entrada, agujero que sigue abierto y que cierra el **código de institución**, la opción 2 que §2.2 ya tiene decidida
- [x] 9.2b En `docs/CONTEXT.md` §2.2, anotar como **diagnóstico** lo del **Client Secret**, porque no es deducible y costó horas: si la autorización funciona —Google enseña su pantalla y devuelve un código— pero el **canje** falla con «Unable to exchange external code», el `client_id` está probado bueno y **lo único que entra en juego en ese segundo tramo es el secreto**. Anotar junto a él que un correo que falte en la lista de usuarios de prueba de Google Cloud recibe «Acceso bloqueado», que también parece un fallo del código
- [x] 9.2c En `docs/CONTEXT.md` §2.2, anotar que **Supabase enlaza identidades por correo verificado**: entrar con Google con un correo que ya tiene cuenta de contraseña **no crea usuario**, añade el proveedor, y **el disparador no corre**. Es el hecho del que cuelga toda la regla del rol, y no se lee en ninguna parte del repositorio
- [x] 9.3 En `docs/CONTEXT.md` §2.2, actualizar la fila **Redirect URL** de la tabla «Estado del panel de Supabase» con las tres entradas que hay hoy: `/reset-password`, `/auth/callback` y el comodín `http://localhost:5173/**`. La fila de **Google** ya dice `true` y no hay que tocarla. **Y dejar escrito qué hay que hacer al desplegar (paso 27), que ahora son dos cosas y no una:** añadir las direcciones del dominio real **y RETIRAR el comodín**. El comodín enmascara errores de ruta —una vuelta a una dirección equivocada casa igual y no se distingue de una correcta— y, con el flujo `implicit` que usa este cliente, en producción dejaría que **cualquier** ruta del dominio real reciba un refresh token en el fragmento de la URL. En localhost se queda
- [x] 9.4 En `docs/CONTEXT.md` §3, mover la entrada del paso 15 de «por aplicar» a «aplicadas», con las rutas reales de los archivos
- [x] 9.5 Corregir el recuento de tests de `docs/CONTEXT.md` §5: **hoy dice 67 y son 66**, más los que añada este cambio. El número quedó viejo cuando `invitaciones-sin-correo` retiró el test de una función que desapareció; baja legítima
- [x] 9.6 En `docs/ROADMAP.md` §2, poner la fila 15 a ✅ con `google-oauth`. Y en §3, corregir el recuento de componentes huérfanos: la fila lista cuatro —`WelcomeBanner`, `WorldCard`, `SidebarPlayerCard`, `LeaderBoard`— y `GoogleAuthButton` era un quinto que no estaba contado y que este cambio borra
- [x] 9.6b En `docs/ROADMAP.md` §3, **una fila y dos líneas, sin extenderse**: quien se registra con Google no puede añadirse contraseña después, porque el cambio desde Ajustes pide la actual y esa cuenta no tiene ninguna. **No es un fallo de este paso y nadie lo ha pedido**; queda anotado por si aparece
- [x] 9.7 Replicar en `openspec/config.yaml` lo que cambie del estado, de las convenciones y de las prioridades —la prioridad 3 dice hoy «Google OAuth (paso 15, proveedor desactivado en el proyecto real)», que ya no es cierto— y comprobar con `npx openspec doctor` que el YAML sigue parseando. Validar con `npx openspec validate google-oauth`
- [x] 9.8 Al archivar, revisar **a mano** el `## Purpose` de `openspec/specs/auth-sesion/spec.md` y el de `openspec/specs/backend-supabase/spec.md`: los deltas no lo transportan. El de `auth-sesion` describe hoy el acceso con cuenta y contraseña y no menciona ningún proveedor externo. «Revisado, sin cambios» es un resultado válido y se dice
**Resultado de 9.8 (29-ago-2026): los dos Purpose necesitaban mano, y uno por algo
anterior a este cambio.**

- **`auth-sesion`** describía el acceso «con cuenta y contraseña» y **no
  mencionaba ningún proveedor externo**. Se le añade Google como vía de acceso y
  **la regla del rol**, que hoy es una propiedad definitoria de la capacidad y no
  un detalle de implementación.
- **`backend-supabase`** afirmaba que las políticas de salones estaban
  «verificadas sólo hasta donde llega una clave anónima» y que «nada de lo que
  depende del rol o de la pertenencia se ha observado todavía». **Eso llevaba dos
  pasos caducado** y contradecía a `ROADMAP.md` §3, que las da por probadas con
  sesión real —las once comprobaciones de `CONTEXT.md` §2.7— y cerradas en el paso
  11. Se corrige diciendo lo que hoy es cierto, **con una nota dentro del propio
  spec de que la corrección es anterior a este paso**, para que no parezca que la
  introdujo Google OAuth.

- [ ] 9.9 Al commitear, **enumerar las rutas** en `git add`, nunca `git add -A`. Incluir los cambios **ya presentes en el árbol** de `docs/CONTEXT.md` y `docs/ROADMAP.md` —los escribió la sesión que revisa el 28-ago-2026 y entran en este commit, decidido con el usuario— y mencionarlos en el mensaje. El commit `982a299` se llevó por delante cuatro artefactos sin commitear por usar el atajo

## 10. La regla del rol: la 0018 y las dos direcciones

> **Va ANTES del grupo 8**, que es su verificación. Y dentro de este grupo el
> orden tampoco es libre: 10.1 mide algo de lo que depende lo que se escribe
> después, y 10.3 no se lanza hasta que el usuario haya borrado las cuentas
> dañadas.

- [x] 10.1 **MEDIDO, y salió distinto de lo documentado.**

**Resultado (28-ago-2026).** `/auth/v1/signup` con el correo de la cuenta de
prueba del niño, ya registrada, responde **HTTP 422** con
`error_code: user_already_exists` y «User already registered». **No** devuelve un
`user` con `identities` vacío, que era la señal que se esperaba: esa ofuscación
existe para no revelar que una cuenta existe y **sólo se aplica con la
confirmación por correo encendida**, y aquí está apagada
(`mailer_autoconfirm: true`). **La detección va por ese código de error.**

**La cuenta existente queda intacta**, comprobado con las dos respuestas: la
contraseña enviada en el intento **no** entra —400 `invalid_credentials`— y la
verdadera sigue entrando —200—. Así que este camino es **sólo un aviso, sin
efecto**, y 10.7 no tiene que deshacer nada.

No se probó el alta de un correo nuevo: eso habría creado una cuenta, y las
cuentas no se crean por cuenta propia.
- [x] 10.2 Escribir `supabase/migrations/202606030018_lock_profile_role.sql` con las cuatro piezas, en este orden: (1) columna en `profiles` que registra si el rol se declaró, `not null default false`; (2) **backfill de todas las filas existentes a `true`**; (3) `create or replace` de `handle_new_user_profile`, que marca `true` cuando los metadatos traían rol **válido** y `false` cuando no —un valor manipulado sigue degradándose a `child` y cuenta como **no declarado**—; (4) `create or replace` de `set_my_role`, que **rechaza sin escribir** por **dos** motivos —la marca ya es `true`, o el perfil tiene **lazos de salón**: membresía en `class_memberships`, solicitud pendiente en `join_requests`, o salón propio en `class_groups`— y que sólo si no se cumple ninguno escribe el rol **y pone la marca a `true` en la misma sentencia**. Conservar `42501`, `22023` y `P0002`, y usar `ZC001` para el rol ya declarado y `ZC002` para los lazos: la clase **`ZC`** cae en el tramo `I`-`Z` que el estándar deja a la implementación, y no es ninguna de las dos que PostgreSQL ocupa (`P0` y `XX`). **La 0017 no se toca**: se reemplaza desde aquí, como la 0014 hizo con la 0013
- [x] 10.3 **PUERTA DEL USUARIO, y el orden no se puede invertir.** Leer el SQL entero con él **antes** del `db push` (comprobación 9 de `ROADMAP.md` §1.3). Antes de lanzarlo, el usuario **borra las cuentas que quedaron con el rol cambiado** —`taxoxolotl` entre ellas—: el backfill congela el rol que cada fila tenga en ese momento, y una fila estropeada quedaría estropeada para siempre. Al lanzarlo, leer la salida: tiene que aplicar la **0018 y ninguna más**
- [x] 10.4 Pedir al usuario que regenere los tipos con `npx supabase gen types typescript --linked`, que pide credenciales por consola. Verificar que la columna nueva aparece en `types/database.types.ts`, que **se genera y nunca se edita a mano**
- [x] 10.5 Comprobar la reja nueva contra la base real, **con las dos respuestas en cada caso**

**Resultado (28-ago-2026).** El `db push` aplicó **la 0018 y ninguna más**, y los
tipos se regeneraron: lo único nuevo es `is_role_declared` en `Row`/`Insert`/
`Update` y en el retorno de `set_my_role`.

**El backfill entró limpio**, y consta cómo se comprobó: `taxoxolotl` está
borrado **por lectura y no por indicio** —`profiles_select_own_students` hace
visible a un alumno por su **membresía**, no por su rol, así que un Taxo
superviviente habría aparecido igual siendo `tutor`—. La sesión del tutor ve tres
perfiles, ninguno es él, y su membresía se fue con él. Las cuatro cuentas
restantes conservan su rol correcto.

| Llamada | Respuesta |
| --- | --- |
| `is_role_declared` tras el backfill | `true` en la cuenta **tutor** y en la **niño** |
| Sin sesión, sólo clave anónima | 401, `42501`, «permission denied for function set_my_role» |
| Rol **ya declarado** | **`ZC001`**, «Role was already declared for this profile» |
| Valor inválido | `22023` |
| Rol y marca tras todos los intentos | **sin cambios** en las dos cuentas |

La sonda pidió **el mismo rol que la cuenta ya tenía**, para que un fallo de la
reja no estropeara las cuentas de prueba. Cualquier repetición se hace igual.

**`ZC002` no se puede medir desde aquí**: necesita una cuenta **con membresía y
sin declarar**, y eso sólo existe creándola. Se mide en la tarea **8.10b**, con
el usuario.

- [x] 10.5b **Pega menor anotada, no arreglada, y con el motivo:** la 0017 comprobaba `if not found` **después** del `update`; la 0018 sólo lo hace tras el `select`. Si el perfil desapareciera **entre** las dos sentencias, la función devolvería `null` en vez de `P0002`, y el cliente vería un error de PostgREST en lugar del código propio. Ventana de microsegundos y **no produce dato corrupto**, pero era una línea que estaba y se fue. **No se arregla en el sitio**: la 0018 ya está aplicada y este repositorio no corrige migraciones aplicadas —regla heredada de la 0014 sobre la 0013—. Se anota en `supabase/README.md` junto a la 0018 (tarea 2.8) para que la recoja la próxima migración que toque esa función
- [x] 10.6 En `apps/web/src/services/profile.service.ts`, exponer el rechazo como **constante exportada**, al lado de `PROFILE_NOT_FOUND` y por el mismo motivo: quien lo reciba tiene que poder distinguirlo sin comparar cadenas sueltas. **Los dos `SQLSTATE` del servidor se traducen al mismo código de cliente**, y es deliberado: para quien está delante los dos significan «tu rol se queda como está» y merecen el mismo aviso. La distinción se conserva abajo porque diagnosticar sí los separa —«ya eligió» y «tiene historia» son casos distintos—
- [x] 10.7 En `apps/web/src/services/auth.service.ts`, que `signUp()` reconozca la cuenta que ya existe según lo medido en 10.1, y lo devuelva como un caso propio. En `AuthContext.ts`, `SignUpOutcome` gana ese caso. **El mensaje es genérico y no nombra el rol**: ahí no hay sesión, y nombrarlo le diría a un desconocido si detrás de ese correo hay un niño o un tutor —el mismo criterio que `CONTEXT.md` §2.2 fijó para `/forgot-password`—
- [x] 10.8 En `apps/web/src/pages/Signup/Signup.tsx`, mostrar ese aviso genérico y llevar a `/login`. Sin abrir sesión y sin crear nada
- [x] 10.9 En `apps/web/src/pages/AuthCallback/AuthCallback.tsx`, añadir el **cuarto estado**: cuando `updateRole` falla con el código del rechazo, mostrar un **aviso neutro** —no una pantalla de error— que diga que esa cuenta ya existía y **con qué rol se entra**, con un botón para continuar a su panel. **Nunca cerrar la sesión ni llevar a `/login`**: quien llega ahí ha entrado bien. Aquí **sí** se nombra el rol, porque es su propia cuenta y su propia sesión; la asimetría con 10.8 está razonada en `design.md` §7
- [x] 10.10 En la misma pantalla, pasar el motivo del proveedor por `decodeURIComponent` **envuelto en `try/catch`**: hoy se pinta con los escapes crudos —«code%3A 4%2F0A»—, y un motivo que no se puede leer no sirve para lo único que ese estado existe. El `catch` importa porque una cadena mal escapada haría que `decodeURIComponent` lance y se llevaría por delante la pantalla entera
- [x] 10.11 Tests: que `signUp()` devuelve el caso de cuenta existente ante la señal medida en 10.1, y que el aviso de `Signup.tsx` **no contiene ningún rol**. El segundo es el que impide que alguien «mejore» el mensaje añadiendo el dato que no debe salir
- [x] 10.12 `npm run lint` (cero warnings), `npm run test:run` y `npm run build`. Comparar los tests **por nombre** con `git show HEAD:<ruta>`, no por número
