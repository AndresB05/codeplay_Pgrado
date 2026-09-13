# contenido-mundos Specification

## Purpose

Presentar al niño el contenido educativo organizado en mundos y niveles, junto
con el progreso conseguido en cada uno.

Los mundos y los niveles **ya se leen de la base**, con un repliegue explícito a
los datos de ejemplo cuando la lectura no devuelve nada, de modo que la pantalla
siempre tenga contenido.

El **XP** también sale de la base y tiene superficie en el panel del niño, no sólo
en su pantalla de cuenta. Hoy vale cero para todo el mundo porque nada escribe
progreso todavía, y ese cero se muestra tal cual: la capacidad enseña lo que hay,
no una cifra de ejemplo.

## Requirements

### Requirement: Origen de datos con repliegue local

El sistema SHALL intentar leer los mundos del backend, y SHALL replegarse a los
datos de ejemplo locales cuando la lectura no devuelve ningún mundo, de modo que
la pantalla siempre tenga contenido que mostrar.

#### Scenario: El backend devuelve mundos

- **WHEN** la consulta de mundos devuelve al menos un resultado
- **THEN** se muestran los mundos del backend

#### Scenario: El backend no devuelve nada

- **WHEN** la consulta falla o devuelve una lista vacía
- **THEN** se muestran los mundos de ejemplo locales
- **AND** no se muestra un error al niño

### Requirement: Filtrado del catálogo de mundos

El sistema SHALL permitir filtrar los mundos por dificultad, por temática y por
categoría.

#### Scenario: El niño filtra por dificultad

- **WHEN** selecciona una dificultad concreta
- **THEN** se listan sólo los mundos de esa dificultad

### Requirement: Progreso por mundo

El sistema SHALL mostrar en cada mundo cuántos de sus niveles ha completado el
niño sobre el total.

#### Scenario: El niño ha completado parte de un mundo

- **WHEN** se calcula el progreso de un mundo
- **THEN** se cuentan los niveles del mundo que figuran completados para ese usuario
- **AND** se muestran como una fracción sobre el total de niveles del mundo

### Requirement: Progresión bloqueada por niveles

El sistema SHALL presentar los niveles de un mundo en orden.

**Hasta la prueba preliminar, ningún nivel SHALL bloquearse en la lista**,
decidido por el usuario el 13-sep-2026: todos los niveles de un mundo SHALL poder
abrirse desde ella, y NO SHALL mostrarse ninguno en estado bloqueado. Cómo se
ordena el avance después de esa prueba es una decisión pendiente, y este
requisito se reescribe cuando se tome.

Qué niveles están completados SHALL salir del **progreso real** del niño, y NO
SHALL salir de datos de ejemplo. El **primer nivel sin completar** del mundo
SHALL marcarse como el nivel en el que va el niño; si están todos completados,
ninguno SHALL llevar esa marca.

Un nivel cuya fila no se pueda jugar SHALL poder abrirse igualmente desde la
lista, y lo que el niño encuentre SHALL ser el aviso de que ese nivel todavía no
se puede jugar, no un tablero a medias.

#### Scenario: Un niño sin progreso entra en un mundo

- **WHEN** el niño no ha completado ningún nivel de ese mundo
- **THEN** todos los niveles aparecen disponibles y se pueden abrir desde la lista
- **AND** el primer nivel lleva la marca del nivel en el que va

#### Scenario: Un nivel aún no está disponible

- **WHEN** el niño pulsa en la lista un nivel cuyo anterior no ha completado, que con el candado habría salido bloqueado
- **THEN** ese nivel se muestra igual de disponible que los demás, sin candado
- **AND** se abre la pantalla de ese nivel

#### Scenario: El niño abre un nivel que todavía no se puede jugar

- **WHEN** pulsa en la lista un nivel cuya fila sigue sembrada en un formato que el juego no puede leer
- **THEN** se abre la pantalla de nivel con el aviso de que ese nivel todavía no se puede jugar
- **AND** no se dibuja ningún tablero

#### Scenario: El niño ha completado parte del mundo

- **WHEN** hay niveles completados en el progreso del niño
- **THEN** esos niveles se muestran como completados
- **AND** la marca del nivel en el que va la lleva el primero sin completar

### Requirement: Sala de trofeos

El sistema SHALL mostrar al niño los logros que ha conseguido, con la fecha en
que los obtuvo y la experiencia que le dieron.

El sistema NO SHALL presentar logros pendientes ni avance hacia ellos mientras
no exista un catálogo de logros en el esquema: la tabla `achievements` es el
registro de lo concedido a cada niño, no la lista de lo que se puede conseguir.
Diseñar ese catálogo y la lógica que concede los logros es trabajo aparte.

#### Scenario: El niño abre la sala de trofeos

- **WHEN** se cargan los logros
- **THEN** se listan los que ha conseguido, cada uno con su fecha y su experiencia

#### Scenario: El niño todavía no ha conseguido ninguno

- **WHEN** el niño no tiene logros concedidos
- **THEN** se muestra un mensaje que lo invita a seguir jugando, y no una lista vacía

### Requirement: El XP conseguido se ve en el panel del niño

El XP del niño SHALL verse en su panel, y no sólo en la pantalla de cuenta: en la
**barra lateral**, debajo del indicador de racha, y en la **barra superior**, a la
izquierda del indicador de racha.

El valor mostrado SHALL ser el que devuelve el servidor, incluido el cero de una
cuenta sin actividad. NO SHALL inventarse ninguna cifra mientras nada escriba
progreso.

El **máximo** de la barra SHALL ser una cantidad provisional declarada en un solo
sitio de la aplicación, porque el esquema todavía no tiene niveles ni umbrales de
XP; fijarlos de verdad corresponde al paso que diseñe rachas y logros.

#### Scenario: El niño abre su panel

- **WHEN** el niño entra al panel
- **THEN** la barra lateral muestra una barra de XP debajo del indicador de racha
- **AND** la barra superior muestra una barra de XP a la izquierda del indicador de racha

#### Scenario: Cuenta sin actividad

- **WHEN** el perfil del niño tiene cero XP
- **THEN** las dos barras se muestran vacías con el valor cero
- **AND** no se enseña ninguna cifra de ejemplo

#### Scenario: El máximo se declara una sola vez

- **WHEN** cambie la cantidad provisional que sirve de máximo
- **THEN** basta con tocar un único sitio para que las dos barras la reflejen

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
