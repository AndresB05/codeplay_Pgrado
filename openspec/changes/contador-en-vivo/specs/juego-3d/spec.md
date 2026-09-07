## ADDED Requirements

### Requirement: El coste del programa se ve mientras se construye

Mientras el niño construye el programa, el sistema SHALL mostrar **cuántos pasos
cuesta el programa que hay en el lienzo** y **cuántos cuesta la mejor solución
del nivel**, sin que haga falta contar los bloques a ojo y **sin ejecutar nada**.

Ese número SHALL salir de **leer** el programa, con las mismas reglas con las que
se cuenta al terminar, y SHALL cambiar cuando cambie el programa del lienzo:
encadenar un bloque, quitarlo o cambiar cuántas casillas avanza.

**Cuando no haya programa que contar, NO SHALL mostrarse número alguno**: ni con
el lienzo vacío ni con un programa que no se puede leer. Cero pasos contra los
del nivel le diría al niño que su programa es malo cuando lo que ocurre es que no
hay programa, que es la misma razón por la que el resultado tampoco lo muestra.

Cuando el lienzo tenga **varias secuencias sueltas**, el número mostrado SHALL ser
el de la secuencia **que se ejecutaría**, nunca la suma de todas, y el sistema
SHALL advertirlo **ya al construir**. Sin ese aviso el niño ve un número que no
es el de lo que tiene delante, y no puede saber por qué.

Ese aviso NO SHALL mostrarse cuando ya se esté mostrando el del **resultado** de
una ejecución terminada: los dos dicen lo mismo, uno de lo que va a pasar y otro
de lo que pasó, y repetirlo en dos líneas no le añade nada al niño.

**Mientras una ejecución esté en curso, este número NO SHALL mostrarse.** Durante
el recorrido el niño no construye, y un número del lienzo que puede cambiar bajo
una ejecución que no gobierna se contradice a sí mismo en pantalla.

**Este requisito es independiente del que enseña el paso en curso.** Enseñar lo
que cuesta el programa **antes** de ejecutarlo es una elección pedagógica que
puede cambiar; retirarla NO SHALL alterar lo que se ve durante la ejecución.

#### Scenario: Se encadena un bloque más al programa

- **WHEN** el niño encadena un bloque al programa que ya tiene en el lienzo
- **THEN** el coste que se muestra pasa a ser el del programa nuevo, sin ejecutar nada
- **AND** se sigue viendo cuántos pasos cuesta la mejor solución del nivel

#### Scenario: Se quita un bloque del programa

- **WHEN** el niño quita del lienzo un bloque que formaba parte del programa
- **THEN** el coste que se muestra pasa a ser el del programa que queda

#### Scenario: El lienzo está vacío

- **WHEN** no hay ningún bloque en el lienzo
- **THEN** no se muestra ningún coste

#### Scenario: El programa del lienzo no se puede leer

- **WHEN** el lienzo tiene algo que el sistema no sabe leer como programa
- **THEN** no se muestra ningún coste

#### Scenario: El lienzo tiene varias secuencias sueltas

- **WHEN** el lienzo tiene más de una secuencia suelta
- **THEN** el coste que se muestra es el de la secuencia que se ejecutaría
- **AND** se avisa de que hay bloques sueltos y de que sólo se ejecutará una

#### Scenario: Hay una ejecución en curso

- **WHEN** el personaje está recorriendo el programa
- **THEN** no se muestra el coste del lienzo

#### Scenario: Termina una ejecución con el lienzo lleno de secuencias sueltas

- **WHEN** termina la ejecución de un lienzo que tiene más de una secuencia suelta
- **THEN** el coste del lienzo se ve otra vez
- **AND** el aviso de los bloques sueltos aparece una sola vez, el del resultado

### Requirement: El paso en curso se ve mientras se ejecuta

Mientras una ejecución está en curso, el sistema SHALL mostrar **por qué paso va
el recorrido** y **de cuántos consta**, de modo que se sepa cuánto lleva y cuánto
le queda sin contar los movimientos a ojo. Ese número SHALL avanzar con el
personaje, paso a paso.

Los dos números SHALL salir **del programa que se está ejecutando** —el que se
leyó al pedir la ejecución—, y NO SHALL salir de lo que haya en el lienzo en ese
momento: **modificar el lienzo con el recorrido en marcha NO SHALL cambiar el
contador**. Lo que se está ejecutando no cambia a mitad de camino, y un contador
que sí cambiara le enseñaría al niño un recorrido que no es el que está viendo.

El total SHALL ser **el mismo recuento** que se le enseña al terminar, contado de
la misma manera: los pasos **ordenados**, y no los que la ejecución consiguió dar.

Al terminar el recorrido, este contador SHALL dejar de mostrarse, y su sitio lo
ocupa el resultado. Al devolver al personaje a la salida durante una ejecución,
SHALL dejar de mostrarse también.

#### Scenario: Se ejecuta un programa de varios pasos

- **WHEN** el personaje está recorriendo un programa
- **THEN** se ve por qué paso del recorrido va y de cuántos consta
- **AND** ese número avanza con el personaje, paso a paso

#### Scenario: Se mueve un bloque con el recorrido en marcha

- **WHEN** el niño cambia los bloques del lienzo mientras el personaje recorre el programa
- **THEN** el contador del recorrido sigue diciendo lo mismo que decía

#### Scenario: Un avance imposible también cuenta

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco o fuera del tablero
- **THEN** el contador avanza igualmente, porque los pasos que cuenta son los ordenados

#### Scenario: Termina el recorrido

- **WHEN** el personaje termina de recorrer el programa
- **THEN** deja de verse el contador del recorrido
- **AND** se ve el resultado con lo que costó y lo que costaba la mejor solución

#### Scenario: Se devuelve al personaje a la salida a mitad del recorrido

- **WHEN** se pide devolver al personaje a la salida con una ejecución en curso
- **THEN** deja de verse el contador del recorrido

#### Scenario: El total del contador y el recuento del resultado dicen lo mismo

- **WHEN** se ejecuta un programa y se compara el total que el contador anunciaba con el recuento que se muestra al terminar
- **THEN** los dos números coinciden

## MODIFIED Requirements

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

**Mientras la ejecución está en curso NO SHALL mostrarse todavía el resultado**
—ni si se llegó, ni lo que ha costado—, y al devolver al personaje a la salida el
resultado SHALL desaparecer. Lo que sí se ve durante el recorrido es **por dónde
va**, y eso lo gobierna su propio requisito: el resultado se sabe al terminar, el
paso en curso mientras se ejecuta, y no son el mismo dato dicho dos veces.

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
- **THEN** no se muestra ningún resultado ni el recuento de lo que ha costado
- **AND** se ve por qué paso del recorrido va

#### Scenario: Se devuelve al personaje a la salida

- **WHEN** se pide devolver al personaje a la salida después de una ejecución terminada
- **THEN** el resultado y el recuento dejan de mostrarse
