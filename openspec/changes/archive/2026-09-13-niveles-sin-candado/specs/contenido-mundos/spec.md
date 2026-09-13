## MODIFIED Requirements

### Requirement: Progresión bloqueada por niveles

El sistema SHALL presentar los niveles de un mundo en orden.

**Hasta la prueba preliminar, ningún nivel SHALL bloquearse en la lista**,
decidido por el usuario el 13-sep-2026: todos los niveles de un mundo SHALL poder
abrirse desde ella, y NO SHALL mostrarse ninguno en estado bloqueado. Cómo se
ordena el avance después de esa prueba es una decisión pendiente, y este
requisito se reescribe cuando se tome.

Qué niveles están completados SHALL salir del **progreso real** del niño, y NO
SHALL salir de datos de ejemplo. El **primer nivel sin completar** del mundo
SHALL marcarse como el nivel en el que va el niño; si están todos completados,
ninguno SHALL llevar esa marca.

Un nivel cuya fila no se pueda jugar SHALL poder abrirse igualmente desde la
lista, y lo que el niño encuentre SHALL ser el aviso de que ese nivel todavía no
se puede jugar, no un tablero a medias.

#### Scenario: Un niño sin progreso entra en un mundo

- **WHEN** el niño no ha completado ningún nivel de ese mundo
- **THEN** todos los niveles aparecen disponibles y se pueden abrir desde la lista
- **AND** el primer nivel lleva la marca del nivel en el que va

#### Scenario: Un nivel aún no está disponible

- **WHEN** el niño pulsa en la lista un nivel cuyo anterior no ha completado, que con el candado habría salido bloqueado
- **THEN** ese nivel se muestra igual de disponible que los demás, sin candado
- **AND** se abre la pantalla de ese nivel

#### Scenario: El niño abre un nivel que todavía no se puede jugar

- **WHEN** pulsa en la lista un nivel cuya fila sigue sembrada en un formato que el juego no puede leer
- **THEN** se abre la pantalla de nivel con el aviso de que ese nivel todavía no se puede jugar
- **AND** no se dibuja ningún tablero

#### Scenario: El niño ha completado parte del mundo

- **WHEN** hay niveles completados en el progreso del niño
- **THEN** esos niveles se muestran como completados
- **AND** la marca del nivel en el que va la lleva el primero sin completar
