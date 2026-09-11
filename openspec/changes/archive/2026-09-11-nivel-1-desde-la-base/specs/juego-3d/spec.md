## ADDED Requirements

### Requirement: El nivel llega de fuera, y el juego no trae ninguno dentro

El juego SHALL jugar **el nivel que se le entregue**, y NO SHALL llevar ninguna
configuración de nivel escrita dentro de sí. Entregarle otra configuración SHALL
cambiar el tablero que se juega **sin tocar el juego**.

Lo que se le entrega SHALL ser, por nivel: la definición del puzle, la
disposición inicial de bloques con la que arranca el lienzo y la versión del
formato de las dos.

El juego NO SHALL contar cuántos niveles ni cuántos mundos hay, ni nombrar
ninguno: un mundo contiene N niveles ordenados, y N cambia.

#### Scenario: Se abren dos niveles distintos

- **WHEN** el niño abre un nivel y después otro
- **THEN** cada uno se juega con su propio tablero, su salida, su meta y sus pasos óptimos

#### Scenario: El nivel trae bloques puestos

- **WHEN** el nivel entregado trae una disposición inicial de bloques
- **THEN** el lienzo arranca con esos bloques colocados

#### Scenario: El nivel no trae bloques puestos

- **WHEN** el nivel entregado no trae disposición inicial
- **THEN** el lienzo arranca vacío, y eso no se avisa como un error

### Requirement: Un nivel que no se puede leer no se juega

El sistema SHALL **comprobar** lo que recibe antes de jugarlo, y NO SHALL
traducirlo ni adivinarlo. Si la definición del puzle no describe un tablero, o si
la versión del formato no es una que el juego reconozca, el nivel SHALL
rechazarse **entero**.

Una definición vacía SHALL tratarse igual: significa que no hay puzle, y no hay
nada que jugar.

Un tablero SHALL rechazarse cuando alguna de sus casillas no sea de una de las
tres clases conocidas. Un valor desconocido NO SHALL tratarse como suelo.

**La casilla de salida y la de meta SHALL poder pisarse.** Un nivel que empiece
sobre una casilla intransitable, o cuya meta lo sea, SHALL rechazarse: el
personaje nacería dentro de ella o no habría forma de llegar. Es un nivel
imposible, y se distingue del número de pasos mal escrito en que éste **sí** se
puede comprobar sin jugarlo.

**La versión del nivel y la del sobre de su disposición inicial SHALL coincidir.**
La del nivel es la que decide si el juego puede con él; la del sobre gobierna lo
que el sobre lleva dentro. Cuando las dos no digan lo mismo, el nivel SHALL
rechazarse **aunque cada una por separado sea conocida**: una descripción que se
contradice a sí misma no tiene una lectura correcta, y quedarse con una de las
dos en silencio deja la otra sin que nadie la compruebe nunca.

Al rechazarlo, el sistema SHALL decírselo al niño con palabras que entienda y
SHALL ofrecerle volver a la lista de niveles. NO SHALL dibujarse un tablero a
medias, y NO SHALL quedarse la pantalla en blanco.

La disposición inicial de bloques vacía NO SHALL ser un motivo de rechazo.

#### Scenario: La definición no describe un tablero

- **WHEN** se abre un nivel cuya definición no describe un tablero
- **THEN** no se dibuja ningún tablero
- **AND** se le dice al niño que ese nivel no se puede jugar, con la vuelta a la lista a mano

#### Scenario: Una casilla de clase desconocida

- **WHEN** el tablero de un nivel trae una casilla que no es ni suelo, ni muro, ni hueco
- **THEN** el nivel se rechaza entero, y esa casilla no se juega como suelo

#### Scenario: La salida o la meta no se pueden pisar

- **WHEN** un nivel sitúa su salida o su meta sobre una casilla que no se pisa
- **THEN** el nivel se rechaza entero, y no se empieza una partida imposible

#### Scenario: La versión del formato no se reconoce

- **WHEN** se abre un nivel cuya versión del formato el juego no conoce
- **THEN** el nivel se rechaza entero, sin intentar interpretarlo

#### Scenario: Las dos versiones del nivel no coinciden

- **WHEN** la versión del nivel y la del sobre de su disposición inicial son distintas, aunque las dos sean conocidas
- **THEN** el nivel se rechaza entero
- **AND** no se juega eligiendo una de las dos

### Requirement: El tablero se ve entero sea cual sea su forma

La vista de partida SHALL enseñar **el tablero entero** del nivel que se está
jugando, con sus casillas contables, sin que el niño tenga que girar ni acercar
la cámara.

Eso SHALL cumplirse para tableros de tamaños distintos, y NO SHALL depender de
que el tablero tenga la forma de ninguno en concreto. El acercamiento de partida
SHALL quedar **dentro** de los topes que la cámara impone, para que ningún
tablero arranque recortado por ellos.

Si alguna vez se dibuja algo **fuera** del tablero, SHALL quedar fuera de su
huella: no SHALL meterse en ninguna casilla ni taparla. Hoy no hay nada fuera —el
usuario retiró el decorado entero—, así que la regla gobierna lo que traiga el
paso que vuelva a vestir el juego.

#### Scenario: Un tablero pequeño

- **WHEN** se abre un nivel cuyo tablero es mucho menor que el de otro nivel
- **THEN** se ve entero y sus casillas se cuentan desde la vista de partida

#### Scenario: Un tablero mayor que la referencia

- **WHEN** se abre un nivel cuyo tablero es mayor que aquel contra el que se midió el encuadre
- **THEN** se ve entero, sin que los topes de la cámara lo recorten al arrancar

## MODIFIED Requirements

### Requirement: El banco de pruebas del juego sólo existe en desarrollo

El sistema SHALL ofrecer una pantalla de pruebas en el panel del niño desde la
que se ve funcionar el juego, y esa pantalla SHALL existir **únicamente cuando la
aplicación se ejecuta en modo desarrollo**.

Esa pantalla NO SHALL ser el sitio donde se juega un nivel del producto: los
niveles se juegan en su propia pantalla, que sí existe en producción. El banco de
pruebas queda como instrumento —enseña el programa que producen los bloques, que
es la única comprobación de que el editor sigue publicando— y NO SHALL hacer
falta para jugar.

En producción NO SHALL haber forma de llegar a él: ni enlace en la navegación, ni
dirección que lo abra al escribirla.

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

#### Scenario: Se juega un nivel en producción

- **WHEN** el niño abre un nivel del producto en producción
- **THEN** el juego se monta en la pantalla de ese nivel, sin pasar por el banco de pruebas
