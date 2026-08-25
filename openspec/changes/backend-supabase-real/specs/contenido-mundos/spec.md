## MODIFIED Requirements

### Requirement: Sala de trofeos

El sistema SHALL mostrar al niño los logros que ha conseguido, con la fecha en
que los obtuvo y la experiencia que le dieron.

El sistema NO SHALL presentar logros pendientes ni avance hacia ellos mientras
no exista un catálogo de logros en el esquema: la tabla `achievements` es el
registro de lo concedido a cada niño, no la lista de lo que se puede conseguir.
Diseñar ese catálogo y la lógica que concede los logros es trabajo aparte.

#### Scenario: El niño abre la sala de trofeos

- **WHEN** se cargan los logros
- **THEN** se listan los que ha conseguido, cada uno con su fecha y su experiencia

#### Scenario: El niño todavía no ha conseguido ninguno

- **WHEN** el niño no tiene logros concedidos
- **THEN** se muestra un mensaje que lo invita a seguir jugando, y no una lista vacía
