# auth-sesion Specification

## Purpose

Distinguir los dos tipos de usuario de CodePlay —niño (`child`) y tutor
(`tutor`)— y llevar a cada uno al panel que le corresponde. El rol `tutor` cubre
tanto a padres como a profesores; en la interfaz se etiqueta «Tutor».

Mientras el login real no está conectado, el acceso se resuelve con un atajo
limitado a desarrollo: **autentica de verdad** contra el servidor con cuentas de
prueba cuando hay credenciales configuradas, y sólo recurre a una marca local de
invitado cuando no las hay.

## Requirements

### Requirement: Guarda de las rutas privadas

El sistema SHALL impedir el acceso a las rutas privadas a quien no tenga sesión,
y SHALL redirigir a `/login`.

#### Scenario: Visitante sin sesión entra a una ruta privada

- **WHEN** no hay sesión autenticada ni sesión de invitado
- **THEN** se redirige a `/login`

#### Scenario: La sesión todavía se está resolviendo

- **WHEN** la comprobación de sesión está en curso
- **THEN** se muestra un indicador de carga en lugar del contenido o de una redirección

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
