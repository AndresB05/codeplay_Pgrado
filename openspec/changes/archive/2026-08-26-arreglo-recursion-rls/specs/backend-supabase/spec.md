## MODIFIED Requirements

### Requirement: El tutor ve el nombre de los niños de su salón

El sistema SHALL permitir a un tutor leer el perfil de los niños que pertenecen
a sus salones y de los que tienen una solicitud pendiente en ellos, para poder
mostrarlos por su nombre en la lista del salón y en la bandeja de solicitudes.

Ese acceso SHALL limitarse a esos niños: un tutor NO SHALL poder leer el perfil
de una persona sin relación con sus salones.

Conceder ese acceso NO SHALL interferir con ninguna otra operación. En
particular, NO SHALL impedir escribir en las tablas que ese acceso consulta para
decidir a quién alcanza.

#### Scenario: El tutor abre la lista de su salón

- **WHEN** el tutor consulta los perfiles de los niños inscritos en su salón
- **THEN** obtiene sus datos de perfil

#### Scenario: El tutor consulta un perfil ajeno a sus salones

- **WHEN** el tutor intenta leer el perfil de un niño que no pertenece a ninguno de sus salones ni ha solicitado entrar
- **THEN** no obtiene ninguna fila

#### Scenario: Un niño solicita entrar mientras ese acceso está concedido

- **WHEN** un niño autenticado crea una solicitud de ingreso
- **THEN** la solicitud se registra
- **AND** la comprobación de a qué perfiles alcanza el tutor no bloquea esa escritura

#### Scenario: El tutor crea un salón mientras ese acceso está concedido

- **WHEN** un tutor autenticado crea un salón
- **THEN** el salón se registra sin que la comprobación de perfiles interfiera
