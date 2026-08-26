## MODIFIED Requirements

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

## ADDED Requirements

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
