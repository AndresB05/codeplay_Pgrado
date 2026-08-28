## MODIFIED Requirements

### Requirement: Esquema del módulo de salones

El sistema SHALL guardar en la base de datos los salones y todo lo que cuelga de
ellos: el salón con su tutor, su ID público, su grado y su cupo; la pertenencia
de un niño a un salón; las solicitudes de ingreso con su estado; y la invitación
con su token y su caducidad, **sin dirección de correo**.

Ninguna tabla SHALL almacenar la dirección de correo de una persona que no tiene
cuenta en la plataforma. Una dirección así pertenece a alguien que no ha
autorizado nada y que puede ser un menor, y hoy no existe ningún envío que la
justifique.

El ID público SHALL ser único entre todos los salones, porque es lo que el niño
teclea en el buscador para encontrar uno concreto.

Al borrarse un salón, SHALL desaparecer con él su pertenencia, sus solicitudes y
sus invitaciones: ninguna de esas filas tiene sentido sin el salón.

#### Scenario: Se crea un salón

- **WHEN** un tutor crea un salón
- **THEN** el salón queda guardado con su tutor, su nombre, su grado, su cupo y un ID público único

#### Scenario: Dos salones intentan el mismo ID público

- **WHEN** se intenta crear un salón con un ID público que ya usa otro
- **THEN** la base de datos rechaza la escritura

#### Scenario: Se borra un salón con alumnos y solicitudes

- **WHEN** se borra un salón
- **THEN** desaparecen también sus pertenencias, sus solicitudes y sus invitaciones

#### Scenario: No hay dónde guardar el correo de un tercero

- **WHEN** se revisa el esquema en busca de direcciones de correo de personas sin cuenta
- **THEN** no existe ninguna columna que las almacene
