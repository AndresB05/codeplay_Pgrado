# salones-alumno Specification

## Purpose

Permitir que un niño entre a su salón por los **dos** caminos que existen: pedir
entrar y esperar la aprobación del tutor, o **canjear una invitación que el tutor
ya aprobó al generarla**, que entra sin espera. Cubre los tres estados posibles
del alumno respecto a los salones y las transiciones entre ellos.

Los estados siguen siendo tres —sin salón, en espera e inscrito—, pero desde el
enlace canjeable hay **dos transiciones que se saltan la espera**: el canje lleva
de «sin salón» a «inscrito» directamente, y también de «en espera» a «inscrito»,
cancelando de paso la solicitud que ya no significa nada.

## Requirements

### Requirement: Estados de pertenencia del alumno

El sistema SHALL mantener para el niño de la sesión uno de tres estados —sin
salón, en espera o inscrito— y SHALL mostrar en cada uno la pantalla que le
corresponde.

#### Scenario: El alumno no tiene salón

- **WHEN** el estado de pertenencia es `none`
- **THEN** se muestra el buscador global de salones

#### Scenario: El alumno espera respuesta

- **WHEN** el estado de pertenencia es `pending`
- **THEN** se muestra la pantalla de espera con la opción de cancelar la solicitud

#### Scenario: El alumno pertenece a un salón

- **WHEN** el estado de pertenencia es `member`
- **THEN** se muestran su salón, sus compañeros y su seguimiento

### Requirement: Un alumno pertenece como máximo a un salón
El sistema NO SHALL permitir que un alumno esté inscrito o en espera en más de
un salón a la vez. Para solicitar entrada en otro salón, antes SHALL quedar sin
salón.

Canjear un enlace de invitación NO SHALL ser una excepción a esa regla: quien ya
pertenece a un salón NO SHALL poder canjear un enlace de otro, ni del suyo.

Si quien canjea tiene una **solicitud pendiente** —en el salón del enlace o en
cualquier otro—, esa solicitud SHALL cancelarse al canjear, en la misma operación
que crea la pertenencia. Es exactamente la cancelación que el niño podía hacer él
mismo, y ocurre porque la alternativa es dejarlo dentro de un salón con una
solicitud viva en otro, que es media violación de este invariante.

Esa cancelación NO SHALL alterar ninguna solicitud ya resuelta: el historial de
aceptaciones y rechazos se conserva intacto.

Cuando el canje se rechace por pertenencia previa, el motivo que se le muestre
SHALL distinguir **si el salón del enlace es el suyo o es otro**. El servidor
responde lo mismo en los dos casos —ya pertenece a un salón—, pero decirle «sal
de tu salón antes de entrar en otro» a quien abre un enlace del salón en el que
ya está es una instrucción falsa: no tiene nada que hacer, ya está dentro.

#### Scenario: El alumno ya está inscrito

- **WHEN** el alumno pertenece a un salón e intenta solicitar entrada en otro
- **THEN** no se crea la nueva solicitud

#### Scenario: El alumno ya inscrito canjea un enlace de otro salón

- **WHEN** un alumno que ya pertenece a un salón canjea un enlace de un salón distinto
- **THEN** el canje se rechaza y se le dice que primero tiene que salir de su salón
- **AND** el enlace no se consume

#### Scenario: El alumno abre un enlace de su propio salón

- **WHEN** un alumno abre un enlace del salón al que ya pertenece
- **THEN** se le dice que ya está en ese salón, y NO que salga de él para entrar en otro
- **AND** el enlace no se consume

#### Scenario: El alumno canjea con una solicitud pendiente en otro salón

- **WHEN** un alumno en estado `pending` canjea un enlace de un salón distinto
- **THEN** queda inscrito en el salón del enlace
- **AND** su solicitud pendiente desaparece de la bandeja del tutor al que se la había enviado

#### Scenario: El alumno canjea con una solicitud pendiente en el mismo salón

- **WHEN** un alumno que había solicitado entrar a un salón canjea un enlace de ese mismo salón
- **THEN** queda inscrito una sola vez y su solicitud pendiente desaparece

#### Scenario: El historial resuelto no se toca

- **WHEN** un alumno con solicitudes ya aceptadas o rechazadas canjea un enlace
- **THEN** esas solicitudes siguen guardadas tal y como estaban

### Requirement: Búsqueda de salones

El sistema SHALL permitir buscar salones por nombre con coincidencia parcial y
por identificador público exacto.

#### Scenario: Búsqueda por nombre parcial

- **WHEN** el alumno escribe parte del nombre de un salón
- **THEN** se listan todos los salones cuyo nombre contiene ese texto

#### Scenario: Búsqueda por identificador exacto

- **WHEN** el alumno escribe un identificador público completo con el formato `CP-XXXX`
- **THEN** se muestra únicamente ese salón

### Requirement: Solicitud de ingreso

El sistema SHALL permitir al alumno solicitar ingreso a un salón con cupos
libres, dejando la decisión en manos del tutor.

#### Scenario: El salón tiene cupos

- **WHEN** el alumno solicita ingreso
- **THEN** se crea una solicitud en ese salón
- **AND** su estado de pertenencia pasa a `pending`
- **AND** la solicitud aparece en la bandeja del tutor de ese salón

#### Scenario: El salón está lleno

- **WHEN** el salón no tiene cupos libres
- **THEN** la acción de solicitar ingreso aparece bloqueada

### Requirement: Cancelación de la propia solicitud

El sistema SHALL permitir al alumno retirar una solicitud que todavía no se ha
resuelto.

#### Scenario: El alumno cancela mientras espera

- **WHEN** el alumno cancela su solicitud desde la pantalla de espera
- **THEN** la solicitud desaparece de la bandeja del tutor
- **AND** su estado de pertenencia vuelve a `none`

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

### Requirement: Ingreso directo al canjear un enlace de invitación
El sistema SHALL permitir que un `child` sin salón entre a un salón abriendo un
enlace de invitación válido, **sin pasar por el estado en espera**: su pertenencia
pasa de `none` a `member` sin detenerse en `pending`.

El canje SHALL exigir un acto de quien abre el enlace, y NO SHALL ocurrir por el
solo hecho de cargar la dirección: un enlace sirve una vez, y gastarlo por una
visita equivocada, una previsualización o un enlace reenviado por error no tendría
vuelta atrás.

Antes de canjear, el sistema SHALL decirle a quien abre el enlace **a qué salón
va a entrar**, para que no se meta a ciegas en un salón que no es el suyo.

Un enlace inválido, ya usado o caducado SHALL explicarse como tal, y NO SHALL
llevar a una pantalla de error genérica ni dejar a nadie a medias.

Quien canjea SHALL tener el rol `child`. Un `tutor` que abre un enlace NO SHALL
quedar inscrito, y SHALL entender por qué.

#### Scenario: Un niño sin salón canjea un enlace válido

- **WHEN** un `child` con pertenencia `none` abre un enlace válido y confirma que quiere entrar
- **THEN** su pertenencia pasa directamente a `member` en ese salón
- **AND** no llega a existir ninguna solicitud suya

#### Scenario: Se le dice a qué salón entra

- **WHEN** un niño con la sesión abierta llega a la pantalla del enlace
- **THEN** se le muestra el nombre del salón antes de que confirme

#### Scenario: Abrir el enlace no lo gasta

- **WHEN** alguien abre la pantalla del enlace y se va sin confirmar
- **THEN** el enlace sigue sirviendo

#### Scenario: Un enlace que ya no vale

- **WHEN** alguien abre un enlace inválido, ya usado o caducado
- **THEN** se le dice cuál de las tres cosas ocurre y no queda inscrito

#### Scenario: Un tutor abre un enlace

- **WHEN** una sesión con rol `tutor` abre un enlace de invitación
- **THEN** no queda inscrita y se le explica que los salones se canjean desde una cuenta de niño

### Requirement: El enlace sobrevive al registro de quien no tiene cuenta
El sistema SHALL admitir que quien abre un enlace de invitación **todavía no
tenga cuenta**, que es el caso normal: el tutor le pasa el enlace a una familia
nueva.

Quien llega sin sesión SHALL poder registrarse o entrar desde la propia pantalla
del enlace, y al terminar SHALL volver al canje **sin tener que abrir el enlace
otra vez**: la intención se conserva mientras dura el rodeo.

El registro que se le ofrezca SHALL ser directamente el de **niño**, con el tipo
de cuenta ya elegido, y NO SHALL preguntarle qué tipo de usuario es. Una
invitación es siempre para un niño —el canje rechaza a los tutores—, así que esa
pregunta no le da una opción: le da ocasión de equivocarse. Y el error no tiene
arreglo, porque el rol se fija en el primer registro y no cambia nunca: quien
eligiera «Tutor» se quedaría sin poder entrar al salón al que le acaban de
invitar, y sin ninguna pantalla que lo deshaga.

Por lo mismo, en ese registro NO SHALL ofrecerse volver a elegir el tipo de
cuenta. Quien de verdad quiera registrarse como tutor SHALL poder hacerlo por la
vía normal de registro, que sigue empezando por la elección.

Esa intención SHALL sobrevivir también al registro con Google, que saca a la
persona de la aplicación y la devuelve por otra dirección.

La intención conservada SHALL consumirse al leerla, de una sola vez. NO SHALL
quedar viva para un viaje posterior: en un computador de aula el viaje siguiente
puede ser el de otra persona, y una invitación olvidada metería al niño siguiente
en un salón ajeno.

La pantalla del enlace NO SHALL estar detrás de una guarda de sesión: una guarda
sólo sabe que no hay sesión, y al apartar a quien llega sin cuenta se llevaría por
delante el enlace, que es justo lo que esa persona traía.

#### Scenario: Alguien sin cuenta abre el enlace

- **WHEN** una persona sin sesión abre un enlace de invitación
- **THEN** la pantalla la atiende en lugar de mandarla al acceso
- **AND** se le ofrece registrarse o entrar sin perder el enlace

#### Scenario: El registro llega con el tipo de cuenta ya elegido

- **WHEN** quien abrió el enlace pulsa crear su cuenta
- **THEN** aterriza en el formulario de registro de **niño**, sin pasar por la elección de tipo de usuario
- **AND** no se le ofrece cambiar el tipo de cuenta

#### Scenario: El registro normal no cambia

- **WHEN** alguien entra al registro por la vía normal, sin venir de un enlace
- **THEN** sigue empezando por la elección entre niño y tutor

#### Scenario: Se registra con correo y contraseña

- **WHEN** esa persona completa el registro como niño desde el enlace
- **THEN** el canje ocurre al terminar el registro, sin que tenga que volver a abrir el enlace

#### Scenario: Se registra con Google

- **WHEN** esa persona se registra con Google y vuelve a la aplicación
- **THEN** el canje ocurre al volver, después de quedar fijado su rol

#### Scenario: La invitación no alcanza al siguiente

- **WHEN** una invitación conservada se consume y después otra persona se registra en el mismo navegador
- **THEN** esa segunda persona no entra a ningún salón por la invitación de la primera

#### Scenario: Quien ya tiene cuenta entra desde el enlace

- **WHEN** una persona con cuenta abre el enlace sin sesión, inicia sesión y vuelve
- **THEN** vuelve a la pantalla del enlace en lugar de a su panel
