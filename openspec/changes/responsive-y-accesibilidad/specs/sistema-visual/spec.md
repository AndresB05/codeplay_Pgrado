## ADDED Requirements

### Requirement: En móvil la navegación entre módulos va en una barra inferior

Por debajo de 768 px de ancho (`md`), los paneles del child y del tutor NO SHALL
mostrar barra lateral, y la navegación entre sus módulos SHALL ir en una barra
fija al borde inferior de la pantalla, con un botón por módulo que lleva su
icono y un rótulo visible.

- La del child SHALL llevar Mundos, Sala de Trofeos y Salón de clases, y el
  Laboratorio 3D sólo cuando están encendidas las herramientas de desarrollo.
  SHALL estar en las mismas pantallas que hoy llevan la barra lateral.
- La del tutor SHALL llevar Salón de clases, Panel de información y Ajustes de
  cuenta, y el número de JoinRequest en espera de todos sus ClassGroup junto a
  Salón de clases cuando haya alguna.

La barra SHALL respetar el área segura inferior del dispositivo, y el contenido
de la pantalla SHALL tener debajo el relleno suficiente para que la barra no
tape nada al llegar al final.

A partir de 768 px los dos paneles SHALL verse como antes del cambio, con la
barra lateral plegable y sin barra inferior.

#### Scenario: El child abre Mundos en un teléfono

- **WHEN** un child abre Mundos con la ventana a 375 px
- **THEN** no hay barra lateral
- **AND** al pie hay una barra fija con Mundos, Sala de Trofeos y Salón de clases, y Mundos marcado como la página actual
- **AND** al bajar hasta el final, lo último de la página queda por encima de la barra

#### Scenario: El tutor con solicitudes en espera, en un teléfono

- **WHEN** un tutor con tres JoinRequest en espera abre «Mis salones» a 375 px
- **THEN** al pie hay una barra con Salón de clases, Panel de información y Ajustes de cuenta
- **AND** Salón de clases enseña un 3 y su nombre accesible dice que hay 3 solicitudes en espera

#### Scenario: El escritorio no cambia

- **WHEN** cualquiera de los dos roles abre su panel a 1280 px
- **THEN** ve la barra lateral como antes del cambio, plegable
- **AND** no hay barra inferior

### Requirement: Las pantallas caben en un teléfono sin scroll horizontal

A 375 px de ancho, ninguna pantalla de los paneles del child y del tutor, ni
`/invite/:token`, el login, el registro o el aviso del `ErrorBoundary`, SHALL
tener scroll horizontal de página: el ancho del documento SHALL ser el de la
ventana. Una tabla ancha SHALL desplazarse dentro de su tarjeta, nunca la
página entera.

#### Scenario: El tutor abre la tabla de seguimiento en un teléfono

- **WHEN** el tutor abre el detalle de un ClassGroup a 375 px
- **THEN** la página no se desplaza en horizontal
- **AND** la tabla de seguimiento se desplaza en horizontal dentro de su tarjeta

#### Scenario: Una invitación abierta desde el móvil

- **WHEN** alguien abre `/invite/<token>` a 375 px
- **THEN** la página no se desplaza en horizontal y sus botones se pueden pulsar enteros

### Requirement: La navegación y los botones de icono son accesibles

En los dos paneles, el botón del módulo abierto, en la barra lateral y en la
inferior, SHALL llevar `aria-current="page"`. Todo botón que sólo enseña un
icono SHALL tener un nombre accesible en español. Todo control que reciba el
foco con el teclado SHALL mostrar un indicador de foco visible, en los dos
paneles, en la portada y en el acceso.

#### Scenario: Un lector de pantalla en la barra del child

- **WHEN** un child con lector de pantalla recorre la navegación estando en la Sala de Trofeos
- **THEN** el botón Sala de Trofeos se anuncia como la página actual

#### Scenario: Navegar con el teclado por el login

- **WHEN** alguien recorre el login con la tecla Tab
- **THEN** cada campo, botón y enlace muestra un indicador de foco visible al recibirlo
