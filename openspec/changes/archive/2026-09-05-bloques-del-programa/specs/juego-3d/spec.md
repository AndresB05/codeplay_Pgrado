## ADDED Requirements

### Requirement: El programa se construye arrastrando bloques

El sistema SHALL ofrecer un **editor de bloques** en el que el niño construya el
programa arrastrando piezas, sin escribir texto en ninguna parte.

El juego de bloques disponible SHALL ser, por ahora, el mínimo con el que se
recorre un tablero:

- **avanzar**, con **cuántas casillas** avanzar escrito en el propio bloque;
- **girar a la izquierda**;
- **girar a la derecha**.

Los bloques SHALL poder **encadenarse en secuencia**, y el orden en que quedan
encadenados SHALL ser el orden en que se leen. Un bloque suelto —que no cuelga de
la secuencia— NO SHALL formar parte del programa. El niño SHALL poder **quitar**
un bloque que ya colocó.

El número de casillas del bloque de avanzar SHALL ser **un número escrito en el
bloque**, nunca una expresión ni el resultado de otro bloque. Es lo que permite
contar los pasos leyendo el programa, sin ejecutarlo.

El editor SHALL ocupar la zona que la pantalla le reserva y SHALL redibujarse al
cambiar el tamaño de esa zona, de modo que el lienzo de bloques no quede con las
medidas viejas.

#### Scenario: Se arrastra el primer bloque al lienzo

- **WHEN** el niño arrastra un bloque desde la caja de herramientas al lienzo
- **THEN** el bloque queda colocado en el lienzo y se ve

#### Scenario: Se encadenan dos bloques

- **WHEN** el niño encaja un bloque debajo de otro que ya está colocado
- **THEN** los dos quedan encadenados en ese orden

#### Scenario: Se cambia cuántas casillas avanzar

- **WHEN** el niño escribe otro número en el bloque de avanzar
- **THEN** el bloque pasa a decir ese número de casillas

#### Scenario: Se quita un bloque colocado

- **WHEN** el niño quita del lienzo un bloque que había colocado
- **THEN** el bloque deja de formar parte del programa

#### Scenario: Cambia el tamaño de la zona del editor

- **WHEN** se cambia el tamaño de la ventana con el editor visible
- **THEN** el lienzo de bloques se redibuja ajustado a su zona

### Requirement: El editor de bloques está entero en español

Todo el texto del editor que el niño puede ver SHALL estar **en español**: el de
los propios bloques, el de las categorías de la caja de herramientas, el de los
menús que aparecen al pulsar sobre un bloque —duplicar, borrar, ayuda— y el de
los avisos que el editor muestre.

NO SHALL quedar texto en inglés a la vista. Un editor traducido a medias parece
terminado y no lo está.

#### Scenario: Se mira la caja de herramientas

- **WHEN** el niño abre la caja de herramientas
- **THEN** las categorías y los bloques que ofrece están en español

#### Scenario: Se abre el menú de un bloque

- **WHEN** el niño pulsa sobre un bloque colocado para abrir su menú
- **THEN** las opciones del menú están en español

### Requirement: El programa se lee como JSON con la versión del formato pegada

El sistema SHALL poder **leer el programa construido como JSON**, y ese JSON
SHALL reflejar qué bloques hay y en qué orden.

El JSON del programa SHALL viajar siempre **acompañado de la versión del
formato**, pegada a los mismos datos que describe y no en un campo aparte, de
modo que quien reciba sólo el programa sepa qué está leyendo. La versión SHALL
ser la única que existe hoy.

Mientras no haya pantalla de nivel, el sistema SHALL **enseñar ese JSON** en el
banco de pruebas, para que se pueda ver lo que los bloques producen.

#### Scenario: Se lee el programa de un lienzo con bloques

- **WHEN** hay bloques encadenados en el lienzo y se lee el programa
- **THEN** se obtiene un JSON que refleja esos bloques en el mismo orden
- **AND** ese JSON va acompañado de la versión del formato

#### Scenario: Se lee el programa de un lienzo vacío

- **WHEN** no hay ningún bloque en el lienzo y se lee el programa
- **THEN** se obtiene igualmente un JSON válido, con la versión del formato y sin bloques

#### Scenario: Se mira el JSON en el banco de pruebas

- **WHEN** el niño arrastra o quita un bloque en el banco de pruebas
- **THEN** el JSON que se enseña en pantalla pasa a reflejar el programa que hay

### Requirement: Un programa guardado se vuelve a cargar igual

El sistema SHALL poder **volver a cargar en el editor** un programa leído antes,
y el programa cargado SHALL ser **el mismo** que se leyó: los mismos bloques, en
el mismo orden y con los mismos números.

Volver a leer el programa después de cargarlo SHALL producir un JSON equivalente
al de partida. Es la garantía de la que depende que un nivel pueda entregar un
programa de partida y que un intento guardado pueda volver a abrirse.

Un programa cuya versión de formato el sistema no reconozca NO SHALL cargarse a
medias: SHALL rechazarse entero.

#### Scenario: Ida y vuelta de un programa

- **WHEN** se lee el programa de un lienzo, se vacía el lienzo y se vuelve a cargar lo leído
- **THEN** el lienzo queda con los mismos bloques, en el mismo orden y con los mismos números
- **AND** volver a leerlo produce un JSON equivalente al de partida

#### Scenario: Llega un programa con una versión de formato desconocida

- **WHEN** se intenta cargar un programa cuya versión de formato no es la que el sistema entiende
- **THEN** no se carga nada en el lienzo

## MODIFIED Requirements

### Requirement: El código del juego no viaja en la carga inicial

El sistema SHALL entregar el código del juego —el motor 3D, el editor de bloques
y todo lo que éstos arrastren— en una o más **descargas aparte de la carga
inicial** de la aplicación, y SHALL pedirlas sólo cuando se abre una pantalla que
aloja la pieza correspondiente.

Quien nunca abra una de esas pantallas NO SHALL descargar ese código. El peso de
la carga inicial NO SHALL crecer por lo que el juego incorpore, más allá del
coste fijo de tener esas descargas aparte.

Mientras una de esas descargas está en curso, el sistema SHALL mostrar un aviso
de carga en el lugar que ocupará la pieza, en lugar de dejar la zona en blanco.

#### Scenario: Se recorre la aplicación sin abrir el juego

- **WHEN** se abre la aplicación y se navega por sus pantallas sin abrir ninguna que aloje el juego
- **THEN** el código del juego no se descarga

#### Scenario: Se abre por primera vez la pantalla que aloja el juego

- **WHEN** se abre esa pantalla
- **THEN** el código del juego se descarga en ese momento, aparte del de la aplicación
- **AND** mientras llega se muestra un aviso de carga donde irá cada pieza
