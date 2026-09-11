## ADDED Requirements

### Requirement: Los niveles de un mundo salen de la base

Los niveles que se listan al entrar en un mundo SHALL ser **los que la base tiene
para ese mundo**, con su título, su descripción y su orden, y NO SHALL inventarse
ni completarse con datos de ejemplo.

Cuántos niveles tiene el mundo SHALL ser cuántos devuelve la base. NO SHALL
declararse en ninguna parte de la interfaz una cantidad fija de niveles por
mundo.

El mundo se SHALL resolver **por su identificador**. Cuando ese identificador no
corresponda a ningún mundo de la base, el sistema NO SHALL mostrar otro mundo en
su lugar: SHALL decir que ese mundo no está disponible y ofrecer volver al
catálogo.

Mientras la lectura está en curso NO SHALL anunciarse que el mundo está vacío.

#### Scenario: El niño entra en un mundo

- **WHEN** se abre la lista de niveles de un mundo
- **THEN** se listan los niveles que la base tiene para ese mundo, en su orden
- **AND** cada uno se muestra con el título y la descripción de su fila

#### Scenario: El identificador no corresponde a ningún mundo

- **WHEN** se abre la lista de niveles con un identificador que la base no reconoce
- **THEN** se dice que ese mundo no está disponible
- **AND** no se muestran los niveles de ningún otro mundo

#### Scenario: La lectura todavía no ha terminado

- **WHEN** la consulta de los niveles sigue en curso
- **THEN** no se anuncia que el mundo no tiene niveles

### Requirement: El nivel elegido se juega en su propia pantalla

El sistema SHALL ofrecer una **pantalla de nivel** a la que se llega eligiendo un
nivel de la lista de su mundo, y esa pantalla SHALL montar el juego con **el
nivel elegido**, leído de la base.

La pantalla SHALL tener **dirección propia**, distinta de la del mundo, de modo
que abrirla escribiéndola lleve al mismo nivel.

Lo que se le dice al niño que tiene que hacer SHALL salir de la **narrativa de la
fila** del nivel, no escrito dentro de la pantalla.

La pantalla SHALL ofrecer volver a la lista de niveles de su mundo.

Mientras el nivel se está leyendo NO SHALL montarse el juego contra un nivel que
todavía no ha llegado.

#### Scenario: El niño elige un nivel

- **WHEN** pulsa un nivel disponible de la lista
- **THEN** se abre la pantalla de ese nivel con el juego montado sobre su tablero

#### Scenario: Se abre la pantalla escribiendo su dirección

- **WHEN** se escribe la dirección de un nivel en el navegador
- **THEN** se abre ese mismo nivel, y no la lista de niveles de su mundo

#### Scenario: Las instrucciones del nivel

- **WHEN** el niño mira las instrucciones de la pantalla de nivel
- **THEN** lee el texto que trae la fila de ese nivel

#### Scenario: El niño vuelve atrás

- **WHEN** pide volver desde la pantalla de nivel
- **THEN** regresa a la lista de niveles de su mundo

## MODIFIED Requirements

### Requirement: Progresión bloqueada por niveles

El sistema SHALL presentar los niveles de un mundo en orden y SHALL distinguir
visualmente los que todavía no están disponibles.

Qué niveles están disponibles SHALL salir del **progreso real** del niño, y NO
SHALL salir de datos de ejemplo. El **primer** nivel de un mundo SHALL estar
siempre disponible, de modo que un niño sin ningún progreso pueda empezar.

Un nivel bloqueado NO SHALL poder abrirse desde la lista.

#### Scenario: Un nivel aún no está disponible

- **WHEN** el nivel está bloqueado
- **THEN** se muestra en estado bloqueado y no permite entrar

#### Scenario: Un niño sin progreso entra en un mundo

- **WHEN** el niño no ha completado ningún nivel de ese mundo
- **THEN** el primer nivel aparece disponible
- **AND** los siguientes aparecen bloqueados
