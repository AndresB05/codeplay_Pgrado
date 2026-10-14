## ADDED Requirements

### Requirement: Las pantallas del tutor van sobre un fondo liso

Las pantallas del tutor SHALL ir sobre un **fondo liso** de un color del tema, sin
la ilustración de la selva —la cascada y el valle— ni la trama de lunares. Son
pantallas de trabajo para adultos, y el adorno compite con las tablas y las
cifras. Pedido por el usuario tras probar el panel el 14-oct-2026.

Las pantallas del **niño NO SHALL cambiar**: siguen con su fondo ilustrado.

Sobre el fondo liso, las tarjetas, tablas y avisos del tutor SHALL seguir
distinguiéndose del fondo por su contorno y su color, sin perder contraste.

#### Scenario: El tutor abre sus salones

- **WHEN** el tutor entra en cualquiera de sus pantallas
- **THEN** el fondo es un color liso del tema, sin ilustración

#### Scenario: El niño abre sus mundos

- **WHEN** un niño entra en cualquiera de sus pantallas
- **THEN** el fondo ilustrado sigue como antes

#### Scenario: Las tarjetas se leen sobre el fondo liso

- **WHEN** el tutor mira las tarjetas de resumen y las tablas
- **THEN** cada tarjeta se distingue del fondo por su contorno y su color
