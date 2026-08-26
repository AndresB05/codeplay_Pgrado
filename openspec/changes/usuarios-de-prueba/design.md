## Context

Ver `proposal.md` — Why. Lo medido y lo leído que condiciona el diseño:

- **La confirmación por correo está activada.** Consultado hoy
  `GET /auth/v1/settings` del proyecto real: `mailer_autoconfirm: false`,
  `disable_signup: false`, `external.email: true`. Un `signUp` normal deja la
  cuenta **sin confirmar** y el `signIn` posterior falla con «Email not
  confirmed». Esto descarta el método más obvio y decide el resto (decisión 1).
- **El andamiaje ya existe entero.** `AuthProvider` expone `signIn(email,
  password)` y llama a `syncSessionProfile()`, que carga el perfil y con él
  `user.role`. `useActiveRole()` devuelve `user?.role ?? getGuestRole()`.
  `PrivateRoute` admite sesión real por `isAuthenticated(session)` sin depender
  de la marca de invitado. **Ninguno de los tres se toca.**
- **`config/env.ts` accede a `import.meta.env.VITE_X` como miembros**, no
  volcando `import.meta.env` entero, y ejecuta `validateEnv()` al importarse.
  Cualquier variable que se añada ahí se evalúa también en producción y acaba en
  el paquete publicado (decisión 3).
- **`guest.helpers.ts` ya centraliza el atajo** y ya se apoya en
  `import.meta.env.DEV` mediante `isGuestModeAvailable()`. Es el sitio natural,
  y el único fichero de la aplicación que hay que ampliar además del `Navbar`.
- **`handleGuestEntry` en `Navbar.tsx` es síncrono hoy**: escribe la marca y
  navega. Pasa a ser asíncrono, y eso trae estado de carga y de error.

## Goals / Non-Goals

**Goals:**

- Que un clic en «Sin login» produzca una sesión con `access_token`, de modo que
  `auth.uid()` deje de estar vacío y las políticas del paso 9 se puedan probar.
- Que las políticas queden **verificadas de verdad**, casos negativos incluidos,
  y que lo verificado quede escrito con la misma precisión que lo no verificado.
- Que quien clone el repositorio sin credenciales siga pudiendo entrar.
- Que nada de esto pueda llegar a producción.

**Non-Goals:**

- Una interfaz para elegir cuenta de prueba. Los dos botones que ya existen
  bastan y no se añade ninguno.
- Un tercer rol, o más de una cuenta por rol.
- Sembrar salones de ejemplo en la base para las cuentas nuevas. Eso lo traerá
  el paso 10 con el store real; aquí las cuentas nacen sin nada, y **eso es
  justo lo que hace legible la verificación**: lo que aparezca, apareció porque
  esta sesión lo creó.

## Decisions

### 1. Las cuentas se crean desde el panel, y el rol se corrige con una sentencia

Tres métodos posibles, y los dos primeros se caen:

| Método | Por qué no |
| --- | --- |
| `signUp` desde la aplicación con `role` en los metadatos | La confirmación por correo está activada: la cuenta nace sin confirmar y el `signIn` falla |
| Desactivar la confirmación en el panel y luego `signUp` | Funciona, pero debilita un ajuste **global** del proyecto para resolver un problema de dos cuentas, y hay que acordarse de revertirlo |
| **Panel con «Auto Confirm User» + una sentencia SQL** | **Elegido** |

El método elegido no toca ningún ajuste global. El usuario crea las dos cuentas
desde *Authentication → Users → Add user*, marcando **Auto Confirm User**, y
ejecuta después una sentencia en el editor SQL para poner el rol del tutor.

Hace falta esa sentencia porque **una cuenta creada desde el panel no lleva
metadatos**: `handle_new_user_profile` lee `raw_user_meta_data ->> 'role'`, no
encuentra nada y cae al valor por defecto. Las dos cuentas nacerían con
`role = 'child'`, y el tutor de prueba no podría ni crear un salón, porque la
política de inserción de `class_groups` exige rol `tutor`. El disparador sí crea
el perfil —se dispara con cualquier alta en `auth.users`, venga de donde venga—,
así que lo único que falta es el rol.

`profiles` no admite `update` desde el cliente (migración 0009) y
`update_my_profile` no toca el rol a propósito, así que la corrección va por el
editor SQL del panel, que corre como administrador. Es una acción del usuario,
igual que crear las cuentas.

**El rol se verifica, no se supone.** Después de la sentencia se comprueba el
`profiles.role` real de cada cuenta leyéndolo con su propia sesión. Si el tutor
sale `child`, el paso está mal hecho aunque todo lo demás funcione.

### 2. Las credenciales las pone el usuario y no pasan por esta sesión

Cuatro variables en `apps/web/.env`, que está en `.gitignore`:

```
VITE_DEV_TUTOR_EMAIL, VITE_DEV_TUTOR_PASSWORD,
VITE_DEV_CHILD_EMAIL, VITE_DEV_CHILD_PASSWORD
```

En `.env.example` van los cuatro nombres **con el valor vacío** y un comentario
de que son opcionales y sólo de desarrollo. No se inventan contraseñas ni se
escriben en ningún archivo del repositorio.

**La verificación se hace con el navegador, no tecleando la contraseña.** La
aplicación inicia sesión con lo que hay en su `.env`; a partir de ahí, las
comprobaciones por HTTP usan el `access_token` que la propia sesión dejó en el
navegador. Esta sesión nunca manipula la contraseña, sólo el token que ya existe.

De dónde sale ese token, concretamente: supabase-js guarda la sesión en
`localStorage` bajo `sb-<project-ref>-auth-token`, donde `<project-ref>` es el
subdominio de `VITE_SUPABASE_URL`. Se lee desde el navegador, se saca el
`access_token` del JSON y se usa como `Authorization: Bearer`. Si esa clave no
estuviera donde se espera, **se para y se dice**, en vez de buscar una tercera
vía o pedir credenciales por chat.

### 3. Las variables nuevas **no** pasan por `config/env.ts`

`config/env.ts` valida con zod y lanza al importarse; si las cuatro variables se
declararan ahí, se leerían también en el build de producción y sus valores
quedarían inlineados en el paquete. Además, hacerlas obligatorias rompería el
arranque de cualquiera que no las tenga, y opcionales no aportan validación
ninguna.

Se leen en `guest.helpers.ts`, dentro de una función que empieza comprobando
`import.meta.env.DEV`, y **siempre como accesos de miembro**
(`import.meta.env.VITE_DEV_TUTOR_EMAIL`), nunca desestructurando
`import.meta.env`, que en el build se sustituye por el objeto completo.

Con `DEV` a `false` esa rama es código muerto y el minificador la elimina, pero
**eso se comprueba, no se confía**: `npm run build` y después `grep` sobre
`dist/` buscando el correo y la contraseña reales. Si aparecen, el diseño está
mal y hay que mover la lectura a un módulo aparte importado de forma dinámica.

### 4. El repliegue a la marca de invitado se conserva

`getDevCredentials(role)` devuelve `null` si falta cualquiera de las dos
variables de ese rol. En ese caso `handleGuestEntry` hace lo de hoy: marca local
y navegar. Sin esto, quien clone el repositorio y copie `.env.example` se
quedaría sin poder entrar, que es el único acceso que existe hasta el paso 12.

La consecuencia es que **hay dos caminos vivos** y conviene poder distinguirlos
de un vistazo: con credenciales, el panel muestra el nombre real de la cuenta;
sin ellas, el `FALLBACK_STUDENT_NAME` de siempre.

### 5. El rol lo decide el perfil, no el botón

`handleGuestEntry(role)` navega hoy a `getHomeRouteForRole(role)` con el rol del
botón. Con sesión real eso puede mentir: si la cuenta de tutor quedó con
`role = 'child'`, navegaríamos al panel de tutor y `PrivateRoute` rebotaría al
de niño, con un parpadeo raro y sin explicación.

Después de autenticar se navega con el rol **del perfil cargado**. Así el
desajuste se ve en vez de disimularse — y es exactamente el desajuste que la
decisión 1 advierte que puede ocurrir.

### 6. Un fallo de autenticación no cae en la sesión de invitado

Si hay credenciales y el `signIn` falla, **no** se recurre a la marca local: se
queda en la landing y se muestra el error. Caer al invitado dejaría la
aplicación aparentando funcionar mientras `auth.uid()` sigue vacío, que es
precisamente el estado que este paso viene a eliminar. El error de
`AuthProvider` ya está en el contexto (`error`), así que hay dónde leerlo.

### 7. Qué se verifica de las políticas del paso 9, y cómo

Con el `access_token` de cada sesión, contra la API REST. Las cuatro afirmaciones
que el paso 9 dejó sin probar, más las que las sostienen:

| Comprobación | Esperado |
| --- | --- |
| El tutor crea un salón | 201 — y prueba de paso que la política exige rol `tutor` |
| El niño intenta crear un salón | 403 |
| El niño pide entrar; el tutor ve la solicitud | El tutor la ve; otro niño no |
| El niño intenta insertarse una pertenencia | 403, no hay política de inserción |
| El tutor acepta con la RPC | 200 y pertenencia creada con `joined_at` |
| El niño intenta pedir entrar a otro salón siendo miembro | Rechazado |
| El tutor rechaza una solicitud y el niño intenta borrarla | Rechazado; el rechazo sobrevive |
| El tutor pone `capacity` a 1 y acepta a un segundo niño | Rechazado por cupo |

Lo que **no** se podrá cerrar con dos cuentas: el cupo sólo se prueba con un
salón de capacidad 1, y la carrera del `for update` no se reproduce a mano. Se
anota como lo que es —una comprobación funcional, no de concurrencia— en vez de
declarar «verificado» algo que no se ha visto.

**Los datos que deje la verificación se borran al terminar.** Las cuentas quedan
limpias para el paso 10, y el borrado es en sí la última comprobación: el tutor
puede borrar su salón y con él caen sus solicitudes.

### 8. Salir tiene que cerrar la sesión, y hoy dos de los cuatro botones no lo hacen

Este cambio **rompe el botón «Salir»** de las dos barras laterales si no se toca.
`handleTemporaryLogout` en `Sidebar.tsx` y `handleLogout` en `TeacherSidebar.tsx`
llaman sólo a `endGuestSession()` y navegan a la landing. Hoy eso basta porque la
marca de invitado es la única sesión que existe. En cuanto el acceso autentique
de verdad, borrar la marca deja **viva la sesión de Supabase**: se vuelve al
panel escribiendo la URL y `PrivateRoute` deja pasar, porque
`isAuthenticated(session)` sigue siendo cierto.

No hay que inventar el arreglo: el patrón correcto ya está en el repositorio.
`StudentSettingsModule` y `TeacherSettingsModule` llaman a `signOut()` además de
`endGuestSession()`. Se aplica el mismo a las dos barras.

Y hay que corregir el comentario de esas dos pantallas, que dice que sin sesión
de Supabase conectada `signOut` es «inofensivo» y deja el flujo listo para el
login real. **El porqué se invierte**: a partir de aquí `signOut` es lo único que
hace efecto, y `endGuestSession` es lo que queda como residuo del atajo hasta el
paso 24. Un comentario que explica una razón que ya no existe es peor que no
tener comentario.

## Risks / Trade-offs

**El panel de Supabase puede no ofrecer «Auto Confirm User»** si su interfaz
cambió. → El sustituto es la segunda fila de la tabla de la decisión 1:
desactivar la confirmación, crear las cuentas y volver a activarla. Queda
escrito para no tener que redescubrirlo.

**Las credenciales acaban en el `.env` de una máquina de desarrollo en claro.**
→ Son cuentas de prueba de un proyecto de grado, sin datos reales de menores. No
se reutilizan contraseñas de nada más, y el archivo está en `.gitignore`.

**El repliegue puede enmascarar un `.env` mal escrito.** Si alguien se equivoca
en el nombre de una variable, la aplicación entra como invitado y todo *parece*
ir bien hasta que una escritura falla. → El aviso está en la decisión 4: el
nombre que muestra el panel dice por qué camino se entró.

**`handleGuestEntry` pasa de síncrono a asíncrono.** Dos clics seguidos podrían
lanzar dos `signIn`. → El botón se deshabilita mientras la petición está en
curso, con el `loading` que el contexto ya expone.

**Los 54 tests no cubren nada de esto.** No hay tests de autenticación en el
proyecto y este cambio no los añade: la verificación es manual y por HTTP, y
queda escrita. → Se asume, y se dice en vez de dar a entender que la red de
pruebas cubre el cambio.

## Migration Plan

1. Ampliar `.env.example` y `guest.helpers.ts`, y reescribir `handleGuestEntry`.
2. **Pausa.** El usuario crea las dos cuentas, ejecuta la sentencia del rol y
   rellena su `.env`. Se le entregan los pasos y la sentencia exactos.
3. Verificar el `profiles.role` real de cada cuenta. Si el tutor no es `tutor`,
   parar ahí.
4. Verificar las políticas de la decisión 7 y limpiar los datos de prueba.
5. `lint`, `test:run`, `build` y el `grep` sobre `dist/`.

**Vuelta atrás.** Borrar las cuatro variables del `.env`: la aplicación vuelve
sola al camino de invitado, sin tocar código. En el repositorio, revertir dos
archivos.

## Open Questions

Ninguna. Las cuatro dudas que traía el encargo —método de creación,
confirmación por correo, dónde viven las credenciales y cómo evitar que lleguen
a producción— quedan resueltas en las decisiones 1, 2 y 3, y la de la
confirmación está además **medida** contra el proyecto real, no supuesta.
