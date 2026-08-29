## ADDED Requirements

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
