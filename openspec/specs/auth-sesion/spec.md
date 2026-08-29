# auth-sesion Specification

## Purpose

Distinguir los dos tipos de usuario de CodePlay —niño (`child`) y tutor
(`tutor`)— y llevar a cada uno al panel que le corresponde. El rol `tutor` cubre
tanto a padres como a profesores; en la interfaz se etiqueta «Tutor».

El acceso es real: se entra con cuenta y contraseña contra el servidor, y el rol
con el que se navega es **el del perfil que devuelve el servidor**, no el que se
eligió en la pantalla. Junto a esa vía existe un **atajo limitado a desarrollo**
que también autentica de verdad, con cuentas de prueba, y que sólo recurre a una
marca local de invitado cuando no hay credenciales configuradas. Es un atajo para
quien desarrolla, no una vía de acceso: fuera de desarrollo no existe.

Las contraseñas son parte de este acceso, y con ellas la capacidad cubre las dos
salidas: cambiar la propia desde la cuenta —pidiendo la actual y verificándola
contra el servidor, porque esto se usa en computadores de aula compartidos— y
recuperar la olvidada por correo, con una pantalla de contraseña nueva que exige
sesión pero ningún rol concreto.

**También se entra con Google**, por la pantalla de acceso y por la de registro.
Como el alta por un proveedor externo no puede declarar el rol, éste se aplica al
volver, contra el servidor, en una pantalla intermedia que resuelve además el
error del proveedor y la ausencia de sesión.

**Todo lo que esta capacidad enseña va en español**, incluidos los fallos que
levanta el servidor de autenticación, que llegan en inglés y se traducen por
código antes de pintarse. Y lo que enseña del usuario es **lo que el perfil dice
de él**: ni el nombre, ni el correo, ni la racha se sustituyen por un valor de
ejemplo cuando faltan o valen cero.

**Y el rol se fija en el primer registro y no cambia nunca**, que hoy es una
propiedad definitoria de esta capacidad y no un detalle de implementación: el rol
es lo que decide a qué panel se entra y qué se puede escribir, así que cambiarlo
deja una cuenta sin sitio. Enlazar varios proveedores sobre la misma cuenta sí es
legítimo; lo que se rechaza es crear una cuenta que ya existe.

## Requirements

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

### Requirement: Cada rol permanece en su panel

El sistema SHALL devolver a su propio panel a quien entre en una ruta que
pertenece al otro rol, en lugar de mostrarle un panel ajeno.

#### Scenario: Un niño entra en una ruta de tutor

- **WHEN** el rol activo es `child` y la ruta solicitada exige `tutor`
- **THEN** se redirige a `/dashboard/worlds`

#### Scenario: Un tutor entra en una ruta de niño

- **WHEN** el rol activo es `tutor` y la ruta solicitada exige `child`
- **THEN** se redirige a `/teacher/groups`

#### Scenario: Ruta desconocida

- **WHEN** se solicita una ruta que no existe
- **THEN** se redirige a la landing en `/`

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

### Requirement: Un registro que no abre sesión pide confirmar el correo

Cuando el servidor cree la cuenta pero NO devuelva sesión —porque exige
confirmar el correo—, el sistema SHALL permanecer en la pantalla de registro y
SHALL explicar que hay que confirmar el correo antes de entrar.

NO SHALL navegar a un panel: sin sesión, la guarda de rutas privadas devuelve a
`/login` sin dar ningún motivo, y el registro parece haber fallado cuando en
realidad se creó la cuenta.

#### Scenario: El registro devuelve sesión

- **WHEN** se completa el registro y el servidor devuelve sesión
- **THEN** se llega al panel que corresponde al rol del perfil recién creado

#### Scenario: El registro no devuelve sesión

- **WHEN** se completa el registro y el servidor no devuelve sesión
- **THEN** se permanece en la pantalla de registro
- **AND** se indica que la cuenta se creó y que hay que confirmar el correo antes de entrar

#### Scenario: El registro es rechazado

- **WHEN** el servidor rechaza el registro, por ejemplo porque el correo ya está dado de alta
- **THEN** se permanece en la pantalla de registro y el motivo del rechazo queda visible

### Requirement: Rol efectivo de la sesión

El sistema SHALL resolver el rol activo priorizando el perfil autenticado, y
SHALL recurrir al rol de la sesión de invitado sólo cuando no haya perfil.

El rol de una cuenta de prueba SHALL ser el que consta en su perfil en el
servidor, no el del botón que se pulsó. Si ambos no coinciden, SHALL mandar el
del perfil.

#### Scenario: Hay perfil autenticado

- **WHEN** existe un perfil de usuario cargado
- **THEN** el rol activo es el del perfil, aunque exista una sesión de invitado

#### Scenario: Sólo hay sesión de invitado

- **WHEN** no hay perfil autenticado pero sí sesión de invitado
- **THEN** el rol activo es el almacenado para esa sesión, `child` o `tutor`

#### Scenario: La cuenta de prueba no tiene el rol que se esperaba

- **WHEN** se entra con la cuenta de prueba de tutor pero su perfil consta como `child`
- **THEN** el rol activo es `child` y se accede al panel de niño, en lugar de mostrar un panel que el servidor no autorizaría

### Requirement: Una sesión sin perfil no da acceso a ningún panel

Cuando exista sesión válida pero el usuario NO tenga perfil, el sistema NO SHALL
dar acceso a ningún panel, ni al de `child` ni al de `tutor`. SHALL cerrar esa
sesión y SHALL dejar visible el motivo en la pantalla de acceso.

Sin perfil no hay rol, y sin rol el sistema no puede saber qué panel corresponde:
dejar pasar equivale a elegir uno al azar, que es lo que ocurría cuando la
ausencia de rol se trataba como «cualquier rol vale».

Cerrar la sesión SHALL reservarse al caso en que el perfil **no existe**. Cuando
el perfil no se pueda cargar por cualquier otro motivo —un corte de red, un
servidor que no responde—, el sistema NO SHALL cerrar la sesión: el perfil puede
existir perfectamente y volver a estar disponible al siguiente intento, así que
cerrarla echaría a un usuario legítimo por un fallo pasajero.

Las redirecciones que produzca este caso NO SHALL formar un bucle entre las
rutas públicas y las privadas.

#### Scenario: Hay sesión pero no hay perfil

- **WHEN** la sesión es válida y el usuario no tiene fila de perfil
- **THEN** no se accede a ningún panel
- **AND** no queda sesión abierta
- **AND** en la pantalla de acceso se explica que la cuenta no tiene perfil

#### Scenario: El perfil no se puede cargar por otro motivo

- **WHEN** la consulta del perfil falla por un motivo distinto de que la fila no exista
- **THEN** la sesión sigue abierta
- **AND** el motivo del fallo queda visible, en lugar de tratarse como una cuenta sin perfil

#### Scenario: La pantalla de acceso es alcanzable sin perfil

- **WHEN** se llega a `/login` por no tener perfil
- **THEN** la pantalla de acceso se muestra, en lugar de devolver de nuevo a un panel

### Requirement: La sesión de invitado sólo existe en desarrollo

El sistema SHALL habilitar el acceso sin login únicamente cuando se ejecuta en
modo desarrollo, de forma que en producción no exista ese acceso.

Cuando haya credenciales de prueba configuradas, ese acceso SHALL **autenticar
de verdad** contra el servidor con la cuenta que corresponde al rol elegido, en
lugar de simular la sesión en el navegador. La sesión resultante SHALL ser una
sesión de usuario completa, de modo que el servidor pueda identificar a quien
escribe.

Cuando no haya credenciales configuradas, el sistema SHALL recurrir a la marca
local de invitado, para que quien clone el repositorio sin configurarlas siga
pudiendo entrar.

#### Scenario: La aplicación corre en desarrollo

- **WHEN** se elige entrar como niño o como profesor sin login, con credenciales de prueba configuradas
- **THEN** se inicia sesión con la cuenta de prueba de ese rol y se accede al panel correspondiente
- **AND** las escrituras posteriores viajan con la identidad de esa cuenta, no de forma anónima

#### Scenario: La aplicación corre en desarrollo sin credenciales de prueba

- **WHEN** se elige entrar como niño o como profesor sin login y no hay credenciales configuradas
- **THEN** se guarda la marca de invitado y su rol, y se accede al panel correspondiente

#### Scenario: La autenticación de prueba falla

- **WHEN** las credenciales de prueba están configuradas pero el servidor rechaza el acceso
- **THEN** no se accede al panel y el motivo del rechazo queda visible, en lugar de entrar con una sesión simulada que aparentaría funcionar

#### Scenario: La aplicación corre en producción

- **WHEN** se consulta si hay sesión de invitado
- **THEN** la respuesta es negativa aunque la marca siga presente en el navegador

### Requirement: Configuración de entorno validada al arrancar

El sistema SHALL validar las variables de entorno de Supabase al importarse la
configuración, y SHALL interrumpir el arranque si faltan o son inválidas, en vez
de fallar más tarde con errores opacos.

#### Scenario: Falta una variable obligatoria

- **WHEN** `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` está vacía o mal formada
- **THEN** la validación lanza un error que nombra la variable y el motivo
- **AND** la aplicación no llega a renderizarse

### Requirement: Salir cierra la sesión por completo

El sistema SHALL cerrar **toda** la sesión al salir, tanto la del servidor como
la marca local, desde cualquiera de los sitios que ofrecen salir. Después de
salir, volver a una ruta privada SHALL redirigir a `/login`.

NO SHALL bastar con borrar la marca local: dejar viva la sesión del servidor
haría que la guarda de rutas privadas siguiera dejando pasar.

#### Scenario: Se sale desde la barra lateral

- **WHEN** se pulsa «Salir» en la barra lateral del panel, de niño o de tutor
- **THEN** no queda sesión de ningún tipo
- **AND** volver a una ruta privada escribiendo su dirección redirige a `/login`

#### Scenario: Se sale desde la pantalla de ajustes

- **WHEN** se pulsa salir en la pantalla de ajustes, de niño o de tutor
- **THEN** el resultado es el mismo que desde la barra lateral

### Requirement: Las credenciales de prueba no llegan a producción

Las credenciales de las cuentas de prueba SHALL quedar fuera del repositorio y
fuera de cualquier compilación de producción. NO SHALL aparecer en el paquete
publicado ni en `.env.example`, donde sólo constan los nombres de las variables.

Su ausencia NO SHALL impedir el arranque de la aplicación: son opcionales, y
quien no las configure debe poder ejecutar el proyecto igual.

#### Scenario: Se compila para producción

- **WHEN** se genera la compilación de producción y se inspecciona lo publicado
- **THEN** no aparece ni el correo ni la contraseña de ninguna cuenta de prueba

#### Scenario: Se arranca sin credenciales de prueba

- **WHEN** la configuración no incluye las credenciales de prueba
- **THEN** la aplicación arranca con normalidad y el acceso sin login recurre a la marca de invitado

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

### Requirement: Los fallos de autenticación se muestran en español

Todo fallo de acceso, registro, cierre de sesión, recuperación o cambio de
contraseña que llegue a una pantalla SHALL mostrarse **en español**. El texto que
devuelve el servidor de autenticación viene en inglés y NO SHALL enseñarse tal
cual a quien usa la plataforma, que en el caso del niño puede no leerlo.

La traducción SHALL hacerse **por código de error**, no por el texto del mensaje,
para que un cambio de redacción en el servidor no la deje muda. El texto original
SHALL conservarse como causa del error, de modo que siga estando disponible para
quien depura.

Un fallo cuyo código no esté contemplado SHALL mostrar el mensaje genérico en
español que corresponda a la operación que se intentaba, nunca el texto crudo del
servidor.

#### Scenario: Contraseña incorrecta al entrar

- **WHEN** alguien intenta entrar con una contraseña que no corresponde a su correo
- **THEN** la pantalla de acceso muestra el motivo en español
- **AND** no aparece ningún texto en inglés

#### Scenario: Fallo con un código no contemplado

- **WHEN** el servidor devuelve un fallo cuyo código no está traducido
- **THEN** se muestra el mensaje genérico en español de esa operación
- **AND** el mensaje original del servidor queda accesible como causa del error

#### Scenario: El correo del registro ya tiene cuenta

- **WHEN** alguien se registra con un correo que ya está dado de alta
- **THEN** se sigue mostrando el aviso genérico en español que ya existía, sin nombrar el rol de esa cuenta

### Requirement: El panel muestra la identidad real de quien ha entrado

El panel SHALL mostrar el nombre, el correo y la racha **de la sesión abierta**.
NO SHALL sustituir un dato ausente o en cero por un valor de ejemplo: enseñar una
racha inventada le miente al niño sobre su propio progreso, y la tabla de su
salón —que sí muestra el valor verdadero— lo contradice en la misma aplicación.

Cada dato se resuelve según lo que su ausencia significa:

- La **racha** en cero es un valor legítimo y SHALL mostrarse como cero. Sólo se
  repliega cuando no hay valor en absoluto.
- El **nombre** SHALL replegarse a un tratamiento genérico cuando el perfil no
  tenga nombre, porque el perfil admite el nombre vacío. Ese tratamiento genérico
  SHALL ser el mismo que ya usan las listas de salón, no uno propio del panel.
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

#### Scenario: Correo desconocido

- **WHEN** la sesión no tiene correo asociado
- **THEN** la pantalla de cuenta no muestra ninguna dirección de ejemplo
