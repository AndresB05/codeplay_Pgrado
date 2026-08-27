## Context

Ver `proposal.md` — Why. Lo que hace falta saber para entender el enfoque es
dónde está hoy cada pieza, porque casi todo existe y lo que falta es cómo se
enlazan:

- `services/auth.service.ts` está completo: `signIn`, `signUp`, `signOut` y
  `signInWithGoogle`, con la forma `{ data, error }`. No se toca.
- `context/AuthProvider.tsx` ya sincroniza sesión y perfil con
  `syncSessionProfile()`, y ya expone `signIn` / `signUp` / `signOut`.
- `components/home/Navbar.tsx:41-48` ya resuelve el problema de navegar por rol:
  un efecto que espera a que llegue `user` y entonces llama a
  `getHomeRouteForRole(user.role)`. Lleva su comentario explicando por qué el
  rol lo manda el servidor y no el botón pulsado.
- La migración `202606030011_profile_role_enum.sql` crea el perfil con el rol de
  los metadatos y degrada a `child` cualquier valor que no sea `child` ni
  `tutor`.

La restricción que ordena el diseño es que **hay tres sitios que autentican**
—`Login`, `Signup` y el acceso «Sin login» de `Navbar`— y los tres tienen que
terminar igual. Cualquier solución que arregle dos y deje el tercero aparte
vuelve a producir el desajuste que este paso viene a cerrar.

## Goals / Non-Goals

**Goals:**

- Una sola pieza decide a qué panel se va después de autenticarse, y la usan los
  tres sitios que autentican.
- Ningún camino de entrada termina en una pantalla que no explica lo que pasó.
- El invariante que queda montado al terminar: **hay sesión si y sólo si hay
  perfil**. Todo lo demás cuelga de ahí.

**Non-Goals:**

- No se toca `hooks/useActiveRole.ts`. Su contrato —perfil primero, invitado
  después— sigue siendo correcto; lo que faltaba era qué hacer con el `null`, y
  eso es de las guardas.
- No se toca la frontera del store de salones. `ClassroomsProvider` lee el
  usuario del contexto de auth y nada de lo que cambia aquí altera esa lectura:
  sigue recibiendo un `User` o `null`, y `useClassrooms()` sigue siendo la única
  puerta. La única razón de mencionarlo es que un usuario `null` deja de poder
  coexistir con una sesión abierta, lo que **reduce** los estados que el store
  puede ver, no los amplía.
- No se toca el esquema de base de datos. Este cambio no lleva SQL.
- No se cierra el problema del rol elegido por el navegador. Se documenta abajo.

## Decisions

### 1. El patrón de `Navbar` se extrae a un hook, no se copia

`hooks/useRoleHomeRedirect.ts`: guarda un indicador de «estoy esperando al
perfil», y cuando `user` llega navega a `getHomeRouteForRole(user.role)` y lo
apaga. Es exactamente lo que hoy hace `Navbar` con su estado `signingIn`.

Su API tiene **tres** cosas, no dos: arrancar la espera, cancelarla, y **el
indicador de espera hacia fuera**. El tercero es requisito, no comodidad:
`Navbar.tsx:143` usa hoy ese estado como `disabled={signingIn || loading}` para
desactivar los botones mientras se autentica. Un hook que se quedara el estado
sin devolverlo dejaría a `Navbar` sin nada con qué sustituirlo, y el arreglo
llegaría de rebote cuando `tsc` protestara.

Lo usan `Login`, `Signup` y `Navbar`. El efecto de `Navbar` se sustituye por la
llamada al hook, y su comentario —el que explica que el rol lo manda el
servidor— se muda al hook, que es donde pasa a vivir el motivo.

**Alternativas descartadas.** Copiar el efecto en las dos pantallas: tres copias
de la misma regla, y la próxima pantalla que autentique hará la cuarta.
Navegar desde `AuthProvider` en cuanto llegue el perfil: metería enrutado en un
proveedor que hoy no sabe nada de rutas, y dispararía también al restaurar la
sesión al recargar, que es justo cuando no se quiere navegar a ningún sitio.

### 2. `signUp` deja de devolver `boolean`

Un booleano no puede distinguir los tres finales del registro: entró, se creó la
cuenta pero falta confirmar el correo, o falló. `AuthContextValue.signUp` pasa a
devolver `'signed-in' | 'confirmation-required' | 'error'`, y `Signup` decide con
eso: con `'signed-in'` arranca la espera del hook; con `'confirmation-required'`
se queda donde está y muestra el aviso; con `'error'` sigue el camino de siempre,
que ya pinta `error.message`.

El aviso es un recuadro con los tokens del tema —`border-mint-dark`,
`bg-mint-soft`, `text-mint-dark`—, paralelo al de error que ya existe en
`Signup.tsx:180-184` con los tokens `coral`. No se introduce ningún color nuevo.

**Alternativas descartadas.** Devolver la sesión cruda y que la pantalla mire si
es nula: obliga a cada pantalla a conocer la semántica de Supabase. Un booleano
más un campo de estado aparte en el contexto: dos fuentes para un mismo hecho, y
nada impide que se contradigan.

**Es un cambio incompatible**, y su único consumidor fuera de `Signup` es el
doble de `test/renderClassrooms.tsx:31`.

### 3. La ausencia de perfil se vuelve un error, y la sesión se cierra

`profile.service.ts:45` devuelve hoy `{ data: null, error: null }` cuando no hay
fila, que le pide a cada consumidor que invente qué significa. Pasa a devolver un
`AppError` con código propio (`profile_not_found`) y mensaje en español. Es
distinguible de un fallo de red porque la consulta terminó bien: `maybeSingle()`
sólo devuelve `null` sin error cuando la fila de verdad no existe.

`AuthProvider.syncSessionProfile()` tiene hoy **una sola rama** para el fallo:
`if (profileResult.error)` pone `user = null` y guarda el error. Esa rama se
parte en dos, y la distinción es la mitad importante de la decisión:

- **Código `profile_not_found`:** además de lo anterior, se **cierra** la sesión
  llamando a `authService.signOut()`. Una sesión sin perfil no puede hacer nada
  en esta aplicación —no tiene rol, así que ninguna ruta con rol la admite, y las
  políticas de RLS cuelgan del perfil—, y dejarla viva crea el estado ambiguo
  «autenticado pero sin sitio a donde ir», que es el que hoy deja entrar a un
  panel ajeno.
- **Cualquier otro error:** la sesión **sobrevive** y sólo se guarda el motivo.
  Un corte de red o un servidor que no responde no dicen nada sobre si la cuenta
  tiene perfil; lo más probable es que lo tenga y vuelva a estar disponible al
  siguiente intento. Colgar el cierre de la rama común convertiría un fallo
  pasajero en la expulsión de un usuario legítimo, que es un daño peor que el que
  la decisión viene a evitar.

Es la razón por la que el código propio de la decisión anterior no es cosmético:
sin él las dos ramas no se pueden separar, porque a `syncSessionProfile()` le
llega un `AppError` en los dos casos.

Cerrarla deja el invariante limpio: **hay sesión si y sólo si hay perfil**. Con
él, `isAuthenticated(session)` vuelve a significar lo que las dos guardas creen
que significa.

Se llama a `authService.signOut()` y no al `signOut` del contexto: ese empieza
poniendo `setError(null)` y borraría el motivo que se acaba de guardar, que es lo
único que el usuario va a ver.

**Alternativa descartada.** Dejar la sesión viva y bloquear sólo en
`PrivateRoute`. Deja al usuario con media sesión indefinida y obliga a las dos
guardas a coordinarse para no rebotarse entre ellas. **Alternativa descartada:**
crear el perfil desde el cliente si falta. El perfil lo crea el disparador con el
rol de los metadatos; hacerlo desde el navegador significa dejar que el navegador
escriba el rol directamente, que es agravar el problema 4.

### 4. `syncSessionProfile()` devuelve si consiguió perfil

Sin esto, `signIn` devolvería `true` tras cerrar la sesión por falta de perfil, y
`Login` arrancaría una espera que no termina nunca: el hook aguarda un `user` que
ya se sabe que no va a llegar, y el botón se queda en «Iniciando...».

Pasa a devolver `boolean` —cierto cuando quedó un perfil cargado—, y `signIn` y
`signUp` lo propagan. Es el detalle que convierte la decisión 3 en algo que se
ve en la pantalla en vez de en un spinner eterno.

### 5. Las dos guardas se ajustan a la vez, o hay bucle

Este es el punto donde es fácil equivocarse, así que va explícito:

- `PrivateRoute.tsx:37` dice hoy `if (role && activeRole && activeRole !== role)`.
  Ese `activeRole &&` es el agujero del problema 3. Pasa a: si la ruta exige rol
  y no hay rol activo, se va a `/login`.
- `PublicRoute.tsx:23` aparta de las rutas públicas a todo el que tenga sesión,
  mire o no el rol. Si `PrivateRoute` manda a `/login` a alguien con sesión y sin
  rol, `PublicRoute` lo devuelve a `getHomeRouteForRole(null)`, que es
  `/dashboard/worlds` —una ruta privada de niño—, y de ahí otra vez a `/login`:
  **bucle infinito**. Pasa a apartar sólo a quien tenga sesión **y** rol activo.

Con la decisión 3 en su sitio el bucle no debería alcanzarse nunca, porque la
sesión sin perfil se cierra antes. Los dos ajustes son la red por debajo: cada
uno hace inofensivo el estado que el otro ya no produce.

### 6. El rol lo sigue eligiendo el navegador — decisión escrita, no accidente

**Qué pasa.** `authService.signUp()` envía el rol en `options.data`, y el
disparador lo lee de `raw_user_meta_data`. Cualquiera puede llamar a
`/auth/v1/signup` con la clave anónima —que es pública por diseño— y `role:
"tutor"`, y quedar dado de alta como tutor.

**Lo que ya está acotado.** El disparador sólo acepta `child` o `tutor`;
cualquier otra cosa se degrada a `child` en vez de reventar el alta, y el enum
`user_role` es la última defensa. Así que lo posible es *declararse tutor*, no
escribir un rol arbitrario. Y un tutor falso no puede tirar del historial de un
niño cualquiera: el niño busca el salón por su identificador público, solicita
entrar, y el tutor acepta. Hace falta que un niño se ofrezca. Lo que un tutor
falso obtiene es la superficie de un salón propio y, de los niños que entren en
él, nombre, avatar, XP y racha.

**Por qué no se cierra aquí.** No es un arreglo de cliente: mientras el alta sea
pública, el rol tiene que concederlo el servidor por una vía que el navegador no
controle, y eso son piezas nuevas que no caben en este paso sin desbordarlo.

**Lo que costaría cerrarlo**, de menos a más:

1. *Revisión manual.* Todo el mundo se da de alta como `child` y el rol `tutor`
   lo concede el usuario desde el panel de Supabase. Cero código, coste todo
   operativo. Sirve para un proyecto de grado con pocos tutores.
2. *Código de institución.* El registro de tutor pide un código; una tabla de
   códigos válidos y una RPC `security definer` que ascienda el perfil al
   canjearlo. Es la opción proporcionada: una migración, un servicio y un campo
   más en la pantalla de registro. El disparador deja de leer el rol.
3. *Dominio de correo institucional.* El disparador concede `tutor` sólo a
   dominios de una lista. La migración es pequeña, pero el proyecto no tiene hoy
   ningún dominio de institución que poner en esa lista, así que no aplica.

**Decidido: se queda como está, anotado.** Para un proyecto de grado que aún no
tiene usuarios reales el riesgo es aceptable, y la opción 2 es la que hay que
implementar antes de que los tenga. Queda escrito en `docs/CONTEXT.md` §2.2 para
que la siguiente sesión no lo redescubra como si fuera un hallazgo.

## Risks / Trade-offs

- **Cerrar la sesión por falta de perfil podría echar a alguien legítimo si el
  disparador fallara al crear el perfil** → El disparador es `security definer` y
  se ejecuta dentro de la transacción del alta, así que un fallo suyo aborta el
  alta entera: no hay usuario sin perfil por esa vía. El caso que queda es un
  perfil borrado a mano en el panel, y para ése cerrar la sesión y decirlo es
  precisamente la conducta correcta.

- **Es un cambio incompatible en `signUp`** → Un solo consumidor real y un doble
  de test. `tsc` en `npm run build` señala cualquiera que se escape.

- **Los 53 tests actuales tienen que seguir pasando** → Sólo los alcanza el doble
  de `test/renderClassrooms.tsx`, que es un ajuste de firma. Si falla otra cosa,
  es señal de que el cambio tocó lo que no debía y hay que mirarla, no relajar el
  test.

- **La rama de «confirma tu correo» no se puede probar a mano sin volver a
  encender el interruptor** en el panel de Supabase, y el encargo pide dejarlo
  apagado para poder probar el registro real → Por eso esa rama lleva test
  automático: es la única forma de comprobarla sin tocar la configuración del
  proyecto real.

- **El hook navega desde un efecto, no desde el manejador del envío** → Es
  deliberado y es lo que ya hace `Navbar`: el perfil llega en un render
  posterior, así que navegar dentro del manejador obligaría a adivinar el rol
  antes de tenerlo. El precio es un render intermedio en el que la pantalla de
  acceso sigue visible con el botón en «Iniciando...», que es exactamente lo que
  se quiere ver.

## Migration Plan

No hay migración de datos ni de esquema: el cambio es de cliente. No requiere
`db push` ni ninguna acción por consola del usuario.

Lo único que exige del entorno es que **«Confirm email» siga apagado** en
`Authentication → Sign In / Providers → Email` mientras se verifica el registro
real. Comprobado el 27-ago-2026: `/auth/v1/settings` responde
`"mailer_autoconfirm": true`.

Revertir es volver atrás los archivos de `apps/web/src`; nada queda escrito
fuera del navegador salvo las cuentas de prueba que cree la verificación, que se
borran desde `Authentication → Users`.
