# salones-alumno Specification

## Purpose

Permitir que un niño encuentre su salón, pida entrar y espere la aprobación del
tutor. Cubre los tres estados posibles del alumno respecto a los salones y las
transiciones entre ellos.

## Requirements

### Requirement: Estados de pertenencia del alumno

El sistema SHALL mantener para el niño de la sesión uno de tres estados —sin
salón, en espera o inscrito— y SHALL mostrar en cada uno la pantalla que le
corresponde.

#### Scenario: El alumno no tiene salón

- **WHEN** el estado de pertenencia es `none`
- **THEN** se muestra el buscador global de salones

#### Scenario: El alumno espera respuesta

- **WHEN** el estado de pertenencia es `pending`
- **THEN** se muestra la pantalla de espera con la opción de cancelar la solicitud

#### Scenario: El alumno pertenece a un salón

- **WHEN** el estado de pertenencia es `member`
- **THEN** se muestran su salón, sus compañeros y su seguimiento

### Requirement: Un alumno pertenece como máximo a un salón

El sistema NO SHALL permitir que un alumno esté inscrito o en espera en más de
un salón a la vez. Para solicitar entrada en otro salón, antes SHALL quedar sin
salón.

#### Scenario: El alumno ya está inscrito

- **WHEN** el alumno pertenece a un salón e intenta solicitar entrada en otro
- **THEN** no se crea la nueva solicitud

### Requirement: Búsqueda de salones

El sistema SHALL permitir buscar salones por nombre con coincidencia parcial y
por identificador público exacto.

#### Scenario: Búsqueda por nombre parcial

- **WHEN** el alumno escribe parte del nombre de un salón
- **THEN** se listan todos los salones cuyo nombre contiene ese texto

#### Scenario: Búsqueda por identificador exacto

- **WHEN** el alumno escribe un identificador público completo con el formato `CP-XXXX`
- **THEN** se muestra únicamente ese salón

### Requirement: Solicitud de ingreso

El sistema SHALL permitir al alumno solicitar ingreso a un salón con cupos
libres, dejando la decisión en manos del tutor.

#### Scenario: El salón tiene cupos

- **WHEN** el alumno solicita ingreso
- **THEN** se crea una solicitud en ese salón
- **AND** su estado de pertenencia pasa a `pending`
- **AND** la solicitud aparece en la bandeja del tutor de ese salón

#### Scenario: El salón está lleno

- **WHEN** el salón no tiene cupos libres
- **THEN** la acción de solicitar ingreso aparece bloqueada

### Requirement: Cancelación de la propia solicitud

El sistema SHALL permitir al alumno retirar una solicitud que todavía no se ha
resuelto.

#### Scenario: El alumno cancela mientras espera

- **WHEN** el alumno cancela su solicitud desde la pantalla de espera
- **THEN** la solicitud desaparece de la bandeja del tutor
- **AND** su estado de pertenencia vuelve a `none`

### Requirement: El alumno sigue las decisiones del tutor

El sistema SHALL actualizar el estado del alumno cuando el tutor resuelve su
solicitud, lo expulsa o elimina el salón.

#### Scenario: El tutor acepta la solicitud

- **WHEN** el tutor acepta
- **THEN** el estado del alumno pasa a `member`

#### Scenario: El tutor rechaza la solicitud

- **WHEN** el tutor rechaza
- **THEN** el estado del alumno vuelve a `none`

#### Scenario: El tutor elimina el salón

- **WHEN** se elimina el salón donde el alumno estaba inscrito o en espera
- **THEN** el estado del alumno vuelve a `none` y se le muestra el buscador
