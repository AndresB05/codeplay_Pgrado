## MODIFIED Requirements

### Requirement: El destino tras autenticarse lo decide el rol del perfil

Al entrar por el formulario de acceso, por el de registro o **al volver de un
proveedor externo**, el sistema SHALL llevar a quien entra al panel que
corresponde al rol de **su perfil en el servidor**, y NO SHALL llevar a todo el
mundo al mismo destino.

El destino SHALL decidirse con el perfil que devuelve el servidor, nunca con lo
que se eligió en la pantalla. Mientras ese perfil no haya llegado, el sistema NO
SHALL navegar a ningún panel: navegar antes muestra durante un instante un panel
ajeno que la guarda de rutas privadas retira acto seguido.

La vuelta de un proveedor externo NO SHALL aterrizar en una ruta que pertenezca
a un rol concreto. Aterrizar en la ruta de un rol obliga a la guarda a rebotar a
quien tenga el otro, que es el parpadeo de panel ajeno que este requisito
prohíbe.

#### Scenario: Un tutor inicia sesión

- **WHEN** unas credenciales válidas de una cuenta con rol `tutor` se envían desde la pantalla de acceso
- **THEN** se llega a `/teacher/groups`
- **AND** no se pasa por el panel del niño en ningún momento

#### Scenario: Un niño inicia sesión

- **WHEN** unas credenciales válidas de una cuenta con rol `child` se envían desde la pantalla de acceso
- **THEN** se llega a `/dashboard/worlds`

#### Scenario: El perfil todavía no ha llegado

- **WHEN** el servidor ha aceptado las credenciales pero el perfil aún no está cargado
- **THEN** se permanece en la pantalla de acceso hasta que llegue, en lugar de navegar a un panel elegido de antemano

#### Scenario: Un tutor vuelve del proveedor externo

- **WHEN** se completa el acceso con Google y el perfil que devuelve el servidor consta con rol `tutor`
- **THEN** se llega a `/teacher/groups`
- **AND** no se pasa por el panel del niño en ningún momento

#### Scenario: Un niño vuelve del proveedor externo

- **WHEN** se completa el acceso con Google y el perfil que devuelve el servidor consta con rol `child`
- **THEN** se llega a `/dashboard/worlds`

### Requirement: El rol del registro lo valida el servidor

El rol elegido al registrarse SHALL viajar en los metadatos del alta y el
servidor SHALL ser quien lo escriba en el perfil. Un valor distinto de `child` o
`tutor` NO SHALL crear un perfil con ese valor ni SHALL abortar el alta: SHALL
guardarse `child`.

Cuando el alta **no pueda llevar metadatos** —como ocurre con un proveedor
externo—, el perfil SHALL nacer con `child`, y el rol elegido SHALL aplicarse
**después** del alta y **sólo por una función del servidor**. El navegador NO
SHALL escribir el rol directamente en el perfil por ninguna vía.

**El rol SHALL quedar fijado en el primer registro y NO SHALL cambiar después.**
El servidor SHALL registrar si el rol de un perfil **se declaró** al darse de
alta, y SHALL rechazar cualquier intento posterior de fijarlo cuando ya estaba
declarado, **sin escribir nada**. Un perfil cuyo rol nunca se declaró —porque el
alta no pudo llevarlo— SHALL admitir esa primera declaración, y sólo esa.

El rol con el que se navega SHALL ser siempre el del perfil que devuelve el
servidor, nunca el que se envió desde el navegador.

#### Scenario: Se elige un rol válido

- **WHEN** se completa el registro eligiendo `tutor`
- **THEN** el perfil creado consta con rol `tutor`

#### Scenario: El rol enviado está manipulado

- **WHEN** el alta llega con un rol que no es `child` ni `tutor`
- **THEN** la cuenta se crea igual y su perfil consta con rol `child`

#### Scenario: El alta no lleva rol

- **WHEN** el alta llega sin rol en los metadatos
- **THEN** el perfil creado consta con rol `child`

#### Scenario: El alta viene de un proveedor externo

- **WHEN** la cuenta se crea por un proveedor externo, que no admite metadatos de rol
- **THEN** el perfil nace con rol `child`
- **AND** el rol elegido se aplica después por una función del servidor, no por una escritura del navegador

#### Scenario: Se intenta cambiar un rol ya declarado

- **WHEN** una cuenta cuyo rol se declaró al registrarse intenta fijar un rol distinto
- **THEN** el servidor rechaza la operación
- **AND** el rol del perfil no cambia

## ADDED Requirements

### Requirement: Acceso con Google

El sistema SHALL ofrecer el acceso con Google tanto en la pantalla de acceso
como en la de registro.

**Desde el registro, el rol elegido SHALL sobrevivir el viaje al proveedor**, y
al volver el sistema SHALL dejar el perfil con ese rol siempre que la cuenta sea
nueva o su rol nunca se hubiera declarado.

**Desde la pantalla de acceso NO SHALL aplicarse ningún rol**: quien entra por
ahí ya tiene cuenta, y su rol es el que su perfil ya tenga. Iniciar el acceso
desde esa pantalla SHALL descartar cualquier intención de rol que hubiera
quedado pendiente de un viaje anterior.

**La intención de rol SHALL consumirse una sola vez.** Una vez leída, SHALL
quedar descartada, de modo que un segundo viaje al proveedor —o una recarga de
la pantalla de vuelta— NO SHALL volver a aplicarla.

**Quien decide si el rol se fija SHALL ser el servidor, no el navegador.** La
aplicación SHALL enviar la intención de rol **siempre que exista**, aunque
coincida con el rol que el perfil ya tiene, y el servidor SHALL resolver si
procede escribirla.

La condición para escribir NO SHALL ser que el rol elegido difiera del actual: un
alta por proveedor externo nace siempre con el rol por defecto, de modo que quien
elige precisamente ese rol coincidiría con él y su elección **nunca quedaría
registrada como declarada**, dejando la cuenta abierta a un cambio de rol
posterior.

Cuando el acceso con Google crea una cuenta **sin ninguna intención de rol
pendiente** —el caso del botón de la pantalla de acceso—, el perfil SHALL quedar
con `child`.

**Enlazar el proveedor a una cuenta que ya existe SHALL funcionar**, y NO SHALL
tratarse como un error: una misma persona puede acceder con contraseña y con
Google. Lo que ese enlace NO SHALL hacer es cambiar el rol de esa cuenta.

#### Scenario: Registro con Google eligiendo tutor

- **WHEN** se elige «Tutor» en el registro y se entra con Google con una cuenta nueva
- **THEN** el perfil queda con rol `tutor`
- **AND** se llega a `/teacher/groups`

#### Scenario: Registro con Google eligiendo niño

- **WHEN** se elige «Niño» en el registro y se entra con Google con una cuenta nueva
- **THEN** el perfil queda con rol `child`
- **AND** se llega a `/dashboard/worlds`

#### Scenario: Acceso con Google de una cuenta que ya existe

- **WHEN** se entra con Google desde la pantalla de acceso con una cuenta que ya tiene perfil
- **THEN** el rol de ese perfil no cambia
- **AND** se llega al panel de ese rol

#### Scenario: Cuenta nueva creada desde la pantalla de acceso

- **WHEN** se entra con Google desde la pantalla de acceso y la cuenta no existía
- **THEN** el perfil queda con rol `child`

#### Scenario: Se intenta registrar con Google una cuenta que ya declaró su rol

- **WHEN** alguien que ya tiene cuenta con contraseña entra con Google desde el registro eligiendo el otro rol
- **THEN** el proveedor queda enlazado a esa misma cuenta
- **AND** el rol del perfil no cambia
- **AND** la sesión queda abierta y se llega al panel del rol que ya tenía

#### Scenario: La intención de rol no se aplica dos veces

- **WHEN** se vuelve a pasar por la pantalla de vuelta después de que la intención ya se aplicó una vez
- **THEN** no se escribe ningún rol

#### Scenario: Se elige el mismo rol que la cuenta nueva trae por defecto

- **WHEN** se elige «Niño» en el registro y se entra con Google con una cuenta nueva, cuyo perfil nace con ese mismo rol
- **THEN** el rol queda registrado como declarado
- **AND** esa cuenta no admite un cambio de rol posterior

#### Scenario: El perfil ya coincide con lo elegido y ya lo había declarado

- **WHEN** el perfil que devuelve el servidor ya tiene el rol que se eligió antes de ir al proveedor, y ese rol ya estaba declarado
- **THEN** el servidor rechaza la escritura y el rol no cambia
- **AND** se muestra el aviso neutro
- **AND** se llega al panel de ese rol

#### Scenario: El acceso con contraseña no se ve afectado

- **WHEN** se entra o se registra con correo y contraseña
- **THEN** el comportamiento es el mismo que antes de existir el acceso con Google

### Requirement: Registrarse con un correo que ya tiene cuenta

Cuando el formulario de registro se envíe con un correo que **ya tiene cuenta**,
el sistema NO SHALL crear nada, NO SHALL abrir sesión y SHALL avisar de que esa
cuenta ya existe, llevando a la pantalla de acceso.

Ese aviso SHALL ser **genérico**: NO SHALL nombrar el rol de la cuenta existente
ni ningún otro dato suyo. En ese punto no hay sesión, de modo que quien está
delante de la pantalla no está identificado, y nombrar el rol le diría a un
desconocido si detrás de ese correo hay un niño o un tutor.

#### Scenario: El formulario de registro recibe un correo ya registrado

- **WHEN** se envía el formulario de registro con un correo que ya tiene cuenta
- **THEN** no se abre ninguna sesión
- **AND** se avisa de que esa cuenta ya existe
- **AND** el aviso no dice con qué rol está registrada
- **AND** se lleva a la pantalla de acceso

### Requirement: La pantalla de vuelta del proveedor resuelve sesión, error y rol

La pantalla a la que devuelve el proveedor externo SHALL distinguir **cuatro**
situaciones, y NO SHALL responder a todas con la misma redirección.

**Cuando el proveedor devuelve un error**, el sistema SHALL **mostrar el motivo**
en esa pantalla y NO SHALL redirigir a la pantalla de acceso. Redirigir descarta
el motivo, que en ese camino es el único dato disponible, y deja un regreso mudo
que parece un fallo de la aplicación. El motivo SHALL mostrarse aunque venga
redactado por el proveedor y en otro idioma, y SHALL mostrarse legible, sin los
escapes de la URL.

**Cuando no hay sesión y tampoco hay error del proveedor** —el caso de quien
escribe la dirección a mano—, el sistema SHALL redirigir a `/login`, porque sin
la vuelta del proveedor no hay nada que resolver.

**Cuando hay sesión y el servidor rechaza fijar el rol porque ya estaba
declarado**, el sistema SHALL mostrar un **aviso neutro** que diga que esa cuenta
ya existía y con qué rol se entra, y SHALL permitir continuar al panel de ese
rol. NO SHALL presentarlo como un error, NO SHALL cerrar la sesión y NO SHALL
llevar a la pantalla de acceso: quien llega ahí ha entrado correctamente. **Aquí
SHALL nombrarse el rol**, porque es su propia cuenta y su propia sesión.

**Cuando hay sesión y el rol está por fijar**, el sistema NO SHALL exigir ningún
rol concreto ni apartar a quien llega hacia el panel de su rol antes de haber
resuelto el rol definitivo: hacerlo enseñaría el panel del rol provisional a
quien se registró como tutor.

Mientras el rol se resuelve, la pantalla SHALL indicar que el acceso está en
curso, y NO SHALL mostrar ningún panel.

Distinguir estas situaciones SHALL ser responsabilidad de la propia pantalla.
Una guarda de ruta sólo dispone de la ausencia de sesión, y con ese único dato
NO puede separar el error del proveedor de la dirección escrita a mano.

#### Scenario: El proveedor devuelve un error

- **WHEN** se vuelve del proveedor con un error en lugar de una sesión
- **THEN** se muestra el motivo del error en la pantalla de vuelta
- **AND** no se redirige a la pantalla de acceso
- **AND** se ofrece volver a la pantalla de acceso desde ahí

#### Scenario: El motivo del proveedor llega escapado

- **WHEN** el motivo devuelto por el proveedor viene con escapes de URL
- **THEN** se muestra legible, sin esos escapes

#### Scenario: Se llega con la sesión del proveedor

- **WHEN** se abre la pantalla de vuelta con la sesión que creó el acceso con Google
- **THEN** se muestra el aviso de acceso en curso
- **AND** no se muestra el panel de ningún rol hasta que el rol queda resuelto

#### Scenario: La cuenta ya había declarado su rol

- **WHEN** se vuelve con sesión y el servidor rechaza fijar el rol porque ya estaba declarado
- **THEN** se muestra un aviso neutro que dice que esa cuenta ya existía y con qué rol se entra
- **AND** la sesión sigue abierta
- **AND** se puede continuar al panel de ese rol

#### Scenario: Se llega sin sesión

- **WHEN** se abre la dirección de la pantalla de vuelta sin ninguna sesión y sin error del proveedor
- **THEN** se redirige a `/login`

#### Scenario: Se llega con sesión y sin nada que resolver

- **WHEN** se abre la pantalla de vuelta con sesión y sin ninguna intención de rol pendiente
- **THEN** se lleva al panel que corresponde al rol del perfil
