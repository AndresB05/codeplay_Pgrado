## MODIFIED Requirements

### Requirement: Bandeja de solicitudes de ingreso

El sistema SHALL mostrar al tutor las solicitudes pendientes de su salón y SHALL
permitirle aceptarlas o rechazarlas.

Una solicitud que llega mientras el tutor tiene el panel abierto SHALL aparecer
en la bandeja **sin que él recargue ni cambie de pantalla**. La aparición NO
SHALL costarle lo que tuviera a medias: el panel no se sustituye por un
indicador de carga, así que no se pierde el desplazamiento, ni un diálogo
abierto, ni lo escrito en un formulario.

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

#### Scenario: Entra una solicitud con el panel abierto

- **WHEN** un `child` pide entrar a un salón del tutor mientras éste tiene el panel abierto
- **THEN** la solicitud aparece en la bandeja sin recargar
- **AND** el panel no se sustituye por un indicador de carga mientras llega

#### Scenario: Entra una solicitud en el salón de otro tutor

- **WHEN** un `child` pide entrar a un salón que no es de este tutor
- **THEN** su bandeja no cambia
