## MODIFIED Requirements

### Requirement: Los salones son los de la sesión autenticada

El sistema SHALL identificar al niño y al tutor por el usuario autenticado de la
sesión, y NO SHALL usar ninguna identidad fija de relleno. Sin sesión el
contexto SHALL quedar vacío, sin salones y sin pertenencia, en lugar de mostrar
datos de ejemplo.

Lo que decide si el estado se vuelve a cargar SHALL ser **quién** está dentro,
no cuántas veces lo diga la capa de sesión. Un evento de sesión que no cambia la
identidad del usuario —un refresco de token, una reautenticación de la misma
persona— NO SHALL provocar una recarga del estado del salón.

Recargar de más no es sólo trabajo desperdiciado: la pantalla del tutor se
sustituye por un indicador de carga mientras el estado llega, así que una
recarga innecesaria se lleva por delante cualquier cosa que se tuviera a medias
en pantalla.

#### Scenario: Entra un tutor

- **WHEN** el tutor de la sesión abre sus salones
- **THEN** ve únicamente los salones que él creó

#### Scenario: Entra un niño

- **WHEN** el niño de la sesión abre el módulo de salón
- **THEN** su situación es la que consta en la base de datos para su propio usuario

#### Scenario: No hay sesión

- **WHEN** no hay usuario autenticado
- **THEN** el contexto no expone ningún salón ni ninguna pertenencia

#### Scenario: La sesión se renueva sin cambiar de usuario

- **WHEN** llega un evento de sesión que mantiene al mismo usuario
- **THEN** el estado del salón no se vuelve a cargar
- **AND** lo que hubiera en pantalla sigue donde estaba

#### Scenario: Cambia quién está dentro

- **WHEN** la sesión pasa a otro usuario, o deja de haber usuario
- **THEN** el estado del salón se vuelve a cargar para la identidad nueva
