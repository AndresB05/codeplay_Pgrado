# juego-3d Specification

## Purpose

El juego que el niño jugará: una escena 3D que corre **dentro** de la propia
aplicación web, sin programa ni marco aparte. Esta capacidad cubre cómo se
dibuja, cuándo llega su código al navegador y desde dónde se abre; las reglas de
juego —la rejilla, el programa de bloques, el recuento de pasos y la
puntuación— entran en pasos posteriores.

**Hoy no hay nada jugable, y se dice tal cual:** lo que existe es el esqueleto
—una escena con un cubo, cargada en diferido desde una pantalla que sólo aparece
en desarrollo—. La capacidad nace con las tres garantías que no conviene decidir
más tarde: que el juego se dibuje dentro de la aplicación, que su código no pese
en la carga inicial, y que el banco de pruebas no llegue a producción.

## Requirements

### Requirement: El juego se dibuja dentro de la aplicación

El sistema SHALL dibujar la escena 3D **dentro de la misma página** que la
aloja, como una parte más de la aplicación. NO SHALL cargarla desde un programa
aparte, ni encerrarla en un marco embebido, ni comunicarse con ella por paso de
mensajes.

La escena SHALL ocupar el espacio que la pantalla le reserva y SHALL redibujarse
al cambiar el tamaño de esa zona, de modo que no quede recortada ni deformada.

#### Scenario: Se abre la pantalla que aloja el juego

- **WHEN** se abre la pantalla que aloja el juego
- **THEN** se ve una escena 3D dibujada dentro de la propia página
- **AND** el resto de la pantalla —barra superior, barra lateral y navegación— sigue funcionando con normalidad

#### Scenario: Cambia el tamaño de la ventana

- **WHEN** se cambia el tamaño de la ventana con la escena visible
- **THEN** la escena se redibuja ajustada a su zona, sin recorte ni deformación

### Requirement: El código del juego no viaja en la carga inicial

El sistema SHALL entregar el código del juego —el motor 3D y todo lo que éste
arrastre— en una **descarga aparte de la carga inicial** de la aplicación, y
SHALL pedirla sólo cuando se abre una pantalla que aloja el juego.

Quien nunca abra una de esas pantallas NO SHALL descargar ese código. El peso de
la carga inicial NO SHALL crecer por lo que el juego incorpore, más allá del
coste fijo de tener esa descarga aparte.

Mientras esa descarga está en curso, el sistema SHALL mostrar un aviso de carga
en el lugar de la escena, en lugar de dejar la zona en blanco.

#### Scenario: Se recorre la aplicación sin abrir el juego

- **WHEN** se abre la aplicación y se navega por sus pantallas sin abrir ninguna que aloje el juego
- **THEN** el código del juego no se descarga

#### Scenario: Se abre por primera vez la pantalla que aloja el juego

- **WHEN** se abre esa pantalla
- **THEN** el código del juego se descarga en ese momento, aparte del de la aplicación
- **AND** mientras llega se muestra un aviso de carga donde irá la escena

### Requirement: El banco de pruebas del juego sólo existe en desarrollo

Mientras la pantalla de nivel definitiva no exista, el sistema SHALL ofrecer una
pantalla de pruebas en el panel del niño desde la que se ve funcionar el juego,
y esa pantalla SHALL existir **únicamente cuando la aplicación se ejecuta en
modo desarrollo**.

En producción NO SHALL haber forma de llegar a ella: ni enlace en la navegación,
ni dirección que la abra al escribirla.

#### Scenario: La aplicación corre en desarrollo

- **WHEN** el niño mira la navegación de su panel
- **THEN** aparece la entrada del banco de pruebas, señalada como pantalla de desarrollo
- **AND** al elegirla se abre la pantalla con la escena

#### Scenario: La aplicación corre en producción

- **WHEN** se escribe la dirección del banco de pruebas en el navegador
- **THEN** no se abre esa pantalla

#### Scenario: La navegación en producción

- **WHEN** el niño mira la navegación de su panel en producción
- **THEN** no aparece ninguna entrada del banco de pruebas
