## MODIFIED Requirements

### Requirement: El tablero se dibuja a partir de la configuración del nivel

El sistema SHALL dibujar el tablero leyendo una **configuración del nivel**, sin
llevar ninguna cuadrícula fija escrita dentro del código que la dibuja. Cambiar
la configuración SHALL cambiar lo que se ve, sin tocar el dibujado.

La configuración SHALL describir, como mínimo: qué casillas forman el tablero,
cuáles se pueden pisar y cuáles no, **qué altura tiene cada casilla que existe**,
en qué casilla empieza el personaje y hacia dónde mira, y cuál es la casilla de
meta.

El tablero NO SHALL ser necesariamente un rectángulo lleno. Una casilla que no se
puede pisar SHALL ser de una de dos clases, y las dos SHALL distinguirse a la
vista:

- un **hueco**, que es una casilla que no existe y por la que se ve el vacío;
- un **muro**, que es una casilla que existe y que el personaje no puede pisar.

**Cada casilla que existe SHALL ser una columna** de una altura entera de uno o
más niveles, y SHALL dibujarse **apoyada en el suelo del tablero**: NO SHALL haber
nada flotando. Un hueco NO SHALL tener altura. Una configuración en la que un
hueco tenga altura o una casilla que existe no la tenga NO SHALL describir un
tablero, y el nivel SHALL rechazarse entero.

Un tablero cuyas casillas midan todas un nivel SHALL verse **igual que un tablero
sin alturas**.

Todas las casillas SHALL ocupar el mismo tamaño y SHALL quedar contiguas, **sin
rendijas entre ellas**. Ese tamaño SHALL ser una constante del juego y NO SHALL
deducirse de las medidas de ningún modelo gráfico.

**Lo que dibuja una casilla SÍ SHALL poder salirse de ella** cuando su forma lo
pida —un obstáculo mayor que su casilla, el labio de hierba del borde—, siempre
que no abra rendijas, no mueva ninguna casilla de su sitio y **no esconda las
contiguas**: la casilla de al lado SHALL seguir viéndose y contándose. Lo que
ocupa el mismo tamaño es la casilla, no la pieza con la que se dibuja.

**La rejilla SHALL poder contarse.** Dos casillas pisables contiguas SHALL
distinguirse la una de la otra a la vista, desde la vista de partida y sin
acercar ni girar la cámara. El niño cuenta casillas para saber cuántos pasos da,
y un suelo continuo en el que no se ven las juntas deja de poder contarse.

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

#### Scenario: Se cuenta la rejilla

- **WHEN** el niño mira el tablero en la vista de partida y cuenta las casillas de una fila
- **THEN** se ve dónde acaba cada casilla y empieza la siguiente
- **AND** el número de casillas que se cuentan es el que describe la configuración

#### Scenario: La configuración describe casillas de varias alturas

- **WHEN** la configuración da a una casilla altura tres y a su vecina altura uno
- **THEN** la primera se ve como una columna tres niveles alta, apoyada en el suelo del tablero
- **AND** el personaje, sobre cualquiera de las dos, aparece encima de su columna

#### Scenario: Un hueco con altura

- **WHEN** la configuración da altura a una casilla que es hueco, o deja sin altura una que existe
- **THEN** el nivel se rechaza entero y no se dibuja ningún tablero

### Requirement: El personaje se mueve por casillas y no atraviesa nada

El personaje SHALL ocupar **una casilla** del tablero y mirar hacia **una de las
cuatro direcciones**, y SHALL estar siempre **encima de la columna** de esa
casilla. Su posición y su orientación SHALL cambiar únicamente por tres órdenes:

- **avanzar**, que lo lleva a la casilla contigua en la dirección a la que mira,
  sin cambiar de orientación;
- **girar** a un lado o al otro, que cambia su orientación un cuarto de vuelta
  **sin cambiar de casilla**;
- **saltar**, que ejecuta **saltando** las órdenes que lleva dentro, con las
  reglas de abajo.

Avanzar SHALL llevarlo a una casilla contigua **de la misma altura o más baja**,
sea cual sea la diferencia: bajar SHALL ser posible siempre que haya dónde pisar.
Avanzar SHALL quedar sin efecto —el personaje se queda donde está, mirando a donde
miraba— cuando la casilla de destino sea un muro, sea un hueco, quede fuera del
tablero **o sea más alta que la suya**.

**Avanzar saltando** SHALL llevarlo a una casilla contigua **un nivel más alta, de
la misma altura o más baja**. SHALL quedar sin efecto —salta en el sitio y se
queda— cuando la casilla de destino esté **dos o más niveles más alta**, sea un
muro, sea un hueco o quede fuera del tablero.

En ningún caso SHALL el personaje salir del tablero, meterse en un hueco, caer al
vacío ni ocupar un muro.

Girar SHALL ser siempre posible, sea cual sea la casilla que el personaje ocupa y
lo que haya a su alrededor, también saltando.

Las reglas anteriores SHALL depender únicamente de la configuración del nivel, de
la casilla ocupada y de la orientación: NO SHALL depender de cómo se dibuje la
escena.

#### Scenario: Avanzar hacia una casilla pisable

- **WHEN** se ordena avanzar y la casilla contigua en la dirección a la que mira el personaje se puede pisar y está a su misma altura
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

#### Scenario: Avanzar hacia una casilla más alta

- **WHEN** se ordena avanzar y la casilla contigua es un nivel o más alta que la del personaje
- **THEN** el personaje se queda en su casilla, mirando hacia donde miraba

#### Scenario: Avanzar hacia una casilla más baja

- **WHEN** se ordena avanzar y la casilla contigua se puede pisar y es más baja, aunque sea varios niveles
- **THEN** el personaje baja a esa casilla

#### Scenario: Avanzar saltando a una casilla un nivel más alta

- **WHEN** se ordena avanzar saltando y la casilla contigua se puede pisar y está un nivel más alta
- **THEN** el personaje sube a esa casilla

#### Scenario: Avanzar saltando a una casilla dos niveles más alta

- **WHEN** se ordena avanzar saltando y la casilla contigua está dos o más niveles más alta
- **THEN** el personaje salta en el sitio y se queda en su casilla, mirando hacia donde miraba

#### Scenario: Avanzar saltando hacia un hueco

- **WHEN** se ordena avanzar saltando y la casilla contigua es un hueco
- **THEN** el personaje salta en el sitio y se queda en su casilla, sin caer

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

El juego de bloques disponible SHALL ser, por ahora:

- **avanzar**, con **cuántas casillas** avanzar escrito en el propio bloque;
- **girar a la izquierda**;
- **girar a la derecha**;
- **saltar**, que **lleva otros bloques dentro**.

Los bloques SHALL poder **encadenarse en secuencia**, y el orden en que quedan
encadenados SHALL ser el orden en que se leen. Un bloque suelto —que no cuelga de
la secuencia— NO SHALL formar parte del programa. El niño SHALL poder **quitar**
un bloque que ya colocó.

**Dentro de saltar SHALL poder encadenarse** una secuencia de **avanzar y giros**,
que es su cuerpo, y SHALL leerse en su orden. Dentro de saltar NO SHALL poder
colocarse otro saltar. Un saltar sin nada dentro SHALL ser un bloque válido.

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

#### Scenario: Se meten bloques dentro de saltar

- **WHEN** el niño encaja un girar y después un avanzar dentro de un bloque saltar
- **THEN** los dos quedan dentro de saltar, en ese orden, como su cuerpo

#### Scenario: Se intenta meter un saltar dentro de otro

- **WHEN** el niño arrastra un bloque saltar hasta el interior de otro saltar
- **THEN** no queda dentro

### Requirement: El programa se lee como JSON con la versión del formato pegada

El sistema SHALL poder **leer el programa construido como JSON**, y ese JSON
SHALL reflejar qué bloques hay, en qué orden **y cuáles van dentro de cuáles**.

El JSON del programa SHALL viajar siempre **acompañado de la versión del
formato**, pegada a los mismos datos que describe y no en un campo aparte, de
modo que quien reciba sólo el programa sepa qué está leyendo. La versión SHALL
ser **`grid-blockly-2`**, la única que el juego acepta: la que nombra el tablero
con alturas y el programa con bloques dentro de otros.

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

#### Scenario: Se lee un programa con un saltar lleno

- **WHEN** el lienzo tiene un saltar con bloques dentro y se lee el programa
- **THEN** el JSON refleja el saltar y, dentro de él, sus bloques en su orden

#### Scenario: Llega un nivel en la versión anterior

- **WHEN** se abre un nivel cuya versión del formato es `grid-blockly-1`
- **THEN** el nivel se rechaza entero, como cualquier versión que el juego no acepta

### Requirement: El programa de bloques mueve al personaje

El sistema SHALL **ejecutar** el programa que el niño ha construido con los
bloques, moviendo al personaje por el tablero, y SHALL hacerlo **sólo cuando se
le pide**: mientras no se pida, los bloques se colocan sin que nadie se mueva.

Las órdenes SHALL ejecutarse **en el orden en que quedan encadenadas**, y cada
una SHALL producir en el personaje el mismo efecto que produciría dada a mano:
avanzar lo lleva a la casilla contigua en la dirección a la que mira, girar le
cambia la orientación sin sacarlo de su casilla, y **saltar ejecuta su cuerpo
saltando**.

**La ejecución SHALL verse paso a paso**: cada casilla recorrida y cada giro
SHALL representarse por separado y con una duración perceptible, de modo que se
pueda seguir el recorrido con la vista. Un `avanzar` de varias casillas SHALL
verse como varios movimientos de una casilla, no como un salto.

**Saltar SHALL verse como un salto**: un saltar vacío, como un salto en el sitio;
y cada orden de su cuerpo, como **un salto por cada una**. Un `avanzar` de varias
casillas dentro de saltar SHALL verse como **un salto por casilla**, y un giro,
como un salto durante el que el personaje gira. Subir, avanzar a la misma altura,
bajar y quedarse en el sitio SHALL distinguirse a la vista.

**Un avance imposible NO SHALL interrumpir la ejecución.** Cuando la casilla de
destino no se pueda alcanzar, el personaje SHALL quedarse donde está, el intento
SHALL **verse** —de modo que se entienda contra qué se ha topado— y el programa
SHALL continuar con la orden siguiente. Esto vale también para las casillas que
le queden a un `avanzar` de varias, dentro o fuera de saltar: las que no se
pueden dar se intentan igual.

Mientras una ejecución está en curso, el sistema NO SHALL empezar otra.

El sistema SHALL ofrecer, además, **devolver al personaje a la casilla de salida**
con su orientación de partida, tanto al terminar una ejecución como durante ella.

**Y SHALL ofrecer detener una ejecución en curso, que no es lo mismo.** Detenerla
SHALL **congelar el recorrido donde va**: el personaje SHALL quedarse en la
casilla y con la orientación del paso en curso, y NO SHALL volver a la salida.
Son dos controles porque son dos cosas: uno para ver dónde se ha quedado, otro
para empezar de nuevo.

**Un recorrido detenido NO SHALL reanudarse.** Pedir la ejecución otra vez SHALL
ejecutar el programa **desde el principio**, con el personaje partiendo de la
salida, y SHALL leer el programa que haya en el lienzo en ese momento.

Detener SHALL poder pedirse **sólo mientras hay una ejecución en curso**.

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

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco, fuera del tablero o una casilla más alta
- **THEN** se ve que el personaje lo intenta y no puede, y se queda en su casilla mirando hacia donde miraba
- **AND** la ejecución continúa con la orden siguiente en lugar de detenerse

#### Scenario: Se ejecuta un saltar con un avance de dos casillas por una escalera

- **WHEN** se ejecuta un saltar con avanzar 2 dentro, delante de dos casillas que suben un nivel cada una
- **THEN** el personaje sube la escalera con un salto por casilla, y cada salto se ve

#### Scenario: Se ejecuta un saltar vacío

- **WHEN** se ejecuta un saltar sin nada dentro
- **THEN** se ve al personaje saltar en el sitio, sin cambiar de casilla ni de orientación

#### Scenario: Se ejecuta un saltar con un giro y un avance dentro

- **WHEN** se ejecuta un saltar con girar a la derecha y avanzar 1 dentro
- **THEN** el personaje salta girando en su casilla y después salta a la casilla siguiente

#### Scenario: Se pide ejecutar mientras se está ejecutando

- **WHEN** se pide ejecutar el programa con una ejecución ya en curso
- **THEN** no se lanza una segunda ejecución

#### Scenario: Se devuelve al personaje a la salida

- **WHEN** se pide devolver al personaje a la salida
- **THEN** el personaje vuelve a la casilla de salida, mirando hacia la dirección de partida
- **AND** si había una ejecución en curso, deja de haberla

#### Scenario: Se detiene el recorrido a mitad

- **WHEN** se pide detener con el personaje recorriendo el programa
- **THEN** el recorrido deja de avanzar y el personaje se queda en la casilla y la orientación del paso en curso
- **AND** no vuelve a la casilla de salida

#### Scenario: Se vuelve a ejecutar después de detener

- **WHEN** se pide ejecutar el programa con un recorrido detenido a mitad
- **THEN** el personaje parte otra vez de la casilla de salida y recorre el programa desde el principio

#### Scenario: No hay nada que detener

- **WHEN** no hay ninguna ejecución en curso
- **THEN** no se puede pedir detener

#### Scenario: El lienzo tiene dos secuencias sueltas

- **WHEN** el lienzo tiene dos secuencias que no están encadenadas entre sí y se pide ejecutar el programa
- **THEN** se ejecuta únicamente la que empieza más arriba en el lienzo

#### Scenario: Se ejecuta un lienzo vacío

- **WHEN** no hay ningún bloque en el lienzo y se pide ejecutar el programa
- **THEN** la ejecución termina sin mover al personaje y sin dar error

### Requirement: Los pasos se cuentan leyendo el programa

El sistema SHALL determinar cuántos pasos cuesta un programa **leyéndolo**, sin
tablero, sin saber dónde está el personaje y sin ejecutarlo.

Las reglas del recuento SHALL ser:

- **avanzar N** cuenta **N** pasos;
- **girar** a un lado o al otro cuenta **un** paso;
- **saltar sin nada dentro** cuenta **un** paso;
- **saltar con un cuerpo** cuenta **el doble de lo que cuenta su cuerpo**.

La regla del salto la decidió el usuario el 13-sep-2026: **saltar ahorra bloques,
no pasos**. Un saltar con avanzar 2 dentro cuesta lo mismo que dos saltar con
avanzar 1, igual que avanzar 4 cuesta lo mismo que cuatro avanzar 1.

Se SHALL contar los pasos **ordenados**, no los conseguidos: un `avanzar` de
cuatro casillas contra un muro que está a dos cuenta **cuatro**, y un salto que
se queda en el sitio cuenta lo mismo que uno que sube. Chocar es ineficiencia y la
ineficiencia es lo que se puntúa; contar lo conseguido obligaría a ejecutar para
saber el número, y entonces quien no ejecuta —el servidor, al puntuar— contaría
distinto.

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

#### Scenario: Se cuenta un saltar vacío

- **WHEN** el programa es un saltar sin nada dentro
- **THEN** el recuento es de un paso

#### Scenario: Se cuenta un saltar con un avance dentro

- **WHEN** el programa es un saltar con avanzar 2 dentro
- **THEN** el recuento es de cuatro pasos, los mismos que dos saltar con avanzar 1

#### Scenario: Se cuenta un saltar con un giro y un avance dentro

- **WHEN** el programa es un saltar con girar a la derecha y avanzar 1 dentro
- **THEN** el recuento es de cuatro pasos

### Requirement: La pantalla del juego se compone en paneles sobre el juego

El sistema SHALL presentar el juego, los bloques y sus controles en **una sola
pantalla**, con el juego llenando su zona de borde a borde y **los paneles
superpuestos sobre él**, y no como tarjetas apiladas una debajo de otra.

El reparto SHALL ser:

- **el juego**, en una sola zona que ocupa **todo el alto** de la pantalla por un
  lado, con el contador de pasos en su esquina;
- **el lienzo** donde se encadenan los bloques, **dentro de esa misma zona**,
  superpuesto al juego por su parte baja y ocupando menos que ella. NO SHALL ser
  una zona aparte debajo del juego;
- **la caja de bloques**, al otro lado y **separada del lienzo**;
- **los controles y las instrucciones del nivel**, bajo la caja: los tres
  botones —ejecutar, detener y devolver a la salida— y el texto que dice qué hay
  que conseguir.

**El tablero SHALL verse entero por encima del lienzo.** Que el lienzo esté
superpuesto al juego NO SHALL esconder ninguna casilla en la vista de partida:
un personaje al que hay que buscar moviendo la cámara es un personaje perdido.
Esto SHALL cumplirse también con **columnas de varias alturas**.

**La caja de bloques SHALL seguir sirviendo para arrastrar.** Estar separada del
lienzo NO SHALL convertirla en un dibujo: los bloques SHALL poder arrastrarse
desde ella hasta el lienzo, y el bloque SHALL quedarse **donde se suelte**.

**La caja SHALL enseñar todos sus bloques a la vez.** Con los bloques que hoy
ofrece NO SHALL hacer falta desplazarla para llegar a ninguno.

**El lienzo vacío SHALL decir para qué es.** Mientras no haya ningún bloque
puesto, el sitio donde van SHALL verse delimitado y acompañado de un texto que
diga qué va a aparecer ahí: un rectángulo vacío no le dice a un niño que tiene
que arrastrar algo dentro.

**NO SHALL haber una franja de controles bajo el juego.** Todo lo que el niño
pulsa vive junto a la caja de bloques.

#### Scenario: Se abre la pantalla del juego

- **WHEN** el niño abre la pantalla del juego
- **THEN** ve el juego a un lado y, al otro, la caja de bloques con los tres botones y las instrucciones del nivel
- **AND** el lienzo se ve dentro de la zona del juego, sobre su parte baja
- **AND** no hay ninguna franja de controles debajo del juego

#### Scenario: El lienzo no esconde el tablero

- **WHEN** el niño abre la pantalla del juego sin haber movido la cámara
- **THEN** el tablero entero se ve por encima del lienzo, con la casilla de salida y la meta a la vista

#### Scenario: El lienzo está vacío

- **WHEN** el niño abre la pantalla del juego y todavía no ha colocado ningún bloque
- **THEN** ve delimitado el sitio donde van los bloques, con un texto que dice que ahí aparecerá la secuencia que cree

#### Scenario: Se busca un bloque en la caja

- **WHEN** el niño mira la caja de bloques
- **THEN** ve los cuatro bloques a la vez, saltar incluido, sin desplazar nada

#### Scenario: Se arrastra un bloque desde la caja separada

- **WHEN** el niño arrastra un bloque desde la caja hasta el lienzo
- **THEN** el bloque queda en el lienzo, donde lo ha soltado
- **AND** pasa a formar parte del programa que se ejecutará
