## Context

Ver `proposal.md` — Why. Lo que hace falta para entender el enfoque es el estado
que dejó el paso 12, porque es el que decide la parte más delicada de este:

- `PublicRoute.tsx:23` aparta de las rutas públicas a quien tenga **sesión y
  rol**. Fue el ajuste del paso 12 para no cerrar un bucle con `PrivateRoute`.
- `PrivateRoute.tsx` exige sesión, y **sólo comprueba el rol si la ruta declara
  uno** (`role` es una prop opcional). Con sesión y sin `role` declarado, deja
  pasar a cualquiera.
- `AuthProvider.tsx:69` se suscribe a `onAuthStateChange` e **ignora el tipo de
  evento**: el parámetro está nombrado `_event`. Sincroniza sesión y perfil sea
  cual sea el evento.
- Una sesión cuyo usuario no tiene fila en `profiles` se cierra sola, con su
  motivo. Es el invariante del paso 12: hay sesión si y sólo si hay perfil.

La restricción que ordena el diseño es que **el enlace del correo abre una sesión
de verdad**. Eso convierte la pantalla de contraseña nueva en un caso que no
encaja en la clasificación pública/privada tal cual se venía usando.

## Goals / Non-Goals

**Goals:**

- Que ninguno de los tres botones siga muerto.
- Que la mitad A se pueda dar por terminada aunque la mitad B se atasque.
- Que la parte comprobable sin correo quede comprobada de verdad, con las dos
  respuestas del servidor: la contraseña vieja rechazada y la nueva aceptada.

**Non-Goals:**

- No se toca `PrivateRoute` ni `PublicRoute`. La decisión 1 explica por qué no
  hace falta, y no tocarlos es parte del resultado.
- No se toca `_event` en `AuthProvider`. Ver decisión 3.
- No se activa ni se desactiva «Secure password change» en el panel de Supabase.
  Está apagado y así se queda durante el paso; sólo se propone el experimento del
  final. Ver decisión 5.
- No se cambia el mínimo de longitud de contraseña, que hoy son 6 caracteres en
  `SignupForm.schema.ts` y `LoginForm.schema.ts`. Lo que este paso añade lo
  hereda, para no tener dos mínimos distintos en la misma aplicación.

## Decisions

### 1. `/reset-password` va tras `PrivateRoute` **sin** `role`, y `/forgot-password` tras `PublicRoute`

Es la decisión principal, y las dos pantallas caen en lados distintos.

`/forgot-password` es para quien **no** ha entrado, así que `PublicRoute` es
exactamente lo que le toca: a quien ya tiene sesión y rol lo lleva a su panel, y
hace bien — esa persona no ha olvidado nada, puede cambiarla desde Ajustes.

`/reset-password` es el caso raro. Se llega con una sesión real que abrió el
enlace del correo, y con perfil, así que:

- **`PublicRoute` no sirve.** Aparta a quien tiene sesión y rol hacia su panel,
  de modo que la pantalla no se vería nunca. Quien pinchara el enlace acabaría en
  `/dashboard/worlds` sin saber por qué, y sin haber cambiado nada.
- **`PrivateRoute role="child"` o `role="tutor"` tampoco.** El rol es irrelevante
  aquí: la pantalla es la misma para los dos, y declarar uno rebotaría a la mitad
  de la gente al panel del otro.
- **`PrivateRoute` sin `role` sí.** Exige sesión —que es justo lo que el enlace
  aporta y lo que hace falta para que `updateUser` tenga a quién aplicarse—, no
  mira el rol, y a quien llegue a esa dirección sin enlace lo manda a `/login`,
  que es la respuesta correcta: sin sesión no hay nada que fijar.

**No hace falta escribir ninguna guarda nueva.** `PrivateRoute` ya acepta que
`role` sea opcional; hasta ahora ninguna ruta se había aprovechado de ello. La
alternativa —una tercera guarda `RecoveryRoute`— se descarta: sería un tercer
sitio donde razonar sobre sesiones, y las tres tendrían que mantenerse coherentes
entre sí, que es de donde salió el bucle del paso 12.

Que este caso exista **es la prueba de que la prop opcional estaba bien puesta**,
y conviene dejarlo dicho para que nadie la «limpie» creyéndola muerta.

### 2. La URL de vuelta se construye como la de Google, y es lo que se prueba

`auth.service.ts` ya tiene `getOAuthRedirectUrl()`, que hace
`new URL(ROUTES.DASHBOARD, window.location.origin).toString()`. La recuperación
usa el mismo patrón con `ROUTES.RESET_PASSWORD`, y no una cadena escrita a mano:
una constante suelta se desincroniza de `routes.ts` en cuanto alguien renombre la
ruta, y el fallo aparecería **sólo en el correo**, que es el sitio más caro de
depurar de todo el proyecto.

Esa URL es una de las dos cosas que se prueban sin depender del correo: el test
comprueba que `resetPasswordForEmail` se llama con `redirectTo` apuntando a
`/reset-password` sobre el origen actual.

### 3. `_event` se queda como está: la pantalla no necesita distinguir `PASSWORD_RECOVERY`

Supabase emite `PASSWORD_RECOVERY` cuando el cliente detecta los tokens del
enlace en la URL. La pregunta es si `AuthProvider` tiene que distinguirlo.

**No.** El cliente ya establece la sesión solo al detectar el enlace, y
`syncSessionProfile()` la recoge igual que cualquier otra. Con la sesión
establecida, `PrivateRoute` deja pasar y la pantalla se pinta. Distinguir el
evento sólo haría falta para **forzar** a alguien a la pantalla de contraseña
nueva desde cualquier otra ruta, y eso no hace falta aquí: el `redirectTo` ya
deposita a esa persona exactamente donde tiene que estar.

Añadir la rama «por si acaso» tendría coste y ninguna ganancia: una condición más
en el único punto por el que pasan todos los cambios de sesión de la aplicación,
sin ningún comportamiento que la justifique.

**Lo que sí hereda este paso, y conviene saberlo:** si la cuenta que abre el
enlace no tuviera fila en `profiles`, el invariante del paso 12 cerraría esa
sesión y la recuperación fallaría con el mensaje de cuenta sin perfil. Es
correcto —esa cuenta no puede usar la aplicación de todos modos— y no hay nada
que añadir, pero es la respuesta a «¿por qué no puedo recuperar esta cuenta?» si
alguien borra un perfil a mano en el panel.

### 4. Un solo panel de cambio de contraseña para las dos pantallas de Ajustes

`components/dashboard/shared/ChangePasswordPanel.tsx`, montado por
`StudentSettingsModule` y `TeacherSettingsModule`. Es donde ya viven
`StoreErrorNotice`, `ConfirmDialog` y `GroupBadge`, que son exactamente el mismo
caso: piezas que montan varias pantallas del panel.

Los dos módulos de Ajustes tienen marcos distintos —colores, adornos, textos— pero
el formulario es la misma función. Dos copias divergirían en cuanto alguien
arreglara una sola, que es lo que ya pasó con el `signOut` de las dos barras
laterales, anotado en `CONTEXT.md` §2.2.

La pantalla de `/reset-password` **no** monta ese panel: vive fuera del dashboard,
con el marco de las pantallas de acceso, y comparte con él lo que de verdad se
comparte —el esquema de zod y `updatePassword()` del contexto—, no el marcado.

### 5. El cambio desde Ajustes **sí** pide la contraseña actual, y se verifica de verdad

`supabase.auth.updateUser({ password })` no exige la contraseña actual: la sesión
abierta le basta. Aquí no basta.

**El motivo es el contexto de uso.** Esto es una plataforma para niños en
computadores de aula compartidos. Quien se siente ante la sesión abierta de un
compañero puede cambiarle la contraseña y dejarlo fuera de su propia cuenta — y
la salida que este mismo paso construye, el correo de recuperación, es justo la
que un niño puede no tener o no controlar. El daño es mayor que en una aplicación
normal y el remedio le llega peor. Cuesta un campo y una llamada.

**Se verifica contra el servidor, no de adorno.** `authService.changePassword()`
llama primero a `supabase.auth.signInWithPassword` con el correo de la sesión y
la contraseña actual escrita; sólo si esa llamada tiene éxito llama a
`updateUser({ password })`. Si falla, devuelve el error y no toca nada.

Dos propiedades de esa secuencia que hay que tener presentes:

- **La verificación emite una sesión nueva del mismo usuario.** Es inocuo: mismo
  `auth.uid()`, mismo perfil, mismo rol. `AuthProvider` la recoge por
  `onAuthStateChange` como cualquier otra y no hay nada que reconciliar.
- **El camino de error no perturba la sesión en curso.** Un
  `signInWithPassword` fallido no toca la sesión ya almacenada, así que con la
  contraseña actual equivocada la persona sigue dentro, viendo el motivo. Por eso
  la llamada vive en el servicio y no pasa por el `signIn` del contexto, que
  mueve `loading` y `error` globales y trataría un tecleo equivocado como un
  fallo de sesión.

**Lo que esta comprobación NO cierra, y es el argumento para el interruptor del
servidor:** proteger el formulario protege a quien usa la aplicación, no a quien
tenga el token de una sesión robada y llame a la API directamente — ése se salta
la pantalla entera y llama a `updateUser` sin pasar por aquí. Eso sólo lo cierra
«Secure password change» en el panel de Supabase, que hace que el propio servidor
exija reautenticación reciente. Es la razón para encenderlo cuando haya usuarios
reales, y no un sustituto de lo que se hace aquí: son capas distintas.

**Efecto secundario bueno:** con la reautenticación hecha en el cliente, da igual
cómo esté ese interruptor. Hoy está **apagado** —comprobado por el usuario en el
panel—, y ni se enciende ni se apaga como parte de este paso. Queda un
experimento al final, con la mitad A ya funcionando debajo: encenderlo y repetir
la prueba, para ver si la reautenticación se satisface con la sesión recién
creada por `signInWithPassword` o si exige además un nonce por correo. Si exige
nonce, se apaga y se anota: el correo de fábrica no da para meter un envío en
cada cambio de contraseña.

### 6. Dos esquemas de zod, una regla compartida

La pantalla de `/reset-password` **no** pide la contraseña actual: quien llega
ahí es exactamente quien no la sabe. Arrastrar allí el campo de Ajustes sería
pedirle el dato que vino a recuperar.

Así que son dos esquemas, no uno:

- `changePasswordSchema` — contraseña actual + nueva + repetición.
- `resetPasswordSchema` — nueva + repetición.

Lo común es **la regla de las dos nuevas**: mínimo de 6 caracteres, heredado de
`SignupForm.schema.ts` para no tener dos mínimos distintos en la aplicación, y la
igualdad entre ambas. Esa parte se declara una vez y la usan los dos esquemas; lo
que no se hace es copiarla, que es como los dos formularios acabarían con
mínimos distintos sin que nadie lo decidiera.

## Risks / Trade-offs

- **La mitad B depende de configuración del panel que no puedo leer** → La
  primera tarea de B la comprueba con el usuario. Si falta, B para y A queda
  terminada; no se da el paso por cerrado.

- **El correo de fábrica de Supabase tiene un límite de envíos bajo, unos pocos
  por hora** → Si el correo no llega, **se diagnostica antes de repetir**:
  reintentar en bucle quema la cuota y bloquea la prueba durante una hora. La
  prueba de entrega se hace una vez, contra la dirección del dueño del proyecto,
  que es la única a la que el correo de fábrica llega con fiabilidad.

- **Casi toda la mitad B depende de un correo que no puedo abrir yo** → Por eso
  las dos piezas que sí se pueden aislar llevan test: la URL de vuelta y que la
  pantalla no envíe nada con las contraseñas descuadradas. Lo que queda para la
  prueba manual es la entrega y el enlace, que es irreducible.

- **Cambiar la contraseña de una cuenta de prueba rompería el acceso «Sin
  login»** → Las pruebas usan cuentas nuevas creadas desde `/signup`. Las de
  `apps/web/.env` no se tocan.

- **Los 61 tests actuales tienen que seguir pasando** → Sólo los alcanza el doble
  de `AuthContext` en `test/renderClassrooms.tsx`. Si falla otra cosa, es señal.

## Migration Plan

No hay migración de datos ni de esquema, y **no se toca SQL**: las contraseñas
viven en `auth.users` y las gestiona Supabase. No hay `db push` ni nada que el
usuario tenga que lanzar por consola.

Lo único que hace falta del panel es la configuración de URLs de la mitad B, que
es reversible y no destruye nada.

Revertir es volver atrás los archivos de `apps/web/src`. Lo que no se revierte
son las contraseñas cambiadas durante la verificación, que quedan cambiadas en
las cuentas de prueba que se creen para ella.
