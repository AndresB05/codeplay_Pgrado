# salones-tutor Specification

## Purpose

Permitir que el tutor cree salones, decida quién entra en ellos y siga el
progreso de sus alumnos. Es el módulo más desarrollado de la plataforma.

## Requirements

### Requirement: Creación de un salón

El sistema SHALL permitir crear un salón indicando nombre, grado, profesor a
cargo y cupos, y SHALL validar los datos en el cliente antes de crearlo.

#### Scenario: Datos válidos

- **WHEN** el tutor envía el formulario con nombre, grado, profesor y una capacidad entre 1 y 60
- **THEN** se crea el salón con un identificador interno y un tema visual asignado
- **AND** se redirige al detalle del salón recién creado

#### Scenario: Capacidad fuera de rango

- **WHEN** la capacidad indicada es menor que 1 o mayor que 60
- **THEN** se muestra el error de validación y el salón no se crea

### Requirement: Identificador público único por salón

El sistema SHALL asignar a cada salón un identificador público con el formato
`CP-XXXX`, distinto del identificador interno y único entre los salones
existentes, para que un niño pueda buscarlo tal cual.

#### Scenario: Se crea un salón nuevo

- **WHEN** se genera el identificador público
- **THEN** no coincide con el de ningún salón ya existente

### Requirement: Bandeja de solicitudes de ingreso

El sistema SHALL mostrar al tutor las solicitudes pendientes de su salón y SHALL
permitirle aceptarlas o rechazarlas.

#### Scenario: El tutor acepta una solicitud

- **WHEN** el salón tiene cupos libres y el tutor acepta
- **THEN** el niño pasa a la tabla de seguimiento sin actividad previa
- **AND** la solicitud desaparece de la bandeja

#### Scenario: El salón está lleno

- **WHEN** no quedan cupos libres
- **THEN** la acción de aceptar aparece deshabilitada

#### Scenario: El tutor rechaza una solicitud

- **WHEN** el tutor rechaza
- **THEN** la solicitud se descarta y el niño vuelve a quedar sin salón

### Requirement: Expulsión de un alumno

El sistema SHALL permitir quitar a un alumno del salón, y SHALL exigir una
confirmación explícita antes de hacerlo.

#### Scenario: El tutor confirma la expulsión

- **WHEN** el tutor pulsa quitar y confirma en la fila del alumno
- **THEN** el alumno sale de la tabla
- **AND** los contadores del salón se recalculan

#### Scenario: El tutor cancela

- **WHEN** el tutor pulsa quitar y después cancela
- **THEN** el alumno permanece en el salón

### Requirement: Eliminación de un salón

El sistema SHALL permitir eliminar un salón mostrando antes cuántos alumnos y
cuántas solicitudes quedarán afectados.

#### Scenario: El tutor elimina un salón con alumnos

- **WHEN** se abre el diálogo de confirmación
- **THEN** indica el número de alumnos y de solicitudes afectados
- **AND** al confirmar, el salón desaparece y todos sus alumnos quedan sin salón
- **AND** se redirige al listado de salones

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

### Requirement: Selector de alcance del panel

El sistema SHALL permitir al tutor ver la información agregada de todos sus
salones o restringirla a uno concreto.

#### Scenario: El tutor elige un salón

- **WHEN** selecciona un salón en el selector de alcance
- **THEN** las métricas y los reportes pasan a referirse sólo a ese salón

### Requirement: Registro de invitaciones por correo

El sistema SHALL permitir al tutor registrar invitaciones por correo,
normalizando la dirección a minúsculas y rechazando duplicados dentro del mismo
salón.

Hoy la invitación queda únicamente registrada: NO SHALL enviarse ningún correo
ni existe forma de canjearla, a la espera de un servicio de correo.

#### Scenario: Dirección válida y nueva

- **WHEN** el tutor introduce una dirección con formato correcto que no está ya invitada
- **THEN** la invitación se registra en estado pendiente y aparece en la lista de invitaciones enviadas

#### Scenario: Dirección ya invitada

- **WHEN** la dirección ya figura entre las invitaciones del salón
- **THEN** se rechaza como duplicada y no se registra por segunda vez
