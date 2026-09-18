## MODIFIED Requirements

### Requirement: La tabla de seguimiento muestra el XP

La tabla de seguimiento SHALL mostrar el XP de cada alumno en una columna propia,
junto a las que ya tiene —mundo actual, última actividad y racha—. El valor
mostrado SHALL ser el que devuelve el servidor, incluido el cero, y NO SHALL
inventarse ninguna cifra.

La **posición** de esa columna SHALL depender de quién mira: en la vista del niño
va entre la última actividad y la racha, y en la del tutor entre la racha y las
acciones. Es una diferencia buscada, no un descuido de la reutilización.

**La columna SHALL enseñar las tres cosas: la barra, el XP acumulado y el tramo.**
Decidido por el usuario el 17-sep-2026, y no es adorno: **la barra sola ordena
mal**. Como se vacía al subir de tramo, un alumno recién ascendido se ve casi
vacío al lado de otro que va por detrás pero a punto de ascender, y quien mira la
tabla es quien tiene que comparar. El número es lo que ordena y el tramo es lo que
explica la barra.

#### Scenario: El tutor abre el detalle de un salón

- **WHEN** el tutor abre el detalle de un salón con alumnos
- **THEN** la tabla muestra una columna de XP entre «Racha» y «Acciones»
- **AND** cada alumno muestra su barra, su XP acumulado y su tramo

#### Scenario: El niño mira la tabla de su salón

- **WHEN** el niño con estado `member` abre la vista de su salón
- **THEN** la tabla muestra una columna de XP entre «Última actividad» y «Racha»
- **AND** no aparece la columna de acciones, que sigue reservada al tutor

#### Scenario: Alumno sin actividad

- **WHEN** un alumno de la tabla tiene cero XP
- **THEN** su barra se muestra vacía, con cero XP y el primer tramo

#### Scenario: Dos alumnos a distinto lado de un salto de tramo

- **WHEN** un alumno acaba de subir de tramo y otro está a punto de subir con menos XP que él
- **THEN** quien mira la tabla puede ver cuál de los dos va por delante
