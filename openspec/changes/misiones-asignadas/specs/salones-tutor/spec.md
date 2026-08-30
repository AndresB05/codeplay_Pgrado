## MODIFIED Requirements

### Requirement: Selector de alcance del panel

El sistema SHALL permitir al tutor ver la información agregada de todos sus
salones o restringirla a uno concreto.

El alcance elegido SHALL gobernar **todo** el panel, no sólo lo que se lee: las
métricas, los reportes y también **el destino de las misiones que el tutor
asigna**. Un selector que se ignora al escribir es peor que no tenerlo, porque el
tutor cree haber elegido algo que no se tuvo en cuenta.

#### Scenario: El tutor elige un salón

- **WHEN** selecciona un salón en el selector de alcance
- **THEN** las métricas y los reportes pasan a referirse sólo a ese salón

#### Scenario: El tutor asigna con un alcance elegido

- **WHEN** el tutor asigna una misión con un salón elegido en el selector
- **THEN** la misión se asigna a ese salón y a ningún otro

#### Scenario: El tutor cambia de alcance

- **WHEN** el tutor cambia de un salón a otro en el selector
- **THEN** lo que aparece como asignado corresponde al salón elegido, no al anterior
