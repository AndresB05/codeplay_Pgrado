## ADDED Requirements

### Requirement: Una partida terminada se guarda en el servidor

Cuando **termine** un recorrido, la plataforma SHALL guardarlo, **haya llegado a
la meta o no**. Una partida terminada es un intento, y un intento fallido es tan
parte del historial del niño como uno con éxito.

**El guardado son dos escrituras**, y las dos SHALL hacerse: el **intento**, con
el programa que se ejecutó, y el **progreso del nivel**. NO SHALL renunciarse a la
segunda porque falle la primera: son independientes, y perder el progreso de una
partida que sí ocurrió sería peor.

**El intento SHALL llevar el programa entero y fiel**, en el sobre con la versión
del formato dentro. NO SHALL recortarse, normalizarse ni simplificarse: quien lo
lea después —para puntuarlo o para conceder un logro— tiene que ver lo que el niño
escribió, y saber en qué formato lo está leyendo sin mirar otra columna.

**El intento SHALL llevar además cuánto duró la partida y las observaciones del
juego**: los pasos que se le enseñaron al niño, el mínimo apuntado del nivel, si
se agotó el máximo de pasos y si sobraron bloques. Esas observaciones NO SHALL
tratarse como la verdad del recuento: el número que cuenta lo recalcula el
servidor leyendo el programa.

**El juego NO SHALL mandar la puntuación**, ni la experiencia, ni qué logros cree
merecer, ni qué misiones cree haber cumplido. La puntuación la calcula el
servidor leyendo el programa, y el paso que la calcule es el que la estrene.

**Superar el nivel SHALL guardarlo como superado; fallarlo, como empezado.** Un
nivel que ya estuvo superado NO SHALL dejar de estarlo por fallarlo después, y su
fecha de finalización NO SHALL moverse.

**Lo que NO es una partida NO SHALL guardarse**: un lienzo vacío o ilegible no
llegó a ejecutarse, y un recorrido detenido por el niño no ha terminado.
Quedarse sin pasos **sí** es una partida terminada, y SHALL guardarse como fallo.

**Cada partida SHALL guardarse una sola vez.** Ni un repintado, ni el doble
disparo de los efectos en desarrollo, ni reanudar un recorrido detenido SHALL
producir un intento de más.

**El guardado NO SHALL bloquear al niño.** La pantalla SHALL seguir respondiendo
sin esperar confirmación, y si el guardado falla SHALL decírselo con palabras
suyas, sin pedirle que haga nada y sin quitarle lo que acaba de conseguir.

#### Scenario: Se supera un nivel

- **WHEN** termina un recorrido que llega a la meta
- **THEN** queda guardado un intento con éxito, con el programa entero, su duración y sus observaciones
- **AND** el nivel queda guardado como superado, con su fecha de finalización

#### Scenario: No se llega a la meta

- **WHEN** termina un recorrido que no pisa la meta
- **THEN** queda guardado un intento sin éxito, con el mismo detalle
- **AND** el nivel queda guardado como empezado, sin fecha de finalización

#### Scenario: Se agota el máximo de pasos

- **WHEN** un recorrido se corta por agotar el máximo de pasos del nivel
- **THEN** queda guardado un intento sin éxito, con la marca de que se agotó el máximo

#### Scenario: Se falla un nivel que ya estaba superado

- **WHEN** termina sin llegar a la meta un recorrido de un nivel ya superado
- **THEN** el nivel sigue guardado como superado y su fecha de finalización no cambia
- **AND** queda guardado el intento fallido

#### Scenario: El lienzo está vacío

- **WHEN** se pulsa «Ejecutar» sin bloques en el lienzo
- **THEN** no se guarda ningún intento ni ningún progreso

#### Scenario: Se detiene un recorrido y no se reanuda

- **WHEN** se detiene un recorrido antes de que termine y no se reanuda
- **THEN** no se guarda ningún intento ni ningún progreso

#### Scenario: Se reanuda un recorrido detenido

- **WHEN** se reanuda un recorrido detenido y llega hasta el final
- **THEN** se guarda **un solo** intento, el de esa partida

#### Scenario: El guardado falla

- **WHEN** termina un recorrido que llega a la meta y el guardado no se puede hacer
- **THEN** la ventana de felicitaciones sale igual
- **AND** avisa de que la partida no se pudo guardar, sin pedirle nada al niño

## MODIFIED Requirements

### Requirement: Llegar a la meta abre una ventana de felicitaciones

Cuando **termine** un recorrido que **ha llegado a la meta**, la pantalla de
nivel SHALL abrir **una ventana de felicitaciones**, siempre, llegue con los pasos
justos o con más. Decidido por el usuario el 14-sep-2026.

La ventana SHALL decir que se completó el nivel, **cuántos pasos se usaron y
cuántos cuesta la mejor solución**. Con los pasos justos o menos SHALL felicitar
el recorrido perfecto; con más, SHALL felicitar la llegada y **animar a
intentarlo con menos**, sin presentarlo como un fracaso.

La ventana SHALL ofrecer **tres botones**:

- **«Salir al mundo»**, que lleva a la lista de niveles del mundo del nivel;
- **«Volver a intentar»**, que cierra la ventana y devuelve al personaje a la
  salida con el contador a cero, **dejando los bloques del lienzo** como estaban:
  quien vuelve a intentarlo suele querer mejorar su programa, no rehacerlo.
  Pedido por el usuario el 14-sep-2026;
- **«Siguiente nivel»**, que abre el nivel con el orden siguiente **del mismo
  mundo**, empezando de cero: lienzo, personaje y contador.

En el **último nivel de un mundo**, «Siguiente nivel» NO SHALL aparecer.

La ventana SHALL mostrar además **la experiencia que da el nivel**, la de su fila.
Es un recordatorio pedido por el usuario el 14-sep-2026, y el número que enseña
**no es todavía el que se concede**: la experiencia que de verdad se gana la
decide el servidor al guardar el progreso, y mostrar este número NO SHALL sumar
experiencia a nadie.

**Si la partida no se pudo guardar, la ventana SHALL decirlo** en una línea, sin
pedirle nada al niño: volver a jugar el nivel lo guarda, y repetir no le quita
nada. NO SHALL esperarse a la confirmación del guardado para abrirla.

La ventana NO SHALL salir al detener un recorrido, al terminar uno que no llegó a
la meta, ni con un lienzo vacío. Que la partida se guarde en todos esos casos o no
NO SHALL cambiar eso: guardar y felicitar son cosas distintas. SHALL poder
cerrarse con Escape para volver a mirar el tablero.

Fuera de la pantalla de nivel —el banco de pruebas— NO SHALL abrirse: no hay
mundo al que salir.

#### Scenario: Se llega a la meta con los pasos justos

- **WHEN** termina un recorrido que llega a la meta con los pasos de la mejor solución
- **THEN** se abre la ventana, felicita el recorrido perfecto y dice los pasos usados y los de la mejor solución

#### Scenario: Se llega a la meta con pasos de más

- **WHEN** termina un recorrido que llega a la meta con más pasos de los de la mejor solución
- **THEN** se abre la ventana, felicita la llegada, dice los dos números y anima a intentarlo con menos

#### Scenario: No se llega a la meta

- **WHEN** termina un recorrido que no pisa la meta
- **THEN** no se abre la ventana

#### Scenario: Se detiene un recorrido

- **WHEN** se detiene un recorrido antes de que termine
- **THEN** no se abre la ventana

#### Scenario: Se pasa al siguiente nivel

- **WHEN** en la ventana del nivel 1 de un mundo se pulsa «Siguiente nivel»
- **THEN** se abre el nivel 2 de ese mundo con el lienzo vacío, el personaje en la salida y el contador a cero

#### Scenario: La ventana enseña la experiencia del nivel

- **WHEN** se abre la ventana de un nivel cuya fila da 100 de experiencia
- **THEN** la ventana dice que el nivel da 100 de experiencia

#### Scenario: Se vuelve a intentar el nivel

- **WHEN** en la ventana se pulsa «Volver a intentar»
- **THEN** la ventana se cierra, el personaje está en la salida y el contador dice cero
- **AND** los bloques del lienzo siguen donde estaban

#### Scenario: Se sale al mundo

- **WHEN** en la ventana se pulsa «Salir al mundo»
- **THEN** se ve la lista de niveles del mundo del nivel

#### Scenario: El último nivel del mundo

- **WHEN** se completa el último nivel de un mundo
- **THEN** la ventana ofrece «Salir al mundo» y «Volver a intentar», y no «Siguiente nivel»
