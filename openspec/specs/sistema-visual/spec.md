# sistema-visual Specification

## Purpose

Sistema de diseño de CodePlay: paleta, tipografías, componentes con relieve y el
bioma de selva tropical. Busca que la plataforma se vea tangible e infantil, en
la línea de CodeCombat, CodeMonkey y Scratch, en lugar de plana y genérica.

## Requirements

### Requirement: Tokens de diseño centralizados

El sistema SHALL exponer la paleta y las tipografías como tokens, disponibles a
la vez como variables CSS en `main.css` y como nombres de Tailwind en
`tailwind.config.js`. Los componentes SHALL usar los nombres, nunca valores
hexadecimales sueltos.

#### Scenario: Un componente necesita el color primario

- **WHEN** un componente pinta una acción principal
- **THEN** usa el nombre `grape` en lugar del hexadecimal `#7B3FE4`

#### Scenario: Se conserva la nomenclatura antigua

- **WHEN** una pantalla todavía no migrada usa `primary`, `secondary`, `tertiary` o `neutral`
- **THEN** esos nombres siguen resolviendo a los colores actuales y la pantalla no se rompe

### Requirement: Botones con relieve sólido

El sistema SHALL dar a los botones un borde inferior de color oscuro que simula
relieve, y SHALL hundirlo al pulsar en lugar de usar sombras difuminadas.

#### Scenario: El usuario mantiene pulsado un botón

- **WHEN** el botón está en estado `active` y no deshabilitado
- **THEN** desciende 3 píxeles
- **AND** su borde inferior se reduce de 5 a 2 píxeles

#### Scenario: El botón está deshabilitado

- **WHEN** el botón tiene el atributo `disabled`
- **THEN** se muestra con escala de grises al 50 % y opacidad 0,65
- **AND** no responde a `hover`

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

### Requirement: Huecos reservados para la mascota

El sistema SHALL marcar con contorno discontinuo los espacios destinados a la
ilustración definitiva de la mascota, y SHALL dejarlos vacíos mientras esa
ilustración no exista.

#### Scenario: Una pantalla incluye un hueco de mascota

- **WHEN** se renderiza un `.mascot-slot` o un `ImagePlaceholder`
- **THEN** se dibuja un marco de contorno discontinuo sobre fondo crema
- **AND** no se muestra ninguna imagen de relleno ni ilustración provisional

### Requirement: Adornos decorativos accesibles

Los adornos SVG del tema de selva SHALL ser invisibles para las tecnologías de
asistencia y SHALL no capturar el puntero.

#### Scenario: Un lector de pantalla recorre una pantalla decorada

- **WHEN** el lector llega a una hoja, flor, liana o tucán decorativos
- **THEN** el elemento está marcado `aria-hidden` y no se anuncia
- **AND** el puntero atraviesa el adorno sin bloquear los controles que hay debajo

### Requirement: Las pantallas del tutor van sobre un fondo liso

Las pantallas del tutor SHALL ir sobre un **fondo liso** de un color del tema, sin
la ilustración de la selva —la cascada y el valle— ni la trama de lunares. Son
pantallas de trabajo para adultos, y el adorno compite con las tablas y las
cifras. Pedido por el usuario tras probar el panel el 14-oct-2026.

Las pantallas del **niño NO SHALL cambiar**: siguen con su fondo ilustrado.

Sobre el fondo liso, las tarjetas, tablas y avisos del tutor SHALL seguir
distinguiéndose del fondo por su contorno y su color, sin perder contraste.

#### Scenario: El tutor abre sus salones

- **WHEN** el tutor entra en cualquiera de sus pantallas
- **THEN** el fondo es un color liso del tema, sin ilustración

#### Scenario: El niño abre sus mundos

- **WHEN** un niño entra en cualquiera de sus pantallas
- **THEN** el fondo ilustrado sigue como antes

#### Scenario: Las tarjetas se leen sobre el fondo liso

- **WHEN** el tutor mira las tarjetas de resumen y las tablas
- **THEN** cada tarjeta se distingue del fondo por su contorno y su color

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

### Requirement: El nivel se puede jugar en un teléfono

Por debajo de 1024 px de ancho, la pantalla del nivel del child SHALL repartir el
juego en dos pestañas que llenan el alto disponible: «Bloques», con el lienzo y
la caja de bloques juntos, y «Tablero», con la escena. Los botones Ejecutar,
Detener y Limpiar y el mensaje de la partida SHALL verse desde las dos pestañas,
y pulsar Ejecutar SHALL llevar a «Tablero». Un bloque SHALL poder arrastrarse
con el dedo de la caja al lienzo sin que la página se desplace. La caja SHALL
enseñar todos los bloques del nivel enteros, en una fila o en dos. A partir de
1024 px la pantalla del nivel SHALL verse como antes del cambio.

#### Scenario: Armar y ejecutar un programa en un teléfono

- **WHEN** un child abre un nivel a 360×640 y arrastra con el dedo «avanzar» de la caja al lienzo
- **THEN** el bloque queda en el lienzo y la página no se ha desplazado
- **AND** al pulsar Ejecutar la pantalla pasa a «Tablero» y el personaje se mueve

#### Scenario: El nivel en el escritorio

- **WHEN** un child abre un nivel a 1280 px
- **THEN** la escena y el lienzo se ven lado a lado, como antes del cambio, sin pestañas
