## ADDED Requirements

### Requirement: El contenido de un nivel jugable se siembra en el formato del contrato

Un nivel que se pueda jugar SHALL tener sembrada, en su propia fila, **la
definición de su puzle**, **la disposición inicial de bloques** con la que empieza
el niño y **la versión del formato** con la que están escritas las dos. Las tres
SHALL ser instancias válidas de lo que fija `docs/CONTRATO-DE-INTEGRACION.md` §4.

La definición del puzle SHALL describir el tablero entero —qué casillas lo forman
y de qué clase es cada una—, en qué casilla empieza el personaje y hacia dónde
mira, cuál es la casilla de meta y cuántos pasos cuesta la mejor solución. El
tablero SHALL ser **rectangular**: una casilla que no existe se escribe como
hueco y **nunca** acortando una fila.

Los pasos de la mejor solución SHALL ser los de una solución **resuelta a mano
antes de sembrar**. Nada en la base ni en la aplicación los comprueba, y de ese
número sale la puntuación.

En esa definición SHALL ir **la definición del puzle y nunca su solución**, ni la
condición de ningún logro que deba ser una sorpresa: la columna se lee **sin
sesión**.

Los valores de partida de esas tres columnas —la cadena vacía, el objeto vacío y
el lenguaje heredado del concepto anterior— NO SHALL considerarse una siembra
válida.

#### Scenario: Se siembra un nivel jugable

- **WHEN** una migración siembra el contenido de un nivel que se puede jugar
- **THEN** su fila lleva la definición del puzle, la disposición inicial de bloques y la versión del formato
- **AND** las tres son instancias válidas del formato del contrato

#### Scenario: Un nivel todavía no rediseñado

- **WHEN** la fila de un nivel conserva el contenido del concepto anterior
- **THEN** ese nivel no cuenta como jugable, y quien lo abra no lo juega a medias

#### Scenario: El puzle se resuelve antes de sembrarlo

- **WHEN** se escribe el número de pasos de la mejor solución de un nivel
- **THEN** ese número es el de una solución que alguien resolvió a mano sobre ese tablero

### Requirement: Todos los niveles conceden la misma experiencia

Todos los niveles SHALL conceder **la misma cantidad de experiencia** al
completarse, en lugar de una escala creciente por dificultad.

Lo que distingue a un nivel difícil de uno fácil SHALL ser la puntuación que se
saca en él —que sale de los pasos— y no una recompensa mayor por terminarlo.

#### Scenario: Se compara la recompensa de dos niveles

- **WHEN** se leen la experiencia de un nivel del primer mundo y la de uno del último
- **THEN** las dos son la misma cantidad
