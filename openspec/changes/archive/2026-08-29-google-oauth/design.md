## Context

Ver `proposal.md` — Why. Lo que hace falta para entender el enfoque son cuatro
hechos del estado actual, comprobados leyendo el repositorio:

- **`supabase.auth.signInWithOAuth` no tiene `options.data`.** Los `queryParams`
  viajan a Google, no a Supabase. No existe la vía «pasar el rol como lo pasa
  `signUp()`»; no hay que buscarla.
- **El cliente no puede escribir su propio rol.**
  `202606030009_enable_rls_and_policies.sql:50` revoca `insert, update, delete`
  sobre `profiles` a `anon` y `authenticated`, y sobre esa tabla sólo hay
  políticas de `select` (`profiles_select_own` y, desde la 0014,
  `profiles_select_own_students`). No hay ninguna de `update`.
- **`PrivateRoute` acepta que `role` sea opcional** y, sin `role`, sólo exige
  sesión. `/reset-password` es el caso que lo aprovecha, y **sigue siendo el
  único**: la decisión 2 explica por qué la vuelta de OAuth acabó sin guarda en
  vez de imitarlo.
- **El subscriptor de `onAuthStateChange` compara el id del usuario**
  (`AuthProvider.tsx:96-122`) para no blanquear la pantalla en cada refresco de
  token. Es el arreglo del paso 13 y **no se toca**: quien levanta `loading` se
  queda como está.

Y un quinto hecho que **no se leyó, se midió**, y que reordenó el diseño entero:

- **Supabase enlaza identidades por correo verificado.** Entrar con Google con un
  correo que ya tenía cuenta de contraseña **no crea un usuario**: añade el
  proveedor al que existe. Siguen siendo los mismos usuarios y la fila muestra
  `Email + Google`. Como no hay alta, **el disparador no corre**, y por tanto
  nada vuelve a decidir el rol de esa cuenta.

La restricción que ordena el diseño es que **el rol no puede viajar con el
alta**, así que tiene que viajar por fuera —en el navegador— y aplicarse a la
vuelta contra el servidor. Y la que ordena el resto es que **esa aplicación no
puede alcanzar a una cuenta que ya había elegido**.

## Goals / Non-Goals

**Goals:**

- Que quien se registra como tutor con Google acabe con rol `tutor`.
- Que nadie vea, ni un instante, el panel del otro rol al volver de Google.
- Que la intención de rol no pueda aplicarse dos veces.
- Que el rol con el que se navega siga siendo **el que devuelve el servidor**.
- Que el rol quede fijado en el primer registro y **no cambie nunca** después.
- Que **enlazar proveedores siga funcionando**: una persona puede tener Email y
  Google sobre la misma cuenta, y eso es legítimo.

**Non-Goals:**

- No se toca `PrivateRoute` ni `PublicRoute`. La decisión 2 explica por qué no
  hace falta, y no tocarlos es parte del resultado.
- No se toca el subscriptor de `onAuthStateChange`. Ver decisión 4.
- No se implementa el código de institución. Ver decisión 6, que lo nombra como
  el cierre de la decisión que este cambio deja abierta.
- **No se cambia el rol que el disparador escribe.** Que un alta sin metadatos
  nazca `child` es correcto y es la red por debajo. Lo que la 0018 le añade es
  registrar **si ese rol se declaró o no**, que es un dato nuevo, no una regla
  distinta.
- No se reparan las cuentas que ya quedaron con el rol cambiado. La 0018 congela
  el rol que cada fila tenga al aplicarse, y por eso el orden importa (ver
  Migration Plan).

## Decisions

### 1. La intención de rol vive en `localStorage`, en su propio módulo, y se lee borrando

El viaje a Google y la vuelta son **el mismo origen**, así que
`window.localStorage` sobrevive el redirección. `sessionStorage` también
sobreviviría —es la misma pestaña—, pero `localStorage` es lo que este
repositorio ya usa para lo mismo y lo que `guest.helpers.ts` ya centraliza; dos
almacenes distintos para dos marcas del mismo tipo sería una diferencia sin
motivo.

Módulo nuevo `context/oauthRole.helpers.ts`, con el patrón exacto de
`guest.helpers.ts`: **la clave se declara una vez** y se expone por funciones,
para respetar la frontera de `CLAUDE.md` —ningún componente toca `localStorage`
directamente—.

**La función de lectura borra.** `takePendingSignupRole()` lee y elimina en la
misma llamada, en lugar de `get` + `clear` separados. El motivo es concreto: con
dos funciones, cualquier camino que devuelva antes de llamar a la segunda deja
una intención viva que se aplicaría en el **siguiente** viaje, que puede ser un
inicio de sesión de otra persona en el mismo computador de aula. Con una sola
función eso no se puede olvidar.

Se descartó **codificar el rol en el `redirectTo`** (`?role=tutor`). Habría
evitado el almacén, pero pone un parámetro manipulable en la URL de vuelta y
obliga a que **esa** URL exacta —con su query— case con la lista de Redirect
URLs del panel, que es justo la pieza que falla en silencio (ver Risks).

### 2. La vuelta aterriza en `/auth/callback`, y esa ruta **no lleva guarda**

`ROUTES.DASHBOARD` no sirve: está tras `<PrivateRoute role="child">`, así que un
tutor rebota a `/teacher/groups` y ve un panel ajeno de paso. Pero **ninguna**
ruta con rol sirve, y por el mismo motivo invertido: cualquiera de las dos
rebota a la mitad de la gente.

Tampoco sirve una ruta con rol «correcto» elegida de antemano, porque **en el
momento de construir el `redirectTo` no se sabe cuál será el rol**: el perfil
todavía no existe. Esa es la razón de fondo de que haga falta una pantalla
intermedia y no un destino directo.

**Esta decisión se corrigió al implementarla, y el motivo hay que dejarlo
escrito porque no es evidente.** La primera versión colgaba la ruta de
`PrivateRoute` sin `role`, imitando a `/reset-password`: exige sesión —que es lo
que la vuelta aporta—, no mira el rol, y a quien llegue sin sesión lo manda a
`/login`. El razonamiento cubría dos casos y **se dejó fuera el tercero**:

1. Se vuelve con sesión → la pantalla resuelve el rol. Correcto.
2. Alguien escribe la dirección a mano, sin sesión → a `/login`. Correcto.
3. **Se vuelve del proveedor con un error.** Entonces tampoco hay sesión, así
   que la guarda hace lo mismo que en el caso 2: redirige a `/login` y, al
   hacerlo, **descarta el fragmento de la URL donde viaja el motivo**. La
   pantalla no llega a montarse y el fallo aparece como un regreso mudo a la
   pantalla de acceso.

El defecto de fondo es que **una guarda sólo sabe que no hay sesión**, y con ese
único dato no puede distinguir «el proveedor falló» de «alguien escribió esta
dirección». Los dos merecen respuestas opuestas: uno hay que enseñarlo, el otro
hay que redirigirlo.

Por eso `/auth/callback` **es la única ruta del proyecto sin guarda**, y la
pantalla resuelve **cuatro** estados:

- **Fragmento de error** → se queda y muestra el motivo del proveedor.
- **Sin sesión y sin error** → a `/login`, exactamente como antes.
- **Con sesión, y el servidor rechaza fijar el rol porque ya estaba declarado**
  → **aviso neutro**, no pantalla de error. Ver decisión 8.
- **Con sesión y rol por fijar** → lee la intención, la aplica y navega.

**Esto está probado en el flujo real, no sólo con fragmentos escritos a mano.**
Fue esta pantalla la que mostró el error del canje de credenciales que tuvo
bloqueado el paso, por los dos caminos —`/login` y `/signup`—; con la versión
anterior el diagnóstico no habría existido.

`PrivateRoute` y `PublicRoute` **siguen sin tocarse**: ninguna de las dos sabe
nada de esta ruta, así que el bucle que `CONTEXT.md` §2.2 documenta no entra en
juego. Y `/reset-password` conserva su condición de único caso que aprovecha la
prop `role` opcional; este cambio ya no le hace compañía, y esa prop sigue sin
ser código muerto por el motivo de siempre.

El fragmento se puede leer porque **el cliente de Supabase sólo lo limpia cuando
consigue extraer una sesión de él**: en el camino de error sigue en la URL.
Comprobado en el navegador, no deducido.

Se descartó **resolver el rol dentro de `AuthProvider`**, sin pantalla: obligaba
a meter la lógica de la vuelta en el único punto por el que pasan todos los
cambios de sesión de la aplicación, que es exactamente lo que el paso 13 acabó
de simplificar.

### 3. La RPC se llama **siempre que haya intención**, y quien decide si aplica es el servidor

El orden en la pantalla de vuelta es: esperar a que el perfil esté cargado, leer
la intención **borrándola**, y si la hay, llamar a la RPC. Después, navegar con
`getHomeRouteForRole()` sobre el rol que devolvió el servidor.

**Esta decisión se corrigió después de romperse en una medición, y el fallo
merece quedar escrito porque la versión rota parecía obviamente correcta.** Decía
«sólo si hace falta», y definía «hace falta» como **«el rol difiere»**:

```
if (pendingRole && pendingRole !== user.role)   // ← el agujero
```

El disparador crea **todo** perfil de proveedor como `child`. Así que quien se
registra con Google eligiendo «Niño» tiene intención `child` y rol `child`,
**coinciden**, la RPC no se llamaba, y **la marca no se ponía nunca**. Esa cuenta
quedaba indistinguible de la de quien sólo pulsó Google en la pantalla de acceso
sin elegir nada: sin marca y sin lazos, promocionable a `tutor` más adelante. **La
regla se incumplía en el camino más común de todos**, un niño registrándose con
Google. Medido: `role=child`, `is_role_declared=false`, y `created_at` idéntico a
`updated_at` —prueba de que no hubo segunda escritura—.

**El error de fondo no era la condición, era la definición.** «Hace falta
escribir» no es «el rol difiere», es **«hay intención y el rol aún no está
declarado»**, y el segundo dato **el navegador no lo tiene**: lo tiene el
servidor, que es quien guarda la marca. Un cliente que intenta adivinarlo acaba
poniendo una regla de negocio en el sitio donde no se defiende ninguna.

Así que el reparto pasa a ser: **el cliente reenvía la intención; el servidor
decide si se aplica.** La RPC ya lleva las dos rejas, así que la llamada de más
—cuando el rol ya coincide y ya estaba declarado— no escribe nada y devuelve
`ZC001`.

Tres consecuencias que valen la pena:

- **Entrar desde `/login` sigue sin escribir nunca.** No hay intención que leer
  —y además el botón de `/login` borra la que hubiera—.
- **Volver a cargar `/auth/callback` no escribe nunca.** La intención ya se
  consumió en la primera pasada.
- **Y la que de verdad cierra el agujero: puede llamar y aun así ser rechazada.**
  Las dos comprobaciones de arriba son del navegador, y un navegador no es donde
  se defiende nada. La que manda es la de la 0018, en el servidor. Ver decisión 6.

**El observable cambia en un caso, y a mejor:** quien va a `/signup` con una
cuenta que ya existe y elige **el mismo rol que ya tiene** antes no veía nada y
aterrizaba en su panel como si acabara de registrarse; ahora ve el aviso neutro
que le dice que esa cuenta ya existía. Es más cierto: no se registró, entró.

Se descartó la alternativa de **exponer la marca al cliente** —añadirla a `User`
y condicionar con `intención && !declarado`—. Habría funcionado, pero pone una
**segunda copia de la regla en el navegador**, que es de donde vino este fallo, y
además esa copia puede llegar vieja: entre cargar el perfil y pulsar el botón,
quien manda sigue siendo la fila de la base.

La RPC **devuelve la fila del perfil**, como `update_my_profile`. Así el rol con
el que se navega es literalmente el que el servidor acaba de escribir, sin una
segunda lectura que pudiera cruzarse con otra escritura. El contexto expone
`updateRole(role)`, que actualiza `user` con esa fila.

`updateRole` **no toca `loading`**, por la misma razón que las tres acciones de
contraseña del paso 13: esa bandera significa «la sesión se está resolviendo» y
las guardas responden a ella cambiando su subárbol entero por un spinner. Aquí
la sesión ya está resuelta; lo que falta es un campo del perfil. La pantalla de
vuelta lleva su propio aviso de «Terminando el acceso…».

### 4. `AuthProvider` gana una acción, no una rama en el subscriptor

La tentación es distinguir el evento de la vuelta de Google dentro de
`onAuthStateChange`. **No.** Ese subscriptor es el arreglo del paso 13, compara
el **id** del usuario a propósito y sigue sin leer `_event`; meter ahí la lógica
del rol le daría una responsabilidad más al único punto por el que pasan todos
los cambios de sesión, y lo acoplaría al vocabulario de eventos de Supabase que
hasta hoy ha conseguido ignorar.

Lo que `AuthProvider` gana es de la misma naturaleza que lo que ya tiene: una
acción (`updateRole`) y un parámetro opcional en otra (`signInWithGoogle(role?)`,
que guarda la intención cuando le dan rol y **la borra** cuando no).

Que el borrado viva en `signInWithGoogle` y no sólo en la lectura es
deliberado: son **dos** momentos distintos de descarte, y el de la partida
—«entro por `/login`, no traigo rol»— es el que impide que una intención vieja
se aplique a un acceso que nunca la pidió.

### 5. Dos migraciones: la 0017 calca `update_my_profile`, la 0018 la reemplaza

La **0017** ya está aplicada, y no se corrige en el sitio: se reemplaza desde una
migración nueva, igual que la 0014 hizo con la 0013. Corregir una migración
aplicada dejaría el repositorio describiendo un esquema que ninguna base ha
tenido.

Lo que la 0017 fijó y **la 0018 conserva**, porque es el patrón probado de la
`...0006`:

- `security definer` y `set search_path = public`.
- `auth.uid()` **dentro del cuerpo, nunca como parámetro**: es lo que hace
  imposible fijar el rol de otra persona. Sin sesión, `42501`.
- **Parámetro `text`, no `public.user_role`.** Con el enum, un valor inválido
  muere en la conversión de PostgREST con un error que no dice nada útil; con
  `text` el rechazo es explícito y levanta `22023`. El enum sigue siendo la
  última defensa, igual que en el disparador.
- Devuelve `public.profiles`, y levanta `P0002` si no encuentra la fila.
- `revoke all on function ... from public, anon` y `grant execute ... to
  authenticated`. La 0009 enseñó que revocar de `public` **no** retira lo
  concedido directamente a un rol: `anon` va aparte.

`security definer` **no expande políticas** —es lo que hizo la 0014 para romper
la recursión de `join_requests`—, así que no hay ningún ciclo de RLS que
analizar: el cuerpo corre con los privilegios del dueño.

**Lo que la 0018 añade**, y por qué en ese orden:

1. **Una columna en `profiles` que registra si el rol se declaró al darse de
   alta**, `not null default false`. El dato que faltaba no era el rol —ése ya
   estaba— sino **si alguien llegó a elegirlo**.
2. **Backfill de las filas existentes a `true`.** Sin este paso las cuentas
   viejas siguen siendo ascendibles, que es exactamente el agujero que se midió.
3. **`handle_new_user_profile` marca `true`** cuando los metadatos traían un rol
   válido —el registro con contraseña— y **`false`** cuando no —Google, que no
   puede llevarlos—. Un valor manipulado sigue degradándose a `child`, y cuenta
   como **no declarado**: quien mandó basura no eligió.
4. **`set_my_role` rechaza por dos motivos distintos**, y en los dos casos sin
   escribir nada: si la marca ya es `true`, y si el perfil **tiene lazos de
   salón** (ver decisión 6). Sólo cuando no se cumple ninguno escribe el rol **y
   pone la marca a `true`**; las dos cosas van en la misma sentencia, así que no
   queda ventana entre fijar el rol y bloquearlo.

**Los rechazos nuevos llevan código propio**, y no reutilizan ninguno de los tres
que ya hay: `42501` es «no hay sesión», `22023` es «ese rol no existe» y `P0002`
es «no hay perfil». Ninguno significa «tu rol ya estaba decidido», y son los
únicos que no son un error que enseñar sino un aviso neutro (decisión 7).

**La clase del `SQLSTATE` importa y hay que elegirla bien.** El estándar reserva
las clases que empiezan por `0`-`4` y por `A`-`H`, y deja a la implementación las
que empiezan por `5`-`9` y por `I`-`Z`. Se ve en la práctica de PostgreSQL: sus
dos clases propias, `P0` (PL/pgSQL) y `XX` (internal), caen en `I`-`Z`, mientras
que las que usa en `A`-`H` —`0A`, `HV`— vienen de estándares. Así que se usa la
clase **`ZC`**: primer carácter en el tramo libre, y no es ninguna de las dos que
PostgreSQL ocupa. `ZC001` para el rol ya declarado y `ZC002` para los lazos de
salón.

**Dos códigos en el servidor, una sola respuesta en el cliente**, y es
deliberado: para quien está delante de la pantalla los dos significan lo mismo
—tu rol se queda como está— y merecen el mismo aviso neutro. La distinción se
conserva abajo porque **diagnosticar sí los separa**: uno dice «esta persona ya
eligió» y el otro «esta cuenta tiene historia», que son dos situaciones muy
distintas cuando haya que mirar un caso raro.

### 6. El rol se fija una vez, y eso sustituye a la decisión anterior

**La versión anterior de este diseño aceptaba el ascenso de una cuenta ya
existente**, con el argumento de que no añadía capacidad frente al agujero que
`CONTEXT.md` §2.2 ya acepta a sabiendas. **Eso resultó falso, y lo demostró una
medición, no un razonamiento.**

El daño, medido con una cuenta real: `taxoxolotl` era `child` **con membresía en
«salon sigma»**; se entró con Google desde `/signup` eligiendo «Tutor»; Supabase
enlazó la identidad —no hubo alta, el disparador no corrió— y la RPC la dejó
`tutor`. Resultado: **fuera de su propio salón y sin vuelta atrás por la
interfaz**. La fila de `class_memberships` sigue ahí, pero `PrivateRoute` ya no
le da acceso al panel del niño y `join_requests_insert_own` le impide siquiera
volver a pedir entrar; mientras tanto su tutor la sigue viendo listada como
exploradora. Cuenta muerta.

**El rol es la reja de dos políticas de escritura de la 0013**, y eso es lo que
convierte un campo en un daño:

- `class_groups_insert_own` exige `profiles.role = 'tutor'` para crear un salón.
- `join_requests_insert_own` exige `profiles.role = 'child'` para pedir entrar.

**La regla pasa a ser: el rol se fija en el primer registro y no cambia nunca.**

**Y la razón que en su día descartó poner la reja se cayó sola.** Se descartó por
el **no-op silencioso**: una comprobación que no hiciera nada dejaría a la
persona en el panel equivocado sin saber por qué. Pero entre medias se construyó
la pantalla de vuelta que **sabe explicar** (decisión 2), así que hoy el rechazo
no es silencioso: se ve, y se ve dentro de su propia sesión.

**Dos frases separadas, porque juntas se leen mal:**

Esto impide **cambiar** de rol. Una cuenta que eligió `child` no puede acabar
`tutor` por ninguna vía del cliente.

Esto **no** impide **registrarse como `tutor` de entrada**: cualquiera puede
llamar a `/auth/v1/signup` con la clave anónima —pública por diseño— declarando
`tutor`, y el disparador lo escribirá. **Ese agujero sigue abierto**, es distinto
del anterior, y lo cierra el **código de institución**, opción 2 de `CONTEXT.md`
§2.2, ya decidida como estado final antes de que haya usuarios reales.

**El cierre cuelga de DOS condiciones, no de una, y la segunda es la que de
verdad protege.**

La primera es la marca: el rol se fija una vez. Pero **la marca sola deja una
ventana permanente**. Una cuenta nacida del botón de Google de `/login` queda
`child` y **no declarada para siempre**: nadie eligió por ella. Si esa persona se
une a un salón y meses después va a `/signup` y elige «Tutor», la marca sigue en
`false` y la RPC aplicaría — y eso es **exactamente el daño de Taxo**: cuenta
muerta y fantasma en la lista de su tutor. No es un caso hipotético; es el que ya
se midió, por otro camino.

Por eso `set_my_role` rechaza también cuando el perfil **tiene lazos de salón**:

- una membresía como alumno en `class_memberships`,
- una solicitud pendiente en `join_requests`,
- o un salón propio en `class_groups`.

Las dos condiciones se reparten el trabajo con precisión: la marca corta a quien
**ya eligió**, y los lazos cortan a quien **ya construyó algo con el rol que
tiene**. Una cuenta recién nacida no tiene ninguno de los tres lazos, así que la
primera declaración legítima —la de quien entró por `/login` y va a registrarse
en condiciones— **sigue funcionando**. La reja sólo muerde cuando el cambio
rompería algo, que era la objeción original contra ponerla.

Consultar esas tres tablas desde dentro de la función **no abre ningún ciclo de
RLS**: `security definer` no expande políticas, que es justo lo que la 0014
explotó para romper la recursión de `join_requests`.

### 7. La asimetría de las dos direcciones la impone la tecnología

Los dos órdenes posibles acaban en sitios distintos, y **no es un capricho**:

**Formulario primero, Google después.** Se enlaza el proveedor, **se abre
sesión**, el rol no cambia. La pantalla de vuelta muestra un **aviso neutro**: ya
tenías cuenta, y entras como tal rol. **Aquí sí se nombra el rol**, porque es su
propia cuenta y su propia sesión: no se le está contando nada a un desconocido.
Nunca una pantalla de error, nunca se cierra la sesión y nunca se manda al
acceso — quien llega ahí ha entrado correctamente; lo único que no ocurrió es un
cambio que no debía ocurrir.

**Google primero, formulario después.** El registro falla. **Aquí no se abre
sesión**, así que quien está delante es, para el sistema, un desconocido. El
aviso es **genérico** —«esa cuenta ya existe»—, **no nombra el rol**, y de ahí al
acceso.

Esa diferencia —nombrar el rol en un caso y no en el otro— **sale de si hay
sesión o no**, y por eso queda escrita: no se puede «unificar» sin o bien callar
algo que la persona tiene derecho a saber de su propia cuenta, o bien contarle a
un desconocido si detrás de un correo hay un niño o un tutor. Lo segundo es justo
lo que `CONTEXT.md` §2.2 ya decidió evitar en `/forgot-password`, y el criterio
se hereda entero.

**Lo que el aviso genérico sí revela**, y conviene no fingir lo contrario: que
ese correo tiene cuenta. Es inevitable —el registro no puede continuar— y es
mucho menos de lo que revelaría nombrar el rol.

**El detalle del que depende esta mitad se midió, y salió distinto de lo
documentado.** La señal que se esperaba era un `user` con `identities` vacío. **En
este proyecto no ocurre:** `/auth/v1/signup` con un correo ya registrado responde
**HTTP 422** con `error_code: user_already_exists` y el mensaje «User already
registered».

El motivo es la configuración del panel: la ofuscación del `identities` vacío
existe para **no revelar que una cuenta existe**, y sólo se aplica cuando la
confirmación por correo está **encendida**. Aquí está apagada
(`mailer_autoconfirm: true`, `CONTEXT.md` §2.2), así que el servidor responde en
claro. **La detección se hace por ese código de error, no por `identities`.**

Y la segunda mitad de la medición, que era la que podía cambiar el alcance: **la
cuenta existente queda intacta**. Comprobado con las dos respuestas —la
contraseña enviada en ese intento **no** entra (400 `invalid_credentials`) y la
verdadera sigue entrando (200)—, así que este camino es **sólo un aviso, sin
efecto**.

**Eso reordena un argumento de arriba, y conviene decirlo:** el aviso genérico no
«revela» nada que el servidor no revele ya por su cuenta —quien llame directo a
la API recibe el mismo 422—. Lo que la interfaz decide aquí no es si se sabe que
la cuenta existe, sino **que no se diga con qué rol**, que es lo único que estaba
en su mano callar.

### 8. El botón huérfano se borra, no se adopta

`components/auth/GoogleAuthButton.tsx` no tiene consumidores y usa
`border-gray-300`, `text-gray-700` y `hover:bg-gray-50`, fuera del tema.

Se evaluó lo contrario —adoptarlo, arreglarle los colores y montarlo desde las
dos pantallas— y se descarta: los dos botones en línea **no son el mismo**. El
de `/login` dice «Inicia con Google» y no lleva rol; el de `/signup` dice
«Continuar con Google» y lleva el rol elegido. Unificarlos exigiría un
componente con dos textos y una prop de rol opcional para ahorrar unas líneas de
marcado que ya son correctas y están en el tema. La deuda que importa aquí es el
archivo muerto, y borrarlo la salda entera.

## Risks / Trade-offs

- **La ruta de vuelta no está en Redirect URLs del panel, y su ausencia NO da
  error** → Supabase devuelve en silencio al Site URL y el fallo parece del
  código. **Ya resuelto**: el usuario añadió `/auth/callback`, y la lista tiene
  hoy `/reset-password`, `/auth/callback` y un comodín
  `http://localhost:5173/**`.

- **El comodín `http://localhost:5173/**` enmascara errores de ruta, y en
  producción sería otra cosa** → En localhost se queda, porque ahí lo que hace es
  ahorrar entradas. Lo que no puede quedarse es al desplegar: con el flujo
  `implicit` (riesgo siguiente), un comodín sobre el dominio real permitiría que
  **cualquier** ruta de ese dominio reciba un refresh token en el fragmento de la
  URL. Al desplegar (paso 27) hay que **retirarlo**, no sólo añadir las dos
  direcciones del dominio real, y eso queda escrito en `CONTEXT.md` §2.2 —tarea
  9.3— porque es donde se mirará dentro de doce pasos.

- **Este cliente usa el flujo `implicit`, no PKCE, y aquí no se cambia** →
  `lib/supabase.ts:5` llama a `createClient` **sin opciones**, y
  `DEFAULT_OPTIONS` de `@supabase/auth-js` 2.112.3 trae `flowType: 'implicit'`
  (`GoTrueClient.js:24`). Los tokens vuelven en el **fragmento** de la URL, no
  como un código que se canjea. **No se toca en este cambio**: `flowType` es
  global al cliente y arrastraría también a `/reset-password`, que el paso 13
  midió de punta a punta y con «Secure password change» encendido. Cambiarlo es
  una decisión propia, con su propia verificación de los dos caminos, y no un
  efecto colateral de encender Google.

- **Google enlaza identidades por correo verificado** → **Medido, ya no es un
  riesgo abierto sino un hecho**: entrar con Google con un correo que ya tiene
  cuenta de contraseña **no crea usuario**, añade el proveedor al que existe, y
  el disparador no corre. Eso es lo que hacía ascendible una cuenta con historia,
  y lo cierra la 0018 (decisión 6). Enlazar sigue funcionando: es legítimo.

- **El backfill de la 0018 congela el rol que cada fila tenga al aplicarse** →
  Una fila con el rol ya estropeado se congelaría estropeada. Por eso el orden
  del `Migration Plan` no se puede invertir: las cuentas dañadas durante la
  verificación se borran **antes** del `db push`.

- **La aplicación sigue «En prueba» en Google** → Sólo entran los correos de la
  lista de usuarios de prueba de Google Cloud, y un correo que falte recibe
  «Acceso bloqueado», **que parece un fallo del código y no lo es**. Ya ocurrió
  durante la verificación. Cada cuenta nueva se añade a esa lista antes de usarla.

- **Un secreto mal pegado en el panel no se distingue de un fallo de código** →
  Ocurrió, y costó horas. El diagnóstico queda escrito en `CONTEXT.md` §2.2
  porque no es deducible: si la autorización **funciona** —Google enseña su
  pantalla y devuelve un código— pero el **canje** falla, el `client_id` está
  bien y lo único que entra en juego en ese segundo tramo es el **Client
  Secret**. El mensaje que lo delata es «Unable to exchange external code».

- **Los tests de hoy tienen que seguir pasando** → Los alcanza el doble de
  `AuthContextValue` en `test/buildAuthValue.ts`, que es un ajuste de firma, y
  `SignUpOutcome`, que gana un caso. Si falla otra cosa, es señal: se mira, **no
  se «arregla» el test**.

## Migration Plan

Son dos migraciones, y sólo una queda por aplicar.

**`202606030017_create_set_my_role_rpc.sql` — ya aplicada.** Sólo creó una
función: no alteró ninguna tabla, no tocó datos y no cambió ninguna política. No
se corrige en el sitio.

**`202606030018_lock_profile_role.sql` — por aplicar.** Añade una columna con
`default false`, hace **backfill a `true`**, y reemplaza el disparador y
`set_my_role`. Su SQL se lee **antes** de que el usuario lance el `db push`
(comprobación 9 de `ROADMAP.md` §1.3), y al lanzarlo se lee la salida: tiene que
aplicar la 0018 y **ninguna más**. Si arrastra otras, hay migraciones sin aplicar
en la base y eso se mira antes de seguir.

**El orden no se puede invertir, y es la parte delicada:**

1. El usuario **borra las cuentas que quedaron con el rol cambiado** durante la
   verificación. El backfill congela el rol que cada fila tenga en ese momento, y
   una fila estropeada quedaría estropeada para siempre.
2. `db push` de la 0018.
3. **Regenerar los tipos**, `npx supabase gen types typescript --linked`: la
   columna nueva tiene que aparecer en `types/database.types.ts`, que se genera y
   nunca se edita a mano.

Revertir es `drop column` sobre `profiles` más restaurar el cuerpo de las dos
funciones desde la 0017 y la 0011, y volver atrás los archivos de
`apps/web/src`. Lo que no se revierte son los roles ya fijados durante la
verificación, que quedan escritos en los perfiles de las cuentas de prueba.

Del panel de Supabase no queda nada pendiente: la ruta de vuelta ya está en
**Redirect URLs** y el Client Secret ya está bien pegado.
