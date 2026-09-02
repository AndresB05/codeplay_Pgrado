## Context

Ver `proposal.md` — Why. Lo que sigue es sólo el estado del repositorio que
condiciona el cómo.

**La tabla ya está, y con ella el problema.** `public.invitations` existe desde la
migración `202606030013` y la `0016` le quitó el correo. Lo que queda es
exactamente lo que hace falta: `group_id`, `invited_by`, `token` con
`default encode(extensions.gen_random_bytes(24), 'hex')`, `status` con
`check (status in ('pending','accepted','expired'))`, `expires_at` con
`default now() + 14 days`, `sent_at` y `accepted_at`. **Ninguna fila se ha escrito
nunca.**

**Sus permisos son tres muros, y son los que deciden el diseño entero.** La 0013
le dio a `invitations` tres políticas —`select`, `insert` y `delete`— y **las tres
son del tutor del salón**, más el grant `select, insert, delete` **sin `update`**.
De ahí salen tres hechos que no se negocian:

1. Quien tiene el token **no puede leer su propia fila**: la política de lectura
   pregunta por `class_groups.tutor_id = auth.uid()`.
2. **Nadie** —tutor incluido— puede marcarla aceptada desde el cliente: no hay
   grant de `update` sobre esa tabla para ninguna sesión.
3. El niño tampoco puede insertarse en `class_memberships`: esa tabla no tiene
   política de inserción, y no la va a tener.

**El modelo del canje ya está escrito**, y es `accept_join_request` de la 0013: la
única RPC del módulo de salones, con el `for update` sobre el salón **antes** de
contar, el cupo, «un alumno, un salón» y la escritura de dos tablas sin estado
intermedio. Un canje es una aceptación a la que le sobra la solicitud.

**La trampa del token está identificada y ya tiene precedente.** El rol elegido en
`/signup` sobrevive el viaje a Google por `context/oauthRole.helpers.ts`, cuya
función de lectura **borra en la misma llamada** porque un `get` y un `clear`
separados dejan viva la intención para el viaje siguiente.

**Hoy no hay ni una línea de interfaz**: `AddStudentsPanel.tsx:98` es un párrafo
que dice que todavía no se envían correos.

## Goals / Non-Goals

**Goals:**

- Que el canje sea imposible de componer desde el cliente, y que eso se vea en el
  esquema y no sólo en el código de la aplicación.
- Que el token sobreviva el registro por contraseña **y** la vuelta por Google, y
  que no pueda alcanzar a la persona siguiente en el mismo navegador.
- Que la pertenencia que crea un canje la conozca el store de salones en el mismo
  instante, sin depender de que llegue un evento.
- Que la caducidad se cumpla el primer día, no cuando alguien se acuerde.

**Non-Goals:**

- **El envío por correo.** Fuera por dependencia de servicio, y su ausencia es lo
  que mantiene este cambio libre de la decisión de privacidad de §3.4.
- **Ninguna columna de correo, en ninguna tabla.** La 0016 la borró a propósito.
- **Invitar a varios de una vez** ni pegar una lista de destinatarios: para muchos
  ya está el ID público, que es el mismo para todo el curso.
- **Programar la purga en el servidor** (`pg_cron`): ver Riesgos.
- **Tocar `accept_join_request`.** Sigue igual; el canje es una función aparte que
  copia su forma, no una generalización de las dos.

## Decisions

### 1. Una RPC `security definer`, no Edge Functions

`CONTEXT.md:1371` dice de esta fila «probablemente con Supabase Edge Functions» y
le pone como dependencia «Envío de correo». **Las dos cosas son falsas y se
corrigen en este cambio.** Una Edge Function traería un runtime nuevo, un
despliegue aparte y una clave de servicio que hoy no existe en ninguna parte del
proyecto, para hacer lo que el proyecto ya hace tres veces:
`accept_join_request` (0013), `set_my_role` (0017/0018) y las RPC de perfil y
progreso (0006). Una función `security definer` **no expande políticas** —es lo
que la 0014 usó para romper la recursión— y corre dentro de la misma transacción
que las tablas que escribe, que es justo lo que un canje necesita.

**Alternativa descartada:** ampliar las políticas de `invitations` para que quien
tiene el token pueda leer su fila y marcarla. Eso convierte el token en una llave
de lectura sobre una tabla con RLS, obliga a conceder `update` a `authenticated`
y deja al cliente componiendo un canje en tres escrituras que se pueden
interrumpir por la mitad. Es exactamente el estado intermedio que
`accept_join_request` existe para no tener.

### 2. Dos funciones: `redeem_invitation` y `preview_invitation`

`redeem_invitation(input_token text) returns public.class_memberships` **copia la
forma de `accept_join_request`**, no se inspira en ella: mismo orden de
comprobaciones, mismo `for update` sobre `class_groups` **antes** del `count(*)`,
mismo rechazo por cupo y por pertenencia previa, mismo `returns` de la fila
creada.

**Las dos llevan `set search_path = public`, y no por copiar la forma.** Sin esa
línea, quien llama puede anteponer un esquema propio y hacer que `profiles`,
`class_groups`, `class_memberships` y `join_requests` resuelvan a **tablas
suyas** mientras el cuerpo corre con los privilegios del dueño de la función: la
comprobación de rol y la de pertenencia se esquivarían las dos, y el `insert` de
la pertenencia caería en una tabla real con las condiciones comprobadas contra
una falsa. Las **nueve** funciones `security definer` de las migraciones la
llevan, sin una sola excepción —`accept_join_request` incluida—, así que aquí va
escrita en la tarea y no confiada a que se arrastre al copiar el modelo.

`preview_invitation(input_token text)` es una función `stable` que devuelve a qué
salón invita el token y si sigue sirviendo, **sin consumirlo**. Existe porque sin
ella la pantalla del enlace no puede decir nada: el niño no puede leer la fila
(muro 1), así que tendría que pulsar «Entrar» a ciegas para descubrir que el
enlace caducó, y ese clic gasta un enlace de un solo uso. Se concede **sólo a
`authenticated`**: sin sesión, un salón no revela ni su nombre.

**Alternativa descartada:** una sola función que canjee y, si falla, explique.
Obliga a intentar el canje para saber si se puede, que es lo contrario de lo que
hace falta con un recurso de un solo uso.

### 3. Los motivos del rechazo, con el precedente `ZC0xx` de la 0018

La 0018 estrenó códigos `SQLSTATE` propios para lo que ningún código estándar
nombra —`ZC001` rol ya declarado, `ZC002` lazos de salón— y
`profile.service.ts` los traduce. Aquí hacen falta tres:

| Código | Caso | Por qué no vale uno estándar |
| --- | --- | --- |
| `ZC010` | El token no corresponde a ninguna invitación | `P0002` diría «no existe», pero se usa ya para la solicitud y el salón |
| `ZC011` | La invitación caducó | No hay código estándar para «pasó de fecha» |
| `ZC012` | La invitación ya se canjeó | `22023` diría «ya resuelta» sin distinguir de la caducada |

Los tres tienen que ser distinguibles porque la pantalla dice cuál de las tres
cosas pasó, y ésa es la diferencia entre «vuelve a pedirle el enlace a tu
profesor» y «ese enlace ya lo usó alguien».

Lo que sí reutiliza códigos estándar: `42501` sin sesión o rol distinto de
`child`, `23514` salón lleno y `23505` ya pertenece a un salón — **los mismos que
levanta `accept_join_request`**. Sus mensajes en `classrooms.service.ts` están
redactados para el tutor («Quita a algún explorador o amplía los cupos»), así que
el canje traduce con **su propio mapa**, en `invitations.service.ts`, con el texto
mirando al niño. Dos mapas y no uno: el código es el mismo, quien lee no.

### 4. El canje borra la solicitud pendiente. Ni la acepta, ni la rechaza

Nadie lo había decidido, y el esquema lo permitía: un niño con una solicitud viva
en el salón A que canjea un enlace del salón B quedaría **dentro de B con una
solicitud pendiente en A**, que es media violación de «un alumno, un salón» y
además deja al tutor de A una solicitud que ya no significa nada.

Tres salidas posibles, y por qué gana la tercera:

- **Rechazar el canje si hay solicitud pendiente.** Correcto pero cruel: el niño
  no sabe que su solicitud le bloquea el enlace que su profesor le acaba de pasar,
  y la salida —cancelar a mano— es exactamente lo que el sistema puede hacer por él.
- **Marcarla `accepted` o `rejected`.** Es escribir en el historial algo que no
  ocurrió: nadie la aceptó y nadie la rechazó. Y con `accepted` en el salón A
  quedaría además contradiciendo a la pertenencia, que está en B.
- **Borrarla.** Es **la cancelación que el niño podía hacer él mismo**: la política
  `join_requests_delete_own_pending` ya le permite borrar su pendiente, y el
  historial modela una cancelación precisamente como la ausencia de fila. El tutor
  de A ve desaparecer la solicitud igual que si el niño la hubiera cancelado, y se
  entera en vivo, porque `join_requests` está publicada desde la 0021.

Se borra **sólo lo pendiente** —el `where status = 'pending'` va escrito, no
implícito—, así que ninguna solicitud resuelta se toca. Y va **dentro de la misma
transacción** que crea la pertenencia: o pasan las dos cosas o no pasa ninguna.

### 5. La generación se queda como escritura por RLS, no como RPC

`CONTEXT.md` §2.7 dice que «los salones escriben por RLS, no por RPC», con
aceptar como única excepción. Generar una invitación **no necesita ser la
segunda**: es un `insert` de una fila cuya política ya comprueba lo único que hay
que comprobar —que el salón es del tutor— y cuyo `token` y `expires_at` los pone
la base por defecto. El tutor puede leerse el token de vuelta porque la política
de lectura es suya.

`invited_by` **se manda explícitamente**: como `join_requests.student_id` y
`class_memberships.student_id`, no tiene `default auth.uid()`, y omitirlo
responde `42501` —que se diagnostica mal, porque parece un problema de permisos y
es un `null`—. Está anotado como convención en `openspec/config.yaml`.

### 6. La pertenencia que crea un canje entra por el store de salones

**Ésta es la decisión que toca la frontera cara, así que va justificada.** El
módulo se parte en dos por **quién es el dueño del efecto**, no por qué tabla se
toca:

| Operación | Dónde vive | Por qué |
| --- | --- | --- |
| Canjear | `classrooms.service.ts` + acción `redeemInvitation` en `ClassroomsProvider` | Su efecto **es** la pertenencia, que es el estado que el store posee |
| Generar, listar, retirar y previsualizar | `invitations.service.ts` + `hooks/useInvitations.ts` | Una lista de enlaces del tutor no es pertenencia de nadie |

Si el canje viviera fuera del store, la pantalla del niño se quedaría con la
`membership` vieja hasta que llegara el evento de Realtime: funcionaría **casi
siempre**, y esa es la peor clase de funcionar. El store ya tiene la regla de que
cada escritura recarga (`runWrite`), y esto es una escritura suya.

Lo de fuera sigue el precedente del paso 16, donde `mission_assignments` se quedó
en su propio servicio y su propio hook **sin tocar `ClassroomsProvider`**. La
frontera aguanta las dos veces porque el criterio es el mismo.

Coste, y se dice: `ClassroomsService` gana un método, así que
`src/test/fakeClassroomsService.ts` gana su doble.

### 7. `/invite/:token` va SIN guarda, y es la segunda ruta así

`openspec/config.yaml` dice hoy que `/auth/callback` es «la única del proyecto
así». Deja de serlo, y por el mismo motivo exacto, que conviene no confundir con
una excepción cómoda: **una guarda sólo sabe que no hay sesión**. `PrivateRoute`
mandaría a `/login` a quien llega sin cuenta —que es el caso normal de un enlace
de invitación— y al hacerlo **se llevaría por delante el token**, que viaja en la
dirección y es lo único que esa persona traía. `PublicRoute` haría lo simétrico
con quien sí tiene sesión: apartarlo a su panel sin canjear nada.

La pantalla resuelve sola sus estados: sin sesión, con sesión de niño, con sesión
de tutor, enlace caducado, enlace usado, enlace inexistente. `PrivateRoute` y
`PublicRoute` **no se tocan**.

### 8. El token sobrevive el registro con el patrón de `oauthRole.helpers.ts`

`context/invitationToken.helpers.ts` copia ese archivo pieza por pieza, incluida
**la lección que lleva dentro**: `takePendingInvitationToken()` lee y borra en la
misma llamada, porque con un `get` y un `clear` separados cualquier camino que
devuelva antes del segundo deja la intención viva para el viaje siguiente. Con un
rol eso ascendía a alguien por error; **con un token de invitación metería al niño
siguiente del computador del aula en un salón ajeno**, que es peor.

Se guarda al salir de `/invite/:token` sin poder canjear, y se consume en dos
sitios, que son los dos finales de registro que existen:

- `hooks/useRoleHomeRedirect.ts` — cubre `/login` y `/signup` de una vez, porque
  es el único sitio del proyecto que decide el destino tras autenticarse. En vez
  de ir siempre a `getHomeRouteForRole(user.role)`, si hay token va a
  `/invite/<token>`. Se toca ese hook y no las dos pantallas justamente por la
  convención que ya existe: «no duplicar esa lógica en una pantalla nueva».
- `pages/AuthCallback/AuthCallback.tsx` — la vuelta de Google, **después** de
  resolver el rol. Antes sería fijar el rol de una cuenta que quizá no llegue a
  canjear; después, el niño ya tiene su rol declarado y el canje sabe si puede.

El token vuelve a viajar por la dirección, no por el estado de React: la vuelta de
Google es una carga de página nueva.

### 8bis. CORREGIDO AL VERIFICAR: quién decide el destino, y quién consume

Lo de arriba daba por bueno que `useRoleHomeRedirect` decide el destino, porque
es lo que dice `config.yaml`. **Es falso, y lo era desde antes de este cambio.**

Medido en el navegador: con un token guardado, entrar como niño aterrizaba en
`/dashboard/worlds` **con el token intacto**, prueba de que la lectura no llegó a
ejecutarse. Quien navega es `PublicRoute`, que devuelve `<Navigate>` **durante el
render**: cuando el perfil llega, no renderiza a su hijo, así que la pantalla que
monta el hook desaparece en ese mismo render y su efecto no corre nunca. Y afecta
a los cuatro consumidores del hook, no a tres: `ResetPassword` es el cuarto, y
como va tras `PrivateRoute`, ahí `PublicRoute` no interviene.

Había dos deciden-destinos desde siempre y nadie lo notó porque los dos
calculaban `getHomeRouteForRole`, la misma respuesta. Este cambio es lo primero
que los hace discrepar.

**Arreglo: `resolveLandingRoute(role)` en `context/auth.helpers.ts`, una
implementación y tres puntos de llamada** —`PublicRoute`, `AuthCallback` y
`useRoleHomeRedirect`—, de modo que gane quien gane la carrera el destino sea el
mismo. El hook la sigue llamando aunque casi siempre pierda, porque
`/reset-password` es suyo y sólo suyo.

**Y una segunda corrección encima de la primera: la función es PURA.** El primer
intento la hacía consumir el token, y el test lo tumbó: `PublicRoute` decide
durante el render, que StrictMode invoca **dos veces**, así que la primera pasada
gastaba el token y la segunda ya no lo encontraba —el token se consumía Y la
persona acababa en su panel—. Aislado: sin StrictMode los cuatro casos pasan; con
StrictMode fallan tres.

Consumir es una escritura, y no se arregla con cuidado sino moviéndola:

| | Quién | Qué |
| --- | --- | --- |
| `peekPendingInvitationToken()` | `resolveLandingRoute` | mira, **no borra**. Pura, segura en render |
| `takePendingInvitationToken()` | **sólo `pages/Invite`** | lee y borra |

**Consume quien llega, no quien decide.** `Invite` puede ser el dueño único
porque es **el único destino al que este token lleva**: sin sesión guarda —el
rodeo empieza—, con sesión borra —el rodeo terminó, y el token sigue vivo en la
dirección, así que no se pierde nada—. El borrado es **incondicional**, no «si
coincide con el de la URL»: quien llega puede arrastrar el token de un rodeo
abandonado y abrir otro enlace, y el condicional dejaría vivo el viejo.

Esto **no reabre** lo que §8 prohíbe. Allí el peligro es repartir el `get` y el
`clear` entre caminos que pueden volver antes del segundo; aquí el borrado tiene
un dueño único que además es el único destino posible, así que no hay camino que
se lo salte. Los nombres lo imponen, no un comentario: el sitio de llamada dice
cuál de las dos lecturas es.

Fijado en `router/PublicRoute.test.tsx` —la guarda redirige sin montar la
pantalla del hook, y **no** consume— y en `pages/Invite/Invite.test.tsx`, cuyo
tercer caso, el del token viejo, es el único que caza un borrado condicional.

### 9. Los tres estados del enlace se calculan, no se leen de `status`

**El aviso está vivo en `ROADMAP.md` §3 desde `invitaciones-sin-correo`:** el
panel anterior pintaba `status === 'pending' ? 'Pendiente' : 'Aceptada'`, y una
invitación caducada se habría enseñado como «Aceptada». Estaba dormido porque
nada escribía filas.

`status` tiene tres valores en el `check` de la 0013, pero **nada marca `expired`
y nada va a marcarlo**: no hay grant de `update`, y `redeem_invitation` sólo
escribe `accepted`. Así que el estado que ve el tutor sale de **dos** datos:

```
usado     ← status = 'accepted'
caducado  ← status <> 'accepted' y expires_at <= ahora
activo    ← el resto
```

Y `redeem_invitation` decide lo mismo por su cuenta, con la misma comparación de
fechas: la caducidad la impone la **fecha**, no la columna.

### 10. La purga la hace el tutor al mirar, con la política que ya existe

El plazo de conservación de `CONTEXT.md` §2.7 dice que las invitaciones se purgan
a los 14 días, y lo llama «una obligación que hereda el paso 19». Se cumple sin
maquinaria nueva: al listar los enlaces de sus salones, el panel **borra primero
las caducadas**, con un `delete` que la política `invitations_delete_own_groups`
y el grant de `delete` de la 0013 ya permiten.

No hace falta ni función ni permiso nuevo. Lo que **no** garantiza está en Riesgos.

## Risks / Trade-offs

**[La purga depende de que el tutor entre a mirar]** → Un salón cuyo tutor no
vuelve conserva sus filas caducadas. **No es un riesgo de seguridad**: el enlace
está muerto por `expires_at`, y eso lo comprueba `redeem_invitation`, no el
borrado. Tampoco es un riesgo de privacidad: desde la 0016 la fila no contiene el
dato de ningún tercero —es un token, un salón y dos fechas—. Lo que queda es una
tabla que crece. La salida cuando importe es `pg_cron`, que exige activarlo en el
panel de Supabase y por tanto **al usuario**: se anota para el paso 27, junto con
lo demás que sólo tiene sentido desplegado.

**[`expires_at` no lo acota nada, y se puede alargar tanto como acortar]** →
Descubierto al verificar: la tabla no tiene ningún `check` sobre esa columna y
`invitations_insert_own_groups` sólo comprueba `invited_by` y la propiedad del
salón, así que quien inserta elige la fecha. **Los 14 días no los sostiene el
esquema**: los sostienen el `default` de la columna y que el cliente no mande el
campo. Se usó a propósito para sembrar el `ZC011` y el fixture de la purga.
**No es simétrico con acortar**, y por eso se anota en vez de darlo por menor: un
enlace con la fecha lejos **no caduca y la purga no lo alcanza nunca** —se apoya
en esa misma fecha—, así que vuelve la fila que nada borra, que es justo lo que
`invitaciones-sin-correo` vino a quitar; y si se filtra, no deja de servir.
Mitigación hoy: sólo el tutor del salón puede insertar, y sólo en el suyo, así
que el daño se lo hace a sí mismo. **No se migra en este cambio** —el alcance
está donde debe—, pero el spec dice explícitamente que el plazo no es una
propiedad del sistema, para que quien llegue al paso 14 o a la mitad B del 19 no
crea que hay barrera donde no la hay. Ponerla sería acotar la columna.

**[Un enlace reenviado mete a quien no era]** → Es la naturaleza de un enlace
canjeable, no un defecto. Se acota con lo que ya trae el modelo: **un solo uso**,
así que un enlace filtrado alcanza a una persona y no a un grupo; **14 días**; y
el tutor **puede retirarlo** mientras nadie lo haya usado, y ve en su lista si se
usó. Lo que el enlace no puede saber es quién está al otro lado — para eso está el
ID público, que sí pasa por la bandeja y sigue siendo la vía por defecto.

**[Alguien se registra como tutor y luego abre el enlace]** → La RPC lo rechaza
por rol, y el rol **no se puede cambiar** desde la 0018. Esa persona se queda con
una cuenta que no puede canjear. Es correcto —el rol se fija en el primer registro
y no cambia nunca— pero la pantalla tiene que decirlo con todas las letras, no
enseñar «no tienes permiso»: es un escenario de la spec.

**[Dos canjes simultáneos sobre el último cupo]** → Lo cierra el `for update`
copiado de `accept_join_request`. **Y sigue sin poder reproducirse a mano**,
exactamente igual que la carrera de la aceptación, que `CONTEXT.md` §2.7 declara
comprobada funcionalmente y no bajo concurrencia. Se hereda esa limitación tal
cual; no se va a afirmar que está medida.

**[El `returning` del `insert` depende de la política de lectura]** → **RESUELTO,
medido contra la base real el 2 de septiembre de 2026.** El tutor pulsó «Generar
enlace» en `CP-PJE6` y recibió el token en la misma llamada —48 caracteres hex, o
sea los 24 bytes de `gen_random_bytes`—, con su estado «Activo» y su caducidad a
14 días. No hizo falta el repliegue de la segunda consulta por `id`.

**[Se toca `useRoleHomeRedirect`, que usan tres pantallas]** → Login, Signup y
Navbar dependen de ese hook, así que un fallo ahí rompe el destino de **todos**
los accesos, no sólo el del enlace. Mitigación: el desvío ocurre únicamente si hay
token guardado, y sin token el hook hace exactamente lo de hoy. Los tests
existentes de `useRoleHomeRedirect.test.tsx` tienen que seguir pasando sin
tocarlos: si alguno falla, es la señal, no un test que arreglar.

## Migration Plan

`supabase/migrations/202606030022_create_invitation_redemption.sql`, con las dos
funciones, sus `revoke` de `public` y de `anon` por separado —revocar de `public`
no retira lo concedido a un rol— y su `grant execute` a `authenticated`.

**No crea tablas ni columnas, y no toca ninguna política ni ningún grant
existente.** El grafo de RLS verificado en la 0013 y la 0014 queda como está.

**PARADA, y quien la hace cumplir es el usuario.** Esta sesión escribe el SQL y
**para**. El `db push` no se lanza hasta que la sesión que revisa haya leído el
SQL y lo haya dicho —`ROADMAP.md` §1.3, punto 9—, y al lanzarlo se lee la salida:
tiene que aplicar la 0022 y ninguna otra. Después, `npx supabase gen types` para
que `redeem_invitation` y `preview_invitation` entren en
`types/database.types.ts`, que **no se edita a mano**. Las dos órdenes las lanza
el usuario porque piden credenciales por consola.

**Rollback:** `drop function` de las dos. No hay datos que revertir mientras nadie
haya canjeado; si alguien canjeó, su pertenencia es una pertenencia normal y
sobrevive perfectamente a que las funciones desaparezcan.

## Open Questions

Ninguna que pueda esperar sin cambiar la spec. Las dos que había —qué pasa con la
solicitud pendiente y si hacían falta Edge Functions— están decididas arriba.
