# CodePlay — Hoja de ruta

> **En qué orden se construye el proyecto y quién hace cada parte.**
> Última actualización: **2 de septiembre de 2026**.

Este documento responde a *cuándo* y *quién*.
Para *qué* y *por qué*, ver [`docs/CONTEXT.md`](CONTEXT.md) §3, que describe cada
bloque de trabajo con sus dependencias. Las etiquetas P1–P6 que aparecen abajo
son las de ese documento; aquí no se repite su contenido.

Meta de referencia: una plataforma **desplegada y usable por niños y profesores
reales**, con el juego integrado. Para defender el proyecto de grado basta con
llegar al paso 23 y añadir el 27.

---

## 1. Cómo se trabaja

### 1.1 Dos sesiones, papeles distintos

El trabajo se reparte entre dos sesiones de Claude Code sobre **el mismo
directorio** — no son copias separadas, comparten disco y repositorio:

| Papel | Qué hace |
| --- | --- |
| **Sesión que ejecuta** | Recibe el encargo, corre `/opsx:propose`, `/opsx:apply` y `/opsx:archive`, escribe el código |
| **Sesión que revisa** | Redacta los encargos, y **verifica el resultado leyendo el repositorio**, no el relato de la otra sesión |

La verificación se hace contra el disco: `git log`, `npm run test:run`,
`npx openspec validate`, y lectura directa de los archivos. Un resumen que suena
competente no es prueba de nada.

**Cuidado con las ediciones simultáneas.** Al compartir directorio, dos sesiones
pueden pisarse en el mismo archivo. Antes de editar algo que la otra tenga a
medias, comprobar `git status`.

### 1.2 Un cambio cada vez

Cada paso es un cambio de OpenSpec, y conviene una sesión nueva por cambio: las
conversaciones largas se comprimen y pierden detalle.

Criterio de vía, según `CLAUDE.md`:

- **Cambia lo que hace la aplicación** → `/opsx:propose`, con delta de spec.
- **Herramienta, documentación o limpieza** → `skip_specs: true` en su
  `.openspec.yaml`. **Nunca inventar un requisito** para que `validate` pase.

### 1.3 Antes de aprobar un `apply`

Revisar la propuesta, no solo validarla. Nueve comprobaciones que ya han
evitado problemas reales — las cuatro últimas las añadió la práctica, y se
aplican al revisar y al archivar, no sólo antes del `apply`:

1. Que el `.openspec.yaml` declare `skip_specs` **sólo** si de verdad no hay
   deltas, y que no exista una carpeta `specs/` con requisitos inventados.
2. Que las tareas incluyan verificación final con `lint`, `test:run` y `build`.
3. Que el alcance no se desborde más allá de lo encargado.
4. Que las herramientas que usan las verificaciones **existan en la máquina**.
   Ya pasó: una tarea verificaba con `gh`, que no está instalado.
5. Que el análisis de ciclos entre políticas de RLS se haya hecho **desde cada
   operación de escritura, no sólo desde las lecturas**. Cuando una política
   consulta otra tabla, el ciclo puede cerrarse en una dirección y no en la
   otra. El paso 9 se aplicó con una recursión que mataba el `insert` de
   solicitudes y no aparecía en ningún `select`: el grafo se recorrió desde la
   lectura de `profiles`, que termina, y nunca desde la escritura de
   `join_requests`, que es donde se cerraba. **Pasó dos revisiones** porque las
   dos lo miraron en la misma dirección.
6. **El `## Purpose` del spec principal no lo transporta ningún delta.** Al
   archivar hay que abrirlo y leerlo a mano: si la capacidad ganó o perdió algo,
   el Purpose sigue describiendo lo de antes. «Revisado, sin cambios» es un
   resultado válido y se dice.
7. **Los tests se comparan por los nombres de los `it(`, no por el número.** Un
   `git show HEAD:<ruta>` contra el archivo actual enseña cuál se fue y cuál
   entró; un total que cuadra puede esconder uno retirado y otro añadido.
   Retirar el test de una función eliminada es legítimo; «arreglar» uno que
   falla, casi nunca.
8. **Ante un REMOVED, leer las líneas borradas del spec principal.** El sync
   borra texto, y ahí es donde algo colateral se va sin que nadie lo note. Se
   confirma que lo suprimido es exactamente el requisito y sus escenarios.
9. **El SQL de una migración se lee ANTES de que el usuario lance el
   `db push`**, no después. Y al lanzarlo se lee la salida: tiene que aplicar
   las migraciones nuevas y ninguna más — si arrastra otras, hay migraciones sin
   aplicar en la base y eso se mira antes de seguir.

   **Quien hace cumplir esta parada es el usuario, no la lista de tareas.** El
   paso 16 la llevaba escrita como tarea propia —«PARADA: la sesión que revisa
   lee el SQL antes del `db push`»— y aun así no ocurrió: la sesión que ejecuta
   la marcó hecha y siguió. No es un descuido de esa sesión, es el sitio donde
   estaba el control. Una tarea que dice «espera a que otro te revise» vive en la
   lista de quien tiene que esperar, y la marca él mismo; en el paso 28 funcionó
   por disciplina, no por diseño. El único punto que puede hacerla cumplir es el
   `db push`, porque **sólo el usuario lo lanza**: no lo lanza hasta que la sesión
   que revisa haya leído el SQL y lo haya dicho, diga lo que diga la lista de
   tareas. La migración del 16 salió bien —revisada a posteriori, sin defecto—,
   pero salió bien sin control, que es otra cosa.

---

## 2. Secuencia

Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente
★ = añadido durante la planificación, no estaba en §3 de `CONTEXT.md`

**Manda el orden de las filas, no el número.** Los números son la identidad de
cada paso —se citan así en `CONTEXT.md`, en los cabos sueltos de §3 y en los
cambios ya archivados—, así que al reordenar se mueve la fila y el número viaja
con ella. Una fila fuera de secuencia numérica es deliberada y lleva su motivo
escrito en §2.1.

| Nº | Paso | Estado | Vía |
| --- | --- | --- | --- |
| 1 | Crear `CLAUDE.md` en la raíz | ✅ | directo |
| 2 | Borrar código muerto: `pages/Landing/sections/`, `framer-motion` | ✅ | directo |
| 3 | Sembrar `openspec/specs/` — 7 capacidades, 40 requisitos | ✅ | directo |
| 4 | ★ Montar Vitest y Testing Library, 54 tests sobre el store | ✅ | `infraestructura-tests` |
| 5 | ★ CI en GitHub Actions: lint, tests y build | ✅ | `ci-github-actions` |
| 6 | Crear el proyecto de Supabase y rellenar `.env` | ✅ | **usuario** |
| 7 | Columna `profiles.role`, disparador y esquema aplicado | ✅ | `backend-supabase-real` |
| 8 | Regenerar `database.types.ts` y arreglar sus consumidores | ✅ | *(unido al 7)* |
| 9 | Migración de las 4 tablas de salones + RLS + grants — **salió con una recursión de RLS, ver §2.1** | ✅ | `tablas-salones` + `arreglo-recursion-rls` |
| 11 | ★ Usuarios de prueba reales y reapuntar el botón «Sin login» — **adelantado, ver §2.1** | ✅ | `usuarios-de-prueba` |
| 10 | `classrooms.service.ts` y reescribir `ClassroomsProvider` | ✅ | `salones-persistentes` |
| 12 | Login y registro reales con rol | ✅ | `auth-real` |
| 13 | Recuperar y cambiar contraseña — **las dos mitades verificadas contra la base real**: el cambio desde Ajustes pide la contraseña actual y la verifica, y el correo de recuperación llegó y su enlace fijó la nueva | ✅ | `password-recovery` |
| 15 | Google OAuth — **la mina era el rol, y se cerró con una regla: el rol se fija en el primer registro y no cambia nunca.** El disparador crea todo perfil de Google como `child` porque el alta no puede llevar metadatos; la migración 0018 añade `is_role_declared` y hace que `set_my_role` rechace tanto si el rol ya se declaró como si el perfil tiene lazos de salón. **Verificado contra la base real**, incluido el daño que lo motivó —un niño con membresía que acababa tutor y fuera de su salón— reproducido paso por paso y ya no ocurriendo. **No cierra** registrarse como tutor de entrada: eso sigue abierto y lo cierra el código de institución | ✅ | `google-oauth` |
| 28 | ★ Tres arreglos vivos y la barra de XP — **adelantado, ver §2.1**. El `username` del disparador ya no aborta el alta (migración 0019, verificada con tres altas por `curl`), los fallos de autenticación salen en español por código, el panel dejó de inventar nombre, correo y racha en **cinco** archivos, y el XP se ve en cuatro sitios con `XPBar` retintada | ✅ | `arreglos-y-barra-xp` |
| 29 | ★ Nombre editable desde Ajustes — **adelantado, ver §2.1**. Un panel compartido que montan las dos pantallas de Ajustes, con la acción en `AuthProvider` para que las **siete** superficies que leen `user.fullName` se refresquen sin recargar. La longitud (2–60) se declara una vez y la heredan el registro y Ajustes; el máximo no existía en ninguna parte. De paso cerró el panel del tutor, que el paso 28 dejó fuera: cuatro «Sr. Robot» y un correo inventado | ✅ | `nombre-editable` |
| 16 | Persistir la asignación de misiones — la migración 0020 cuelga la asignación **del salón**, con `mission_key` como texto sin clave ajena porque el catálogo sigue en el cliente. El selector de alcance dejó de ignorarse y el niño ve sólo lo asignado, en dos pantallas. **NO las hace jugables**: nada puede completar una misión hasta el paso 21, así que el salón entero sale en «Pendiente» con el motivo escrito en la pantalla, y la tarjeta del niño no ofrece ningún botón. **Sin tabla de cumplimientos a propósito**, para no decidir de paso la pregunta abierta de §3.2 | ✅ | `misiones-asignadas` |
| 18 | ★ Sincronización en vivo (Supabase Realtime) — **no eran «notificaciones»**: no hay campana, ni lista de avisos, ni no leídos, ni nada que persista un aviso. Son tres pantallas que ya existían y ahora se actualizan solas: la bandeja del tutor, la pertenencia del niño y sus misiones. La migración 0021 publica tres tablas en `supabase_realtime`, que existía con las cuatro operaciones activas y **cero tablas**. De paso cerró el defecto del `loading` que el paso 13 dejó a medias: **una recarga disparada desde fuera no declara espera, pero sí la apaga**, en los dos hooks. Verificado con dos sesiones y con los tres negativos emparejados; cierra además el caso «tutor contra salón ajeno» del paso 16 | ✅ | `sincronizacion-en-vivo` |
| 23 | ★ **PARTIDO EN DOS, ver §2.1.** **23.1 — Preparar el terreno y escribir el contrato:** todo lo que la web debe tener listo para recibir el juego, y un documento en `docs/` con lo que el juego debe cumplir para integrarse. **No necesita Unity ni al usuario.** Cierra de paso la PREGUNTA ABIERTA de §3.2, porque no se puede escribir qué manda el juego sin decidir cómo se verifica. **23.2 — Poner la casa encima:** cuando el juego esté construido, integrarlo de verdad —Unity en `apps/game/`, Git LFS y build de WebGL—. Necesita que el usuario instale Unity (§2.2) **y que el juego exista**, que es lo único de la secuencia que no depende de este repositorio | ⬜ | — |
| 17 | Reportes de habilidades sobre progreso real — **ver §3.1** | ⬜ | P5 |
| 20 | Contrato de integración y pantalla de nivel con contenedor — **exige cerrar antes la pregunta abierta de §3.2.** Incluye conectar la selección de niveles al backend, hoy maqueta (§3.3) | ⬜ | P4 |
| 21 | Escritura de progreso y XP desde el juego — **ver §3.2** | ⬜ | P4 |
| 22 | Diseñar e implementar rachas y logros — **no existe nada**, incluye el catálogo y retirar las estrellas. **Ver §3.2** | ⬜ | P4 |
| — | 🔬 **PRUEBA PRELIMINAR** — la hacen el usuario y gente cercana con cuentas de prueba, **sin menores de fuera**. Por eso el 14 puede ir detrás: ver §2.1 | ⬜ | — |
| 14 | ★ Consentimiento del acudiente y política de privacidad — **adelantado en parte y el resto DETRÁS de la prueba preliminar, ver §2.1 y §3.4.** Ya está aplicado su primer trozo, `invitaciones-sin-correo`, que eliminó el único sitio donde se guardaban datos de terceros. Lo que falta **se retoma después de la prueba preliminar, y en todo caso antes del primer usuario real**. Hereda dos decisiones ya tomadas: el tutor ve el historial del niño (§3.1) y los compañeros se ven entre sí nombre, XP y racha (§3.2) | 🔄 | `invitaciones-sin-correo` + §3.4 |
| 19 | Invitaciones por correo reales y enlace canjeable — **PARTIDO EN DOS, ver §2.1.** **Mitad A hecha:** el tutor genera un enlace canjeable, lo comparte por donde quiera, y quien lo abre entra al salón **sin pasar por la bandeja**; el token sobrevive el registro, incluida la vuelta por Google. La purga por `expires_at` entró desde el primer día, y **ninguna tabla ganó columna de correo**: por eso esta mitad esquiva entera la decisión de privacidad de §3.4. **Mitad B pendiente:** el envío real, que necesita **servicio de correo contratado** (§2.2) | 🔄 | `enlace-de-invitacion` + servicio |
| 24 | Retirar la sesión de invitado | ⬜ | — |
| 26 | Ilustraciones con Higgsfield — **va ANTES del 25, ver §2.1**: hacer responsive un diseño que el apartado gráfico va a cambiar es hacerlo dos veces | ⬜ | P6 |
| 25 | ★ Responsive, accesibilidad y `ErrorBoundary` — **detrás del 26 a propósito.** **Medido**: cero clases `sm:`/`md:`/`lg:` en las pantallas clave, `w-[262px] shrink-0` duplicado en `Sidebar.tsx:134` y `TeacherSidebar.tsx:66`, y **ningún `ErrorBoundary` en todo `apps/web/src`**. Hereda además `/invite/:token` del paso 19, que es la pantalla con más probabilidad de abrirse en un móvil. Ver `CONTEXT.md` §4.4 | ⬜ | — |
| 30 | ★ Migración al servidor de la universidad — **alcance por decidir, ver §2.1.** Supabase fue para probar funcionalidades con usuarios; lo definitivo va al servidor de la universidad. **Qué se mueve depende de lo que ofrezcan**, y eso se pregunta antes de planificarlo | ⬜ | — |
| 27 | ★ Despliegue y URL de demo | ⬜ | — |

### 2.1 Decisiones de orden que conviene no deshacer

**REORDENACIÓN DEL 2 DE SEPTIEMBRE DE 2026, y es la que manda sobre todo lo que
sigue.** La decisión es del usuario y el criterio es uno: **la integración del
juego deja de esperar y todo lo demás se ordena alrededor de ella.**

La secuencia queda en tres tramos:

1. **El 23**, preparar el terreno de la integración.
2. **17, 20, 21 y 22** — lo que sólo puede hacerse con el juego integrado.
3. **La prueba preliminar**, y detrás **14, 19, 24, 26, 25, 30 y 27**.

**El 17 baja del segundo lugar al tramo del juego, y no es una preferencia.** Sus
reportes tienen que calcularse sobre `user_progress` real, y **nada escribe ahí
hasta el paso 21**, que viene del juego. Hacerlo antes sería volver a maquetar
con datos de ejemplo, que es exactamente lo que ese paso existe para quitar.

**El 23 se parte en dos, y la primera mitad no necesita a nadie.** 23.1 prepara la
web para recibir el juego y **escribe el contrato**: qué manda el juego, en qué
formato y con qué garantía. Eso no pide Unity instalado, así que puede hacerse ya.
23.2 —Unity, Git LFS y el build de WebGL— sí lo pide, y está en §2.2.

**23.1 hereda la PREGUNTA ABIERTA de §3.2 y tiene que cerrarla.** No es opcional:
no se puede escribir qué manda el juego al terminar una partida sin haber decidido
cómo verifica el servidor que un logro se consiguió. Antes esa pregunta colgaba
del paso 20; con el 23 delante, le toca al 23.1 y con `/opsx:explore`, que es la
vía que §3.2 ya señalaba.

**El 26 pasa por delante del 25, y el motivo es no pagar dos veces.** El 25 hace
responsive el diseño actual; el 26 lo cambia. Hacerlos en ese orden significaría
replegar pantallas que van a dejar de existir. El 26 baja del final porque ya no
es «no bloquea nada»: bloquea al 25.

**El 14 puede ir detrás de la prueba preliminar porque esa prueba no lleva
menores de fuera.** La hacen el usuario y gente cercana con cuentas de prueba, así
que §3.4 se cumple: la obligación nace con el primer usuario real. **Si eso
cambiara —si entrara un niño ajeno al proyecto—, la política de privacidad y el
consentimiento del acudiente se adelantan a antes de la prueba.** Queda escrito
aquí para que no se descubra el día antes.

**El 30 es nuevo y va delante del 27.** Supabase se eligió para probar
funcionalidades con usuarios, no como destino: lo definitivo va al servidor de la
universidad. **Su alcance está sin decidir a propósito**, porque depende de lo que
la universidad ofrezca, y eso no se ha preguntado todavía. Lo que hay que
averiguar antes de poder planificarlo: si dan **Postgres** —y con qué versión, que
la RLS y las siete RPC son suyas—, si dan **HTTPS con certificado**, si dejan
**correr procesos propios** o sólo servir archivos, y si hay algo equivalente a
**Realtime** y a la **autenticación con OAuth**. Según la respuesta, el 30 va de
mover una URL a reimplementar medio backend, y por eso no lleva estimación.

Va delante del 27 porque desplegar sobre Supabase y volver a desplegar sobre otra
cosa es hacer el 27 dos veces.


**El paso 11 se adelanta al 10, y valió la pena a la primera.** La primera
comprobación con sesión real destapó que ningún niño podía solicitar entrar a un
salón: una recursión de RLS que la migración del paso 9 llevaba dentro y que
ninguna clave anónima podía enseñar. Se arregló en `arreglo-recursion-rls`.

Las identidades reales van antes de mover el store a Supabase, no después. El
paso 10 reescribe `ClassroomsProvider` para que escriba contra la base, pero
**ninguna de esas escrituras puede comprobarse sin una sesión real**: las
políticas que trajo el paso 9 preguntan por `auth.uid()`,
y hoy la aplicación responde `guest-child`, que no existe en `auth.users`. Hacer
el 10 primero significa escribir el servicio entero a ciegas y descubrir los
fallos todos juntos, con el store ya reescrito.

Adelantarlo cierra además la deuda que el paso 9 dejó anotada: que ninguna
política por rol ni por pertenencia estaba verificada. Con dos cuentas de prueba
sí se puede comprobar, y esa comprobación es parte del paso 11, no un extra.

**El principio, que es del usuario y vale más allá de este caso: cuando haga
falta reordenar o añadir pasos para poder comprobar que algo funciona, se hace.**
Ver funcionar cada paso antes de acumular el siguiente vale más que respetar una
secuencia escrita antes de saber lo que se sabe ahora.

**Los tests (4) van antes del paso 10**, no después. El paso 10 reescribe
`ClassroomsProvider` entero, que es el corazón de la aplicación. Los 54 tests
existen para que ese refactor tenga red. Si durante el paso 10 falla un test que
antes pasaba, **esa es la señal que se pagó por tener**: no se «arregla» tocando
el test.

**Retirar la sesión de invitado (24) va después del juego**, no antes. Decisión
del usuario: quiere poder entrar de un clic mientras prueba la integración. El
coste es nulo, porque esa sesión está limitada a desarrollo por
`import.meta.env.DEV` y nunca llega a producción.

**El paso 22 está separado del 21** porque no son el mismo trabajo. Progreso y
XP tienen la fontanería escrita —las RPC `upsert_my_progress` y
`create_level_attempt` existen—, pero **rachas y logros no tienen ni una línea**:
las columnas `current_streak` y `max_streak` están en `profiles` y nada las
calcula, y no hay lógica que decida cuándo se concede un logro.

Este paso incluye **diseñar la tabla de catálogo de logros**, que no existe. Al
aplicar el esquema (P1) se comprobó que `achievements` es el registro de lo
concedido a cada niño —`user_id`, `achievement_key`, `title`, `awarded_xp`,
`unlocked_at`, con `unique (user_id, achievement_key)`—, no la lista de logros
posibles con sus condiciones de desbloqueo. Mientras esa tabla no exista, la
sala de trofeos sólo puede mostrar lo conseguido: el requisito de
`contenido-mundos` se ajustó a esa realidad y habrá que volver a ampliarlo aquí.

**El paso 19 se parte en dos, y la mitad A va primero porque no depende de
nadie.** El 19 eran dos cosas —el enlace canjeable y el envío por correo— y sólo
una necesita que el usuario contrate un servicio. Hacer primero la que no
depende de nada es el mismo criterio que adelantó el 11 sobre el 10: avanzar por
donde se puede ver funcionar.

**Y la mitad A tiene una propiedad que conviene no perder: con enlace y sin
correo no se almacena la dirección de nadie**, así que esquiva entera la decisión
de privacidad de §3.4 —la misma que motivó `invitaciones-sin-correo`, que borró
`invitations.email` a propósito—. El tutor comparte el enlace por donde quiera y
la plataforma no manda nada. **Si un cambio se ve añadiendo una columna de
correo, se salió del alcance de la mitad A.**

La mitad B queda pendiente **sólo** del servicio contratado, y su dependencia
está anotada en §2.2 y en la fila del 19.

**El apartado gráfico (26) queda casi al final a propósito.** No bloquea ninguna
funcionalidad y el foco actual son las funcionalidades.

**El paso 15 pasa por delante del 14, y el 14 se queda en curso.** El 14 se
partió en dos: lo que era exigible hoy ya está hecho —`invitaciones-sin-correo`
eliminó `invitations.email`, que era el único sitio del esquema donde se
guardaban datos de un tercero sin cuenta—, y lo que queda es la política de
privacidad y el consentimiento del acudiente, que **hoy no obligan a nada**: la
aplicación no está desplegada —eso es el paso 27—, las únicas cuentas son de
prueba, y ya no se recogen datos de nadie que no se haya dado de alta él mismo.
**La obligación nace con el primer usuario real, no antes**, así que lo que
falta se retoma después de la prueba preliminar y en todo caso antes de que
entre alguien de fuera. Ver §3.4, que dice exactamente qué falta.

Redactar ahora una política sobre un esquema que todavía va a cambiar —el paso
17 conecta el progreso real, el 20 y el 21 traen el juego— significaría
reescribirla dos veces. Google OAuth (15), en cambio, no depende de nada de eso.

**El paso 28 se adelanta al 16 porque sus tres primeras partes eran fallos que
se veían hoy con una cuenta real, y ninguna dependía de nada.** No es una mejora
que pudiera esperar su turno: un correo con menos de 3 o más de 30 caracteres
antes de la arroba **impedía darse de alta** —con un mensaje que no nombraba el
nombre de usuario—, los fallos de acceso salían en inglés en una aplicación en
español para niños, y el panel afirmaba «42 días» de racha a cuentas recién
creadas mientras la tabla de su salón enseñaba el cero verdadero. El paso 16, en
cambio, es una decisión de diseño antes que una tarea (§3), así que no perdía
nada esperando.

La cuarta parte —la barra de XP— entró con ellas por oportunidad: el mismo panel
estaba abierto, el dato ya se leía de la base, y §3.2 tenía anotado que sin
superficie el paso 21 escribiría un número que el niño apenas puede ver.

**El paso 29 va detrás del 28 y delante del 16, y lo pidió el usuario:** que la
gente pueda cambiar su nombre «para que se distingan mejor en los salones, o que
el tutor no tenga que andar preguntando quién es quién». No dependía de nada
—**la fontanería estaba entera y sin un solo consumidor** desde la migración
0006: la RPC `update_my_profile` con su `grant`, `profileService.updateProfile`
llamándola y `useProfile()` exponiéndola—, así que era interfaz y nada más. El
paso 16 sigue siendo una decisión antes que una tarea (§3) y no perdía nada
esperando otra vez.

Va justo detrás del 28 porque **termina lo que aquél dejó a medias**: el paso 28
arregló los datos inventados del panel del niño y no los del tutor, porque su
encargo decía «el panel del niño». La pantalla de Ajustes del tutor es donde va
el campo del nombre, así que los cuatro «Sr. Robot» y el `tutor@codeplay.co` se
cerraron aquí, con el archivo ya abierto.

**Lo que este paso NO cierra**, y conviene no confundirlo: el punto 4 del paso 14
(§3.4). Da un nombre editable, no un apodo; el tutor y los compañeros siguen
viendo el mismo.

### 2.2 Pasos que requieren a una persona

Estos no los puede hacer una sesión de Claude, porque implican crear cuentas o
introducir credenciales:

| Paso | Qué hace el usuario |
| --- | --- |
| 6 | Crear el proyecto en Supabase y copiar URL y clave publishable al `.env` |
| 7 | `npx supabase login`, `link --project-ref` y `db push` — piden credenciales por consola |
| 15 | Dar de alta Google OAuth en el panel de Supabase — **hecho**, y además hizo falta crear el cliente en Google Cloud, añadir `/auth/callback` a Redirect URLs y **repegar el Client Secret**, que estaba mal y tuvo el paso bloqueado |
| 18 | `npx supabase db push` de la 0021, que publica tres tablas en `supabase_realtime` — pide credenciales por consola. **Y hace cumplir la parada de §1.3:** no se lanza hasta que la sesión que revisa haya leído el SQL y lo haya dicho |
| 19 | Contratar el servicio de correo — **sólo para la mitad B**. La mitad A (el enlace canjeable) está hecha y no necesitó nada de esto; su `db push` de la 0022 lo lanzó el usuario el 2-sep-2026 |
| 23.2 | Instalar Unity y crear el proyecto — **sólo la segunda mitad**. La 23.1, que prepara el terreno y escribe el contrato, no necesita nada de esto |
| 30 | **Preguntar a la universidad qué ofrece su servidor** —Postgres y su versión, HTTPS, si dejan correr procesos, si hay algo como Realtime y como OAuth— y conseguir los accesos. Sin esa respuesta el paso no se puede ni planificar (§2.1) |
| 27 | Configurar el despliegue |

Fuera de la secuencia, siguen pendientes dos tareas de cuenta que dejó anotadas
el commit `7c84a93`: borrar los secretos `AZUREAPPSERVICE_*` en los ajustes de
GitHub, y reapuntar el Deployment Center de la App Service «gym» al repositorio
que le corresponde. Mientras siga apuntando aquí, Azure puede volver a escribir
su workflow en `.github/workflows/`.

---

## 3. Cabos sueltos detectados

Cosas descubiertas durante la ejecución que no estaban previstas y no deben
perderse:

| Hallazgo | Dónde se resuelve |
| --- | --- |
| El invariante «un alumno, un salón» **ya vive en el modelo** desde el paso 9 —restricción, índice parcial y política—, y desde el paso 10 el store tampoco lo contradice: `requestJoin()` comprueba la pertenencia y la solicitud pendiente antes de escribir | Cerrado en el paso 10 |
| `levels` guarda `starter_code`, `validation_rules` y `programming_language`: el esquema se diseñó para un editor de código en el navegador, no para Unity | Paso 20 |
| No existe catálogo de logros: `achievements` registra los concedidos a cada niño, no los posibles con sus condiciones. La sala de trofeos sólo puede listar lo conseguido, y el requisito de `contenido-mundos` se ajustó a eso | Paso 22 |
| **El progreso no sabe nada de salones**, así que al aceptar a un alumno el tutor pasará a ver *todo* su historial, incluido el anterior al ingreso. Hoy nadie lo ha decidido: se dará por accidente | Paso 17, y ver §3.1 |
| **El XP casi no tenía superficie en la interfaz.** El paso 28 le dio cuatro —barra lateral, barra superior y la tabla de seguimiento en sus dos vistas—, con `XPBar` retintada al tema de selva y un máximo provisional. Lo que sigue abierto no es dónde se ve, sino que **nada lo escribe**: todas las barras muestran el cero verdadero | Superficie cerrada en el paso 28; la escritura, paso 21 |
| **PREGUNTA ABIERTA:** cómo verifica el servidor que un logro se consiguió. No se ha profundizado en qué envía el juego, en qué formato ni con qué garantía. No es un paso nuevo: resolver con `/opsx:explore` | **Paso 23.1**, que escribe el contrato y no puede redactarlo sin esto. Ver §3.2 |
| **El historial de solicitudes se acumula en filas**: un mismo par `(student_id, group_id)` puede tener una resuelta y una pendiente nueva. Resuelto ordenando por `requested_at` y quedándose con la última, con `maybeSingle()` y nunca `single()`. **Comprobado con el caso real**: niño rechazado que vuelve a pedir entrar, dos filas, la pantalla lee «En espera» | Cerrado en el paso 10 |
| **Las políticas de salones están probadas con sesión real**, las once comprobaciones que lista `CONTEXT.md` §2.7, casos negativos incluidos. Lo único que queda fuera es la **carrera** del `for update`: el cupo se probó funcionalmente, no bajo concurrencia | Cerrado en el paso 11 |
| **A la migración 0009 le falta `revoke ... from anon`**, que la 0013 sí trae: sólo revoca de `public`, y eso no retira lo concedido directamente a un rol. **No hay fuga, está medido:** consultadas con la clave anónima, `profiles`, `user_progress`, `level_attempts` y `achievements` devuelven 401 con código `42501` —permiso denegado a nivel de `grant`, no un vacío por RLS—, y `worlds` y `levels` devuelven 200, que es justo lo que sus políticas `to anon` quieren. Este proyecto no tiene privilegios por defecto para `anon` en el esquema `public`, así que el `revoke` que falta es defensa en profundidad, no un agujero. **Decidido: se anota, no se migra.** Si alguna vez se toca, que sea sabiendo esto y no creyendo que hay algo abierto | Ninguno: queda anotado a propósito |
| Cuatro carpetas de componentes **sin ningún consumidor**: `WelcomeBanner`, `WorldCard`, `SidebarPlayerCard` y `LeaderBoard`. Son restos del panel anterior al rediseño. **Eran cinco**: `GoogleAuthButton` no estaba contado aquí y lo borró el paso 15. Detalle que importa para el paso 21: `SidebarPlayerCard` y `WelcomeBanner` usan `|| 0` para la racha, que es **lo correcto** — la versión buena es la que nadie monta | Paso 21 o limpieza aparte |
| **El panel del niño inventaba datos, y no en tres archivos sino en CINCO, con siete líneas.** El recuento que había aquí se quedó corto porque se buscó el literal `'Explorer Leo'`, y `StudentWorldsModule.tsx:91-95` usa `'Leo'` a secas —pintado en la línea 298 como «¡HOLA, Leo!»—. Las siete: `Sidebar.tsx` (nombre y racha), `StudentTopBar.tsx` (racha), `StudentSettingsModule.tsx` (nombre, correo y racha) y `StudentWorldsModule.tsx` (las dos ramas de `getHeroName`). Cerrado con el arreglo que pedía cada dato: racha `?? 0` porque el cero es legítimo, nombre con `FALLBACK_STUDENT_NAME` exportado desde `classrooms.service.ts`, y correo sin ningún repliegue. `SidebarPlayerCard` y `WelcomeBanner` **no se tocaron**: su `\|\| 0` es correcto y no los monta nadie | Cerrado en el paso 28 |
| **El estado de una invitación tiene TRES valores, no dos**, y el panel viejo pintaba dos: `status === 'pending' ? 'Pendiente' : 'Aceptada'`, así que una **caducada** se habría enseñado como «Aceptada». Estaba dormido porque nada marcaba `expired` y sólo existían filas `pending`. Ese código se fue con el cambio `invitaciones-sin-correo`, pero el `check` de la 0013 sigue teniendo los tres: **al reconstruir la lista en el paso 19, no repetir el ternario** | Cerrado en `invitaciones-sin-correo`; aviso vivo para el paso 19 |
| **«Secure password change» quedó ENCENDIDO**, y no costó código. Los **dos** caminos están medidos, no razonados: el de Ajustes —que reautentica— por API y desde la pantalla, y `/reset-password` —que **no** reautentica, y es el de quien se quedó fuera— de punta a punta con el correo del dueño del proyecto. En ninguno pidió el servidor nonce por correo: tanto la sesión que emite `signInWithPassword` como la que abre el enlace cuentan como recientes. La cautela que queda, y que sigue sin poder fabricarse: un cambio hecho desde una sesión **vieja** podría toparse con la exigencia del nonce, cuyo mensaje llega en inglés; ahí la respuesta es traducirlo o apagar el interruptor, nunca implementar el envío | Cerrado en el paso 13, tarea 10.1; ver `CONTEXT.md` §2.2 |
| **El defecto del indicador de carga era anterior al paso 13** y estaba en tres sitios: `AuthProvider` levantaba `loading` en cada evento de `onAuthStateChange` —refrescos de token incluidos— y `ClassroomsProvider` dependía del objeto `user`, así que la aplicación se blanqueaba sola cada cierto tiempo y recargaba el store entero. Se arregló comparando el **id** del usuario y dependiendo de `userId`/`userRole`. `PrivateRoute`, `PublicRoute` y `TeacherDashboard` no se tocaron | Cerrado en el paso 13; ver `CONTEXT.md` §2.2 y §2.5 |
| **Quien se registra con Google no puede añadirse contraseña después**: el cambio desde Ajustes pide la actual, y esa cuenta no tiene ninguna. No es un fallo del paso 15 y nadie lo ha pedido; queda anotado por si aparece | Sin paso asignado |
| **Los fallos de autenticación llegaban en INGLÉS.** Cerrado con `AUTH_ERROR_MESSAGES` y el helper `authError()` en `auth.service.ts`, por código y no por texto, con el mensaje del servidor conservado como causa. `createAppError.ts` **no se tocó**, porque lo usan otros seis servicios contra PostgREST — y por eso `profile.service.ts` sigue en inglés, anotado en `CONTEXT.md` §4.5. Comprobado en pantalla: `/login` con la contraseña equivocada responde «El correo o la contraseña no son correctos.» Ocho de las quince ramas del mapa **no puede dispararlas la interfaz de hoy**: cuáles y por qué, en `CONTEXT.md` §4.6 | Cerrado en el paso 28 |
| **El disparador construía el `username` sin comprobar la longitud, y eso ABORTABA el alta entera.** Cerrado por la migración `202606030019`, que acota a 3–30 tras normalizar y deja `null` cuando no encaja, como ya hacía con el duplicado. El `check` de la `202606030002` **no se relajó**: el formato es del dominio y cedió quien lo deriva. Verificado contra la base real con tres altas por `curl` —local-part de 2, de 33 y de 18—, y la tercera es la que prueba que la asignación normal sigue funcionando | Cerrado en el paso 28 |
| **Quien escucha sin sesión sabe que algo cambió, aunque no sepa qué.** Con la publicación puesta, una suscripción con la clave anónima recibe el **sobre vacío** de cada cambio en las tres tablas —sin columnas, sin identificadores; medido, no razonado—. Hoy es ruido, porque la base tiene un salón de pruebas y nada más. **Desplegada y con salones reales dentro, esa cadencia pasa a ser telemetría de uso** —cuánta actividad hay y cuándo— visible para cualquiera, porque la clave es pública por diseño. No cambia la decisión del paso 18; se anota para que entonces no se descubra desde cero, y la salida sigue siendo `realtime.broadcast_changes()` desde disparadores | Paso 27 |
| **El ternario de dos ramas NO se repitió, y el aviso queda cerrado.** El paso 19 reconstruyó la lista de enlaces derivando el estado de **dos** datos —`status` y `expires_at`—, con sus tres salidas: activo, usado y caducado. Comprobado en pantalla con datos reales, y sólo el activo ofrece «Copiar» y «Retirar» | Cerrado en el paso 19 |
| **La purga de invitaciones depende de que el tutor entre a mirar.** El panel borra las caducadas de sus salones al listarlas, con la política de la 0013, así que un salón cuyo tutor no vuelve conserva filas vencidas. **No es riesgo de seguridad** —el enlace está muerto por `expires_at`, y eso lo comprueba la RPC, no el borrado— ni de privacidad —desde la 0016 la fila no lleva el dato de ningún tercero—. Lo que queda es una tabla que crece. La salida es `pg_cron`, que exige activarlo en el panel y por tanto **al usuario** | Paso 27, con lo demás que sólo tiene sentido desplegado |
| **`invitations.expires_at` no lo acota ningún `check`**, así que quien inserta puede **alargar** la caducidad tanto como acortarla, y entonces la purga no se la lleva nunca. Los catorce días los sostienen el `default` de la columna y que el cliente no mande el campo, **no el esquema**. Hoy sólo el tutor del salón puede insertar, y sólo en el suyo, así que el daño se lo hace a sí mismo | Anotado; material para el paso 14 y para la mitad B del 19. Detalle en `CONTEXT.md` §2.7 |
| **Las misiones se persisten desde el paso 16, y lo que NO cierra conviene tenerlo escrito.** La migración 0020 cuelga la asignación del **salón** —no del tutor: el niño se liga a un salón, no a una persona—, el selector de alcance dejó de ignorarse y el niño ve sólo lo asignado. **Siguen sin ser jugables**: nada puede empezar ni completar una misión, así que la tarjeta del niño no ofrece botón y el salón entero sale en «Pendiente» con el motivo a la vista. **El catálogo sigue siendo local y sin clave ajena a `levels`**: son las mismas cinco entradas `m1`…`m5` de `teacher/classroomsData.ts`, ahora con su premio en XP, y `mission_key` es texto libre porque no hay tabla a la que apuntar. Y **no se creó tabla de cumplimientos** a propósito, para no decidir de paso la PREGUNTA ABIERTA de §3.2 | Persistido en el paso 16. **CUMPLIRLAS NO TIENE PASO ASIGNADO, comprobado el 2-sep-2026:** las filas 20, 21 y 22 no mencionan las misiones ni una vez, y el 21 escribe progreso de **niveles**, que no las alcanza —`mission_key` no tiene clave ajena a `levels` porque una misión no es un nivel—. **El dueño natural es el 22, y el motivo lo puso el usuario:** una misión y un logro son el mismo objeto con la misma maquinaria, y lo único que los separa es la puerta de entrada —el logro se saca en cualquier momento, la misión sólo si el tutor la asignó—. El 22 construye justo esa maquinaria: el catálogo y la lógica de conceder. **De ahí sale una pregunta que cambia el trabajo: si montan sobre `achievements`, que ya tiene `unique (user_id, achievement_key)` —una vez cada uno— y `awarded_xp`, puede que la tabla de cumplimientos NO haga falta**, y entonces el 16 acertó al no crearla. Lo decide el 23.1, porque cambia lo que el contrato le exige al juego | El 22 lo construye; el 23.1 decide si hace falta tabla propia |

### 3.1 Historial previo al ingreso en un salón

El progreso vive colgado del usuario, no del salón: `user_progress` está indexada
por `(user_id, level_id)` y **ninguna tabla de progreso referencia a un salón**.
Eso es correcto y deliberado — un niño puede descubrir CodePlay por su cuenta,
jugar semanas y unirse después al salón de su profesor sin perder nada.

La consecuencia no buscada aparece en el paso 17. Cuando los reportes de
habilidades y la tabla de seguimiento dejen de usar datos de ejemplo y se
calculen sobre `user_progress` real, el tutor verá **el historial completo** del
niño, incluido lo que hizo antes de solicitar entrada. Hoy `acceptRequest()` lo
mete «sin actividad previa», pero sólo porque los datos son ficticios.

Hay que decidirlo explícitamente, y tiene arista de privacidad: un niño que jugó
tres meses por su cuenta entrega ese historial entero a un profesor al unirse.
En una plataforma para menores eso se cruza con el paso 14. Las opciones son
mostrar todo, mostrar sólo desde la fecha de ingreso, o preguntar.

**La mitad de esto ya está resuelta.** El paso 9 decidió guardar la fecha:
`class_memberships.joined_at` existe y se rellena al aceptar la solicitud. Lo que
sigue abierto es **qué se muestra**, y es lo único que queda para el paso 17 —
las tres opciones siguen disponibles porque el dato está. Guardar la fecha no era
la decisión de privacidad; era lo que impedía tomarla más tarde sin inventarla.

### 3.2 El XP no se ve casi en ninguna parte

**Actualizado por el paso 28.** La tabla de abajo describía el estado anterior:
el XP sólo se veía en Ajustes y la única barra vivía en un huérfano.

| Dónde aparece | ¿Se renderiza? |
| --- | --- |
| `StudentSettingsModule` | ✅ Sí |
| `Sidebar` con `XPBar` | ✅ Sí — **desde el paso 28**, debajo del chip de racha |
| `StudentTopBar` con `XPBar` | ✅ Sí — **desde el paso 28**, a la izquierda del chip de racha |
| `StudentRosterTable` con `XPBar` | ✅ Sí — **desde el paso 28**, en las dos vistas, y la columna cambia de sitio según quién mire |
| `LeaderBoardRow` | ❌ `LeaderBoard` no lo monta nadie |
| `SidebarPlayerCard` | ❌ sin consumidores |
| `WelcomeBanner` con `XPBar` | ❌ sin consumidores |

**No confundir la barra de XP con la barra de progreso del mundo**, que cuenta
niveles completados sobre el total y no tiene relación con el XP.

Esto dejaba el paso 21 incompleto tal como estaba planteado: escribiría un número
que el niño apenas puede ver. **Decidido y hecho en el paso 28**: el XP se ve en
la barra lateral, en la barra superior y en la tabla de seguimiento, sin recuperar
el banner. Lo que el paso 21 hereda ya no es dónde mostrarlo, sino el **máximo**:
hoy es `PROVISIONAL_MAX_XP` en `constants/progress.ts`, un número inventado porque
el esquema no tiene umbrales, y fijarlo de verdad es el paso 22.

**Los componentes huérfanos se rehacen, no se recuperan.** `WelcomeBanner`,
`SidebarPlayerCard`, `LeaderBoard` y `WorldCard` usan los nombres de color
anteriores al rediseño (`text-secondary`, `text-neutral-light`) y la maquetación
del panel viejo. Adaptarlos sería arrastrar marcado que no encaja con el tema de
selva. La excepción es `XPBar`, una primitiva pequeña que se salvó de estructura y
**ya está retintada**: lo hizo el paso 28 antes de montarla, que era la condición
que este párrafo ponía. Hoy usa `text-ink-soft`, `bg-jungle-soft` con borde de
`ink` y un relleno `from-jungle-light to-jungle`; ya no queda ningún nombre de la
paleta anterior en el archivo. **No está pendiente: no la retintes otra vez.**

Se eligió la familia `jungle` y no `sun` porque el XP ya era verde en Ajustes
—el chip usa `chip-leaf`—, y porque el amarillo es de la racha: en tres de las
cuatro ubicaciones van pegadas, y con el mismo color serían indistinguibles.

#### Modelo de progreso: decidido

El XP **se queda** y se consigue por **dos vías independientes**:

| Vía | Cuánta XP |
| --- | --- |
| Completar un nivel | Poca, y **mayor cuanto más difícil el mundo** |
| Conseguir un logro | Variable según el logro: puede ser mucha o poca |

**Los logros no son por avanzar, son por hacer cosas.** No se ganan por completar
un nivel —salvo alguno concreto—, sino por comportamientos dentro del juego: por
ejemplo, «da tres vueltas sobre tu propio eje usando bloques». Premian la
exploración, no el avance.

Cada logro se gana **una sola vez**: lo impone `unique (user_id, achievement_key)`
y es lo buscado. Si el proyecto crece hacia misiones diarias repetibles, esa
restricción habrá que revisarla, pero hoy queda fuera de alcance.

`upsert_my_progress` ya incrementa `profiles.total_xp`, y `achievements.awarded_xp`
guarda lo que dio cada logro.

**Falta la dificultad del mundo.** La tabla `worlds` **no tiene columna de
dificultad** — sólo existe `levels.difficulty` con `beginner`/`intermediate`/
`advanced`. Y en la interfaz, `StudentWorldsModule` fija `worldDifficulty` a
`'easy'` escrito a mano, así que los tres mundos muestran «Fácil» pase lo que
pase: no lee nada. Para que el XP dependa de la dificultad del mundo hay que
añadir la columna, derivarla de sus niveles, o usar `sort_order` como proxy —el
orden ya va de menos a más—. Decisión del paso 22.

#### PREGUNTA ABIERTA: cómo se verifica que un logro se consiguió

**Sin decidir y sin profundizar.** Queda pendiente de una conversación propia.

Lo que no se ha explorado: **qué envía exactamente el juego al terminar una
partida, en qué formato, y con qué garantía de que lo enviado ocurrió de
verdad.** Eso es lo que falta, no la teoría de abajo.

**No es un paso nuevo de la secuencia, y desde la reordenación del 2 de
septiembre de 2026 le toca al 23.1**, no al 20. El 23.1 escribe el contrato de
integración —qué manda el juego y con qué garantía—, y eso no puede redactarse
sin haber cerrado esto antes. La vía sigue siendo `/opsx:explore`, y de ahí sale
el diseño con el que arrancan el 23.1 y, detrás, el 20.

Lo de abajo es **un punto de partida para esa conversación**, no una decisión
tomada.

El problema: «da tres vueltas sobre tu eje» sólo lo sabe el juego, que corre en
el navegador del niño. Pero el esquema hace los logros de sólo lectura para el
cliente justamente para que nadie se los conceda a sí mismo.

Una posibilidad: **partirlos en dos familias según quién puede saber que se
cumplieron.**

| Familia | Quién concede | Falsificable |
| --- | --- | --- |
| **A** — derivables del progreso: primer nivel, mundo completo, racha de N días, N niveles | El servidor, leyendo `user_progress` y `level_attempts`. Nadie reporta nada | No |
| **B** — comportamiento dentro del juego | Unity lo reporta al terminar | Sí, desde la consola |

Mitigación barata para la familia B: que la RPC que concede exija **un intento
exitoso de ese nivel**. Sube el listón de «escribir en la consola» a «jugar el
nivel y además escribir en la consola», y cuesta una condición en el SQL.

Lo que **no** parece proporcionado aquí es validar la partida entera en el
servidor: reimplementar la lógica del juego para comprobar cada logro es un
proyecto en sí mismo. Es una plataforma para niños, sin dinero de por medio, y
quien hace trampa se engaña a sí mismo. El único motivo real de preocupación es
el ranking — otro argumento para acotarlo al salón o convertirlo en meta
colectiva.

**Las estrellas por nivel se retiran.** `levels.stars_reward` y
`user_progress.stars_earned` existen en el esquema y los atraviesan servicios y
tipos, pero **ningún componente las pinta**: son esquema que nunca llegó a la
pantalla, del mismo diseño de editor de código en el navegador que dejó
`starter_code` y `validation_rules`. Además no distinguen nada — los nueve
niveles sembrados tienen `stars_reward: 3` idéntico. Retirarlas en una migración
durante el paso 22, junto con su parámetro en `upsert_my_progress`.

**Falta definir los logros.** Cada logro necesita una condición concreta que lo
concede —completar un mundo, encadenar días seguidos, resolver sin fallar— y el
XP que otorga. Eso es el catálogo del paso 22, y es diseño de producto: no se
deduce del esquema.

**El ranking: media decisión tomada en el paso 10.** Es del usuario, y es que
**los niños se comparen dentro de su salón**, como motivación. Eso es
exactamente la alternativa que este apartado listaba como amable frente al
ranking público de menores, y ya no es hipotética: la vista `classroom_roster`
de la migración 0015 expone a cada compañero con su **nombre, avatar, XP y
racha**, y sólo a quien pertenece a ese salón o lo tutela. Comparar dentro del
salón es, a partir de ahí, cuestión de pintarlo.

Lo que **sigue sin decidir** son las dos preguntas que quedan:

1. Si además se muestra `leaderboard_weekly`, que clasifica a los niños de toda
   la plataforma entre sí. Que la vista exista no obliga a mostrarla, y el
   argumento original sigue en pie: un ranking público de menores desmotiva a
   los que van últimos, que son los que más necesitan seguir. Para un proyecto
   de grado sobre enseñanza conviene decidirlo y justificarlo en la memoria.
2. Dónde se pinta el XP dentro del salón —columna en la tabla de compañeros,
   cabecera, o el banner que hay que rehacer—. Hoy la tabla del salón no muestra
   XP: el dato llega al store y no se pinta. Es del paso 21.

Y arrastra una arista de privacidad para el **paso 14**: comparar dentro del
salón significa que un menor ve el nombre completo, el XP y la racha de otro.
Comparar y publicar la identidad de un menor son decisiones distintas, y aquí
sólo está tomada la primera.

### 3.3 El contenido sembrado es mínimo, y dos pantallas se contradicen

**EL DISEÑO DEL JUEGO, dicho por el usuario el 2 de septiembre de 2026.** Es lo
único que hay y condiciona el paso 23.1, así que se escribe aquí antes que nada:

- **Tres mundos de diez niveles cada uno**, treinta en total, cada mundo con un
  tema distinto de pensamiento computacional.
- **Codificación por bloques**, y el juego es **3D**.
- **Sólo el mundo 1 está definido:** niveles de cuadrícula donde el personaje va
  del punto A al punto B. Los mundos 2 y 3 siguen siendo concepto.

**De ahí salen tres correcciones a lo que este documento daba por sentado:**

1. **El «10» de la maqueta no era ficción: es el objetivo.** Lo de abajo dice «el
   3 es la verdad; el 10, la ficción», y hay que leerlo con este matiz: el 3 es lo
   que **hay sembrado hoy**, y el 10 es lo que el diseño **quiere**. La maqueta
   acertó por accidente. Faltan veintiún niveles, no tres pantallas que arreglar.
2. **El esquema del «editor de código en el navegador» NO está muerto.** Con
   bloques hay programa: `levels.programming_language` pasa de `'javascript'` a
   los bloques, `starter_code` es la disposición inicial, y `validation_rules`
   puede llevar la rejilla, la salida y la meta del mundo 1. Y **el juego SÍ manda
   un programa**: la disposición de bloques se serializa, así que
   `create_level_attempt(input_submitted_code text)` es **reutilizable**, no
   herencia que retirar. Lo que §3 llama «esquema diseñado para otra cosa» encaja
   mejor de lo que parecía.
3. **La PREGUNTA ABIERTA de §3.2 se reencuadra.** Parte de que el comportamiento
   sólo lo sabe el juego, y por eso la familia B es falsificable. Con bloques **la
   solución es un dato que el servidor puede inspeccionar**: «da tres vueltas
   usando bloques» se comprueba leyendo el programa enviado, no confiando en lo
   que el juego reporte. Buena parte de la familia B pasa a la A. **Es la primera
   cosa que el 23.1 debe mirar** antes de dar por buena la teoría de §3.2.


**La pantalla de selección de niveles es maqueta pura.**
`StudentWorldLevelsModule` no toca Supabase: importa sólo
`components/dashboard/student/worlds/worldsData.ts`, un archivo local con
`totalLevels: 10` escrito a mano y nombres inventados —Plataformas, Saltos,
Secuencias, «Curso de diseño de juegos»—.

De ahí la contradicción visible: la tarjeta del mundo dice `0/3 NIVELES`, que es
el dato **real** de Supabase, y al entrar aparecen **10 niveles falsos**. El `3`
es la verdad; el `10`, la ficción. Conectar esa pantalla al backend es parte del
paso 20 y es más trabajo del que sugería su enunciado.

La siembra tiene **9 niveles en total, tres por mundo**:

| Mundo | Niveles |
| --- | --- |
| Selva Algorítmica | Ruta del Colibrí, Puente Condicional, Ciclo del Río |
| Cordillera Binaria | Eco de Funciones, Mochila de Datos, Sendero Recursivo |
| Costa de Bugs | Ola de Errores, Faro Asíncrono, Tormenta Final |

Por eso la tarjeta de un mundo muestra `0/3 NIVELES`: es el recuento real, no un
error. Pero tres niveles por mundo es contenido de relleno, no un currículo de
pensamiento computacional.

Ampliarlo no bloquea ningún paso técnico y no está en la secuencia, pero sí
condiciona lo que se puede enseñar en una demostración. Decidir cuándo se escribe
el contenido real, y si hace falta una pantalla para administrarlo o basta con
seguir sembrando por migración.

### 3.4 Lo que falta del paso 14, y lo que ya está decidido

**Falta esto, y la lista es el encargo entero:**

1. **La política de privacidad** con los seis puntos del art. 13 del Decreto 1377
   de 2013, su página, y los cuatro enlaces muertos de `home/Footer.tsx:4`.
2. **Tabla de consentimientos append-only** —nunca `update`— con titular, quién
   autorizó, **la versión del texto** y la fecha: el art. 8 obliga a conservar
   prueba, y sin versión no se prueba a qué se consintió.
3. **El acudiente como relación, no como rol.** El art. 12 exige la autorización
   del representante legal, y `tutor` mezcla hoy padres con profesores.
4. **Apodo elegido y proyección doble del roster** —nombre real al tutor, apodo a
   los compañeros—, que hoy enseña `full_name` a otros menores. `username` **no
   sirve** de apodo: el disparador lo saca de `split_part(email, '@', 1)`.

   **El paso 29 no mengua este punto: lo cambia de forma.** `nombre-editable` da
   control sobre **un solo** nombre, el que el tutor y los compañeros ven por
   igual, así que sigue faltando entero el apodo y la proyección doble. Lo que
   cambia es la premisa: **el tutor ya no tiene garantizado el nombre del
   registro**, porque el niño puede reescribirlo. Cuando se diseñe la proyección
   doble, «nombre real» habrá que definirlo —el del registro no se conserva en
   ninguna parte—, y decidir si el tutor ve el nombre vigente, un historial, o un
   campo que el niño no controle.

**Decidido, no se vuelve a discutir:** el **responsable del tratamiento es el
usuario como persona natural** —lo que además le exime del Registro Nacional de
Bases de Datos, que desde el Decreto 090 de 2018 sólo alcanza a sociedades y
entidades con activos sobre 100.000 UVT y a entidades públicas—; el **plazo de
conservación** está en `CONTEXT.md` §2.7; el historial que ve el tutor se cuenta
desde `joined_at` (§3.1); y la comparación entre compañeros se queda (§3.2).

**Por decidir antes de redactar:** el **correo de contacto y el domicilio** que
figurarán en la política. **No pueden ser los personales**: este repositorio es
público y la política se publica con la aplicación.

El texto legal citado se verificó en fuente primaria —Ley 1581 de 2012 art. 7,
Decreto 1377 de 2013 arts. 7, 8, 10, 11, 12, 13 y 15—, pero **la lectura
aplicada la tiene que firmar un humano competente** antes de ir a la memoria.

---

## 4. Al terminar cada paso

1. Marcar aquí el paso como ✅ y anotar el nombre del cambio de OpenSpec.
2. Seguir las reglas de `CLAUDE.md`: `lint`, `test:run` y `build`; actualizar
   `docs/CONTEXT.md` según el tipo de cambio; replicar en `openspec/config.yaml`
   lo que toque a §1.
3. Enumerar rutas explícitas en `git add`. Con varios cambios vivos, el árbol
   casi nunca contiene sólo lo que se está commiteando.
