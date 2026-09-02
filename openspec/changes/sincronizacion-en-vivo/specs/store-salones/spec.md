## ADDED Requirements

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

## MODIFIED Requirements

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
