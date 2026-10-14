## ADDED Requirements

### Requirement: Devolver bloques a la caja no mueve la vista del lienzo

Cuando el niño devuelva a la caja un bloque o un montón de bloques encadenados,
el sistema NO SHALL desplazar la vista del lienzo: los bloques que quedan SHALL
seguir **en el mismo sitio de la pantalla** en que estaban antes de soltar,
salvo el ajuste que haga falta porque el lienzo se haya quedado más corto que la
vista. Nada de lo que queda SHALL acabar fuera de la vista por haber quitado
otra cosa. Visto en la prueba preliminar del 25-sep-2026: los bloques que
quedaban salían disparados hacia arriba y había que buscarlos con la barra.

#### Scenario: Se devuelve a la caja un montón de varios bloques

- **WHEN** el lienzo tiene tres montones separados, el niño ha bajado hasta el del medio y lo arrastra entero fuera del lienzo
- **THEN** el montón vuelve a la caja y los otros dos se quedan donde estaban en la pantalla

#### Scenario: Se devuelve a la caja un bloque suelto

- **WHEN** el niño saca del lienzo un bloque sin nada encadenado debajo
- **THEN** la vista del lienzo no se mueve

#### Scenario: Se devuelven varios montones seguidos

- **WHEN** el niño saca del lienzo un montón y, antes de que termine de volver a la caja, saca otro
- **THEN** los dos vuelven a la caja y lo que queda en el lienzo sigue en el mismo sitio de la pantalla

### Requirement: «Limpiar» vacía el lienzo tras confirmarlo

Junto a «Ejecutar» y «Detener», el sistema SHALL ofrecer un botón **«Limpiar»**
que **quita todos los bloques del lienzo** y devuelve al personaje a la casilla de
salida. Ocupa el sitio del antiguo «Reiniciar». Decidido por el usuario tras la
prueba preliminar del 25-sep-2026.

**Limpiar SHALL pedir confirmación antes de borrar nada**, con palabras de niño
que digan que se van a quitar todos los bloques. Si el niño no confirma, el
lienzo SHALL quedarse exactamente como estaba. Perder el programa entero por un
toque sin querer es lo que la confirmación evita.

Limpiar SHALL estar **desactivado con el lienzo vacío**, porque no hay nada que
quitar, y **mientras una ejecución está en curso** sin detener. Con el recorrido
detenido SHALL poder pulsarse, y limpiar SHALL levantar el bloqueo.

Los bloques quitados NO SHALL volver a la caja uno por uno: la caja ya los
tiene todos, y limpiar es empezar de cero.

#### Scenario: Se limpia el lienzo y se confirma

- **WHEN** hay bloques en el lienzo, el niño pulsa «Limpiar» y confirma
- **THEN** el lienzo se queda vacío, el personaje vuelve a la salida y el contador a su valor de reposo

#### Scenario: Se pulsa «Limpiar» y se cancela

- **WHEN** el niño pulsa «Limpiar» y cancela la confirmación, con el botón de cancelar, con Escape o tocando fuera
- **THEN** el lienzo, el personaje y el contador siguen exactamente como estaban

#### Scenario: Limpiar con el lienzo vacío

- **WHEN** el lienzo no tiene ningún bloque
- **THEN** «Limpiar» está desactivado

#### Scenario: Limpiar durante una ejecución

- **WHEN** hay una ejecución en curso sin detener
- **THEN** «Limpiar» está desactivado

#### Scenario: Limpiar con el recorrido detenido

- **WHEN** con el recorrido detenido el niño pulsa «Limpiar» y confirma
- **THEN** el lienzo se queda vacío, deja de haber recorrido detenido y el lienzo deja de estar bloqueado

#### Scenario: Limpiar un nivel con bloques de partida

- **WHEN** el nivel arrancó con bloques puestos y el niño limpia el lienzo
- **THEN** el lienzo se queda vacío, sin volver a poner los bloques de partida

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
con su orientación de partida **con la ejecución detenida**, sin tocar los
bloques del lienzo. Con la ejecución **terminada** no hace falta pedirlo aparte:
**pedir la ejecución SHALL empezar siempre desde la salida**, salvo cuando
reanuda un recorrido detenido. Vaciar el lienzo con «Limpiar» SHALL devolverlo
también a la salida, esté como esté la ejecución. Decidido por el usuario tras la
prueba preliminar del 25-sep-2026: el botón «Reiniciar» repetía lo que ya hacía
«Ejecutar».

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
- **AND** si había una ejecución detenida, deja de haberla
- **AND** los bloques del lienzo siguen como estaban

#### Scenario: Se vuelve a ejecutar con el recorrido terminado

- **WHEN** ha terminado un recorrido y se pide ejecutar otra vez
- **THEN** el personaje parte de la casilla de salida y recorre el programa desde el principio

#### Scenario: Ya no hay botón «Reiniciar»

- **WHEN** el niño mira los botones del juego
- **THEN** ve «Ejecutar», «Detener» y «Limpiar», y ninguno se llama «Reiniciar»

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

### Requirement: El lienzo se bloquea mientras el recorrido está detenido

Mientras un recorrido esté **detenido**, el sistema NO SHALL dejar cambiar el
programa: ni mover, añadir o quitar bloques en el lienzo, ni sacarlos de la caja.
Así lo que se reanuda es siempre lo que está a la vista. Decidido por el usuario
el 14-sep-2026.

El bloqueo SHALL **decir por qué** y cómo salir de él: que el recorrido está
detenido y que «Ejecutar» lo sigue. Y SHALL **ofrecer él mismo la salida para
cambiar los bloques**: un botón «Cambiar los bloques», dentro del propio
bloqueo, que devuelve al personaje a la salida **sin tocar el lienzo**. Desde la
prueba preliminar del 25-sep-2026 no hay botón «Reiniciar» al que mandar, y
«Limpiar» no sirve de salida porque se lleva los bloques.

El bloqueo SHALL levantarse **al reanudar**, **al terminar**, **al devolver al
personaje a la salida** y **al limpiar el lienzo**. Mientras el recorrido está en
curso sin detener, el lienzo NO SHALL bloquearse.

#### Scenario: Se intenta mover un bloque con el recorrido detenido

- **WHEN** el recorrido está detenido y el niño intenta arrastrar un bloque del lienzo o de la caja
- **THEN** el bloque no se mueve y se ve por qué

#### Scenario: Se reinicia un recorrido detenido

- **WHEN** con el recorrido detenido el niño pulsa «Cambiar los bloques» en el bloqueo
- **THEN** el personaje vuelve a la salida y los bloques se pueden volver a mover
- **AND** el lienzo conserva los bloques que tenía

#### Scenario: Se reanuda un recorrido detenido

- **WHEN** con el recorrido detenido se pide ejecutar
- **THEN** el recorrido sigue y el lienzo deja de estar bloqueado

### Requirement: Un nivel puede conceder un número máximo de pasos

La configuración del nivel SHALL poder traer un **máximo de pasos**: cuántos
pasos concede ese nivel como mucho para llegar a la meta. Es **opcional**. Un
nivel que no lo traiga SHALL jugarse **sin límite ninguno**, exactamente como
hasta ahora, y NO SHALL comportarse de forma distinta en nada.

**Con límite, la ejecución SHALL cortarse al agotarlo.** Cuando los pasos dados
lleguen al máximo, el personaje SHALL quedarse donde está y el recorrido SHALL
terminar ahí: las órdenes que queden NO SHALL ejecutarse. Es la única cosa que
interrumpe una ejecución por sí sola — un avance imposible sigue sin
interrumpirla, y sigue costando su paso.

**Un salto NO SHALL partirse por la mitad.** Saltar a la casilla siguiente cuesta
dos pasos; cuando queda **uno solo**, ese salto NO SHALL ejecutarse y el recorrido
SHALL cortarse antes de él, con el personaje apoyado en su casilla. Quedarse en el
aire no es un estado del juego.

**Llegar a la meta dentro del límite SHALL valer**, y pisarla SHALL contar aunque
el recorrido se corte después: lo que decide es si el personaje llegó a pisarla
con los pasos que tenía, no dónde acabó plantado.

**Al cortarse por agotar el límite, el sistema SHALL decírselo al niño con
palabras suyas y SHALL animarle a buscar un camino más corto y volver a
ejecutar**, sin mandarle a ningún botón que no exista. NO SHALL
decirle solamente que no llegó a la meta: su programa no está mal escrito, es
demasiado largo, y son dos cosas distintas. El recorrido cortado NO SHALL poder
reanudarse: reanudarlo regalaría los pasos que el nivel no concede.

**Un máximo por debajo del mínimo apuntado del nivel SHALL rechazar el nivel
entero**, por el camino de un nivel que no se puede leer: es un nivel que nadie
puede terminar. Es de los errores de siembra que **sí** se pueden comprobar sin
jugar, como la meta sobre un hueco.

#### Scenario: Un nivel sin máximo de pasos

- **WHEN** se juega un nivel cuya configuración no trae máximo de pasos
- **THEN** el recorrido no se corta nunca por pasos, por largo que sea el programa
- **AND** no se ve ningún aviso ni ninguna cuenta de pasos que queden

#### Scenario: El programa se pasa del máximo

- **WHEN** se ejecuta en un nivel con máximo de diez pasos un programa que cuesta quince
- **THEN** el personaje da los diez primeros pasos y se planta donde el décimo lo deje
- **AND** las órdenes que quedaban no se ejecutan

#### Scenario: Al agotarse el máximo se le pide reiniciar

- **WHEN** un recorrido se corta por agotar el máximo de pasos sin haber pisado la meta
- **THEN** se le dice al niño que se quedó sin pasos y se le anima a buscar un camino más corto y volver a ejecutar
- **AND** el mensaje no nombra ningún botón «Reiniciar»
- **AND** no se le dice sólo que no llegó a la meta

#### Scenario: Un recorrido cortado no se reanuda

- **WHEN** se pide ejecutar después de que un recorrido se cortara por agotar el máximo
- **THEN** el personaje no sigue desde donde se quedó con pasos de más

#### Scenario: Queda un paso y la orden siguiente es un salto

- **WHEN** a un recorrido con máximo le queda un solo paso y la orden siguiente es saltar a la casilla de delante
- **THEN** ese salto no se ejecuta y el personaje se queda apoyado en su casilla
- **AND** no se queda a medio salto

#### Scenario: Se pisa la meta justo con el último paso

- **WHEN** un programa pisa la meta con el último paso que el máximo concede
- **THEN** el nivel se da por resuelto

#### Scenario: El máximo es menor que el mínimo apuntado

- **WHEN** se abre un nivel cuyo máximo de pasos es menor que los pasos de su mejor solución
- **THEN** el nivel se rechaza entero, y no se empieza una partida imposible

