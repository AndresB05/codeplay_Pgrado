# juego-3d Specification

## Purpose

El juego que el niño jugará: una escena 3D que corre **dentro** de la propia
aplicación web, sin programa ni marco aparte. Esta capacidad cubre cómo se
dibuja, cuándo llega su código al navegador, desde dónde se abre, y **qué se
juega en ella**: el tablero, el personaje que lo recorre casilla a casilla, los
bloques con los que se le escribe el programa, **qué pasa cuando ese programa
se ejecuta** y **qué se le dice al niño al terminar**.

**Ya se juega un nivel entero.** Se ve un tablero descrito por una configuración
—con casillas que no se pisan, unas porque son muro y otras porque son hueco—,
un personaje que avanza, gira y no atraviesa nada, un editor de bloques con las
tres órdenes mínimas del que sale el programa en JSON, y **el eslabón que faltaba
entre los dos: el programa mueve al personaje**. Se ve el recorrido paso a paso,
un choque no interrumpe lo que queda por ejecutar, y al terminar se sabe si se
llegó a la meta. Y al terminar se ve **cuántos pasos ha costado y cuántos cuesta
la mejor solución**, que es la magnitud que el juego puntúa: con eso el nivel no
sólo se juega, se juega **contra un número**.

Las **trece** garantías con las que la capacidad cuenta hasta aquí. Cinco venían
de antes: que el juego se dibuje dentro de la aplicación, que su código no pese
en la carga inicial, que el banco de pruebas no llegue a producción, que el
tablero salga de una configuración y no del código que lo pinta, y que el
personaje se mueva por casillas sin salirse del tablero.

Cuatro llegaron con los bloques: que el programa **se construya arrastrando** y
no escribiendo, que el editor esté **entero en español** y no a medias, que el
programa se pueda **leer como JSON con la versión del formato pegada** —porque
lo leen tres sitios distintos y ninguno debe adivinar qué está leyendo—, y que
un programa guardado **se vuelva a cargar igual**. Esta última parece obvia y no
lo es: es la que sostiene que un nivel pueda entregar un programa de partida y
que un intento guardado pueda volver a abrirse, y es la única que valida haber
elegido el JSON nativo del editor en vez de uno propio.

Y **dos llegan con la ejecución**: que el programa de bloques **mueva al
personaje**, viéndose paso a paso y sin que chocar interrumpa lo que queda por
ejecutar, y que el juego **sepa si el programa llegó a la meta**. La primera
carga con una regla que no es la evidente: **un avance imposible no detiene el
programa**, porque los pasos que se cuentan son los ordenados y no los
ejecutados, y un intérprete que se pare al chocar hace que el número que se le
enseña al niño y el que el servidor calcula dejen de poder coincidir con lo que
se vio en pantalla.

Y **dos llegan con el resultado**: que **los pasos se cuenten leyendo el
programa** —sin tablero y sin ejecutarlo, que es como los contará el servidor al
puntuar— y que **al terminar se vea lo que costó y lo que costaba lo bueno**. La
segunda carga con dos casos que hasta entonces se pintaban como un fracaso y no
lo eran: un lienzo **sin bloques**, que no es un programa malo sino la ausencia
de programa, y un lienzo con **bloques sueltos**, donde el olvidado más arriba se
ejecuta en lugar del programa — sin avisar, el niño no puede distinguir «mi
programa está mal» de «mi programa no se ejecutó».

**Y una se retiró con ellas**, que es la primera vez que esta capacidad pierde
una garantía: que las órdenes sueltas dadas a mano no llegaran a producción. Su
condición de existencia era «mientras el programa de bloques no exista», y el
programa existe y además se ejecuta. No fue limpieza: las órdenes sueltas y la
ejecución escribían **la misma posición del personaje**, y dos dueños de un
mismo estado sólo se notan cuando fallan.

Y la garantía de la carga inicial dejó de hablar de una sola descarga: **el motor
3D y el editor de bloques viajan en descargas distintas**, cada una detrás de su
propia frontera, porque el editor no es 3D y no cuelga de la del motor.

Y la de la meta **se acotó** al llegar el resultado: juzga los programas que
tienen alguna orden que ejecutar, porque un programa sin ninguna no es un intento
fallido — no hubo intento. Dice además, desde el otro lado, la distinción que el
recuento necesitaba: **la llegada se calcula ejecutando** porque depende del
tablero, **el recuento se calcula leyendo** porque no depende de él, y ninguna de
las dos se calcula como la otra.

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

### Requirement: El tablero se dibuja a partir de la configuración del nivel

El sistema SHALL dibujar el tablero leyendo una **configuración del nivel**, sin
llevar ninguna cuadrícula fija escrita dentro del código que la dibuja. Cambiar
la configuración SHALL cambiar lo que se ve, sin tocar el dibujado.

La configuración SHALL describir, como mínimo: qué casillas forman el tablero,
cuáles se pueden pisar y cuáles no, en qué casilla empieza el personaje y hacia
dónde mira, y cuál es la casilla de meta.

El tablero NO SHALL ser necesariamente un rectángulo lleno. Una casilla que no se
puede pisar SHALL ser de una de dos clases, y las dos SHALL distinguirse a la
vista:

- un **hueco**, que es una casilla que no existe y por la que se ve el vacío;
- un **muro**, que es una casilla que existe y que el personaje no puede pisar.

Todas las casillas SHALL ocupar el mismo tamaño y SHALL quedar contiguas, sin
rendijas ni solapes entre ellas. Ese tamaño SHALL ser una constante del juego y
NO SHALL deducirse de las medidas de ningún modelo gráfico.

La casilla de salida y la de meta SHALL distinguirse a la vista del resto.

#### Scenario: Se abre el tablero descrito por la configuración

- **WHEN** se abre la pantalla que aloja el juego
- **THEN** se ve un tablero de casillas con la forma, el tamaño y la disposición que describe la configuración
- **AND** se distinguen a la vista las casillas pisables, los muros, los huecos, la salida y la meta

#### Scenario: La configuración describe un tablero con huecos y muros

- **WHEN** la configuración marca una casilla como hueco y otra como muro
- **THEN** en el sitio del hueco no se dibuja casilla alguna
- **AND** en el sitio del muro se dibuja algo que se ve como intransitable

#### Scenario: El personaje aparece donde dice la configuración

- **WHEN** se abre la pantalla que aloja el juego
- **THEN** el personaje aparece sobre la casilla de salida que indica la configuración, mirando hacia la dirección que ésta indica

### Requirement: El personaje se mueve por casillas y no atraviesa nada

El personaje SHALL ocupar **una casilla** del tablero y mirar hacia **una de las
cuatro direcciones**. Su posición y su orientación SHALL cambiar únicamente por
dos órdenes:

- **avanzar**, que lo lleva a la casilla contigua en la dirección a la que mira,
  sin cambiar de orientación;
- **girar** a un lado o al otro, que cambia su orientación un cuarto de vuelta
  **sin cambiar de casilla**.

Avanzar SHALL quedar sin efecto —el personaje se queda donde está, mirando a
donde miraba— cuando la casilla de destino sea un muro, sea un hueco, o quede
fuera del tablero. En ninguno de los tres casos SHALL el personaje salir del
tablero, meterse en un hueco ni ocupar un muro.

Girar SHALL ser siempre posible, sea cual sea la casilla que el personaje ocupa y
lo que haya a su alrededor.

Las reglas anteriores SHALL depender únicamente de la configuración del nivel, de
la casilla ocupada y de la orientación: NO SHALL depender de cómo se dibuje la
escena.

#### Scenario: Avanzar hacia una casilla pisable

- **WHEN** se ordena avanzar y la casilla contigua en la dirección a la que mira el personaje se puede pisar
- **THEN** el personaje pasa a ocupar esa casilla
- **AND** sigue mirando hacia la misma dirección

#### Scenario: Avanzar contra un muro

- **WHEN** se ordena avanzar y la casilla contigua es un muro
- **THEN** el personaje se queda en su casilla, mirando hacia donde miraba

#### Scenario: Avanzar contra un hueco

- **WHEN** se ordena avanzar y la casilla contigua es un hueco
- **THEN** el personaje se queda en su casilla, mirando hacia donde miraba

#### Scenario: Avanzar contra el borde del tablero

- **WHEN** se ordena avanzar y la dirección a la que mira el personaje lo sacaría del tablero
- **THEN** el personaje se queda en su casilla, mirando hacia donde miraba

#### Scenario: Girar sobre la propia casilla

- **WHEN** se ordena girar a un lado
- **THEN** el personaje sigue en la misma casilla
- **AND** pasa a mirar hacia la dirección que queda a ese lado de la que miraba

#### Scenario: Cuatro giros seguidos hacia el mismo lado

- **WHEN** se ordena girar cuatro veces seguidas hacia el mismo lado
- **THEN** el personaje acaba mirando hacia la dirección de partida, en la misma casilla

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

### Requirement: El programa de bloques mueve al personaje

El sistema SHALL **ejecutar** el programa que el niño ha construido con los
bloques, moviendo al personaje por el tablero, y SHALL hacerlo **sólo cuando se
le pide**: mientras no se pida, los bloques se colocan sin que nadie se mueva.

Las órdenes SHALL ejecutarse **en el orden en que quedan encadenadas**, y cada
una SHALL producir en el personaje el mismo efecto que produciría dada a mano:
avanzar lo lleva a la casilla contigua en la dirección a la que mira, y girar le
cambia la orientación sin sacarlo de su casilla.

**La ejecución SHALL verse paso a paso**: cada casilla recorrida y cada giro
SHALL representarse por separado y con una duración perceptible, de modo que se
pueda seguir el recorrido con la vista. Un `avanzar` de varias casillas SHALL
verse como varios movimientos de una casilla, no como un salto.

**Un avance imposible NO SHALL interrumpir la ejecución.** Cuando la casilla de
destino sea un muro, un hueco o quede fuera del tablero, el personaje SHALL
quedarse donde está, el intento SHALL **verse** —de modo que se entienda contra
qué se ha topado— y el programa SHALL continuar con la orden siguiente. Esto vale
también para las casillas que le queden a un `avanzar` de varias: las que no se
pueden dar se intentan igual.

Mientras una ejecución está en curso, el sistema NO SHALL empezar otra.

El sistema SHALL ofrecer, además, **devolver al personaje a la casilla de salida**
con su orientación de partida, tanto al terminar una ejecución como durante ella.

Cuando el lienzo tenga **varias secuencias sueltas**, el sistema SHALL ejecutar
**una sola**: la que empieza más arriba en el lienzo —y más a la izquierda, si
dos empiezan a la misma altura—. Las demás NO SHALL ejecutarse.

Si el programa no tiene ninguna orden, pedir la ejecución SHALL terminar sin
mover a nadie y sin error.

#### Scenario: Se ejecuta un programa que recorre el tablero

- **WHEN** hay bloques encadenados en el lienzo y se pide ejecutar el programa
- **THEN** el personaje recorre el tablero haciendo lo que dicen los bloques, en el orden en que están encadenados

#### Scenario: Se ejecuta un avance de varias casillas

- **WHEN** se ejecuta un bloque de avanzar con un número mayor que uno
- **THEN** el personaje recorre esas casillas **de una en una**, y cada una se ve

#### Scenario: El programa choca contra algo que no se puede pisar

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco o fuera del tablero
- **THEN** se ve que el personaje lo intenta y no puede, y se queda en su casilla mirando hacia donde miraba
- **AND** la ejecución continúa con la orden siguiente en lugar de detenerse

#### Scenario: Se pide ejecutar mientras se está ejecutando

- **WHEN** se pide ejecutar el programa con una ejecución ya en curso
- **THEN** no se lanza una segunda ejecución

#### Scenario: Se devuelve al personaje a la salida

- **WHEN** se pide devolver al personaje a la salida
- **THEN** el personaje vuelve a la casilla de salida, mirando hacia la dirección de partida
- **AND** si había una ejecución en curso, deja de haberla

#### Scenario: El lienzo tiene dos secuencias sueltas

- **WHEN** el lienzo tiene dos secuencias que no están encadenadas entre sí y se pide ejecutar el programa
- **THEN** se ejecuta únicamente la que empieza más arriba en el lienzo

#### Scenario: Se ejecuta un lienzo vacío

- **WHEN** no hay ningún bloque en el lienzo y se pide ejecutar el programa
- **THEN** la ejecución termina sin mover al personaje y sin dar error

### Requirement: El juego sabe si el programa llegó a la meta

Al terminar de ejecutar un programa **que tenía alguna orden que ejecutar**, el
sistema SHALL determinar si el personaje **pisó la casilla de meta**, y SHALL
**mostrar el resultado** —se llegó o no se llegó— sin que haga falta
interpretarlo mirando la escena.

Pisar la meta **en cualquier momento** de la ejecución SHALL contar como haber
llegado, aunque el programa continúe después y el personaje acabe en otra
casilla. Pasarse de largo es ineficiencia, no fracaso: se paga en el recuento de
pasos, que es lo que el juego puntúa.

Llegar NO SHALL exigir ninguna orientación: la meta se pisa mirando adonde sea.

El resultado SHALL calcularse **de lo que ocurrió al ejecutar**, y no de lo que
el programa parece decir.

**Un programa sin ninguna orden NO SHALL juzgarse.** Cuando no hay nada que
ejecutar no hubo intento, así que NO SHALL indicarse que no se llegó a la meta:
lo que se dice entonces lo gobierna el requisito del resultado y el recuento.
Hasta hoy este requisito abarcaba también ese caso, y por eso el lienzo vacío se
presentaba como un intento fallido.

**La llegada y el recuento son dos magnitudes distintas y se obtienen de dos
maneras distintas, y conviene no leerlas como opuestas.** La **llegada** se
calcula **ejecutando**, porque depende del tablero: sólo recorriéndolo se sabe
qué casillas se pisaron. El **recuento** se calcula **leyendo** el programa,
porque no depende del tablero y porque quien puntúa no ejecuta nada. Ninguna de
las dos SHALL calcularse como la otra: una llegada deducida del programa sin
ejecutarlo ignoraría los muros, y un recuento tomado de lo que la ejecución
recorrió contaría los pasos conseguidos en vez de los ordenados.

#### Scenario: El programa termina sobre la meta

- **WHEN** se ejecuta un programa que lleva al personaje hasta la casilla de meta y ahí acaba
- **THEN** al terminar se indica que se llegó a la meta

#### Scenario: El programa pisa la meta y sigue

- **WHEN** se ejecuta un programa que pisa la casilla de meta y después se lleva al personaje a otra casilla
- **THEN** al terminar se indica igualmente que se llegó a la meta

#### Scenario: El programa no pasa por la meta

- **WHEN** se ejecuta un programa **con al menos una orden** que en ningún momento lleva al personaje a la casilla de meta
- **THEN** al terminar se indica que no se llegó

#### Scenario: El programa no tiene ninguna orden que ejecutar

- **WHEN** se pide ejecutar un programa sin ninguna orden
- **THEN** no se indica que no se llegó a la meta

#### Scenario: Se llega a la meta mirando a cualquier lado

- **WHEN** el personaje pisa la casilla de meta mirando hacia una dirección cualquiera
- **THEN** se indica que se llegó, sea cual sea esa dirección

### Requirement: Los pasos se cuentan leyendo el programa

El sistema SHALL determinar cuántos pasos cuesta un programa **leyéndolo**, sin
tablero, sin saber dónde está el personaje y sin ejecutarlo.

Las reglas del recuento SHALL ser:

- **avanzar N** cuenta **N** pasos;
- **girar** a un lado o al otro cuenta **un** paso.

Se SHALL contar los pasos **ordenados**, no los conseguidos: un `avanzar` de
cuatro casillas contra un muro que está a dos cuenta **cuatro**. Chocar es
ineficiencia y la ineficiencia es lo que se puntúa; contar lo conseguido
obligaría a ejecutar para saber el número, y entonces quien no ejecuta —el
servidor, al puntuar— contaría distinto.

El número que el juego le SHALL enseñar al niño SHALL ser **ese mismo**, y NO
SHALL salir de contar lo que la ejecución produjo. Los dos caminos dan hoy el
mismo resultado, y esa coincidencia SHALL poder comprobarse: es la única señal de
que el recuento de la pantalla y el de la puntuación no han dejado de coincidir.

Esto NO contradice que la **llegada** se calcule ejecutando, aunque puesto al
lado parezca lo contrario: son dos magnitudes distintas y la diferencia es que
una depende del tablero y la otra no. El requisito de la llegada lo dice desde el
otro lado.

Un programa sin ninguna orden SHALL costar **cero** pasos.

#### Scenario: Se cuenta un programa que encadena giros y avances

- **WHEN** el programa es girar a la derecha, avanzar 4, girar a la izquierda y avanzar 4
- **THEN** el recuento es de diez pasos

#### Scenario: Se cuenta un programa que choca

- **WHEN** el programa ordena avanzar cuatro casillas y sólo dos se pueden recorrer
- **THEN** el recuento es de cuatro pasos, no de dos

#### Scenario: El recuento y el recorrido dicen lo mismo

- **WHEN** se cuenta un programa leyéndolo y se ejecuta ese mismo programa sobre un tablero
- **THEN** el número de pasos contados y el número de pasos que la ejecución recorre coinciden

#### Scenario: Se cuenta un programa sin órdenes

- **WHEN** el programa no tiene ninguna orden
- **THEN** el recuento es de cero pasos

### Requirement: Al terminar se ve lo que costó y lo que costaba lo bueno

Al terminar de ejecutar el programa, el sistema SHALL mostrar **cuántos pasos ha
costado** y **cuántos cuesta la mejor solución del nivel**, junto al resultado de
si se llegó a la meta. NO SHALL hacer falta contar los movimientos a ojo ni
interpretar la escena para saberlo.

El sistema SHALL indicar de forma distinguible que el recorrido fue **el mejor
posible**: cuando se llegó a la meta y no se gastaron más pasos de los que cuesta
la mejor solución. Llegar gastando de más NO SHALL presentarse como un fracaso:
se llegó, y lo que sobra son pasos.

El resultado NO SHALL tapar la escena ni la posición en la que el personaje ha
quedado: pisar la meta y seguir cuenta como haber llegado, y el paseo de más es
justamente lo que explica el número.

**Un lienzo sin bloques NO SHALL presentarse como un intento fallido.** Cuando no
hay ninguna orden que ejecutar, el sistema SHALL decir que no hay programa y NO
SHALL mostrar recuento alguno: cero pasos contra los del nivel le diría al niño
que su programa fue malo cuando lo que ocurre es que no hay programa.

**Cuando el lienzo tenga varias secuencias sueltas, el sistema SHALL avisar de
que ha sobrado alguna**, junto al resultado y sin sustituirlo — la secuencia que
correspondía sí se ha ejecutado. Sin ese aviso, un bloque olvidado por encima del
programa se ejecuta en su lugar y el niño no puede distinguir «mi programa está
mal» de «mi programa no se ha ejecutado».

Mientras la ejecución está en curso NO SHALL mostrarse todavía el resultado, y al
devolver al personaje a la salida el resultado SHALL desaparecer.

#### Scenario: El programa llega a la meta gastando de más

- **WHEN** termina un programa que llega a la meta con más pasos de los que cuesta la mejor solución
- **THEN** se indica que se llegó a la meta
- **AND** se ven los pasos que ha costado y los que cuesta la mejor solución

#### Scenario: El programa resuelve el nivel con los pasos justos

- **WHEN** termina un programa que llega a la meta sin gastar más pasos de los que cuesta la mejor solución
- **THEN** se indica, además de que se llegó, que el recorrido fue el mejor posible

#### Scenario: El programa no llega a la meta

- **WHEN** termina un programa que en ningún momento pisa la meta
- **THEN** se indica que no se llegó
- **AND** se ven igualmente los pasos que ha costado y los que cuesta la mejor solución

#### Scenario: Se pide ejecutar un lienzo sin bloques

- **WHEN** se pide ejecutar el programa y no hay ningún bloque en el lienzo
- **THEN** se indica que no hay ningún programa que ejecutar
- **AND** no se muestra ningún recuento de pasos

#### Scenario: El lienzo tiene bloques sueltos fuera del programa

- **WHEN** termina la ejecución de un lienzo que tenía más de una secuencia suelta
- **THEN** se avisa de que ha sobrado alguna y de que sólo se ha ejecutado una
- **AND** el resultado y el recuento de la secuencia ejecutada se ven igualmente

#### Scenario: La ejecución está en curso

- **WHEN** el personaje todavía está recorriendo el programa
- **THEN** no se muestra ningún resultado ni recuento final

#### Scenario: Se devuelve al personaje a la salida

- **WHEN** se pide devolver al personaje a la salida después de una ejecución terminada
- **THEN** el resultado y el recuento dejan de mostrarse
