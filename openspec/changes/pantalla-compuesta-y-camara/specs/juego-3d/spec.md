## ADDED Requirements

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
- **THEN** ve los tres bloques a la vez, sin desplazar nada

#### Scenario: Se arrastra un bloque desde la caja separada

- **WHEN** el niño arrastra un bloque desde la caja hasta el lienzo
- **THEN** el bloque queda en el lienzo, donde lo ha soltado
- **AND** pasa a formar parte del programa que se ejecutará

### Requirement: El bloque que se arrastra se ve todo el rato

Mientras el niño lleva un bloque agarrado, el sistema SHALL **dibujarlo por
encima de todo lo que haya debajo**, sea lo que sea —el juego, la caja, los
controles o el texto—, y en cualquier punto del recorrido entre la caja y el
lienzo.

Un bloque que desaparece a mitad de camino deja al niño sin saber qué está
haciendo: la caja y el lienzo están en esquinas opuestas de la pantalla, y el
trayecto entre las dos pasa por encima del juego.

#### Scenario: El bloque cruza por encima del juego

- **WHEN** el niño arrastra un bloque desde la caja y pasa por encima del juego
- **THEN** el bloque se ve, dibujado sobre el juego

#### Scenario: El bloque cruza por encima de los controles

- **WHEN** el niño arrastra un bloque por encima de los botones o de las instrucciones
- **THEN** el bloque se ve, dibujado sobre ellos

### Requirement: Soltar un bloque fuera del lienzo lo devuelve a la caja

Cuando el niño suelte un bloque **fuera del lienzo** —en cualquier punto de la
pantalla que no sea el lienzo, la caja incluida—, el sistema SHALL **devolverlo a
la caja**, y el bloque SHALL dejar de formar parte del programa.

**La vuelta SHALL verse.** El bloque SHALL recorrer el camino hasta la caja a la
vista del niño, de modo que se entienda **a dónde ha ido**. NO SHALL
desvanecerse donde se soltó ni desaparecer sin más: un bloque que se esfuma es un
bloque perdido, y el niño no tiene forma de saber que sigue estando en la caja.

**Ninguna zona de la pantalla SHALL borrar un bloque en silencio.** La única
consecuencia de soltar fuera es que el bloque vuelve a donde estaba antes de
sacarlo.

**Soltar DENTRO del lienzo NO SHALL devolver nada.** El bloque se queda donde el
niño lo puso, en cualquier punto del lienzo.

#### Scenario: Se suelta un bloque encima del juego

- **WHEN** el niño suelta un bloque sobre el juego, fuera del lienzo
- **THEN** el bloque vuelve a la caja, y se le ve volver
- **AND** el programa que se ejecutaría no lo incluye

#### Scenario: Se suelta un bloque en cualquier otro sitio

- **WHEN** el niño suelta un bloque sobre los controles o las instrucciones
- **THEN** el bloque vuelve a la caja igualmente

#### Scenario: Se devuelve un bloque a la caja

- **WHEN** el niño arrastra un bloque del lienzo hasta la caja y lo suelta
- **THEN** el bloque desaparece del lienzo, que es la forma de tirarlo

#### Scenario: Se suelta un bloque en el lienzo

- **WHEN** el niño suelta un bloque en cualquier punto del lienzo
- **THEN** el bloque sigue ahí, y no se borra

### Requirement: El mapa se puede girar y acercar

El sistema SHALL permitir **mirar el tablero desde otro sitio**: girar alrededor
de él y acercarse o alejarse, con el ratón y sin salir del juego.

**El movimiento SHALL estar acotado por los dos lados.** El acercamiento SHALL
tener un mínimo y un máximo, y **NO SHALL poder mirarse el tablero desde
abajo**: la cámara se queda por encima de él.

**Tampoco SHALL poder mirarse en vertical desde arriba.** Desde el cenit el
personaje se ve como una silueta y la marca que lleva sobre la cabeza —la que
dice hacia dónde mira— deja de distinguirse, así que **girar dejaría de verse**,
que es justamente lo que esa marca existe para enseñar.

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
- **THEN** la vista se queda por debajo del cenit, y la marca que dice hacia dónde mira el personaje se sigue distinguiendo

#### Scenario: Se recupera la vista inicial

- **WHEN** el niño ha girado y acercado la vista, y pide volver a la de partida
- **THEN** el tablero se ve otra vez exactamente como al abrir la pantalla

#### Scenario: Se gira con el recorrido en marcha

- **WHEN** el niño mueve la cámara mientras el personaje está recorriendo el programa
- **THEN** el recorrido sigue su curso, y el personaje sigue en la casilla que le toca

## MODIFIED Requirements

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

### Requirement: Al terminar se ve lo que costó y lo que costaba lo bueno

Al terminar de ejecutar el programa, el sistema SHALL mostrar **cuántos pasos ha
costado** y **cuántos cuesta la mejor solución del nivel**, junto al resultado de
si se llegó a la meta. NO SHALL hacer falta contar los movimientos a ojo ni
interpretar la escena para saberlo.

El sistema SHALL indicar de forma distinguible que el recorrido fue **el mejor
posible**: cuando se llegó a la meta y no se gastaron más pasos de los que cuesta
la mejor solución. Llegar gastando de más NO SHALL presentarse como un fracaso:
se llegó, y lo que sobra son pasos.

**El resultado SHALL verse en la franja del título del lienzo**, a la derecha de
la etiqueta que lo nombra y en su misma línea, y no en una franja aparte ni
tapando el juego. El niño acaba de mirar al personaje y va a mirar sus bloques:
el mensaje está en el camino entre las dos cosas.

Por eso NO SHALL tapar **al personaje ni la casilla en la que ha quedado**:
pisar la meta y seguir cuenta como haber llegado, y el paseo de más es justamente
lo que explica el número.

**La etiqueta del lienzo SHALL quedarse donde está.** El mensaje se pone a su
lado y no en su lugar: la zona sigue diciendo qué es aunque no haya nada que
contar.

**Un lienzo sin bloques NO SHALL presentarse como un intento fallido.** Cuando no
hay ninguna orden que ejecutar, el sistema SHALL decir que no hay programa y NO
SHALL mostrar recuento alguno: cero pasos contra los del nivel le diría al niño
que su programa fue malo cuando lo que ocurre es que no hay programa.

**Cuando el lienzo tenga varias secuencias sueltas, el sistema SHALL avisar de
que ha sobrado alguna**, junto al resultado y sin sustituirlo — la secuencia que
correspondía sí se ha ejecutado. Sin ese aviso, un bloque olvidado por encima del
programa se ejecuta en su lugar y el niño no puede distinguir «mi programa está
mal» de «mi programa no se ha ejecutado».

**Mientras la ejecución está en curso NO SHALL mostrarse todavía el resultado**
—ni si se llegó, ni lo que ha costado—, y al devolver al personaje a la salida el
resultado SHALL desaparecer. Lo que sí se ve durante el recorrido es **por dónde
va**, y eso lo gobierna su propio requisito: el resultado se sabe al terminar, el
paso en curso mientras se ejecuta, y no son el mismo dato dicho dos veces.

**Y detener tampoco SHALL producir resultado.** Un recorrido congelado a mitad no
ha terminado, así que no hay nada que juzgar: lo que queda a la vista es dónde se
ha quedado el personaje y lo que llevaba gastado, no si llegó.

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

#### Scenario: El resultado no tapa lo que hay que ver

- **WHEN** se muestra el resultado de una ejecución terminada
- **THEN** el personaje y la casilla en la que ha quedado siguen viéndose

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
- **THEN** no se muestra ningún resultado ni el recuento de lo que ha costado
- **AND** se ve por qué paso del recorrido va

#### Scenario: Se detiene la ejecución a mitad

- **WHEN** se detiene el recorrido antes de que termine
- **THEN** no se muestra ningún resultado, porque el recorrido no ha terminado

#### Scenario: Se devuelve al personaje a la salida

- **WHEN** se pide devolver al personaje a la salida después de una ejecución terminada
- **THEN** el resultado y el recuento dejan de mostrarse

### Requirement: El contador de pasos se ve siempre

El sistema SHALL mostrar **cuántos pasos lleva dados** el personaje **en todo
momento**, y no sólo mientras una ejecución está en curso, de modo que se sepa lo
que va costando el recorrido sin contar los movimientos a ojo.

**En reposo SHALL decir cero.** Sin ninguna ejecución hecha, el contador está
puesto y marca cero pasos: un marcador que ya está explica de qué van a ser los
números que suban, y un cero no es un número que haya que batir.

**Durante la ejecución SHALL avanzar con el personaje**, paso a paso.

**Al terminar el recorrido SHALL quedarse en lo que costó**, y **al detenerlo
SHALL quedarse en los pasos dados hasta ahí**. Al devolver al personaje a la
salida SHALL volver a cero.

**NO SHALL decir cuántos pasos faltan, ni de cuántos consta el recorrido, ni
cuántos cuesta la mejor solución.** Enseñar mientras se juega el número que hay
que batir convierte el nivel en un problema de optimización cuando todavía es un
problema de llegar; lo que costó y lo que costaba lo bueno se dicen **al
terminar**, y ahí es una lección y no una exigencia.

El contador SHALL verse **sobre la propia pantalla del juego**, junto al
recorrido que cuenta, y no entre los textos que acompañan a los controles: el
niño está mirando al personaje, y ahí es donde tiene que ver subir sus pasos.

Mientras hay una ejecución, ese número SHALL salir **del programa que se está
ejecutando** —el que se leyó al pedir la ejecución—, y NO SHALL salir de lo que
haya en el lienzo en ese momento: **modificar el lienzo con el recorrido en
marcha NO SHALL cambiar el contador**. Lo que se está ejecutando no cambia a
mitad de camino, y un contador que sí cambiara le enseñaría al niño un recorrido
que no es el que está viendo. **Y construir sin ejecutar NO SHALL moverlo de
cero**: el contador cuenta pasos dados, no pasos puestos.

Los pasos que cuenta SHALL ser los **ordenados**, contados como los cuenta el
recuento del resultado: un avance imposible cuenta igual. El número **en el que
el contador se queda** al terminar SHALL coincidir con el recuento que se enseña
en el resultado — es la misma magnitud contada de la misma manera.

#### Scenario: No se ha ejecutado nada todavía

- **WHEN** el niño abre la pantalla del juego, con el lienzo vacío o con bloques puestos
- **THEN** ve el contador sobre la pantalla del juego, diciendo cero pasos

#### Scenario: Se ejecuta un programa de varios pasos

- **WHEN** el personaje está recorriendo un programa
- **THEN** se ve, sobre la pantalla del juego, cuántos pasos lleva dados
- **AND** ese número avanza con el personaje, paso a paso

#### Scenario: El contador no anuncia lo que falta

- **WHEN** el personaje está recorriendo un programa
- **THEN** no se ve cuántos pasos tiene el recorrido, ni cuántos faltan, ni cuántos cuesta la mejor solución

#### Scenario: Se mueve un bloque con el recorrido en marcha

- **WHEN** el niño cambia los bloques del lienzo mientras el personaje recorre el programa
- **THEN** el contador del recorrido sigue contando el recorrido que empezó

#### Scenario: Un avance imposible también cuenta

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco o fuera del tablero
- **THEN** el contador avanza igualmente, porque los pasos que cuenta son los ordenados

#### Scenario: Termina el recorrido

- **WHEN** el personaje termina de recorrer el programa
- **THEN** el contador se queda en los pasos que ha costado el recorrido
- **AND** se ve además el resultado, con lo que costó y lo que costaba la mejor solución

#### Scenario: Se detiene el recorrido a mitad

- **WHEN** se detiene el recorrido antes de que termine
- **THEN** el contador se queda en los pasos que el personaje había dado hasta ahí

#### Scenario: Se devuelve al personaje a la salida a mitad del recorrido

- **WHEN** se pide devolver al personaje a la salida con una ejecución en curso
- **THEN** el contador vuelve a decir cero pasos

#### Scenario: Se devuelve al personaje a la salida con el recorrido terminado

- **WHEN** se pide devolver al personaje a la salida después de una ejecución terminada o detenida
- **THEN** el contador vuelve a decir cero pasos

#### Scenario: El total del contador y el recuento del resultado dicen lo mismo

- **WHEN** termina un recorrido y se compara el número **en el que el contador se queda** con el recuento que muestra el resultado
- **THEN** los dos números coinciden

## RENAMED Requirements

- FROM: `### Requirement: El paso en curso se ve mientras se ejecuta`
- TO: `### Requirement: El contador de pasos se ve siempre`
