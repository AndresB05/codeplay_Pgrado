## MODIFIED Requirements

### Requirement: El XP conseguido se ve en el panel del niño

El XP del niño SHALL verse en su panel, y no sólo en la pantalla de cuenta: en la
**barra lateral**, debajo del indicador de racha, y en la **barra superior**, a la
izquierda del indicador de racha.

El valor mostrado SHALL ser el que devuelve el servidor, incluido el cero de una
cuenta sin actividad. NO SHALL inventarse ninguna cifra mientras nada escriba
progreso.

**La barra SHALL marcar tramos de una cantidad fija de XP**, no un máximo total:
se llena, se vacía y vuelve a empezar tantas veces como haga falta. El tramo vale
**lo que da un mundo entero jugado a la perfección**, que es la regla que se le
puede explicar a un niño: *terminas un mundo bien, subes de nivel.*

**La barra NO SHALL tener techo.** El XP total no está acotado —los logros y las
misiones repartirán más cuando existan—, así que el tramo SHALL calcularse a
partir del XP y NO SHALL enumerarse una lista de umbrales ni fijarse un máximo
inventado.

**El niño SHALL ver en qué tramo está**, con un número que empieza en **uno** con
cero XP y sube cada vez que la barra se llena. Ese número SHALL nombrarse de
manera que **no se confunda con los niveles del juego**, que también se numeran.

Junto a la barra SHALL verse **cuánto lleva dentro del tramo y cuánto cuesta el
tramo**, para que la barra diga algo por sí sola.

**El XP que se enseña SHALL estar al día sin recargar la página.** Cuando el niño
gane XP jugando, el panel SHALL reflejarlo en cuanto el servidor lo conceda: una
cifra que sólo cambia al volver a entrar es una cifra equivocada, y la subida de
tramo dejaría de verse justo cuando ocurre.

#### Scenario: El niño abre su panel

- **WHEN** el niño entra al panel
- **THEN** la barra lateral muestra una barra de XP debajo del indicador de racha
- **AND** la barra superior muestra una barra de XP a la izquierda del indicador de racha
- **AND** las dos dicen en qué tramo está

#### Scenario: Cuenta sin actividad

- **WHEN** el perfil del niño tiene cero XP
- **THEN** las dos barras se muestran vacías con el valor cero
- **AND** el tramo que enseñan es el primero
- **AND** no se enseña ninguna cifra de ejemplo

#### Scenario: El máximo se declara una sola vez

- **WHEN** cambie la cantidad de XP que vale un tramo
- **THEN** basta con tocar un único sitio para que las barras y el número de tramo la reflejen

#### Scenario: La barra se llena y vuelve a empezar

- **WHEN** el niño pasa de tener justo el XP de un tramo completo a tener uno más
- **THEN** el número de tramo sube en uno
- **AND** la barra vuelve a empezar casi vacía

#### Scenario: El niño gana XP jugando

- **WHEN** el niño termina una partida que le concede XP y vuelve al panel sin recargar la página
- **THEN** la barra y el número de tramo muestran ya el XP nuevo

#### Scenario: Una partida que no concede XP

- **WHEN** el niño termina una partida que no mejora su marca y vuelve al panel
- **THEN** la barra y el número de tramo se quedan como estaban
