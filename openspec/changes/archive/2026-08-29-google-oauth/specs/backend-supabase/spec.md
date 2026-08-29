## MODIFIED Requirements

### Requirement: Escrituras encapsuladas en funciones seguras

El sistema SHALL canalizar las escrituras principales del cliente a través de
funciones RPC, en lugar de permitir escritura directa sobre las tablas, para
reducir la manipulación desde el navegador.

Toda función de escritura SHALL identificar a quien la llama por la sesión, y NO
SHALL aceptar como parámetro a quién afecta. Una llamada sin sesión SHALL
rechazarse con error de permiso en lugar de escribir nada.

El permiso de ejecución de esas funciones SHALL concederse **sólo** al rol
autenticado, y SHALL retirarse del rol anónimo y del público.

Cuando una de estas funciones rechace una operación, SHALL hacerlo con un código
de error **distinguible de los demás rechazos** de esa misma función, para que el
cliente pueda darle a cada uno la respuesta que le corresponde en vez de tratar
todos los fallos como el mismo.

#### Scenario: El cliente actualiza su perfil

- **WHEN** se modifica el perfil propio
- **THEN** la operación pasa por la función `update_my_profile`

#### Scenario: El cliente registra progreso o un intento de nivel

- **WHEN** se guarda progreso o el intento de resolver un nivel
- **THEN** la operación pasa por `upsert_my_progress` o `create_level_attempt`

#### Scenario: El cliente fija el rol de su perfil

- **WHEN** se fija el rol del perfil propio después del alta
- **THEN** la operación pasa por la función `set_my_role`

#### Scenario: Se llama a una función de escritura sin sesión

- **WHEN** se invoca `set_my_role` con la clave anónima y sin sesión
- **THEN** la llamada es rechazada y no se escribe nada

#### Scenario: Los rechazos de una misma función se distinguen entre sí

- **WHEN** `set_my_role` rechaza por falta de sesión, por rol desconocido, por perfil inexistente, porque el rol ya estaba declarado o porque el perfil tiene lazos de salón
- **THEN** cada uno de esos rechazos responde con un código de error distinto

### Requirement: Rol almacenado en el perfil

El sistema SHALL guardar en el perfil el rol con el que se registró la persona,
con los valores `child` o `tutor` y `child` por defecto. El rol SHALL residir en
la base de datos y no únicamente en la sesión del navegador, de modo que las
decisiones que dependen de él puedan verificarse en el servidor.

El perfil SHALL registrar además **si ese rol se declaró al darse de alta**. Un
alta que trae un rol válido en sus metadatos SHALL quedar marcada como
declarada; un alta que no puede traerlos —la de un proveedor externo— SHALL
quedar marcada como **no declarada**, y también SHALL quedar así un alta cuyo rol
llegue manipulado, porque quien envió un valor inválido no eligió.

El rol SHALL poder fijarse **después** del alta **sólo mientras se cumplan las
dos condiciones**: que no se haya declarado, y que el perfil **no tenga lazos de
salón** —ninguna membresía como alumno, ninguna solicitud pendiente y ningún
salón propio—. Si falta cualquiera de las dos, la función SHALL rechazar la
llamada **sin escribir nada**, y SHALL usar **un código distinto para cada uno de
los dos motivos**.

La segunda condición es necesaria porque la primera deja una ventana permanente:
un perfil cuyo rol nunca se declaró lo sigue teniendo sin declarar para siempre,
de modo que un cambio de rol podría alcanzarlo **después** de que se hubiera
unido a un salón, dejándolo fuera de él. Una cuenta recién creada no tiene
ninguno de esos lazos, así que su primera declaración SHALL seguir siendo
posible.

Esa escritura SHALL pasar por una función del servidor que actúa
**exclusivamente sobre el perfil de quien la llama**, que acepta únicamente
`child` o `tutor`, y que al escribir SHALL marcar el rol como declarado en la
misma operación, de modo que no quede ningún momento en que el rol esté fijado y
todavía se pueda volver a cambiar.

La escritura directa sobre el rol desde el cliente SHALL seguir revocada.

#### Scenario: Se consulta el perfil propio

- **WHEN** una persona autenticada lee su perfil
- **THEN** obtiene su rol junto al resto de campos del perfil

#### Scenario: Un perfil se crea sin rol declarado

- **WHEN** se da de alta un usuario sin indicar rol
- **THEN** su perfil queda con el rol `child`
- **AND** su perfil queda marcado como que el rol no se declaró

#### Scenario: Un perfil se crea declarando su rol

- **WHEN** se da de alta un usuario indicando el rol `tutor` en los metadatos
- **THEN** su perfil queda con el rol `tutor`
- **AND** su perfil queda marcado como que el rol se declaró

#### Scenario: Se intenta guardar un rol desconocido

- **WHEN** se intenta escribir en el perfil un rol distinto de `child` o `tutor`
- **THEN** la base de datos rechaza la escritura

#### Scenario: Se fija el rol de un perfil que no lo había declarado

- **WHEN** una persona autenticada cuyo perfil no declaró rol, y no tiene ningún lazo de salón, lo fija en `tutor` por la función del servidor
- **THEN** su perfil queda con el rol `tutor`
- **AND** su perfil queda marcado como que el rol se declaró
- **AND** la respuesta devuelve el perfil ya actualizado

#### Scenario: Se intenta fijar el rol de un perfil que ya lo declaró

- **WHEN** una persona autenticada cuyo perfil ya declaró rol intenta fijar otro
- **THEN** la llamada es rechazada
- **AND** el rol del perfil no cambia

#### Scenario: Se intenta fijar el rol de un alumno que ya está en un salón

- **WHEN** una persona autenticada cuyo perfil no declaró rol, pero que pertenece a un salón, intenta fijar el rol `tutor`
- **THEN** la llamada es rechazada con un código distinto del de «el rol ya estaba declarado»
- **AND** el rol del perfil no cambia
- **AND** conserva su pertenencia al salón

#### Scenario: Se intenta fijar el rol de un tutor que ya tiene salones

- **WHEN** una persona autenticada que es dueña de algún salón intenta fijar el rol `child`
- **THEN** la llamada es rechazada
- **AND** el rol del perfil no cambia

#### Scenario: Se intenta fijar el rol con una solicitud de ingreso pendiente

- **WHEN** una persona autenticada con una solicitud de ingreso pendiente intenta fijar otro rol
- **THEN** la llamada es rechazada
- **AND** el rol del perfil no cambia

#### Scenario: Se intenta fijar un rol desconocido por la función

- **WHEN** se invoca la función con un valor que no es `child` ni `tutor`
- **THEN** la llamada es rechazada y el rol del perfil no cambia

#### Scenario: Se intenta fijar el rol de otra persona

- **WHEN** una persona autenticada intenta fijar el rol de un perfil que no es el suyo
- **THEN** no existe ninguna vía para hacerlo: la función sólo actúa sobre el perfil de quien llama

#### Scenario: Los perfiles anteriores a la marca quedan cerrados

- **WHEN** se introduce el registro de si el rol se declaró, sobre una base que ya tiene perfiles
- **THEN** todos los perfiles existentes quedan marcados como que su rol ya se declaró
- **AND** ninguno de ellos admite un cambio de rol posterior
