## MODIFIED Requirements

### Requirement: Guarda de las rutas privadas

El sistema SHALL impedir el acceso a las rutas privadas a quien no tenga sesión,
y SHALL redirigir a `/login`.

Una ruta que pertenece a un rol SHALL exigir un rol activo. Cuando no haya
ninguno, el sistema SHALL redirigir a `/login` en lugar de mostrar el contenido:
la ausencia de rol NO SHALL tratarse como si cualquier rol sirviera.

El indicador de carga que sustituye al contenido SHALL reservarse a la
**resolución inicial** de la sesión, cuando todavía no se sabe quién entra. Un
evento posterior que NO cambia la identidad del usuario —un refresco de token,
una reautenticación de la misma persona— NO SHALL sustituir la pantalla por ese
indicador: hacerlo desmonta lo que haya en curso y se lleva por delante
formularios a medias y mensajes recién mostrados.

#### Scenario: Visitante sin sesión entra a una ruta privada

- **WHEN** no hay sesión autenticada ni sesión de invitado
- **THEN** se redirige a `/login`

#### Scenario: La sesión todavía se está resolviendo

- **WHEN** la comprobación de sesión está en curso
- **THEN** se muestra un indicador de carga en lugar del contenido o de una redirección

#### Scenario: Quien tiene sesión recarga la página

- **WHEN** alguien con sesión abierta vuelve a cargar una ruta privada
- **THEN** ve el indicador de carga hasta que la sesión se resuelve
- **AND** no llega a verse la pantalla de acceso

#### Scenario: La sesión se renueva sin cambiar de usuario

- **WHEN** llega un evento de sesión que mantiene al mismo usuario
- **THEN** el contenido de la pantalla permanece montado
- **AND** no aparece el indicador de carga

#### Scenario: Hay sesión pero no hay rol activo

- **WHEN** la ruta solicitada exige un rol y el rol activo es nulo
- **THEN** se redirige a `/login` en lugar de mostrar el panel

## ADDED Requirements

### Requirement: Cambiar la contraseña desde la cuenta

Quien tenga la sesión abierta SHALL poder cambiar su contraseña desde su
pantalla de Ajustes, sin correo de por medio.

El formulario SHALL pedir **la contraseña actual** además de la nueva dos veces,
y el sistema SHALL verificar la actual **contra el servidor** antes de cambiar
nada. La sesión abierta NO SHALL bastar como prueba de identidad: en un
computador de aula compartido, quien se siente ante la sesión de otro podría
cambiarle la contraseña y dejarlo fuera de su propia cuenta.

Cuando la contraseña actual sea incorrecta, el sistema NO SHALL cambiar nada y
SHALL dejar el motivo visible. La sesión en curso NO SHALL verse perturbada por
ese intento fallido.

El formulario NO SHALL enviar nada al servidor mientras las dos nuevas no
coincidan o la nueva no alcance el mínimo de longitud. El resultado —salió o no
salió— SHALL verse en la misma pantalla desde la que se pulsó.

Después de un cambio con éxito, la contraseña anterior NO SHALL servir para
iniciar sesión, y la nueva SHALL servir.

#### Scenario: Se cambia la contraseña con éxito

- **WHEN** se envía la contraseña actual correcta y una nueva válida, repetida igual
- **THEN** la contraseña queda cambiada
- **AND** se confirma en la pantalla de Ajustes

#### Scenario: La contraseña actual es incorrecta

- **WHEN** se envía una contraseña actual que no es la de la cuenta
- **THEN** la contraseña **no** cambia
- **AND** el motivo queda visible en la pantalla de Ajustes
- **AND** la sesión en curso sigue abierta
- **AND** la contraseña anterior sigue sirviendo para iniciar sesión

#### Scenario: Se comprueba el efecto del cambio

- **WHEN** se cierra la sesión después de cambiar la contraseña
- **THEN** iniciar sesión con la contraseña anterior es rechazado
- **AND** iniciar sesión con la contraseña nueva es aceptado

#### Scenario: Las dos contraseñas no coinciden

- **WHEN** la contraseña nueva y su repetición son distintas
- **THEN** no se envía nada al servidor
- **AND** se explica en la pantalla que no coinciden

#### Scenario: La contraseña nueva es demasiado corta

- **WHEN** la contraseña nueva no alcanza el mínimo de longitud
- **THEN** no se envía nada al servidor
- **AND** se indica cuál es el mínimo

#### Scenario: El servidor rechaza el cambio

- **WHEN** el servidor rechaza la contraseña nueva
- **THEN** la contraseña no cambia
- **AND** el motivo del rechazo queda visible en la pantalla de Ajustes

#### Scenario: Las dos pantallas de Ajustes ofrecen lo mismo

- **WHEN** se cambia la contraseña desde Ajustes, siendo `child` o siendo `tutor`
- **THEN** el comportamiento es el mismo en las dos

### Requirement: Recuperar una contraseña olvidada

Quien no pueda entrar SHALL poder pedir la recuperación desde una pantalla
pública, indicando su correo. El sistema SHALL enviar a esa dirección un enlace
que lleve a la pantalla de contraseña nueva.

El aviso que se muestra al pedirla NO SHALL revelar si esa dirección tiene
cuenta: la respuesta SHALL ser la misma exista o no, para que la pantalla no
sirva de comprobador de cuentas dadas de alta.

Al abrir el enlace, el sistema SHALL permitir fijar una contraseña nueva
pidiéndola dos veces, con las mismas comprobaciones de longitud e igualdad que
el cambio desde la cuenta.

Esa pantalla NO SHALL pedir la contraseña actual: quien llega a ella es
exactamente quien no la sabe.

#### Scenario: Se pide la recuperación

- **WHEN** se envía un correo electrónico desde la pantalla de recuperación
- **THEN** se solicita al servidor el envío del enlace, indicando como destino la pantalla de contraseña nueva
- **AND** se avisa de que si esa dirección tiene cuenta le llegará un correo

#### Scenario: La dirección no tiene cuenta

- **WHEN** el correo enviado no corresponde a ninguna cuenta
- **THEN** el aviso mostrado es el mismo que cuando sí la tiene

#### Scenario: Se abre el enlace del correo

- **WHEN** se abre el enlace recibido
- **THEN** se muestra la pantalla de contraseña nueva

#### Scenario: Se fija la contraseña nueva

- **WHEN** se envía una contraseña nueva válida y repetida igual desde esa pantalla
- **THEN** la contraseña queda cambiada
- **AND** se puede iniciar sesión con ella

#### Scenario: La pantalla del enlace no pide la contraseña actual

- **WHEN** se muestra la pantalla de contraseña nueva a la que lleva el enlace
- **THEN** sólo se piden la contraseña nueva y su repetición

#### Scenario: El acceso lleva a la recuperación

- **WHEN** se pulsa «¿Olvidaste tu contraseña?» en la pantalla de acceso
- **THEN** se llega a la pantalla de recuperación

### Requirement: La pantalla de contraseña nueva exige sesión, no rol

La pantalla de contraseña nueva SHALL exigir una sesión, porque el enlace del
correo abre una, y NO SHALL exigir ningún rol concreto.

NO SHALL apartar a quien llegue con esa sesión hacia el panel de su rol: hacerlo
haría que la pantalla no se viera nunca, que es lo que ocurriría si se protegiera
como una ruta pública.

Quien llegue a esa dirección **sin sesión de ninguna clase** SHALL ser redirigido
a `/login`, porque sin el enlace no hay nada que fijar.

#### Scenario: Se llega con la sesión del enlace

- **WHEN** se abre la pantalla de contraseña nueva con la sesión que creó el enlace del correo
- **THEN** se muestra la pantalla
- **AND** no se redirige al panel de ningún rol

#### Scenario: Se llega sin sesión

- **WHEN** se abre la dirección de la pantalla de contraseña nueva sin ninguna sesión
- **THEN** se redirige a `/login`

#### Scenario: La pantalla de recuperación es para quien no ha entrado

- **WHEN** quien ya tiene sesión y rol abre la pantalla de recuperación
- **THEN** se le lleva al panel de su rol, como en cualquier otra ruta pública
