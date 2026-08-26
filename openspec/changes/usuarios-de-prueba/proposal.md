## Why

El paso 9 dejó la base de datos llena de políticas que **nadie ha visto funcionar**.
Se comprobó que las cuatro tablas de salones existen y que una clave anónima no
lee ninguna, y ahí se acabó la verificación: que el tutor vea sólo sus salones,
que un niño no pueda inscribirse a sí mismo, que un rechazo sea inmutable y que
el cupo se respete al aceptar siguen siendo **código revisado, no comportamiento
observado**. Está anotado como deuda en `docs/CONTEXT.md` §2.7 y en los cabos
sueltos del ROADMAP.

Lo que falta para cerrarla es una identidad. Todas esas políticas preguntan por
`auth.uid()`, y hoy la aplicación responde `guest-child`: una cadena en
`localStorage` que no existe en `auth.users`. Sin cuentas reales no hay `uid` que
comparar, así que ninguna escritura de salones puede probarse.

Por eso este paso **se adelanta al 10**, según la decisión anotada en el ROADMAP
§2.1. Hacer primero el 10 significaría reescribir `ClassroomsProvider` entero
—el corazón de la aplicación— contra un backend cuyas reglas no se han visto
funcionar ni una vez, y descubrir los fallos todos juntos y ya mezclados con el
refactor.

## What Changes

- **Dos cuentas de prueba en Supabase Auth**, una con rol `tutor` y otra con rol
  `child`. **Las crea el usuario**, no esta sesión: crear cuentas y manejar
  contraseñas queda fuera de lo que hago. Se le entregan los pasos exactos.
- **El botón «Sin login» pasa a iniciar sesión de verdad.** Hoy
  `startGuestSession()` escribe dos claves en `localStorage`; pasará a llamar a
  `signIn()` del contexto de autenticación con las credenciales de la cuenta que
  corresponda al botón pulsado. La sesión resultante es una sesión de Supabase
  con su `access_token`, y `auth.uid()` deja de estar vacío.
- **Las credenciales viven en `apps/web/.env`**, que está en `.gitignore`. En
  `.env.example` sólo aparecen los nombres de las variables, nunca un valor.
- **El acceso de prueba queda tras `import.meta.env.DEV`**, como la sesión de
  invitado actual, y **no pasa por `config/env.ts`**: ese módulo valida y lanza
  al importarse, y sus variables acaban en el bundle de producción. Las nuevas
  son opcionales y se leen desde un módulo que sólo existe en desarrollo.
- **Se verifican las políticas del paso 9 con sesión real.** No es un añadido:
  es la razón de adelantar este paso. Con el tutor y el niño autenticados se
  comprueba por HTTP que cada política hace lo que dice, incluidos los casos
  negativos —el niño que intenta inscribirse solo, el rechazo que intenta
  borrar—, y el resultado se escribe en `docs/CONTEXT.md` §2.7 y en el cabo
  suelto del ROADMAP.
- **La sesión de invitado no se retira** (eso es el paso 24). Sigue existiendo
  como repliegue si las credenciales de prueba no están configuradas: quien
  clone el repositorio sin `.env` completo tiene que poder seguir entrando.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `auth-sesion`: cambia el comportamiento observable del acceso sin login. Hoy
  el requisito «La sesión de invitado sólo existe en desarrollo» describe un
  atajo que escribe una marca en el navegador; pasa a describir un acceso que
  autentica de verdad contra Supabase cuando hay credenciales de prueba, y que
  cae en la marca local sólo cuando no las hay. Se añade además el requisito de
  que esas credenciales no lleguen a producción.

`backend-supabase` **no se toca**: las políticas que este cambio verifica ya
están especificadas desde el paso 9. Verificarlas no cambia lo que el sistema
debe hacer, así que no hay delta que escribir — lo que cambia es lo que sabemos,
y eso va a `docs/CONTEXT.md`, no al spec.

## Impact

**Configuración**

| Archivo | Cambio |
| --- | --- |
| `apps/web/.env` | **El usuario añade** cuatro variables: correo y contraseña de cada cuenta. No está en el repositorio |
| `apps/web/.env.example` | Los cuatro nombres, con valor vacío y un comentario de que son opcionales y sólo de desarrollo |

**Código**

| Archivo | Cambio |
| --- | --- |
| `apps/web/src/context/guest.helpers.ts` | Añadir la lectura de las credenciales de prueba, gobernada por `import.meta.env.DEV` |
| `apps/web/src/components/home/Navbar.tsx` | `handleGuestEntry` pasa a autenticar; hoy sólo escribe la marca y navega |
| `apps/web/src/config/env.ts` | **No se toca.** Añadir ahí las variables nuevas las metería en el bundle de producción |

`context/AuthProvider.tsx` ya expone `signIn()` y sincroniza el perfil después
de autenticar, así que **no hay que tocarlo**. `hooks/useActiveRole.ts` ya
prioriza `user?.role` sobre el rol de invitado, y `router/PrivateRoute.tsx` ya
acepta una sesión real vía `isAuthenticated(session)`: ninguno de los tres
cambia.

**Fuera de alcance**

`ClassroomsProvider`, el store y `CURRENT_STUDENT_ID` son el paso 10. Las
pantallas de `Login` y `Signup` son el paso 12. Retirar la sesión de invitado es
el paso 24. Este cambio no toca ninguna de las tres cosas.

**Tests**

Los 54 tests no tocan autenticación y deben seguir pasando **sin modificarlos**.
Si alguno falla, es una señal.

**Documentación**

- `docs/CONTEXT.md`: §2.7 pierde el párrafo que dice que ninguna política está
  verificada, y gana lo que quede probado —y lo que no—. §2.2 (`auth-sesion`)
  recoge el acceso de prueba.
- `docs/ROADMAP.md`: paso 11 a ✅ y el cabo suelto de las políticas sin probar,
  actualizado o retirado según el resultado.
- `openspec/config.yaml`: el bloque `context` afirma que «no hay login real, se
  entra con una sesión de invitado». Deja de ser exacto.

**Dependencia de Supabase.** El proyecto está enlazado y con el esquema
aplicado. Este cambio **no necesita ningún `db push`**: no hay migración. Lo que
sí necesita son dos acciones del usuario en el panel de Supabase —crear las
cuentas y ejecutar una sentencia SQL— porque crear cuentas y manejar contraseñas
no es algo que esta sesión haga.
