## REMOVED Requirements

### Requirement: Registro de invitaciones por correo

**Reason**: Guardaba la dirección de correo de un tercero —alguien sin cuenta,
que no ha autorizado nada y que en esta plataforma puede ser un menor— para un
envío que nunca ocurre: el correo real es el paso 19 y no hay servicio
contratado. Nada borraba esas filas: la aplicación sólo insertaba, y `expires_at`
y `status` no los evaluaba nadie. Un dato personal conservado sin plazo para una
finalidad que no se ejecuta no se administra mejor: se deja de recoger.

**Migration**: No hay nada que migrar hacia otra parte. Las direcciones ya
almacenadas desaparecen al eliminarse la columna, que es el resultado buscado.
El tutor que quiera sumar alumnos usa el ID público del salón, que es el camino
que ya funciona y que el requisito nuevo describe. Cuando el paso 19 traiga el
envío real y el enlace canjeable, la invitación vuelve a existir con la forma que
ese paso decida —la tabla conserva `token`, `status` y `expires_at`—, y con la
purga por caducidad desde el primer día.

## ADDED Requirements

### Requirement: El tutor suma alumnos compartiendo el ID público

El sistema SHALL ofrecer al tutor, en su pantalla de salón, la vía real por la
que hoy entra un niño: **compartirle el ID público del salón** para que lo
busque y solicite ingreso, que el tutor acepta desde su bandeja de solicitudes.

El sistema NO SHALL pedir ni almacenar la dirección de correo de un tercero
mientras no exista el envío real, porque esa dirección pertenece a alguien que no
tiene cuenta, no ha autorizado nada y puede ser un menor.

El sistema NO SHALL ofrecer un formulario que prometa un envío que no se produce.

#### Scenario: El tutor quiere sumar un alumno

- **WHEN** el tutor abre la sección para sumar alumnos a su salón
- **THEN** se le indica el ID público del salón y que el niño puede buscarlo y solicitar ingreso
- **AND** no se le pide ninguna dirección de correo

#### Scenario: No queda rastro de terceros

- **WHEN** el tutor usa esa sección
- **THEN** no se almacena ninguna dirección de correo de nadie

#### Scenario: La solicitud llega por el camino que existe

- **WHEN** el niño busca el salón por su ID público y solicita entrar
- **THEN** la solicitud aparece en la bandeja del tutor, que puede aceptarla o rechazarla
