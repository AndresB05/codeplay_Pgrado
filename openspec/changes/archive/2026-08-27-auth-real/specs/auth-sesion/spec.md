## ADDED Requirements

### Requirement: El destino tras autenticarse lo decide el rol del perfil

Al entrar por el formulario de acceso o por el de registro, el sistema SHALL
llevar a quien entra al panel que corresponde al rol de **su perfil en el
servidor**, y NO SHALL llevar a todo el mundo al mismo destino.

El destino SHALL decidirse con el perfil que devuelve el servidor, nunca con lo
que se eligió en la pantalla. Mientras ese perfil no haya llegado, el sistema NO
SHALL navegar a ningún panel: navegar antes muestra durante un instante un panel
ajeno que la guarda de rutas privadas retira acto seguido.

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

### Requirement: El rol del registro lo valida el servidor

El rol elegido al registrarse SHALL viajar en los metadatos del alta y el
servidor SHALL ser quien lo escriba en el perfil. Un valor distinto de `child` o
`tutor` NO SHALL crear un perfil con ese valor ni SHALL abortar el alta: SHALL
guardarse `child`.

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

## MODIFIED Requirements

### Requirement: Guarda de las rutas privadas

El sistema SHALL impedir el acceso a las rutas privadas a quien no tenga sesión,
y SHALL redirigir a `/login`.

Una ruta que pertenece a un rol SHALL exigir un rol activo. Cuando no haya
ninguno, el sistema SHALL redirigir a `/login` en lugar de mostrar el contenido:
la ausencia de rol NO SHALL tratarse como si cualquier rol sirviera.

#### Scenario: Visitante sin sesión entra a una ruta privada

- **WHEN** no hay sesión autenticada ni sesión de invitado
- **THEN** se redirige a `/login`

#### Scenario: La sesión todavía se está resolviendo

- **WHEN** la comprobación de sesión está en curso
- **THEN** se muestra un indicador de carga en lugar del contenido o de una redirección

#### Scenario: Hay sesión pero no hay rol activo

- **WHEN** la ruta solicitada exige un rol y el rol activo es nulo
- **THEN** se redirige a `/login` en lugar de mostrar el panel
