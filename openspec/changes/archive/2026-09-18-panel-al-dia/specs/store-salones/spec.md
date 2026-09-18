## ADDED Requirements

### Requirement: El store se pone al día cuando quien mira vuelve a mirar

El sistema SHALL volver a leer el estado de los salones **al abrirse una pantalla
que lo muestra** y **cuando la ventana recupera el foco**, sin que quien mira
tenga que recargar la página.

Existe porque la suscripción en vivo no alcanza a todo lo que esas pantallas
enseñan: desde el paso 17 el panel del tutor cuenta progreso, y el progreso no
puede emitirse por la publicación —la política de su tabla sólo alcanza a su
dueño, así que el tutor no recibiría el aviso—. Sin esta recarga, el panel
enseñaría lo que hubiera cuando arrancó la aplicación.

Esa recarga SHALL seguir el **camino silencioso**: NO SHALL declarar la espera
—la pantalla desaparecería y volvería cada vez que alguien cambia de ventana—
pero SHALL apagarla si estaba declarada. Es la misma regla que el paso 18 fijó
para las recargas disparadas desde fuera.

La recarga SHALL entrar por el store, igual que las lecturas y las escrituras.
Ninguna pantalla SHALL consultar el servicio ni la base por su cuenta para
ponerse al día.

Un fallo de esa recarga NO SHALL vaciar lo que ya se está mostrando: quien mira
se queda con el dato anterior y el motivo se le dice, en lugar de perder la
pantalla.

#### Scenario: El tutor abre el panel después de que alguien jugara

- **WHEN** el tutor abre el panel de información y un alumno ha jugado desde que se cargó la aplicación
- **THEN** las cifras que ve incluyen esa partida, sin recargar la página

#### Scenario: El tutor vuelve a la pestaña

- **WHEN** el tutor tiene el panel abierto, cambia de ventana y vuelve
- **THEN** el store vuelve a leer y lo que ve está al día

#### Scenario: La recarga no blanquea la pantalla

- **WHEN** ocurre una de esas recargas con la pantalla ya pintada
- **THEN** no se declara espera y lo que se está mostrando no desaparece

#### Scenario: La recarga falla

- **WHEN** la consulta de esa recarga devuelve un error
- **THEN** lo que ya se mostraba sigue en pantalla y el motivo se le dice a quien mira

#### Scenario: La ventana recupera el foco sin sesión

- **WHEN** la ventana recupera el foco y no hay usuario autenticado
- **THEN** no se consulta nada
