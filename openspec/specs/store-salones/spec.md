# store-salones Specification

## Purpose

Ser el único punto por el que la aplicación lee, escribe y **escucha** salones,
hoy contra Supabase. Nació sosteniendo el prototipo sin backend, y sustituir esa
capa por consultas reales no obligó a ninguna vista a hablar con la base:
mantener esa frontera aislada es su razón de ser. La suscripción en vivo entró
por el mismo sitio y por el mismo motivo, y volvió a pagarla: ninguna vista
cambió al añadirla.

Escuchar no es una tercera forma de obtener datos, sino un disparador de la
primera: lo que llega es la noticia de que algo cambió, y el store responde
volviendo a leer.

Lo que sí cambió en las vistas es lo que un backend real exige y un estado local
no: esperar a que lleguen los datos, mostrar por qué falló una acción, y fiarse
del recuento del servidor en vez de contar una lista que puede venir incompleta.

## Requirements

### Requirement: Punto de acceso único a los salones

El sistema SHALL exponer los salones y las acciones que los modifican a través
de un único contexto. Ningún componente SHALL leer ni escribir directamente el
origen de esos datos, sea el almacenamiento del navegador o la base de datos.

#### Scenario: Una vista necesita los salones

- **WHEN** un componente necesita leer salones o ejecutar una acción sobre ellos
- **THEN** los obtiene del contexto de salones y no del origen de los datos

#### Scenario: Se sustituye el origen de los datos

- **WHEN** el estado local se reemplaza por consultas a un backend
- **THEN** ninguna vista requiere modificación salvo por la espera que introduce la consulta

### Requirement: Mutaciones estables bajo StrictMode

El sistema SHALL calcular fuera de los actualizadores de estado cualquier valor
que no deba variar entre invocaciones, y SHALL enviar una sola escritura por
acción del usuario, porque React ejecuta esos actualizadores dos veces en
StrictMode.

#### Scenario: Se crea un salón en desarrollo

- **WHEN** React invoca dos veces el actualizador de estado
- **THEN** se registra un único salón y no dos

#### Scenario: El niño solicita entrar a un salón

- **WHEN** React invoca dos veces el actualizador de estado
- **THEN** se registra una única solicitud de ingreso

### Requirement: Los salones son los de la sesión autenticada

El sistema SHALL identificar al niño y al tutor por el usuario autenticado de la
sesión, y NO SHALL usar ninguna identidad fija de relleno. Sin sesión el
contexto SHALL quedar vacío, sin salones y sin pertenencia, en lugar de mostrar
datos de ejemplo.

Lo que decide si el estado se vuelve a cargar SHALL ser **quién** está dentro,
no cuántas veces lo diga la capa de sesión. Un evento de sesión que no cambia la
identidad del usuario —un refresco de token, una reautenticación de la misma
persona— NO SHALL provocar una recarga del estado del salón.

Recargar de más no es sólo trabajo desperdiciado: la pantalla del tutor se
sustituye por un indicador de carga mientras el estado llega, así que una
recarga innecesaria se lleva por delante cualquier cosa que se tuviera a medias
en pantalla.

#### Scenario: Entra un tutor

- **WHEN** el tutor de la sesión abre sus salones
- **THEN** ve únicamente los salones que él creó

#### Scenario: Entra un niño

- **WHEN** el niño de la sesión abre el módulo de salón
- **THEN** su situación es la que consta en la base de datos para su propio usuario

#### Scenario: No hay sesión

- **WHEN** no hay usuario autenticado
- **THEN** el contexto no expone ningún salón ni ninguna pertenencia

#### Scenario: La sesión se renueva sin cambiar de usuario

- **WHEN** llega un evento de sesión que mantiene al mismo usuario
- **THEN** el estado del salón no se vuelve a cargar
- **AND** lo que hubiera en pantalla sigue donde estaba

#### Scenario: Cambia quién está dentro

- **WHEN** la sesión pasa a otro usuario, o deja de haber usuario
- **THEN** el estado del salón se vuelve a cargar para la identidad nueva

### Requirement: La espera se declara y el error se muestra

El sistema SHALL exponer si los salones se están cargando, para que ninguna
vista tome un estado a medio cargar por un estado vacío.

La espera SHALL declararse **sólo por lo que hizo quien mira**: la primera carga
y las escrituras que él mismo ejecuta. Una recarga disparada desde fuera —un
cambio que hizo otra persona— NO SHALL declarar espera, porque las vistas
sustituyen su contenido mientras carga: el panel del tutor entero se cambia por
un indicador y se lleva por delante el desplazamiento y lo que hubiera escrito a
medias, y el panel de misiones del niño desaparece sin dejar hueco. Una pantalla
que parpadea cada vez que otra persona hace algo es peor que una que va vieja.

No declarar espera NO SHALL confundirse con no retirarla: la espera SHALL darse
por terminada al final de **toda** carga, la silenciosa incluida. Una carga
inicial descartada por llegar tarde no la retira, así que si la silenciosa
tampoco lo hiciera, el indicador quedaría encendido para siempre.

Cuando una acción sobre salones falle, el sistema SHALL **mostrar el motivo en
la pantalla desde la que se intentó**. No basta con dejarlo disponible en el
estado: un error que ninguna vista pinta es, para quien pulsó el botón,
indistinguible de un botón roto.

El mensaje SHALL desaparecer en cuanto una acción posterior tenga éxito.

#### Scenario: Todavía no han llegado los datos

- **WHEN** la consulta de salones sigue en curso
- **THEN** se declara la carga en progreso
- **AND** la vista no afirma que el salón no existe

#### Scenario: Recarga provocada por un cambio ajeno

- **WHEN** el store vuelve a leer porque llegó un aviso de cambio y ya tenía datos cargados
- **THEN** no se declara ninguna espera y la pantalla no se sustituye por un indicador
- **AND** el contenido se actualiza cuando la consulta termina

#### Scenario: Un aviso llega mientras la primera carga sigue en vuelo

- **WHEN** llega un aviso antes de que termine la carga inicial
- **THEN** la espera termina igualmente y ninguna pantalla se queda con el indicador encendido

#### Scenario: Una escritura falla

- **WHEN** el tutor o el niño ejecuta una acción sobre salones y la base la rechaza
- **THEN** la pantalla desde la que se intentó muestra el motivo del rechazo
- **AND** el estado no cambia

#### Scenario: La pantalla iba por detrás de la base

- **WHEN** el tutor acepta una solicitud de un salón que entretanto se llenó
- **THEN** se muestra que el salón está lleno
- **AND** la solicitud sigue pendiente

#### Scenario: La acción siguiente sale bien

- **WHEN** una acción termina con éxito después de una fallida
- **THEN** el mensaje de error deja de mostrarse

### Requirement: El store comprueba la pertenencia antes de pedir entrar

El sistema SHALL rechazar en el store una solicitud de ingreso cuando el niño ya
pertenece a un salón o ya tiene una solicitud pendiente, sin depender de que la
vista impida llegar hasta ahí.

#### Scenario: El niño ya está inscrito

- **WHEN** se invoca la acción de solicitar ingreso estando inscrito en un salón
- **THEN** no se crea ninguna solicitud
- **AND** la pertenencia al salón actual no cambia

#### Scenario: El niño ya tiene una solicitud pendiente

- **WHEN** se invoca la acción de solicitar ingreso con una solicitud sin resolver
- **THEN** no se crea una segunda solicitud

### Requirement: La situación del niño se deduce de su última solicitud

Como un mismo niño puede acumular varias solicitudes sobre el mismo salón —una
rechazada y otra nueva—, el sistema SHALL determinar su situación a partir de la
solicitud más reciente por fecha, y NO SHALL asumir que existe una sola.

#### Scenario: El niño vuelve a pedir entrar tras un rechazo

- **WHEN** el niño tiene una solicitud rechazada y otra posterior sin resolver
- **THEN** su situación es «en espera» según la más reciente
- **AND** la lectura no falla por encontrar más de una fila

### Requirement: El store se entera de los cambios sin que nadie recargue

El store SHALL suscribirse a los cambios de salones que afectan a la sesión
abierta y SHALL volver a leer el estado del rol al recibir uno, sin que quien
mira tenga que recargar la página ni volver a entrar a la pantalla.

La suscripción SHALL abrirse **sólo cuando hay una sesión con identidad
conocida**. Sin ella, el sistema NO SHALL suscribirse: una suscripción abierta
sin sesión no vería nada y no se reintenta sola.

El store SHALL cancelar su suscripción al cerrarse la sesión, al cambiar de
usuario y al desmontarse, y NO SHALL mantener más de una suscripción viva por
sesión aunque se monte dos veces.

La suscripción SHALL entrar por el servicio de salones, igual que las lecturas y
las escrituras. Ninguna vista y ningún proveedor de estado SHALL hablar
directamente con el cliente de la base.

Lo que llega en el aviso NO SHALL usarse como dato: el store SHALL volver a
consultar y quedarse con lo que devuelva esa consulta, que es la que pasa por la
seguridad a nivel de fila. Un aviso que no cambia nada para quien mira SHALL
terminar sin cambio visible.

#### Scenario: Llega una solicitud mientras el tutor mira su panel

- **WHEN** un `child` pide entrar a un salón del `tutor` que tiene el panel abierto
- **THEN** el store del `tutor` vuelve a leer y la solicitud aparece sin recargar

#### Scenario: El tutor resuelve mientras el niño mira

- **WHEN** el `tutor` acepta, rechaza o retira a un `child` que tiene la pantalla abierta
- **THEN** el store del `child` vuelve a leer y su `membership` refleja la decisión sin recargar

#### Scenario: No hay sesión

- **WHEN** no hay usuario autenticado
- **THEN** no se abre ninguna suscripción

#### Scenario: Se cierra la sesión o cambia el usuario

- **WHEN** la sesión termina o entra otro usuario
- **THEN** la suscripción anterior se cancela y no vuelve a recargar el store

#### Scenario: Un aviso que no afecta a quien escucha

- **WHEN** llega un aviso de un cambio que la sesión no puede leer
- **THEN** la consulta posterior no devuelve nada nuevo y la pantalla no cambia
