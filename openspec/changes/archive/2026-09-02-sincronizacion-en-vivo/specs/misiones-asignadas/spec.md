## MODIFIED Requirements

### Requirement: Una misión sólo existe para el niño si su tutor se la asignó

El sistema SHALL mostrar al niño **únicamente** las misiones asignadas al salón
al que pertenece. NO SHALL existir ninguna superficie donde el niño vea el
catálogo completo, ni siquiera bloqueado o en gris: que una misión esté
«bloqueada hasta que el tutor la asigne» es regla del modelo, y se cumple porque
no hay dónde verla.

Un niño sin salón NO SHALL ver ninguna misión.

Una misión asignada o retirada mientras el niño tiene la pantalla abierta SHALL
aparecer o desaparecer **sin que él recargue ni vuelva a entrar**. El panel NO
SHALL desaparecer mientras se actualiza: hoy no se pinta cuando está cargando, y
una recarga provocada por el tutor lo haría parpadear entero.

#### Scenario: El niño pertenece a un salón con misiones asignadas

- **WHEN** el niño abre una pantalla donde se muestran las misiones de su salón
- **THEN** ve exactamente las misiones que su tutor asignó a ese salón, y ninguna más

#### Scenario: El niño pertenece a un salón sin misiones asignadas

- **WHEN** el niño abre esa pantalla y su tutor no ha asignado ninguna misión
- **THEN** no se pinta ninguna tarjeta ni ningún hueco vacío en su lugar

#### Scenario: El niño no tiene salón

- **WHEN** un niño con `membership` en `none` abre esa pantalla
- **THEN** no ve ninguna misión ni ningún aviso sobre misiones

#### Scenario: Las misiones de otro salón no se filtran

- **WHEN** un niño consulta las asignaciones existentes
- **THEN** no obtiene ninguna que pertenezca a un salón que no es el suyo

#### Scenario: El tutor asigna con la pantalla del niño abierta

- **WHEN** el tutor asigna una misión al salón del niño mientras éste tiene la pantalla abierta
- **THEN** la tarjeta de esa misión aparece sin recargar
- **AND** el resto del panel no desaparece mientras llega

#### Scenario: El tutor retira con la pantalla del niño abierta

- **WHEN** el tutor retira una misión del salón del niño mientras éste tiene la pantalla abierta
- **THEN** la tarjeta deja de verse sin recargar

#### Scenario: Se asigna una misión a otro salón

- **WHEN** el tutor asigna o retira una misión en un salón al que el niño no pertenece
- **THEN** su pantalla no cambia
