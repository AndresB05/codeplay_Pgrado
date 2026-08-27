## MODIFIED Requirements

### Requirement: Acceso a los datos de un salón acotado por pertenencia

El sistema SHALL limitar la lectura y la escritura de los datos de salones a
quien le corresponden:

- El tutor SHALL poder leer y administrar únicamente los salones que él creó,
  con sus pertenencias, sus solicitudes y sus invitaciones.
- El niño SHALL poder leer su propia pertenencia, sus propias solicitudes y la
  lista de quienes pertenecen a **su** salón, porque el módulo de salón le
  muestra a sus compañeros. NO SHALL poder leer las pertenencias de un salón al
  que no pertenece.
- De cada compañero de salón SHALL exponerse su nombre, su avatar, su XP y su
  racha, y nada más. NO SHALL exponerse su correo, su país ni su nombre de
  usuario. La misma lista SHALL ser la que ve el tutor del salón.
- El niño SHALL poder cancelar su solicitud y abandonar su salón.
- Las invitaciones por correo SHALL ser visibles únicamente para el tutor del
  salón que las envió.
- El catálogo de salones —nombre, grado, profesor, ID público, cupo y cuántos
  alumnos hay dentro— SHALL ser legible por cualquier persona autenticada,
  porque el buscador del niño necesita encontrar un salón y saber si le queda
  sitio antes de pertenecer a él.

#### Scenario: Un tutor consulta los salones de otro

- **WHEN** un tutor intenta leer las pertenencias, solicitudes o invitaciones de un salón que no creó
- **THEN** no obtiene ninguna fila

#### Scenario: Un niño busca un salón por su ID público

- **WHEN** un niño autenticado busca un salón que no es el suyo
- **THEN** obtiene sus datos de catálogo y cuántos alumnos tiene, sin la lista de quiénes son, ni las solicitudes, ni las invitaciones

#### Scenario: Un niño abre el salón al que pertenece

- **WHEN** un niño inscrito consulta la lista de su salón
- **THEN** obtiene a sus compañeros con su nombre, su avatar, su XP y su racha
- **AND** no obtiene el correo, el país ni el nombre de usuario de ninguno

#### Scenario: Un niño intenta retirar a otro de un salón

- **WHEN** un niño intenta borrar la pertenencia de otro niño
- **THEN** la operación se rechaza

## ADDED Requirements

### Requirement: Las lecturas que cruzan pertenencias se conceden por vista

Cuando una lectura deba alcanzar filas de otras personas —los compañeros de un
salón, el recuento de alumnos de un salón ajeno—, el sistema SHALL concederla
mediante una vista de sólo lectura que lleve el filtro de a quién alcanza
escrito dentro, y NO SHALL ampliar para ello las políticas de las tablas
implicadas.

El motivo es que una política que consulta la tabla que protege vuelve a
evaluarse a sí misma, y esa recursión aparece en la escritura antes que en la
lectura: es lo que dejó a los niños sin poder solicitar entrar a un salón hasta
la migración 0014.

Cada vista SHALL exponer únicamente las columnas que la interfaz necesita, SHALL
quedar revocada para el rol anónimo y concedida al rol autenticado.

#### Scenario: Se concede el acceso a los compañeros

- **WHEN** se habilita que un niño vea la lista de su salón
- **THEN** se hace con una vista y las políticas de `class_memberships` no cambian

#### Scenario: Escribir sigue siendo posible después

- **WHEN** un niño crea una solicitud de ingreso y un tutor crea un salón, con las vistas ya en su sitio
- **THEN** ambas escrituras se registran sin recursión de políticas

#### Scenario: Una consulta sin sesión

- **WHEN** se consultan esas vistas con la clave anónima
- **THEN** la operación se rechaza por falta de permiso

### Requirement: El catálogo revela cuántos alumnos hay, nunca quiénes

El recuento de alumnos que acompaña a cada salón del catálogo SHALL ser un
número agregado. Consultar el catálogo NO SHALL revelar la identidad de los
alumnos de un salón al que no se pertenece ni se tutela.

#### Scenario: Un niño mira un salón ajeno lleno

- **WHEN** consulta un salón con todos sus cupos ocupados
- **THEN** ve que no quedan cupos libres
- **AND** no obtiene el nombre ni el identificador de ninguno de sus alumnos
