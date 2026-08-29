## ADDED Requirements

### Requirement: El nombre de usuario derivado del correo nunca impide el alta

El sistema SHALL derivar el nombre de usuario del correo cuando el registro no
declare uno, y SHALL dejarlo **vacío** —no asignado— siempre que el valor
derivado no cumpla el formato exigido a la columna, en lugar de rechazar el alta.

El formato exigido no se relaja: la restricción que obliga a entre 3 y 30
caracteres en minúscula, dígitos o guion bajo SHALL seguir vigente tal cual. Es
la derivación la que cede, porque el nombre de usuario es un accesorio del perfil
y la cuenta es lo que la persona vino a crear.

La cadena vacía, el nombre demasiado corto, el demasiado largo y el ya ocupado
SHALL tratarse todos igual: perfil creado, nombre de usuario sin asignar.

#### Scenario: El correo deja menos de tres caracteres útiles

- **WHEN** se da de alta una cuenta cuyo correo aporta menos de 3 caracteres válidos antes de la arroba
- **THEN** el alta termina bien y el perfil queda creado
- **AND** el perfil queda sin nombre de usuario asignado

#### Scenario: El correo deja más de treinta caracteres útiles

- **WHEN** se da de alta una cuenta cuyo correo aporta más de 30 caracteres válidos antes de la arroba
- **THEN** el alta termina bien y el perfil queda creado
- **AND** el perfil queda sin nombre de usuario asignado

#### Scenario: El correo deja un nombre de usuario válido

- **WHEN** se da de alta una cuenta cuyo correo aporta entre 3 y 30 caracteres válidos antes de la arroba, y ese nombre está libre
- **THEN** el perfil queda con ese nombre de usuario asignado

#### Scenario: El nombre derivado ya está ocupado

- **WHEN** el nombre derivado cumple el formato pero ya lo tiene otro perfil
- **THEN** el alta termina bien y el perfil queda sin nombre de usuario asignado
