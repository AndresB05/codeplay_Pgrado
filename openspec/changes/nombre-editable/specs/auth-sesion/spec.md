## ADDED Requirements

### Requirement: Cambiar el propio nombre desde la cuenta

Quien tenga la sesión abierta SHALL poder cambiar su nombre desde su pantalla de
Ajustes, siendo `child` o siendo `tutor`, con el mismo comportamiento en las dos.
El nombre es lo que distingue a una persona de otra dentro de un salón, y hasta
ahora quedaba fijado en el registro para siempre: el tutor no tenía más remedio
que preguntar quién era quién.

El formulario SHALL partir del nombre que la cuenta tiene ahora, no de un campo
vacío: cambiar un nombre casi siempre es corregirlo.

**El nombre nuevo SHALL verse de inmediato en todas las superficies que lo
enseñan** —barra lateral, cabecera, saludo del panel y pantalla de cuenta—, sin
recargar la página y sin volver a entrar. Una pantalla que siga mostrando el
nombre viejo después de guardarlo le dice a quien lo cambió que no se guardó.

**El mínimo y el máximo de longitud SHALL ser los mismos que exige el registro**,
para que la aplicación no acabe con dos ideas distintas de qué es un nombre
válido. El formulario NO SHALL enviar nada al servidor mientras el nombre no los
cumpla, y SHALL decir cuál es el límite que no se cumplió. Los espacios sobrantes
de los extremos SHALL descartarse antes de medir y antes de guardar, de modo que
un nombre hecho sólo de espacios no alcanza el mínimo.

**Sólo el nombre SHALL cambiar.** El rol, el correo, el nombre de usuario, el
avatar y el país de la cuenta SHALL quedar exactamente como estaban.

El resultado —salió o no salió— SHALL verse en la misma pantalla desde la que se
pulsó. Cuando el servidor rechace el cambio, el nombre NO SHALL cambiar y el
motivo SHALL quedar visible.

#### Scenario: Se cambia el nombre con éxito

- **WHEN** se envía un nombre nuevo que cumple la longitud
- **THEN** el nombre de la cuenta queda cambiado
- **AND** se confirma en la pantalla de Ajustes

#### Scenario: El cambio se ve sin recargar

- **WHEN** se guarda un nombre nuevo desde Ajustes
- **THEN** la barra lateral, la cabecera, el saludo del panel y la pantalla de cuenta muestran el nombre nuevo
- **AND** ninguna de ellas sigue mostrando el anterior hasta recargar la página

#### Scenario: El formulario llega con el nombre actual

- **WHEN** se abre el formulario de nombre en Ajustes
- **THEN** el campo trae el nombre que la cuenta tiene ahora

#### Scenario: El nombre es demasiado corto

- **WHEN** el nombre nuevo no alcanza el mínimo de longitud
- **THEN** no se envía nada al servidor
- **AND** se indica cuál es el mínimo

#### Scenario: El nombre es demasiado largo

- **WHEN** el nombre nuevo supera el máximo de longitud
- **THEN** no se envía nada al servidor
- **AND** se indica cuál es el máximo

#### Scenario: El nombre son sólo espacios

- **WHEN** el nombre nuevo está hecho únicamente de espacios
- **THEN** no se envía nada al servidor
- **AND** se trata como un nombre que no alcanza el mínimo

#### Scenario: El registro exige la misma longitud

- **WHEN** alguien se registra con un nombre que supera el máximo
- **THEN** el registro lo rechaza por el mismo motivo y con el mismo límite que Ajustes

#### Scenario: El servidor rechaza el cambio

- **WHEN** el servidor rechaza el nombre nuevo
- **THEN** el nombre no cambia
- **AND** el motivo del rechazo queda visible en la pantalla de Ajustes

#### Scenario: El resto del perfil no se toca

- **WHEN** se cambia el nombre de una cuenta
- **THEN** su rol, su correo, su nombre de usuario, su avatar y su país quedan como estaban

#### Scenario: Las dos pantallas de Ajustes ofrecen lo mismo

- **WHEN** se cambia el nombre desde Ajustes, siendo `child` o siendo `tutor`
- **THEN** el comportamiento es el mismo en las dos

## MODIFIED Requirements

### Requirement: El panel muestra la identidad real de quien ha entrado

El panel SHALL mostrar el nombre, el correo y la racha **de la sesión abierta**.
NO SHALL sustituir un dato ausente o en cero por un valor de ejemplo: enseñar una
racha inventada le miente al niño sobre su propio progreso, y la tabla de su
salón —que sí muestra el valor verdadero— lo contradice en la misma aplicación.

Cada dato se resuelve según lo que su ausencia significa:

- La **racha** en cero es un valor legítimo y SHALL mostrarse como cero. Sólo se
  repliega cuando no hay valor en absoluto.
- El **nombre** SHALL replegarse a un tratamiento genérico cuando el perfil no
  tenga nombre, porque el perfil admite el nombre vacío. Hay **un tratamiento
  genérico por rol**, y no uno por pantalla: el del `child` SHALL ser el mismo que
  ya usan las listas de salón, y el del `tutor` SHALL ser uno solo, compartido por
  **todas** las superficies de su panel —barra lateral, cabecera, pantalla de
  cuenta y listado de salones—. Ninguna pantalla SHALL llevar el suyo propio: dos
  tratamientos distintos llamarían de dos maneras a la misma persona, y ahora que
  el nombre se puede cambiar el repliegue deja de ser un caso teórico.
- El **correo** NO SHALL tener ningún valor de repliegue. Cuando no se conozca,
  no se enseña ninguno.

#### Scenario: Cuenta recién creada, sin actividad

- **WHEN** entra alguien cuyo perfil tiene la racha en cero
- **THEN** la barra lateral y la barra superior muestran una racha de cero
- **AND** ninguna de las dos muestra un número de ejemplo

#### Scenario: Perfil sin nombre

- **WHEN** entra alguien cuyo perfil tiene el nombre vacío
- **THEN** se muestra el mismo tratamiento genérico que usan las listas de salón
- **AND** no se le atribuye un nombre propio inventado

#### Scenario: Tutor sin nombre

- **WHEN** entra un `tutor` cuyo perfil tiene el nombre vacío
- **THEN** todas las superficies de su panel muestran el mismo tratamiento genérico
- **AND** ninguna de ellas muestra uno distinto del de las demás

#### Scenario: Correo desconocido

- **WHEN** la sesión no tiene correo asociado
- **THEN** la pantalla de cuenta no muestra ninguna dirección de ejemplo
