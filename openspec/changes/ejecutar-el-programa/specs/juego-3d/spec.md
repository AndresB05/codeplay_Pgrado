## ADDED Requirements

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

#### Scenario: El lienzo tiene dos secuencias sueltas

- **WHEN** el lienzo tiene dos secuencias que no están encadenadas entre sí y se pide ejecutar el programa
- **THEN** se ejecuta únicamente la que empieza más arriba en el lienzo

#### Scenario: Se ejecuta un lienzo vacío

- **WHEN** no hay ningún bloque en el lienzo y se pide ejecutar el programa
- **THEN** la ejecución termina sin mover al personaje y sin dar error

### Requirement: El juego sabe si el programa llegó a la meta

Al terminar de ejecutar el programa, el sistema SHALL determinar si el personaje
**pisó la casilla de meta**, y SHALL **mostrar el resultado** —se llegó o no se
llegó— sin que haga falta interpretarlo mirando la escena.

Pisar la meta **en cualquier momento** de la ejecución SHALL contar como haber
llegado, aunque el programa continúe después y el personaje acabe en otra
casilla. Pasarse de largo es ineficiencia, no fracaso: se paga en el recuento de
pasos, que es lo que el juego puntúa.

Llegar NO SHALL exigir ninguna orientación: la meta se pisa mirando adonde sea.

El resultado SHALL calcularse **de lo que ocurrió al ejecutar**, y no de lo que
el programa parece decir.

#### Scenario: El programa termina sobre la meta

- **WHEN** se ejecuta un programa que lleva al personaje hasta la casilla de meta y ahí acaba
- **THEN** al terminar se indica que se llegó a la meta

#### Scenario: El programa pisa la meta y sigue

- **WHEN** se ejecuta un programa que pisa la casilla de meta y después se lleva al personaje a otra casilla
- **THEN** al terminar se indica igualmente que se llegó a la meta

#### Scenario: El programa no pasa por la meta

- **WHEN** se ejecuta un programa que en ningún momento lleva al personaje a la casilla de meta
- **THEN** al terminar se indica que no se llegó

#### Scenario: Se llega a la meta mirando a cualquier lado

- **WHEN** el personaje pisa la casilla de meta mirando hacia una dirección cualquiera
- **THEN** se indica que se llegó, sea cual sea esa dirección

## REMOVED Requirements

### Requirement: Al personaje se le pueden dar órdenes sueltas en desarrollo

**Reason**: El requisito empieza diciendo «Mientras el programa de bloques no
exista». El programa existe desde el paso anterior y desde éste además se
ejecuta, así que esa condición se cumplió del todo: las órdenes sueltas eran el
sustituto de una ejecución que ya está. Mantenerlas dejaría además **dos dueños
del mismo estado** —la consola y la ejecución escriben la misma posición del
personaje—, que es la clase de cosa que sólo se nota cuando falla.

**Migration**: Lo que las órdenes sueltas permitían ver —el personaje avanzando y
girando— se ve ahora ejecutando un programa de bloques y devolviéndolo a la
salida, desde la misma pantalla y sin consola. La garantía que las acompañaba
—que no llegaran a producción— desaparece con ellas: no queda ningún medio de dar
órdenes al personaje al margen del programa, ni en desarrollo ni fuera de él.
