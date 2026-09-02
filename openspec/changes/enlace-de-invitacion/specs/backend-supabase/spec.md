## ADDED Requirements

### Requirement: El ingreso a un salón exige el consentimiento de las dos partes

El sistema SHALL crear la pertenencia de un niño a un salón únicamente cuando
consten **las dos voluntades**: la del tutor, que admite, y la del niño, que
entra. Un tutor NO SHALL poder inscribir a un niño que no ha hecho nada, y un
niño NO SHALL poder inscribirse a sí mismo en un salón cualquiera.

Ese consentimiento doble SHALL poder constar por **dos caminos, y sólo dos**:

1. **Una solicitud del niño que el tutor acepta.** El niño pide, el tutor
   aprueba, y la pertenencia nace de esa aprobación.
2. **Una invitación que el tutor genera y el niño canjea.** El tutor consintió al
   generarla, así que el canje NO SHALL crear una solicitud que él tenga que
   aprobar otra vez: sería aprobar dos veces lo mismo.

Cualquiera de los dos caminos SHALL registrar la pertenencia y cerrar lo que la
originó —la solicitud o la invitación— en **una sola operación indivisible**: NO
SHALL quedar un estado en el que el niño es miembro y su solicitud sigue
pendiente, ni uno en el que la invitación queda consumida y el niño fuera.

Sólo el tutor del salón SHALL poder aceptar o rechazar sus solicitudes, y sólo él
SHALL poder generar invitaciones a sus salones.

#### Scenario: El tutor acepta una solicitud

- **WHEN** el tutor de un salón acepta una solicitud pendiente de ese salón
- **THEN** el niño queda inscrito y la solicitud queda marcada como aceptada

#### Scenario: Un tutor intenta inscribir a un niño sin solicitud ni invitación

- **WHEN** se intenta crear una pertenencia sin una solicitud pendiente ni una invitación canjeada que la respalde
- **THEN** la operación se rechaza

#### Scenario: Alguien que no es el tutor intenta aceptar

- **WHEN** una persona que no es el tutor del salón intenta aceptar una solicitud suya
- **THEN** la operación se rechaza

#### Scenario: El tutor rechaza una solicitud

- **WHEN** el tutor rechaza una solicitud pendiente
- **THEN** la solicitud queda marcada como rechazada y el niño no queda inscrito

#### Scenario: El tutor intenta marcar una solicitud como aceptada sin pasar por la aceptación

- **WHEN** el tutor intenta escribir directamente el estado `accepted` sobre una solicitud
- **THEN** la operación se rechaza, porque saltarse la aceptación dejaría la solicitud aceptada y al niño sin pertenencia

#### Scenario: Un niño canjea una invitación de un salón

- **WHEN** un niño sin salón canjea una invitación válida
- **THEN** queda inscrito y la invitación queda marcada como aceptada, en la misma operación
- **AND** no se crea ninguna solicitud

#### Scenario: Alguien intenta generar una invitación a un salón ajeno

- **WHEN** un tutor intenta generar una invitación a un salón que no es suyo
- **THEN** la operación se rechaza

### Requirement: El canje de una invitación lo ejecuta el servidor

El sistema SHALL resolver el canje de una invitación en una operación del
servidor, y NO SHALL permitir que el cliente lo componga a base de escrituras
sueltas.

No es una preferencia de estilo, sino lo único posible con los permisos que la
tabla de invitaciones tiene y va a seguir teniendo: quien posee el token **no
puede leer la fila de su invitación** —las lecturas están reservadas al tutor del
salón— y **nadie puede modificarla desde el cliente**, porque no existe permiso
de modificación sobre esa tabla para ninguna sesión. Esos permisos NO SHALL
ampliarse para hacer sitio al canje.

La operación de canje SHALL comprobar, antes de escribir nada:

- que quien canjea tiene sesión y rol `child`;
- que la invitación existe, no se ha canjeado y no ha caducado;
- que el salón existe y **todavía tiene cupo**, contando los alumnos después de
  bloquear la fila del salón, y no antes: sin ese bloqueo, dos canjes simultáneos
  leen el mismo recuento, los dos lo encuentran por debajo del cupo y los dos
  inscriben;
- que quien canjea no pertenece ya a un salón.

Si cualquiera de esas comprobaciones falla, la operación SHALL abortar **sin
dejar rastro**: ni pertenencia, ni invitación consumida, ni solicitud tocada.

El motivo del rechazo SHALL distinguir el enlace inválido, el ya usado y el
caducado, para que quien lo abre sepa cuál de las tres cosas le pasó.

El sistema SHALL ofrecer además una consulta que, con el token en la mano,
devuelva a qué salón invita y si sigue sirviendo, **sin consumirlo**. Esa consulta
SHALL exigir sesión: sin ella, un salón no revela nada.

#### Scenario: Quien tiene el token no puede leer su invitación

- **WHEN** una sesión que no es la del tutor del salón intenta leer la fila de una invitación
- **THEN** no obtiene ninguna fila

#### Scenario: Nadie puede modificar una invitación desde el cliente

- **WHEN** cualquier sesión intenta modificar directamente una invitación
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Un canje sobre un salón lleno no consume nada

- **WHEN** se canjea una invitación de un salón que ya alcanzó su cupo
- **THEN** la operación se rechaza, no se crea pertenencia y la invitación sigue sin canjear

#### Scenario: Dos canjes simultáneos sobre el último cupo

- **WHEN** dos invitaciones distintas del mismo salón se canjean a la vez y sólo queda un cupo
- **THEN** sólo una de las dos inscribe, porque el recuento se hace con la fila del salón bloqueada

#### Scenario: Un canje de quien ya tiene salón

- **WHEN** canjea una invitación alguien que ya pertenece a un salón
- **THEN** la operación se rechaza y la invitación sigue sin canjear

#### Scenario: Un canje desde una sesión con rol tutor

- **WHEN** una sesión con rol `tutor` canjea una invitación
- **THEN** la operación se rechaza

#### Scenario: Los tres rechazos se distinguen

- **WHEN** se canjea un token inexistente, uno ya canjeado y uno caducado
- **THEN** cada caso responde con un motivo distinto de los otros dos

#### Scenario: Consultar el destino sin gastar el enlace

- **WHEN** una sesión consulta a qué salón invita un token válido
- **THEN** recibe el salón y la invitación sigue sin canjear

#### Scenario: Sin sesión no se consulta nada

- **WHEN** se intenta consultar el destino de un token sin sesión iniciada
- **THEN** la consulta se rechaza

## MODIFIED Requirements

### Requirement: El cupo del salón se respeta al aceptar

El sistema SHALL rechazar la entrada de un niño a un salón que ya tiene tantos
alumnos como su cupo, **por cualquiera de los dos caminos de ingreso**: al
aceptar una solicitud y al canjear una invitación. La comprobación SHALL hacerla
la base de datos al escribir, no la interfaz antes de pedirlo.

El recuento de alumnos SHALL hacerse con la fila del salón bloqueada, de modo que
dos ingresos simultáneos no puedan pasarse del cupo leyendo los dos el mismo
número.

**Sobre el nombre de este requisito, que se queda como está.** Dice «al aceptar»
y el cuerpo cubre los dos caminos, así que el título se queda corto. NO es que
«aceptar» estire hasta «canjear»: en el vocabulario de este proyecto aceptar es
lo que hace el tutor con una solicitud, y nada más. Se conserva porque
ensancharlo obliga a retirar y reponer el requisito —el único modo seguro de
renombrar uno con estas herramientas—, y este cambio ya paga esa operación una
vez, en «El ingreso a un salón…», donde lo que había dejado de ser cierto era el
**contenido**. Aquí sólo es la etiqueta, y el contenido de arriba manda sobre
ella. Quien vaya a ensanchar el cupo alguna vez, que ensanche el título de paso.

#### Scenario: Se acepta una solicitud en un salón lleno

- **WHEN** el tutor acepta una solicitud y el salón ya alcanzó su cupo
- **THEN** la operación se rechaza y el niño no queda inscrito

#### Scenario: Se canjea una invitación de un salón lleno

- **WHEN** un niño canjea una invitación y el salón ya alcanzó su cupo
- **THEN** la operación se rechaza y el niño no queda inscrito

### Requirement: Una solicitud resuelta es inmutable, y volver a pedir entrar es una solicitud nueva

El sistema SHALL conservar las solicitudes ya resueltas —aceptadas o
rechazadas— y NO SHALL permitir al niño borrarlas ni modificarlas. El niño SHALL
poder cancelar únicamente una solicitud suya que siga pendiente.

Un niño con una solicitud rechazada SHALL poder volver a solicitar ingreso al
mismo salón, y esa petición SHALL registrarse como una solicitud nueva sin
borrar ni alterar el rechazo anterior. Lo mismo SHALL valer para un niño que
abandonó un salón y quiere volver a él.

Canjear una invitación SHALL cancelar la solicitud **pendiente** de quien canjea,
si la tiene, en la misma operación que crea la pertenencia. Es la misma
cancelación que el niño podía hacer él mismo, y ninguna otra: el canje NO SHALL
marcar esa solicitud como aceptada ni como rechazada, porque ningún tutor la
resolvió y escribirlo sería registrar algo que no ocurrió.

Ninguna solicitud ya resuelta SHALL verse afectada por un canje.

#### Scenario: Un niño cancela su solicitud pendiente

- **WHEN** un niño con una solicitud pendiente la cancela
- **THEN** la solicitud desaparece y el niño puede solicitar ingreso a cualquier salón

#### Scenario: Un niño intenta borrar su rechazo

- **WHEN** un niño intenta borrar o modificar una solicitud suya ya rechazada
- **THEN** la operación se rechaza

#### Scenario: Un niño rechazado vuelve a pedir entrar al mismo salón

- **WHEN** un niño cuya solicitud fue rechazada solicita de nuevo el ingreso a ese mismo salón
- **THEN** queda registrada una solicitud pendiente nueva y el rechazo anterior sigue guardado

#### Scenario: Un niño vuelve al salón que abandonó

- **WHEN** un niño que se dio de baja de un salón solicita entrar otra vez a ese mismo salón
- **THEN** la solicitud se registra como pendiente

#### Scenario: Un canje cancela la solicitud pendiente

- **WHEN** un niño con una solicitud pendiente canjea una invitación
- **THEN** queda inscrito y esa solicitud pendiente desaparece, sin quedar marcada como aceptada ni como rechazada

#### Scenario: Un canje no toca el historial resuelto

- **WHEN** un niño con solicitudes ya aceptadas o rechazadas canjea una invitación
- **THEN** esas solicitudes siguen guardadas exactamente igual

## REMOVED Requirements

### Requirement: El ingreso a un salón pasa siempre por una solicitud aceptada

**Reason**: Su primera frase —«el sistema SHALL crear la pertenencia de un niño a
un salón **únicamente** al aceptarse una solicitud suya pendiente»— deja de ser
cierta en cuanto existe el enlace de invitación, que es un segundo camino
legítimo hacia la misma pertenencia. Y el nombre del requisito afirma ese
«siempre», así que conservarlo con el cuerpo corregido dejaría en el spec
principal un título que le miente a quien lo busque.

**Migration**: Lo sustituye, en este mismo cambio, «El ingreso a un salón exige
el consentimiento de las dos partes», que **conserva íntegras las cinco garantías
del requisito retirado** —nadie inscribe a quien no ha pedido entrar, nadie se
inscribe a sí mismo, la pertenencia y la solicitud se escriben sin estado
intermedio, sólo el tutor del salón resuelve sus solicitudes, y el estado
`accepted` no se escribe por fuera—. Cuatro de sus cinco escenarios pasan
palabra por palabra; el quinto, «Un tutor intenta inscribir a un niño sin
solicitud», se ensancha a «…sin solicitud ni invitación» para que siga cerrando
lo mismo ahora que hay dos respaldos posibles. No se pierde ninguna condición:
cambia la lista de caminos admitidos, de uno a dos.
