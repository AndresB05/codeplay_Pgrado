## ADDED Requirements

### Requirement: La tabla de seguimiento muestra el XP

La tabla de seguimiento SHALL mostrar el XP de cada alumno en una columna propia,
junto a las que ya tiene —mundo actual, última actividad y racha—. El valor
mostrado SHALL ser el que devuelve el servidor, incluido el cero, y NO SHALL
inventarse ninguna cifra.

La **posición** de esa columna SHALL depender de quién mira: en la vista del niño
va entre la última actividad y la racha, y en la del tutor entre la racha y las
acciones. Es una diferencia buscada, no un descuido de la reutilización.

La barra de esa columna SHALL prescindir de la etiqueta numérica, que no cabe en
el ancho de una columna.

#### Scenario: El tutor abre el detalle de un salón

- **WHEN** el tutor abre el detalle de un salón con alumnos
- **THEN** la tabla muestra una columna de XP entre «Racha» y «Acciones»

#### Scenario: El niño mira la tabla de su salón

- **WHEN** el niño con estado `member` abre la vista de su salón
- **THEN** la tabla muestra una columna de XP entre «Última actividad» y «Racha»
- **AND** no aparece la columna de acciones, que sigue reservada al tutor

#### Scenario: Alumno sin actividad

- **WHEN** un alumno de la tabla tiene cero XP
- **THEN** su barra se muestra vacía con el valor cero, sin etiqueta numérica
