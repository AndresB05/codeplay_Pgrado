## ADDED Requirements

### Requirement: Rol almacenado en el perfil

El sistema SHALL guardar en el perfil el rol con el que se registró la persona,
con los valores `child` o `tutor` y `child` por defecto. El rol SHALL residir en
la base de datos y no únicamente en la sesión del navegador, de modo que las
decisiones que dependen de él puedan verificarse en el servidor.

#### Scenario: Se consulta el perfil propio

- **WHEN** una persona autenticada lee su perfil
- **THEN** obtiene su rol junto al resto de campos del perfil

#### Scenario: Un perfil se crea sin rol declarado

- **WHEN** se da de alta un usuario sin indicar rol
- **THEN** su perfil queda con el rol `child`

#### Scenario: Se intenta guardar un rol desconocido

- **WHEN** se intenta escribir en el perfil un rol distinto de `child` o `tutor`
- **THEN** la base de datos rechaza la escritura

## MODIFIED Requirements

### Requirement: Perfil creado automáticamente al registrarse

El sistema SHALL crear la fila de perfil correspondiente en cuanto se da de alta
un usuario, sin requerir una segunda llamada desde el cliente. El perfil creado
SHALL recoger los datos declarados en el registro, incluido el rol.

#### Scenario: Alta de un usuario nuevo

- **WHEN** se crea el usuario en la capa de autenticación
- **THEN** un disparador crea su perfil asociado

#### Scenario: Alta de un usuario que declara su rol

- **WHEN** se crea el usuario indicando el rol `tutor` en los datos del registro
- **THEN** su perfil queda con el rol `tutor` sin ninguna llamada adicional desde el cliente
