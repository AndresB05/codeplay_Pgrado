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

**La ventana SHALL enseñar la puntuación de la partida y la experiencia que se
acaba de conceder**, no la que el nivel podría dar. NO SHALL enseñar el tope del
nivel como si fuera lo ganado: una partida con pasos de más gana menos, y una
partida que no mejora la marca **no gana nada**, y eso SHALL decirse sin
presentarlo como un castigo —el nivel se completó igual—.

La puntuación SHALL poder verse **sin esperar al servidor**, porque la ventana no
espera por el guardado; la experiencia concedida, en cambio, SHALL ser la que el
servidor conceda, y hasta que llegue NO SHALL enseñarse ningún número en su
lugar. Si el guardado falla, la ventana NO SHALL enseñar experiencia ninguna.

**Y cuando esa experiencia haga subir de tramo, la ventana SHALL decirlo.** Es el
momento en que ocurre y el único sitio donde se puede celebrar: el panel enseña en
qué tramo está el niño, pero no que acaba de cambiar. NO SHALL anunciarse una
subida que no ha ocurrido —una partida que no concede experiencia no sube a
nadie— ni cuando el guardado haya fallado, porque entonces no se sabe.

**Si la partida no se pudo guardar, la ventana SHALL decirlo** en una línea, sin
pedirle nada al niño: volver a jugar el nivel lo guarda, y repetir no le quita
nada. NO SHALL esperarse a la confirmación del guardado para abrirla.

La ventana NO SHALL salir al detener un recorrido, al terminar uno que no llegó a
la meta, ni con un lienzo vacío. Que la partida se guarde en todos esos casos o no
NO SHALL cambiar eso: guardar y felicitar son cosas distintas. SHALL poder
cerrarse con Escape para volver a mirar el tablero.

Fuera de la pantalla de nivel —el banco de pruebas— NO SHALL abrirse: no hay
mundo al que salir, y tampoco hay nada que guardar ni experiencia que conceder.

#### Scenario: Se llega a la meta con los pasos justos

- **WHEN** termina un recorrido que llega a la meta con los pasos de la mejor solución
- **THEN** se abre la ventana, felicita el recorrido perfecto y dice los pasos usados y los de la mejor solución
- **AND** la puntuación que enseña es la máxima

#### Scenario: Se llega a la meta con pasos de más

- **WHEN** termina un recorrido que llega a la meta con más pasos de los de la mejor solución
- **THEN** se abre la ventana, felicita la llegada, dice los dos números y anima a intentarlo con menos
- **AND** la puntuación que enseña es menor que la máxima

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

- **WHEN** se supera por primera vez un nivel con una partida que no es perfecta
- **THEN** la ventana enseña la experiencia que el servidor acaba de conceder por esa partida, que es menor que el tope del nivel
- **AND** no enseña el tope del nivel como si fuera lo ganado

#### Scenario: Se vuelve a superar el nivel sin mejorar

- **WHEN** se vuelve a superar un nivel sin mejorar la marca anterior
- **THEN** la ventana felicita igual y dice que esta vez no se ganó experiencia

#### Scenario: La partida hace subir de tramo

- **WHEN** la experiencia concedida por la partida completa el tramo en el que estaba el niño
- **THEN** la ventana lo celebra y dice a qué tramo ha subido

#### Scenario: La partida no hace subir de tramo

- **WHEN** la experiencia concedida no llega a completar el tramo
- **THEN** la ventana no anuncia ninguna subida

#### Scenario: El guardado falla y no hay experiencia que enseñar

- **WHEN** termina un recorrido que llega a la meta y el guardado no se puede hacer
- **THEN** la ventana no enseña ninguna experiencia concedida

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
