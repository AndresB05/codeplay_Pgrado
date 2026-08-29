## Context

Ver `proposal.md` §Why. Lo que hace falta saber para entender el enfoque:

- **El disparador se reemplaza, nunca se edita en su sitio.** `handle_new_user_profile()`
  se ha reescrito entero tres veces —`202606030007`, `202606030010` y
  `202606030018`— y cada vez desde una migración nueva. La 0018 dejó escrito el
  motivo: tocar una migración ya aplicada deja el repositorio describiendo un
  esquema que ninguna base ha tenido.
- **La traducción por código ya tiene precedente en el repo.** Desde el paso 10,
  `classrooms.service.ts` mantiene `ERROR_MESSAGES` —un `Record<string, string>`
  indexado por `SQLSTATE`— y un helper `classroomError()` que construye el
  `AppError` a mano en lugar de pasar por `createAppError`. El error original
  viaja como `cause`.
- **`createAppError` es genérico**: lo usan **siete** servicios —`achievements`,
  `attempts`, `auth`, `leaderboard`, `profile`, `progress` y `worlds`—.
  `classrooms.service.ts` **no** está entre ellos: tiene el suyo, que es
  precisamente el precedente que se copia aquí. Su rama de `AuthError` fija el
  `code` a `String(error.status ?? fallbackCode)`, así que hoy el código de un
  error de autenticación es `"400"`, no `invalid_credentials`.
- **`User.xp` y `ClassroomStudent.xp` ya existen y ya se leen** —
  `profile.service.ts:51` desde `profiles.total_xp`, `classrooms.service.ts:132`
  desde la vista del roster—. Hoy valen `0` para todo el mundo porque nada
  escribe progreso, y ese `0` se pinta tal cual en Ajustes.
- **`XPBar` es la única barra de XP del proyecto** y vive en `components/ui/`.
  Sólo la monta `WelcomeBanner`, que no monta nadie. `docs/ROADMAP.md` §3.2 la
  exceptúa de la regla «los huérfanos se rehacen» **por estructura, no por
  paleta**: usa `text-neutral-light`, `bg-neutral-dark` y
  `from-secondary to-secondary-light`, que son los nombres anteriores al
  rediseño.

## Goals / Non-Goals

**Goals:**

- Que el alta no se caiga nunca por el nombre de usuario derivado, sin relajar el
  formato de la columna.
- Que ningún texto en inglés del servidor de autenticación llegue a una pantalla.
- Que el panel del niño muestre lo que hay, no lo que quedaría bonito.
- Que el XP tenga cuatro superficies, con una barra que encaje en el tema selva.

**Non-Goals:**

- **No se toca `createAppError`.** Traducir dentro del helper genérico cambiaría
  el comportamiento de los siete servicios que lo usan, y seis de ellos hablan
  con PostgREST, no con la capa de autenticación. El alcance es
  `auth.service.ts`.
- **No se traduce `profile.service.ts`.** Sus fallos llegan igual de crudos, pero
  no son los que ve el niño al no poder entrar, y ampliar el alcance aquí
  mezclaría dos superficies distintas. Queda anotado como cabo suelto.
- No se calcula XP, racha ni progreso: pasos 21 y 22.
- No se ajusta el responsive de la tabla al ganar una columna: paso 25.

## Decisions

### 1. La migración acota la longitud tras normalizar, y sólo eso

`202606030019` recrea `handle_new_user_profile()` con el cuerpo de la 0018
intacto salvo la derivación del nombre. El `nullif(..., '')` que hoy sólo
descarta la cadena vacía pasa a descartar además todo lo que no mida entre 3 y 30
caracteres, **después** de bajar a minúsculas y quitar los caracteres inválidos:
el orden importa, porque `a.b@x.com` normaliza a `ab`, que son 2.

Se usa la misma expresión regular del `check` de la `202606030002` en lugar de
contar caracteres a mano, para que las dos condiciones no puedan divergir.

*Alternativa descartada:* truncar a 30 y rellenar los cortos. Inventaría un
nombre de usuario que la persona no eligió y que además podría chocar con otro,
volviendo a meter el fallo por la puerta del duplicado. `null` es lo que la
propia función ya hace en ese caso.

*Alternativa descartada:* relajar el `check` a `{1,}`. El formato es del dominio
—lo consumirá cualquier pantalla de perfil futura— y quien tiene que ceder es
quien lo deriva. Lo dice el cabo suelto de `ROADMAP.md` §3 tal cual.

**Coste de revertir:** una migración más que reponga el cuerpo anterior. No hay
cambio de forma en ninguna tabla, así que no hay dato que migrar ni recuperar.

### 2. La traducción vive en `auth.service.ts`, indexada por `error.code`

Un `AUTH_ERROR_MESSAGES: Record<string, string>` y un helper `authError()`,
calcados de `ERROR_MESSAGES` y `classroomError()`. Se indexa por el `code` que
trae el `AuthError` de Supabase —`invalid_credentials`, `email_not_confirmed`,
`over_email_send_rate_limit`, `weak_password`, `same_password`,
`user_already_exists`, `validation_failed`—, **no por `status`**, porque el 400
lo comparten motivos que no se parecen en nada.

La cadena de fallo se conserva: código no contemplado → mensaje genérico en
español de esa operación, con el error original en `cause`.

`user_already_exists` **no se duplica**: `signUp` ya lo trata antes de llegar al
helper (línea 248) y su `AppError` lleva el código `ACCOUNT_ALREADY_EXISTS`, que
`AuthProvider` compara para decidir el salto a `/login`. Esa rama se queda como
está.

*Riesgo comprobado, no supuesto:* al dejar de pasar por `createAppError`, el
`code` de los errores de autenticación deja de ser `String(error.status)`. Las
tres comparaciones de `AuthProvider` —`:66` `PROFILE_NOT_FOUND`, `:180`
`ACCOUNT_ALREADY_EXISTS`, `:298` `PROFILE_ROLE_LOCKED`— comparan contra códigos
que **fijan los servicios a mano**, ninguno derivado de `status`, así que ninguna
se rompe. Se comprueba de todas formas en pantalla, no leyendo.

*Alternativa descartada:* traducir en `createAppError`. Es el helper de los otros
seis servicios además de éste; un mapa de códigos de autenticación dentro le daría
a `worlds.service.ts` un vecino que no le corresponde, y los `SQLSTATE` de
PostgREST y los códigos de GoTrue conviven en el mismo espacio de nombres.

**Las ocho llamadas se sustituyen, no seis.** Además de `signIn`, `signUp`,
`signOut`, `getSession`, `requestPasswordReset` y `applyNewPassword`, están las
**dos** de `signInWithGoogle`: la del fallo del proveedor (línea 192) y la de la
URL de redirección ausente (línea 203). Las líneas son 64, 124, 148, 168, 192,
203, 220 y 261.

### 3. Cada dato inventado se arregla como pide su ausencia

No es el mismo arreglo para los tres, y ésa es la decisión:

| Dato | Arreglo | Por qué |
| --- | --- | --- |
| Racha | `?? 0` | `0` es un valor legítimo, y con `\|\|` cae siempre en el 42 |
| Nombre | `\|\| FALLBACK_STUDENT_NAME` | `full_name` puede llegar **vacío**, y `''` debe replegarse |
| Correo | ninguno | No hay correo genérico que no sea mentira |

`FALLBACK_STUDENT_NAME` («Explorador») ya existe en `classrooms.service.ts`, hoy
privado. Se **exporta y se reutiliza**, en lugar de escribir un segundo literal:
la tabla del salón y la barra lateral del mismo niño enseñarían dos tratamientos
distintos para la misma persona. Se declara una vez y se importa; no se copia.

`SidebarPlayerCard.tsx:24` y `WelcomeBanner.tsx:33` **no se tocan**. Su `|| 0`
también es la versión correcta, y son huérfanos que se rehacen, no se adaptan.

### 4. `XPBar` se retinta antes de montarla, y el máximo se declara una vez

Retintado, con los nombres del tema y sin hexadecimales sueltos:

| Hoy | Pasa a |
| --- | --- |
| `text-neutral-light` | `text-ink-soft` |
| `bg-neutral-dark` | `bg-jungle-soft` con `border-2 border-ink` |
| `from-secondary to-secondary-light` | `from-jungle-light to-jungle` |

Se elige la familia `jungle` y no `sun` porque **el XP ya es verde en la única
pantalla donde hoy se ve**: el chip de XP de Ajustes usa `chip-leaf`, que es
`jungle-soft`/`jungle-dark`. El amarillo es de la racha, y las dos cosas van
juntas en tres de las cuatro ubicaciones nuevas; darles el mismo color las
volvería indistinguibles.

El máximo va en `constants/progress.ts` como `PROVISIONAL_MAX_XP = 1000`, con el
comentario que dice que lo fija el paso 22. **El valor se fija aquí, no al
implementar**: el único precedente del repo es el `maxXP={1000}` de
`WelcomeBanner`, y se respeta para no estrenar un tercer número. **Un solo
sitio**: cuatro literales `1000` repartidos por el panel y la tabla serían cuatro
sitios donde olvidarse al cambiarlo.
`XPBar` sigue recibiendo `maxXP` por prop —es una primitiva y no debe conocer la
constante—, y quien la monta la pasa.

### 5. La columna de XP cambia de sitio según quién mira, a propósito

`StudentRosterTable` es un solo componente con dos montajes: el niño lo monta sin
`onRemoveStudent` y el tutor con él. Las dos ramas de `gridColumns` ganan una
pista, en distinta posición:

| Vista | Hoy | Pasa a |
| --- | --- | --- |
| Niño | `[1.35fr_1fr_1fr_0.7fr]` | `[1.35fr_1fr_1fr_0.8fr_0.7fr]` |
| Tutor | `[1.35fr_1fr_1fr_0.7fr_1.2fr]` | `[1.35fr_1fr_1fr_0.7fr_0.8fr_1.2fr]` |

Como es una rejilla, el orden de las celdas en el marcado es el orden en pantalla:
la celda de XP se emite en un punto u otro según la misma condición que ya decide
la columna de acciones. **No se unifican las dos posiciones**: lo pidió el
usuario así.

Este requisito vive en el delta de **`salones-tutor`**, no en el de
`contenido-mundos`, y por eso el XP son dos requisitos y no uno. `CONTEXT.md`
§2.3 ya sitúa `shared/StudentRosterTable.tsx` ahí, con la regla de que la vista
del alumno lo reutiliza sin la columna de acciones; y el `Purpose` de
`contenido-mundos` —«Presentar **al niño** el contenido educativo»— no admite un
escenario cuyo actor es el tutor.

La barra de la tabla va con `showLabel={false}`, que la prop ya contempla: en el
ancho de una columna no cabe «0 / 1000 XP».

## Risks / Trade-offs

- **La migración necesita un `db push` que sólo puede lanzar el usuario** →
  las tareas de verificación quedan detrás de ese paso y se marcan como
  bloqueadas hasta que ocurra. No se da por aplicada leyendo el `.sql`.
- **Un `.sql` que se aplica sin que nadie lo haya leído es irreversible en la
  práctica** → la parada del paso 2 del plan es bloqueante, no una cortesía: una
  vez en la base, deshacerlo cuesta otra migración. La 0019 no toca ninguna
  política de RLS, así que la trampa direccional de la comprobación 5 no aplica
  aquí; lo que se revisa es que el cuerpo sea el de la 0018 salvo la derivación
  del nombre.
- **Las tres altas de prueba dejan cuentas reales en el proyecto de Supabase** →
  se borran al terminar. Borrar un usuario de `auth.users` **exige la clave de
  servicio o el panel**, y en `apps/web/.env` sólo está la anónima, así que ese
  borrado lo hace el usuario y la tarea lo dice.
- **La tercera alta —la de un correo normal— es la que importa** → sin ella, la
  migración podría dejar `null` en todos los casos y las dos primeras
  comprobaciones seguirían pasando. Verifica que no se rompió lo que funcionaba.
- **La tabla gana una columna y a 375 px ya cae a 73 px de ancho** → medido en
  `docs/CONTEXT.md` §4.4 y anotado para el paso 25. Empeora; no se arregla aquí,
  porque el responsive del panel entero es un paso propio.
- **Provocar cada error de autenticación desde la pantalla, no razonarlo** → un
  código mal escrito en el mapa no lo detecta ningún test: el mapa y el test
  dirían la misma mentira. Cada rama traducida se dispara desde la interfaz con
  las cuentas de `apps/web/.env`.

  **Pero eso no cubre la fontanería, y ahí sí hay dos tests con dientes**, que no
  repiten el mapa:

  1. Que un `AuthError` con mensaje en inglés **no acabe en `AppError.message`**.
     Comprueba el cableado —que la traducción se aplica y que el texto crudo se
     queda en la causa—, no qué dice cada entrada del mapa.
  2. Que la racha use `?? 0` y no `|| 0`. Es exactamente el fallo que vivió meses
     sin que nadie lo viera: con la racha real a `0`, el `||` cae **siempre** en
     el valor de relleno, y las dos versiones se ven idénticas en cualquier
     cuenta que sí tenga racha.
- **`profile.service.ts` sigue devolviendo inglés** → queda anotado como cabo
  suelto en `docs/ROADMAP.md` §3, no cerrado en silencio.

## Migration Plan

1. Escribir `202606030019_bound_generated_username.sql`.
2. **PARAR Y AVISAR.** Escrito el `.sql` y antes de que se aplique nada, la
   sesión que ejecuta se detiene y avisa; la sesión que revisa **lee la
   migración**, y sin ese visto bueno no se sigue. Es la comprobación 9 de
   `docs/ROADMAP.md` §1.3 —«el SQL de una migración se lee ANTES de que el
   usuario lance el `db push`, no después»—, y es el control que el paso 9 se
   saltó dos veces: las dos revisiones miraron el grafo de RLS en la misma
   dirección y la recursión llegó a la base.
3. El **usuario** lanza `npx supabase db push`, y se **lee la salida**: tiene que
   aplicar la 0019 y ninguna más. Si arrastrara otras, hay migraciones sin
   aplicar en la base y eso se mira antes de seguir.
4. Comprobar si `gen types` cambia algo: `handle_new_user_profile` es un
   disparador y no aparece en `Database['public']['Functions']`, así que lo
   esperable es que no. Si cambiara, lo regenera el usuario —`gen types` también
   pide credenciales— y **nunca se edita `database.types.ts` a mano**.
5. Tres altas por `curl` contra `/auth/v1/signup`: local-part de 2 caracteres,
   local-part de más de 30, y una normal. Las dos primeras deben crear la cuenta
   con `username` nulo; la tercera, con el nombre asignado.
6. El **usuario** borra las tres cuentas desde el panel de Supabase.

**Rollback:** una migración `202606030020` que reponga el cuerpo de la 0018. No
hay dato que revertir.
