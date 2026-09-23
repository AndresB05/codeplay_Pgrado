# CodePlay — Hoja de ruta

> **En qué orden se construye el proyecto y quién hace cada parte.**
> Última actualización: **23 de septiembre de 2026**.

**El juego tiene su propia hoja de ruta:**
[`ROADMAP-JUEGO.md`](ROADMAP-JUEGO.md), en cuatro fases. Aquí sólo aparece como
los pasos 20, 21, 22 y 23; el detalle de cómo se construye está allí.

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

Los pasos con enlace tienen su detalle en §2.3: qué se hizo, qué se midió y qué
dejó fuera.

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
| 9 | [Migración de las 4 tablas de salones + RLS + grants](#paso-9) | ✅ | `tablas-salones` + `arreglo-recursion-rls` |
| 11 | ★ [Usuarios de prueba reales y botón «Sin login»](#paso-11) | ✅ | `usuarios-de-prueba` |
| 10 | `classrooms.service.ts` y reescribir `ClassroomsProvider` | ✅ | `salones-persistentes` |
| 12 | Login y registro reales con rol | ✅ | `auth-real` |
| 13 | [Recuperar y cambiar contraseña](#paso-13) | ✅ | `password-recovery` |
| 15 | [Google OAuth](#paso-15) | ✅ | `google-oauth` |
| 28 | ★ [Tres arreglos vivos y la barra de XP](#paso-28) | ✅ | `arreglos-y-barra-xp` |
| 29 | ★ [Nombre editable desde Ajustes](#paso-29) | ✅ | `nombre-editable` |
| 16 | [Persistir la asignación de misiones](#paso-16) | ✅ | `misiones-asignadas` |
| 18 | ★ [Sincronización en vivo (Supabase Realtime)](#paso-18) | ✅ | `sincronizacion-en-vivo` |
| 23 | ★ [Integración del juego — 23.1 hecho, a 23.2 le falta el J13](#paso-23) | 🔄 | 23.1 directo · 23.2 salvo el J13 |
| 17 | [Reportes sobre progreso real](#paso-17) | ✅ | `reportes-de-progreso-real` |
| 31 | ★ [Seguimiento por alumno en el panel del tutor](#paso-31) | ✅ | `avance-por-mundos` |
| 20 | [Pantalla de nivel y puente hacia el juego](#paso-20) | ✅ | P4 |
| 21 | [Progreso y XP desde el juego](#paso-21) | ✅ | `mandar-el-intento` + `migracion-del-xp` + `nivel-explorador` |
| 22 | [Rachas y logros](#paso-22) | ✅ | `rachas-y-logros` |
| 32 | ★ [Renombrar los mundos para que cuadren con el juego](#paso-32) | ✅ | `renombrar-mundos` |
| 33 | ★ [Misiones que el profesor asigna, ligadas al juego](#paso-33) | ✅ | `misiones-jugables` |
| 27.1 | ★ [Despliegue provisional para la prueba](#paso-27-1) | ✅ | **usuario** |
| — | 🔬 [Prueba preliminar](#prueba-preliminar) | ⬜ | — |
| 14 | ★ [Consentimiento del acudiente y política de privacidad](#paso-14) | 🔄 | `invitaciones-sin-correo` + §3.4 |
| 19 | [Invitaciones: enlace canjeable (hecho) y correo real (pendiente)](#paso-19) | 🔄 | `enlace-de-invitacion` + servicio |
| 24 | Retirar la sesión de invitado | ⬜ | — |
| 26 | [Ilustraciones con Gemini](#paso-26) | 🔄 | P6 |
| 25 | ★ [Responsive, accesibilidad y `ErrorBoundary`](#paso-25) | ⬜ | — |
| 30 | ★ [Migración al servidor de la universidad](#paso-30) | ⬜ | — |
| 27.2 | ★ [Despliegue definitivo y URL de demo](#paso-27-2) | ⬜ | — |

### 2.1 Decisiones de orden que conviene no deshacer

**REORDENACIÓN DEL 2 DE SEPTIEMBRE DE 2026, y es la que manda sobre todo lo que
sigue.** La decisión es del usuario y el criterio es uno: **la integración del
juego deja de esperar y todo lo demás se ordena alrededor de ella.**

La secuencia queda en tres tramos:

1. **El 23**, preparar el terreno de la integración.
2. **17, 31, 20, 21 y 22** — lo que sólo puede hacerse con el juego integrado.
   El **31** se añadió el 3-sep-2026 y va junto al 17 por el mismo motivo: los
   dos enseñan al tutor progreso real, y no hay progreso real hasta el 21. Los
   dos se cerraron el 18-sep-2026, con un día de diferencia.
3. **La prueba preliminar**, y detrás **14, 19, 24, 26, 25, 30 y 27**.

**El 17 baja del segundo lugar al tramo del juego, y no es una preferencia.** Sus
reportes tienen que calcularse sobre `user_progress` real, y **nada escribe ahí
hasta el paso 21**, que viene del juego. Hacerlo antes sería volver a maquetar
con datos de ejemplo, que es exactamente lo que ese paso existe para quitar.

**El 23 se parte en dos, y la primera mitad no necesita a nadie.** 23.1 prepara la
web para recibir el juego y **escribe el contrato**: qué manda el juego, en qué
formato y con qué garantía. Eso no pide el juego construido, así que puede
hacerse ya. 23.2 —construir el juego— sí.

> **Actualización del 3-sep-2026.** Esta división se escribió cuando el juego iba
> a ser un proyecto de Unity, y por eso 23.2 aparecía como «el único paso que no
> depende de este repositorio». **Ya no es así**: sin Unity, el juego se
> construye aquí dentro con librerías, no hay que instalar nada y nadie tiene que
> esperar a nadie. Ver [`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) §5.

**23.1 hereda la PREGUNTA ABIERTA de §3.2 y tiene que cerrarla.** No es opcional:
no se puede escribir qué manda el juego al terminar una partida sin haber decidido
cómo verifica el servidor que un logro se consiguió. Antes esa pregunta colgaba
del paso 20; con el 23 delante, le toca al 23.1 y con `/opsx:explore`, que es la
vía que §3.2 ya señalaba.

**LA PRUEBA PRELIMINAR DEJÓ DE SER LOCAL, y con ella se mueve el despliegue.
Decisión del usuario del 18 de septiembre de 2026.** La prueba la hará **un salón
de estudiantes universitarios**, con sus propias cuentas, sobre una aplicación
desplegada. No es lo que esta sección daba por hecho cuando escribió que la hacen
«el usuario y gente cercana con cuentas de prueba».

**El 27 se parte en dos, y la primera mitad sube hasta antes de la prueba.** El
27.1 es un montaje **simple y desechable** sobre Supabase, cuyo único propósito
es que la prueba pueda ocurrir; el 27.2 es el despliegue bueno y sigue detrás del
30, sobre el servidor de la universidad. Partirlo es lo que deja avanzar sin
esperar a nadie.

**Eso obliga a aceptar lo que esta sección evitaba: se despliega dos veces.** El
argumento original —«desplegar sobre Supabase y volver a desplegar sobre otra
cosa es hacer el 27 dos veces»— sigue siendo cierto, y se paga a propósito: el 30
depende de una respuesta que la universidad todavía no ha dado, y hacer que la
prueba espere a esa respuesta es peor que montar dos veces. **Lo que hace barato
el precio es que el 27.1 sea desechable**: si se monta pensando que va a durar,
se paga dos veces de verdad.

**El 14 puede seguir detrás, y el motivo cambió.** Antes era que no había
aplicación desplegada ni datos de terceros. Ahora habrá las dos cosas; lo que
sostiene el orden es sólo una parte del argumento anterior: **son estudiantes
universitarios, mayores de edad**, así que el consentimiento del acudiente —que
es el corazón del paso 14— no aplica.

> **Queda anotado como riesgo asumido, no como descuido.** En la prueba habrá
> **datos personales de terceros** —correo y nombre de gente que no es cercana—
> en una aplicación desplegada, y la política de privacidad no estará publicada.
> De la lista de §3.4, lo que ese escenario haría exigible son los puntos **1**
> (la política y su enlace en el footer, cuyos enlaces muertos ya se quitaron) y **2** (la tabla de
> consentimientos); los puntos 3 y 4 siguen siendo de menores y no se tocan. El
> usuario lo decidió con esto delante el 18-sep-2026. **Si entrara un menor en la
> prueba, esto deja de ser una decisión y pasa a ser una parada.**

**El 25 y el J13 se quedan detrás, y también es decisión suya con la medición
delante.** Lo medido el 18-sep-2026: `StudentRosterTable`, `TeacherSidebar` y
`Sidebar` tienen **cero** clases responsive, **no hay ningún `ErrorBoundary`** en
todo `apps/web/src`, y jugar un nivel descarga **2,1 MB** —634 kB de aplicación
más 1468 kB de editor y escena—. Con un salón entrando desde sus móviles, eso es
lo que la prueba va a encontrarse. **La prueba medirá la mecánica y el panel, no
el acabado**, y conviene decirlo antes y no después de leer los comentarios de
quien la use.

**Lo que NO cambia: el 31 y el 22 siguen antes de la prueba**, donde la secuencia
ya los tenía. Confirmado por el usuario el 18-sep-2026. **El 31 se cerró ese
mismo día**, así que de ese par queda el 22.

**Y una que el despliegue no mueve porque ya estaba resuelta:** el paso 24
—retirar la sesión de invitado— no es un riesgo para el despliegue. Medido sobre
el bundle de producción: el texto «Sin login» **no aparece**, así que la poda por
`import.meta.env.DEV` hace su trabajo y esos botones no llegan a producción.

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

Va delante del **27.2** porque desplegar sobre Supabase y volver a desplegar
sobre otra cosa es hacer el despliegue bueno dos veces. **Lo que ya no impide es
el 27.1**, que es un montaje desechable para que la prueba preliminar exista: ver
arriba.


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

**ESA PREMISA CADUCA CON EL 27.1, y el usuario lo decidió con ello delante el
18-sep-2026.** La prueba preliminar será un despliegue con un salón de
universitarios dándose de alta con sus propios correos: habrá aplicación
desplegada y datos de terceros, así que lo único que sostiene el orden es que
**son mayores de edad** y el consentimiento del acudiente no les aplica. Lo que
sí quedaría exigible —la política de privacidad y la prueba del consentimiento,
puntos 1 y 2 de §3.4— se asume como riesgo, no como olvido. Ver §2.1.

**CADUCADO, y se corrige el 18-sep-2026.** Este párrafo decía que redactar la
política ahora sería hacerlo sobre un esquema que todavía va a cambiar, «el paso
17 conecta el progreso real, el 20 y el 21 traen el juego». **Los tres están
hechos.** El esquema que la política tendría que describir ya existe: el
progreso, los intentos con su programa, y las tres vistas que abren el progreso
de un alumno a quien lo tutela. Lo que sostiene el orden hoy es sólo lo de
arriba —que en la prueba no entran menores—, no que el esquema esté a medias.
Google OAuth (15) tampoco dependía de eso y ya está.

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
| ~~23.2~~ | ~~Instalar Unity y crear el proyecto~~ — **YA NO REQUIERE A NADIE, desde el 3-sep-2026.** Se descartó Unity: el juego se construye con librerías dentro de la aplicación web, así que no hay instalación, ni Git LFS, ni build que generar. La otra pregunta que colgaba de aquí —si el juego vivía en un repositorio propio— también quedó cerrada: **se queda en el monorepo** |
| 17 | `npx supabase db push` de la `0034` y de la `0035`, y el `gen types` detrás — piden credenciales por consola. **Fueron dos pushes y no uno**: el segundo lo obligó un `42501` que sólo se ve consultando la columna `steps` (§2.10 de `CONTEXT.md`). **Aviso para el siguiente `gen types`:** con `>` de PowerShell el archivo sale en **UTF-16**, y hay que reconvertirlo a UTF-8 |
| 30 | **Preguntar a la universidad qué ofrece su servidor** —Postgres y su versión, HTTPS, si dejan correr procesos, si hay algo como Realtime y como OAuth— y conseguir los accesos. Sin esa respuesta el paso no se puede ni planificar (§2.1) |
| 27.1 | Montar el despliegue provisional para la prueba preliminar — simple y desechable, sobre Supabase |
| 27.2 | Configurar el despliegue definitivo |

Fuera de la secuencia, siguen pendientes dos tareas de cuenta que dejó anotadas
el commit `7c84a93`: borrar los secretos `AZUREAPPSERVICE_*` en los ajustes de
GitHub, y reapuntar el Deployment Center de la App Service «gym» al repositorio
que le corresponde. Mientras siga apuntando aquí, Azure puede volver a escribir
su workflow en `.github/workflows/`.

### 2.3 Detalle de cada paso

En el orden de la tabla de §2. Sólo aparecen los pasos que tienen algo que
contar además del título.

#### <a id="paso-9"></a>9 · Migración de las 4 tablas de salones + RLS + grants

**Salió con una recursión de RLS, ver §2.1.**

#### <a id="paso-11"></a>11 · Usuarios de prueba reales y botón «Sin login»

Usuarios de prueba reales y reapuntar el botón «Sin login» — **adelantado, ver
§2.1**.

#### <a id="paso-13"></a>13 · Recuperar y cambiar contraseña

**Las dos mitades verificadas contra la base real**: el cambio desde Ajustes pide
la contraseña actual y la verifica, y el correo de recuperación llegó y su enlace
fijó la nueva.

#### <a id="paso-15"></a>15 · Google OAuth

**La mina era el rol, y se cerró con una regla: el rol se fija en el primer
registro y no cambia nunca.** El disparador crea todo perfil de Google como
`child` porque el alta no puede llevar metadatos; la migración 0018 añade
`is_role_declared` y hace que `set_my_role` rechace tanto si el rol ya se declaró
como si el perfil tiene lazos de salón.

**Verificado contra la base real**, incluido el daño que lo motivó —un niño con
membresía que acababa tutor y fuera de su salón— reproducido paso por paso y ya
no ocurriendo.

**No cierra** registrarse como tutor de entrada: eso sigue abierto y lo cierra el
código de institución.

#### <a id="paso-28"></a>28 · Tres arreglos vivos y la barra de XP

**Adelantado, ver §2.1.** El `username` del disparador ya no aborta el alta
(migración 0019, verificada con tres altas por `curl`), los fallos de
autenticación salen en español por código, el panel dejó de inventar nombre,
correo y racha en **cinco** archivos, y el XP se ve en cuatro sitios con `XPBar`
retintada.

#### <a id="paso-29"></a>29 · Nombre editable desde Ajustes

**Adelantado, ver §2.1.** Un panel compartido que montan las dos pantallas de
Ajustes, con la acción en `AuthProvider` para que las **siete** superficies que
leen `user.fullName` se refresquen sin recargar. La longitud (2–60) se declara una
vez y la heredan el registro y Ajustes; el máximo no existía en ninguna parte.

De paso cerró el panel del tutor, que el paso 28 dejó fuera: cuatro «Sr. Robot» y
un correo inventado.

#### <a id="paso-16"></a>16 · Persistir la asignación de misiones

La migración 0020 cuelga la asignación **del salón**, con `mission_key` como texto
sin clave ajena porque el catálogo sigue en el cliente. El selector de alcance
dejó de ignorarse y el niño ve sólo lo asignado, en dos pantallas.

**NO las hace jugables**: nada puede completar una misión hasta el paso 21, así
que el salón entero sale en «Pendiente» con el motivo escrito en la pantalla, y la
tarjeta del niño no ofrece ningún botón. **Sin tabla de cumplimientos a
propósito**, para no decidir de paso la pregunta abierta de §3.2.

#### <a id="paso-18"></a>18 · Sincronización en vivo (Supabase Realtime)

**No eran «notificaciones»**: no hay campana, ni lista de avisos, ni no leídos, ni
nada que persista un aviso. Son tres pantallas que ya existían y ahora se
actualizan solas: la bandeja del tutor, la pertenencia del niño y sus misiones. La
migración 0021 publica tres tablas en `supabase_realtime`, que existía con las
cuatro operaciones activas y **cero tablas**.

De paso cerró el defecto del `loading` que el paso 13 dejó a medias: **una recarga
disparada desde fuera no declara espera, pero sí la apaga**, en los dos hooks.

Verificado con dos sesiones y con los tres negativos emparejados; cierra además el
caso «tutor contra salón ajeno» del paso 16.

#### <a id="paso-23"></a>23 · Integración del juego

**PARTIDO EN DOS, ver §2.1.**

**23.1 — Preparar el terreno y escribir el contrato: HECHO.** Cerró las tres
decisiones —cómo se verifica un logro (§3.2), si las misiones necesitan tabla
propia (§3), y dónde vive la configuración de un nivel (§3.3)— y escribió
[`docs/CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md). **Ninguna exigió
migración.** De paso midió por primera vez `create_level_attempt` y
`upsert_my_progress`, escritas hacía ocho días y nunca ejecutadas: ver
`CONTEXT.md` §2.7. **No entró el puente ni el contenedor del build** —dependen de
un WebGL que no existe y no se verifican de punta a punta—: siguen en el paso 20.

**23.2 — Construir el juego: REPLANTEADO EL 3-SEP-2026 y CASI CERRADO.** Se
descartó Unity en favor de librerías de JavaScript, así que ya no hay que instalar
nada ni activar Git LFS ni generar un build de WebGL: **el juego pasa a ser parte
de la aplicación web**. Con eso, 23.2 dejó de depender de una persona y de ser lo
único ajeno a este repositorio.

Del roadmap del juego están **hechos el J1 al J12** —los nueve niveles se juegan
desde la base, se guardan y se puntúan— y **queda el J13**, los assets y el diseño
de los tres mundos, que el usuario dejó **para después de la prueba preliminar**
(17-sep-2026). **Aun así tiene ya una primera pasada**, aprobada el 22-sep-2026
para que la prueba no se haga con cubos grises: tablero de Kenney, islas de
decorado generadas por reglas y la pantalla de nivel reordenada. El explorador 3D
entró pero está apagado por su peso, así que se juega con el personaje de cubos.
Detalle en `ROADMAP-JUEGO.md`, «Lo que lleva el J13». El diseño está en [`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) y el
detalle paso a paso en [`ROADMAP-JUEGO.md`](ROADMAP-JUEGO.md).

#### <a id="paso-17"></a>17 · Reportes sobre progreso real

~~Reportes de habilidades~~ **sobre progreso real — HECHO el 18-sep-2026, y el
nombre dejó de describirlo.** El panel no enseñaba datos de ejemplo: enseñaba
**ceros**, y no por falta de cálculo sino de permiso —con sesión de tutor,
`user_progress` y `level_attempts` devolvían **cero filas**—.

Se midió algo que no estaba escrito en ningún sitio y que cambió el alcance: **el
juego tiene cuatro bloques** —avanzar, dos giros y saltar—, sin bucle, sin
condicional y sin función, así que de las cinco competencias que el panel pintaba
**sólo «secuencias» tiene con qué entrenarse**. El usuario decidió **retirar las
cinco barras** y enseñar lo que el dato sostiene: niveles superados, mundos
terminados, eficiencia media, y por explorador **los intentos de cada nivel y los
pasos de cada partida**. Decidió además que **el tutor ve el historial completo,
también el anterior al ingreso** (cierra §3.1) y que **el resumen se ve entre
compañeros, el detalle no**.

Migraciones `0034` y `0035`; la segunda por una trampa que conviene no repetir:
**una vista sin `security_invoker` sortea los permisos de las TABLAS, no el
`execute` de una FUNCIÓN**. Verificado contra la base con la cuenta de `.env`.
**Deja fuera** la navegación mundo a mundo por alumno, que es el 31.

#### <a id="paso-31"></a>31 · Seguimiento por alumno en el panel del tutor

**HECHO el 18-sep-2026, y el trabajo no estaba en la navegación sino en el
dato.** Pedido por el usuario el 3-sep-2026, reducido por el paso 17 —que ya metía
la ficha del explorador— y cerrado con la medición delante.

**Lo que faltaba:** `classroom_level_progress` sale de `user_progress`, así que un
nivel que el alumno nunca empezó no tiene fila y no aparecía. Medido contra la
base con la cuenta de `.env`: la ficha de Axoluk decía **«2 superados de 2
empezados»** y Cordillera Binaria **no salía en ninguna parte**.

El usuario decidió las dos cosas que la fila dejaba abiertas: **crece la ficha que
ya existía** —no una pantalla nueva— y **se enseñan los nueve niveles agrupados
por mundo**, con el intacto nombrado y en cero. Ahora la ficha dice «2 de 9
niveles superados · 0 de 3 mundos terminados» y lista los siete que faltan como
**«Sin empezar»**, que no es lo mismo que «Sin superar».

**El alcance y el explorador pasaron a la dirección**
(`/teacher/panel/:groupId/:studentId`, con `all` cuando el alcance es «Todos»):
recargar ya no pierde la ficha y el enlace se puede pasar. `getCatalogSize()` se
retiró en favor de `getCatalog()`, que trae la lista y no sólo el recuento.

**Sin migración**: lo que faltaba no estaba en el servidor. Verificado con las
tres cuentas del salón de pruebas, cuadrando pantalla y vistas. **Deja fuera**
rachas y logros, que son el 22, y el candado, que sigue para después de la prueba
preliminar.

#### <a id="paso-20"></a>20 · Pantalla de nivel y puente hacia el juego

~~Pantalla de nivel con contenedor, y el puente hacia el juego~~ — **HECHO en el
J7.1**, por decisión del usuario de montarla donde va en vez de ensayarla otra
vez: la ruta `/dashboard/worlds/:worldId/:levelId`, la pantalla con el juego
dentro, la selección de niveles **leyendo de la base** —fuera los diez títulos
inventados y el `find ?? studentWorlds[0]` que metía cualquier uuid real en el
primer mundo de maqueta— y `mapLevelRow` trayendo ya `narrative`, `starter_code`
y `validation_rules`.

**Le queda mandar el intento**, que es el paso 21. Ver `ROADMAP-JUEGO.md` §3.

#### <a id="paso-21"></a>21 · Progreso y XP desde el juego

Escritura de progreso y XP desde el juego — **HECHO el 17-sep-2026, en tres pasos
del roadmap del juego**:

- el **J9** guarda cada partida terminada con su programa, con éxito o sin él;
- el **J10** estrena la puntuación —la calcula el servidor contando el programa,
  migración `202606030033`— y cambia la concesión a la marca de agua;
- y el **J11** pone la barra por tramos de 300 con el **Nivel Explorador** y
  refresca el XP sin recargar.

Los tres verificados jugando contra la base real: ver `CONTEXT.md` §2.7. **Deja
fuera la racha**, que es del 22.

#### <a id="paso-22"></a>22 · Rachas y logros

**HECHO el 20-sep-2026.** No existía nada: medido con la cuenta de `.env`, que
tenía 900 XP y los nueve niveles al 100, había **cero filas en `achievements` y
la racha a cero**, con la tabla puesta desde la `0005` y las columnas desde la
`0002`.

**Veinte logros** sembrados en `achievement_catalog`: nueve de nivel perfecto,
tres de mundo perfecto, uno de todo, cuatro de acción —«Sin mareos», «Intentando
volar», «Eso fue innecesario...» y «¡Auch! mis rodillas»— y tres de racha.
**Todos exigen superar el nivel**, decidido por el usuario.

**La racha cuenta días de Colombia (UTC−5)** y sube sólo con una partida
superada, una vez al día; la guardada **caduca al leerse**, porque sólo se
recalcula al jugar. El aviso estilo Steam sale al terminar la partida, en cola si
son varios. **Las estrellas se retiraron** de las dos tablas, de la RPC y del
cliente.

Seis migraciones, `0036` a `0041`, y **cinco fueron por fallos propios**: las tres
lecciones están en `CONTEXT.md` §2.11. Verificado jugando contra la base: 17 de 20
logros, los cuatro negativos no conceden, y el XP cuadra en 2350. **Sin verificar
contra la base**: que la racha pase de 1 a 2 al día siguiente, que exige esperar.

#### <a id="paso-32"></a>32 · Renombrar los mundos para que cuadren con el juego

**HECHO el 20-sep-2026.** Eran **dos problemas y no uno**: la base decía «Selva
Algorítmica / Cordillera Binaria / Costa de Bugs» y la landing anterior al login
anunciaba **otros tres** —«La Selva de las Secuencias», «El Espacio de los
Bucles», «El Océano Condicional»—, y cinco de esos seis nombres, más las tres
descripciones de la base, prometían bucles, condicionales, funciones, estructuras
de datos y depuración que **los cuatro bloques no permiten**.

Ahora son **Sendero de los Patrones**, **Cordillera de la Abstracción** y
**Encrucijada de las Decisiones**, decidido por el usuario: los nombres apuntan a
los pilares del pensamiento computacional y no a la naturaleza colombiana.
`region_label` pasa de la región al pilar, y los `slug` se renombraron con los
títulos.

**LA TRAMPA, y es la que ahorra la tarde:** el catálogo de logros **copió** los
nombres al sembrarse —los nueve de nivel con `split_part` sobre `levels.title`,
los tres de mundo escritos a mano—, así que renombrar **no lo actualiza solo**; la
migración `0043` lo pone al día, y **lo ya concedido se queda con el nombre viejo
a propósito** (`CONTEXT.md` §2.11). Ninguna clave se rompe: salen del
`sort_order`. Los nueve títulos de nivel no cambian.

Verificado contra la base y en pantalla, incluidas las dos mitades del catálogo:
quien ya los tenía sigue leyendo «Dueño de la Selva», quien no, lee «Dueño del
Sendero».

#### <a id="paso-33"></a>33 · Misiones que el profesor asigna, ligadas al juego

**HECHO el 20-sep-2026.** Cierra el último cabo abierto del contrato §8: «cómo se
relacionan las misiones que un profesor asigna con los niveles del juego». **No
se podían cumplir**, y el panel del tutor lo decía con todas las letras.

El usuario decidió las dos cosas que el cambio no podía tomar solo: **una misión
es un reto sobre los nueve niveles que ya existen** —su condición la comprueba el
servidor leyendo el historial, sin puzles nuevos que diseñar— y **son cuatro**,
pocas a propósito para que sean **cumplibles de punta a punta en la prueba
preliminar**. Las tres de mundo piden **superar**, no la marca máxima, que es lo
que las separa del logro `perfect_world_N`.

**El catálogo se mudó del cliente a la base** (`mission_catalog`) y
`mission_assignments.mission_key` **gana por fin su clave ajena**, cerrando la
deuda que la 0020 dejó escrita; con él se fueron `SkillKey` y
`estimatedMinutes`. `mission_completions` guarda el salón donde ocurrió, y el XP
**se paga una sola vez en la vida**.

**Asignar pone al día a quien ya cumplía**, porque si no el salón saldría entero
en «Pendiente» y eso se lee como un fallo; eso obligó a cambiar el `upsert` por
una RPC `security definer`, **con la garantía escrita dentro de la función**, que
es donde deja de protegerte la política.

Migración `0044`, con `submit_level_attempt` reescrita **partiendo de su texto** y
diffeada antes de aplicar. Verificado contra la base: 1600 XP exactos, cuatro
filas, y los negativos de permiso en 42501. **El aviso «¡Misión cumplida!» lo vio
el usuario jugando** el 21-sep-2026 con Axoluk, contrastado después en la base.

#### <a id="paso-27-1"></a>27.1 · Despliegue provisional para la prueba

**AÑADIDO EL 18-SEP-2026.** Montaje **simple y desechable** sobre Supabase, sólo
para que la prueba preliminar exista: no es el despliegue bueno, que va al
servidor de la universidad detrás del 30. Aparece aquí porque la prueba dejó de
ser local: ver §2.1.

**HECHO el 21-sep-2026** en Vercel (plan Hobby):
`https://codeplay-pgrado-web.vercel.app`, con `vercel.json` en la raíz, las dos
variables de Supabase y las URL de retorno dadas de alta en Supabase. Verificado
por el usuario: registro, Google, recarga y niveles.

#### <a id="prueba-preliminar"></a>🔬 Prueba preliminar

**REPLANTEADA EL 18-SEP-2026: ya no es local ni con gente cercana.** La hace **un
salón de estudiantes universitarios** sobre el despliegue provisional del 27.1,
con sus propias cuentas. Siguen sin entrar menores de fuera —son mayores de
edad—, así que el **consentimiento del acudiente** del paso 14 sigue sin aplicar y
el 14 puede seguir detrás.

**Lo que sí cambia es que habrá datos personales de terceros en un despliegue
público**, y eso queda anotado en §2.1 como riesgo asumido, no como descuido.

#### <a id="paso-14"></a>14 · Consentimiento del acudiente y política de privacidad

**Adelantado en parte y el resto DETRÁS de la prueba preliminar, ver §2.1 y
§3.4.** Ya está aplicado su primer trozo, `invitaciones-sin-correo`, que eliminó
el único sitio donde se guardaban datos de terceros. Lo que falta **se retoma
después de la prueba preliminar, y en todo caso antes del primer usuario real**.

Hereda dos decisiones ya tomadas: el tutor ve el historial del niño (§3.1) y los
compañeros se ven entre sí nombre, XP y racha (§3.2).

#### <a id="paso-19"></a>19 · Invitaciones por correo reales y enlace canjeable

**PARTIDO EN DOS, ver §2.1.**

**Mitad A hecha:** el tutor genera un enlace canjeable, lo comparte por donde
quiera, y quien lo abre entra al salón **sin pasar por la bandeja**; el token
sobrevive el registro, incluida la vuelta por Google. La purga por `expires_at`
entró desde el primer día, y **ninguna tabla ganó columna de correo**: por eso
esta mitad esquiva entera la decisión de privacidad de §3.4.

**Mitad B pendiente:** el envío real, que necesita **servicio de correo
contratado** (§2.2).

#### <a id="paso-26"></a>26 · Ilustraciones con Gemini

**Va ANTES del 25, ver §2.1**: hacer responsive un diseño que el apartado gráfico
va a cambiar es hacerlo dos veces.

**Cambiado de Higgsfield a Gemini el 21-sep-2026**: Higgsfield entregó vertical
dos veces lo que se pidió panorámico. El usuario genera cada imagen con su dibujo
de referencia del leopardo, y la sesión escribe el prompt midiendo antes el hueco
y la integra en WebP desde `src/assets/brand/`.

**Casi cerrado el 23-sep-2026.** Ya tienen ilustración: el logo y la pestaña, el
hero, las tres portadas de mundo y el tutor en la portada, el panel del login, las
tarjetas de rol y el formulario del registro, la cabecera y las tarjetas de mundo
del niño, los tres avatares elegibles del niño —con su selector en Ajustes—, los
tres grandes trofeos y el avatar del tutor. **Queda un hueco: la imagen de los
nueve niveles** (`StudentWorldLevelsModule.tsx`), con una pregunta abierta para
el usuario —una por nivel o una por mundo—. Los logros normales no tienen hueco de
imagen. Ver `CONTEXT.md` §3 → P6.

#### <a id="paso-25"></a>25 · Responsive, accesibilidad y `ErrorBoundary`

**Detrás del 26 a propósito.** **Medido** al planificarlo: cero clases
`sm:`/`md:`/`lg:` en las pantallas clave, `w-[262px] shrink-0` duplicado en
`Sidebar.tsx:134` y `TeacherSidebar.tsx:66`, y ningún `ErrorBoundary` en todo
`apps/web/src`. Hereda además `/invite/:token` del paso 19, que es la pantalla con
más probabilidad de abrirse en un móvil. Ver `CONTEXT.md` §4.4.

**Adelantado en parte el 21-sep-2026, con las correcciones previas al
despliegue** (`CONTEXT.md` §2.12): **el `ErrorBoundary` ya existe**, por encima
del router, y la barra lateral se pliega en los dos roles. Algunas pantallas
nuevas —mundos, trofeos— ya se reordenan por anchura. **Lo que sigue pendiente es
lo gordo**: el repliegue del panel para móvil y la accesibilidad.

#### <a id="paso-30"></a>30 · Migración al servidor de la universidad

**Alcance por decidir, ver §2.1.** Supabase fue para probar funcionalidades con
usuarios; lo definitivo va al servidor de la universidad. **Qué se mueve depende
de lo que ofrezcan**, y eso se pregunta antes de planificarlo.

#### <a id="paso-27-2"></a>27.2 · Despliegue definitivo y URL de demo

Va detrás del 30 porque el destino bueno es el servidor de la universidad, no
Supabase. Lo que el 27.1 monte para la prueba es desechable y no condiciona a
éste.

---

## 3. Cabos sueltos detectados

Cosas descubiertas durante la ejecución que no estaban previstas y no deben
perderse:

| Hallazgo | Dónde se resuelve |
| --- | --- |
| El invariante «un alumno, un salón» **ya vive en el modelo** desde el paso 9 —restricción, índice parcial y política—, y desde el paso 10 el store tampoco lo contradice: `requestJoin()` comprueba la pertenencia y la solicitud pendiente antes de escribir | Cerrado en el paso 10 |
| `levels` guarda `starter_code`, `validation_rules` y `programming_language`: el esquema se diseñó para un editor de código en el navegador | **Cerrado en el paso 23.1: se reinterpretan**, no se amplía el esquema. `validation_rules` lleva la definición del puzle, `starter_code` la disposición inicial de bloques y `programming_language` la versión del formato |
| ~~No existe catálogo de logros: `achievements` registra los concedidos a cada niño, no los posibles con sus condiciones~~ **CERRADO en el paso 22**: `achievement_catalog` con veinte logros, y la sala de trofeos enseña los conseguidos y los que faltan | Cerrado en el paso 22 |
| ~~**El progreso no sabe nada de salones**, así que al aceptar a un alumno el tutor pasará a ver *todo* su historial, incluido el anterior al ingreso~~ **CERRADO en el paso 17, y no por accidente**: el usuario lo decidió el 18-sep-2026 con el caso real delante —1 de los 9 niveles de la cuenta de pruebas es anterior a su ingreso—. Se muestra todo, `joined_at` no recorta nada y la fecha sigue guardada por si alguna vez se acota | Cerrado en el paso 17. Lo hereda el 14, ver §3.1 |
| **El XP casi no tenía superficie en la interfaz.** El paso 28 le dio cuatro —barra lateral, barra superior y la tabla de seguimiento en sus dos vistas—, con `XPBar` retintada al tema de selva y un máximo provisional. Lo que quedaba abierto no era dónde se ve, sino que **nada lo escribía**. **Cerrado en el paso 21**: el juego lo escribe desde el 17-sep-2026, y la barra va por tramos de 300 con el Nivel Explorador | Superficie cerrada en el paso 28; la escritura, en el 21 |
| **EL JUEGO TIENE CUATRO BLOQUES, y eso acota lo que se puede premiar.** Son avanzar, girar a la izquierda, girar a la derecha y saltar: no hay bucle, ni condicional, ni función. Medido el 18-sep-2026 en `game/blockTypes.ts`, en `FLYOUT_BLOCKS` y en los 28 intentos guardados, donde no aparece ningún otro tipo. Fue lo que retiró las cinco barras de habilidades en el paso 17 —cuatro de las cinco no tenían con qué entrenarse—, y **el paso 22 hereda la misma frontera**: «da tres vueltas sobre tu propio eje usando bloques» se puede premiar, pero nada que pida repetir o decidir. O el catálogo se ciñe a los cuatro bloques, o el juego gana bloques primero | Paso 22, y ver `CONTEXT.md` §2.10 |
| ~~**PREGUNTA ABIERTA:** cómo verifica el servidor que un logro se consiguió~~ **CERRADA en el paso 23.1.** El juego nunca nombra un logro: manda el intento y el servidor concede, leyendo el programa enviado y el historial. Con eso queda **un solo bit confiado al cliente** —`is_success`—, que es el mismo del que ya colgaba el XP por completar un nivel. La raya que abarata todo: inspeccionar el programa es una condición `jsonb`; ejecutarlo contra la rejilla sería un intérprete de bloques en plpgsql, y queda fuera | Cerrada en el paso 23.1. Ver §3.2 y el contrato |
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
| **Quien escucha sin sesión sabe que algo cambió, aunque no sepa qué.** Con la publicación puesta, una suscripción con la clave anónima recibe el **sobre vacío** de cada cambio en las tres tablas —sin columnas, sin identificadores; medido, no razonado—. Hoy es ruido, porque la base tiene un salón de pruebas y nada más. **Desplegada y con salones reales dentro, esa cadencia pasa a ser telemetría de uso** —cuánta actividad hay y cuándo— visible para cualquiera, porque la clave es pública por diseño. No cambia la decisión del paso 18; se anota para que entonces no se descubra desde cero, y la salida sigue siendo `realtime.broadcast_changes()` desde disparadores. **Y esa salida ganó un segundo motivo el 18-sep-2026**: es también la única forma de que el panel del tutor se mueva en vivo. Publicar `user_progress` no sirve —medido: Realtime entrega un cambio a quien la política de esa tabla deja leer la fila, y la suya sólo alcanza a su dueño—, así que quien quiera tiempo real ahí tendrá que difundir por disparador de todos modos. Las dos cosas se resuelven de una vez | Paso 27 |
| **El ternario de dos ramas NO se repitió, y el aviso queda cerrado.** El paso 19 reconstruyó la lista de enlaces derivando el estado de **dos** datos —`status` y `expires_at`—, con sus tres salidas: activo, usado y caducado. Comprobado en pantalla con datos reales, y sólo el activo ofrece «Copiar» y «Retirar» | Cerrado en el paso 19 |
| **La purga de invitaciones depende de que el tutor entre a mirar.** El panel borra las caducadas de sus salones al listarlas, con la política de la 0013, así que un salón cuyo tutor no vuelve conserva filas vencidas. **No es riesgo de seguridad** —el enlace está muerto por `expires_at`, y eso lo comprueba la RPC, no el borrado— ni de privacidad —desde la 0016 la fila no lleva el dato de ningún tercero—. Lo que queda es una tabla que crece. La salida es `pg_cron`, que exige activarlo en el panel y por tanto **al usuario** | Paso 27, con lo demás que sólo tiene sentido desplegado |
| **`invitations.expires_at` no lo acota ningún `check`**, así que quien inserta puede **alargar** la caducidad tanto como acortarla, y entonces la purga no se la lleva nunca. Los catorce días los sostienen el `default` de la columna y que el cliente no mande el campo, **no el esquema**. Hoy sólo el tutor del salón puede insertar, y sólo en el suyo, así que el daño se lo hace a sí mismo | Anotado; material para el paso 14 y para la mitad B del 19. Detalle en `CONTEXT.md` §2.7 |
| **Las misiones se persisten desde el paso 16, y lo que NO cierra conviene tenerlo escrito.** La migración 0020 cuelga la asignación del **salón** —no del tutor: el niño se liga a un salón, no a una persona—, el selector de alcance dejó de ignorarse y el niño ve sólo lo asignado. **Siguen sin ser jugables**: nada puede empezar ni completar una misión, así que la tarjeta del niño no ofrece botón y el salón entero sale en «Pendiente» con el motivo a la vista. **El catálogo sigue siendo local y sin clave ajena a `levels`**: son las mismas cinco entradas `m1`…`m5` de `teacher/classroomsData.ts`, ahora con su premio en XP, y `mission_key` es texto libre porque no hay tabla a la que apuntar. Y **no se creó tabla de cumplimientos** a propósito, para no decidir de paso la PREGUNTA ABIERTA de §3.2 | Persistido en el paso 16. **CUMPLIRLAS NO TIENE PASO ASIGNADO, comprobado el 2-sep-2026:** las filas 20, 21 y 22 no mencionan las misiones ni una vez, y el 21 escribe progreso de **niveles**, que no las alcanza —`mission_key` no tiene clave ajena a `levels` porque una misión no es un nivel—. **El dueño natural es el 22, y el motivo lo puso el usuario:** una misión y un logro son el mismo objeto con la misma maquinaria, y lo único que los separa es la puerta de entrada —el logro se saca en cualquier momento, la misión sólo si el tutor la asignó—. El 22 construye justo esa maquinaria: el catálogo y la lógica de conceder. **DECIDIDO EN EL 23.1: sí hace falta tabla propia, y el motivo no era el que se suponía.** `unique (user_id, achievement_key)` significa «una vez en la vida», que es correcto para un logro y accidental para una misión: la propia 0020 declara `unique (group_id, mission_key)` porque la misma misión en dos salones es lo normal, y reasignarla a otra cohorte también lo es. Misma maquinaria de concesión, **cardinalidad distinta**. Y el cumplimiento debe **guardar el salón, no derivarlo** —derivarlo por `class_memberships` borraría lo cumplido de los informes en cuanto el niño cambie de salón, que es la lección de §3.1—. **Lo que no cambió es el contrato:** como el juego no nombra ni logros ni misiones, esta decisión no le exige nada, al revés de lo que esta fila daba por hecho. **Queda un precedente para el 22:** `mission_key` no apunta a `levels` y las misiones no son ninguno de los niveles sembrados, así que antes de construir la maquinaria hay que decidir **qué es una misión en términos de contenido**; mientras no lo sea, nada puede cumplirla | El 22 lo construye, con tabla propia; el 23.1 lo decidió |
| ~~**DÓNDE VIVE EL JUEGO ESTÁ SIN VALIDAR**~~ **CERRADO EN LA SOCIALIZACIÓN DEL 3-SEP-2026: el juego se queda en este monorepo.** La pregunta se planteó porque encender Git LFS aquí habría obligado a **todo el equipo** a instalarlo, y en un repositorio aparte ese requisito recaería sólo en quien hiciera el juego. **La misma reunión disolvió el argumento**: al descartar Unity no hay escenas, ni prefabs, ni `Library/`, ni binarios de motor —sólo unos pocos modelos `.glb` de kilobytes—, así que LFS deja de hacer falta y el monorepo deja de tener coste. La decisión que sí queda abierta es más pequeña y es de estructura, no de repositorio: si el juego va en `packages/game/`, que conserva la frontera que describe el contrato, o en `apps/web/src/game/`, que es más simple. Ver [`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) §6 | Cerrado el 3-sep-2026. **Y de paso caen las dos tareas pequeñas que colgaban de aquí**: `apps/web/public/` ya no hace falta —no hay build que dejar ahí— y las reglas de Unity de `.gitattributes` se quedan comentadas para siempre, o se borran |

### 3.1 Historial previo al ingreso en un salón — CERRADA EL 18-SEP-2026

> **Decisión del usuario: el tutor ve el historial completo, sin recortar por
> `joined_at`.** De las tres opciones que este apartado planteaba —mostrar todo,
> mostrar sólo desde la fecha de ingreso, o preguntar— se eligió la primera, y
> con un añadido suyo: que el panel enseñe además **cuántos intentos costó cada
> nivel y cuántos pasos tuvo cada partida**.
>
> **El salón de pruebas ya contenía el caso**, así que la decisión se tomó con el
> número delante: el niño se unió el 4-sep y su primer intento fue el 3-sep, de
> modo que 1 de sus 9 niveles y 2 de sus 28 intentos son anteriores al ingreso.
>
> **Lo que hereda el paso 14 es exactamente esto**, y es lo que el consentimiento
> del acudiente tendrá que recoger. Y un detalle medido por si alguna vez se
> decide acotar: el XP y la racha son **contadores sin fecha** en `profiles`, así
> que un corte por `joined_at` dejaría «900 XP» junto a «8 niveles» mientras no
> se recalculen desde `user_progress`.
>
> El texto de abajo se conserva como quedó escrito antes de decidir.

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
el banner. ~~Lo que el paso 21 hereda ya no es dónde mostrarlo, sino el
**máximo**~~ — **lo cerró el J11**: no hay máximo, hay tramos de 300 y un **Nivel
Explorador** que sube al llenarlos. `PROVISIONAL_MAX_XP` ya no existe, y el paso
22 hereda el catálogo de logros, no el techo de la barra.

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
| Jugar un nivel | Hasta **100 por nivel**, según la **eficiencia** de la solución |
| Conseguir un logro | Variable según el logro: puede ser mucha o poca |

**REESCRITO EL 3-SEP-2026, y ya no es «poca y mayor cuanto más difícil el
mundo».** El detalle está en [`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md) §3; lo
que hay que saber aquí es qué trabajo implica:

- **La XP de un nivel se completa hasta su tope, no se acumula.** 80 al primer
  intento y 20 al segundo si lo mejora, nunca más de 100. Con tres niveles por
  mundo salen 300 por mundo y **900 en total**, que es el máximo del juego.
- ~~**Eso exige una migración**~~ — **hecha en el J10**, la `202606030033`
  (17-sep-2026). `upsert_my_progress` concedía la XP una sola vez, en la
  transición a completado, así que un segundo intento perfecto sumaba cero; ahora
  concede la diferencia de marca. Medido jugando: 87, +13 y cero.
- **La pieza que lo resuelve ya existe:** `best_score` está acotado de 0 a 100 y
  nunca baja, así que la regla es conceder
  `(marca nueva − marca anterior) × tope ÷ 100`. Sin columnas nuevas.
- **Y faltaba el eslabón de en medio, que no estaba escrito en ninguna parte:**
  cómo un número de pasos se vuelve una puntuación de 0 a 100. Lo eligió el
  usuario el 17-sep-2026 después de ver qué daba cada candidata a los nueve
  programas resueltos a mano: **`redondeo(100 × óptimo ÷ pasos)`**, con suelo de
  uno para que resolver siempre pague algo. La tabla de las tres está en
  `DISENO-DEL-JUEGO.md` §3.
- ~~**Hay que igualar `levels.xp_reward` a 100**~~ — **hecho en el J7.1**, con la
  migración `202606030023`. Estaban sembrados con **100, 120 y 140** en la Selva,
  **180, 200 y 240** en la Cordillera y **150, 210 y 260** en la Costa; los nueve
  valen 100, comprobado contra la base. *(Esta línea listaba siete valores para
  nueve filas: le faltaban el 150 y el 210.)*
- ~~**Y hay que rehacer la barra de XP del panel del niño**~~ — **hecha en el
  J11** (17-sep-2026). Marca **tramos de 300 XP** —lo que da un mundo entero
  perfecto—, calculados en vez de enumerados:
  `tramo = parte entera de (XP ÷ 300) + 1`, y el tramo se llama **Nivel
  Explorador** por decisión del usuario, para no chocar con los niveles del juego.
  **No lleva techo a propósito**: los logros y las misiones también reparten XP y
  no se sabrá cuánta hasta que exista el catálogo del paso 22, así que la barra
  sigue funcionando cuando esa XP aparezca, sin volver a tocarla.

  El J11 arregló además algo que no estaba escrito: **el XP no se refrescaba sin
  recargar**. Medido antes de tocarlo —la base en 693 y la pantalla en 683—, y
  hoy el panel se pone al día con el total que devuelve la partida.

**La puntuación la calcula el servidor**, contando el programa de bloques que
recibe, no creyéndose una que le manden. No es desconfianza: el servidor ya tiene
que leer ese programa para conceder logros, así que puntuar ahí evita escribir la
misma lógica dos veces.

**Hecho en el J10**, con dos funciones de SQL sobre el `jsonb` del programa. El
cliente calcula además la suya para poder enseñarla al instante, y la guarda en
`metadata` al lado de la del servidor: en las cinco partidas de la verificación
coincidieron.

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

#### Cómo se verifica que un logro se consiguió: DECIDIDO en el paso 23.1

**Ya no es una pregunta abierta.** El detalle está en
[`CONTRATO-DE-INTEGRACION.md`](CONTRATO-DE-INTEGRACION.md) §5; aquí queda el
razonamiento, porque es material de la memoria del proyecto.

**La regla, en una frase: el juego nunca nombra un logro.** Manda el intento —el
programa de bloques, si lo resolvió, cuánto tardó— y el servidor decide qué ganó
ese intento. El juego no sabe qué logros existen. Ésa es la frontera que hace que
añadir un logro nuevo **no obligue a volver a publicar el juego**, que es la
misma exigencia de escalabilidad de §3.3.

**La raya que abarató la decisión** es la que §3.3 punto 3 insinuaba y no
separaba. La familia B de la tabla de abajo eran en realidad dos cosas de coste
muy distinto:

| Qué se comprueba | Cómo | Coste |
| --- | --- | --- |
| **Qué escribió el niño** — «usa un bucle», «≤ N bloques», «tres giros» | Condición `jsonb` sobre el programa enviado, dentro de la RPC | Una condición en SQL |
| **Qué ha hecho hasta ahora** — primer nivel, mundo completo, racha | Lectura de `user_progress` y `level_attempts` | Ya se podía |
| **Que el programa de verdad resuelva el nivel** | Ejecutarlo contra la rejilla, o sea un intérprete de bloques en plpgsql | Un proyecto propio. **Fuera** |

Las dos primeras **no son falsificables**: el servidor lee el dato en vez de
fiarse de quien lo manda. Buena parte de lo que §3.3 llamaba familia B cae ahí.

**Lo que queda confiado al cliente es un solo bit: `is_success`.** Y conviene
decirlo entero en vez de presentarlo como un defecto de los logros: **ese bit ya
sostenía el XP por completar un nivel**, medido —el servidor acepta el `success`
que le manden—. Los logros no añaden una vía de trampa nueva; hacen visible la
que ya había. La mitigación que sí se aplica es la que este apartado ya proponía:
un logro que dependa de un nivel exige **un intento con éxito de ese nivel**.

Y sigue en pie el argumento de proporción: plataforma para niños, sin dinero de
por medio, y quien hace trampa se engaña a sí mismo. El único motivo real de
preocupación era el ranking, y ya está acotado al salón.

**Lo que hace posible todo esto es que el programa se serialice en JSON**, para
que `submitted_code::jsonb` funcione dentro de la RPC. Es la línea irreversible
del contrato: si el juego manda un formato opaco, la primera fila de la tabla
desaparece y **ninguna migración posterior lo arregla sin volver a publicar el
juego**.

**Y una consecuencia del esquema que zanja el «quién concede», medida el
2-sep-2026:** `achievements` **no tiene `grant insert` para ningún rol** —ni
autenticado—, así que la única puerta abierta es una función `security definer`.
No hubo que elegir el diseño seguro: es el único que el esquema permite.

<details>
<summary>La tabla de dos familias que este apartado traía antes</summary>

| Familia | Quién concede | Falsificable |
| --- | --- | --- |
| **A** — derivables del progreso: primer nivel, mundo completo, racha de N días, N niveles | El servidor, leyendo `user_progress` y `level_attempts`. Nadie reporta nada | No |
| **B** — comportamiento dentro del juego | Unity lo reporta al terminar | Sí, desde la consola |

Se queda como registro: el reencuadre consistió en partir la B en dos y llevarse
la mitad estructural a la A.

</details>

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

**EL DISEÑO DEL JUEGO YA TIENE DOCUMENTO PROPIO:**
[`DISENO-DEL-JUEGO.md`](DISENO-DEL-JUEGO.md), escrito tras la socialización del
**3 de septiembre de 2026**. Es la fuente de verdad; aquí queda sólo lo que
cambia el orden del trabajo.

**Lo que dijo esa reunión, y corrige lo que este apartado daba por bueno:**

- **Tres niveles por mundo, nueve en total** —no diez y treinta—, para que el
  alcance sea abarcable por una sola persona.
- **Sin Unity.** El juego se hace con librerías de JavaScript dentro de la
  aplicación web. Sigue siendo **3D** y tiene que **cargar assets**.
- **Los tres mundos están definidos**, uno por pilar: algoritmos y
  reconocimiento de patrones, descomposición y abstracción, y evaluación de
  problemas. Ya no hay dos mundos «concepto».
- **La mecánica es la misma en los tres**: personaje de A a B por cuadrícula con
  bloques, al estilo *Lightbot*.

<details>
<summary>Lo que este apartado decía el 2 de septiembre, un día antes</summary>

- **Tres mundos de diez niveles cada uno**, treinta en total, cada mundo con un
  tema distinto de pensamiento computacional.
- **Codificación por bloques**, y el juego es **3D**.
- **Sólo el mundo 1 está definido:** niveles de cuadrícula donde el personaje va
  del punto A al punto B. Los mundos 2 y 3 siguen siendo concepto.

</details>

**EL PROYECTO TIENE QUE ESCALAR**, y lo pidió el usuario el mismo día: en el
futuro puede haber más mundos y más niveles, así que nada debe darlos por fijos.
**La base ya lo cumple** —`worlds` y `levels` son tablas con `sort_order`, y
añadir contenido es insertar filas—, pero eso deja **una decisión al 23.1 que
decide si el resto escala o no**:

> **¿Dónde vive la configuración de un nivel: la rejilla, la salida, la meta?**

En la base (`levels.validation_rules`, que ya es `jsonb`) añadir un nivel es
**insertar una fila**. Cocido dentro del juego, añadir un nivel es **volver a
compilar y desplegar**. La base puede ser todo lo escalable que se quiera: si los
niveles están dentro del juego, el proyecto no escala. Sigue valiendo igual sin
Unity: lo que cambió es el motor, no dónde tiene que vivir el contenido.

**DECIDIDO EN EL 23.1: en la base, y las tres columnas se reparten el trabajo.**
`validation_rules` lleva la definición del puzle, `starter_code` la disposición
inicial de bloques, y `programming_language` —hoy `'javascript'` en las nueve
filas y **sin `check` que lo ate**— se reaprovecha como **versión del formato de
serialización**. Ese último es el campo de versionado que la decisión de §3.2
necesitaba para poder leer programas cuando el formato de bloques evolucione, y
salió gratis.

**Con un límite que hay que respetar y que está medido:** `validation_rules`
**se lee sin sesión** —`grant select ... to anon` y la política de la 0009—. Ahí
va la definición del puzle, **nunca su solución ni la condición de un logro
sorpresa**; esas van al catálogo del 22, que no necesita ser público. A favor de
la decisión, la siembra ya tiene esa forma: los nueve niveles de la 0012 llevan
`{"goal":"reach_flower","maxSteps":6}` y similares.

**Sin migración.** Las tres columnas existen; lo que cambia es su contenido, y
eso lo escribe el paso 20 o el 21 cuando haya juego. Renombrar
`programming_language` hoy etiquetaría como bloques un `starter_code` que sigue
siendo JavaScript.

De ahí dos reglas para el contrato del 23.1:

- **Describe estructura, no inventario.** Nunca «hay tres mundos de diez
  niveles», sino «un mundo contiene N niveles ordenados». Un contrato que cuenta
  el contenido hay que reescribirlo cada vez que se añade contenido.
- **El juego no trae la lista de niveles: la recibe.** Debe cargar el nivel que se
  le indique con la configuración que se le pase; si la lleva dentro, cada nivel
  nuevo obliga a un build nuevo.

Lo rígido que queda hoy es maqueta y lo sustituye el paso 20:
`worlds/worldsData.ts` con `totalLevels: 10` escrito a mano, y
`StudentWorldsModule.tsx:251`, que fija la dificultad a `'easy'`.

Y esto **reabre con más filo la pregunta del final de este apartado**: si el
contenido escala, sembrar por migración deja de bastar y hace falta una pantalla
para administrarlo.

**De ahí salen tres correcciones a lo que este documento daba por sentado:**

1. ~~**El «10» de la maqueta no era ficción: es el objetivo.**~~ **VUELVE A SER
   FICCIÓN, y esta vez del todo.** El 2 de septiembre esto decía que faltaban
   veintiún niveles porque el diseño quería diez por mundo. La reunión del día
   siguiente lo bajó a **tres por mundo**, así que **el 3 vuelve a ser la única
   verdad** y además ya está sembrado: no falta ningún nivel por crear, sólo
   resembrar sus temas para que encajen con los tres pilares. Lo que sigue
   sobrando es el 10 de la maqueta.
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

La siembra tiene **9 niveles en total, tres por mundo**. Esta tabla estaba **dos
veces vieja** y se corrigió el 20-sep-2026: sus nueve títulos eran los de la 0012,
que el J7 reescribió nivel a nivel, y sus tres mundos eran los de antes del
cambio `renombrar-mundos`. Lo que hay hoy en la base:

| Mundo (pilar) | Niveles |
| --- | --- |
| Sendero de los Patrones (algoritmos y patrones) | Siempre adelante, Camino con curvas, La escalera |
| Cordillera de la Abstracción (descomposición y abstracción) | Salta y sube, El gran rodeo, La torre |
| Encrucijada de las Decisiones (evaluación de problemas) | Dos caminos, El faro, Muchos caminos |

**Los mundos se renombraron para que dejaran de prometer lo que los cuatro
bloques no permiten** —bucles, condicionales, funciones, estructuras de datos y
depuración—, y con ellos la landing, que anunciaba tres nombres que no existían
en ninguna parte. El detalle está en `CONTEXT.md` §2.6.

Por eso la tarjeta de un mundo muestra `0/3 NIVELES` mientras no se juegue: es el
recuento real, no un error. Pero tres niveles por mundo es contenido de relleno,
no un currículo de pensamiento computacional.

Ampliarlo no bloquea ningún paso técnico y no está en la secuencia, pero sí
condiciona lo que se puede enseñar en una demostración. Decidir cuándo se escribe
el contenido real, y si hace falta una pantalla para administrarlo o basta con
seguir sembrando por migración.

### 3.4 Lo que falta del paso 14, y lo que ya está decidido

**Falta esto, y la lista es el encargo entero:**

1. **La política de privacidad** con los seis puntos del art. 13 del Decreto 1377
   de 2013, su página, y su enlace en `home/Footer.tsx`. Los cuatro enlaces
   muertos que había —Privacidad, Términos, Contacto, Ayuda— se quitaron antes
   de la prueba del 27.1; al publicar la política vuelve el suyo.
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
conservación** está en `CONTEXT.md` §2.7; y la comparación entre compañeros se
queda (§3.2).

**CORREGIDO EL 18-SEP-2026: el historial que ve el tutor NO se cuenta desde
`joined_at`.** Esta lista decía lo contrario, y se escribió antes de que la
decisión se tomara de verdad. El paso 17 la cerró y el usuario eligió lo opuesto:
**el tutor ve el historial completo**, incluido lo anterior al ingreso, sin
recortar por esa fecha (§3.1). Es más de lo que esta lista daba por hecho, así
que **la política tendrá que decirlo**, no darlo por acotado.

**Y el punto 4 gana un dato del paso 17:** entre compañeros ya no se ven sólo
nombre, XP y racha, sino también **el mundo en el que anda cada uno y cuándo jugó
por última vez** —decisión del usuario del 18-sep-2026, con el precedente de la
0015—. El detalle por nivel e intento sigue siendo sólo del tutor. Lo que la
proyección doble tenga que esconder incluye ahora esas dos columnas.

**Por decidir antes de redactar:** el **correo de contacto y el domicilio** que
figurarán en la política. **No pueden ser los personales**: este repositorio es
público y la política se publica con la aplicación.

El texto legal citado se verificó en fuente primaria —Ley 1581 de 2012 art. 7,
Decreto 1377 de 2013 arts. 7, 8, 10, 11, 12, 13 y 15—, pero **la lectura
aplicada la tiene que firmar un humano competente** antes de ir a la memoria.

### 3.5 Fecha límite para las misiones — CERRADA EL 21-SEP-2026

**Hecha, y la respuesta fue «bloquea, con segunda oportunidad».** Pedida por el
usuario tras probar el candado: al asignar, «Sin fecha límite» u «Hasta el» un
día de Colombia. Vencida, la misión deja de verse y de poder cumplirse —la oculta
la política de lectura, sin nada que corra a medianoche—, y **reasignarla le pone
la fecha nueva**. Quien ya la cobró no vuelve a cobrar. Migración `0047`; el
detalle en `CONTEXT.md` §2.8, «Fecha límite, y la segunda oportunidad». **Sin
verificar con sesión**: asignar con fecha, vencer y reasignar desde la interfaz.

Lo que sigue es el planteamiento que se escribió antes de hacerla, y se conserva
porque explica la decisión.

Propuesto por él mismo el 20-sep-2026 mientras se decidían las misiones, y
**apartado a propósito** del paso 33 para no ampliarlo: primero que se puedan
cumplir, el plazo después. Se retoma **tras la prueba preliminar**.

Lo que habría que decidir, y es una sola pregunta con consecuencias distintas:

> **¿La fecha bloquea, o sólo informa?**

- **Si sólo informa**, el niño ve «quedan 3 días» y el tutor distingue cumplida a
  tiempo de cumplida fuera de plazo; cumplirla tarde **sigue contando y sigue
  pagando**. No castiga al que se enfermó una semana.
- **Si bloquea**, pasada la fecha ya no se puede cumplir ni cobrar, y el tutor
  tiene que reasignar para dar otra oportunidad.

Lo que costaría es pequeño y está acotado: una columna `due_date` en
`mission_assignments` —que hoy no tiene `update`, así que cambiar la fecha
exigiría concederlo o borrar y reasignar—, el control en el panel del tutor, y el
rótulo en la tarjeta del niño. **Si bloquea**, además una comprobación dentro de
`award_missions`.

---

## 4. Al terminar cada paso

1. Marcar aquí el paso como ✅ y anotar el nombre del cambio de OpenSpec.
2. Seguir las reglas de `CLAUDE.md`: `lint`, `test:run` y `build`; actualizar
   `docs/CONTEXT.md` según el tipo de cambio; replicar en `openspec/config.yaml`
   lo que toque a §1.
3. Enumerar rutas explícitas en `git add`. Con varios cambios vivos, el árbol
   casi nunca contiene sólo lo que se está commiteando.
