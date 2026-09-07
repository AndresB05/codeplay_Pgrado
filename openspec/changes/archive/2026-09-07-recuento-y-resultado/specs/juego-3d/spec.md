## ADDED Requirements

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

## MODIFIED Requirements

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
