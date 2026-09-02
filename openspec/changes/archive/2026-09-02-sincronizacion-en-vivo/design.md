## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño y no está allí:

**La publicación `supabase_realtime` existe y tiene CERO tablas.** Comprobado en
el panel de Supabase el 2 de septiembre de 2026, no deducido de las migraciones:
system id 16430, con `insert`, `update`, `delete` y `truncate` **los cuatro
activos**. De ahí salen dos cosas: la migración sólo tiene que **añadir tablas**
—crear la publicación sobraría y chocaría—, y el borrado sin filtrar de la
decisión 3 es real **desde el primer evento**, no algo que aparezca luego.

**Las tres políticas de lectura que hacen falta ya existen**, y ninguna hay que
tocar. Realtime evalúa la política de `select` de la **tabla base** por cada
suscriptor, así que lo que importa es esto:

| Caso | Tabla y operación | Política que lo autoriza |
| --- | --- | --- |
| Al tutor le entra una solicitud | `join_requests` insert | `join_requests_select_related`, rama del tutor del salón |
| Al niño lo aceptan | `class_memberships` insert **y** `join_requests` update | `class_memberships_select_related` y `join_requests_select_related`, rama `student_id = auth.uid()` |
| Al niño lo rechazan | `join_requests` update | ídem |
| Al niño lo retiran | `class_memberships` delete | ninguna: los borrados no se filtran (decisión 3) |
| Al niño le asignan o le retiran una misión | `mission_assignments` insert / delete | `mission_assignments_select_related`, rama de la pertenencia |

Que el tutor acepte pasa por `accept_join_request`, que corre como `security
definer`; eso no cambia nada, porque quien decide si un evento se entrega es la
política **del que escucha**, no la del que escribió.

**El store no lee payloads.** `ClassroomsProvider` recarga el snapshot entero tras
cada escritura (`docs/CONTEXT.md` §2.5) y ésa es la misma respuesta que quiere dar
a un evento. Eso hace que el contenido del aviso sea irrelevante, y es lo que
abarata la decisión 1.

**La frontera del store.** `ClassroomsProvider` no importa `supabase` en ninguna
línea: todo pasa por la prop `service`, y `src/test/renderClassrooms.tsx` inyecta
un servidor falso. `docs/CONTEXT.md` §4.3 declara esa frontera mantenida.

**`renderClassrooms` monta bajo `StrictMode` a propósito**, así que los efectos
corren dos veces: una suscripción mal desmontada se suscribe dos veces al mismo
topic, y `realtime-js` avisa o falla cuando eso pasa.

## Goals / Non-Goals

**Goals:**

- Que las tres pantallas del alcance se actualicen solas, sin recargar.
- Que la suscripción entre por el servicio, para que la frontera del store siga
  en pie y los tests puedan disparar eventos sin red.
- Que una recarga que no pidió quien mira **no** haga parpadear su pantalla.
- Que los casos negativos se puedan medir, no suponer.

**Non-Goals** — de diseño, más allá de lo que ya excluye la propuesta:

- **Actualización optimista o parcial.** Un evento provoca una relectura del
  snapshot completo, como una escritura. Aplicar el payload encima sería
  añadirle al store un segundo camino de actualización y una segunda forma de
  quedar desincronizado.
- **Reintento propio, cola de eventos o marca de «desconectado».** El cliente de
  Supabase reconecta solo; envolverlo en lógica nuestra es maquinaria que este
  paso no necesita y que habría que mantener.
- **Sincronizar más tablas de las tres.** `class_groups`, `profiles`,
  `invitations`, `user_progress` y `levels` se quedan fuera de la publicación:
  publicar una tabla es barato de escribir y caro de razonar, y ninguna de esas
  tiene un caso en el alcance.
- **Filtrar la suscripción por salón.** Ver decisión 4.
- **Tocar `config/env.ts`.** `VITE_DEV_TUTOR2_*` es para `curl` y para abrir una
  segunda sesión en otro navegador; no lo lee ningún código y así se queda.

## Decisions

### 1. `postgres_changes`, no `realtime.broadcast_changes()` desde disparadores

**La elegida.** Se publican las tres tablas y cada sesión se suscribe a los
cambios que su RLS le autoriza.

La alternativa era **broadcast desde disparadores**: un canal por salón, una
política sobre `realtime.messages` para autorizar quién escucha cada canal, y un
disparador por tabla que llame a `realtime.broadcast_changes()`. Da un borrado
bien filtrado, porque el disparador corre en el servidor con la fila entera
delante y puede decidir a qué canal la manda.

Se elige `postgres_changes` por tres motivos, en este orden:

1. **El store no lee el payload.** Toda la ventaja de broadcast está en el
   contenido del mensaje y en a quién se le entrega. Aquí el mensaje sólo dice
   «vuelve a consultar», y la consulta ya pasa por la RLS. Lo que se compra con
   el SQL extra es, casi todo, algo que no se usa.
2. **Alcance.** Broadcast son tres disparadores, una política sobre
   `realtime.messages` y un nombre de canal por salón que el cliente tiene que
   saber calcular —lo que obliga al niño a conocer el id de su salón antes de
   suscribirse, y al tutor a suscribirse a tantos canales como salones tenga—.
   Es un paso entero, no una decisión dentro de éste.
3. **Lo que se paga es medible y pequeño**, y está escrito en la decisión 3.

**Queda anotada como salida:** si el ruido de los borrados ajenos llega a
importar —muchos salones, muchas bajas— o si algún día el store empieza a leer
payloads, la migración a broadcast es la respuesta, y no invalida nada de lo que
se escribe aquí: el store seguiría recibiendo «vuelve a consultar» por la misma
función del servicio.

### 2. La suscripción es una función más del servicio, y devuelve su cancelación

`ClassroomsService` gana `subscribeToClassrooms(userId, onChange): () => void`, y
`MissionsService` gana `subscribeToAssignments(onChange): () => void`. El
provider y el hook llaman a la suya dentro de un efecto y devuelven la
cancelación como limpieza.

Un `supabase.channel(...)` dentro de `ClassroomsProvider` sería la vía corta y
rompe dos cosas a la vez: la frontera de `docs/CONTEXT.md` §4.3, y los 28 tests
del provider, que dejarían de tener forma de disparar un evento porque montan un
servidor falso sin red. Poniéndolo en el servicio, `fakeClassroomsService` gana
un `emit()` y el comportamiento nuevo se prueba entero sin salir de memoria.

`userId` entra como parámetro en la de salones aunque hoy la RLS ya filtre por la
sesión: es lo que hace que la firma diga qué sesión escucha, y lo que permite al
servidor falso decidir a quién entrega. `subscribeToAssignments` no lo necesita
porque `listAssignments()` tampoco lo recibe —una sola lectura sirve a los dos
roles y la RLS decide—, y añadirlo sólo por simetría sería un parámetro ignorado.

### 3. El borrado ajeno se acepta, medido y escrito

Realtime **no filtra los `delete` por RLS**: cuando llega el evento la fila ya no
existe, así que no hay nada contra lo que evaluar la política, y el borrado se
entrega **a todos los suscriptores de esa tabla**. Con la identidad de réplica
por defecto el contenido es sólo la clave primaria: un uuid, sin `group_id` y sin
`student_id`.

Y `delete` **ya está activo en la publicación**, así que esto empieza a ocurrir
con el primer evento, no más tarde.

**Medido el 2 de septiembre de 2026**, con cuatro oyentes simultáneos sobre las
tres tablas y una escritura del tutor 1 en `CP-5J6H` (tarea 2.2). Esto es lo que
llega, y no lo que se suponía:

| Quién escucha | `insert` | `delete` |
| --- | --- | --- |
| Tutor 1, dueño del salón | La fila entera | La clave primaria |
| Tutor 2, autenticado y ajeno | **Nada, ni el sobre** | La clave primaria |
| Niño miembro de ese salón | La fila entera —es un positivo, pertenece al salón— | La clave primaria |
| Clave anónima | El sobre **vacío**, con `errors: ["Error 401: Unauthorized"]` | El sobre **vacío**, sin la clave primaria |

Tres cosas que esto corrige respecto a lo que estaba escrito antes de medirlo:

- **La RLS sí filtra los `insert`**, y se ve en la única fila que lo prueba: el
  tutor 2 no recibe **ni el sobre**. Un negativo con su positivo emparejado
  ocurriendo en el mismo segundo.
- **`anon` no se queda fuera del todo**: recibe el sobre. El spec decía «no
  recibe ningún cambio» y era falso. Lo que no recibe es **una sola columna**,
  que es lo que importaba.
- **A `anon` el borrado le llega más pobre que a un autenticado ajeno**: ni
  siquiera el uuid. O sea que el peor caso del borrado sin filtrar es el del
  tutor 2, no el de la clave anónima.

Lo que `anon` gana con la publicación es, exactamente, **saber que algo cambió en
una de las tres tablas**: el sobre llega vacío, sin columnas y sin
identificadores. Atribuir esa cadencia a un salón concreto exigiría que fuese el
único activo.

**Y eso se revisa en el paso 27, el del despliegue.** Hoy la cadencia es ruido
porque la base tiene un salón de pruebas. Con la aplicación desplegada y salones
reales dentro, la misma señal pasa a ser **telemetría de uso** —cuánta actividad
hay y cuándo— visible para cualquiera, porque la clave es pública por diseño. No
cambia la decisión de ahora; se anota para que entonces no se descubra desde
cero, y la salida sigue siendo la misma de la decisión 1.

Justo los tres sucesos que más importan aquí son bajas —el niño que se va, el
tutor que retira, la misión que se quita—, así que no es un caso raro. Lo que
cuesta, exactamente:

- **Una relectura de más** en sesiones a las que ese borrado no les afectaba. La
  consulta es la misma que ya se hace tras cada escritura y devuelve lo mismo que
  antes, así que la pantalla no cambia. Con la decisión 5, tampoco parpadea.
- **Un uuid suelto** que llega a una sesión que no podía leer esa fila. No dice
  de qué salón era, ni de quién, ni contra qué tabla se puede usar: la relectura
  que provoca sí pasa por la RLS y no devuelve nada nuevo.

`replica identity full` **no lo arregla**: hace viajar la fila entera en vez del
uuid, o sea más filtración y no menos. Por eso la migración no lo toca.

Es un proyecto de grado, sin datos sensibles en las tres tablas y con el store
sin leer payloads. Se acepta **a sabiendas**, queda escrito en el spec de
`backend-supabase` como límite del sistema y no como detalle de implementación, y
la salida es la decisión 1.

### 4. Un canal por consumidor, sin filtro, con topic único

Cada llamada a `subscribe*` abre **un** canal con un nombre único por llamada
—no `classrooms:${userId}`, que dos montajes compartirían—. Es lo que hace que el
doble efecto de `StrictMode` no intente suscribirse dos veces al mismo topic:
durante el instante en que conviven, son topics distintos, y la limpieza del
primero lo retira.

**Sin filtro por salón**, aunque `postgres_changes` los admita. Filtrar exigiría
saber los salones antes de suscribirse —y el niño sólo conoce el suyo después de
la primera consulta—, así que habría que rehacer la suscripción cada vez que
cambia la lista de salones, que es justamente lo que cambia cuando llegan
eventos. Se filtra donde ya se filtraba: en la RLS para insert y update, y en la
relectura para todo.

El canal de salones escucha `join_requests` y `class_memberships`; el de misiones,
`mission_assignments`. Se escuchan **todas** las operaciones de esas tablas en vez
de enumerarlas: la respuesta es la misma para las tres y una lista es una cosa
más que puede quedarse corta.

De aquí sale gratis que el tutor vea en vivo sus propias asignaciones —monta el
mismo hook—, y que vea al niño irse por su cuenta. No es alcance, no se verifica
como tal, y no cuesta una línea.

### 5. Una recarga ajena no toca `loading`, pero sí lo apaga

`refresh()` hace `setLoading(true)` en los dos hooks
(`ClassroomsProvider.tsx:73`, `useMissionAssignments.ts:34`). Disparado por un
evento, eso blanquea la pantalla — que es exactamente el fallo que
`docs/CONTEXT.md` §2.2 y §2.5 dan por cerrado en el paso 13: la aplicación
recargándose sola porque algo externo la despierta.

No es una superficie, son **tres consumidores y dos hooks**, y cada uno falla
distinto:

| Dónde | Qué pasaría con cada evento |
| --- | --- |
| `pages/TeacherDashboard/TeacherDashboard.tsx:23` | Spinner a pantalla completa: desmonta el panel entero del tutor, con el desplazamiento, los diálogos abiertos y lo escrito en `CreateGroupForm` o `AddStudentsPanel` |
| `components/dashboard/student/StudentClassroomModule.tsx:39` | Spinner sobre la pantalla del salón |
| `components/dashboard/shared/AssignedMissionsPanel.tsx:57` | `return null`: el panel **desaparece** y vuelve. Ni spinner |

La regla es más estrecha que «no toques `loading`», y el motivo es la guarda
`loadId`: si un evento entra mientras la carga inicial sigue en vuelo, la inicial
resuelve, se encuentra `loadId.current !== currentLoad` y **vuelve sin llamar a
`setLoading(false)`** (`ClassroomsProvider.tsx:80-82`). Si la recarga silenciosa
tampoco lo llamara, el spinner se quedaría encendido para siempre. De ahí:

> Se quita el `setLoading(true)`. Se conservan **todos** los `setLoading(false)`.

Se implementa con un solo camino de carga que recibe si debe declarar espera
—`runLoad(silent)`, con `refresh()` y `refreshSilently()` encima—, no duplicando
la función: dos copias divergen, y esto ya se rompió una vez.

En `useMissionAssignments` hay además un `setError(null)` al empezar. En el
camino silencioso **no** se ejecuta: `AssignedMissionsPanel` pinta el error en
lugar del panel, así que borrarlo y volver a ponerlo sería el mismo parpadeo por
otra puerta. El error se fija con el resultado, no antes.

**Un test por hook lo fija**: con el store ya cargado, un evento no vuelve a
poner `loading` en alto. Sin él, el arreglo se deshace solo en cuanto alguien
unifique los dos caminos de recarga.

### 6. Nunca suscribirse antes de tener `userId`

El efecto que abre el canal se guarda con `userId`. Un canal abierto con la clave
anónima pasa la autorización de Realtime con las manos vacías —`anon` no tiene
`grant select` sobre ninguna de las tres tablas desde la 0013 y la 0020— y **no
se reintenta solo** cuando después llega la sesión: quedaría un canal mudo para
siempre. Es la misma dependencia de `userId` que ya usan los seis callbacks del
provider, por el mismo motivo de fondo.

### 7. La migración añade tablas, y es idempotente por comprobación

`alter publication supabase_realtime add table ...` falla si la tabla ya está
publicada, y el proyecto exige que el esquema se pueda reproducir desde cero.
Se resuelve comprobando `pg_publication_tables` antes de cada `alter`, dentro de
un bloque `do`, que es lo más parecido al `if not exists` que esta sentencia no
tiene.

No lleva `create publication` —ya existe— ni toca qué operaciones emite —ya están
las cuatro—. Escribir cualquiera de las dos cosas chocaría contra el estado real
de la base.

**No hace falta `gen types`.** Publicar una tabla no cambia el esquema, así que
`database.types.ts` no se queda corto y no se toca. Es la diferencia con la 0020,
donde el orden `db push` → `gen types` → servicio era rígido.

## Risks / Trade-offs

- **Los borrados ajenos llegan a todo el mundo** → Aceptado y medido: decisión 3.
  Cuesta una relectura de más y un uuid suelto. La salida, si algún día importa,
  es broadcast desde disparadores (decisión 1).
- **Un evento por fila:** aceptar una solicitud escribe dos tablas, así que
  dispara dos eventos y dos relecturas casi seguidas → Se acepta. La consulta es
  barata, es la misma que ya se hace tras cada escritura, y con la decisión 5 no
  se ve. Agrupar eventos en una ventana de tiempo sería maquinaria para un
  problema que nadie ha medido.
- **Quien escribe recarga dos veces:** el que hace la acción ya recargaba al
  terminar la escritura, y ahora además recibe su propio evento → Se acepta por
  el mismo motivo. Descartar el evento propio exigiría leer el payload y saber
  quién lo causó, que es justo lo que la decisión 1 evita.
- **Si la conexión de Realtime se cae, la pantalla vuelve a ir vieja sin
  decirlo** → No se mitiga en este paso, y es deliberado: la aplicación queda
  exactamente como está hoy, que es el comportamiento que ya se acepta. Una marca
  de «desconectado» es superficie nueva, y superficie nueva está fuera de
  alcance.
- **Un test verde no prueba que la base emita.** El servidor falso emite porque
  se le pide → Por eso la verificación contra la base real, con dos navegadores y
  con los tres casos negativos, es parte del cambio y no un extra.
- **Un caso negativo puede confundir «no llegó» con «no miré»** → En cada uno se
  provoca a la vez un evento que **sí** debe llegar, y se comprueba que llega uno
  y no el otro. Un negativo sin su positivo emparejado no cuenta como medido.
- **La suscripción del niño a `mission_assignments` depende de su pertenencia**,
  porque así está escrita la política: un niño sin salón no recibe nada → Es
  correcto y es lo que dice el spec. Al entrar a un salón, lo que le pone al día
  es la relectura que dispara su propia pertenencia.

## Migration Plan

1. Se escribe `supabase/migrations/202606030021_publish_realtime_tables.sql`.
2. **El paso 18 entra en `docs/ROADMAP.md` §2.2**, la tabla de pasos que
   requieren a una persona: hoy no lo lista.
3. **Aquí para la lista de tareas.** El `db push` **lo lanza el usuario**, y no
   lo lanza hasta que la sesión que revisa haya leído el SQL y lo haya dicho
   (`docs/ROADMAP.md` §1.3, comprobación 9). Esta parada no es una tarea de la
   sesión que ejecuta: vive en la lista de quien puede hacerla cumplir, que es el
   único que puede lanzar el `db push`.
4. El usuario lanza `npx supabase db push` y **se lee la salida**: tiene que
   aplicar la 0021 y **ninguna más**. Si arrastra otras, hay migraciones sin
   aplicar en la base y eso se mira antes de seguir.
5. **No hay `gen types`** (decisión 7). El código puede escribirse antes del
   `db push`, porque no depende de tipos nuevos; lo que no puede es verificarse.
6. Servicio, provider y hook, con sus tests.
7. Verificación contra la base real: los tres casos del alcance con dos
   navegadores, y los tres negativos con su positivo emparejado.

**Vuelta atrás.** Retirar una tabla de la publicación es una sentencia
(`alter publication supabase_realtime drop table ...`) y deja la aplicación
funcionando exactamente como antes de este paso: las suscripciones siguen
abiertas y mudas, y las pantallas se actualizan al recargar. No hay dato que
migrar ni columna que revertir, que es la otra razón por la que este esquema es
barato de deshacer.
