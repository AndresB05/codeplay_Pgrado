## ADDED Requirements

### Requirement: El área del tutor tiene su propio lenguaje visual

Las pantallas del tutor SHALL usar un lenguaje visual propio, sobrio y denso,
distinto del infantil: su propia familia de tokens de color, una tipografía de
lectura para el cuerpo, las tablas, los controles y las cifras, y sus propias
piezas —tarjeta, botón, etiqueta de estado, campo, tabla y cabecera de sección—,
sin contornos gruesos en tinta, sin sombras sólidas de relieve y sin botones con
relieve. Los tokens del tutor SHALL vivir, como los demás, a la vez en
`main.css` y en `tailwind.config.js`, y SHALL usarse por su nombre.

Ese lenguaje SHALL seguir siendo el de CodePlay: el fondo lavanda de la app, el
morado de la marca como acento, Fredoka en los títulos y el logo del leopardo en
la barra superior.

La tipografía de lectura del tutor NO SHALL aparecer en ninguna pantalla del
child, de la portada ni del acceso.

Ese lenguaje NO SHALL alcanzar al child: las clases de componente compartidas
(`.card`, `.btn`, `.chip`, `.field`) SHALL conservar su aspecto, y un componente
que monten los dos roles SHALL seguir viéndose como antes cuando lo monta el
child.

El cambio de aspecto NO SHALL cambiar lo que el tutor ve ni lo que puede hacer:
las mismas rutas, los mismos datos y las mismas acciones. Los estados que hoy se
distinguen con palabras —«Sin empezar» y «Sin superar»— SHALL seguir
distinguiéndose con palabras y no sólo con el color, y unos pasos que el
servidor no supo contar SHALL seguir escribiéndose «?» y nunca 0.

Todo texto del tutor SHALL contrastar al menos 4,5:1 con su fondo, y el borde de
un campo de formulario, al menos 3:1.

#### Scenario: El tutor abre el detalle de un salón

- **WHEN** el tutor entra en el detalle de un ClassGroup
- **THEN** la página usa los tokens del tutor, con los títulos en Fredoka y el resto en la tipografía de lectura del tutor
- **AND** los botones, etiquetas y tablas no llevan contorno grueso en tinta ni sombra sólida
- **AND** la barra superior muestra el logo del leopardo y el avatar del tutor

#### Scenario: El child abre su salón

- **WHEN** un child entra en su salón, que monta la tabla de seguimiento, el podio y las tarjetas de cifras
- **THEN** esas piezas se ven exactamente como antes del cambio
- **AND** en la pantalla no aparece la tipografía de lectura del tutor

#### Scenario: El child abre sus ajustes

- **WHEN** un child abre «Mi cuenta», que monta los paneles de cambiar nombre, contraseña y borrar la cuenta
- **THEN** esos paneles se ven exactamente como antes del cambio

#### Scenario: La ficha de un explorador con niveles sin empezar

- **WHEN** el tutor abre la ficha de un explorador que tiene un nivel empezado sin superar y otro sin empezar
- **THEN** uno dice «Sin superar» y el otro «Sin empezar», con esas palabras
- **AND** una partida cuyos pasos el servidor no contó sale como «?»

#### Scenario: Un enlace guardado a una ficha

- **WHEN** el tutor abre `/teacher/panel/<salón>/<explorador>` guardado antes del cambio
- **THEN** ve la ficha de ese explorador en ese salón, como antes

#### Scenario: La barra lateral plegada

- **WHEN** el tutor pliega la barra lateral en un escritorio estrecho
- **THEN** cada sección y cada salón siguen alcanzables y nombrados para el lector de pantalla
- **AND** el recuento de solicitudes pendientes sigue visible

## MODIFIED Requirements

### Requirement: Identidad visual determinista por salón

El sistema SHALL asignar a cada salón uno de seis temas visuales —cohete, robot,
dinosaurio, estrella, bosque y océano— calculado mediante hash de su
identificador. El tema NO SHALL guardarse en base de datos.

En las pantallas del child el tema SHALL mostrarse con su color, su degradado y
su ilustración. En las pantallas del tutor NO SHALL usarse el degradado: en la
barra lateral el tema SHALL mostrarse sólo con su color, como una pestaña junto
al salón; en la tarjeta del listado y en la cabecera del detalle, con su color
como pestaña y su ilustración.

#### Scenario: Un salón se muestra en dos pantallas distintas

- **WHEN** el mismo salón aparece en el listado del tutor y en su barra lateral
- **THEN** ambas muestran el mismo color como pestaña, y ninguna el degradado
- **AND** la tarjeta del listado muestra además la ilustración del tema, y la barra lateral no

#### Scenario: El tutor abre el detalle de un salón

- **WHEN** el tutor entra en el detalle de un ClassGroup
- **THEN** la cabecera muestra la pestaña de color y la ilustración del tema, sin degradado

#### Scenario: Un salón se muestra al child

- **WHEN** el child ve su salón
- **THEN** ve el color, el degradado y la ilustración de su tema, como antes

#### Scenario: El salón se recarga desde el almacenamiento

- **WHEN** se vuelve a leer el salón tras recargar la página
- **THEN** obtiene el mismo tema sin haber almacenado ningún campo de tema
