## ADDED Requirements

### Requirement: Quién ha cumplido se puede filtrar

La tabla «Quién ha cumplido» del panel del tutor SHALL poder filtrarse con los
mismos tres filtros que la tabla de seguimiento —**nombre**, **mundo** y
**actividad**— y uno más, **estado**:

- **cumplida**: el explorador ha cumplido **todas** las misiones asignadas al
  salón;
- **pendiente**: le queda **alguna** por cumplir.

Una fila es un explorador y lleva una columna por misión, así que el estado se
mira sobre la fila entera: filtrar por una sola misión sería un filtro más, y
los filtros los eligió el usuario.

Los filtros SHALL combinarse, y si no dejan ninguna fila SHALL decirse y SHALL
poder quitarse de un toque, como en la tabla de seguimiento. Cambiar de salón
SHALL dejar los filtros vacíos: el mundo elegido puede no existir en el otro.

#### Scenario: Se filtran los pendientes

- **WHEN** el salón tiene dos misiones asignadas, Ana ha cumplido las dos y Luis sólo una, y el tutor elige «Pendiente»
- **THEN** se ve la fila de Luis y no la de Ana

#### Scenario: Se filtran los que han cumplido

- **WHEN** con esas mismas misiones el tutor elige «Cumplida»
- **THEN** se ve la fila de Ana y no la de Luis

#### Scenario: Se combinan filtros

- **WHEN** el tutor elige «Pendiente» y «Conectado»
- **THEN** sólo se ven quienes tienen alguna misión pendiente y CodePlay abierto ahora
