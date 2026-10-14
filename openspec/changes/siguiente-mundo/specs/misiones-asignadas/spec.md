## ADDED Requirements

### Requirement: Una misión de un mundo cerrado avisa de qué falta

El tutor SHALL poder asignar cualquier misión del catálogo, también la de un
mundo que alguno de sus alumnos tenga todavía cerrado: el candado es de cada
niño, y la asignación es del salón. Decidido por el usuario el 14-oct-2026.

Cuando una misión pida **superar un mundo** y ese mundo esté **cerrado** para el
niño, su tarjeta SHALL decirle **qué mundo tiene que superar antes**, con su
nombre —«Primero supera …»—, en lugar de animarle a seguir explorando. La misión
NO SHALL dejar de verse ni de contar entre las asignadas: está pendiente, no
retirada.

Qué mundo pide una misión SHALL salir de su clave, que lleva el **orden** del
mundo y no su identificador (`clear_world_N` es el mundo de orden N). Las
misiones que no piden un mundo concreto NO SHALL llevar el aviso nunca. Si no se
puede saber si el mundo está cerrado, la tarjeta SHALL salir como hoy.

#### Scenario: Misión de un mundo cerrado

- **WHEN** el tutor ha asignado la misión de superar el tercer mundo y el niño no ha superado todo el segundo
- **THEN** la tarjeta de la misión dice que primero supere el segundo mundo, con su nombre

#### Scenario: Misión de un mundo abierto

- **WHEN** la misión pide superar un mundo que el niño ya tiene abierto
- **THEN** la tarjeta sale como hasta ahora, sin aviso

#### Scenario: Misión que no pide un mundo

- **WHEN** la misión pide algo que no es superar un mundo concreto
- **THEN** la tarjeta no lleva el aviso
