# auth-sesion Specification

## Purpose

Distinguir los dos tipos de usuario de CodePlay —niño (`child`) y tutor
(`tutor`)— y llevar a cada uno al panel que le corresponde. El rol `tutor` cubre
tanto a padres como a profesores; en la interfaz se etiqueta «Tutor».

Mientras la autenticación real no está conectada, el acceso se resuelve con una
sesión de invitado limitada a desarrollo.

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

#### Scenario: Hay perfil autenticado

- **WHEN** existe un perfil de usuario cargado
- **THEN** el rol activo es el del perfil, aunque exista una sesión de invitado

#### Scenario: Sólo hay sesión de invitado

- **WHEN** no hay perfil autenticado pero sí sesión de invitado
- **THEN** el rol activo es el almacenado para esa sesión, `child` o `tutor`

### Requirement: La sesión de invitado sólo existe en desarrollo

El sistema SHALL habilitar la sesión de invitado únicamente cuando se ejecuta en
modo desarrollo, de forma que en producción no exista ese acceso.

#### Scenario: La aplicación corre en desarrollo

- **WHEN** se elige entrar como niño o como profesor sin login
- **THEN** se guarda la marca de invitado y su rol, y se accede al panel correspondiente

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
