## MODIFIED Requirements

### Requirement: Reportes de habilidades

El sistema SHALL calcular el dominio del salón en cinco competencias de
pensamiento computacional —secuencias, bucles, condicionales, depuración y
descomposición— y SHALL representarlo con un semáforo.

El cálculo SHALL hacerse sobre los alumnos reales del salón. Como ninguna tabla
de progreso está todavía asociada a un salón, hoy esos alumnos NO SHALL aportar
dominio alguno y las cinco competencias SHALL mostrarse a cero: es el dato
disponible, no un fallo. Conectar el progreso real es trabajo posterior.

#### Scenario: Se pinta el dominio de una competencia

- **WHEN** el dominio medio es igual o mayor que 70 %
- **THEN** se representa en verde lima como dominada

#### Scenario: Dominio intermedio

- **WHEN** el dominio medio está entre 45 % y 69 %
- **THEN** se representa en amarillo como en camino

#### Scenario: Dominio bajo

- **WHEN** el dominio medio es menor que 45 %
- **THEN** se representa en coral como pendiente de reforzar

#### Scenario: Un salón cuyos alumnos aún no tienen progreso asociado

- **WHEN** el tutor abre los reportes de un salón con alumnos inscritos
- **THEN** las cinco competencias se muestran a cero sin error ni división por cero
