## ADDED Requirements

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

### Requirement: Al personaje se le pueden dar órdenes sueltas en desarrollo

Mientras el programa de bloques no exista, el sistema SHALL permitir dar al
personaje las órdenes de avanzar y girar **una a una y a mano**, para poder ver
el movimiento funcionando sin haberlo programado. Cada orden SHALL verse
reflejada en la escena.

Ese medio de dar órdenes sueltas SHALL existir **únicamente cuando la aplicación
se ejecuta en modo desarrollo**, y esa garantía SHALL valer **sea cual sea la
pantalla que monte la escena** — no depende de que la pantalla que la aloja hoy
sea la del banco de pruebas.

#### Scenario: Se ordena avanzar a mano

- **WHEN** se ordena avanzar a mano y la casilla contigua se puede pisar
- **THEN** el personaje se ve en la casilla siguiente

#### Scenario: Se ordena girar a mano

- **WHEN** se ordena girar a mano
- **THEN** el personaje se ve mirando hacia la nueva dirección, en la misma casilla

#### Scenario: La aplicación corre en producción

- **WHEN** la aplicación se ejecuta en producción
- **THEN** no hay forma de dar órdenes sueltas al personaje, sea cual sea la pantalla desde la que se monte la escena
