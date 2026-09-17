## MODIFIED Requirements

### Requirement: Progreso por mundo

El sistema SHALL mostrar en cada mundo cuántos de sus niveles ha **completado** el
niño sobre el total.

**Cuenta los completados, no los empezados.** Un nivel del que el niño tenga
progreso guardado SHALL contar **sólo si su estado dice que lo superó**. Desde que
fallar un nivel guarda progreso, tener fila y haberlo superado dejaron de ser lo
mismo: sin esa distinción, el primer intento fallido de un mundo lo pondría en
1 de 3 sin que el niño haya resuelto nada.

#### Scenario: El niño ha completado parte de un mundo

- **WHEN** se calcula el progreso de un mundo
- **THEN** se cuentan los niveles del mundo que figuran completados para ese usuario
- **AND** se muestran como una fracción sobre el total de niveles del mundo

#### Scenario: El niño ha fallado un nivel y no ha superado ninguno

- **WHEN** se calcula el progreso de un mundo en el que el niño sólo tiene niveles empezados
- **THEN** el mundo dice cero completados
