## MODIFIED Requirements

### Requirement: El alumno sigue las decisiones del tutor

El sistema SHALL actualizar el estado del alumno cuando el tutor resuelve su
solicitud, lo expulsa o elimina el salón.

Esa actualización SHALL llegarle **sin recargar la página ni volver a entrar a la
pantalla**, mientras la tenga abierta. La pantalla del salón NO SHALL
sustituirse por un indicador de carga mientras llega el cambio: lo que cambia es
el contenido, no el hecho de estar esperando.

#### Scenario: El tutor acepta la solicitud

- **WHEN** el tutor acepta
- **THEN** el estado del alumno pasa a `member`

#### Scenario: El tutor rechaza la solicitud

- **WHEN** el tutor rechaza
- **THEN** el estado del alumno vuelve a `none`

#### Scenario: El tutor elimina el salón

- **WHEN** se elimina el salón donde el alumno estaba inscrito o en espera
- **THEN** el estado del alumno vuelve a `none` y se le muestra el buscador

#### Scenario: La decisión llega con la pantalla abierta

- **WHEN** el tutor acepta o rechaza a un alumno que tiene la pantalla de su salón abierta
- **THEN** la pantalla pasa sola al estado nuevo, sin recargar y sin indicador de carga

#### Scenario: Al alumno lo retiran del salón con la pantalla abierta

- **WHEN** el tutor lo expulsa mientras él mira la pantalla de su salón
- **THEN** su `membership` vuelve a `none` y se le muestra el buscador sin recargar

#### Scenario: Cambia un salón que no es el suyo

- **WHEN** se resuelve una solicitud o cambia la pertenencia de otro salón
- **THEN** la pantalla del alumno no cambia
