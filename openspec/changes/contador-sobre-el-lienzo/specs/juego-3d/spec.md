## ADDED Requirements

### Requirement: Los bloques sueltos se avisan mientras se construye

Cuando el lienzo tenga **más de una secuencia suelta**, el sistema SHALL avisar
de ello **mientras el niño construye**, sin esperar a que ejecute. Sólo se
ejecuta una de las secuencias, y sin aviso un bloque olvidado por encima del
programa se ejecuta en su lugar: el niño no puede distinguir «mi programa está
mal» de «mi programa no se ejecutó».

**El aviso NO SHALL llevar ninguna cifra**: ni cuántos pasos cuesta el programa,
ni cuántos cuesta la mejor solución, ni cuántas secuencias hay. Dice que hay
bloques de más y cuál se ejecutará, y nada más — un número antes de jugar
convierte el nivel en un problema de optimización cuando todavía es un problema
de llegar.

NO SHALL avisarse cuando el lienzo tenga **una sola secuencia**, cuando esté
**vacío** o cuando el programa **no se pueda leer**: en los tres casos no hay
nada sobrante que señalar.

Mientras una ejecución esté en curso, este aviso NO SHALL mostrarse. Y cuando ya
se esté mostrando el aviso equivalente del **resultado** de una ejecución
terminada, este aviso NO SHALL mostrarse tampoco: los dos dicen lo mismo, uno de
lo que va a pasar y otro de lo que pasó.

#### Scenario: El lienzo tiene dos secuencias sueltas

- **WHEN** el niño tiene más de una secuencia suelta en el lienzo y no ha pedido ejecutar
- **THEN** se avisa de que hay bloques sueltos y de que sólo se ejecutará una secuencia

#### Scenario: El aviso no lleva números

- **WHEN** se muestra ese aviso
- **THEN** no se ve con él ningún recuento de pasos, ni del programa ni de la mejor solución

#### Scenario: El lienzo tiene una sola secuencia

- **WHEN** todos los bloques del lienzo cuelgan de una misma secuencia
- **THEN** no se avisa de nada

#### Scenario: El lienzo está vacío

- **WHEN** no hay ningún bloque en el lienzo
- **THEN** no se avisa de nada

#### Scenario: Hay una ejecución en curso

- **WHEN** el personaje está recorriendo el programa
- **THEN** no se muestra este aviso

#### Scenario: El resultado ya avisó

- **WHEN** termina la ejecución de un lienzo que tiene más de una secuencia suelta
- **THEN** el aviso de los bloques sueltos aparece una sola vez, el del resultado

## MODIFIED Requirements

### Requirement: El paso en curso se ve mientras se ejecuta

Mientras una ejecución está en curso, el sistema SHALL mostrar **cuántos pasos
lleva dados** el personaje, de modo que se sepa lo que va costando el recorrido
sin contar los movimientos a ojo. Ese número SHALL avanzar con el personaje,
paso a paso.

**NO SHALL decir cuántos pasos faltan, ni de cuántos consta el recorrido, ni
cuántos cuesta la mejor solución.** Enseñar mientras se juega el número que hay
que batir convierte el nivel en un problema de optimización cuando todavía es un
problema de llegar; lo que costó y lo que costaba lo bueno se dicen **al
terminar**, y ahí es una lección y no una exigencia.

El contador SHALL verse **sobre la propia pantalla del juego**, junto al
recorrido que cuenta, y no entre los textos que acompañan a los controles: el
niño está mirando al personaje, y ahí es donde tiene que ver subir sus pasos.

Ese número SHALL salir **del programa que se está ejecutando** —el que se leyó al
pedir la ejecución—, y NO SHALL salir de lo que haya en el lienzo en ese momento:
**modificar el lienzo con el recorrido en marcha NO SHALL cambiar el contador**.
Lo que se está ejecutando no cambia a mitad de camino, y un contador que sí
cambiara le enseñaría al niño un recorrido que no es el que está viendo.

Los pasos que cuenta SHALL ser los **ordenados**, contados como los cuenta el
recuento del resultado: un avance imposible cuenta igual. El número **al que el
contador llega** SHALL coincidir con el recuento que se enseña al terminar — es
la misma magnitud contada de la misma manera, y lo que cambia es sólo que ya no
se anuncia por adelantado.

Al terminar el recorrido, este contador SHALL dejar de mostrarse, y lo que se ve
entonces es el resultado. Al devolver al personaje a la salida durante una
ejecución, SHALL dejar de mostrarse también.

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
- **THEN** deja de verse el contador del recorrido
- **AND** se ve el resultado con lo que costó y lo que costaba la mejor solución

#### Scenario: Se devuelve al personaje a la salida a mitad del recorrido

- **WHEN** se pide devolver al personaje a la salida con una ejecución en curso
- **THEN** deja de verse el contador del recorrido

#### Scenario: El total del contador y el recuento del resultado dicen lo mismo

- **WHEN** se ejecuta un programa y se compara el número **al que el contador llega** con el recuento que se muestra al terminar
- **THEN** los dos números coinciden

## REMOVED Requirements

### Requirement: El coste del programa se ve mientras se construye

**Reason**: Lo pidió el usuario el 7-sep-2026 con la garantía ya funcionando
delante, y es un juicio de producto: «el niño se va a matar la cabeza pensando
cómo llegar al final con sólo 10 pasos en vez de llegar al final». Enseñar el
número a batir **antes** de haber resuelto nada convierte el nivel en un problema
de optimización cuando todavía es un problema de llegar. La eficiencia se aprende
después, y para eso está el resultado al terminar.

Se retira **entera**, no acotada: no es que el número estuviera mal presentado,
es que enseñarlo antes de jugar no se quiere. Y se pudo retirar de una pieza
porque el requisito nació separado a propósito, previendo exactamente esto.

**Migration**: Ninguna. No hay datos, ni formato, ni nada guardado: lo que
desaparece es lo que se pintaba en pantalla mientras el niño construía. Lo que
esa garantía enseñaba —lo que costó el programa y lo que cuesta la mejor
solución— se sigue viendo **al terminar**, con «Al terminar se ve lo que costó y
lo que costaba lo bueno», que no cambia.

**Lo que NO se va con ella es el aviso de bloques sueltos mientras se construye**,
que esta garantía traía dentro. Se conserva en un requisito propio, «Los bloques
sueltos se avisan mientras se construye», por decisión del usuario del
7-sep-2026 tomada al retirar lo demás. Son cosas distintas aunque vivieran
juntas: una **enseña un número a batir** y la otra dice que **hay un bloque
olvidado**. La primera convierte el nivel en un problema de optimización antes de
que sea uno de llegar; la segunda evita que el niño crea que su programa está mal
cuando lo que pasa es que no se ejecutó.
