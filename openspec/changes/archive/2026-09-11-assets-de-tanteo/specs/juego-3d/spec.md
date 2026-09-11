## ADDED Requirements

### Requirement: Los modelos 3D se piden por URL en tiempo de ejecución

Los modelos con los que se dibuja la escena —el tablero, el personaje y el
decorado— SHALL pedirse **por su dirección, cuando la escena los necesita**, y NO
SHALL viajar dentro de ninguna de las descargas de código de la aplicación.

Añadir, cambiar o quitar un modelo NO SHALL cambiar el tamaño de esas descargas,
ni el de la carga inicial, ni el de la del juego, más allá de lo que ocupe el
código que los pide.

Quien no abra una pantalla con juego dentro NO SHALL descargar ningún modelo.

#### Scenario: Se compila la aplicación

- **WHEN** se compila la aplicación para producción
- **THEN** ningún modelo 3D queda dentro de las descargas de código
- **AND** los modelos siguen sirviéndose como archivos aparte, por su dirección

#### Scenario: Se abre la pantalla que aloja el juego

- **WHEN** se abre esa pantalla
- **THEN** los modelos que la escena necesita se piden en ese momento, cada uno por su dirección

#### Scenario: Se recorre la aplicación sin abrir el juego

- **WHEN** se abre la aplicación y se navega por sus pantallas sin abrir ninguna que aloje el juego
- **THEN** no se descarga ningún modelo 3D

### Requirement: Un modelo que no llega no deja la pantalla en blanco

Cuando un modelo de la escena **no se pueda cargar** —no está, no llega o llega
roto—, el sistema NO SHALL dejar la pantalla en blanco ni tumbar el resto de la
aplicación. La pantalla SHALL seguir en pie y SHALL seguir pudiéndose usar todo
lo que no dependa de ese modelo: el editor de bloques, el resto del panel y la
navegación.

Los controles y los avisos que **sólo sirven a la escena** —ejecutar, detener,
devolver a la salida, y el mensaje que cuenta el intento— SÍ SHALL poder
desaparecer con ella: sin escena no hay nada que ejecutar ni nada que contar, y
un botón que no puede hacer su trabajo es peor que su ausencia.

El sistema SHALL **decir que algo no se ha podido dibujar**, en el sitio donde
iba, en lugar de callarlo: una escena a la que le falta el tablero sin que nada lo
diga se lee como un fallo del juego.

Mientras los modelos están llegando, la zona del juego NO SHALL quedarse en
blanco sin explicación.

#### Scenario: Falta un modelo del tablero

- **WHEN** se abre la pantalla del juego y uno de los modelos con los que se dibuja el tablero no se puede cargar
- **THEN** la pantalla sigue en pie, con su editor de bloques y su navegación
- **AND** en la zona del juego se dice que no se ha podido dibujar la escena

#### Scenario: Los modelos tardan en llegar

- **WHEN** los modelos de la escena aún no han llegado
- **THEN** la zona del juego muestra un aviso de carga en lugar de quedarse en blanco

### Requirement: Se ve hacia dónde mira el personaje

El personaje SHALL dejar ver **hacia cuál de las cuatro direcciones mira** desde
la vista de partida y desde **todo el rango de giro y acercamiento en el que el
tablero se mira desde arriba**, que es donde el niño juega, y sin que haga falta
moverlo.

Girar SHALL verse: dos orientaciones distintas NO SHALL dibujarse igual. Un
personaje del que no se sabe hacia dónde mira convierte los dos bloques de giro en
órdenes sin efecto visible, y el niño no puede corregir un programa cuyo efecto no
ve.

**Acercándose al tope inferior de la cámara**, con la vista casi a ras del suelo,
lo que esté delante SÍ SHALL poder tapar al personaje. Es geometría y no un
defecto del dibujo —a esa altura el propio tablero tapa lo que hay detrás—, y
exigir lo contrario sería exigir que no haya perspectiva. La salida SHALL estar
siempre a mano: volver a la vista inicial.

#### Scenario: El personaje está parado en su casilla

- **WHEN** el niño mira al personaje sin ejecutar nada
- **THEN** se distingue hacia cuál de las cuatro direcciones mira

#### Scenario: El personaje gira

- **WHEN** el personaje ejecuta una orden de giro
- **THEN** se ve que ha cambiado de orientación, aunque no haya cambiado de casilla

#### Scenario: Se mira desde otro ángulo

- **WHEN** el niño gira la cámara alrededor del tablero sin bajarla hasta cerca del suelo
- **THEN** se sigue distinguiendo hacia dónde mira el personaje, desde cualquier lado

#### Scenario: Se baja la cámara hasta cerca del tope inferior

- **WHEN** el niño baja la vista hasta casi ras del suelo y algo del escenario queda delante del personaje
- **THEN** el personaje puede quedar tapado
- **AND** volver a la vista inicial lo devuelve a la vista

## MODIFIED Requirements

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

### Requirement: El mapa se puede girar y acercar

El sistema SHALL permitir **mirar el tablero desde otro sitio**: girar alrededor
de él y acercarse o alejarse, con el ratón y sin salir del juego.

**El movimiento SHALL estar acotado por los dos lados.** El acercamiento SHALL
tener un mínimo y un máximo, y **NO SHALL poder mirarse el tablero desde
abajo**: la cámara se queda por encima de él.

**Tampoco SHALL poder mirarse en vertical desde arriba.** Desde el cenit el
personaje se ve como una silueta y **deja de verse hacia dónde mira**, así que
**girar dejaría de verse**, que es justamente lo que hay que poder ver.

**El tablero NO SHALL poder perderse de vista.** La cámara gira alrededor del
tablero y siempre lo mira; no hay forma de desplazarla hasta dejarlo fuera de la
pantalla.

**SHALL ofrecerse volver a la vista inicial**, y hacerlo SHALL devolver
exactamente la vista de partida. Un niño que gire hasta perderse necesita una
salida, y en la pantalla de nivel no habrá nadie al lado para dársela.

**Mover la cámara NO SHALL cambiar nada del juego**: ni dónde está el personaje,
ni el programa del lienzo, ni un recorrido en curso, que sigue ejecutándose
mientras se mira desde otro sitio.

#### Scenario: Se gira alrededor del tablero

- **WHEN** el niño arrastra sobre la pantalla del juego
- **THEN** el tablero se ve desde otro ángulo, y sigue entero a la vista

#### Scenario: Se acerca y se aleja

- **WHEN** el niño acerca o aleja la vista sobre la pantalla del juego
- **THEN** el tablero se ve más grande o más pequeño, hasta un tope por cada lado

#### Scenario: Se intenta mirar el tablero desde abajo

- **WHEN** el niño gira la vista hacia abajo todo lo que puede
- **THEN** la cámara se queda por encima del tablero, y no se ve por debajo

#### Scenario: Se intenta mirar el tablero en vertical desde arriba

- **WHEN** el niño gira la vista hacia arriba todo lo que puede
- **THEN** la vista se queda por debajo del cenit, y se sigue distinguiendo hacia dónde mira el personaje

#### Scenario: Se recupera la vista inicial

- **WHEN** el niño ha girado y acercado la vista, y pide volver a la de partida
- **THEN** el tablero se ve otra vez exactamente como al abrir la pantalla

#### Scenario: Se gira con el recorrido en marcha

- **WHEN** el niño mueve la cámara mientras el personaje está recorriendo el programa
- **THEN** el recorrido sigue su curso, y el personaje sigue en la casilla que le toca
