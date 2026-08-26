# CodePlay — Hoja de ruta

> **En qué orden se construye el proyecto y quién hace cada parte.**
> Última actualización: **26 de agosto de 2026**.

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

Revisar la propuesta, no solo validarla. Cuatro comprobaciones que ya han
evitado problemas reales:

1. Que el `.openspec.yaml` declare `skip_specs` **sólo** si de verdad no hay
   deltas, y que no exista una carpeta `specs/` con requisitos inventados.
2. Que las tareas incluyan verificación final con `lint`, `test:run` y `build`.
3. Que el alcance no se desborde más allá de lo encargado.
4. Que las herramientas que usan las verificaciones **existan en la máquina**.
   Ya pasó: una tarea verificaba con `gh`, que no está instalado.

---

## 2. Secuencia

Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente
★ = añadido durante la planificación, no estaba en §3 de `CONTEXT.md`

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
| 9 | Migración de las 4 tablas de salones + RLS + grants | ✅ | `tablas-salones` |
| 10 | `classrooms.service.ts` y reescribir `ClassroomsProvider` | ⬜ | P3 |
| 11 | ★ Usuarios de prueba reales y reapuntar el botón «Sin login» | ⬜ | — |
| 12 | Login y registro reales con rol | ⬜ | P2 |
| 13 | Recuperar y cambiar contraseña | ⬜ | P2 |
| 14 | ★ Consentimiento del acudiente y política de privacidad | ⬜ | — |
| 15 | Google OAuth | ⬜ | P2 |
| 16 | Persistir la asignación de misiones | ⬜ | P5 |
| 17 | Reportes de habilidades sobre progreso real — **ver §3.1** | ⬜ | P5 |
| 18 | ★ Notificaciones en tiempo real (Supabase Realtime) | ⬜ | — |
| 19 | Invitaciones por correo reales y enlace canjeable | ⬜ | P5 |
| 20 | Contrato de integración y pantalla de nivel con contenedor — **exige cerrar antes la pregunta abierta de §3.2.** Incluye conectar la selección de niveles al backend, hoy maqueta (§3.3) | ⬜ | P4 |
| 21 | Escritura de progreso y XP desde el juego — **ver §3.2** | ⬜ | P4 |
| 22 | Diseñar e implementar rachas y logros — **no existe nada**, incluye el catálogo y retirar las estrellas. **Ver §3.2** | ⬜ | P4 |
| 23 | Unity en `apps/game/`, Git LFS y build de WebGL | ⬜ | P4 |
| 24 | Retirar la sesión de invitado | ⬜ | — |
| 25 | ★ Responsive, accesibilidad y `ErrorBoundary` | ⬜ | — |
| 26 | Ilustraciones con Higgsfield | ⬜ | P6 |
| 27 | ★ Despliegue y URL de demo | ⬜ | — |

### 2.1 Decisiones de orden que conviene no deshacer

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

**El apartado gráfico (26) queda casi al final a propósito.** No bloquea ninguna
funcionalidad y el foco actual son las funcionalidades.

### 2.2 Pasos que requieren a una persona

Estos no los puede hacer una sesión de Claude, porque implican crear cuentas o
introducir credenciales:

| Paso | Qué hace el usuario |
| --- | --- |
| 6 | Crear el proyecto en Supabase y copiar URL y clave publishable al `.env` |
| 7 | `npx supabase login`, `link --project-ref` y `db push` — piden credenciales por consola |
| 15 | Dar de alta Google OAuth en el panel de Supabase |
| 19 | Contratar el servicio de correo |
| 23 | Instalar Unity y crear el proyecto |
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
| El invariante «un alumno, un salón» **ya vive en el modelo** desde el paso 9 —restricción, índice parcial y política—. Lo que falta es que el store deje de contradecirlo: `requestJoin()` sigue sin comprobar la pertenencia actual y ahora fallaría contra la base en vez de sobrescribir en silencio | Paso 10 — tarea 5 de P3 en `CONTEXT.md` |
| `levels` guarda `starter_code`, `validation_rules` y `programming_language`: el esquema se diseñó para un editor de código en el navegador, no para Unity | Paso 20 |
| No existe catálogo de logros: `achievements` registra los concedidos a cada niño, no los posibles con sus condiciones. La sala de trofeos sólo puede listar lo conseguido, y el requisito de `contenido-mundos` se ajustó a eso | Paso 22 |
| **El progreso no sabe nada de salones**, así que al aceptar a un alumno el tutor pasará a ver *todo* su historial, incluido el anterior al ingreso. Hoy nadie lo ha decidido: se dará por accidente | Paso 17, y ver §3.1 |
| **El XP casi no tiene superficie en la interfaz.** Existe en la base (`profiles.total_xp`, `levels.xp_reward`, la vista `leaderboard_weekly`) pero sólo se muestra en Ajustes | Paso 21, y ver §3.2 |
| **PREGUNTA ABIERTA:** cómo verifica el servidor que un logro se consiguió. No se ha profundizado en qué envía el juego, en qué formato ni con qué garantía. Decisión previa al paso 20, no un paso nuevo: resolver con `/opsx:explore` | Antes del paso 20, ver §3.2 |
| **El historial de solicitudes se acumula en filas**: un mismo par `(student_id, group_id)` puede tener una resuelta y una pendiente nueva, porque volver a pedir entrar inserta otra fila. Hay que ordenar por `requested_at` y quedarse con la última — un `.single()` de supabase-js revienta con `PGRST116` en cuanto un niño reintenta | Paso 10 |
| **Ninguna política de salones está probada de verdad.** El 401 a la clave anónima demuestra que las tablas existen y están cerradas a `anon`, y nada más: que el tutor sólo vea sus salones, que el niño no pueda insertarse una pertenencia y que un rechazo sea inmutable siguen sin verificar | Paso 11, con dos usuarios reales |
| Cuatro carpetas de componentes **sin ningún consumidor**: `WelcomeBanner`, `WorldCard`, `SidebarPlayerCard` y `LeaderBoard`. Son restos del panel anterior al rediseño | Paso 21 o limpieza aparte |

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

| Dónde aparece | ¿Se renderiza? |
| --- | --- |
| `StudentSettingsModule` | ✅ Sí |
| `LeaderBoardRow` | ❌ `LeaderBoard` no lo monta nadie |
| `SidebarPlayerCard` | ❌ sin consumidores |
| `WelcomeBanner` con `XPBar` | ❌ sin consumidores |

La única barra de XP del proyecto vive en `WelcomeBanner`, que no está montado en
ninguna pantalla. **No confundirla con la barra de progreso del mundo**, que
cuenta niveles completados sobre el total y no tiene relación con el XP.

Esto deja el paso 21 incompleto tal como está planteado: escribiría un número que
el niño apenas puede ver. Antes de implementarlo hay que decidir dónde se muestra
el XP —cabecera del panel, tarjeta en el listado de mundos, o recuperar el
banner— y si esos componentes huérfanos se rehacen con el tema de selva o se
borran y se hacen de nuevo.

**Los componentes huérfanos se rehacen, no se recuperan.** `WelcomeBanner`,
`SidebarPlayerCard`, `LeaderBoard` y `WorldCard` usan los nombres de color
anteriores al rediseño (`text-secondary`, `text-neutral-light`) y la maquetación
del panel viejo. Adaptarlos sería arrastrar marcado que no encaja con el tema de
selva. La excepción es `XPBar`, una primitiva pequeña que probablemente se salve.

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

**No es un paso nuevo de la secuencia**, es una decisión previa al paso 20:
condiciona el contrato de integración, así que hay que cerrarla antes de
proponerlo. La vía natural es `/opsx:explore`, el modo de exploración de
OpenSpec, y de ahí sale el diseño con el que arrancar el 20.

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

**El ranking sigue sin decidir.** `leaderboard_weekly` clasifica a los niños
entre sí, pero que la vista exista no obliga a mostrarla. Un ranking público de
menores desmotiva a los que van últimos, que son los que más necesitan seguir.
Para un proyecto de grado sobre enseñanza conviene decidirlo y justificarlo en la
memoria. Alternativas más amables: ranking sólo dentro del salón, mostrar las
posiciones cercanas a la propia, o convertirlo en meta colectiva del salón.

### 3.3 El contenido sembrado es mínimo, y dos pantallas se contradicen

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

---

## 4. Al terminar cada paso

1. Marcar aquí el paso como ✅ y anotar el nombre del cambio de OpenSpec.
2. Seguir las reglas de `CLAUDE.md`: `lint`, `test:run` y `build`; actualizar
   `docs/CONTEXT.md` según el tipo de cambio; replicar en `openspec/config.yaml`
   lo que toque a §1.
3. Enumerar rutas explícitas en `git add`. Con varios cambios vivos, el árbol
   casi nunca contiene sólo lo que se está commiteando.
