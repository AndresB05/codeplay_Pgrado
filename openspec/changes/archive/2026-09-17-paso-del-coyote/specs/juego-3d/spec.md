## MODIFIED Requirements

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

**BAJAR SE DIBUJA COMO UNA CAÍDA, NO COMO UNA RAMPA.** Cuando un movimiento
lleve al personaje a una casilla **más baja**, SHALL mantener la altura que tenía
mientras cruza hacia ella y **caer después**, ya sobre la casilla de destino. NO
SHALL ir bajando mientras todavía está sobre la columna de partida: esa
trayectoria **atraviesa el bloque sobre el que estaba**. Pedido por el usuario el
17-sep-2026 con estas palabras: «algo parecido al coyote y el correcaminos».

La caída SHALL **acelerar**, y SHALL empezar sin tirón, encadenada con lo que
venía antes.

**Un salto que baja SHALL seguir viéndose como un salto**: SHALL levantarse desde
la altura de la que despega, como si fuera a subir, y acabar cayendo a la casilla
de destino. Decidido por el usuario el 17-sep-2026.

**Todas las caídas SHALL caer con la misma gravedad, y SHALL caer despacio.** La
caída NO SHALL acelerar más en una bajada alta que en una corta: lo que cambia con
la altura es **lo que la caída dura**, no cómo empieza. Pedido por el usuario el
17-sep-2026 al ver la primera versión, que repartía el paso en dos mitades fijas y
por tanto despeñaba una caída alta: «que no se sienta brusco, tipo gravedad
lunar».

De ahí se sigue que **un paso que baja dura más que uno que no**, y más cuanto más
baja. Es lo único que puede durar distinto: **andar SHALL durar siempre lo mismo**,
así que el ritmo del recorrido NO SHALL depender del relieve del tablero, y el
personaje NO SHALL acercarse al borde a cámara lenta.

**Subir y avanzar a la misma altura NO SHALL cambiar por esto.** Ir subiendo
mientras se cruza aleja al personaje del bloque de partida en vez de meterlo
dentro, y retrasarlo lo metería en el bloque al que sube.

**Un avance imposible NO SHALL interrumpir la ejecución.** Cuando la casilla de
destino no se pueda alcanzar, el personaje SHALL quedarse donde está, el intento
SHALL **verse** —de modo que se entienda contra qué se ha topado— y el programa
SHALL continuar con la orden siguiente. Esto vale también para las casillas que
le queden a un `avanzar` de varias, dentro o fuera de saltar: las que no se
pueden dar se intentan igual.

Mientras una ejecución está en curso, el sistema NO SHALL empezar otra.

El sistema SHALL ofrecer, además, **devolver al personaje a la casilla de salida**
con su orientación de partida, tanto al terminar una ejecución como durante ella
o con ella detenida.

**Y SHALL ofrecer detener una ejecución en curso, que no es lo mismo.** Detenerla
SHALL **congelar el recorrido donde va**: el personaje SHALL quedarse en la
casilla y con la orientación del paso en curso, y NO SHALL volver a la salida.
**Detener NO SHALL dejar al personaje a mitad de un salto**: si lo detiene
despegando, SHALL quedarse en la casilla donde ese salto aterriza.

**Un recorrido detenido SHALL reanudarse.** Pedir la ejecución con un recorrido
detenido SHALL **seguir desde el paso en que se quedó**, sin volver a la salida, y
SHALL dar **sólo los pasos que faltaban**: lo que se reanuda es el programa que
se estaba ejecutando. Empezar de nuevo desde la salida SHALL pedirse devolviendo
al personaje a la salida y ejecutando después. Decidido por el usuario el
14-sep-2026: hasta entonces detener no se reanudaba y ejecutar hacía de
reiniciar.

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
- **AND** si había una ejecución en curso o detenida, deja de haberla

#### Scenario: Se detiene el recorrido a mitad

- **WHEN** se pide detener con el personaje recorriendo el programa
- **THEN** el recorrido deja de avanzar y el personaje se queda en la casilla y la orientación del paso en curso
- **AND** no vuelve a la casilla de salida

#### Scenario: Se detiene el recorrido a mitad de un salto

- **WHEN** se pide detener con el personaje despegando para saltar a otra casilla
- **THEN** el personaje se queda en la casilla donde ese salto aterriza, apoyado sobre ella

#### Scenario: Se vuelve a ejecutar después de detener

- **WHEN** se detiene un programa de cuatro pasos después del segundo y se pide ejecutar otra vez
- **THEN** el personaje sigue desde la casilla donde se quedó y da sólo los dos pasos que faltaban
- **AND** no vuelve a pasar por la casilla de salida

#### Scenario: Se empieza de nuevo después de detener

- **WHEN** con un recorrido detenido se devuelve al personaje a la salida y después se pide ejecutar
- **THEN** el personaje parte de la casilla de salida y recorre el programa desde el principio

#### Scenario: No hay nada que detener

- **WHEN** no hay ninguna ejecución en curso
- **THEN** no se puede pedir detener

#### Scenario: El lienzo tiene dos secuencias sueltas

- **WHEN** el lienzo tiene dos secuencias que no están encadenadas entre sí y se pide ejecutar el programa
- **THEN** se ejecuta únicamente la que empieza más arriba en el lienzo

#### Scenario: Se ejecuta un lienzo vacío

- **WHEN** no hay ningún bloque en el lienzo y se pide ejecutar el programa
- **THEN** la ejecución termina sin mover al personaje y sin dar error

#### Scenario: El personaje baja a una casilla más abajo

- **WHEN** durante la ejecución el personaje avanza a una casilla más baja que la suya
- **THEN** se mantiene a su altura mientras cruza hacia ella y cae después, ya sobre ella
- **AND** en ningún momento está por debajo de su altura de partida mientras sigue sobre su casilla

#### Scenario: El personaje salta a una casilla más abajo

- **WHEN** durante la ejecución el personaje avanza saltando a una casilla más baja que la suya
- **THEN** el salto se levanta por encima de la altura desde la que despega
- **AND** acaba cayendo sobre la casilla de destino

#### Scenario: Una caída de varios niveles

- **WHEN** el personaje baja varios niveles de una vez
- **THEN** cae con la misma gravedad que una bajada de un solo nivel, y tarda más en llegar al suelo
- **AND** lo que tarda en cruzar hacia la casilla es lo mismo que en cualquier otro paso

#### Scenario: El personaje sube a una casilla más alta

- **WHEN** durante la ejecución el personaje avanza saltando a una casilla más alta que la suya
- **THEN** va ganando altura mientras cruza, sin quedarse atrás
