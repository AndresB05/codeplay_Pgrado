## ADDED Requirements

### Requirement: Los mundos se abren en orden

Los mundos SHALL abrirse **en orden**, como los niveles dentro de cada mundo.
Decidido por el usuario el 14-oct-2026, después de la prueba preliminar: un niño
que entra en el tercer mundo sin la base de los anteriores se frustra.

**El primer mundo SHALL estar siempre abierto.** Cada uno de los demás SHALL
abrirse al **superar todos los niveles del mundo anterior**. Los mundos **sin
niveles** NO SHALL contar: ni se cierran ni cierran al siguiente, que se compara
con el anterior que sí tenga niveles.

**Un mundo en el que el niño ya superó algún nivel SHALL seguir abierto para
él**, aunque no haya terminado el anterior. Es para quienes jugaron mundos
avanzados en la prueba preliminar, cuando no había candado: no se les quita lo
que ya tenían.

El mundo cerrado SHALL **decir qué mundo hay que superar antes**, con su nombre.

El candado SHALL comprobarse en **la lista de mundos**, en **la pantalla de
niveles de un mundo** y en **la pantalla de nivel**, porque a las dos últimas se
llega también escribiendo la dirección. Si el progreso, los mundos o sus niveles
no se pueden leer, el mundo SHALL dejarse abrir: un corte de red no debe cerrarle
a un niño un mundo que quizá ya se ganó. Es el mismo criterio que el candado de
niveles.

#### Scenario: Un niño sin progreso ve los mundos

- **WHEN** el niño no ha superado ningún nivel
- **THEN** el primer mundo está abierto y los demás salen cerrados, cada uno diciendo qué mundo hay que superar antes
- **AND** pulsar un mundo cerrado no lleva a ningún sitio

#### Scenario: Se supera un mundo entero

- **WHEN** el niño supera todos los niveles del primer mundo
- **THEN** el segundo mundo se abre

#### Scenario: Falta un nivel del mundo anterior

- **WHEN** el niño ha superado todos los niveles del primer mundo menos uno
- **THEN** el segundo mundo sigue cerrado

#### Scenario: Un mundo sin niveles en medio

- **WHEN** el segundo mundo no tiene niveles y el niño ha superado todo el primero
- **THEN** el tercero está abierto, y el segundo no sale cerrado

#### Scenario: El niño ya jugó un mundo avanzado antes del candado

- **WHEN** el niño superó un nivel del tercer mundo sin haber terminado el segundo
- **THEN** el tercer mundo sigue abierto para él

#### Scenario: Se escribe la dirección de un mundo cerrado

- **WHEN** el niño abre escribiendo la dirección la lista de niveles de un mundo cerrado, o uno de sus niveles
- **THEN** no se enseñan los niveles ni se dibuja el tablero, y se dice qué mundo hay que superar antes

#### Scenario: No se puede leer el progreso

- **WHEN** falla la lectura del progreso, de los mundos o de sus niveles
- **THEN** ningún mundo sale cerrado
